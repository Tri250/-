package com.battery.master.service

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.data.CapacitySource
import com.battery.master.data.FullChargeSource
import com.battery.master.data.FullChargeVerdict

/**
 * Android 原生底层硬件与电量计 HAL 读取器
 * 负责通过 Android BatteryManager、Intent 以及 Linux sysfs 读取真实的 12 项充放电指标
 *
 * 启动闪退治理：本类是启动路径 (ViewModel 构造 -> 首次遥测 -> 粘性广播回调) 的核心，
 * 任何 OEM ROM 的硬件服务异常 (BatteryManager 缺失、PowerProfile 反射抛 Error、
 * sysfs 不可读、SharedPreferences 损坏、registerReceiver 被 ROM 拒绝) 都可能引发崩溃。
 * 因此所有外部依赖访问均以 Throwable 级兜底 + 最后已知状态降级，保证进程永不因此退出。
 */
class BatteryHardwareReader(private val context: Context) {

    /**
     * BatteryManager 安全获取：部分定制 ROM/模拟器可能缺失 BATTERY_SERVICE，
     * 非空强转 (as) 会直接 NPE 导致启动闪退，故使用安全转换 + 可空引用
     */
    private val batteryManager: BatteryManager? =
        try {
            context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        } catch (e: Throwable) {
            null
        }

    // 满电容量持久化：指标 12 锁定值跨进程重启保留
    private val prefs = try {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    } catch (e: Throwable) {
        null
    }

    // 指标 04 设计容量来源等级 (v1.2.3 健康度真实性审计)：
    // 必须在 designCapacityMah 之前声明——getDesignCapacity 在其初始化期写入命中等级，
    // 声明顺序错误会导致来源被随后的默认值覆盖
    var designCapacitySource: CapacitySource = CapacitySource.FALLBACK

    // 默认或从数据库读取的出厂设计容量 (mAh)：构造时从系统解析一次，之后可被用户覆盖
    // (Receiver 事件通道共享此值，保证轮询/广播双通道数据一致，用户设置不被广播覆盖)
    // v1.2.3 P1 审计修复：用户校准值持久化到 SharedPreferences——
    // 旧实现为纯内存 var，总览页"校准设计容量"重启即丢，与按钮/对话框文案暗示的
    // "持久校准"语义不符。校准链优先级：用户校准(持久) > PowerProfile > sysfs > 兜底
    var designCapacityMah: Int = runCatching { getDesignCapacity(context) }
        .getOrDefault(FALLBACK_DESIGN_CAPACITY)
        set(value) {
            field = value
            // 校准值持久化：经 VM 区间校验 (500~25000) 后写入，重启恢复。
            // suppressCapacityPersist = true 时 (clearDesignCapacityCalibration
            // 重新解析系统链) 禁止写回，否则会复活刚删除的用户校准 key
            if (!suppressCapacityPersist) {
                runCatching {
                    prefs?.edit()?.putInt(KEY_USER_DESIGN_CAPACITY, value)?.apply()
                }
            }
        }

    // 重新解析系统回退链时抑制校准值持久化 (仅 clearDesignCapacityCalibration 路径)
    private var suppressCapacityPersist = false

    // 记录上一轮充满锁定的容量 (从持久化恢复)
    private var lastRecordedFullCapacity: Int? =
        runCatching { prefs?.getInt(KEY_LAST_FULL_CAPACITY, -1)?.takeIf { it > 0 } }.getOrNull()

    // 上一次满足充满判定条件的时间戳 (广播通道共享读取，与锁定容量同源)
    var lastFullChargeTimestamp: Long? =
        runCatching { prefs?.getLong(KEY_LAST_FULL_TIMESTAMP, -1L)?.takeIf { it > 0 } }.getOrNull()

    // v1.2.3 P0 审计修复："一键模拟完全充满"演示值与真实锁定分离存储。
    // 旧实现把演示值 persistFullChargeCapacity 写进真实锁定 key，导致用户点一次
    // 演示按钮，指标 12 永久显示假容量且跨重启存在，与实验室"充满校准"场景
    // (不写盘) 语义两套。现演示值写独立 key，仅在无真实锁定时兜底展示并标 SIMULATED
    private var simulatedFullCapacity: Int? =
        runCatching { prefs?.getInt(KEY_SIMULATED_FULL_CAPACITY, -1)?.takeIf { it > 0 } }.getOrNull()

