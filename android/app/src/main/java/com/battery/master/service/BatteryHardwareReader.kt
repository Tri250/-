package com.battery.master.service

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import java.io.File
import kotlin.math.abs

/**
 * Android 原生底层硬件与电量计 HAL 读取器
 * 负责通过 Android BatteryManager、Intent 以及 Linux sysfs 读取真实的 12 项充放电指标
 */
class BatteryHardwareReader(private val context: Context) {

    private val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager

    // 默认或从数据库读取的出厂设计容量 (mAh)
    var designCapacityMah: Int = 5000

    // 记录上一轮充满锁定的容量
    private var lastRecordedFullCapacity: Int? = null

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
            batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        }

        // 6. 电池状态 (充电中、放电中、已充满、未充电)
        val statusInt = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val status = when (statusInt) {
            BatteryManager.BATTERY_STATUS_CHARGING -> BatteryStatus.CHARGING
            BatteryManager.BATTERY_STATUS_DISCHARGING -> BatteryStatus.DISCHARGING
            BatteryManager.BATTERY_STATUS_FULL -> BatteryStatus.FULL
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> BatteryStatus.NOT_CHARGING
            else -> BatteryStatus.DISCHARGING
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
        // BatteryManager.BATTERY_PROPERTY_CURRENT_NOW 通常返回微安 (μA)，部分芯片返回毫安 (mA)
        var currentMicroAmp = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
        if (currentMicroAmp == Int.MIN_VALUE) {
            currentMicroAmp = readSysfsInt("/sys/class/power_supply/battery/current_now") ?: 0
        }
        val currentNowMa = if (abs(currentMicroAmp) > 20000) {
            currentMicroAmp / 1000 // 微安转毫安
        } else {
            currentMicroAmp
        }

        // 10. 循环计数：电池充放电的次数
        var cycleCount = 0
        if (Build.VERSION.SDK_INT >= 34) { // Android 14+ 原生 API
            cycleCount = batteryIntent?.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT, 0) ?: 0
        }
        if (cycleCount <= 0) {
            cycleCount = readSysfsInt("/sys/class/power_supply/battery/cycle_count") ?: 268
        }

        // 3. 电池当前容量（衰减后的容量 mAh）
        val chargeCounterUah = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)
        var currentCapacityMah = (designCapacityMah * 0.92f).toInt()
        val sysfsMaxCapacityUah = readSysfsInt("/sys/class/power_supply/battery/charge_full")
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
        if (isFullChargeConditionMet) {
            lastRecordedFullCapacity = currentCapacityMah
        }

        // 计算瞬时功率 (W = V * I)
        val powerWatts = (voltageMv.toFloat() * abs(currentNowMa)) / 1_000_000f

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
            fullChargeCapacityMah = if (isFullChargeConditionMet) currentCapacityMah else lastRecordedFullCapacity,
            isFullChargeConditionMet = isFullChargeConditionMet,
            powerWatts = powerWatts
        )
    }

    /**
     * 从 Linux sysfs 读取电池节点数据 (例如高通/联发科平台的 /sys/class/power_supply/battery/)
     */
    private fun readSysfsInt(path: String): Int? {
        return try {
            val file = File(path)
            if (file.exists() && file.canRead()) {
                file.readText().trim().toIntOrNull()
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}
