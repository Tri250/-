package com.battery.master.service

import android.content.Context

/**
 * v2.0.0-alpha.4：库仑计积分回归实测满充容量
 *
 * 背景：健康度 = 满充容量 / 设计容量。sysfs charge_full 节点在大量机型上
 * 不可读 (SELinux 拒绝/ROM 未导出)，健康度只能显示"无法测算"。
 *
 * 物理原理 (与 AccuBattery 同款，纯电荷积分、无出厂保持率假设)：
 * 官方库仑计 API `BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER` (API 21+)
 * 报告剩余电荷 (μAh)。在一段真实时间内，系统电量百分比变化 Δp 与库仑计
 * 电荷变化 Δc 满足线性关系 Δc ≈ k·Δp——带截距最小二乘回归 c = k·p + b，
 * 则满充容量 = k×100 + b。测出来是多少就是多少。
 *
 * 样本采集与质量门限：
 * - 每帧遥测喂入 (percentage, chargeCounterUah)；百分比变化 ≥1 才提交样本；
 * - Δp 与 Δc 异号 (电量计校准跳变/量程切换) 丢弃整段；
 * - 每样本隐含满容量 k̂ = Δc/Δp×100 落在 [1500, 15000] mAh 之外视为离群丢弃；
 * - 电荷读数断档 (≤0) 跳过该段，避免跨断档大 Δ 污染回归。
 *
 * 置信分级 (百分点覆盖广度 Σ|Δp| 驱动，充放电双向均可积累)：
 * - PENDING (跨度 < 30)：持续积累，不输出结果；
 * - MEDIUM (30 ≤ 跨度)：输出回归结果，UI 标注"中置信"；
 * - HIGH (跨度 ≥ 80 且样本 ≥ 12)：UI 标注"高置信"。
 *
 * 统计量 (n, Σx, Σy, Σx², Σxy, 覆盖跨度) 跨会话持久化，长期使用越用越准。
 */
class BatteryCapacityRegressor(context: Context) {

    enum class Confidence(val label: String) {
        PENDING("积累中"),
        MEDIUM("中置信"),
        HIGH("高置信")
    }

    /** 合法满容量区间 (mAh)：覆盖小容量手环级到平板级电芯 */
    companion object {
        const val MIN_PLAUSIBLE_FULL_MAH = 1500
        const val MAX_PLAUSIBLE_FULL_MAH = 15000
        const val MIN_SAMPLES = 6
        const val MEDIUM_SPAN_PCT = 30
        const val HIGH_SPAN_PCT = 80
        const val HIGH_SAMPLES = 12
        private const val PREFS = "battery_capacity_regression"
    }

    // 带截距 OLS 统计量：c (μAh) 对 p (%) 回归
    private var n = 0
    private var sx = 0L   // ΣΔp (带符号)
    private var sy = 0L   // ΣΔc (带符号, μAh)
    private var sxx = 0L  // ΣΔp²
    private var sxy = 0L  // ΣΔp·Δc
    private var spanPct = 0  // Σ|Δp|：覆盖广度 (充放电双向均可积累)

    // 上一帧跟踪 (进程内存态；跨重启丢失首段仅延迟一拍，不影响统计量)
    private var lastPerc = -1
    private var lastCounterUah = 0L

    private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    init {
        n = prefs.getInt("reg_n", 0)
        sx = prefs.getLong("reg_sx", 0L)
        sy = prefs.getLong("reg_sy", 0L)
        sxx = prefs.getLong("reg_sxx", 0L)
        sxy = prefs.getLong("reg_sxy", 0L)
        spanPct = prefs.getInt("reg_span", 0)
    }

    /** 每帧遥测喂入：percentage 0..100；chargeCounterUah ≤ 0 视为断档跳段 */
    fun observe(percentage: Int, chargeCounterUah: Long) {
        if (chargeCounterUah <= 0) {
            // 电荷不可读：断档，重置跟踪点避免跨断档大 Δ 污染回归
            lastPerc = -1
            return
        }
        if (lastPerc < 0) {
            lastPerc = percentage
            lastCounterUah = chargeCounterUah
            return
        }
        val dp = percentage - lastPerc
        if (dp == 0) return
        val dc = chargeCounterUah - lastCounterUah

        // 电量计校准跳变/量程切换：Δp 与 Δc 异号，物理上不可能，整段丢弃并重置
        // 跟踪点——异常基准若保留会持续污染后续帧 (测试实证)，重置后下帧重新起算
        if ((dp > 0) != (dc > 0)) {
            lastPerc = -1
            return
        }

        // 每样本隐含满容量 k̂ = Δc/Δp×100 (mAh)：越界视为离群 (读数毛刺/百分比跳变)。
        // 同样重置跟踪点，毛刺残留基准不得影响后续帧
        val impliedFullMah = dc.toDouble() / dp * 100.0 / 1000.0
        if (impliedFullMah < MIN_PLAUSIBLE_FULL_MAH || impliedFullMah > MAX_PLAUSIBLE_FULL_MAH) {
            lastPerc = -1
            return
        }

        // 有效样本：累加 OLS 统计量并持久化 (1% 变化才提交，写入频率低)
        n += 1
        sx += dp.toLong()
        sy += dc
        sxx += dp.toLong() * dp
        sxy += dp.toLong() * dc
        spanPct += kotlin.math.abs(dp)
        persist()
        lastPerc = percentage
        lastCounterUah = chargeCounterUah
    }

    /** 回归满充容量 (mAh)：未收敛或结果越界返回 null (诚实不输出)。
     *  过原点最小二乘 (k̂ = ΣΔpΔc / ΣΔp²)：Δ 模型物理上天然过原点——
     *  0% 的电量变化对应 0 电荷变化；带截距 OLS 在纯放电/纯充电等差序列
     *  (Δp 全等) 下设计矩阵共线不可辨识 (测试实证)，故统一采用过原点模型，
     *  电量计 0% 残余电荷引入的微小系统偏差由结果区间校验兜底 */
    fun fullCapacityMah(): Int? {
        if (!converged()) return null
        if (sxx == 0L) return null
        val kUahPerPct = sxy.toDouble() / sxx
        val fullMah = Math.round(kUahPerPct * 100 / 1000.0).toInt()
        return if (fullMah in MIN_PLAUSIBLE_FULL_MAH..MAX_PLAUSIBLE_FULL_MAH) fullMah else null
    }

    fun confidence(): Confidence = when {
        spanPct >= HIGH_SPAN_PCT && n >= HIGH_SAMPLES -> Confidence.HIGH
        converged() -> Confidence.MEDIUM
        else -> Confidence.PENDING
    }

    fun sampleCount(): Int = n

    /** 回归通道状态标注 (健康档案卡/采集链路卡展示；n=0 返回空串不占位) */
    fun infoLabel(): String =
        if (n == 0) "" else "n=$n · ${confidence().label}"

    /** 测试隔离：清空统计量与持久化 */
    fun resetForTest() {
        n = 0; sx = 0; sy = 0; sxx = 0; sxy = 0; spanPct = 0
        lastPerc = -1; lastCounterUah = 0
        persist()
    }

    private fun converged(): Boolean = n >= MIN_SAMPLES && spanPct >= MEDIUM_SPAN_PCT

    private fun persist() {
        prefs.edit()
            .putInt("reg_n", n)
            .putLong("reg_sx", sx)
            .putLong("reg_sy", sy)
            .putLong("reg_sxx", sxx)
            .putLong("reg_sxy", sxy)
            .putInt("reg_span", spanPct)
            .apply()
    }
}
