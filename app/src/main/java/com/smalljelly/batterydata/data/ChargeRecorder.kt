package com.smalljelly.batterydata.data

import android.content.Context
import android.content.Intent
import android.os.SystemClock
import androidx.core.content.ContextCompat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.abs

/** 单次记录器的三种状态。 */
sealed interface RecorderState {
    /** 没在记录 */
    data object Idle : RecorderState

    /** 用户已经点了“开始记录”，正在等充电器插上 */
    data class Waiting(val since: Long, val level: Int) : RecorderState

    /** 正在记录一次充电（从插上到拔电） */
    data class Recording(
        val startAt: Long,
        val fromLevel: Int,
        val level: Int,
        val avgPowerW: Float?,
        val lastAt: Long,
        /** 最近一次采样的瞬时值，用来在卡片上实时显示 */
        val lastPowerW: Float? = null,
        val lastCurrentMa: Float? = null,
        val lastVoltageV: Float? = null,
        /** 到目前为止充进去的电能（Wh） */
        val energyWh: Float? = null,
    ) : RecorderState {
        val minutes: Int get() = ((lastAt - startAt) / 60_000L).toInt().coerceAtLeast(0)
    }
}

/**
 * 单次充电记录的记录器。
 *
 * 流程：用户点“开始记录”→ [arm]。
 *  - 此刻正在充电：立刻开始记；
 *  - 没在充电：进入 [RecorderState.Waiting]，等下一次插上充电器再开始。
 * 开始之后一直采电流 / 电压 / 功率，直到拔电（或充满后仍插着）自动结算成一条记录。
 *
 * 采样由前台服务 [ChargeRecordService] 驱动，App 在前台时页面也会喂同一批采样，
 * 两边靠 [MIN_SAMPLE_GAP_MS] 去重，所以关掉界面、锁屏、切后台都不会中断记录。
 * 会话状态每隔一分钟落一次盘，进程被杀后重新打开 App 会接着记。
 */
object ChargeRecorder {

    /** 两次有效采样之间的最小间隔：App 前台采样与前台服务采样重叠时用它去重 */
    private const val MIN_SAMPLE_GAP_MS = 4_000L

    /** 每条曲线最多保留的点数，超过就隔点抽稀，避免落盘 JSON 无限膨胀 */
    private const val SERIES_LIMIT = 720

    /** 恢复会话时，超过这个时间没采到新数据就认为上次的记录已废弃 */
    private const val STALE_MS = 3 * 60 * 60 * 1000L

    /**
     * 一次充电没涨够测量门槛时，把「起点」保留下来，下次充电接着累计。
     * 超过这个时间就不再接：库仑计漂移会越来越大，接上去反而不准。
     */
    private const val CARRY_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000L

    /** 估算存储能量用的标称电压 */
    private const val NOMINAL_VOLTAGE = 3.85f

    private const val PREFS = "battery_charge_session"
    private const val KEY_SESSION = "session"
    private const val KEY_CARRY = "carry"

    private var appContext: Context? = null
    private var store: ChargeRecordStore? = null

    private val _state = MutableStateFlow<RecorderState>(RecorderState.Idle)
    val state: StateFlow<RecorderState> = _state.asStateFlow()

    /** 记录条数版本号：结算 / 删除后自增，列表据此刷新 */
    private val _recordsVersion = MutableStateFlow(0)
    val recordsVersion: StateFlow<Int> = _recordsVersion.asStateFlow()

    private var session: Session? = null
    private var lastAcceptedAt = 0L
    private var since = 0L
    private var waitedLevel = 0
    private var persistTicks = 0

    // ---------------------------------------------------------------- 对外操作

    /** App 启动时调一次：初始化 + 恢复上次没记完的会话 */
    @Synchronized
    fun ensure(context: Context) {
        init(context)
        if (_state.value is RecorderState.Idle) restore()
        if (_state.value !is RecorderState.Idle) startService(appContext ?: return)
    }

    /**
     * 前台服务自己启动时用：只初始化 + 恢复，不再去拉起服务，
     * 否则服务会在自己的 onCreate 里再次 startForegroundService 自己。
     */
    @Synchronized
    fun attach(context: Context) {
        init(context)
        if (_state.value is RecorderState.Idle) restore()
    }

    private fun init(context: Context) {
        val app = context.applicationContext
        if (appContext !== app) {
            appContext = app
            store = ChargeRecordStore(app)
        }
    }