    private var simulatedFullTimestamp: Long? =
        runCatching { prefs?.getLong(KEY_SIMULATED_FULL_TIMESTAMP, -1L)?.takeIf { it > 0 } }.getOrNull()

    // 是否处于充满判定区间内 (100% 且 0-25mA)：用于写盘去重，
    // 避免满足条件期间每秒遥测轮询重复写 SharedPreferences
    private var wasInFullChargeBand = false

    // 最后一次成功读取的完整遥测：读取异常时降级返回，UI 不白屏不崩溃
    private var lastKnownState: BatteryState? = null

    /**
     * 读取最新的电池遥测数据 (全链路 Throwable 兜底，异常时降级到最后已知态)
     */
    fun readBatteryTelemetry(): BatteryState = try {
        readBatteryTelemetryInternal().also { lastKnownState = it }
    } catch (e: Throwable) {
        // 采集链路任何环节异常 (ROM 服务缺失/sysfs 拒绝等)：
        // 返回最后已知态或安全默认值，保证 UI 与轮询协程不崩溃
        lastKnownState ?: buildSafeDefaultState()
    }

    private fun readBatteryTelemetryInternal(): BatteryState {
        // 粘性广播查询：部分 ROM 会对此抛异常，必须兜底
        val batteryIntent: Intent? = try {
            context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        } catch (e: Throwable) {
            null
        }

        // 12 项指标统一经共享解析器提取 (与广播通道 BatteryReceiver 单一实现，语义零漂移)
        val raw = BatteryTelemetryParser.parse(
            batteryIntent,
            batteryManager,
            designCapacityMah,
            designCapacitySource
        )

        // v2.0.0-alpha 批次B：轮询通道喂样健康引擎 (ΔV/ΔI 内阻滑窗 + 温度 EWMA)，
        // 与广播通道共享同一进程级样本窗口
        BatteryHealthEngine.observe(raw)

        // 12. 完全充满时的容量：满足判定则锁定+持久化，未满足保留上次锁定值不抹除
        // 注意：必须先执行锁定 (内部可能刷新时间戳) 再读取 lastFullChargeTimestamp
        // v1.2.6 P2 审计修复：充电态判定单源——直接消费解析器输出的 raw.isCharging
        // (含 EXTRA_PLUGGED 通道判定)，与广播通道完全一致，消除本地重复推导漂移
        lockFullChargeIfCriteriaMet(raw.currentCapacityMah, raw.percentage, raw.currentMa, raw.isCharging)
        // v1.2.3 P0 审计修复：真实锁定 (REAL) 与模拟演示值 (SIMULATED) 分离，
        // 真实优先，无真实锁定时才回显演示值并标注来源
        val display = resolveFullChargeDisplay()

        return raw.toBatteryState(display.capacityMah, display.timestampMs, display.source)
    }

    /**
     * v1.2.3 P0 审计修复：指标 12 展示值解析——真实锁定优先，模拟演示值兜底
     *
     * 真实锁定 (lockFullChargeIfCriteriaMet 判定) 与"一键模拟完全充满"演示值
     * 分 key 存储，杜绝演示值冒充实测锁定跨重启存在；UI 依来源显式标注。
     */
    data class FullChargeDisplay(
        val capacityMah: Int?,
        val timestampMs: Long?,
        val source: FullChargeSource
    )

    fun resolveFullChargeDisplay(): FullChargeDisplay = when {
        lastRecordedFullCapacity != null ->
            FullChargeDisplay(lastRecordedFullCapacity, lastFullChargeTimestamp, FullChargeSource.REAL)
        simulatedFullCapacity != null ->
            FullChargeDisplay(simulatedFullCapacity, simulatedFullTimestamp, FullChargeSource.SIMULATED)
        else -> FullChargeDisplay(null, null, FullChargeSource.NONE)
    }

