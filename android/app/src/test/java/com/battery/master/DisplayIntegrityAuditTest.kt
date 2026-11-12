package com.battery.master

import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.core.app.ApplicationProvider
import com.battery.master.data.CapacitySource
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.service.HardwareInfoResolver
import com.battery.master.ui.HardwareLabScreen
import com.battery.master.viewmodel.BatteryViewModel
import com.battery.master.viewmodel.LabScenario
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config

/**
 * 数据真实性与展示口径审计回归测试 (v1.2.4，Robolectric，无模拟器)
 *
 * 覆盖 P2/P3 审计修复点：
 * 1. P2-9 温度分级阈值单源：温度卡与温控节流态同源 (38℃/45℃ 常量对)，
 *    旧实现 44/38.5℃ 与 45/38℃ 两套阈值打架 (38~38.5℃ / 44~45℃ 同屏自相矛盾)；
 * 2. P2-8 节流态/内阻不再冒充实测：移除臆造 "限制 50%"/"限流 15%" 百分比，
 *    内阻与节流态标注 [工程估算]；
 * 3. P2-10 功率方向：解析层移除 abs()——充电 +W / 放电 −W (旧实现方向丢失)；
 * 4. P2-12 剩余电量口径标注：CHARGE_COUNTER → COULOMB_COUNTER (库仑计实测)，
 *    回退分支 → ESTIMATED (百分比×容量)，实验室覆盖层强制 ESTIMATED；
 * 5. P3-2 enterLabMode() 死代码激活：实验室显式"进入模拟模式"入口可触发；
 * 6. P3-3 1Hz 轮询生命周期门控：setTelemetryPollingActive 冒烟。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w1200dp-h3000dp")
class DisplayIntegrityAuditTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    @get:Rule
    val composeRule = createComposeRule()

    private fun batteryManager(): BatteryManager =
        app.getSystemService(Context.BATTERY_SERVICE) as BatteryManager

    // ===== 1. P2-9 温度分级阈值单源 (温度卡与节流态不再打架) =====

    @Test
    fun temperatureThresholds_singleSource_consistentGrading() {
        // 38.2℃：旧节流阈值 38.5 → "正常供电"，而温度卡 ≥38 → "偏热预警" (打架)
        // 修复后统一 ≥38 → 温控限流，与卡片偏热预警同源同界
        assertEquals("温控限流 [工程估算]", HardwareInfoResolver.resolve(38.2f, 0, 0f).thermalThrottlingState)
        // 44.5℃：旧节流阈值 ≥44 → "过热急停 (限制 50%)"，而温度卡 >45 才"严重发热" (打架)
        // 修复后统一 ≥45 才急停，44.5℃ 归入温控限流，与卡片偏热预警同源同界
        assertEquals("温控限流 [工程估算]", HardwareInfoResolver.resolve(44.5f, 0, 0f).thermalThrottlingState)
        // 45.0℃：统一急停阈值，与卡片 "严重发热 (≥45°C)" 同源同界
        assertTrue(HardwareInfoResolver.resolve(45f, 0, 0f).thermalThrottlingState.contains("过热急停"))
        assertTrue(HardwareInfoResolver.resolve(50f, 0, 0f).thermalThrottlingState.contains("过热急停"))
        // 37.9℃：正常供电
        assertEquals("正常供电 (无节流)", HardwareInfoResolver.resolve(37.9f, 0, 0f).thermalThrottlingState)
        // 阈值常量即单一事实来源：节流态判定与常量对严格一致
        assertEquals(38f, BatteryTelemetryParser.TEMP_WARM_THRESHOLD_C)
        assertEquals(45f, BatteryTelemetryParser.TEMP_OVERHEAT_THRESHOLD_C)
    }

    // ===== 2. P2-8 节流态/内阻不再冒充实测 =====

    @Test
    fun throttleState_fabricatedPercentagesRemoved_andLabeledAsEstimate() {
        // 旧实现臆造 "限制 50%"/"限流 15%"——系统无任何 API 上报节流比例，
        // 虚构精度冒充实测；修复后文案不再携带臆造百分比
        val hot = HardwareInfoResolver.resolve(50f, 0, 0f).thermalThrottlingState
        val warm = HardwareInfoResolver.resolve(40f, 0, 0f).thermalThrottlingState
        assertFalse(hot.contains("50%"))
        assertFalse(hot.contains("15%"))
        assertFalse(warm.contains("50%"))
        assertFalse(warm.contains("15%"))
        // 非正常态显式标注 [工程估算]，与 SoC 字段既有来源标注模式一致
        assertTrue(hot.contains("[工程估算]"))
        assertTrue(warm.contains("[工程估算]"))
    }

    // ===== 3. P2-10 功率方向：充电 +W / 放电 −W =====

    @Test
    fun powerWatts_signedByDirection_notAbs() {
        // 放电态 (DISCHARGING)：-1150 mA × 4000 mV → -4.6 W (旧实现 abs → +4.6 W，方向丢失)
        val dischargeIntent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_LEVEL, 58)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
            putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_DISCHARGING)
            putExtra(BatteryManager.EXTRA_VOLTAGE, 4000)
        }
        Shadows.shadowOf(batteryManager())
            .setIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW, -1_150_000)
        val discharge = BatteryTelemetryParser.parse(dischargeIntent, batteryManager(), 5000)
        assertEquals(-1150, discharge.currentMa)
        assertNotNull(discharge.powerWatts)
        assertTrue("放电功率必须为负 (旧实现 abs 后为正)", discharge.powerWatts!! < 0)
        assertEquals(-4.6f, discharge.powerWatts!!, 0.01f)

        // 充电态 (CHARGING)：+1150 mA × 4000 mV → +4.6 W
        val chargeIntent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_LEVEL, 58)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
            putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
            putExtra(BatteryManager.EXTRA_VOLTAGE, 4000)
        }
        Shadows.shadowOf(batteryManager())
            .setIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW, 1_150_000)
        val charge = BatteryTelemetryParser.parse(chargeIntent, batteryManager(), 5000)
        assertEquals(1150, charge.currentMa)
        assertNotNull(charge.powerWatts)
        assertTrue("充电功率必须为正", charge.powerWatts!! > 0)
        assertEquals(4.6f, charge.powerWatts!!, 0.01f)
    }

    // ===== 4. P2-12 剩余电量双口径来源标注 =====

    @Test
    fun remainingCapacity_sourceLabeled_byCaliber() {
        // 无 CHARGE_COUNTER → 回退 百分比 × 容量 → ESTIMATED (估算口径)
        val estimated = BatteryTelemetryParser.parse(null, null, 5000)
        assertEquals(CapacitySource.ESTIMATED, estimated.remainingCapacitySource)

        // CHARGE_COUNTER 可读 → 库仑计实测口径 (COULOMB_COUNTER)
        Shadows.shadowOf(batteryManager())
            .setIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER, 2_000_000)
        val intent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
            putExtra(BatteryManager.EXTRA_LEVEL, 58)
            putExtra(BatteryManager.EXTRA_SCALE, 100)
        }
        val measured = BatteryTelemetryParser.parse(intent, batteryManager(), 5000)
        assertEquals(2000, measured.remainingCapacityMah)
        assertEquals(CapacitySource.COULOMB_COUNTER, measured.remainingCapacitySource)
        // 展示态透传：UI 指标 02 卡片按该来源标注口径
        val state = measured.toBatteryState(4780, 1L)
        assertEquals(CapacitySource.COULOMB_COUNTER, state.remainingCapacitySource)
    }

    @Test
    fun labOverride_remainingCapacity_isEstimatedNotCoulomb() {
        val vm = BatteryViewModel(app)
        vm.applyLabScenario(LabScenario.FULL_CHARGE)
        assertNotNull(vm.labOverride.value)
        // 实验室剩余电量 = 百分比 × 当前容量 (估算口径)，显式标注 ESTIMATED，
        // 不得继承真实通道的 COULOMB_COUNTER 实测标注 (口径冒充)
        assertEquals(CapacitySource.ESTIMATED, vm.batteryState.value.remainingCapacitySource)
    }

    // ===== 5. P3-2 enterLabMode() 死代码激活 (显式 UI 入口) =====

    @Test
    fun labEnterButton_activatesExplicitEntryWithAckPath() {
        val vm = BatteryViewModel(app)
        composeRule.setContent { HardwareLabScreen(viewModel = vm, state = vm.batteryState.value) }
        composeRule.waitForIdle()
        // 显式"进入模拟模式"入口在场 (旧实现 enterLabMode 全无 UI 调用点，
        // TONE_PROP_ACK 进入提示音永不触发)
        composeRule.onNodeWithText("进入模拟模式").performClick()
        composeRule.waitForIdle()
        assertNotNull(vm.labOverride.value)
    }

    // ===== 6. P3-3 1Hz 轮询生命周期门控 (冒烟) =====

    @Test
    fun telemetryPollingGate_togglesWithoutCrash() {
        val vm = BatteryViewModel(app)
        // 后台暂停 → 回前台恢复：生命周期门控 API 存在且可安全切换
        vm.setTelemetryPollingActive(false)
        vm.setTelemetryPollingActive(true)
        assertNull(vm.labOverride.value)
    }
}
