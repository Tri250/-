package com.battery.master.service

import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * v2.0.0-alpha 批次B：电池健康度引擎 (双通道共享，进程内单例)
 *
 * 解决 v1.x 的两大"估值天花板"：
 * 1. **动态内阻实测**——旧实现内阻为纯工程估算公式 (14.8 + 循环老化 + 高温附加)。
 *    真实内阻可由运行时遥测流测算：端口电压随电流变化的部分即内阻压降，
 *    统一模型 V = OCV + I·R 对充电 (I>0) 与放电 (I<0) 同时成立，
 *    对滑窗样本做最小二乘回归，斜率 dV/dI (mV/mA) × 1000 = R (mΩ)。
 *    样本窗口、电流跨度与回归结果三重守卫，样本不足显式降级工程估算；
 * 2. **循环寿命预测**——旧实现只有循环计数原始值。基线模型
 *    (常规锂聚合物 800 次完整循环后 SOH≈80%，即 0.025%/次) 叠加温度压力项
 *    (平均温度每高出 25℃ 基线 1℃，单次循环损耗上调 2%)，
 *    由实测健康度外推剩余健康循环数。
 *
 * 诚实性红线 (承接 v1.2.x 审计口径)：
 * - 置信度三级显式标注，样本不足不冒充实测，回归越界清窗重来不展示脏值；
 * - 健康度未实测 (0.92 兜底) 时循环预测直接返回 null，估算值不做外推放大。
 */
internal object BatteryHealthEngine {

    /** 内阻测算置信度三级 (诚实分级：样本/跨度不足一律 UNAVAILABLE) */
    enum class ResistanceConfidence(val label: String) {
        HIGH("高置信"),
        MEDIUM("中置信"),
        LOW("低置信"),
        UNAVAILABLE("不可用")
    }

    /** 内阻测算快照：双通道与 HardwareInfoResolver 共享 */
    data class ResistanceSnapshot(
        val resistanceMohm: Float?,
        val confidence: ResistanceConfidence,
        val sampleCount: Int,
        val currentSpanMa: Int
    ) {
        /** UI 来源标注：有实测带置信度与样本量，无实测显式回到工程估算 */
        val sourceLabel: String
            get() = when (confidence) {
                ResistanceConfidence.UNAVAILABLE -> "[工程估算]"
                else -> "[运行时测算·${confidence.label} n=$sampleCount]"
            }
    }

    // ===== 采样窗口配置 =====

    /** 滑窗上限 (样本)：1Hz 遥测下约 96 秒，窗口过长会混入 SoC 漂移污染斜率 */
    private const val MAX_SAMPLES = 96

    /** 参与回归的最小 |电流| (mA)：浮充/静置电流不携带内阻信息 */
    private const val MIN_SAMPLE_CURRENT_MA = 150

    /** 回归结果物理合理区间 (mΩ)：量产手机电芯整包 2~200 mΩ，越界视为窗口污染 */
    private const val MIN_RESISTANCE_MOHM = 2f
    private const val MAX_RESISTANCE_MOHM = 200f

    // 置信度阈值：样本数 × 电流跨度 (跨度不足时斜率方差无意义)
    private const val SAMPLES_HIGH = 40
    private const val SAMPLES_MEDIUM = 20
    private const val SAMPLES_LOW = 10
    private const val SPAN_HIGH_MA = 1200
    private const val SPAN_MEDIUM_MA = 600
    private const val SPAN_LOW_MA = 300

    /** 温度 EWMA 平滑系数：1Hz 采样下 ~20 秒收敛 */
    private const val TEMP_EWMA_ALPHA = 0.05f

    // ===== 双极性统一模型样本窗 (I mA, V mV)：V = OCV + I·R，充电/放电斜率同为 +R =====
    private val samples = ArrayDeque<Pair<Int, Int>>()

    @Volatile private var cachedResistanceMohm: Float? = null
    @Volatile private var cachedConfidence = ResistanceConfidence.UNAVAILABLE
    @Volatile private var tempEwmaC = 25f