    /** 安全默认态：任何采集都不可用时 UI 仍有可渲染的中性数据 (保留已锁定的指标 12 不丢失) */
    private fun buildSafeDefaultState(): BatteryState {
        // v2.0.0-alpha.1 用户口径修正：采集全失败的降级态不再按 0.92 出厂保持率
        // 虚构"当前容量/健康度"——容量不可测 (0)、来源 UNAVAILABLE、健康度 0，
        // UI 显示"无法测算"。是多少就是多少，测不到就不展示。
        // v1.2.3 P0 审计修复：采集全失败时电流不可读 → 判定 CURRENT_UNAVAILABLE，
        // 不得谎报"已达充满判定"
        val display = resolveFullChargeDisplay()
        return BatteryState(
            designCapacityMah = designCapacityMah,
            designCapacitySource = designCapacitySource,
            currentCapacityMah = 0,
            hasMeasuredCapacity = false,
            // 降级态容量不可测算，来源标注 UNAVAILABLE，杜绝 UI 把估算值当实测展示
            currentCapacitySource = CapacitySource.UNAVAILABLE,
            healthPercentage = 0f,
            // v1.2.3 审计加固：采集全失败的降级态必须诚实——未知状态不得谎报"良好"，
            // 未充电不得谎报"充电中"，避免用户在无数据环境下被错误指标误导
            status = BatteryStatus.NOT_CHARGING,
            healthQuality = BatteryHealthQuality.UNKNOWN,
            remainingCapacityMah = 0,
            voltageMv = 4000,
            temperatureCelsius = 25.0f,
            percentage = 0,
            socModel = "平台 SoC 解析中",
            pmicModel = "平台级 PMIC 电源管理 [工程估算]",
            currentMa = null,
            isFullChargeConditionMet = false,
            fullChargeVerdict = FullChargeVerdict.CURRENT_UNAVAILABLE,
            fullChargeCapacityMah = display.capacityMah,
            lastFullChargeTimestamp = display.timestampMs,
            fullChargeSource = display.source
        )
    }

    /**
     * 持久化指标 12 的**真实**充满锁定容量与时间戳
     * 防御：容量/时间戳非法时拒绝写入，保留上一次有效锁定值，避免脏数据覆盖真实记录
     */
    fun persistFullChargeCapacity(capacityMah: Int, timestampMs: Long) {
        if (capacityMah <= 0 || timestampMs <= 0) return
        lastRecordedFullCapacity = capacityMah
        lastFullChargeTimestamp = timestampMs
        try {
            prefs?.edit()
                ?.putInt(KEY_LAST_FULL_CAPACITY, capacityMah)
                ?.putLong(KEY_LAST_FULL_TIMESTAMP, timestampMs)
                ?.apply()
        } catch (e: Throwable) {
            // 存储异常不阻塞内存锁定值的生效
        }
    }

    /**
     * v1.2.3 P0 审计修复：持久化"一键模拟完全充满"**演示值** (独立 key)
     *
     * 旧实现直接写真实锁定 key，用户点一次演示按钮指标 12 就永久显示假容量。
     * 现演示值仅在无真实锁定时兜底展示，UI 标注"来源：模拟"，并可被
     * [clearFullChargeRecords] 一键清除。
     */
    fun persistSimulatedFullChargeCapacity(capacityMah: Int, timestampMs: Long) {
        if (capacityMah <= 0 || timestampMs <= 0) return
        simulatedFullCapacity = capacityMah
        simulatedFullTimestamp = timestampMs
        try {
            prefs?.edit()
                ?.putInt(KEY_SIMULATED_FULL_CAPACITY, capacityMah)
                ?.putLong(KEY_SIMULATED_FULL_TIMESTAMP, timestampMs)
                ?.apply()
        } catch (e: Throwable) {
            // 存储异常不阻塞内存演示值的生效
        }
    }

