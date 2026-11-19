package com.battery.master.service

import java.util.Locale
import kotlin.math.pow

/**
 * 电压-寿命应力磨损模型 (v2.2.1，Choi 2002 + Asakura 2003 公开方法学全量实施)
 *
 * 全部参数溯源至公开一手文献，与 AccuBattery 官方公开方法学 (Charging - research
 * and methodology, accubattery.zendesk.com/hc/en-us/articles/210224725) 同源：
 *
 * - **物理机制** (Choi, S.S. & Lim, H.S. 2002, "Factors that affect cycle-life and
 *   possible degradation mechanisms of a Li-ion cell based on LiCoO2",
 *   J. Power Sources 111(1):130-136, doi:10.1016/s0378-7753(02)00305-1)：
 *   3.92V 以下由碳负极 SEI 表面钝化主导 (电压无关机制)；3.92V 以上由电解液氧化
 *   在正极活性材料累积阻抗层主导 (电压相关机制)；
 * - **量化规律** (Choi 2002 Fig.1；Asakura, K. et al. 2003, J. Power Sources
 *   119-121:902-905 交叉验证 "约 -0.1V 充电电压使电池寿命翻倍")：
 *   3.92V 以上充电截止电压每 +0.10V，循环寿命约减半；
 * - **实验条件** (Choi 2002 Fig.1 caption)：1C 恒流充至截止电压 + 该电压下 CV
 *   浮充 2.5h + 1C 放电至 2.75V 为一个完整循环；CV 浮充段为主要伤害源
 *   (Choi 2002 Fig.2：CC 段到 4.2V 本身衰减有限，恒压保持期造成大部分损伤)；
 * - **量化下限** (AccuBattery 官方方法学明文)：3.95V 以下电压无关机制 (SEI 钝化)
 *   的效应未量化，按线性磨损假设处理——本模型将速率钳制于 rate(3.95V) 不再下降。
 *
 * 与 AccuBattery 会话终点法的实施差异：AccuBattery 按会话终点电压一次性计费
 * (wear = 1/2^(10·(Vmax−Vend)))；本模型利用本应用独有的连续实测电压遥测，
 * 对充电/满充保持期做时间离散积分 (rate × dt / 2.5h)——高压暴露的**时长**与
 * **电压幅值**同时参与累积，Choi Fig.2 认定的主要伤害段 (CV 保持) 可被连续追踪。
 *
 * 换算基准：**1 磨损循环 ≡ 4.2V 恒压暴露 2.5h** (Choi 2002 实验条件的直接映射)。
 * 本模型全部输出为 [模型预测]，非硬件实测值——调用方 (UI) 必须显式标注，
 * 电压不可测时诚实返回 null 不输出。
 */
internal object VoltageStressWearModel {

    /** 相对速率参考电压：rate(4.2V) = 1.0 基准 */
    const val REFERENCE_VOLTAGE_MV = 4200

    /** Choi 双机制拐点：高压暴露 (>3.92V) 累计计数起点 */
    const val STRESS_KNEE_MV = 3920

    /** 量化下限 (AccuBattery 公开方法学)：3.95V 以下速率钳制 (机制效应未量化) */
    const val QUANTIFIED_FLOOR_MV = 3950

    /** Choi 2002 实验条件：每循环 CV 浮充 2.5h——1 磨损循环的时长换算基准 (毫秒) */
    const val CYCLE_EQUIVALENT_MS = 2.5 * 3_600_000.0

    /** 有效读数域：超出锂电池正常工作域的电压读数视为毛刺 (部分 ROM 的
     *  voltage_now 读的是 VBUS 总线端而非电池端，如 DC 直充路径可达 8V+，
     *  此类读数不参与磨损积分——电池端电压不可信即不积分) */
    private const val MIN_VALID_MV = 3000
    private const val MAX_VALID_MV = 4600

    /**
     * 相对磨损速率 rate(V) = 2^(10·(V−4.2))——由 Choi 2002 / Asakura 2003
     * "每 0.1V 寿命减半" 规律直接反演 (每 -0.1V 速率减半)。
     *
     * - 4.2V → ×1.00 (基准)；4.3V → ×2.00；4.1V → ×0.50；
     * - 3.95V 以下钳制于 rate(3.95V) ≈ ×0.18 (SEI 钝化机制未量化，不虚构速率曲线)；
     * - 电压超出有效读数域返回 null (诚实不输出)。
     */
    fun relativeWearRate(voltageMv: Int): Double? {
        if (voltageMv < MIN_VALID_MV || voltageMv > MAX_VALID_MV) return null
        val effective = voltageMv.coerceAtLeast(QUANTIFIED_FLOOR_MV)
        return 2.0.pow(10.0 * (effective - REFERENCE_VOLTAGE_MV) / 1000.0)
    }

    /**
     * 恒压暴露的等效磨损循环：rate(V) × durationMs / 2.5h。
     * 4.2V 暴露 2.5h = 1.0 磨损循环 (Choi 2002 实验条件)；电压无效返回 null；
     * durationMs <= 0 返回 0.0 (无暴露无磨损)
     */
    fun wearCyclesFor(voltageMv: Int, durationMs: Long): Double? {
        val rate = relativeWearRate(voltageMv) ?: return null
        if (durationMs <= 0L) return 0.0
        return rate * durationMs / CYCLE_EQUIVALENT_MS
    }

    /** 相对速率展示文案 (×1.00 / ×2.83，US locale 保证小数点) */
    fun rateLabel(rate: Double): String = String.format(Locale.US, "×%.2f", rate)
}
