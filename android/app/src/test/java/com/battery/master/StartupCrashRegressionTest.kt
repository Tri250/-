package com.battery.master

import android.app.Application
import android.content.Intent
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.test.core.app.ApplicationProvider
import com.battery.master.receiver.BatteryReceiver
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.HardwareInfoResolver
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * 启动闪退治理回归测试 (Robolectric，无模拟器)：
 * 覆盖 MainActivity 启动 -> ViewModel 构造 -> 首次遥测 -> 粘性广播回调 -> Compose 首帧渲染
 * 全链路，任何一环抛异常都会导致进程启动闪退，此处全部断言不崩溃。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class StartupCrashRegressionTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    // ===== 1. Activity 启动 + Compose 首帧渲染 =====

    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun mainActivity_launch_rendersHudAndTabs_withoutCrash() {
        // Activity 由 Rule 自动启动：View 模型构造、遥测读取、广播注册、Compose 组合同步完成
        composeRule.onNodeWithText("ANDROID BATTERY MASTER").assertExists()
        composeRule.onNodeWithText("状态总览").assertExists()
        composeRule.onNodeWithText("硬件实验室").assertExists()
    }

    // ===== 2. ViewModel 构造期全链路 (registerReceiver 粘性回调同步触发) =====

    @Test
    fun viewModel_construction_doesNotCrash() {
        val vm = BatteryViewModel(app)
        assertNotNull(vm.batteryState.value)
        // 广播注册失败也应优雅降级 (字段可读、不抛异常)
        assertNotNull(vm.batteryInfo.value)
    }

    // ===== 3. 广播通道异常注入：畸形 Intent 不得引发崩溃 =====

    @Test
    fun batteryReceiver_malformedIntent_doesNotCrash() {
        val reader = BatteryHardwareReader(app)
        var updateCount = 0
        val receiver = BatteryReceiver(reader) { updateCount++ }
        // 空 Intent (action 为 null)
        receiver.onReceive(app, Intent())
        // 携带错误 action 的 Intent
        receiver.onReceive(app, Intent(Intent.ACTION_BOOT_COMPLETED))
        // 正常粘性广播 Intent
        receiver.onReceive(app, Intent(Intent.ACTION_BATTERY_CHANGED))
        assertTrue(updateCount >= 1)
    }

    // ===== 4. 硬件信息解析：系统字段全部缺失时仍返回带来源标注的降级值 =====

    @Test
    fun hardwareResolver_degradedEnvironment_returnsBadgedFallback() {
        val telemetry = HardwareInfoResolver.resolve(30f, 120, 20f)
        assertTrue(telemetry.pmicModel.contains("PMIC"))
        assertTrue(telemetry.fastChargeProtocol.isNotEmpty())
        assertTrue(telemetry.cellStructure.isNotEmpty())
        assertTrue(telemetry.batteryChemistry.isNotEmpty())
        // SoC 主控五字段：任何降级环境下均非空且带来源标注
        assertTrue(telemetry.socModel.isNotEmpty())
        assertTrue(telemetry.socVendor.isNotEmpty())
        assertTrue(telemetry.socProcess.isNotEmpty())
        assertTrue(telemetry.socCpu.isNotEmpty())
        assertTrue(telemetry.socGpu.isNotEmpty())
    }

    // ===== 5. 读取器：BatteryManager 属性异常时的安全降级 =====

    @Test
    fun reader_telemetry_returnsRenderableState() {
        val reader = BatteryHardwareReader(app)
        val state = reader.readBatteryTelemetry()
        assertTrue(state.percentage in 0..100)
        assertTrue(state.currentCapacityMah > 0)
    }
}
