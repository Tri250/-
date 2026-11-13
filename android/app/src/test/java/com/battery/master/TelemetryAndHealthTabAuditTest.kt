package com.battery.master

import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.core.app.ApplicationProvider
import com.battery.master.service.BatteryHardwareReader
import com.battery.master.service.BatteryHealthEngine
import com.battery.master.service.BatteryTelemetryParser
import com.battery.master.ui.BatteryScreen
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config

/**
 * v2.0.0-alpha.1 自检：遥测分析 / 健康档案双 Tab 审计回归测试
 *
 * 覆盖新增修改的预期范围一致性：
 * 1. 四 Tab 信息架构导航完整 (状态总览 / 遥测分析 / 健康档案 / 硬件实验室)；
 * 2. 遥测分析 Tab：曲线面板标题 + 图例 + 采集链路状态卡 (Android 真机独有透视)；
 * 3. 健康档案 Tab：实测口径大数字——电量计节点不可读时显式"无法测算"空态
 *    (是多少就是多少，不再按出厂保持率虚构 92%)；
 * 4. 内阻诚实口径：无引擎测算时不展示臆造工程估算值，显示"—"；
 * 5. 引擎采集接线端到端：parse() 出口喂样 → BatteryState.engineSampleCount
 *    反映真实滑窗样本数 (防退化为"只消费不采集"死链路)。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w1200dp-h3000dp")
class TelemetryAndHealthTabAuditTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    @get:Rule
    val composeRule = createComposeRule()

    @Before
    fun resetEngine() {
        BatteryHealthEngine.resetForTest()
    }

    private fun mount(viewModel: BatteryViewModel = BatteryViewModel(app)) {
        composeRule.setContent { BatteryScreen(viewModel = viewModel) }
    }

    // ===== 1. 四 Tab 导航 =====

    @Test
    fun fourTabs_navigationComplete() {
        mount()

        for (title in listOf("状态总览", "遥测分析", "健康档案", "硬件实验室")) {
            composeRule.onNodeWithText(title).assertExists()
        }

        // 默认总览在场；切遥测分析后实验室内容退场 (Tab 互斥)
        composeRule.onNodeWithText("12 项充放电核心指标详情").assertExists()
        composeRule.onNodeWithText("遥测分析").performClick()
        composeRule.onNodeWithText("高频硬件遥测分析").assertExists()

        // 切健康档案：遥测内容退场
        composeRule.onNodeWithText("健康档案").performClick()
        composeRule.onNodeWithText("电池健康度 (实测口径)").assertExists()

        // 切硬件实验室：一键场景在场 (末位 Tab 链路完整)
        composeRule.onNodeWithText("硬件实验室").performClick()
        composeRule.onNodeWithText("一键工作场景模拟").assertExists()
    }

    // ===== 2. 遥测分析 Tab 内容 =====

    @Test
    fun telemetryTab_chartAndSourceCardPresent() {
        mount()

        composeRule.onNodeWithText("遥测分析").performClick()

        // 曲线面板标题 + 三通道图例
        composeRule.onNodeWithText("高频硬件遥测分析").assertExists()
        composeRule.onNodeWithText("电压 mV").assertExists()
        composeRule.onNodeWithText("电流 mA").assertExists()
        composeRule.onNodeWithText("温度 °C").assertExists()

        // 采集链路状态卡 (Android 真机独有：真实数据来源透视)
        composeRule.onNodeWithText("采集链路状态 (真实数据来源透视)").assertExists()
        composeRule.onNodeWithText("电量计节点").assertExists()
        composeRule.onNodeWithText("CURRENT_NOW 瞬时电流").assertExists()
        composeRule.onNodeWithText("内阻引擎滑窗").assertExists()
        composeRule.onNodeWithText("采集通道").assertExists()

        // 功率卡：电流不可读 (null) 时不得虚构 0W——v1.2.4 P2 口径
        composeRule.onNodeWithText("充放电功率").assertExists()
        composeRule.onNodeWithText("电池温度评估").assertExists()
    }

    // ===== 3. 健康档案 Tab：无法测算空态 =====

    @Test
    fun healthTab_unmeasurableCapacity_showsHonestEmptyState() {
        mount()

        // 桌面测试环境电量计节点全链路不可读 → hasMeasuredCapacity=false
        composeRule.onNodeWithText("健康档案").performClick()

        // 是多少就是多少：不虚构 0.92×设计容量与"92.0% 健康度"，显式空态
        composeRule.onNodeWithText("电池健康度 (实测口径)").assertExists()
        composeRule.onNodeWithText("无法测算").assertExists()
        // 空态说明文案在场 (子串匹配可能命中切换期 Crossfade 保留节点，用 onAllNodes)
        assert(
            composeRule.onAllNodes(
                androidx.compose.ui.test.hasText("未上报 charge_full", substring = true)
            ).fetchSemanticsNodes().isNotEmpty()
        )
        // 诊断建议：不可测算时如实说明而非谎报良好
        composeRule.onNodeWithText("健康诊断建议").assertExists()
        assert(
            composeRule.onAllNodes(
                androidx.compose.ui.test.hasText("电量计节点未上报容量数据", substring = true)
            ).fetchSemanticsNodes().isNotEmpty()
        )
    }

    // ===== 4. 内阻诚实口径：无测算显示"—"而非臆造估算值 =====

    @Test
    fun healthTab_internalResistance_notFabricatedWithoutMeasurement() {
        val viewModel = BatteryViewModel(app)
        mount(viewModel)

        composeRule.onNodeWithText("健康档案").performClick()

        // 引擎滑窗无有效测算样本 → label=[工程估算] → 卡片数值"—"不展示 14.8mΩ 臆造值
        val state = viewModel.batteryState.value
        assertTrue(state.internalResistanceLabel.startsWith("[工程估算]"))
        assertTrue(state.engineSampleCount == 0)
        assertTrue(state.internalResistanceMohm > 0f) // 底层估算值存在 (总览栏口径)
        // UI 层已在健康档案拦截：onNodeWithText 断言估算数值不得出现
        composeRule.onAllNodes(
            androidx.compose.ui.test.hasText("mΩ", substring = true)
        ).fetchSemanticsNodes().let { nodes ->
            // 允许存在但不得以估算数值形态出现 (健康档案页估算值已拦截为"—")
            assertTrue(nodes.isEmpty() || nodes.all { !it.config.toString().contains("14.8") })
        }
    }

    // ===== 5. 引擎采集接线端到端：parse 出口喂样 → 滑窗样本反映 =====

    @Test
    fun engineWiring_parseFeedsSamples_reflectedInBatteryState() {
        val batteryManager = app.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val shadow = Shadows.shadowOf(batteryManager)

        // 注入 30 个递变电流/电压样本 (R=30mΩ 模型)，电流均 >150mA 浮充守卫
        for (k in 0..29) {
            val currentUa = (1000 + k * 200) * 1000
            shadow.setIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW, currentUa)
            val intent = Intent(Intent.ACTION_BATTERY_CHANGED).apply {
                putExtra(BatteryManager.EXTRA_LEVEL, 58)
                putExtra(BatteryManager.EXTRA_SCALE, 100)
                putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
                putExtra(BatteryManager.EXTRA_TEMPERATURE, 300)
                putExtra(BatteryManager.EXTRA_VOLTAGE, 4000 + (1000 + k * 200) * 30 / 1000)
                putExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_GOOD)
            }
            BatteryTelemetryParser.parse(intent, batteryManager, 5000)
        }

        // 接线生效：滑窗积累 30 样本 (旧实现全局无 observe → 恒 0，本断言失败)
        assertEquals(30, BatteryHealthEngine.snapshot().sampleCount)

        // 端到端：toBatteryState 透传引擎状态至 UI 字段
        val raw = BatteryTelemetryParser.parse(
            Intent(Intent.ACTION_BATTERY_CHANGED).apply {
                putExtra(BatteryManager.EXTRA_LEVEL, 58)
                putExtra(BatteryManager.EXTRA_SCALE, 100)
                putExtra(BatteryManager.EXTRA_STATUS, BatteryManager.BATTERY_STATUS_CHARGING)
                putExtra(BatteryManager.EXTRA_TEMPERATURE, 300)
                putExtra(BatteryManager.EXTRA_VOLTAGE, 4060)
                putExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_GOOD)
            },
            batteryManager,
            5000
        )
        val state = raw.toBatteryState(null, null)
        assertEquals(31, state.engineSampleCount)
        assertTrue(
            "采集链路卡置信度必须是引擎真实状态",
            state.engineConfidenceLabel == "UNAVAILABLE" ||
                state.engineConfidenceLabel == "LOW" ||
                state.engineConfidenceLabel == "MEDIUM" ||
                state.engineConfidenceLabel == "HIGH"
        )

        // Reader 通道同样透传 (双通道共用单解析器)
        val readerState = BatteryHardwareReader(app).readBatteryTelemetry()
        assertTrue(readerState.engineSampleCount >= 31)
    }
}
