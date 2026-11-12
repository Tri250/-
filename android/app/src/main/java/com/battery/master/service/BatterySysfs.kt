package com.battery.master.service

import java.io.File
import kotlin.math.abs

/**
 * 电池 sysfs 节点读取与电流单位归一化工具
 *
 * 背景：BatteryManager.BATTERY_PROPERTY_CURRENT_NOW 官方规范返回微安 (μA)，
 * 但部分旧内核/芯片实际返回毫安 (mA)。若统一按某一单位换算，
 * 会在涓流区间 (0~25 mA) 产生 1000 倍误差，直接破坏指标 11 (瞬时电流)
 * 与指标 12 (完全充满判定) 的正确性，故做单位归一化处理。
 */
internal object BatterySysfs {

    /**
     * 从 Linux sysfs 读取电池节点数据
     * (例如高通/联发科平台的 /sys/class/power_supply/battery/)
     */
    fun readInt(path: String): Int? = try {
        val file = File(path)
        if (file.exists() && file.canRead()) file.readText().trim().toIntOrNull() else null
    } catch (e: Exception) {
        null
    }

    /**
     * 将 CURRENT_NOW 原始值归一化为毫安 (mA)，统一符号约定"充电为正、放电为负"
     *
     * v1.2.3 P0 审计修复：
     * 1. 可空语义：设备不支持 BATTERY_PROPERTY_CURRENT_NOW 时系统返回
     *    Int.MIN_VALUE (旧实现归一化为 0 mA，导致不支持该属性的机型在 100%
     *    电量时充满判定恒真、估算值被冒充实测锁定写盘)。现 Int.MIN_VALUE
     *    与 null 一律返回 null = 电流不可读，判定方走 UNKNOWN 而非 true。
     *    真实 0 mA (浮充截止) 仍是合法读数，返回 0。
     * 2. 符号归一：AOSP 未规定 current_now 符号方向，实际随平台/HAL 而变
     *    (大量高通/三星内核充电时上报负值)。旧实现只处理量纲不校验符号，
     *    使指标 12 判定 (0~25 mA) 在这类机型上永不成立。现按充放电状态
     *    校准符号：充电态取正值、放电态取负值，未知态保持原始符号。
     *
     * @param raw CURRENT_NOW 原始读数 (μA 或 mA，随 HAL 而定)，允许 null
     * @param isCharging 是否处于充电/满电状态 (null = 未知，不翻转符号)
     * @return 归一化后的 mA 值；不可读返回 null
     */
    fun normalizeCurrentToMilliAmps(raw: Int?, isCharging: Boolean?): Int? {
        // 不支持/不可读：返回 null，绝不归一化成 0 (0 是合法浮充读数，语义不同)
        if (raw == null || raw == Int.MIN_VALUE) return null
        if (raw == 0) return 0

        val normalized = normalizeCurrentToMilliAmpsInternal(raw).coerceIn(
            -BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA,
            BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA
        )

        // 符号校准：跨平台统一"充电为正、放电为负"口径
        return when {
            isCharging == true && normalized < 0 -> -normalized
            isCharging == false && normalized > 0 -> -normalized
            else -> normalized
        }
    }

    private fun normalizeCurrentToMilliAmpsInternal(raw: Int): Int {
        if (raw == 0 || raw == Int.MIN_VALUE) return 0
        val absRaw = abs(raw)
        if (absRaw > 20000) return raw / 1000

        val sysfsCurrent = readInt("/sys/class/power_supply/battery/current_now")
        if (sysfsCurrent != null && abs(sysfsCurrent) > 0) {
            val ratio = abs(sysfsCurrent).toFloat() / absRaw
            if (ratio in 500f..2000f) return raw
            if (ratio in (1f / 2000f)..(1f / 500f)) return raw / 1000
            return raw / 1000
        }
        return raw / 1000
    }

    /**
     * 容量原始值 → mAh 双单位归一化 (指标 03 当前容量 / 指标 04 设计容量共用)
     *
     * 背景：charge_full / charge_full_design 规范单位为 μAh，但个别内核以 mAh 上报。
     * 判定链 (合理区间与 BatteryTelemetryParser 常量单源一致)：
     * 1. round(raw / 1000) ∈ [500, 25000] → 规范 μAh，四舍五入取整返回；
     * 2. raw ∈ [500, 25000] → μAh 单位下 0.5~25 mAh 电芯物理上不存在，
     *    必为 mAh 上报内核 → 直接返回原始值；
     * 3. 其余 (0 / 负值 / 越界) 一律视为脏数据返回 null，由调用方回退设计容量估算值。
     */
    fun parseCapacityMah(raw: Int): Int? {
        if (raw <= 0 || raw == Int.MIN_VALUE) return null
        val microAhCapacityMah = Math.round(raw / 1000f)
        if (microAhCapacityMah in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH) {
            return microAhCapacityMah
        }
        if (raw in BatteryTelemetryParser.MIN_PLAUSIBLE_CAPACITY_MAH..BatteryTelemetryParser.MAX_PLAUSIBLE_CAPACITY_MAH) {
            return raw
        }
        return null
    }

    /** 读取 sysfs 容量节点并归一化为 mAh；不可读或脏数据返回 null */
    fun readCapacityMah(path: String): Int? = readInt(path)?.let(::parseCapacityMah)
}
