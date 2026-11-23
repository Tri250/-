package com.smalljelly.batterydata.data

import android.os.BatteryManager
import kotlin.math.abs

/**
 * 一次电池采样。所有电流单位为 mA，充电为正、放电为负。
 */
data class BatterySample(
    val level: Int = 0,
    val status: Int = BatteryManager.BATTERY_STATUS_UNKNOWN,
    val plugged: Int = 0,
    val voltageMv: Int = 0,
    val currentMa: Float? = null,
    val temperatureC: Float? = null,
    val healthCode: Int = BatteryManager.BATTERY_HEALTH_UNKNOWN,
    val technology: String = "—",
    val chargeCounterMah: Float? = null,
    val cycleCount: Int? = null,
    val fullChargeMah: Float? = null,
    val designCapacityMah: Float? = null,
    val designSource: String? = null,
    /** 系统给出的充电剩余分钟数（BATTERY_PROPERTY_CHARGE_TIME_REMAINING），不支持/不充电时为 null */
    val chargeTimeRemainingMin: Int? = null,
    val updatedAt: Long = 0L,
) {
    val isCharging: Boolean get() = status == BatteryManager.BATTERY_STATUS_CHARGING
    val isFull: Boolean get() = status == BatteryManager.BATTERY_STATUS_FULL
    val isDischarging: Boolean get() = status == BatteryManager.BATTERY_STATUS_DISCHARGING
    val isPlugged: Boolean get() = plugged != 0 || isCharging || isFull

    val statusText: String
        get() = when (status) {
            BatteryManager.BATTERY_STATUS_CHARGING -> "充电中"
            BatteryManager.BATTERY_STATUS_DISCHARGING -> "放电中"
            BatteryManager.BATTERY_STATUS_FULL -> "已充满"
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> "未充电"
            else -> "未知状态"
        }

    val pluggedText: String
        get() = when (plugged) {
            BatteryManager.BATTERY_PLUGGED_AC -> "有线充电器"
            BatteryManager.BATTERY_PLUGGED_USB -> "USB 供电"
            BatteryManager.BATTERY_PLUGGED_WIRELESS -> "无线充电"
            BatteryManager.BATTERY_PLUGGED_DOCK -> "底座供电"
            0 -> "未连接电源"
            else -> "已连接电源"
        }

    val healthText: String
        get() = when (healthCode) {
            BatteryManager.BATTERY_HEALTH_GOOD -> "良好"
            BatteryManager.BATTERY_HEALTH_OVERHEAT -> "过热"
            BatteryManager.BATTERY_HEALTH_DEAD -> "老化失效"
            BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> "电压过高"
            BatteryManager.BATTERY_HEALTH_UNSPECIFIED_FAILURE -> "异常"
            BatteryManager.BATTERY_HEALTH_COLD -> "温度过低"
            else -> "未知"
        }

    /** 瞬时功率（W），充电为正。 */
    val powerW: Float?
        get() {
            val current = currentMa ?: return null
            if (voltageMv <= 0) return null
            return voltageMv / 1000f * current / 1000f
        }

    /** 由充电计数器与当前电量反推的满电容量（mAh）。 */
    val estimatedFullChargeMah: Float?
        get() {
            fullChargeMah?.let { if (it > 100f) return it }
            val counter = chargeCounterMah ?: return null
            if (level < 5 || level > 100) return null
            // 模拟器 / 部分机型的 charge_counter 只是占位值，反推结果过小就视为不可用
            return (counter / (level / 100f)).takeIf { it >= 500f }
        }

    /** 电池健康度百分比，需要设计容量 + 满电容量。 */
    val healthPercent: Float?
        get() {
            val design = designCapacityMah ?: return null
            val full = estimatedFullChargeMah ?: return null
            if (design <= 0f || full <= 0f) return null
            return (full / design * 100f).coerceIn(0f, 100f)
        }

    /** 还剩多久 / 还有多久充满，单位分钟。 */
    val etaMinutes: Int?
        get() {
            // 优先信系统预估：厂商内核知道恒压段/涓流段的降流曲线，比线性外推准得多，
            // 而且电流读不到时也能给出结果（线性外推必须有电流才能算）
            if (isCharging && chargeTimeRemainingMin != null) return chargeTimeRemainingMin
            val current = currentMa ?: return null
            val counter = chargeCounterMah ?: return null
            val magnitude = abs(current)
            if (magnitude < 30f) return null
            return if (current < 0f) {
                (counter / magnitude * 60f).toInt()
            } else {
                val full = estimatedFullChargeMah ?: return null
                ((full - counter).coerceAtLeast(0f) / magnitude * 60f).toInt()
            }
        }
}

fun formatEta(minutes: Int?): String? {
    if (minutes == null || minutes <= 0) return null
    val hours = minutes / 60
    val rest = minutes % 60
    return if (hours > 0) "$hours 小时 $rest 分" else "$rest 分钟"
}

fun healthRatingText(percent: Float?): String = when {
    percent == null -> "未知"
    percent >= 90f -> "优秀"
    percent >= 80f -> "良好"
    percent >= 70f -> "一般"
    else -> "偏低"
}