    /** 开始记录：在充电就直接记，否则等插上充电器 */
    @Synchronized
    fun arm(context: Context) {
        ensure(context)
        if (_state.value !is RecorderState.Idle) return
        val sample = BatteryRepository(context.applicationContext).snapshot()
        if (sample.isCharging || sample.isFull) {
            beginRecording(sample)
        } else {
            since = System.currentTimeMillis()
            waitedLevel = sample.level
            _state.value = RecorderState.Waiting(since, sample.level)
            persist()
        }
        startService(context.applicationContext)
    }

    /** 放弃当前这次记录（等待中或记录中都直接丢掉） */
    @Synchronized
    fun cancel(context: Context) {
        ensure(context)
        session = null
        _state.value = RecorderState.Idle
        clearPersist()
        stopService()
    }

    /** 立刻结束并保存（通知栏的“结束并保存”） */
    @Synchronized
    fun stopAndSave(context: Context) {
        ensure(context)
        finish(lastSample = null, save = true)
    }

    /** 外部删除记录后调一下，让列表刷新 */
    fun notifyRecordsChanged() {
        _recordsVersion.value++
    }

    /** 通知权限刚被授予时调一下：让前台服务立刻补发一次常驻通知 */
    fun refreshNotification() {
        val ctx = appContext ?: return
        if (_state.value is RecorderState.Idle) return
        startService(ctx)
    }

    // ---------------------------------------------------------------- 采样驱动

    /** 每次采样喂进来（前台页面 1 秒 / 记录服务 10 秒，MIN_SAMPLE_GAP 去重），内部做状态机推进 */
    @Synchronized
    fun onSample(sample: BatterySample) {
        val now = System.currentTimeMillis()
        // 超级岛 / 流体云：与记录状态机无关，只要采样就驱动——充电中更新岛或胶囊，非充电收起。
        // 前台页面与前台服务都会喂采样，故 App 打开或记录中时岛持续刷新。
        appContext?.let { ctx ->
            com.smalljelly.batterydata.island.BatteryIslandHelper.onSample(
                ctx,
                sample,
                BatterySettings(ctx).islandEnabled(),
            )
        }
        when (val current = _state.value) {
            is RecorderState.Idle -> Unit

            is RecorderState.Waiting -> {
                waitedLevel = sample.level
                if (sample.isCharging) {
                    beginRecording(sample)
                } else {
                    _state.value = current.copy(level = sample.level)
                }
            }

            is RecorderState.Recording -> {
                // 前台页面与前台服务会同时喂采样，只认第一条
                if (now - lastAcceptedAt < MIN_SAMPLE_GAP_MS) return
                lastAcceptedAt = now
                val active = session ?: run {
                    _state.value = RecorderState.Idle
                    clearPersist()
                    return
                }
                when {
                    sample.isCharging -> {
                        active.idleTicks = 0
                        active.fullTicks = 0
                        accumulate(active, sample, now)
                        publish()
                    }

                    sample.isFull -> {
                        // 充满后还插着：再观察两次采样就收尾，免得一直挂着
                        active.idleTicks = 0
                        accumulate(active, sample, now)
                        active.fullTicks++
                        publish()
                        if (active.fullTicks >= 2) finish(sample, save = true)
                    }

                    else -> {
                        active.fullTicks = 0
                        active.idleTicks++
                        // 拔电判定：连续两次都没在充才收尾，避免状态抖动把记录截断
                        if (active.idleTicks >= 2) finish(sample, save = true)
                    }
                }
            }
        }
    }

    // ---------------------------------------------------------------- 内部实现

    private fun beginRecording(sample: BatterySample) {
        val now = System.currentTimeMillis()
        val active = Session(
            startAt = now,
            fromLevel = sample.level,
            level = sample.level,
            lastAt = now,
        )
        active.counterStart = sample.chargeCounterMah
        active.counterEnd = sample.chargeCounterMah
        active.designMah = sample.designCapacityMah
        // 测量起点可以比本次记录更早：上一次充电没涨够 15% 的话，这里接着累计
        val carry = loadCarry()?.takeIf { validCarry(it, sample) }
        active.measureFromLevel = carry?.level ?: sample.level
        active.measureCounterStart = carry?.counterMah ?: sample.chargeCounterMah
        active.measureStartedAt = carry?.startedAt ?: now
        session = active
        lastAcceptedAt = now
        persistTicks = 0
        _state.value = RecorderState.Recording(
            startAt = now,
            fromLevel = sample.level,
            level = sample.level,
            avgPowerW = null,
            lastAt = now,
        )
        persist()
    }

