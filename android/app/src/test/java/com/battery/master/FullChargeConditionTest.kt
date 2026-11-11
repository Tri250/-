package com.battery.master

import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import androidx.test.core.app.ApplicationProvider
import com.battery.master.data.BatteryStatus
import com.battery.master.receiver.BatteryReceiver
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.viewmodel.BatteryViewModel
import com.battery.master.viewmodel.LabScenario
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * 指标 12「完全充满容量」判定链路专项回归测试：
 * 覆盖 100% & 0-25mA 边界口径、轮询/广播双通道一致、写盘去重、
 * 跨实例持久化回显、一键模拟/实验室场景闭环与遥测暂停开关
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class FullChargeConditionTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    private fun prefs() = app.getSharedPreferences("battery_master_prefs", Context.MODE_PRIVATE)

    // ---------- 判定边界 (Feature 12 核心口径：100% 且 0-25 mA) ----------

    @Test
    fun fullChargeLock_boundaries() {
        val reader = BatteryHardwareReader(app)
        // 100% 且 0mA：锁定
        assertNotNull(reader.lockFullChargeIfCriteriaMet(4600, 100, 0))
        // 100% 且 25mA：锁定 (区间上限闭区间)
        assertNotNull(reader.lockFullChargeIfCriteriaMet(4600, 100, 25))
        // 100% 且 26mA：超出判满区间，不锁定，保留上次锁定值
        assertEquals(Integer.valueOf(4600), reader.lockFullChargeIfCriteriaMet(4600, 100, 26))
        // 100% 且 -1mA：负电流不锁定
        assertEquals(Integer.valueOf(4600), reader.lockFullChargeIfCriteriaMet(4600, 100, -1))
        // 99% 且 16mA：电量未满不锁定
        assertEquals(Integer.valueOf(4600), reader.lockFullChargeIfCriteriaMet(4600, 99, 16))
        // 100% 且 40mA：涓流已结束不锁定
        assertEquals(Integer.valueOf(4600), reader.lockFullChargeIfCriteriaMet(4600, 100, 40))
    }

    @Test
    fun fullChargeLock_freshReader_notMet_returnsNull() {
        val reader = BatteryHardwareReader(app)
        // 从未满足判满条件的新实例：未命中时回 null
        assertNull(reader.lockFullChargeIfCriteriaMet(4600, 99, 16))
        assertNull(reader.lockFullChargeIfCriteriaMet(4600, 100, 26))
        assertNull(reader.lockFullChargeIfCriteriaMet(4600, 100, -1))
    }

    // ---------- 持久化与去重 ----------

    @Test
    fun fullChargeLock_persistence_dedupesWrites() {
        val reader = BatteryHardwareReader(app)
        reader.lockFullChargeIfCriteriaMet(4600, 100, 16)
        val ts1 = prefs().getLong("last_full_timestamp_ms", -1L)
        assertTrue("首次判满应写盘", ts1 > 0)
        assertEquals(4600, prefs().getInt("full_charge_capacity_mah", -1))

        Thread.sleep(5)
        // 同容量再次进入判满区间：去重，不重复写盘 (每秒遥测不抖动)
        reader.lockFullChargeIfCriteriaMet(4600, 100, 20)
        assertEquals(ts1, prefs().getLong("last_full_timestamp_ms", -1L))

        Thread.sleep(5)
        // 容量变化：应刷新写盘
        reader.lockFullChargeIfCriteriaMet(4500, 100, 20)
        val ts3 = prefs().getLong("last_full_timestamp_ms", -1L)
        assertTrue("容量变化应刷新时间戳", ts3 > ts1)
        assertEquals(4500, prefs().getInt("full_charge_capacity_mah", -1))
    }

    @Test
    fun fullChargeLock_persistedAcrossReaderInstances() {
        BatteryHardwareReader(app).lockFullChargeIfCriteriaMet(4600, 100, 16)
        val reader2 = BatteryHardwareReader(app)
        // 新实例从磁盘恢复上次锁定容量
        assertEquals(Integer.valueOf(4600), reader2.lastRecordedFullCapacity)
        assertNotNull(reader2.lastFullChargeTimestamp)
        // 新实例未满足判满时仍回显上次锁定容量 (锁定值不丢失)
        assertEquals(
            Integer.valueOf(4600),
            reader2.lockFullChargeIfCriteriaMet(4600, 50, -500)
        )
    }

    // ---------- 广播通道与轮询通道口径一致 ----------

    @Test
    fun fullCharge_broadcastChannel_syncsState() {
        val reader = BatteryHardwareReader(app)
        var received: com.battery.master.data.BatteryState? = null
        val receiver = BatteryReceiver(reader) { fresh -> received = fresh }
        val intent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_LEVEL, 100)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
        }
        receiver.onReceive(app, intent)
        val s = received
        assertNotNull("广播回调应发布状态", s)
        assertEquals(100, s!!.percentage)
        // Robolectric 默认 CURRENT_NOW 为 0mA，落在 0..25 判满区间
        assertTrue(s.isFullChargeConditionMet)
        assertNotNull(s.fullChargeCapacityMah)
        assertNotNull(s.lastFullChargeTimestamp)
    }

    // ---------- ViewModel 一键模拟 / 实验室场景闭环 ----------

    @Test
    fun viewModel_triggerFullChargeSimulation_locksAndPersists() {
        val vm = BatteryViewModel(app)
        vm.triggerFullChargeSimulation()
        val s = vm.batteryState.value
        assertEquals(100, s.percentage)
        assertEquals(16, s.currentMa)
        assertEquals(BatteryStatus.FULL, s.status)
        assertTrue(s.isFullChargeConditionMet)
        assertNotNull(s.fullChargeCapacityMah)
        // 一键模拟结果同步持久化，保持期结束后锁定容量依然可回显
        assertTrue(
            "一键模拟应写盘",
            prefs().getLong("last_full_timestamp_ms", 0L) > 0
        )
    }

    @Test
    fun viewModel_labFullScenario_locksAndPersists() {
        val vm = BatteryViewModel(app)
        vm.applyLabScenario(LabScenario.FULL_CHARGE)
        val s = vm.batteryState.value
        assertEquals(100, s.percentage)
        assertTrue(s.isFullChargeConditionMet)
        assertEquals(BatteryStatus.FULL, s.status)
        assertNotNull(s.fullChargeCapacityMah)
        assertNotNull(s.lastFullChargeTimestamp)
        // 实验室判满同样落盘 (退出实验室后锁定容量可回显)
        assertTrue(
            "实验室判满应写盘",
            prefs().getLong("last_full_timestamp_ms", 0L) > 0
        )
        // 退出实验室：真实遥测不满足判满时锁定容量保留不丢失
        vm.exitLabMode()
        assertNotNull(vm.batteryState.value.fullChargeCapacityMah)
    }

    // ---------- 遥测暂停开关 ----------

    @Test
    fun viewModel_telemetryPause_toggles() {
        val vm = BatteryViewModel(app)
        assertFalse(vm.isTelemetryPaused.value)
        vm.toggleTelemetryPaused()
        assertTrue(vm.isTelemetryPaused.value)
        vm.toggleTelemetryPaused()
        assertFalse(vm.isTelemetryPaused.value)
    }
}
