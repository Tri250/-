package com.battery.master

import android.app.Application
import android.content.Intent
import android.os.BatteryManager
import androidx.test.core.app.ApplicationProvider
import com.battery.master.data.BatteryStatus
import com.battery.master.receiver.BatteryReceiver
import com.battery.master.service.BatteryHardwareReader
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * 指标 12「完全充满时的容量」专项闭环回归测试 (Robolectric，无模拟器)：
 *
 * 核心规则：仅当 电量 == 100% 且 瞬时电流 ∈ [0, 25] mA 时判定完全充满，
 * 锁定并持久化完全充满容量；条件不满足时保留上次锁定值不抹除。
 *
 * 覆盖操作链路：
 * 1. 判定边界 (0 / 16 / 25 mA 锁定，26 / -1 mA 与 99% 不锁定)
 * 2. 锁定保持 (离开判定区间后锁定值仍在，不因通道切换/轮询刷新丢失)
 * 3. 持久化闭环 (跨 Reader 实例重建 = 跨进程重启，容量与时间戳可回显)
 * 4. 双通道一致性 (轮询通道与 ACTION_BATTERY_CHANGED 广播通道共享同一判定语义)
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class FullChargeCalibrationTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    // ===== 1. 判定规则与边界 =====

    @Test
    fun lockAt100PercentAndTypicalTrickleCurrent() {
        val reader = BatteryHardwareReader(app)
        val capacity = reader.lockFullChargeIfCriteriaMet(currentCapacityMah = 4600, percentage = 100, currentNowMa = 16)
        assertEquals(4600, capacity)
        assertNotNull(reader.lastFullChargeTimestamp)
    }

    @Test
    fun cutoffBandBoundariesAreInclusive() {
        // 满电涓流区间为闭区间 [0, 25] mA
        val readerLower = BatteryHardwareReader(app)
        assertEquals(4600, readerLower.lockFullChargeIfCriteriaMet(4600, 100, 0))

        val readerUpper = BatteryHardwareReader(app)
        assertEquals(4600, readerUpper.lockFullChargeIfCriteriaMet(4600, 100, 25))
    }

    @Test
    fun noLockWhenCurrentAboveCutoffBand() {
        val reader = BatteryHardwareReader(app)
        // CV 饱和期电流仍在数百 mA：不满足判定，且无历史锁定值时返回 null
        assertNull(reader.lockFullChargeIfCriteriaMet(4600, 100, 26))
        assertNull(reader.lockFullChargeIfCriteriaMet(4600, 100, 800))
    }

    @Test
    fun noLockWhenDischarging() {
        val reader = BatteryHardwareReader(app)
        assertNull(reader.lockFullChargeIfCriteriaMet(4600, 100, -1))
        assertNull(reader.lockFullChargeIfCriteriaMet(4600, 100, -420))
    }

    @Test
    fun noLockWhenPercentageBelow100() {
        val reader = BatteryHardwareReader(app)
        // Android UI 常在 CV 初期提前显示 100% 之前的进度：99% 即便电流在截止区间也不算完全充满
        assertNull(reader.lockFullChargeIfCriteriaMet(4600, 99, 16))
        assertNull(reader.lockFullChargeIfCriteriaMet(4600, 78, 5))
    }

    // ===== 2. 锁定保持 (条件离开后不丢值) =====

    @Test
    fun lockedValueRetainedWhenConditionLeaves() {
        val reader = BatteryHardwareReader(app)
        assertEquals(4600, reader.lockFullChargeIfCriteriaMet(4600, 100, 16))

        // 拔充电器放电 / 电流离开涓流区间：锁定容量必须保留 (指标 12 回显语义)
        assertEquals(4600, reader.lockFullChargeIfCriteriaMet(4600, 80, -300))
        assertEquals(4600, reader.lockFullChargeIfCriteriaMet(4600, 100, 1500))
    }

    // ===== 3. 持久化闭环 (跨进程重启) =====

    @Test
    fun persistedLockSurvivesReaderRecreation() {
        val reader1 = BatteryHardwareReader(app)
        assertEquals(4600, reader1.lockFullChargeIfCriteriaMet(4600, 100, 16))
        val lockedAt = reader1.lastFullChargeTimestamp
        assertNotNull(lockedAt)

        // 模拟进程重启：新建 Reader 实例，从 SharedPreferences 恢复锁定容量与时间戳
        val reader2 = BatteryHardwareReader(app)
        assertEquals(4600, reader2.lockFullChargeIfCriteriaMet(4600, 45, -800))
        assertEquals(lockedAt, reader2.lastFullChargeTimestamp)
    }

    @Test
    fun persistFullChargeCapacityWritesCapacityAndTimestamp() {
        val reader = BatteryHardwareReader(app)
        reader.persistFullChargeCapacity(4530, 1_700_000_000_000L)

        val readerReborn = BatteryHardwareReader(app)
        assertEquals(4530, readerReborn.lockFullChargeIfCriteriaMet(4600, 30, -200))
        assertEquals(1_700_000_000_000L, readerReborn.lastFullChargeTimestamp)
    }

    // ===== 4. 双通道一致性 (轮询 vs 广播共享 Reader 判定) =====

    @Test
    fun broadcastChannelLocksFeature12Consistently() {
        val reader = BatteryHardwareReader(app)
        var received: com.battery.master.data.BatteryState? = null
        val receiver = BatteryReceiver(reader) { received = it }

        val intent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_LEVEL, 100)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
            putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
        }
        receiver.onReceive(app, intent)

        val state = received
        assertNotNull(state)
        // 广播通道与轮询通道同一判定：100% 满足 (Robolectric CURRENT_NOW 缺省 0mA ∈ [0,25])
        assertTrue(state!!.isFullChargeConditionMet)
        assertEquals(state.currentCapacityMah, state.fullChargeCapacityMah)
        assertEquals(BatteryStatus.FULL, state.status)
        assertNotNull(state.lastFullChargeTimestamp)
    }

    @Test
    fun broadcastChannelRetainsLockWhenNotFullyCharged() {
        val reader = BatteryHardwareReader(app)
        // 先经轮询通道锁定
        assertEquals(4600, reader.lockFullChargeIfCriteriaMet(4600, 100, 16))

        var received: com.battery.master.data.BatteryState? = null
        val receiver = BatteryReceiver(reader) { received = it }
        val intent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_LEVEL, 60)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
            putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_DISCHARGING)
        }
        receiver.onReceive(app, intent)

        val state = received
        assertNotNull(state)
        // 未满足判定但锁定容量必须保留，状态恢复为放电中
        assertEquals(4600, state!!.fullChargeCapacityMah)
        assertEquals(BatteryStatus.DISCHARGING, state.status)
    }
}
