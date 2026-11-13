package com.battery.master

import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryStatus
import com.battery.master.service.BatteryHealthEngine
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.service.RawBatteryTelemetry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * v2.0.0-alpha 批次B：电池健康度引擎回归测试 (纯 JVM，无 Robolectric)
 *
 * 覆盖：
 * 1. ΔV/ΔI 滑窗回归——合成样本 (已知内阻) 下实测值收敛、置信度分级正确；
 * 2. 双极性统一模型——放电 (I<0) 与混合极性斜率同为 +R；
 * 3. 诚实降级——样本不足 / 电流无跨度 (varI≈0) 一律 UNAVAILABLE 不冒充实测；
 * 4. 脏窗口防护——回归斜率越出物理区间清窗重来，不展示污染值；
 * 5. 采样守卫——浮充电流 (|I|<150mA)、电流不可读 (null)、双通道同拍重复样本拒绝；
 * 6. 循环寿命预测——仅实测健康度参与外推，估算健康度 (0.92 兜底) 返回 null。
 */
class BatteryHealthEngineTest {

    @Before
    fun resetEngine() {
        BatteryHealthEngine.resetForTest()
    }

    /** 构造最小遥测快照 (仅引擎消费字段有效) */
    private fun telemetry(
        currentMa: Int?,
        voltageMv: Int = 4000,
        temperatureCelsius: Float = 25f
    ): RawBatteryTelemetry = RawBatteryTelemetry(
        percentage = 58,
        status = BatteryStatus.CHARGING,
        isCharging = true,
        temperatureCelsius = temperatureCelsius,
        healthQuality = BatteryHealthQuality.GOOD,
        voltageMv = voltageMv,
        currentMa = currentMa,
        cycleCount = 120,
        designCapacityMah = 5000,
        currentCapacityMah = 4600,
        hasMeasuredCapacity = true,
        remainingCapacityMah = 2600,
        healthPercentage = 92f,
        powerWatts = currentMa?.let { voltageMv * it / 1_000_000f },
        isFullChargeConditionMet = false
    )

    // ===== 1. ΔV/ΔI 回归：已知内阻收敛 + 高置信分级 =====

    @Test
    fun regression_knownResistance_convergesWithHighConfidence() {
        // R = 30 mΩ → 斜率 0.03 mV/mA：充电 I 每档 100 mA，V = 4000 + I×30/1000 (整值无舍入噪声)
        for (k in 0..44) {
            val i = 1000 + k * 100               // 1000..5400 mA，跨度 4400 ≥ 1200
            BatteryHealthEngine.observe(telemetry(currentMa = i, voltageMv = 4000 + i * 30 / 1000))
        }
        val snapshot = BatteryHealthEngine.snapshot()
        assertTrue("实测内阻必须输出", snapshot.resistanceMohm != null)
        assertTrue(
            "回归收敛到 30 mΩ 附近，实际 ${snapshot.resistanceMohm}",
            kotlin.math.abs(snapshot.resistanceMohm!! - 30f) < 1.5f
        )
        assertEquals(BatteryHealthEngine.ResistanceConfidence.HIGH, snapshot.confidence)
        assertEquals(45, snapshot.sampleCount)
        assertEquals(4400, snapshot.currentSpanMa)
        // UI 标注链路：实测态带置信度与样本量
        assertTrue(snapshot.sourceLabel.contains("高置信"))
        assertTrue(snapshot.sourceLabel.contains("n=45"))
    }

    // ===== 2. 双极性统一模型：放电样本斜率同为 +R =====

    @Test
    fun regression_dischargePolarity_sameSlope() {
        // 放电 I<0：V = OCV + I·R，I=-1000 → 3970 (R=30mΩ)
        for (k in 0..44) {
            val i = -(1000 + k * 100)
            BatteryHealthEngine.observe(telemetry(currentMa = i, voltageMv = 4000 + i * 30 / 1000))
        }
        val snapshot = BatteryHealthEngine.snapshot()
        assertTrue(
            "放电极性回归同样收敛到 30 mΩ，实际 ${snapshot.resistanceMohm}",
            snapshot.resistanceMohm != null && kotlin.math.abs(snapshot.resistanceMohm!! - 30f) < 1.5f
        )
        assertEquals(BatteryHealthEngine.ResistanceConfidence.HIGH, snapshot.confidence)
    }

