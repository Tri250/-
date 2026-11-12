package com.battery.master

import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import androidx.test.core.app.ApplicationProvider
import com.battery.master.data.BatteryState
import com.battery.master.data.BatteryStatus
import com.battery.master.receiver.BatteryReceiver
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.BatteryTelemetryParser
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
 * 指标 12「完全充满容量」全量深度自检回归测试 (Robolectric，无模拟器)
 *
 * 覆盖 v1.2.1 自检修复点：
 * 1. 充满判定谓词边界 (100% 且 0~25 mA，含边界值)；
 * 2. 锁定状态机：进入区间锁定+持久化、区间内去重不刷时间戳、容量变化重锁、
 *    离开区间保留锁定值、非法容量拒绝锁定；
 * 3. 持久化拒绝非法值 + 跨 Reader 重启回显；
 * 4. 电量百分比归一化 (ROM 上报 level>scale 时充满判定不得失效)；
 * 5. 双通道 (轮询/广播) 共享锁定语义一致；
 * 6. ViewModel 一键模拟充满：锁定/持久化/展示态自洽；
 * 7. 硬件实验室充满校准场景退出后不得把合成容量泄漏进真实遥测态；
 * 8. 退出实验室在模拟保持期内被拦截的残留数据修复。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class FullChargeCapacityTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    // ===== 1. 充满判定谓词边界 (100% 且电流 0~25 mA) =====

    @Test
    fun fullChargeCriteria_boundaries_areExact() {
        // 区间内 (含边界)
        assertTrue(BatteryTelemetryParser.isFullChargeCriteriaMet(100, 0))
        assertTrue(BatteryTelemetryParser.isFullChargeCriteriaMet(100, 1))
        assertTrue(BatteryTelemetryParser.isFullChargeCriteriaMet(100, 12))
        assertTrue(BatteryTelemetryParser.isFullChargeCriteriaMet(100, 25))
        // 区间外
        assertFalse(BatteryTelemetryParser.isFullChargeCriteriaMet(100, 26))
        // v1.2.3 P0 审计修复：符号无关判定——高通/三星部分内核充电时上报负值，
        // 旧实现硬要求 [0,25] 使 -1 mA 浮充截止被漏判 (充满判定永不成立)
        assertTrue(BatteryTelemetryParser.isFullChargeCriteriaMet(100, -1))
        assertFalse(BatteryTelemetryParser.isFullChargeCriteriaMet(100, -1600))
        // v1.2.3 P0 审计修复：电流不可读 (null) 一律 false——旧实现把不可读
        // 归一化为 0 mA，导致不支持 CURRENT_NOW 的机型在 100% 时判定恒真、
        // 估算值被冒充实测锁定写盘
        assertFalse(BatteryTelemetryParser.isFullChargeCriteriaMet(100, null))
        // 电量未满
        assertFalse(BatteryTelemetryParser.isFullChargeCriteriaMet(99, 16))
        assertFalse(BatteryTelemetryParser.isFullChargeCriteriaMet(0, 0))
        assertFalse(BatteryTelemetryParser.isFullChargeCriteriaMet(58, 16))
    }

    // ===== 2. 锁定状态机 =====

    @Test
    fun lock_stateMachine_locksDedupesAndPreserves() {
        val reader = BatteryHardwareReader(app)

        // 进入判定区间：锁定并持久化
        assertEquals(4780, reader.lockFullChargeIfCriteriaMet(4780, 100, 16))
        val firstTimestamp = reader.lastFullChargeTimestamp
        assertNotNull(firstTimestamp)
        assertTrue(firstTimestamp!! > 0)

        // 区间内第二拍 (电流波动)：去重，不刷新时间戳
        assertEquals(4780, reader.lockFullChargeIfCriteriaMet(4780, 100, 20))
        assertEquals(firstTimestamp, reader.lastFullChargeTimestamp)

        // 区间内容量变化 (电量计重新校准)：重新锁定并刷新时间戳
        assertEquals(4760, reader.lockFullChargeIfCriteriaMet(4760, 100, 18))
        assertTrue(reader.lastFullChargeTimestamp!! > firstTimestamp)

        // 离开判定区间：保留上次锁定值不抹除
        assertEquals(4760, reader.lockFullChargeIfCriteriaMet(4760, 99, 16))
        assertEquals(4760, reader.lockFullChargeIfCriteriaMet(4760, 100, 26))
        assertEquals(4760, reader.lockFullChargeIfCriteriaMet(4760, 58, 0))

        // v1.2.3 P0 修复：符号无关——高通/三星内核充电时上报负电流，
        // -5 mA 取绝对值落在判定带内 (同值重锁定并刷新时间戳)
        assertEquals(4760, reader.lockFullChargeIfCriteriaMet(4760, 100, -5))

        // 非法容量 (sysfs 脏数据)：拒绝锁定垃圾值，保留上次有效锁定
        assertEquals(4760, reader.lockFullChargeIfCriteriaMet(0, 100, 16))
        assertEquals(4760, reader.lockFullChargeIfCriteriaMet(-1, 100, 16))
    }

    // ===== 3. 持久化非法值拒绝 + 跨重启回显 =====

    @Test
    fun persist_rejectsInvalidValues() {
        val reader = BatteryHardwareReader(app)
        reader.persistFullChargeCapacity(0, System.currentTimeMillis())
        assertNull(reader.lastFullChargeTimestamp)
        reader.persistFullChargeCapacity(-5, System.currentTimeMillis())
        assertNull(reader.lastFullChargeTimestamp)
        reader.persistFullChargeCapacity(4800, 0L)
        assertNull(reader.lastFullChargeTimestamp)
        reader.persistFullChargeCapacity(4800, -1L)
        assertNull(reader.lastFullChargeTimestamp)

        reader.persistFullChargeCapacity(4800, 1_700_000_000_000L)
        assertEquals(1_700_000_000_000L, reader.lastFullChargeTimestamp)
    }

    @Test
    fun lockedCapacity_survivesReaderRestart() {
        val timestamp = System.currentTimeMillis()
        BatteryHardwareReader(app).persistFullChargeCapacity(4820, timestamp)

        // 模拟进程重启：全新 Reader 从 SharedPreferences 恢复锁定值
        val restarted = BatteryHardwareReader(app)
        assertEquals(timestamp, restarted.lastFullChargeTimestamp)
        val state = restarted.readBatteryTelemetry()
        assertFalse(state.isFullChargeConditionMet)
        assertEquals(4820, state.fullChargeCapacityMah)
        assertEquals(timestamp, state.lastFullChargeTimestamp)
    }

    // ===== 4. 电量百分比归一化 (level > scale 修复回归) =====

    @Test
    fun parser_overReportedLevel_stillMeetsFullChargeCriteria() {
        // 部分定制 ROM 上报 level=101 / scale=100：旧实现 percentage=101，
        // `percentage == 100` 永远不成立 → 指标 12 充满判定永久失效
        val intent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_LEVEL, 101)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
        }
        // v1.2.3 P0 审计修复：不支持 CURRENT_NOW 时 getIntProperty 返回 Int.MIN_VALUE，
        // 归一化结果必须为 null (不可读) 而非 0 mA——故经 ShadowBatteryManager 注入
        // 16000 μA = 16 mA 浮充读数，使判定带在归一化后可复现地成立
        val batteryManager = app.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        Shadows.shadowOf(batteryManager)
            .setIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW, 16_000)
        val raw = BatteryTelemetryParser.parse(intent, batteryManager, 5000)
        assertEquals(100, raw.percentage)
        assertEquals(16, raw.currentMa)
        assertTrue(raw.isFullChargeConditionMet)
        // 展示态自洽：100% 且浮充 → 状态强制归一为 FULL
        assertEquals(BatteryStatus.FULL, raw.toBatteryState(4780, 1L).status)
    }

    @Test
    fun parser_mapsAllTelemetryFields() {
        val batteryManager = app.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        val intent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_LEVEL, 58)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
            putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
            putExtra(BatteryManager.EXTRA_TEMPERATURE, 326)
            putExtra(BatteryManager.EXTRA_VOLTAGE, 4187)
            putExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_GOOD)
        }
        val raw = BatteryTelemetryParser.parse(intent, batteryManager, 5000)

        assertEquals(58, raw.percentage)
        assertEquals(BatteryStatus.CHARGING, raw.status)
        assertEquals(32.6f, raw.temperatureCelsius, 0.01f)
        assertEquals(4187, raw.voltageMv)
        assertTrue(raw.currentCapacityMah > 0)
        // 剩余电量 = 当前容量 × 百分比 (不变式：≤ 当前容量)
        assertEquals((raw.currentCapacityMah * 58 / 100), raw.remainingCapacityMah)
        // 健康度 = 当前容量 / 设计容量，钳制 0~100
        assertTrue(raw.healthPercentage in 0f..100f)
        assertFalse(raw.isFullChargeConditionMet)
        // 展示态合成：硬件摘要字段全部非空 (带来源标注)
        val state = raw.toBatteryState(null, null)
        assertTrue(state.socModel.isNotEmpty())
        assertTrue(state.pmicModel.isNotEmpty())
        assertNull(state.fullChargeCapacityMah)
    }

    // ===== 5. 广播通道集成：与 Reader 共享锁定语义 =====

    @Test
    fun receiverChannel_locksAndSharesLockWithReader() {
        val reader = BatteryHardwareReader(app)
        var emitted: BatteryState? = null
        val receiver = BatteryReceiver(reader) { emitted = it }

        // 100% 且浮充：经 ShadowBatteryManager 注入 CURRENT_NOW = 0 μA (浮充截止读数，
        // 落在 0~25 mA 判定带内)。v1.2.3 P0 修复后不支持 CURRENT_NOW 的设备
        // (默认 Int.MIN_VALUE → null) 不再谎报充满，判定带可读性必须显式注入
        val batteryManager = app.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        Shadows.shadowOf(batteryManager)
            .setIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW, 0)

        val fullIntent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_LEVEL, 100)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
            putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
            putExtra(BatteryManager.EXTRA_TEMPERATURE, 315)
            putExtra(BatteryManager.EXTRA_VOLTAGE, 4380)
            putExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_GOOD)
        }
        receiver.onReceive(app, fullIntent)

        val fullState = emitted!!
        assertTrue(fullState.isFullChargeConditionMet)
        assertEquals(BatteryStatus.FULL, fullState.status)
        assertTrue(fullState.fullChargeCapacityMah!! > 0)
        assertEquals(fullState.currentCapacityMah, fullState.fullChargeCapacityMah)
        assertTrue(fullState.lastFullChargeTimestamp!! > 0)

        // 双通道共享：Reader 内存锁定值已被广播通道刷新
        val sharedLock = reader.lockFullChargeIfCriteriaMet(fullState.currentCapacityMah, 58, 16)
        assertEquals(fullState.fullChargeCapacityMah, sharedLock)

        // 非充满广播：不抹除已锁定容量与时间戳
        val partialIntent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_LEVEL, 62)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
            putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
            putExtra(BatteryManager.EXTRA_TEMPERATURE, 330)
            putExtra(BatteryManager.EXTRA_VOLTAGE, 4200)
            putExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_GOOD)
        }
        receiver.onReceive(app, partialIntent)

        val partialState = emitted!!
        assertFalse(partialState.isFullChargeConditionMet)
        assertEquals(BatteryStatus.CHARGING, partialState.status)
        assertEquals(fullState.fullChargeCapacityMah, partialState.fullChargeCapacityMah)
        assertEquals(fullState.lastFullChargeTimestamp, partialState.lastFullChargeTimestamp)
    }

    // ===== 6. ViewModel 一键模拟完全充满 =====

    @Test
    fun viewModel_triggerFullChargeSimulation_locksPersistsAndDisplays() {
        val vm = BatteryViewModel(app)
        vm.triggerFullChargeSimulation()

        val state = vm.batteryState.value
        assertEquals(100, state.percentage)
        assertTrue(state.isFullChargeConditionMet)
        assertEquals(BatteryStatus.FULL, state.status)
        // 模拟电流 16mA 落在浮充判定带内 (0~25 mA)
        assertEquals(16, state.currentMa)
        assertNotNull(state.fullChargeCapacityMah)
        assertTrue(state.fullChargeCapacityMah!! > 0)
        assertTrue(state.lastFullChargeTimestamp!! > 0)
        // 展示态自洽：100% 时剩余电量 = 当前容量
        assertEquals(state.currentCapacityMah, state.remainingCapacityMah)

        // 模拟结果已持久化：全新 Reader 重启后仍可回显锁定容量
        val restarted = BatteryHardwareReader(app).readBatteryTelemetry()
        assertEquals(state.fullChargeCapacityMah, restarted.fullChargeCapacityMah)
    }

    // ===== 7. 实验室充满校准场景：退出后不得泄漏合成容量 (修复回归) =====

    @Test
    fun labMode_fullChargeScenario_doesNotLeakAfterExit() {
        val vm = BatteryViewModel(app)

        vm.enterLabMode()
        vm.applyLabScenario(LabScenario.FULL_CHARGE)

        val labState = vm.batteryState.value
        assertEquals(100, labState.percentage)
        assertTrue(labState.isFullChargeConditionMet)
        // 实验室展示层允许显示模拟充满容量
        assertNotNull(labState.fullChargeCapacityMah)

        // 退出实验室：恢复真实遥测。从未真实充满时不得回显实验室合成容量
        vm.exitLabMode()
        val realState = vm.batteryState.value
        assertFalse(realState.isFullChargeConditionMet)
        assertNull(realState.fullChargeCapacityMah)
        assertNull(realState.lastFullChargeTimestamp)
    }

    @Test
    fun labMode_realLock_survivesLabSession() {
        // 先持久化一次真实锁定 (模拟上一会话真实充满后重启)
        val timestamp = System.currentTimeMillis()
        BatteryHardwareReader(app).persistFullChargeCapacity(4820, timestamp)

        val vm = BatteryViewModel(app)
        // VM 构造时从 prefs 恢复锁定值
        assertEquals(4820, vm.batteryState.value.fullChargeCapacityMah)
        assertEquals(timestamp, vm.batteryState.value.lastFullChargeTimestamp)

        // 进入再退出实验室：真实锁定值不丢失
        vm.enterLabMode()
        vm.applyLabScenario(LabScenario.GAMING_DISCHARGE)
        vm.exitLabMode()
        assertEquals(4820, vm.batteryState.value.fullChargeCapacityMah)
        assertEquals(timestamp, vm.batteryState.value.lastFullChargeTimestamp)
    }

    // ===== 8. 模拟保持期内退出实验室：残留数据修复回归 =====

    @Test
    fun exitLabMode_duringSimulationHold_restoresRealTelemetry() {
        val vm = BatteryViewModel(app)
        // 一键模拟充满 → 15 秒保持期开始
        vm.triggerFullChargeSimulation()
        assertTrue(vm.batteryState.value.isFullChargeConditionMet)

        // 保持期内进入实验室并切换场景，再主动退出
        vm.enterLabMode()
        vm.applyLabScenario(LabScenario.FLASH_CHARGE)
        vm.exitLabMode()

        // 旧实现：publish 被保持期拦截，退出后仍残留实验室合成数据直到保持期结束
        val state = vm.batteryState.value
        assertFalse(state.isFullChargeConditionMet)
        // 已恢复真实遥测 (无电池环境下百分比远低于实验室设定的 45%)
        assertTrue(state.percentage in 0..44)
    }
}