    /**
     * v1.2.3 P0 审计修复：清除指标 12 全部锁定记录 (真实 + 模拟演示值)
     * 入口：充满判定卡"清除锁定记录"按钮，用户可随时消除演示/历史锁定值
     */
    fun clearFullChargeRecords() {
        lastRecordedFullCapacity = null
        lastFullChargeTimestamp = null
        simulatedFullCapacity = null
        simulatedFullTimestamp = null
        wasInFullChargeBand = false
        // v1.2.6 P2 审计修复：同步清空最后已知态快照——旧实现 lastKnownState 仍持有
        // 含旧锁定值的 BatteryState，清除记录后一旦采集异常降级返回该快照，
        // 指标 12 "已清除"的锁定容量/时间戳会复活回显
        lastKnownState = null
        try {
            prefs?.edit()
                ?.remove(KEY_LAST_FULL_CAPACITY)
                ?.remove(KEY_LAST_FULL_TIMESTAMP)
                ?.remove(KEY_SIMULATED_FULL_CAPACITY)
                ?.remove(KEY_SIMULATED_FULL_TIMESTAMP)
                ?.apply()
        } catch (e: Throwable) {
            // 存储异常不阻塞内存记录的清除
        }
    }

    /**
     * 指标 12 共享判定 (v1.2.3 P0 审计修复为三态 + 符号无关)：
     * 仅当 percentage == 100 且**充电态**下 |currentNow| ≤ 25 mA 浮充截止区间时，
     * 锁定并持久化完全充满容量 (同步刷新内存锁定时间戳)；
     * 未满足条件时保留上次锁定值，不因通道切换而丢失。
     * 轮询通道 (readBatteryTelemetry) 与广播通道 (BatteryReceiver) 共用，
     * 保证两通道指标 12 语义完全一致。
     *
     * v1.2.3 修复要点：
     * 1. currentNowMa 可空——设备不支持 CURRENT_NOW 时判定 CURRENT_UNAVAILABLE，
     *    旧实现归一化为 0 mA 使判定恒真、估算值被冒充实测锁定写盘；
     * 2. 符号无关 (|I|)——高通/三星部分内核充电上报负值，旧实现 [0,25] 永不成立；
     * 3. 附加充电态校验——防 100% 拔线放电时误判；
     * 4. 真实锁定后清除模拟演示值，杜绝演示记录长期干扰展示。
     *
     * 写盘去重：仅在进入判定区间的第一拍、或锁定容量发生变化时才持久化；
     * 容量守卫：currentCapacityMah 非法 (≤0) 时拒绝锁定，防止 sysfs 脏数据
     * 把 "0 mAh" 写入指标 12 与持久化存储。
     */
    fun lockFullChargeIfCriteriaMet(
        currentCapacityMah: Int,
        percentage: Int,
        currentNowMa: Int?,
        isCharging: Boolean = true
    ): Int? {
        val verdict = BatteryTelemetryParser.evaluateFullCharge(percentage, currentNowMa, isCharging)
        if (verdict == FullChargeVerdict.FULLY_CHARGED && currentCapacityMah > 0) {
            if (!wasInFullChargeBand || lastRecordedFullCapacity != currentCapacityMah) {
                persistFullChargeCapacity(currentCapacityMah, System.currentTimeMillis())
            }
            wasInFullChargeBand = true
            // 真实锁定生效后清除模拟演示值，避免演示记录长期干扰
            if (simulatedFullCapacity != null) {
                simulatedFullCapacity = null
                simulatedFullTimestamp = null
                runCatching {
                    prefs?.edit()
                        ?.remove(KEY_SIMULATED_FULL_CAPACITY)
                        ?.remove(KEY_SIMULATED_FULL_TIMESTAMP)
                        ?.apply()
                }
            }
            return currentCapacityMah
        }
        wasInFullChargeBand = false
        return lastRecordedFullCapacity
    }

