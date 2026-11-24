package com.smalljelly.batterydata.data

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.isActive
import kotlin.math.abs

/**
 * 电池数据源：以 1 秒为间隔轮询系统 BatteryManager + sysfs，向上层输出 [BatterySample]。
 */
class BatteryRepository(private val context: Context) {

    private val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
    private val sysfs = SysfsBatteryReader()
    private val settings = BatterySettings(context)

    /** BatteryManager.BATTERY_PROPERTY_CHARGE_TIME_REMAINING 的常量值，反射取；新 SDK 才公开该符号 */
    private val chargeTimeRemainingProperty: Int? by lazy {
        runCatching {
            BatteryManager::class.java.getField("BATTERY_PROPERTY_CHARGE_TIME_REMAINING").getInt(null)
        }.getOrNull()
    }

    fun snapshot(): BatterySample = readSample(allowRemote = false)

    /**
     * 库仑计差分滑窗：(时间戳 ms, counter mAh)。系统电流读数被 ROM 关掉时，
     * 用电量计 10 秒滑窗的差分反推平均电流——物理上真实有效，不依赖厂商节点。
     */
    private val counterWindow = ArrayDeque<Pair<Long, Float>>()

    fun stream(intervalMs: Long = 1_000L): Flow<BatterySample> = flow {
        while (currentCoroutineContext().isActive) {
            emit(readSample(allowRemote = true))
            delay(intervalMs)
        }
    }.flowOn(Dispatchers.IO)

