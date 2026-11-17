package com.battery.master.data

/**
 * 设备使用时长快照 (真实数据，0 权限，v2.1.0 新增)：
 *
 * - [uptimeMs]      本次开机时长：SystemClock.elapsedRealtime (含息屏待机，重启归零)
 * - [cumulativeMs]  跨重启累计使用时长：应用存活期 1Hz 累加 + SharedPreferences 持久化，
 *                   重启不丢；应用未运行的时间不计 (诚实口径，不虚构出厂首开时间)
 * - [bootCount]     系统真实开机次数：Settings.Global.BOOT_COUNT (自恢复出厂起累计)，
 *                   ROM 未提供该设置项时为 null (UI 显示"系统未提供"，不编造)
 * - [rebootDetected] 本次应用进程存活期内是否检测到过设备重启
 *                   (主信号 BOOT_COUNT 递增 / 回退信号 elapsedRealtime 单调回退)
 */
data class DeviceUsageSnapshot(
    val uptimeMs: Long,
    val cumulativeMs: Long,
    val bootCount: Int?,
    val rebootDetected: Boolean
)