    /**
     * 指标 04 设计容量回退链 (v1.2.3 P1 审计修复扩展为用户校准优先)：
     * 用户校准值 (SharedPreferences 持久化) -> PowerProfile 反射
     * -> sysfs charge_full_design -> 主流 5000mAh 兜底
     *
     * v1.2.3 审计加固：各级输出统一施加 MIN/MAX_PLAUSIBLE_CAPACITY_MAH (500~25000 mAh)
     * 合理区间校验 (与 BatteryTelemetryParser 单源一致)，任一级越界即降级下一级——
     * 杜绝单位异常/脏数据设计容量污染指标 01 (健康度分母)、02 (剩余电量基准)、
     * 03 (当前容量估算基准)。旧实现 PowerProfile 仅判 >0、sysfs 无任何区间校验，
     * mAh 上报内核会把 5000 mAh 误算成 5 mAh 并级联污染全部容量体系。
     *
     * v1.2.3 P1 修复：旧实现无用户校准恢复级——总览页"校准设计容量"写入的
     * 纯内存 var 重启即丢，与"持久校准"文案语义不符。现启动时优先读取
     * SharedPreferences 中经区间校验的校准值。
     *
     * 注意：PowerProfile 构造在部分 OEM ROM 上会抛出 ExceptionInInitializerError /
     * NoClassDefFoundError 等 Error (非 Exception)，必须按 Throwable 捕获，
     * 否则会直接引发启动闪退。
     */
    private fun getDesignCapacity(context: Context): Int {
        // 用户校准值 (持久化)：显式用户意图优先于系统推断
        val userCalibrated = runCatching {
            prefs?.getInt(KEY_USER_DESIGN_CAPACITY, -1)?.takeIf { it > 0 }
        }.getOrNull()
        if (userCalibrated != null &&
            userCalibrated in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH
        ) {
            designCapacitySource = CapacitySource.CALIBRATED
            return userCalibrated
        }

        try {
            val powerProfileClass = Class.forName("com.android.internal.os.PowerProfile")
            val constructor = powerProfileClass.getConstructor(Context::class.java)
            val powerProfile = constructor.newInstance(context)
            val getBatteryCapacityMethod = powerProfileClass.getMethod("getBatteryCapacity")
            val capacity = getBatteryCapacityMethod.invoke(powerProfile) as? Double
            if (capacity != null) {
                // 四舍五入保留精度 (截断丢 1mAh)；NaN/越界一律降级下一级
                val capacityMah = Math.round(capacity).toInt()
                if (capacityMah in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH) {
                    designCapacitySource = CapacitySource.POWER_PROFILE
                    return capacityMah
                }
            }
        } catch (e: Throwable) {}

        // sysfs 规范单位 μAh：v2.0.0-alpha 批次A 改走多节点探测链 (含双单位归一化与区间校验)，
        // bms/maxfg/dc 平台的 charge_full_design 不在 battery 目录
        val sysfsDesign = BatterySysfs.readChargeFullDesign()
        if (sysfsDesign != null) {
            designCapacitySource = CapacitySource.SYSFS
            return sysfsDesign
        }

        designCapacitySource = CapacitySource.FALLBACK
        return FALLBACK_DESIGN_CAPACITY
    }

    /**
     * v1.2.3 P1 审计修复：清除用户校准值，恢复系统自动探测 (三级回退链)
     */
    fun clearDesignCapacityCalibration() {
        runCatching {
            prefs?.edit()?.remove(KEY_USER_DESIGN_CAPACITY)?.apply()
        }
        suppressCapacityPersist = true
        designCapacityMah = runCatching { getDesignCapacity(context) }
            .getOrDefault(FALLBACK_DESIGN_CAPACITY)
        suppressCapacityPersist = false
    }

    companion object {
        private const val PREFS_NAME = "battery_master_prefs"
        private const val KEY_LAST_FULL_CAPACITY = "last_full_capacity_mah"
        private const val KEY_LAST_FULL_TIMESTAMP = "last_full_timestamp_ms"
        private const val KEY_SIMULATED_FULL_CAPACITY = "simulated_full_capacity_mah"
        private const val KEY_SIMULATED_FULL_TIMESTAMP = "simulated_full_timestamp_ms"
        private const val KEY_USER_DESIGN_CAPACITY = "user_design_capacity_mah"

        /** 设计容量兜底值：与 BatteryState 默认口径一致 */
        const val FALLBACK_DESIGN_CAPACITY = 5000
    }
}