    private fun accumulate(active: Session, sample: BatterySample, now: Long) {
        active.level = sample.level
        sample.chargeCounterMah?.let { active.counterEnd = it }
        sample.designCapacityMah?.let { active.designMah = it }

        val power = sample.powerW?.let { abs(it) }?.takeIf { it > 0f }
        if (power != null) {
            active.power.push(power)
            sample.currentMa?.let { active.current.push(abs(it)) }
            if (sample.voltageMv > 0) active.voltage.push(sample.voltageMv / 1000f)

            // 间隔按实际时间算；休眠唤醒那种超长间隔不计入
            val hours = ((now - active.lastAt).coerceIn(0L, 120_000L)) / 3_600_000.0
            active.energyWh += power * hours
            active.powerSum += power
            active.powerCount++
        }
        active.lastPowerW = power
        active.lastCurrentMa = sample.currentMa?.let { abs(it) }
        active.lastVoltageV = sample.voltageMv.takeIf { it > 0 }?.let { it / 1000f }
        active.lastAt = now
    }

    private fun publish() {
        val active = session ?: return
        _state.value = RecorderState.Recording(
            startAt = active.startAt,
            fromLevel = active.fromLevel,
            level = active.level,
            avgPowerW = if (active.powerCount > 0) {
                (active.powerSum / active.powerCount).toFloat()
            } else {
                null
            },
            lastAt = active.lastAt,
            lastPowerW = active.lastPowerW,
            lastCurrentMa = active.lastCurrentMa,
            lastVoltageV = active.lastVoltageV,
            energyWh = active.energyWh.takeIf { it > 0.01 }?.toFloat(),
        )
        persistTicks++
        if (persistTicks % 6 == 0) persist()
    }

    private fun finish(lastSample: BatterySample?, save: Boolean) {
        val active = session
        val now = lastSample?.updatedAt?.takeIf { it > 0L } ?: System.currentTimeMillis()
        session = null
        _state.value = RecorderState.Idle
        clearPersist()
        stopService()
        if (active == null || !save) return

        val to = maxOf(active.level, lastSample?.level ?: 0)
        val minutes = ((now - active.startAt) / 60_000L).toInt()
        // 插上又立刻拔掉这种没有意义的片段直接丢掉
        if (minutes < 1 && to - active.fromLevel < 1) return

        val measured = measureFullCapacity(active, to)
        val design = active.designMah
        val health = measured?.let { full ->
            design?.takeIf { it > 100f }?.let { (full / it * 100f).takeIf { v -> v in 40f..105f } }
        }
        // 这次没测出来（涨幅不够门槛 / 库仑计没动）：把测量起点留到下次，接着累计
        if (measured == null) carryOver(active, to, now) else clearCarry()

        val record = ChargeRecord(
            id = active.startAt,
            dateMillis = active.startAt,
            fromLevel = active.fromLevel,
            toLevel = to,
            avgPowerW = if (active.powerCount > 0) {
                (active.powerSum / active.powerCount).toFloat()
            } else {
                null
            },
            lossPercent = estimateLoss(active, to, measured),
            durationMinutes = minutes,
            energyWh = active.energyWh.takeIf { it > 0.01 }?.toFloat(),
            measuredCapacityMah = measured,
            healthPercent = health,
            powerSeries = active.power.downsample(),
            currentSeries = active.current.downsample(),
            voltageSeries = active.voltage.downsample(),
        )
        store?.add(record)
        _recordsVersion.value++
    }

    /**
     * ΔQ ÷ ΔSoC：这段时间充进去的电量换算成满电容量（要求电量至少涨 15% 才够准）。
     *
     * 分母是整数百分比，涨得越少误差越大（涨 2% 时误差能到 ±25%），所以门槛不能降。
     * 涨不够的那部分不会白充：起点会被 [carryOver] 留下来，下一次充电接着累计。
     */
    private fun measureFullCapacity(active: Session, toLevel: Int): Float? {
        val start = active.measureCounterStart ?: return null
        val end = active.counterEnd ?: return null
        val deltaSoc = (toLevel - active.measureFromLevel) / 100f
        if (deltaSoc < 0.15f) return null
        val deltaQ = end - start
        if (deltaQ <= 0f) return null
        return (deltaQ / deltaSoc).takeIf { it in 800f..20_000f }
    }

    // ---------------------------------------------------------------- 累计测量

    /** 一次没测够的充电：记住起点，等下一段充电接着算 */
    private data class Carry(
        /** 起点电量（%） */
        val level: Int,
        /** 起点时的库仑计读数（mAh） */
        val counterMah: Float,
        /** 起点的墙钟时间 */
        val startedAt: Long,
        /** 写下这条 carry 的时间，用来判断是否过期 */
        val savedAt: Long,
        /** 写下时的开机时长，用来识别期间是否重启过（重启后库仑计会归零） */
        val elapsedAt: Long,
    )

