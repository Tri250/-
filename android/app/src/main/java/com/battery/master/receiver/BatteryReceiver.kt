package com.battery.master.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import android.os.Build
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.BatterySysfs
import com.battery.master.service.HardwareInfoResolver
import kotlin.math.abs

/**
 * 监听 Android 底层硬件广播 ACTION_BATTERY_CHANGED
 * 提取电压、温度、瞬时电流、健康状态并根据条件 12 判定完全充满
 * 设计容量等配置共享 BatteryHardwareReader 单一数据源，避免双通道数据不一致
 */
class BatteryReceiver(
    private val reader: BatteryHardwareReader,
    private val onBatteryUpdate: (BatteryState) -> Unit
) : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BATTERY_CHANGED) return

        // 安全转换：极端场景下系统服务异常返回时静默丢弃本次广播，轮询通道继续兜底
        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager ?: return

        // 5. 电量百分比 (0 - 100) (extras 缺失时回退 CAPACITY 属性，与轮询通道一致)
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        var percentage = if (level >= 0 && scale > 0) (level * 100 / scale) else 0
        if (percentage == 0) {
            val capacityProp = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            if (capacityProp in 0..100) percentage = capacityProp
        }

        // 6. 电池状态
        val rawStatus = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
        val status = when (rawStatus) {
            BatteryManager.BATTERY_STATUS_CHARGING -> BatteryStatus.CHARGING
            BatteryManager.BATTERY_STATUS_DISCHARGING -> BatteryStatus.DISCHARGING
            BatteryManager.BATTERY_STATUS_FULL -> BatteryStatus.FULL
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> BatteryStatus.NOT_CHARGING
            else -> BatteryStatus.NOT_CHARGING
        }

        // 7. 电池温度：EXTRA_TEMPERATURE 返回的是 0.1 摄氏度 (默认 25.0℃，与轮询通道一致)
        val rawTemp = intent.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 250)
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

        // 9. 电压：毫伏 (mV) (默认 4000mV，与轮询通道一致)
        val voltageMv = intent.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 4000)

        // 11. 瞬时电流 (mA)：BATTERY_PROPERTY_CURRENT_NOW 规范返回微安 (μA)，需归一化
        val currentUa = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
        val currentMa = BatterySysfs.normalizeCurrentToMilliAmps(currentUa)

        // 10. 循环计数 (Android 14+ API 34 支持直接从 Intent EXTRA_CYCLE_COUNT 获取，或读取 sysfs)
        var cycleCount = 0
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            try {
                cycleCount = intent.getIntExtra(BatteryManager.EXTRA_CYCLE_COUNT, -1)
            } catch (e: Exception) {}
        }
        if (cycleCount <= 0) {
            cycleCount = BatterySysfs.readInt("/sys/class/power_supply/battery/cycle_count") ?: 0
        }

        // 4. 电池出厂设计容量 (共享 Reader 单一数据源：PowerProfile -> sysfs -> 5000mAh)
        val designCapacityMah = reader.designCapacityMah

        // 3. 电池当前容量 (衰减后容量，从 sysfs charge_full 读取或由电量计芯片校准)
        val currentCapacityMah = BatterySysfs.readInt("/sys/class/power_supply/battery/charge_full")?.div(1000)
            ?.takeIf { it > 0 }
            ?: (designCapacityMah * 0.92f).toInt()

        // 2. 剩余电量 (mAh)
        // 从 BATTERY_PROPERTY_CHARGE_COUNTER 获取 (uAh -> mAh)，或由百分比折算
        val chargeCounterUah = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)
        val remainingCapacityMah = if (chargeCounterUah > 0 && chargeCounterUah != Int.MIN_VALUE) {
            chargeCounterUah / 1000
        } else {
            (currentCapacityMah * (percentage / 100.0f)).toInt()
        }

        // 1. 电池健康度 (%)
        val healthPercentage = ((currentCapacityMah.toFloat() / designCapacityMah) * 100).coerceIn(0f, 100f)

        // 12. 完全充满时的容量：估算完全充满时的容量 (mAh)
        // 核心规则：仅当电量为 100% 且电流在 0-25 mA 之间时，才视为电池充满
        // 与轮询通道共享锁定逻辑：满足则锁定+持久化，未满足保留上次锁定值不抹除
        val isFullCriteriaMet = percentage == 100 && (currentMa in 0..25)
        val fullChargeCapacityMah = reader.lockFullChargeIfCriteriaMet(currentCapacityMah, percentage, currentMa)

        // 瞬时功率 (W = V × I)：与轮询通道一致，始终计算
        val powerWatts = (voltageMv.toFloat() * abs(currentMa)) / 1_000_000f

        // 动态解析硬件信息摘要 (真实可读字段 + 诚实未上报标注)
        val hardware = HardwareInfoResolver.resolve(temperatureCelsius, cycleCount)

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
            lastFullChargeTimestamp = reader.lastFullChargeTimestamp,
            powerWatts = powerWatts,
            isFullChargeConditionMet = isFullCriteriaMet,
            socModel = hardware.socModel,
            pmicModel = hardware.pmicModel,
            batteryChemistry = hardware.batteryChemistry,
            fastChargeProtocol = hardware.fastChargeProtocol,
            internalResistanceMohm = hardware.internalResistanceMohm,
            halVersion = hardware.halVersion,
            cellStructure = hardware.cellStructure,
            thermalThrottlingState = hardware.thermalThrottlingState
        )

        onBatteryUpdate(updatedState)
    }
}