    @Test
    fun regression_mixedPolarity_slopeRemainsPositiveR() {
        // 混合极性窗口 (充电+放电交替)：模型 V = OCV + I·R 对两种极性统一成立
        for (k in 0..44) {
            val i = if (k % 2 == 0) 1000 + k * 100 else -(1000 + k * 100)
            BatteryHealthEngine.observe(telemetry(currentMa = i, voltageMv = 4000 + i * 30 / 1000))
        }
        val snapshot = BatteryHealthEngine.snapshot()
        assertTrue(
            "混合极性回归同样收敛到 30 mΩ，实际 ${snapshot.resistanceMohm}",
            snapshot.resistanceMohm != null && kotlin.math.abs(snapshot.resistanceMohm!! - 30f) < 2f
        )
    }

    // ===== 3. 诚实降级：样本不足 / 无电流跨度 =====

    @Test
    fun sparseSamples_reportsUnavailable_notFabricated() {
        for (k in 0..4) {
            BatteryHealthEngine.observe(telemetry(currentMa = 1000 + k * 500, voltageMv = 4030 + k * 15))
        }
        val snapshot = BatteryHealthEngine.snapshot()
        assertNull("样本不足不得输出实测内阻", snapshot.resistanceMohm)
        assertEquals(BatteryHealthEngine.ResistanceConfidence.UNAVAILABLE, snapshot.confidence)
        assertEquals("[工程估算]", snapshot.sourceLabel)
    }

    @Test
    fun flatCurrent_noMeaningfulSpan_reportsUnavailable() {
        // 电流仅在 ±1 mA 抖动且电压恒定：斜率退化为 0 (越界清窗) 或跨度不足，
        // 两种路径都必须诚实降级，不得输出 0 mΩ 假实测
        for (k in 0..44) {
            BatteryHealthEngine.observe(telemetry(currentMa = 2000 + (k % 2), voltageMv = 4060))
        }
        val snapshot = BatteryHealthEngine.snapshot()
        assertNull(snapshot.resistanceMohm)
        assertEquals(BatteryHealthEngine.ResistanceConfidence.UNAVAILABLE, snapshot.confidence)
    }

    @Test
    fun lowSpan_smallSamples_reportsUnavailable() {
        // 样本数充足 (25) 但电流跨度仅 200 (<300 最低门限)：斜率方差无意义，诚实降级。
        // 注：跨度 300~600 区间会正确落入 LOW 低置信档 (有输出但显式标注)，不属降级
        for (k in 0..24) {
            val i = 2000 + (k % 3) * 100   // 2000..2200，跨度 200
            BatteryHealthEngine.observe(telemetry(currentMa = i, voltageMv = 4060 + (k % 3) * 3))
        }
        val snapshot = BatteryHealthEngine.snapshot()
        assertNull("跨度不足不得输出实测内阻", snapshot.resistanceMohm)
        assertEquals(BatteryHealthEngine.ResistanceConfidence.UNAVAILABLE, snapshot.confidence)
        assertEquals("[工程估算]", snapshot.sourceLabel)
    }

    // ===== 4. 脏窗口防护：回归越界清窗重来 =====

    @Test
    fun outlierSlope_clearsWindow_insteadOfDisplayingDirtyValue() {
        // 合成污染：V 随 I 剧烈跳变 (斜率 1 mV/mA = 1000 mΩ，远超 200 mΩ 物理上限)
        for (k in 0..9) {
            val i = 1000 + k * 100
            BatteryHealthEngine.observe(telemetry(currentMa = i, voltageMv = 4000 + i))
        }
        var snapshot = BatteryHealthEngine.snapshot()
        assertNull("越界回归不得展示脏值", snapshot.resistanceMohm)
        assertEquals("污染窗口在回归越界拍必须清空", 0, snapshot.sampleCount)
        assertEquals(BatteryHealthEngine.ResistanceConfidence.UNAVAILABLE, snapshot.confidence)

        // 清窗后引擎可恢复：正常样本重新收敛到真实内阻 (30 mΩ)
        for (k in 0..44) {
            val i = 1000 + k * 100
            BatteryHealthEngine.observe(telemetry(currentMa = i, voltageMv = 4000 + i * 30 / 1000))
        }
        snapshot = BatteryHealthEngine.snapshot()
        assertTrue(
            "清窗后引擎必须可恢复，实际 ${snapshot.resistanceMohm}",
            snapshot.resistanceMohm != null && kotlin.math.abs(snapshot.resistanceMohm!! - 30f) < 1.5f
        )
    }

