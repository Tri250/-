package com.battery.master.service

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import com.battery.master.data.BatteryState

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

    // 默认或从数据库读取的出厂设计容量 (mAh)：构造时从系统解析一次，之后可被用户覆盖
    // (Receiver 事件通道共享此值，保证轮询/广播双通道数据一致，用户设置不被广播覆盖)
    var designCapacityMah: Int = runCatching { getDesignCapacity(context) }
        .getOrDefault(FALLBACK_DESIGN_CAPACITY)

    // 记录上一轮充满锁定的容量 (从持久化恢复)
    private var lastRecordedFullCapacity: Int? =
        runCatching { prefs?.getInt(KEY_LAST_FULL_CAPACITY, -1)?.takeIf { it > 0 } }.getOrNull()

    // 上一次满足充满判定条件的时间戳 (广播通道共享读取，与锁定容量同源)
    var lastFullChargeTimestamp: Long? =
        runCatching { prefs?.getLong(KEY_LAST_FULL_TIMESTAMP, -1L)?.takeIf { it > 0 } }.getOrNull()

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
        val raw = BatteryTelemetryParser.parse(batteryIntent, batteryManager, designCapacityMah)

        // 12. 完全充满时的容量：满足判定则锁定+持久化，未满足保留上次锁定值不抹除
        // 注意：必须先执行锁定 (内部可能刷新时间戳) 再读取 lastFullChargeTimestamp
        val fullChargeCapacityMah =
            lockFullChargeIfCriteriaMet(raw.currentCapacityMah, raw.percentage, raw.currentMa)

        return raw.toBatteryState(fullChargeCapacityMah, lastFullChargeTimestamp)
    }

    /** 安全默认态：任何采集都不可用时 UI 仍有可渲染的中性数据 (保留已锁定的指标 12 不丢失) */
    private fun buildSafeDefaultState(): BatteryState {
        // v1.2.3 审计修复：默认态内部自洽——设计容量回显 Reader 实际配置
        // (旧实现固定 5000，与用户校准值漂移)；健康度按同一口径
        // = 当前容量 / 设计容量 × 100 计算，消除"健康度 100% 但当前容量仅 92%"的自相矛盾展示
        val currentCapacity = (designCapacityMah * 0.92f).toInt()
        val healthPercent = if (designCapacityMah > 0) {
            (currentCapacity * 100f / designCapacityMah).coerceIn(0f, 100f)
        } else {
            100f
        }
        return BatteryState(
            designCapacityMah = designCapacityMah,
            currentCapacityMah = currentCapacity,
            healthPercentage = healthPercent,
            remainingCapacityMah = 0,
            voltageMv = 4000,
            temperatureCelsius = 25.0f,
            percentage = 0,
            socModel = "平台 SoC 解析中",
            pmicModel = "平台级 PMIC 电源管理 [工程估算]",
            fullChargeCapacityMah = lastRecordedFullCapacity,
            lastFullChargeTimestamp = lastFullChargeTimestamp
        )
    }

    /**
     * 持久化指标 12 的充满锁定容量与时间戳 (供 ViewModel 模拟充满时调用)
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
     * 特性 12 共享判定：仅当 percentage == 100 且 currentNow ∈ [0, 25] mA 时，
     * 锁定并持久化完全充满容量（同步刷新内存锁定时间戳）；
     * 未满足条件时保留上次锁定值，不因通道切换而丢失。
     * 轮询通道 (readBatteryTelemetry) 与广播通道 (BatteryReceiver) 共用，
     * 保证两通道指标 12 语义完全一致。
     *
     * 写盘去重：仅在进入判定区间的第一拍、或锁定容量发生变化时才持久化；
     * 满足条件期间每秒遥测不再重复写 SharedPreferences (首次锁定时间戳语义保留)。
     *
     * 容量守卫：currentCapacityMah 非法 (≤0) 时拒绝锁定，保留上次有效锁定值，
     * 防止 sysfs 脏数据把 "0 mAh" 写入指标 12 与持久化存储。
     */
    fun lockFullChargeIfCriteriaMet(currentCapacityMah: Int, percentage: Int, currentNowMa: Int): Int? {
        if (BatteryTelemetryParser.isFullChargeCriteriaMet(percentage, currentNowMa) && currentCapacityMah > 0) {
            if (!wasInFullChargeBand || lastRecordedFullCapacity != currentCapacityMah) {
                persistFullChargeCapacity(currentCapacityMah, System.currentTimeMillis())
            }
            wasInFullChargeBand = true
            return currentCapacityMah
        }
        wasInFullChargeBand = false
        return lastRecordedFullCapacity
    }

    /**
     * 指标 04 设计容量三级回退链：
     * PowerProfile 反射 -> sysfs charge_full_design -> 主流 5000mAh 兜底
     *
     * v1.2.3 审计加固：三级输出统一施加 MIN/MAX_PLAUSIBLE_CAPACITY_MAH (500~20000 mAh)
     * 合理区间校验 (与 BatteryTelemetryParser 单源一致)，任一级越界即降级下一级——
     * 杜绝单位异常/脏数据设计容量污染指标 01 (健康度分母)、02 (剩余电量基准)、
     * 03 (当前容量估算基准)。旧实现 PowerProfile 仅判 >0、sysfs 无任何区间校验，
     * mAh 上报内核会把 5000 mAh 误算成 5 mAh 并级联污染全部容量体系。
     *
     * 注意：PowerProfile 构造在部分 OEM ROM 上会抛出 ExceptionInInitializerError /
     * NoClassDefFoundError 等 Error (非 Exception)，必须按 Throwable 捕获，
     * 否则会直接引发启动闪退。
     */
    private fun getDesignCapacity(context: Context): Int {
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
                    return capacityMah
                }
            }
        } catch (e: Throwable) {}

        // sysfs 规范单位 μAh：readCapacityMah 内含双单位归一化与合理区间校验
        val sysfsDesign = BatterySysfs.readCapacityMah("/sys/class/power_supply/battery/charge_full_design")
        if (sysfsDesign != null) return sysfsDesign

        return FALLBACK_DESIGN_CAPACITY
    }

    companion object {
        private const val PREFS_NAME = "battery_master_prefs"
        private const val KEY_LAST_FULL_CAPACITY = "last_full_capacity_mah"
        private const val KEY_LAST_FULL_TIMESTAMP = "last_full_timestamp_ms"

        /** 设计容量兜底值：与 BatteryState 默认口径一致 */
        const val FALLBACK_DESIGN_CAPACITY = 5000
    }
}
