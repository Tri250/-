package com.battery.master

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.service.BatteryWearTracker
import com.battery.master.service.VoltageStressWearModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.math.pow

/**
 * v2.2.1 电压应力磨损积分器行为断言：积分 / 去重 / 断流 / 降级 / 持久化。
 *
 * 语义要点 (与实现注释一一对应)：
 * - 仅充电族 (CHARGING/FULL) 且电压双通道实测帧参与积分；
 * - 同拍双源 (轮询+广播同秒) dt<=0 不重复积分；
 * - 断流段 (dt>120s) 宁可少计不可虚计；
 * - 电压不可测帧断开积分链，恢复帧不得把间隙折算成高压暴露；
 * - prefs 损坏按零重新积分不闪退 (启动闪退治理口径)。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class BatteryWearTrackerTest {

    private lateinit var app: Application
    private lateinit var tracker: BatteryWearTracker

    @Before
    fun setUp() {
        app = ApplicationProvider.getApplicationContext()
        tracker = BatteryWearTracker(app)
    }

    private fun sample(
        ts: Long,
        status: BatteryStatus = BatteryStatus.CHARGING,
        voltageMv: Int = 4200,
        voltageMeasured: Boolean = true
    ) = BatteryState(
        status = status,
        voltageMv = voltageMv,
        voltageMeasured = voltageMeasured,
        sampleTimestampMs = ts
    )

    /** 充电帧积分：4.2V × 60s = 1.0 × 60000/9000000 循环 */
    @Test
    fun chargingFramesAccumulateWearByRateTimesDt() {
        // 首帧只建基线：速率可算 (4.2V=×1.00) 但不积分
        assertEquals(1.0, tracker.observe(sample(ts = 1_000L))!!, 1e-9)
        assertEquals(0.0, tracker.accumulatedWearCycles, 0.0)
        assertEquals(0, tracker.sampleCount)
        val rate = tracker.observe(sample(ts = 61_000L))
        assertEquals("4.2V 基准速率 ×1.00", 1.0, rate!!, 1e-9)
        val expected = 60_000.0 / VoltageStressWearModel.CYCLE_EQUIVALENT_MS
        assertEquals(expected, tracker.accumulatedWearCycles, 1e-12)
        assertEquals(1, tracker.sampleCount)
    }

    /** 高压暴露 (>3.92V) 累计：4.35V 帧间隔计入高压时长 */
    @Test
    fun highStressExposureAccumulatedAboveKnee() {
        tracker.observe(sample(ts = 1_000L, voltageMv = 4350))
        tracker.observe(sample(ts = 31_000L, voltageMv = 4350))
        assertEquals(30_000L, tracker.highStressMs)
        // 4.35V 速率 = 2^1.5，磨损按幅值加权
        val expected = 2.0.pow(1.5) * 30_000.0 / VoltageStressWearModel.CYCLE_EQUIVALENT_MS
        assertEquals(expected, tracker.accumulatedWearCycles, 1e-12)
    }

    /** 放电/未充电帧不计积分且断开积分链 (间隙不计) */
    @Test
    fun dischargingFramesBreakIntegrationChain() {
        tracker.observe(sample(ts = 1_000L))
        tracker.observe(sample(ts = 61_000L))
        val before = tracker.accumulatedWearCycles
        tracker.observe(sample(ts = 121_000L, status = BatteryStatus.DISCHARGING))
        assertEquals("放电帧不计", before, tracker.accumulatedWearCycles, 0.0)
        // 放电 60s 后恢复充电：间隙 (61s→121s) 不计——恢复首帧只建基线
        tracker.observe(sample(ts = 181_000L))
        assertEquals(before, tracker.accumulatedWearCycles, 0.0)
        tracker.observe(sample(ts = 241_000L))
        assertEquals("恢复后只积 60s，不含放电间隙", before + 60_000.0 / VoltageStressWearModel.CYCLE_EQUIVALENT_MS, tracker.accumulatedWearCycles, 1e-12)
    }

    /** FULL (CV 浮充/满充保持) 帧参与积分——Choi 2002 Fig.2 主要伤害段 */
    @Test
    fun fullStatusFramesIntegrate() {
        tracker.observe(sample(ts = 1_000L, status = BatteryStatus.FULL, voltageMv = 4350))
        val rate = tracker.observe(sample(ts = 31_000L, status = BatteryStatus.FULL, voltageMv = 4350))
        assertTrue(rate!! > 1.0)
        assertEquals(30_000L, tracker.highStressMs)
        assertEquals(1, tracker.sampleCount)
    }

    /** 同拍双源去重：dt=0 不重复积分 */
    @Test
    fun duplicateTimestampDoesNotDoubleCount() {
        tracker.observe(sample(ts = 1_000L))
        tracker.observe(sample(ts = 2_000L))
        val before = tracker.accumulatedWearCycles
        tracker.observe(sample(ts = 2_000L))
        assertEquals("同拍重复帧不得重复积分", before, tracker.accumulatedWearCycles, 0.0)
        assertEquals(1, tracker.sampleCount)
    }

    /** 断流防御：dt>120s 的间隔不计 (进程休眠/被杀后恢复，宁少计不虚计) */
    @Test
    fun gapBeyondMaxDtIsDiscarded() {
        tracker.observe(sample(ts = 1_000L))
        tracker.observe(sample(ts = 2_000L))
        val before = tracker.accumulatedWearCycles
        // 断流帧：dt=131s 超上限，该段不计 (基线已刷新)
        tracker.observe(sample(ts = 133_000L))
        assertEquals(before, tracker.accumulatedWearCycles, 0.0)
        // 从新基线继续积分
        tracker.observe(sample(ts = 193_000L))
        assertEquals(before + 60_000.0 / VoltageStressWearModel.CYCLE_EQUIVALENT_MS, tracker.accumulatedWearCycles, 1e-12)
    }

    /** 电压不可测帧：不积分、断链、速率诚实返回 null */
    @Test
    fun unmeasuredVoltageFramesAreExcluded() {
        tracker.observe(sample(ts = 1_000L))
        tracker.observe(sample(ts = 61_000L))
        val before = tracker.accumulatedWearCycles
        val rate = tracker.observe(sample(ts = 91_000L, voltageMeasured = false))
        assertNull("电压不可测必须返回 null (诚实降级)", rate)
        assertEquals(before, tracker.accumulatedWearCycles, 0.0)
        // 恢复实测：间隙 (61s→91s 中电压不可测段) 不计
        tracker.observe(sample(ts = 151_000L))
        tracker.observe(sample(ts = 211_000L))
        assertEquals(before + 60_000.0 / VoltageStressWearModel.CYCLE_EQUIVALENT_MS, tracker.accumulatedWearCycles, 1e-12)
    }

    /** 电压超有效域 (如 VBUS 总线端读数)：速率 null、不积分 */
    @Test
    fun outOfDomainVoltageReturnsNullAndSkips() {
        val rate = tracker.observe(sample(ts = 1_000L, voltageMv = 8200))
        assertNull(rate)
        tracker.observe(sample(ts = 61_000L, voltageMv = 8200))
        assertEquals(0.0, tracker.accumulatedWearCycles, 0.0)
        assertEquals(0, tracker.sampleCount)
    }

    /** 跨进程持久化：flush 后新实例从 prefs 恢复累计值 */
    @Test
    fun persistedAccumulationRestoresAcrossInstances() {
        tracker.observe(sample(ts = 1_000L))
        tracker.observe(sample(ts = 61_000L))
        val expected = tracker.accumulatedWearCycles
        assertTrue(expected > 0.0)
        tracker.flush()

        val restarted = BatteryWearTracker(app)
        assertEquals(expected, restarted.accumulatedWearCycles, 1e-12)
        assertEquals(tracker.highStressMs, restarted.highStressMs)
        assertEquals(tracker.sampleCount, restarted.sampleCount)
        // 恢复后新实例基线独立：继续积分从零基线开始 (不把重启间隙计入)
        assertEquals("恢复实例首帧只建基线，速率照常可算", 1.0, restarted.observe(sample(ts = 100_000L))!!, 1e-9)
        restarted.observe(sample(ts = 160_000L))
        assertEquals(expected + 60_000.0 / VoltageStressWearModel.CYCLE_EQUIVALENT_MS, restarted.accumulatedWearCycles, 1e-12)
    }

    /** prefs 类型污染：按零重新积分，构造不闪退 (启动闪退治理口径) */
    @Test
    fun corruptedPrefsFallBackToZero() {
        app.getSharedPreferences("battery_wear_prefs", android.content.Context.MODE_PRIVATE)
            .edit()
            .putString("wear_accumulated_bits", "garbage")
            .putString("wear_high_stress_ms", "not-a-number")
            .commit()
        val polluted = BatteryWearTracker(app)
        assertEquals(0.0, polluted.accumulatedWearCycles, 0.0)
        assertEquals(0L, polluted.highStressMs)
        // 污染清理后采集链路正常
        polluted.observe(sample(ts = 1_000L))
        polluted.observe(sample(ts = 61_000L))
        assertEquals(60_000.0 / VoltageStressWearModel.CYCLE_EQUIVALENT_MS, polluted.accumulatedWearCycles, 1e-12)
    }

    /**
     * v2.2.2 用户操作闭环：reset 后内存态/prefs/恢复实例三处一致归零，
     * 且采集链路恢复 (无"清了但还在涨"或"清了再也采不到"的坏链路)
     */
    @Test
    fun resetClearsMemoryPersistenceAndKeepsCollection() {
        tracker.observe(sample(ts = 1_000L))
        tracker.observe(sample(ts = 61_000L))
        assertTrue("前置条件：已有积分", tracker.accumulatedWearCycles > 0.0)

        tracker.reset()
        assertEquals("内存累计归零", 0.0, tracker.accumulatedWearCycles, 0.0)
        assertEquals("内存高压暴露归零", 0L, tracker.highStressMs)
        assertEquals("内存样本数归零", 0L, tracker.sampleCount)
        assertNull("内存速率归零", tracker.lastRate)

        // 持久化同步：恢复实例零态
        val restarted = BatteryWearTracker(app)
        assertEquals(0.0, restarted.accumulatedWearCycles, 0.0)
        assertEquals(0L, restarted.highStressMs)
        assertEquals(0L, restarted.sampleCount)

        // 采集链路恢复：reset 后续帧正常积分 (首帧建基线，第二帧计 60s)
        restarted.observe(sample(ts = 2_000L))
        restarted.observe(sample(ts = 62_000L))
        assertEquals(60_000.0 / VoltageStressWearModel.CYCLE_EQUIVALENT_MS, restarted.accumulatedWearCycles, 1e-12)
        assertEquals(1L, restarted.sampleCount)
    }
}
