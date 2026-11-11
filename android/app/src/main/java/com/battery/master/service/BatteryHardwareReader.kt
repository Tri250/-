package com.battery.master.service

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import kotlin.math.abs

/**
 * Android 原生底层硬件与电量计 HAL 读取器
 * 负责通过 Android BatteryManager、Intent 以及 Linux sysfs 读取真实的 12 项充放电指标
 */
class BatteryHardwareReader(private val context: Context) {

    private val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager

    // 满电容量持久化：指标 12 锁定值跨进程重启保留
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    // 默认或从数据库读取的出厂设计容量 (mAh)：构造时从系统解析一次，之后可被用户覆盖
    // (Receiver 事件通道共享此值，保证轮询/广播双通道数据一致，用户设置不被广播覆盖)
    var designCapacityMah: Int = getDesignCapacity(context)

    // 记录上一轮充满锁定的容量 (从持久化恢复)
    private var lastRecordedFullCapacity: Int? =
        prefs.getInt(KEY_LAST_FULL_CAPACITY, -1).takeIf { it > 0 }

    // 上一次满足充满判定条件的时间戳 (广播通道共享读取，与锁定容量同源)
    var lastFullChargeTimestamp: Long? =
        prefs.getLong(KEY_LAST_FULL_TIMESTAMP, -1L).takeIf { it > 0 }

    // 是否处于充满判定区间内 (100% 且 0-25mA)：用于写盘去重，
    // 避免满足条件期间每秒遥测轮询重复写 SharedPreferences
    private var wasInFullChargeBand = false

    /**
     * 读取最新的电池遥测数据
     */
    fun readBatteryTelemetry(): BatteryState {
        val intentFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        val batteryIntent: Intent? = context.registerReceiver(null, intentFilter)

        // 5. 电量百分比
        val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val percentage = if (level >= 0 && scale > 0) {
            (level * 100 / scale)
        } else {
            // 部分设备无 BATTERY_PROPERTY_CAPACITY 时返回 Int.MIN_VALUE，需防护
            val capacityProp = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            if (capacityProp in 0..100) capacityProp else 0
        }

        // 6. 电池状态 (充电中、放电中、已充满、未充电)
        val statusInt = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val status = when (statusInt) {
            BatteryManager.BATTERY_STATUS_CHARGING -> BatteryStatus.CHARGING
            BatteryManager.BATTERY_STATUS_DISCHARGING -> BatteryStatus.DISCHARGING
            BatteryManager.BATTERY_STATUS_FULL -> BatteryStatus.FULL
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> BatteryStatus.NOT_CHARGING
            else -> BatteryStatus.NOT_CHARGING
        }

        // 7. 电池温度：当前电池温度（摄氏度 ℃）
        val tempTenths = batteryIntent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 250) ?: 250
        val temperatureCelsius = tempTenths / 10.0f

        // 8. 电池健康状况 (良好、过热、损坏、超压、未知)
        val healthInt = batteryIntent?.getIntExtra(BatteryManager.EXTRA_HEALTH, -1) ?: -1
        val healthQuality = when (healthInt) {
            BatteryManager.BATTERY_HEALTH_GOOD -> BatteryHealthQuality.GOOD
            BatteryManager.BATTERY_HEALTH_OVERHEAT -> BatteryHealthQuality.OVERHEAT
            BatteryManager.BATTERY_HEALTH_DEAD -> BatteryHealthQuality.DEAD
            BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> BatteryHealthQuality.OVER_VOLTAGE
            else -> BatteryHealthQuality.UNKNOWN
        }

