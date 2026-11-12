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
     * 将 CURRENT_NOW 原始值归一化为毫安 (mA)，保持符号 (充电为正、放电为负)
     *
     * 判定策略：
     * 1. |raw| > 20000：手机不可能通过 20A+ 电流，必定是 μA，直接 /1000；
     * 2. 可读取 sysfs current_now 时做交叉校验：
     *    - sysfs ≈ 1000 × raw → raw 是 mA，sysfs 是 μA → 直接返回 raw；
     *    - raw ≈ 1000 × sysfs → raw 是 μA → /1000；
     *    - 两者同单位 → 按 Android 官方规范默认 μA → /1000；
     * 3. 无 sysfs 时按官方规范默认 μA → /1000。
     */
    fun normalizeCurrentToMilliAmps(raw: Int): Int {
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
     * 1. round(raw / 1000) ∈ [500, 20000] → 规范 μAh，四舍五入取整返回；
     * 2. raw ∈ [500, 20000] → μAh 单位下 0.5~20 mAh 电芯物理上不存在，
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
