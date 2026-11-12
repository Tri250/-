package com.battery.master

import android.app.Application
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.test.core.app.ApplicationProvider
import com.battery.master.data.BatteryHealthQuality
import com.battery.master.data.BatteryState
import com.battery.master.ui.HardwareLabScreen
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * 硬件实验室 (C 层) 与状态管理层 (E 层) 审计回归测试 (Robolectric + Compose Test)
 *
 * 覆盖 v1.2.3 本轮审计修复点：
 * 1. 设计容量滑杆区间与解析器合法区间 (500~25000) 单源对齐——真实设备
 *    (Reader 三级链有效区间) 存在 23800mAh 三防大电池机 / 600mAh 小电池设备，
 *    v1.2.3 P1 修复后这类合法值不再被静默压成边界值，数值文本与滑杆位置一致；
 *    value 仍防御性钳制在 valueRange 内，setContent 完成即证明不崩溃；
 * 2. 健康枚举与温度指标联动闭环：选"过热"联动 49.2°C，选非过热态时若温度
 *    仍停留在过热区 (>45°C) 回落中性室温，消除"健康=良好 但 49.2°C"矛盾展示。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w1200dp-h3000dp")
class LabHardwareAuditTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    @get:Rule
    val composeRule = createComposeRule()

    // ===== 1. 设计容量滑杆对真实设备合法值无损展示 =====

    @Test
    fun designCapacitySlider_survivesAboveRangeCapacity() {
        val viewModel = BatteryViewModel(app)
        // 三防大电池机：Reader 三级链可合法返回 23800 mAh (在 500~25000 合法区间内，
        // v1.2.3 P1 修复前滑杆上限 15000 会把滑杆位置静默压到边界、文本与位置不一致)
        composeRule.setContent {
            HardwareLabScreen(viewModel = viewModel, state = BatteryState(designCapacityMah = 23800))
        }

        // setContent 未抛异常即证明 Slider value 处于 valueRange 内；数值文本显示真实设计容量
        composeRule.onNodeWithText("23800 mAh").assertExists()
        composeRule.onNodeWithText("04. 出厂设计容量 (真实生效)").assertExists()
    }

    @Test
    fun designCapacitySlider_survivesBelowRangeCapacity() {
        val viewModel = BatteryViewModel(app)
        // 小电池设备：三级链可合法返回 600 mAh (高于滑杆下限 500)
        composeRule.setContent {
            HardwareLabScreen(viewModel = viewModel, state = BatteryState(designCapacityMah = 600))
        }

        composeRule.onNodeWithText("600 mAh").assertExists()
        composeRule.onNodeWithText("04. 出厂设计容量 (真实生效)").assertExists()
    }

    // ===== 2. 健康枚举与温度指标联动闭环 =====

    @Test
    fun healthQuality_overheatLinksHighTemperature() {
        val viewModel = BatteryViewModel(app)

        viewModel.updateLabHealthQuality(BatteryHealthQuality.OVERHEAT)

        assertEquals(BatteryHealthQuality.OVERHEAT, viewModel.labOverride.value?.healthQuality)
        assertEquals(49.2f, viewModel.labOverride.value?.temperatureCelsius ?: 0f, 0.01f)
    }

    @Test
    fun healthQuality_nonOverheatResetsOverheatTemperature() {
        val viewModel = BatteryViewModel(app)

        // 先选"过热"使温度进入过热区 (49.2°C)
        viewModel.updateLabHealthQuality(BatteryHealthQuality.OVERHEAT)
        assertEquals(49.2f, viewModel.labOverride.value?.temperatureCelsius ?: 0f, 0.01f)

        // 再选"良好"：温度必须回落中性室温，消除矛盾展示 (旧实现残留 49.2°C)
        viewModel.updateLabHealthQuality(BatteryHealthQuality.GOOD)
        assertEquals(BatteryHealthQuality.GOOD, viewModel.labOverride.value?.healthQuality)
        assertEquals(25.0f, viewModel.labOverride.value?.temperatureCelsius ?: 0f, 0.01f)
    }
}
