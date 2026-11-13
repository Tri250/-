package com.battery.master

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import com.battery.master.service.BatteryCapacityRegressor
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * v2.0.0-alpha.4：库仑计积分回归实测满充容量——纯物理通道回归测试
 *
 * 覆盖：
 * 1. 放电序列 OLS 收敛：合成已知容量 (4800 mAh) 的电荷积分序列 → 回归值收敛、
 *    置信分级正确；
 * 2. 诚实门限：跨度不足 (PENDING) 不输出任何数值；
 * 3. 质量门限：校准跳变 (Δp/Δc 异号)、离群样本 (隐含满容量越界) 全部拒绝；
 * 4. 断档跳段：电荷读数中断不产生跨断档污染样本；
 * 5. 统计量跨实例持久化 (模拟进程重启，越用越准的真实语义)。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class BatteryCapacityRegressorTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    /** 合成电荷积分序列：满容量 F mAh、百分比 p → 电荷 = F×p/100 mAh = F×p×10 μAh */
    private fun counterUah(fullMah: Int, percentage: Int): Long = fullMah.toLong() * percentage * 10L

    @Before
    fun reset() {
        BatteryCapacityRegressor(app).resetForTest()
    }

    // ===== 1. 放电序列 OLS 收敛 =====

    @Test
    fun regression_dischargeSeries_convergesToTrueCapacity() {
        val regressor = BatteryCapacityRegressor(app)
        // p 100→64：每百分点 Δc = 48000 μAh (4800 mAh 真实容量)，带少量量化噪声
        for (p in 100 downTo 64) {
            val noise = if (p % 7 == 0) 800L else 0L   // ±0.8 mAh 级读数噪声
            regressor.observe(p, counterUah(4800, p) + noise)
        }
        assertEquals(36, regressor.sampleCount())
        assertEquals(BatteryCapacityRegressor.Confidence.MEDIUM, regressor.confidence())
        val full = regressor.fullCapacityMah()
        assertTrue("回归必须收敛到 4800 mAh 附近，实际 $full", full != null && kotlin.math.abs(full - 4800) <= 10)
        assertTrue(regressor.infoLabel().contains("n=36"))
        assertTrue(regressor.infoLabel().contains("中置信"))
    }

    @Test
    fun confidence_highAfterWideSpan() {
        val regressor = BatteryCapacityRegressor(app)
        for (p in 100 downTo 15) {
            regressor.observe(p, counterUah(4800, p))
        }
        // 跨度 85 ≥ 80 且样本 ≥ 12 → 高置信
        assertEquals(BatteryCapacityRegressor.Confidence.HIGH, regressor.confidence())
        assertTrue(regressor.infoLabel().contains("高置信"))
    }

    // ===== 2. 诚实门限：跨度不足不输出 =====

    @Test
    fun pending_spanTooNarrow_returnsNull() {
        val regressor = BatteryCapacityRegressor(app)
        for (p in 100 downTo 92) {   // 跨度仅 8 < 30
            regressor.observe(p, counterUah(4800, p))
        }
        assertEquals(8, regressor.sampleCount())
        assertEquals(BatteryCapacityRegressor.Confidence.PENDING, regressor.confidence())
        assertNull("跨度不足不得输出回归结果 (诚实不输出)", regressor.fullCapacityMah())
        assertTrue("PENDING 态仍展示样本进度", regressor.infoLabel().contains("积累中"))
    }

    // ===== 3. 质量门限：跳变与离群拒绝 =====

    @Test
    fun outlier_andCalibrationJump_rejected() {
        val regressor = BatteryCapacityRegressor(app)
        for (p in 100 downTo 64) {
            regressor.observe(p, counterUah(4800, p))
        }
        val before = regressor.sampleCount()

        // 校准跳变：百分比下降但电荷上升 (物理不可能) → 段拒绝 + 跟踪点重置
        regressor.observe(63, counterUah(4800, 63) + 500_000L)
        assertEquals("异号跳变必须被拒绝", before, regressor.sampleCount())

        // 离群：干净帧重建基准后，注入毛刺提交帧 (隐含满容量 200,000 mAh 越界) → 拒绝
        regressor.observe(62, counterUah(4800, 62))
        regressor.observe(61, counterUah(4800, 61) - 2_000_000L)
        assertEquals("越界离群样本必须被拒绝", before, regressor.sampleCount())

        // 拒绝后重置跟踪点，正常样本继续积累 (毛刺残留不污染)
        regressor.observe(60, counterUah(4800, 60))
        regressor.observe(59, counterUah(4800, 59))
        assertEquals(before + 1, regressor.sampleCount())
    }

    // ===== 4. 断档跳段 =====

    @Test
    fun counterGap_doesNotProduceCrossGapSamples() {
        val regressor = BatteryCapacityRegressor(app)
        regressor.observe(100, counterUah(4800, 100))
        regressor.observe(95, counterUah(4800, 95))    // 正常样本 1
        // 断档：电荷读数归零 (读数不可用)
        regressor.observe(90, 0L)
        // 断档后恢复：应重新起算，不得产生 95→90 跨断档大 Δ 样本
        regressor.observe(90, counterUah(4800, 90))
        regressor.observe(89, counterUah(4800, 89))    // 正常样本 2
        assertEquals(2, regressor.sampleCount())
    }

    // ===== 5. 统计量跨实例持久化 =====

    @Test
    fun stats_surviveProcessRestart() {
        val first = BatteryCapacityRegressor(app)
        for (p in 100 downTo 64) {
            first.observe(p, counterUah(4800, p))
        }
        val firstFull = first.fullCapacityMah()

        // 模拟进程重启：全新实例从 SharedPreferences 恢复 OLS 统计量
        // (lastPerc 跟踪点属进程内存态，重启后首帧重新建立——语义正确)
        val restarted = BatteryCapacityRegressor(app)
        assertEquals(first.sampleCount(), restarted.sampleCount())
        assertEquals(first.confidence(), restarted.confidence())
        assertEquals(firstFull, restarted.fullCapacityMah())
        // 重启后首帧仅建立跟踪点，第二帧起样本无缝衔接 (统计量跨会话持续积累)
        restarted.observe(63, counterUah(4800, 63))
        assertEquals(first.sampleCount(), restarted.sampleCount())
        restarted.observe(62, counterUah(4800, 62))
        assertEquals(first.sampleCount() + 1, restarted.sampleCount())
    }

    // ===== 6. resetForTest 清空 =====

    @Test
    fun reset_clearsAllStats() {
        val regressor = BatteryCapacityRegressor(app)
        regressor.observe(100, counterUah(4800, 100))
        regressor.observe(99, counterUah(4800, 99))
        assertTrue(regressor.sampleCount() > 0)
        regressor.resetForTest()
        assertEquals(0, regressor.sampleCount())
        assertNull(regressor.fullCapacityMah())
        assertEquals("", regressor.infoLabel())
    }
}