    // ===== 5. 采样守卫 =====

    @Test
    fun observationGuard_trickleNullAndDuplicatesRejected() {
        // 浮充电流 (|I| < 150mA)：不携带内阻信息
        BatteryHealthEngine.observe(telemetry(currentMa = 16, voltageMv = 4380))
        // 电流不可读：拒绝
        BatteryHealthEngine.observe(telemetry(currentMa = null, voltageMv = 4030))
        // 合法样本进入窗口
        BatteryHealthEngine.observe(telemetry(currentMa = 2000, voltageMv = 4060))
        assertEquals(1, BatteryHealthEngine.snapshot().sampleCount)
        // 双通道同拍重复样本 (广播+轮询同一秒喂相同读数)：去重
        BatteryHealthEngine.observe(telemetry(currentMa = 2000, voltageMv = 4060))
        assertEquals("重复读数不得计入窗口", 1, BatteryHealthEngine.snapshot().sampleCount)
    }

    // ===== 6. 循环寿命预测：仅实测健康度参与外推 =====

    @Test
    fun forecast_estimatedHealth_returnsNull() {
        // 0.92 降级估算的健康度不做外推——估算值不得被放大成"精确的剩余循环数"
        assertNull(BatteryHealthEngine.forecastText(healthPercentage = 92f, cycleCount = 300, healthMeasured = false))
    }

    @Test
    fun forecast_measuredHealth_projectsRemainingCycles() {
        // 实测 92%：剩余 (92-80)/0.025 = 480 次
        val text = BatteryHealthEngine.forecastText(healthPercentage = 92f, cycleCount = 300, healthMeasured = true)
        assertTrue(text != null && text.contains("预计还可循环约 480 次"))
        assertTrue(text!!.contains("[模型预测]"))
    }

    @Test
    fun forecast_belowBaseline_returnsNull() {
        // 健康度已低于 80% 基线：无可预测的剩余健康循环
        assertNull(BatteryHealthEngine.forecastText(healthPercentage = 79f, cycleCount = 900, healthMeasured = true))
    }

    @Test
    fun forecast_temperatureStress_shortensProjection() {
        // 常温基线 (25℃)：92% → 480 次
        val normal = BatteryHealthEngine.forecastText(healthPercentage = 92f, cycleCount = 300, healthMeasured = true)
        val normalCycles = Regex("约 (\\d+) 次").find(normal!!)!!.groupValues[1].toInt()

        // 高温窗口 (EWMA 逼近 40℃)：损耗上调 → 剩余循环数缩短
        for (k in 0..59) {
            BatteryHealthEngine.observe(telemetry(currentMa = 2000 + k, voltageMv = 4060, temperatureCelsius = 40f))
        }
        val hot = BatteryHealthEngine.forecastText(healthPercentage = 92f, cycleCount = 300, healthMeasured = true)
        val hotCycles = Regex("约 (\\d+) 次").find(hot!!)!!.groupValues[1].toInt()
        assertTrue("高温必须缩短预测寿命 ($hotCycles vs $normalCycles)", hotCycles < normalCycles)
    }

    // ===== 7. 常量口径 =====

    @Test
    fun measuredDesignSources_excludesFallbacks() {
        assertTrue(BatteryTelemetryParser.MEASURED_DESIGN_SOURCES.containsAll(
            listOf(
                com.battery.master.data.CapacitySource.SYSFS,
                com.battery.master.data.CapacitySource.POWER_PROFILE,
                com.battery.master.data.CapacitySource.CALIBRATED
            )
        ))
        assertTrue(!BatteryTelemetryParser.MEASURED_DESIGN_SOURCES.contains(com.battery.master.data.CapacitySource.ESTIMATED))
        assertTrue(!BatteryTelemetryParser.MEASURED_DESIGN_SOURCES.contains(com.battery.master.data.CapacitySource.FALLBACK))
    }
}
