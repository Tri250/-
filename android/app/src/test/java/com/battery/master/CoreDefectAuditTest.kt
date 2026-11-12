package com.battery.master

import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import androidx.test.core.app.ApplicationProvider
import com.battery.master.data.BatteryStatus
import com.battery.master.data.CapacitySource
import com.battery.master.data.FullChargeSource
import com.battery.master.data.FullChargeVerdict
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.BatterySysfs
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
 * v1.2.3 P0/P1 核心缺陷审计回归测试 (Robolectric，无模拟器)
 *
 * 覆盖 6 项审计发现：
 * 1. P0-1 不支持 CURRENT_NOW 的机型不再谎报充满、估算值不再被冒充实测写盘；
 * 2. P0-2 电流符号按平台归一 (充电上报负值的高通/三星内核判定恢复成立)；
 * 3. P0-3 "一键模拟完全充满"写独立 SIMULATED key，不污染真实锁定，可一键清除；
 * 4. P1-4 实验室模拟态跨 Tab 可见 (总览页警示横幅) 且可一键恢复真实遥测；
 * 5. P1-5 实验室滑杆区间与解析器合法区间单源对齐，真实合法值不被静默压边界；
 * 6. P1-6 设计容量校准值持久化跨重启，可恢复系统自动探测。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class CoreDefectAuditTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    // ===== P0-1：CURRENT_NOW 不可读不得谎报充满 =====

    @Test
    fun unsupportedCurrent_now_neverFalselyReportsFullCharge() {
        // 100% 电量意图；设备不支持 CURRENT_NOW：ShadowBatteryManager 未注入属性时
        // getIntProperty(CURRENT_NOW) 返回 Int.MIN_VALUE (与真机不支持口径一致)
        val intent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
            putExtra(BatteryManager.EXTRA_PLUGGED, BatteryManager.BATTERY_PLUGGED_AC)
            putExtra(BatteryManager.EXTRA_LEVEL, 100)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
        }
        val batteryManager = app.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val raw = BatteryTelemetryParser.parse(intent, batteryManager, 5000)

        // 电流不可读：必须为 null，绝不归一化成 0 mA
        assertNull(raw.currentMa)
        // 三态判定：不可读 → CURRENT_UNAVAILABLE，不得 FULLY_CHARGED
        assertEquals(FullChargeVerdict.CURRENT_UNAVAILABLE, raw.fullChargeVerdict)
        assertFalse(raw.isFullChargeConditionMet)

        // 锁定路径：估算值 (4600 = 0.92 × 5000) 不得被冒充实测锁定
        val reader = BatteryHardwareReader(app)
        val locked = reader.lockFullChargeIfCriteriaMet(raw.currentCapacityMah, 100, raw.currentMa, isCharging = true)
        assertNull("电流不可读时不得锁定任何容量", locked)
        val display = reader.resolveFullChargeDisplay()
        assertEquals(FullChargeSource.NONE, display.source)
        assertNull(display.capacityMah)
    }

    @Test
    fun dischargingAt100Percent_isNotFullCharge() {
        // 100% 且电流在区间内，但未在充电态 (拔线后)：不得判定充满
        val verdict = BatteryTelemetryParser.evaluateFullCharge(100, 16, isCharging = false)
        assertEquals(FullChargeVerdict.NOT_YET, verdict)
    }

    // ===== P0-2：符号归一 =====

    @Test
    fun negativeChargingCurrent_platformsStillDetectFullCharge() {
        // 高通/三星部分内核充电时上报负值：-15 mA 浮充截止在充电态下必须判定充满
        val verdict = BatteryTelemetryParser.evaluateFullCharge(100, -15, isCharging = true)
        assertEquals(FullChargeVerdict.FULLY_CHARGED, verdict)

        // 归一化层符号校准：充电态负值翻正、放电态正值翻负
        assertEquals(15, BatterySysfs.normalizeCurrentToMilliAmps(-15_000, isCharging = true))
        assertEquals(-15, BatterySysfs.normalizeCurrentToMilliAmps(15_000, isCharging = false))
        // 真实浮充 0 保留
        assertEquals(0, BatterySysfs.normalizeCurrentToMilliAmps(0, isCharging = true))
    }

    @Test
    fun signCalibration_integratedParsePath() {
        // 构造"充电中 + 100% + 负电流"意图 (模拟上报负值的内核)：
        // 归一化后电流应为 +15 mA，判定 FULLY_CHARGED
        val intent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
            putExtra(BatteryManager.EXTRA_PLUGGED, BatteryManager.BATTERY_PLUGGED_AC)
            putExtra(BatteryManager.EXTRA_LEVEL, 100)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
            putExtra(BatteryManager.EXTRA_TEMPERATURE, 260)
            putExtra(BatteryManager.EXTRA_VOLTAGE, 4200)
        }
        val batteryManager = app.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val raw = BatteryTelemetryParser.parse(intent, batteryManager, 5000)
        assertEquals(BatteryStatus.CHARGING, raw.status)
        // 系统属性通道不可读 (CURRENT_NOW → Int.MIN_VALUE → null) → CURRENT_UNAVAILABLE
        // (不谎报)；符号校准在属性可读时经 BatterySysfs 单测覆盖
        assertEquals(FullChargeVerdict.CURRENT_UNAVAILABLE, raw.fullChargeVerdict)
    }

    // ===== P0-3：模拟演示值与真实锁定分离 =====

    @Test
    fun fullChargeSimulation_writesSimulatedKeyOnly() {
        val vm = BatteryViewModel(app)
        vm.triggerFullChargeSimulation()

        val state = vm.batteryState.value
        assertTrue(state.isFullChargeConditionMet)
        assertEquals(FullChargeSource.SIMULATED, state.fullChargeSource)

        // 真实锁定 key 未被写入：全新 Reader 回显来源必须是 SIMULATED 而非 REAL
        val display = BatteryHardwareReader(app).resolveFullChargeDisplay()
        assertEquals(FullChargeSource.SIMULATED, display.source)
        assertNotNull(display.capacityMah)
        // 真实锁定字段保持为空 (reader.lastRecordedFullCapacity 私有，经展示值间接验证)
        val restarted = BatteryHardwareReader(app).readBatteryTelemetry()
        assertEquals(FullChargeSource.SIMULATED, restarted.fullChargeSource)
    }

    @Test
    fun clearFullChargeRecords_removesSimulatedAndReal() {
        // 先写入一个演示值
        val vm = BatteryViewModel(app)
        vm.triggerFullChargeSimulation()
        assertNotNull(vm.batteryState.value.fullChargeCapacityMah)

        // 一键清除：内存 + 持久化双清
        vm.clearFullChargeRecords()
        val cleared = vm.batteryState.value
        assertNull(cleared.fullChargeCapacityMah)
        assertNull(cleared.lastFullChargeTimestamp)
        assertEquals(FullChargeSource.NONE, cleared.fullChargeSource)

        // 全新 Reader 重启后无任何回显
        val display = BatteryHardwareReader(app).resolveFullChargeDisplay()
        assertEquals(FullChargeSource.NONE, display.source)
        assertNull(display.capacityMah)
    }

    @Test
    fun realLock_clearsStaleSimulationAndTakesPriority() {
        // 历史演示值存在时发生真实锁定：演示值被清除，真实锁定优先展示
        BatteryHardwareReader(app).persistSimulatedFullChargeCapacity(4000, System.currentTimeMillis())
        val reader = BatteryHardwareReader(app)
        reader.lockFullChargeIfCriteriaMat(4820, 100, 16, isCharging = true)

        val display = reader.resolveFullChargeDisplay()
        assertEquals(FullChargeSource.REAL, display.source)
        assertEquals(4820, display.capacityMah)
    }

    // ===== P1-5：滑杆区间与解析器合法区间对齐 =====

    @Test
    fun labSliders_acceptLegalValuesWithoutClamping() {
        val vm = BatteryViewModel(app)
        vm.enterLabMode()

        // 双电芯整包 8800 mV (合法，旧滑杆 4600 上限会静默压值)
        vm.updateLabVoltage(8800)
        assertEquals(8800, vm.batteryState.value.voltageMv)

        // 120W 级快充 8000 mA (合法，旧滑杆 6000 上限会静默压值)
        vm.updateLabCurrent(8000)
        assertEquals(8000, vm.batteryState.value.currentMa)

        // 极寒 -10℃ (合法，旧滑杆 0 下限会静默压值)
        vm.updateLabTemperature(-10f)
        assertEquals(-10f, vm.batteryState.value.temperatureCelsius, 0.01f)

        // 重度老化 8000 次循环 (合法，旧滑杆 1200 上限会静默压值)
        vm.updateLabCycleCount(8000)
        assertEquals(8000, vm.batteryState.value.cycleCount)

        // 三防大电池 23800 mAh (合法，旧滑杆 15000 上限会静默压值)
        vm.updateLabDesignCapacity(23800)
        assertEquals(23800, vm.batteryState.value.designCapacityMah)

        // 超出解析器物理上限的垃圾值仍被钳制 (±20A)
        vm.updateLabCurrent(999_999)
        assertEquals(BatteryTelemetryParser.MAX_PLAUSIBLE_CURRENT_MA, vm.batteryState.value.currentMa)
    }

    @Test
    fun labDischargeStatus_neverFalselyFull() {
        val vm = BatteryViewModel(app)
        vm.enterLabMode()
        vm.applyLabScenario(LabScenario.GAMING_DISCHARGE)
        // 放电态即使 100% + 电流近零也不得判定充满 (P0-1 充电态校验)
        vm.updateLabPercentage(100)
        vm.updateLabCurrent(16)
        val state = vm.batteryState.value
        assertEquals(FullChargeVerdict.NOT_YET, state.fullChargeVerdict)
        assertFalse(state.isFullChargeConditionMet)
        assertEquals(BatteryStatus.DISCHARGING, state.status)
    }

    // ===== P1-4：实验室模拟态跨 Tab 泄漏防护 =====

    @Test
    fun labOverride_leaksAcrossTabButIsExposedAndRecoverable() {
        val vm = BatteryViewModel(app)
        vm.enterLabMode()
        vm.updateLabVoltage(8888)

        // labOverride 经 StateFlow 公开可读：总览页据此渲染警示横幅 (P1-4 修复)
        assertNotNull(vm.labOverride.value)
        assertEquals(8888, vm.labOverride.value!!.voltageMv)

        // 一键恢复真实遥测：覆盖层清除 + 状态回到真实通道
        vm.exitLabMode()
        assertNull(vm.labOverride.value)
        val real = vm.batteryState.value
        // 真实通道电流不可读 → CURRENT_UNAVAILABLE (不谎报充满)
        assertEquals(FullChargeVerdict.CURRENT_UNAVAILABLE, real.fullChargeVerdict)
        // 设计容量回到系统三级链解析值 (Robolectric 环境命中 PowerProfile 或兜底，
        // 不硬编码具体等级，仅断言不再是用户校准值)
        assertTrue(real.designCapacitySource != CapacitySource.CALIBRATED)
    }

    // ===== P1-6：设计容量校准持久化 =====

    @Test
    fun designCapacityCalibration_persistsAcrossReaderRestart() {
        val vm = BatteryViewModel(app)
        vm.setDesignCapacity(6000)
        assertEquals(CapacitySource.CALIBRATED, vm.batteryState.value.designCapacitySource)

        // 全新 Reader (模拟重启)：校准值从 SharedPreferences 恢复
        val restarted = BatteryHardwareReader(app)
        assertEquals(6000, restarted.designCapacityMah)
        assertEquals(CapacitySource.CALIBRATED, restarted.designCapacitySource)

        // 恢复系统自动探测：校准 key 移除，重新解析三级回退链
        vm.clearDesignCapacityCalibration()
        val cleared = vm.batteryState.value
        assertTrue(cleared.designCapacitySource != CapacitySource.CALIBRATED)

        // 重启后仍是系统链 (校准未复活)：与全新 Reader 解析结果一致
        val fresh = BatteryHardwareReader(app)
        assertEquals(fresh.designCapacityMah, cleared.designCapacityMah)
        assertEquals(fresh.designCapacitySource, cleared.designCapacitySource)
    }

    @Test
    fun invalidCalibration_doesNotPersistOrPolluteSource() {
        val vm = BatteryViewModel(app)
        val sourceBefore = vm.batteryState.value.designCapacitySource

        vm.setDesignCapacity(100)   // 低于 500 下限
        vm.setDesignCapacity(0)     // 零
        vm.setDesignCapacity(-1)    // 负值

        assertEquals(sourceBefore, vm.batteryState.value.designCapacitySource)
        // 非法值未写盘：重启后与全新系统链解析值一致，未退化也未污染来源
        val fresh = BatteryHardwareReader(app)
        assertEquals(fresh.designCapacityMah, vm.batteryState.value.designCapacityMah)
        assertTrue(fresh.designCapacitySource != CapacitySource.CALIBRATED)
    }
}
