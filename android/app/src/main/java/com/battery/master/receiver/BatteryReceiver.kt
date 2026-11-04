package com.battery.master.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import android.os.Build
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import java.io.File

/**
 * 监听 Android 底层硬件广播 ACTION_BATTERY_CHANGED
 * 提取电压、温度、瞬时电流、健康状态并根据条件 12 判定完全充满
 */
class BatteryReceiver(
    private val onBatteryUpdate: (BatteryState) -> Unit
) : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BATTERY_CHANGED) return

        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager

        // 5. 电量百分比 (0 - 100)
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        val percentage = if (level >= 0 && scale > 0) (level * 100 / scale) else 0

        // 6. 电池状态
        val rawStatus = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
        val status = when (rawStatus) {
            BatteryManager.BATTERY_STATUS_CHARGING -> BatteryStatus.CHARGING
            BatteryManager.BATTERY_STATUS_DISCHARGING -> BatteryStatus.DISCHARGING
            BatteryManager.BATTERY_STATUS_FULL -> BatteryStatus.FULL
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> BatteryStatus.NOT_CHARGING
            else -> BatteryStatus.NOT_CHARGING
        }

        // 7. 电池温度：EXTRA_TEMPERATURE 返回的是 0.1 摄氏度
        val rawTemp = intent.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0)
        val temperatureCelsius = rawTemp / 10.0f

        // 8. 电池健康状况
        val rawHealth = intent.getIntExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_UNKNOWN)
        val healthQuality = when (rawHealth) {
            BatteryManager.BATTERY_HEALTH_GOOD -> BatteryHealthQuality.GOOD
            BatteryManager.BATTERY_HEALTH_OVERHEAT -> BatteryHealthQuality.OVERHEAT
            BatteryManager.BATTERY_HEALTH_DEAD -> BatteryHealthQuality.DEAD
            BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> BatteryHealthQuality.OVER_VOLTAGE
            else -> BatteryHealthQuality.UNKNOWN
        }

        // 9. 电压：毫伏 (mV)
        val voltageMv = intent.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0)

        // 11. 瞬时电流 (mA)：BATTERY_PROPERTY_CURRENT_NOW 返回的是微安 (uA)
        val currentUa = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
        val currentMa = currentUa / 1000

        // 10. 循环计数 (Android 14+ API 34 支持直接获取，低版本读取 sysfs)
        var cycleCount = 0
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            try {
                cycleCount = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CYCLE_COUNT)
            } catch (_: Exception) {}
        }
        if (cycleCount <= 0) {
            cycleCount = readSysfsInt("/sys/class/power_supply/battery/cycle_count") ?: 268
        }

        // 4. 电池出厂设计容量 (从系统 PowerProfile 或 sysfs 读取)
        val designCapacityMah = getDesignCapacity(context)

        // 3. 电池当前容量 (衰减后容量，从 sysfs charge_full 读取或由电量计芯片校准)
        val currentCapacityMah = readSysfsInt("/sys/class/power_supply/battery/charge_full")?.div(1000)
            ?: (designCapacityMah * 0.92f).toInt()

        // 2. 剩余电量 (mAh)
        // 从 BATTERY_PROPERTY_CHARGE_COUNTER 获取 (uAh -> mAh)，或由百分比折算
        val chargeCounterUah = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)
        val remainingCapacityMah = if (chargeCounterUah > 0) {
            chargeCounterUah / 1000
        } else {
            (currentCapacityMah * (percentage / 100.0f)).toInt()
        }

        // 1. 电池健康度 (%)
        val healthPercentage = ((currentCapacityMah.toFloat() / designCapacityMah) * 100).coerceIn(0f, 100f)

        // 12. 完全充满时的容量：估算完全充满时的容量 (mAh)
        // 核心规则：仅当电量为 100% 且电流在 0-25 mA 之间时，才视为电池充满
        val isFullCriteriaMet = percentage == 100 && (currentMa in 0..25)
        val fullChargeCapacityMah = if (isFullCriteriaMet) {
            currentCapacityMah
        } else {
            null
        }

        val updatedState = BatteryState(
            healthPercentage = healthPercentage,
            remainingCapacityMah = remainingCapacityMah,
            currentCapacityMah = currentCapacityMah,
            designCapacityMah = designCapacityMah,
            percentage = percentage,
            status = if (isFullCriteriaMet) BatteryStatus.FULL else status,
            temperatureCelsius = temperatureCelsius,
            healthQuality = healthQuality,
            voltageMv = voltageMv,
            cycleCount = cycleCount,
            currentMa = currentMa,
            fullChargeCapacityMah = fullChargeCapacityMah,
            lastFullChargeTimestamp = if (isFullCriteriaMet) System.currentTimeMillis() else null
        )

        onBatteryUpdate(updatedState)
    }

    private fun readSysfsInt(path: String): Int? {
        return try {
            val file = File(path)
            if (file.exists()) file.readText().trim().toIntOrNull() else null
        } catch (_: Exception) {
            null
        }
    }

    private fun getDesignCapacity(context: Context): Int {
        // 尝试通过反射读取 com.android.internal.os.PowerProfile
        try {
            val powerProfileClass = Class.forName("com.android.internal.os.PowerProfile")
            val constructor = powerProfileClass.getConstructor(Context::class.java)
            val powerProfile = constructor.newInstance(context)
            val getBatteryCapacityMethod = powerProfileClass.getMethod("getBatteryCapacity")
            val capacity = getBatteryCapacityMethod.invoke(powerProfile) as? Double
            if (capacity != null && capacity > 0) return capacity.toInt()
        } catch (_: Exception) {}

        // 备用读取 sysfs
        val sysfsDesign = readSysfsInt("/sys/class/power_supply/battery/charge_full_design")
        if (sysfsDesign != null && sysfsDesign > 0) return sysfsDesign / 1000

        return 5000 // 默认主流 5000mAh
    }
}
