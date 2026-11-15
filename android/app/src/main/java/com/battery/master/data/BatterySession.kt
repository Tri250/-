package com.battery.master.data

/**
 * v2.0.0-beta.1 P0 GA 修复：充放电会话统计模型 (长期数据连续性)
 *
 * 一个会话 = 一次连续的充电过程 (status ∈ {CHARGING, FULL}) 或放电过程
 * (status ∈ {DISCHARGING, NOT_CHARGING})。会话由 BatteryHistoryStore 从持久化
 * 遥测样本流中检测：状态族切换或采样间隔超过 [com.battery.master.service.BatteryHistoryStore.SESSION_GAP_MS]
 * (跨重启/退后台) 时闭合当前会话并落盘。
 *
 * 与样本持久化解耦：样本文件有滑窗上限 (防止无限膨胀)，会话记录独立落盘、
 * 保留更长历史，支撑"最近充电 2 小时从 30% 到 100%"级别的长期统计口径。
 */
data class BatterySession(
    /** 会话类型：CHARGE 充电过程 / DISCHARGE 放电过程 */
    val type: SessionType,

    /** 会话开始时刻 (epoch 毫秒，首个样本时间戳) */
    val startTimestampMs: Long,

    /** 会话结束时刻 (epoch 毫秒，最后一个样本时间戳；打开中 = 最近样本时间戳) */
    val endTimestampMs: Long,

    /** 会话起始电量百分比 (0~100) */
    val startPercentage: Int,

    /** 会话结束电量百分比 (0~100) */
    val endPercentage: Int,

    /** 会话期间最低电量百分比 */
    val minPercentage: Int,

    /** 会话期间最高电量百分比 */
    val maxPercentage: Int,

    /** 会话时长 (毫秒) */
    val durationMs: Long,

    /** 会话期间平均瞬时电流 (mA，充电为正放电为负；无有效电流样本时 null) */
    val averageCurrentMa: Int?,

    /** 会话累计样本数 */
    val sampleCount: Int,

    /** 会话是否仍在进行中 (未闭合)；true = 打开中，跨重启不恢复打开态 */
    val isOpen: Boolean = false
) {
    enum class SessionType(val label: String) {
        CHARGE("充电"),
        DISCHARGE("放电")
    }

    /** 电量变化量：充电为正增量、放电为负增量 (end - start，会话族语义保证符号) */
    val deltaPercentage: Int get() = endPercentage - startPercentage
}