    /**
     * 遥测喂样入口：轮询通道 (BatteryHardwareReader) 与广播通道 (BatteryReceiver)
     * 每拍解析后调用。无效样本静默丢弃，引擎任何异常不得影响采集主链路
     */
    fun observe(raw: RawBatteryTelemetry) {
        try {
            val current = raw.currentMa ?: return
            val absCurrent = abs(current)
            if (absCurrent < MIN_SAMPLE_CURRENT_MA ||
                absCurrent > BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA
            ) return
            val voltage = raw.voltageMv
            if (voltage !in BatteryTelemetryParser.MIN_PLAUSIBLE_VOLTAGE_MV..
                BatteryTelemetryParser.MAX_PLAUSIBLE_VOLTAGE_MV
            ) return
            // 双通道同拍重复采样去重 (广播+轮询可能在同一秒各喂一次相同读数)
            val last = samples.lastOrNull()
            if (last != null && last.first == current && last.second == voltage) return
            if (samples.size >= MAX_SAMPLES) samples.removeFirst()
            samples.addLast(current to voltage)
            tempEwmaC += (raw.temperatureCelsius - tempEwmaC) * TEMP_EWMA_ALPHA
            recompute()
        } catch (e: Throwable) {
            // 引擎异常静默：采集主链路的稳定性优先级高于健康测算
        }
    }

    /** 当前内阻测算快照 (无有效测算时 resistanceMohm = null + UNAVAILABLE) */
    fun snapshot(): ResistanceSnapshot = ResistanceSnapshot(
        resistanceMohm = cachedResistanceMohm,
        confidence = cachedConfidence,
        sampleCount = samples.size,
        currentSpanMa = if (samples.isEmpty()) 0 else samples.maxOf { it.first } - samples.minOf { it.first }
    )

    /**
     * 滑窗最小二乘回归：斜率 dV/dI (mV/mA) × 1000 = R (mΩ)。
     * 结果越界 → 判为窗口污染 (OCV 漂移/读数跳变)，清窗重来不展示脏值
     */
    private fun recompute() {
        val n = samples.size
        if (n < SAMPLES_LOW) {
            cachedResistanceMohm = null
            cachedConfidence = ResistanceConfidence.UNAVAILABLE
            return
        }
        var sumI = 0.0
        var sumV = 0.0
        for ((i, v) in samples) {
            sumI += i
            sumV += v
        }
        val meanI = sumI / n
        val meanV = sumV / n
        var covariance = 0.0
        var varianceI = 0.0
        for ((i, v) in samples) {
            val di = i - meanI
            covariance += di * (v - meanV)
            varianceI += di * di
        }
        if (varianceI < 1e-6) {
            cachedResistanceMohm = null
            cachedConfidence = ResistanceConfidence.UNAVAILABLE
            return
        }
        val resistanceMohm = ((covariance / varianceI) * 1000.0).toFloat()
        val span = samples.maxOf { it.first } - samples.minOf { it.first }
        if (resistanceMohm !in MIN_RESISTANCE_MOHM..MAX_RESISTANCE_MOHM) {
            samples.clear()
            cachedResistanceMohm = null
            cachedConfidence = ResistanceConfidence.UNAVAILABLE
            return
        }
        cachedResistanceMohm = resistanceMohm
        cachedConfidence = when {
            n >= SAMPLES_HIGH && span >= SPAN_HIGH_MA -> ResistanceConfidence.HIGH
            n >= SAMPLES_MEDIUM && span >= SPAN_MEDIUM_MA -> ResistanceConfidence.MEDIUM
            n >= SAMPLES_LOW && span >= SPAN_LOW_MA -> ResistanceConfidence.LOW
            else -> ResistanceConfidence.UNAVAILABLE
        }
        if (cachedConfidence == ResistanceConfidence.UNAVAILABLE) cachedResistanceMohm = null
    }

    /**
     * 循环寿命预测 (批次B)。
     *
     * @param healthPercentage 当前健康度 (%)
     * @param cycleCount 循环计数
     * @param healthMeasured 健康度是否实测 (当前容量 sysfs 实测 + 设计容量非兜底)——
     *        仅实测健康度参与外推，0.92 降级估算不做预测放大
     * @return 预测文案 (如 "预计还可循环约 480 次 [模型预测]")；不可预测返回 null
     */
    fun forecastText(healthPercentage: Float, cycleCount: Int, healthMeasured: Boolean): String? {
        if (!healthMeasured) return null
        // 温度压力项：窗口期平均温度每高出 25℃ 基线 1℃，单次循环损耗上调 2%
        val tempStress = 1f + max(0f, tempEwmaC - 25f) * 0.02f
        val costPerCycle = 0.025f * tempStress
        val remaining = ((healthPercentage - 80f) / costPerCycle).toInt()
        if (remaining <= 0) return null
        return "预计还可循环约 ${min(remaining, 4000)} 次 [模型预测]"
    }

    /** 测试隔离：清空滑窗与缓存 (引擎为进程级单例) */
    internal fun resetForTest() {
        samples.clear()
        cachedResistanceMohm = null
        cachedConfidence = ResistanceConfidence.UNAVAILABLE
        tempEwmaC = 25f
    }
}
