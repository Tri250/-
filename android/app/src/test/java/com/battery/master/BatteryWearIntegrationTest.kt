package com.battery.master

import android.app.Application
import android.content.Intent
import android.os.BatteryManager
import android.os.Looper
import androidx.test.core.app.ApplicationProvider
import com.battery.master.service.BatterySysfs
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowSystemClock
import java.time.Duration
import kotlin.math.abs

/**
 * v2.2.2 磨损模型 VM 级集成验收：广播充电帧 → 发布链路喂样 → 快照累积 →
 * 用户清除操作 → 快照归零 + 持久化同步清除 + 采集链路恢复。
 *
 * 与 BatteryWearTrackerTest (组件级) 互补：本文件锁定"操作链路完整闭环"——
 * 用户可见的唯一写操作 (清除) 与唯一读路径 (wearSnapshot) 端到端一致。
 *
 * 时序说明：Robolectric PAUSED looper 下 sticky 广播挂起，须显式 idle 交付；
 * VM 发布链路带 400ms 节流门且 poll 循环 (1Hz) 与广播帧存在交错——测试统一
 * 采用"等距推进多帧"模式 (每帧前 500ms 虚拟时钟 + idle)，保证无论 poll 抢占
 * 节流门还是 dt=0 同拍去重，必有一次 dt>0 的积分发生 (见 sendChargingFrames)
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class BatteryWearIntegrationTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    @Before
    fun setUp() {
        // sysfs 探测链清空：电压走 EXTRA_VOLTAGE 广播通道 (与真实设备广播路径一致)
        BatterySysfs.installProbeResultForTest(emptyList())
    }

    @After
    fun tearDown() {
        BatterySysfs.installProbeResultForTest(emptyList())
    }

    private fun batteryIntent(block: Intent.() -> Unit): Intent =
        Intent(Intent.ACTION_BATTERY_CHANGED).apply(block)

    private fun advanceAndIdle(ms: Long) {
        ShadowSystemClock.advanceBy(Duration.ofMillis(ms))
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    /**
     * 等距推进多帧充电广播 (每帧前推进 500ms 虚拟时钟并 idle)。
     *
     * 时序鲁棒性说明：VM 发布链路带 400ms 节流门，poll 循环 (1Hz) 与广播帧
     * 存在交错——单帧序列可能被 poll 发布抢占节流门或 dt=0 被同拍去重门跳过
     * (Robolectric 虚拟时钟下 stamped 与 elapsed 同步推进，本地/CI 表现不一致)。
     * 等距多帧保证：每一帧要么自身通过节流门并产生 dt>0 积分，要么抢占方
     * (poll 发布) 代为积分——sampleCount>0 不依赖具体交错时序
     */
    private fun sendChargingFrames(count: Int, startLevel: Int = 50) {
        repeat(count) { i ->
            advanceAndIdle(500)
            sendChargingFrame(startLevel + i)
        }
    }

    /** 一帧充电态广播 (4.2V 满压 CV 段附近，rate=×1.00) */
    private fun sendChargingFrame(level: Int) {
        app.sendStickyBroadcast(
            batteryIntent {
                putExtra(BatteryManager.EXTRA_LEVEL, level)
                putExtra(BatteryManager.EXTRA_SCALE, 100)
                putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
                putExtra(BatteryManager.EXTRA_PLUGGED, BatteryManager.BATTERY_PLUGGED_USB)
                putExtra(BatteryManager.EXTRA_VOLTAGE, 4_200_000) // μV 注入 → 4200 mV
            }
        )
        Shadows.shadowOf(Looper.getMainLooper()).idle()
    }

    /**
     * 闭环读路径：充电帧经 BatteryReceiver → VM publish → wearTracker.observe
     * → wearSnapshot StateFlow 实时刷新 (速率/累计/样本数三项一致)
     */
    @Test
    fun chargingFrames_accumulateWearSnapshotEndToEnd() {
        val vm = BatteryViewModel(app)
        sendChargingFrames(4)

        val snap = vm.wearSnapshot.value
        assertTrue("充电帧必须经发布链路积分", snap.sampleCount > 0)
        assertTrue("累计等效磨损循环 >0", snap.accumulatedWearCycles > 0.0)
        assertTrue("4.2V 基准速率 = ×1.00", snap.lastRate != null && abs(snap.lastRate!! - 1.0) < 1e-9)
    }

    /** 闭环写路径：清除操作 → 快照归零 + prefs 同步清除 + 采集链路恢复 */
    @Test
    fun clearWearData_closesUserOperationLoop() {
        val vm = BatteryViewModel(app)
        sendChargingFrames(4)
        assertTrue("前置条件：已有积分数据", vm.wearSnapshot.value.sampleCount > 0)

        vm.clearWearData()
        val cleared = vm.wearSnapshot.value
        assertEquals("快照样本数归零", 0L, cleared.sampleCount)
        assertEquals("快照累计归零", 0.0, cleared.accumulatedWearCycles, 0.0)
        assertEquals("快照高压暴露归零", 0L, cleared.highStressMs)
        assertNull("快照速率归零 (不可测态)", cleared.lastRate)

        // 持久化同步：新实例恢复零态 (无残留半值——reset 清除 prefs 整文件)
        val restarted = BatteryViewModel(app)
        assertEquals("跨实例恢复零态", 0L, restarted.wearSnapshot.value.sampleCount)
        assertEquals(0.0, restarted.wearSnapshot.value.accumulatedWearCycles, 0.0)

        // 清除不破坏采集链路：后续充电帧重新积分
        sendChargingFrames(4)
        assertTrue("恢复后新帧重新积分", restarted.wearSnapshot.value.sampleCount > 0)
    }

    /** 等距推进多帧放电广播 */
    private fun sendDischargingFrames(count: Int) {
        repeat(count) { i ->
            advanceAndIdle(500)
            app.sendStickyBroadcast(
                batteryIntent {
                    putExtra(BatteryManager.EXTRA_LEVEL, 80 - i)
                    putExtra(BatteryManager.EXTRA_SCALE, 100)
                    putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_DISCHARGING)
                    putExtra(BatteryManager.EXTRA_VOLTAGE, 4_200_000)
                }
            )
            Shadows.shadowOf(Looper.getMainLooper()).idle()
        }
    }

    /** 等距推进多帧"双通道电压不可读"充电广播 */
    private fun sendUnmeasuredVoltageFrames(count: Int) {
        repeat(count) {
            advanceAndIdle(500)
            app.sendStickyBroadcast(
                batteryIntent {
                    putExtra(BatteryManager.EXTRA_LEVEL, 50)
                    putExtra(BatteryManager.EXTRA_SCALE, 100)
                    putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
                    putExtra(BatteryManager.EXTRA_PLUGGED, BatteryManager.BATTERY_PLUGGED_USB)
                    // 不设 EXTRA_VOLTAGE + sysfs 空探测 → 双通道不可读
                }
            )
            Shadows.shadowOf(Looper.getMainLooper()).idle()
        }
    }

    /**
     * 放电帧不积分 (模型口径为充电应力)：整段放电广播后快照保持零态，
     * 防止"任何状态都累积磨损"的失实模型行为；速率照常可算 (UI 实时展示)
     */
    @Test
    fun dischargingFrames_doNotAccumulate() {
        val vm = BatteryViewModel(app)
        vm.clearWearData() // 隔离前置用例残留 (prefs 跨实例共享)
        sendDischargingFrames(4)

        val snap = vm.wearSnapshot.value
        assertEquals("放电帧不计积分", 0L, snap.sampleCount)
        assertEquals(0.0, snap.accumulatedWearCycles, 0.0)
        assertTrue("速率照常可算 (UI 实时展示当前电压速率)", snap.lastRate != null && abs(snap.lastRate!! - 1.0) < 1e-9)
    }

    /** 电压不可测帧：速率诚实返回 null，且不积分 (双通道均不可读降级) */
    @Test
    fun unmeasuredVoltageFrames_returnNullRate() {
        val vm = BatteryViewModel(app)
        vm.clearWearData()
        sendUnmeasuredVoltageFrames(4)

        val snap = vm.wearSnapshot.value
        assertNull("双通道不可读必须诚实返回 null", snap.lastRate)
        assertEquals(0L, snap.sampleCount)
    }

    /** 初始零态：新 VM 实例 (prefs 已清) 快照全零 */
    @Test
    fun wearSnapshot_initialStateIsZero() {
        BatteryViewModel(app).clearWearData()
        val snap = BatteryViewModel(app).wearSnapshot.value
        assertEquals(0L, snap.sampleCount)
        assertEquals(0.0, snap.accumulatedWearCycles, 0.0)
        assertEquals(0L, snap.highStressMs)
        assertNull(snap.lastRate)
    }
}