        // 9. 电压：当前电池电压（毫伏 mV）
        val voltageMv = batteryIntent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 4000) ?: 4000

        // 11. 瞬时电流：当前电池的瞬时电流（毫安 mA）
        // BATTERY_PROPERTY_CURRENT_NOW 规范返回微安 (μA)，部分旧内核返回毫安 (mA)，需归一化
        val currentMicroAmp = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
        val currentNowMa = BatterySysfs.normalizeCurrentToMilliAmps(currentMicroAmp)

        // 10. 循环计数：电池充放电的次数
        // Android 14+ 原生 API 与 Linux sysfs 双重支持；均不可用时返回 0 (UI 显示"系统未上报")
        var cycleCount = 0
        if (Build.VERSION.SDK_INT >= 34) { // Android 14+ 原生 API
            cycleCount = batteryIntent?.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT, 0) ?: 0
        }
        if (cycleCount <= 0) {
            cycleCount = BatterySysfs.readInt("/sys/class/power_supply/battery/cycle_count") ?: 0
        }

        // 3. 电池当前容量（衰减后的容量 mAh）
        val chargeCounterUah = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)
        var currentCapacityMah = (designCapacityMah * 0.92f).toInt()
        val sysfsMaxCapacityUah = BatterySysfs.readInt("/sys/class/power_supply/battery/charge_full")
        if (sysfsMaxCapacityUah != null && sysfsMaxCapacityUah > 0) {
            currentCapacityMah = sysfsMaxCapacityUah / 1000
        }

        // 2. 剩余电量（mAh）
        val remainingCapacityMah = if (chargeCounterUah > 0 && chargeCounterUah != Int.MIN_VALUE) {
            chargeCounterUah / 1000
        } else {
            (currentCapacityMah * (percentage / 100f)).toInt()
        }

        // 1. 电池健康度 (%)
        val healthPercentage = ((currentCapacityMah.toFloat() / designCapacityMah) * 100f).coerceIn(0f, 100f)

        // 12. 完全充满时的容量：估算的电池完全充满时的容量（毫安时）
        // 核心规则：仅当电量为 100% 且电流在 0-25 mA 之间时，才视为电池充满
        val isFullChargeConditionMet = (percentage == 100 && currentNowMa in 0..25)
        val fullChargeCapacityMah = lockFullChargeIfCriteriaMet(currentCapacityMah, percentage, currentNowMa)

        // 计算瞬时功率 (W = V * I)
        val powerWatts = (voltageMv.toFloat() * abs(currentNowMa)) / 1_000_000f

        // 动态解析硬件信息摘要 (真实可读字段 + 快充档位功率推断 + 诚实未上报标注)
        val hardware = HardwareInfoResolver.resolve(temperatureCelsius, cycleCount, powerWatts)

        return BatteryState(
            healthPercentage = healthPercentage,
            remainingCapacityMah = remainingCapacityMah,
            currentCapacityMah = currentCapacityMah,
            designCapacityMah = designCapacityMah,
            percentage = percentage,
            status = if (isFullChargeConditionMet) BatteryStatus.FULL else status,
            temperatureCelsius = temperatureCelsius,
            healthQuality = healthQuality,
            voltageMv = voltageMv,
            cycleCount = cycleCount,
            currentMa = currentNowMa,
            fullChargeCapacityMah = fullChargeCapacityMah,
            lastFullChargeTimestamp = lastFullChargeTimestamp,
            isFullChargeConditionMet = isFullChargeConditionMet,
            powerWatts = powerWatts,
            socModel = hardware.socModel,
            pmicModel = hardware.pmicModel,
            batteryChemistry = hardware.batteryChemistry,
            fastChargeProtocol = hardware.fastChargeProtocol,
            internalResistanceMohm = hardware.internalResistanceMohm,
            halVersion = hardware.halVersion,
            cellStructure = hardware.cellStructure,
            thermalThrottlingState = hardware.thermalThrottlingState
        )
    }

    /**
     * 持久化指标 12 的充满锁定容量与时间戳 (供 ViewModel 模拟充满时调用)
     */
    fun persistFullChargeCapacity(capacityMah: Int, timestampMs: Long) {
        lastRecordedFullCapacity = capacityMah
        lastFullChargeTimestamp = timestampMs
        prefs.edit()
            .putInt(KEY_LAST_FULL_CAPACITY, capacityMah)
            .putLong(KEY_LAST_FULL_TIMESTAMP, timestampMs)
            .apply()
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
     */
    fun lockFullChargeIfCriteriaMet(currentCapacityMah: Int, percentage: Int, currentNowMa: Int): Int? {
        if (percentage == 100 && currentNowMa in 0..25) {
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
     */
    private fun getDesignCapacity(context: Context): Int {
        try {
            val powerProfileClass = Class.forName("com.android.internal.os.PowerProfile")
            val constructor = powerProfileClass.getConstructor(Context::class.java)
            val powerProfile = constructor.newInstance(context)
            val getBatteryCapacityMethod = powerProfileClass.getMethod("getBatteryCapacity")
            val capacity = getBatteryCapacityMethod.invoke(powerProfile) as? Double
            if (capacity != null && capacity > 0) return capacity.toInt()
        } catch (e: Exception) {}

        val sysfsDesign = BatterySysfs.readInt("/sys/class/power_supply/battery/charge_full_design")
        if (sysfsDesign != null && sysfsDesign > 0) return sysfsDesign / 1000

        return 5000
    }

    companion object {
        private const val PREFS_NAME = "battery_master_prefs"
        private const val KEY_LAST_FULL_CAPACITY = "last_full_capacity_mah"
        private const val KEY_LAST_FULL_TIMESTAMP = "last_full_timestamp_ms"
    }
}
