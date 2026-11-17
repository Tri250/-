package com.battery.master

import android.content.Context
import android.provider.Settings
import androidx.test.core.app.ApplicationProvider
import com.battery.master.service.DeviceUsageTracker
import com.battery.master.service.UsageDurationFormatter
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * v2.1.0 新增：设备使用时长追踪器 (DeviceUsageTracker) + 格式化 (UsageDurationFormatter) 单测
 *
 * 覆盖：
 * - 首拍基线建立不追溯 (进程启动前的时长不计入累计)
 * - 1Hz 虚拟时钟推进累加正确性
 * - 重启检测主信号：BOOT_COUNT 递增 → 累计保留 + elapsed 引用重置
 * - 重启检测回退信号：BOOT_COUNT 不可读时 elapsed 单调回退判定
 * - 持久化往返：新 tracker 实例恢复累计且不重复计数 (连续性)
 * - flush 落盘当前累计段
 * - Settings.Global.BOOT_COUNT 真实读取路径 (Robolectric shadow 注入)
 * - 格式化边界：0/负值/59s/1min/61min/24h/多天
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class DeviceUsageTrackerTest {

    private lateinit var context: Context

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
        // 用例独立：清空共享 prefs 域 (与 BatteryHardwareReader 同文件)
        context.getSharedPreferences("battery_master_prefs", Context.MODE_PRIVATE)
            .edit().clear().commit()
    }

    /** 虚拟时钟 + 虚拟 BOOT_COUNT 的确定性 tracker */
    private fun newTracker(clockMs: Long = 0L, bootCount: Int? = null): DeviceUsageTracker {
        val tracker = DeviceUsageTracker(context)
        var now = clockMs
        tracker.tickerClock = { now }
        if (bootCount != null) tracker.bootCountReader = { bootCount }
        return tracker
    }

    // ==================== 累加语义 ====================

    @Test
    fun `first tick establishes baseline without crediting pre-process time`() {
        val tracker = newTracker(clockMs = 3_600_000L) // 开机已 1 小时，进程刚起
        tracker.tick()
        val snap = tracker.snapshot()
        assertEquals(0L, snap.cumulativeMs)          // 不追溯进程启动前
        assertEquals(3_600_000L, snap.uptimeMs)      // 开机时长真实读钟
        assertFalse(snap.rebootDetected)
    }

    @Test
    fun `accumulates delta across ticks`() {
        var clock = 10_000L
        val tracker = newTracker()
        tracker.tickerClock = { clock }
        tracker.tick() // 基线 10s
        clock = 15_000L
        tracker.tick()
        clock = 25_000L
        tracker.tick()
        assertEquals(15_000L, tracker.snapshot().cumulativeMs)
    }

    @Test
    fun `clock going backwards without reboot signal does not credit negative delta`() {
        var clock = 100_000L
        val tracker = newTracker()
        tracker.tickerClock = { clock }
        tracker.tick()
        clock = 99_000L // 异常回退 (非重启信号：无 BOOT_COUNT 变化、回退幅度未触发 last>now 判定? last=100000>99000 触发)
        tracker.tick()
        // last(100000) > now(99000) → 回退信号判定为重启，累计保留、引用重置
        val snap = tracker.snapshot()
        assertEquals(0L, snap.cumulativeMs)
        assertTrue(snap.rebootDetected)
        assertEquals(99_000L, snap.uptimeMs)
    }

    // ==================== 重启检测 ====================

    @Test
    fun `boot count increase detects reboot and keeps cumulative`() {
        var clock = 5_000L
        var boot = 41
        val tracker = newTracker()
        tracker.tickerClock = { clock }
        tracker.bootCountReader = { boot }
        tracker.tick()
        clock = 15_000L
        tracker.tick()
        assertEquals(10_000L, tracker.snapshot().cumulativeMs)
        assertEquals(41, tracker.snapshot().bootCount)

        // 设备重启：BOOT_COUNT 递增，elapsed 归零重来
        boot = 42
        clock = 2_000L
        tracker.tick()
        val snap = tracker.snapshot()
        assertTrue(snap.rebootDetected)
        assertEquals(10_000L, snap.cumulativeMs)  // 累计保留 (重启间隙不计)
        assertEquals(2_000L, snap.uptimeMs)
        assertEquals(42, snap.bootCount)

        // 重启后继续正常累加
        clock = 12_000L
        tracker.tick()
        assertEquals(20_000L, tracker.snapshot().cumulativeMs)
    }

    @Test
    fun `elapsed monotonic fallback detects reboot when boot count unavailable`() {
        var clock = 80_000L
        val tracker = newTracker()
        tracker.tickerClock = { clock }
        tracker.bootCountReader = { null } // ROM 不提供 BOOT_COUNT
        tracker.tick() // 基线
        clock = 85_000L
        tracker.tick()
        assertEquals(5_000L, tracker.snapshot().cumulativeMs)

        clock = 3_000L // 重启：elapsed 回退
        tracker.tick()
        val snap = tracker.snapshot()
        assertTrue(snap.rebootDetected)
        assertEquals(5_000L, snap.cumulativeMs)
        assertEquals(3_000L, snap.uptimeMs)
    }

    // ==================== 持久化往返 ====================

    @Test
    fun `flush persists current segment and new tracker resumes continuity`() {
        var clock = 10_000L
        val tracker = newTracker()
        tracker.tickerClock = { clock }
        tracker.bootCountReader = { 7 }
        tracker.tick()
        clock = 40_000L
        tracker.tick()
        tracker.flush() // 退出落盘：累计 30s + elapsed 引用 40s + boot=7

        // "进程重启"：新实例从 prefs 恢复；首拍与落盘时刻同钟点 → 恢复但不重复计数
        var clock2 = 40_000L
        val tracker2 = newTracker()
        tracker2.tickerClock = { clock2 }
        tracker2.bootCountReader = { 7 }
        tracker2.tick()
        assertEquals(30_000L, tracker2.snapshot().cumulativeMs)
        assertEquals(7, tracker2.snapshot().bootCount)
        assertFalse(tracker2.snapshot().rebootDetected)
        // 从断点连续累加，不重复计数
        clock2 = 60_000L
        tracker2.tick()
        assertEquals(50_000L, tracker2.snapshot().cumulativeMs)
    }

    @Test
    fun `periodic persist survives process death without explicit flush`() {
        var clock = 0L
        val tracker = newTracker()
        tracker.tickerClock = { clock }
        tracker.tick() // 基线落盘 (acc=0, last=0)
        repeat(10) {
            clock += 1_000L
            tracker.tick()
        }
        // 第 10 拍触发周期落盘 (PERSIST_EVERY_TICKS=10)：acc=10000, last=10000
        assertEquals(10_000L, tracker.snapshot().cumulativeMs)

        var clock2 = 10_000L
        val tracker2 = newTracker()
        tracker2.tickerClock = { clock2 }
        tracker2.tick() // 新实例首拍：从 prefs 恢复，同钟点 delta=0 不重复计数
        assertEquals(10_000L, tracker2.snapshot().cumulativeMs)
        clock2 = 15_000L
        tracker2.tick()
        assertEquals(15_000L, tracker2.snapshot().cumulativeMs)
    }

    // ==================== BOOT_COUNT 真实读取路径 ====================

    @Test
    fun `boot count read from settings global shadow`() {
        Settings.Global.putInt(context.contentResolver, Settings.Global.BOOT_COUNT, 15)
        val tracker = newTracker()
        tracker.tick()
        assertEquals(15, tracker.snapshot().bootCount)
    }

    @Test
    fun `missing boot count setting yields null not fabricated value`() {
        val tracker = newTracker()
        tracker.tick()
        assertNull(tracker.snapshot().bootCount)
    }

    // ==================== 格式化边界 ====================

    @Test
    fun `formatter boundaries`() {
        assertEquals("不足 1 分钟", UsageDurationFormatter.formatUsageDuration(0L))
        assertEquals("不足 1 分钟", UsageDurationFormatter.formatUsageDuration(-5L))
        assertEquals("不足 1 分钟", UsageDurationFormatter.formatUsageDuration(59_999L))
        assertEquals("1 分钟", UsageDurationFormatter.formatUsageDuration(60_000L))
        assertEquals("1 小时 1 分钟", UsageDurationFormatter.formatUsageDuration(61L * 60_000L))
        assertEquals("1 小时 59 分钟", UsageDurationFormatter.formatUsageDuration(119L * 60_000L))
        assertEquals("1 天 0 小时", UsageDurationFormatter.formatUsageDuration(24L * 60 * 60_000L))
        assertEquals(
            "2 天 3 小时",
            UsageDurationFormatter.formatUsageDuration((2L * 24 + 3) * 60 * 60_000L)
        )
    }

    @Test
    fun `boot count formatter handles null and values`() {
        assertEquals("系统未提供", UsageDurationFormatter.formatBootCount(null))
        assertEquals("0 次", UsageDurationFormatter.formatBootCount(0))
        assertEquals("1234 次", UsageDurationFormatter.formatBootCount(1234))
    }
}
