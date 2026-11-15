package com.battery.master

import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import androidx.test.core.app.ApplicationProvider
import com.battery.master.service.BatteryHistoryStore
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * v2.0.0-beta.1 P0 GA 修复：VM ↔ Store 持久化集成测试
 *
 * 验证"长期数据连续性"端到端链路：
 * 1. VM publish (广播通道) 逐拍打点并落盘 (同步执行器，时序确定)；
 * 2. 模拟进程重启 (同一存储、全新 VM 实例) → 历史曲线从 JSONL 尾部回填接续；
 * 3. clearTelemetryHistory 清空 (文件 + 内存) 后重启不再回填。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class BatteryHistoryPersistenceIntegrationTest {

    /** 同步执行器：落盘立即生效，测试无异步等待 */
    private val directExecutor = java.util.concurrent.Executor { it.run() }

    private fun batteryIntent(level: Int): Intent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
        putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
        putExtra(BatteryManager.EXTRA_PLUGGED, BatteryManager.BATTERY_PLUGGED_AC)
        putExtra(BatteryManager.EXTRA_LEVEL, level)
        putExtra(BatteryManager.EXTRA_SCALE, 100)
        putExtra(BatteryManager.EXTRA_TEMPERATURE, 310)
        putExtra(BatteryManager.EXTRA_VOLTAGE, 4150)
    }

    @Test
    fun vmPublishPersistsAndNewInstanceRestoresHistory() {
        val app = ApplicationProvider.getApplicationContext<Application>()
        val store = BatteryHistoryStore(app, directExecutor)
        store.clearAll()
        store.flush()

        val vm = BatteryViewModel(app, store)
        // VM init 注册广播时 Robolectric 回放粘性 ACTION_BATTERY_CHANGED (1 拍默认样本)，
        // 先清空建立确定性基线 (内存+落盘)，再注入受控拍
        vm.clearTelemetryHistory()
        // 注入虚拟节流时钟：每拍推进 1s 保证 400ms 窗口全部放行
        var clock = 10_000L
        vm.elapsedClock = { clock }

        // 广播通道注入 3 拍真实遥测 (publish 源头打点 + 落盘)
        listOf(45, 55, 65).forEach { level ->
            clock += 1000
            vm.dispatchTelemetryBroadcastForTest(batteryIntent(level))
        }
        store.flush()

        assertEquals("3 拍广播应全部进入内存历史", 3, vm.telemetryHistory.value.size)
        assertEquals(65, vm.telemetryHistory.value.last().percentage)
        assertTrue("样本应带采样时刻", vm.telemetryHistory.value.last().sampleTimestampMs > 0)

        // 模拟进程重启：同一存储文件，全新 VM 实例 → 尾部回填接续曲线。
        // 重启后的 VM 在 init 注册广播时立即回放当前电池状态 (粘性广播)，
        // 恰如真机行为——内存 = 3 条持久化历史 + 1 条当前实时快照 = 4，
        // 持久化样本必然位于前 3 位 (restore 先于实时快照入列)
        val restarted = BatteryViewModel(app, store)
        val restoredHistory = restarted.telemetryHistory.value
        assertEquals("重启后历史应从 JSONL 回填 + 1 条实时快照", 4, restoredHistory.size)
        assertEquals(45, restoredHistory[0].percentage)
        assertEquals(55, restoredHistory[1].percentage)
        assertEquals(65, restoredHistory[2].percentage)
    }

    @Test
    fun clearTelemetryHistoryWipesMemoryAndDisk() {
        val app = ApplicationProvider.getApplicationContext<Application>()
        val store = BatteryHistoryStore(app, directExecutor)
        store.clearAll()
        store.flush()

        val vm = BatteryViewModel(app, store)
        vm.clearTelemetryHistory() // 清空 init 粘性广播回放拍，建立确定性基线
        var clock = 20_000L
        vm.elapsedClock = { clock }
        clock += 1000
        vm.dispatchTelemetryBroadcastForTest(batteryIntent(72))
        assertTrue(vm.telemetryHistory.value.isNotEmpty())

        vm.clearTelemetryHistory()
        assertTrue(vm.telemetryHistory.value.isEmpty())

        // 清空后重启：持久化数据确已删除 (72% 样本不再回来)；
        // 新 VM 会像真机一样立即记录当前电池状态 (1 条实时快照)，属预期行为
        val restarted = BatteryViewModel(app, store)
        assertTrue(
            "清空后持久化样本不得复活",
            restarted.telemetryHistory.value.none { it.percentage == 72 }
        )
        assertTrue("重启仅剩当前电池实时快照", restarted.telemetryHistory.value.size <= 1)
    }

    @Test
    fun throttleStillDeduplicatesSameWindowBroadcasts() {
        val app = ApplicationProvider.getApplicationContext<Application>()
        val store = BatteryHistoryStore(app, directExecutor)
        store.clearAll()
        store.flush()

        val vm = BatteryViewModel(app, store)
        vm.clearTelemetryHistory() // 清空 init 粘性广播回放拍，建立确定性基线
        var clock = 30_000L
        vm.elapsedClock = { clock }
        // 同一 400ms 窗口内连发 2 拍：节流窗口应去重 (历史只增 1 条)
        clock += 100
        vm.dispatchTelemetryBroadcastForTest(batteryIntent(50))
        clock += 100
        vm.dispatchTelemetryBroadcastForTest(batteryIntent(51))
        store.flush()
        assertEquals("同窗口双拍应被 400ms 节流去重", 1, vm.telemetryHistory.value.size)
    }
}
