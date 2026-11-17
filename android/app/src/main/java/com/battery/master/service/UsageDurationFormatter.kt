package com.battery.master.service

/**
 * 设备使用时长格式化 (纯函数，可单测，v2.1.0 新增)
 *
 * 分级口径：
 * - >= 1 天  → "X 天 X 小时"
 * - >= 1 小时 → "X 小时 X 分钟"
 * - >= 1 分钟 → "X 分钟"
 * - < 1 分钟 → "不足 1 分钟" (0/负值同样归入，不显示 0 天 0 小时的矛盾态)
 *
 * 中文单位为字面量：与 service 层既有硬件档案标注 ([实测]/[品牌档案]) 的
 * 中文字面量惯例一致 (BatteryHardwareReader/SoCHardwareProfile 同风格)。
 */
internal object UsageDurationFormatter {

    private const val MINUTE_MS = 60_000L
    private const val HOUR_MINUTES = 60L
    private const val DAY_MINUTES = 60L * 24L

    fun formatUsageDuration(ms: Long): String {
        if (ms < MINUTE_MS) return "不足 1 分钟"
        val totalMinutes = ms / MINUTE_MS
        val days = totalMinutes / DAY_MINUTES
        val hours = (totalMinutes % DAY_MINUTES) / HOUR_MINUTES
        val minutes = totalMinutes % HOUR_MINUTES
        return when {
            days > 0 -> "$days 天 $hours 小时"
            hours > 0 -> "$hours 小时 $minutes 分钟"
            else -> "$minutes 分钟"
        }
    }

    /** ROM 未提供 BOOT_COUNT (null) 时显示"系统未提供"，不编造数值 */
    fun formatBootCount(count: Int?): String =
        if (count != null && count >= 0) "$count 次" else "系统未提供"
}
