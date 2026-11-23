package com.smalljelly.batterydata.data

import android.os.BatteryManager
import kotlin.math.abs
import kotlin.math.min
import kotlin.roundToInt

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
    /** 未取整的电量百分比（78.4）：反推满电容量用它可消除整数电量的量化跳动 */
    val rawLevelPercent: Float? = null,
    /** 系统给出的充电剩余分钟数（BATTERY_PROPERTY_CHARGE_TIME_REMAINING），不支持/不充电时为 null */
    val chargeTimeRemainingMin: Int? = null,
    /** 电压/电流是否来自估算兜底（系统层与 sysfs 都拿不到时的典型值/库仑计差分） */
    val voltageEstimated: Boolean = false,
    val currentEstimated: Boolean = false,
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
            // 反推用的电量优先取未取整值：整数 level 每跨 1% 反推结果跳 ±1.3%，
            // 健康度会跟着抖；浮点电量与库仑计同步连续，反推值就稳了。
            // 门槛维持 5..100：电量太低时反推误差依旧不可接受
            val soc = rawLevelPercent?.takeIf { it in 5f..100f }
                ?: level.takeIf { it in 5..100 }?.toFloat()
                ?: return null
            // 模拟器 / 部分机型的 charge_counter 只是占位值，反推结果过小就视为不可用
            return (counter / (soc / 100f)).takeIf { it >= 500f }
        }

    /** 电池健康度百分比，需要设计容量 + 满电容量。 */
    val healthPercent: Float?
        get() {
            val design = designCapacityMah ?: return null
            val full = estimatedFullChargeMah ?: return null
            if (design <= 0f || full <= 0f) return null
            return (full / design * 100f).coerceIn(0f, 100f)
        }

    /** 还剩多久 / 还有多久充满，单位分钟。线性外推的结果钳制在 24 小时内：超过必是估算失真 */
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
                (counter / magnitude * 60f).toInt().coerceAtMost(1_440)
            } else {
                val full = estimatedFullChargeMah ?: return null
                ((full - counter).coerceAtLeast(0f) / magnitude * 60f).toInt().coerceAtMost(1_440)
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

/** 系统健康评分的分级文字。 */
fun systemHealthGrade(score: Int): String = when {
    score >= 90 -> "优"
    score >= 80 -> "良"
    score >= 65 -> "注意"
    else -> "差"
}

/** 温度分：锂电池最佳工作窗口 20-35℃，过热/深度低温大幅扣分。 */
private fun temperatureScore(t: Float): Int = when {
    t >= 45f -> 40
    t >= 40f -> 70
    t > 35f -> 90
    t in 20f..35f -> 100
    t >= 0f -> 88
    else -> 60
}

/** 电压分：充电（含恒压段）与放电的合理区间不同，过压/过放重扣。 */
private fun voltageScore(mv: Int, charging: Boolean): Int = when {
    charging -> when {
        mv > 4650 -> 40
        mv >= 3500 -> 100
        else -> 90
    }
    else -> when {
        mv >= 3500 -> 100
        mv >= 3300 -> 90
        mv >= 3000 -> 70
        else -> 40
    }
}

/** 循环次数分：按锂电典型寿命（500 次后明显衰减、1200 次接近寿命末期）。 */
private fun cycleScore(c: Int): Int = when {
    c <= 300 -> 100
    c <= 500 -> 90
    c <= 800 -> 75
    c <= 1200 -> 60
    else -> 45
}

/**
 * 系统健康状态综合评分（0-100%）：容量 40% + 温度 30% + 电压 15% + 循环 15%。
 * 缺失的信号按剩余权重归一（没有容量数据的老机型也能算出温度/电压维度的分数）；
 * 系统报告异常码（过热/老化失效/电压过高/异常）时硬压分到 ≤55，温度过低 ≤70，
 * 保证警示不被其他高分项淹没。全部信号缺失返回 null（UI 显示原状态文字）。
 */
fun systemHealthScore(sample: BatterySample): Int? {
    var sum = 0f
    var weight = 0f
    sample.healthPercent?.let { sum += 0.40f * it; weight += 0.40f }
    sample.temperatureC?.let { sum += 0.30f * temperatureScore(it); weight += 0.30f }
    if (sample.voltageMv > 0) {
        sum += 0.15f * voltageScore(sample.voltageMv, sample.isCharging || sample.isFull)
        weight += 0.15f
    }
    sample.cycleCount?.let { sum += 0.15f * cycleScore(it); weight += 0.15f }
    if (weight <= 0f) return null
    var score = sum / weight
    score = when (sample.healthText) {
        "温度过低" -> min(score, 70f)
        "过热", "老化失效", "电压过高", "异常" -> min(score, 55f)
        else -> score
    }
    return score.roundToInt().coerceIn(1, 100)
}