    /**
     * 续上一次没测够的起点。要求：库仑计读数没有倒退（没重启）、没放太久、
     * 电量也确实比起点高。
     */
    private fun validCarry(carry: Carry, sample: BatterySample): Boolean {
        val counter = sample.chargeCounterMah ?: return false
        if (counter < carry.counterMah) return false
        if (sample.level <= carry.level) return false
        val now = System.currentTimeMillis()
        if (now - carry.savedAt > CARRY_MAX_AGE_MS) return false
        // 重启后 elapsedRealtime 会倒退，说明库仑计被清零过，接上去会算出假容量
        if (SystemClock.elapsedRealtime() < carry.elapsedAt) return false
        return true
    }

    private fun carryOver(active: Session, toLevel: Int, now: Long) {
        val ctx = appContext ?: return
        val counterStart = active.measureCounterStart ?: return
        // 连电量都没动，没有可累计的东西
        if (toLevel <= active.measureFromLevel) return
        val json = JSONObject().apply {
            put("level", active.measureFromLevel)
            put("counter", counterStart.toDouble())
            put("startedAt", active.measureStartedAt)
            put("savedAt", now)
            put("elapsedAt", SystemClock.elapsedRealtime())
        }
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_CARRY, json.toString())
            .apply()
    }

    private fun loadCarry(): Carry? {
        val ctx = appContext ?: return null
        val raw = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_CARRY, null)
            ?: return null
        val json = runCatching { JSONObject(raw) }.getOrNull() ?: return null
        return Carry(
            level = json.optInt("level"),
            counterMah = json.optDouble("counter").toFloat(),
            startedAt = json.optLong("startedAt"),
            savedAt = json.optLong("savedAt"),
            elapsedAt = json.optLong("elapsedAt"),
        )
    }

    private fun clearCarry() {
        val ctx = appContext ?: return
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY_CARRY).apply()
    }

    /**
     * 充电损耗：输入电能里没有进入电池的那部分。
     * 进入电池的能量按 电量增量 × 满电容量 × 标称电压 估算。
     */
    private fun estimateLoss(active: Session, toLevel: Int, measured: Float?): Float? {
        if (active.energyWh <= 0.0) return null
        val full = measured ?: active.designMah ?: return null
        val deltaSoc = (toLevel - active.fromLevel) / 100f
        if (deltaSoc <= 0f) return null
        val storedWh = deltaSoc * full / 1000f * NOMINAL_VOLTAGE
        if (storedWh <= 0f) return null
        val loss = (1.0 - storedWh / active.energyWh) * 100.0
        // 采样粒度决定了这只能是估算，超出合理范围宁可不显示
        return loss.toFloat().takeIf { it in 0.0..40.0 }
    }

    // ---------------------------------------------------------------- 落盘 / 恢复

    private fun persist() {
        val ctx = appContext ?: return
        val json = JSONObject()
        when (val current = _state.value) {
            is RecorderState.Idle -> {
                clearPersist()
                return
            }

            is RecorderState.Waiting -> {
                json.put("mode", "waiting")
                json.put("since", current.since)
                json.put("level", current.level)
            }

            is RecorderState.Recording -> {
                val active = session ?: return
                json.put("mode", "recording")
                json.put("startAt", active.startAt)
                json.put("fromLevel", active.fromLevel)
                json.put("level", active.level)
                json.put("lastAt", active.lastAt)
                json.put("energy", active.energyWh)
                json.put("powerSum", active.powerSum)
                json.put("powerCount", active.powerCount)
                active.counterStart?.let { json.put("counterStart", it.toDouble()) }
                active.counterEnd?.let { json.put("counterEnd", it.toDouble()) }
                active.designMah?.let { json.put("design", it.toDouble()) }
                json.put("measureFrom", active.measureFromLevel)
                active.measureCounterStart?.let { json.put("measureStart", it.toDouble()) }
                json.put("measureAt", active.measureStartedAt)
                json.put("power", active.power.toJsonArray())
                json.put("current", active.current.toJsonArray())
                json.put("voltage", active.voltage.toJsonArray())
            }
        }
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_SESSION, json.toString())
            .apply()
    }

    private fun restore() {
        val ctx = appContext ?: return
        val raw = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_SESSION, null)
            ?: return
        val json = runCatching { JSONObject(raw) }.getOrNull() ?: run {
            clearPersist()
            return
        }
        when (json.optString("mode")) {
            "waiting" -> {
                since = json.optLong("since")
                waitedLevel = json.optInt("level")
                _state.value = RecorderState.Waiting(since, waitedLevel)
            }

            "recording" -> {
                val lastAt = json.optLong("lastAt")
                // 太久没采到数据（服务被杀 / 手机重启）就当作废，不要攒出一条假记录
                if (System.currentTimeMillis() - lastAt > STALE_MS) {
                    clearPersist()
                    return
                }
                val active = Session(
                    startAt = json.optLong("startAt"),
                    fromLevel = json.optInt("fromLevel"),
                    level = json.optInt("level"),
                    lastAt = lastAt,
                )
                active.energyWh = json.optDouble("energy", 0.0)
                active.powerSum = json.optDouble("powerSum", 0.0)
                active.powerCount = json.optInt("powerCount", 0)
                active.counterStart =
                    if (json.has("counterStart")) json.optDouble("counterStart").toFloat() else null
                active.counterEnd =
                    if (json.has("counterEnd")) json.optDouble("counterEnd").toFloat() else null
                active.designMah =
                    if (json.has("design")) json.optDouble("design").toFloat() else null
                active.measureFromLevel = json.optInt("measureFrom", active.fromLevel)
                active.measureCounterStart = if (json.has("measureStart")) {
                    json.optDouble("measureStart").toFloat()
                } else {
                    active.counterStart
                }
                active.measureStartedAt = json.optLong("measureAt", active.startAt)
                active.power.addAll(json.optJSONArray("power").toFloatList())
                active.current.addAll(json.optJSONArray("current").toFloatList())
                active.voltage.addAll(json.optJSONArray("voltage").toFloatList())
                session = active
                lastAcceptedAt = lastAt
                _state.value = RecorderState.Recording(
                    startAt = active.startAt,
                    fromLevel = active.fromLevel,
                    level = active.level,
                    avgPowerW = if (active.powerCount > 0) {
                        (active.powerSum / active.powerCount).toFloat()
                    } else {
                        null
                    },
                    lastAt = active.lastAt,
                )
            }

            else -> clearPersist()
        }
    }

    private fun clearPersist() {
        val ctx = appContext ?: return
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY_SESSION).apply()
    }

    // ---------------------------------------------------------------- 服务

    private fun startService(context: Context) {
        runCatching {
            ContextCompat.startForegroundService(
                context,
                Intent(context, ChargeRecordService::class.java),
            )
        }
    }

    private fun stopService() {
        val ctx = appContext ?: return
        runCatching { ctx.stopService(Intent(ctx, ChargeRecordService::class.java)) }
    }

    // ---------------------------------------------------------------- 数据结构

    private class Session(
        val startAt: Long,
        var fromLevel: Int,
        var level: Int,
        var lastAt: Long,
    ) {
        var energyWh = 0.0
        var powerSum = 0.0
        var powerCount = 0
        var counterStart: Float? = null
        var counterEnd: Float? = null
        var designMah: Float? = null
        /** 健康度测量的起点，可能来自上一次没测够的充电（累计测量） */
        var measureFromLevel: Int = fromLevel
        var measureCounterStart: Float? = null
        var measureStartedAt: Long = startAt
        var lastPowerW: Float? = null
        var lastCurrentMa: Float? = null
        var lastVoltageV: Float? = null
        var idleTicks = 0
        var fullTicks = 0
        val power = mutableListOf<Float>()
        val current = mutableListOf<Float>()
        val voltage = mutableListOf<Float>()
    }
}

/** 曲线入库前抽稀：超过上限就隔点抽一半，保证细节还在、体积可控 */
private fun List<Float>.downsample(): List<Float> {
    if (size <= 120) return this
    val step = size.toFloat() / 120
    return List(120) { index -> this[(index * step).toInt().coerceAtMost(lastIndex)] }
}

/** 记录过程中的原始点也不能无限长：超上限就整体抽稀一半 */
private fun MutableList<Float>.push(value: Float) {
    add(value)
    if (size <= 720) return
    var i = 1
    while (i < size) {
        removeAt(i)
        i++
    }
}

private fun List<Float>.toJsonArray(): JSONArray {
    val array = JSONArray()
    forEach { array.put((it * 100).toInt() / 100.0) }
    return array
}

private fun JSONArray?.toFloatList(): List<Float> {
    if (this == null) return emptyList()
    return buildList {
        for (i in 0 until length()) add(optDouble(i).toFloat())
    }
}