    @Suppress("DEPRECATION")
    private fun readSample(allowRemote: Boolean): BatterySample {
        val intent: Intent? = runCatching {
            context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        }.getOrNull()

        val level = intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = intent?.getIntExtra(BatteryManager.EXTRA_SCALE, 100) ?: 100
        val percent = when {
            level >= 0 && scale > 0 -> (level * 100f / scale).toInt()
            else -> batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        }.coerceIn(0, 100)

        // 未取整的电量（78.4 而不是 78）：反推满电容量时用它，
        // 否则整数电量每跨 1%，反推值跳 ±1.3%，健康度跟着抖
        val rawLevelPercent = if (level >= 0 && scale > 0) (level * 100f / scale).coerceIn(0f, 100f) else null

        val status = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_UNKNOWN)
            ?: BatteryManager.BATTERY_STATUS_UNKNOWN
        val plugged = intent?.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0) ?: 0
        val voltageMv = intent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0) ?: 0
        val temperature = intent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, Int.MIN_VALUE)
            ?.takeIf { it != Int.MIN_VALUE }
            // 0.1°C 原始值；超出电池物理可行范围（-20..80°C）的多为 ROM 哨兵/脏数据，拒收
            ?.takeIf { it in -200..800 }
            ?.let { it / 10f }
        val health = intent?.getIntExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_UNKNOWN)
            ?: BatteryManager.BATTERY_HEALTH_UNKNOWN
        val technology = intent?.getStringExtra(BatteryManager.EXTRA_TECHNOLOGY) ?: "—"

        val rawCurrent = batteryManager.getLongProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
            .takeIf { it != Long.MIN_VALUE && it != 0L && abs(it) < 30_000_000L }
            ?.let { it / 1000f }

        val counterUah = batteryManager.getLongProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)
            .takeIf { it != Long.MIN_VALUE && it > 0L }

        // 系统的充电剩余时间（秒）。只有充电中才有意义；不支持时返回 Long.MIN_VALUE，
        // 部分厂商会给出离谱值，超过 24 小时按不可信处理，交给线性外推兜底。
        // 常量用反射取：它是较新 SDK 才公开的符号，部分编译环境的 android.jar 里没有；
        // 反射失败（老系统/老编译环境）时直接走线性外推，行为与不支持该属性的机型一致
        val chargeTimeProp = chargeTimeRemainingProperty
        val chargeTimeRemainingSec = if (status == BatteryManager.BATTERY_STATUS_CHARGING && chargeTimeProp != null) {
            batteryManager.getLongProperty(chargeTimeProp)
                .takeIf { it != Long.MIN_VALUE && it in 1L..86_400L }
                ?.let { ((it + 59L) / 60L).toInt() }
        } else {
            null
        }

        val cycleFromIntent = intent?.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT, -1)?.takeIf { it >= 0 }
        val raw = sysfs.read()
        // BatteryManager 层拿不到电流/电压的机型（不少国产 ROM 把 CURRENT_NOW 关成 0，
        // 部分机型 ACTION_BATTERY_CHANGED 不带电压），先退 sysfs 节点即时读
        val instant = if (rawCurrent == null || voltageMv <= 0) sysfs.readInstant() else null to null
        val sysfsCurrentMa = instant.first?.let { normalizeCurrent(it, status) }
        val sysfsVoltageMv = instant.second?.toInt() ?: 0

        // 系统电流与 sysfs 节点全失效（SELinux 锁死节点）时，退到库仑计差分：
        // 10 秒滑窗内用电量计的变化反推平均电流，符号天然正确（电量降=放电=负）；
        // 窗口取 10 秒保证数字每秒都有可感知的跳变，不至于慢到像冻结
        val diffCurrentMa = if (rawCurrent == null && sysfsCurrentMa == null) {
            counterUah?.let { uah ->
                // snapshot() 与 stream() 可能并发调用，滑窗必须同步
                synchronized(counterWindow) {
                    val now = System.currentTimeMillis()
                    counterWindow.addLast(now to uah / 1000f)
                    while (counterWindow.isNotEmpty() && now - counterWindow.first().first > 10_000L) {
                        counterWindow.removeFirst()
                    }
                    val first = counterWindow.first()
                    val hours = (now - first.first) / 3_600_000f
                    if (hours > 0f && counterWindow.size >= 4) {
                        val deltaMah = (uah / 1000f) - first.second
                        val ma = deltaMah / hours
                        ma.takeIf { abs(it) < 10_000f }
                    } else {
                        null
                    }
                }
            }
        } else {
            synchronized(counterWindow) { counterWindow.clear() }
            null
        }

        // 电压/电流四级兜底：真实读数 > sysfs > 库仑计差分 > 状态典型值。
        // 兜底值全部带 estimated 标记，UI 显示时标注「估算」，保证任何机型都有显示
        val charging = status == BatteryManager.BATTERY_STATUS_CHARGING
        val full = status == BatteryManager.BATTERY_STATUS_FULL
        val discharging = status == BatteryManager.BATTERY_STATUS_DISCHARGING
        val (resolvedVoltageMv, voltageEstimated) = when {
            voltageMv > 0 -> voltageMv to false
            sysfsVoltageMv > 0 -> sysfsVoltageMv to false
            charging -> 4_450 to true       // 快充恒流段的典型电池电压
            full -> 4_200 to true           // 满电标称电压
            else -> 3_850 to true           // 放电中段典型电压
        }
        val (resolvedCurrentMa, currentEstimated) = when {
            rawCurrent != null -> rawCurrent to false
            sysfsCurrentMa != null -> sysfsCurrentMa to false
            diffCurrentMa != null -> diffCurrentMa to false
            charging -> 2_000f to true      // 典型充电电流（18W 档）
            full -> 0f to true              // 满电电流趋近 0
            else -> -400f to true           // 亮屏放电典型电流
        }

        // 优先级：手动设置 > sysfs 节点 > 机型库
        val manualDesign = settings.manualDesignCapacityMah()
        val resolvedDesign: Pair<Float, String>? = when {
            manualDesign != null -> manualDesign to "手动"
            raw.designCapacityMah != null -> raw.designCapacityMah to "系统节点"
            else -> DesignCapacityResolver.resolve(context, allowRemote)
        }

        return BatterySample(
            level = percent,
            status = status,
            plugged = plugged,
            voltageMv = resolvedVoltageMv,
            currentMa = resolvedCurrentMa,
            temperatureC = temperature,
            healthCode = health,
            technology = technology,
            chargeCounterMah = counterUah?.let { it / 1000f },
            cycleCount = cycleFromIntent ?: raw.cycleCount,
            fullChargeMah = raw.fullChargeMah,
            designCapacityMah = resolvedDesign?.first,
            designSource = resolvedDesign?.second,
            rawLevelPercent = rawLevelPercent,
            chargeTimeRemainingMin = chargeTimeRemainingSec,
            voltageEstimated = voltageEstimated,
            currentEstimated = currentEstimated,
            updatedAt = System.currentTimeMillis(),
        )
    }

    /**
     * 不同厂商对电流符号的定义相反，这里统一成“充电为正、放电为负”。
     */
    private fun normalizeCurrent(currentMa: Float, status: Int): Float = when (status) {
        BatteryManager.BATTERY_STATUS_CHARGING,
        BatteryManager.BATTERY_STATUS_FULL,
        -> abs(currentMa)

        BatteryManager.BATTERY_STATUS_DISCHARGING -> -abs(currentMa)

        else -> currentMa
    }
}
