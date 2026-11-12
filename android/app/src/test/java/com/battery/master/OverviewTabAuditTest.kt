package com.battery.master

import android.app.Application
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.core.app.ApplicationProvider
import com.battery.master.ui.BatteryScreen
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.util.Locale

/**
 * 状态总览 Tab (Tab 0) 审计回归测试 (Robolectric + Compose Test，无模拟器)
 *
 * 覆盖 v1.2.3 状态总览审计修复点：
 * 1. 12 项指标网格 (CyberMetricCardItem 01~12) 全量在场，缺一即断言失败；
 * 2. 硬件信息汇总栏 12 字段标签 + 指标 04 校准入口全量在场；
 * 3. 功率格式化 (指标 11 卡片副标题 + Hero 读数条) 在逗号小数点 Locale
 *    (de_DE) 下仍输出点号小数——旧实现 String.format 未锚定 Locale.US，
 *    德语/法语等系统下渲染 "4,00 W"；
 * 4. 一键模拟充满全链路闭环：按钮触发 → VM 锁定+持久化 → Hero 状态标签
 *    "已充满" + 电量 100% → 判定卡 "已满足" + 按钮进入倒计时禁用态。
 *
 * 环境假设 (与既有测试一致)：CI/桌面无电池 sysfs → 当前容量收敛 0.92×5000=4600。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w1200dp-h3000dp")
class OverviewTabAuditTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    @get:Rule
    val composeRule = createComposeRule()

    private fun mountShell(viewModel: BatteryViewModel = BatteryViewModel(app)) {
        composeRule.setContent { BatteryScreen(viewModel = viewModel) }
    }

    // Compose 测试官方同步原语：推进重组/动画/协程时钟
    // (Robolectric looper.idle 与 Compose 测试时钟不同步，勿混用)
    private fun advanceCompose() {
        composeRule.waitForIdle()
    }

    // ===== 1. 12 项指标网格全量在场 =====

    @Test
    fun metricGrid_allTwelveCardsPresent() {
        mountShell()

        val titles = listOf(
            "电池健康度", "剩余电量", "电池当前容量", "电池设计容量",
            "电量百分比", "电池状态", "电池温度", "电池健康状况",
            "电芯电压", "充放电循环", "瞬时电流", "完全充满容量"
        )
        titles.forEach { title ->
            composeRule.onNodeWithText(title).assertExists()
        }

        // 关于 APP 卡与零权限声明在场 (B6 功能说明链路完整)
        composeRule.onNodeWithText("关于 APP").assertExists()
        composeRule.onNodeWithText("零权限声明", substring = true).assertExists()
    }

    // ===== 2. 硬件信息汇总栏字段全量在场 =====

    @Test
    fun hardwareSummaryCard_allFieldsPresent() {
        mountShell()

        composeRule.onNodeWithText("底层硬件信息与电源子系统").assertExists()
        val labels = listOf(
            "SoC 主控", "SoC 厂商", "制程工艺", "GPU 渲染", "CPU 架构",
            "电源管理 IC", "快充协议", "电芯内阻", "化学材料体系",
            "电芯结构", "AIDL 规范"
        )
        labels.forEach { label ->
            composeRule.onNodeWithText(label).assertExists()
        }
        // 指标 04 校准入口 (带当前容量动态文案)
        composeRule.onNodeWithText("校准设计容量", substring = true).assertExists()
    }

    // ===== 3. 功率格式化：逗号小数点 Locale 下保持点号 =====

    @Test
    fun powerFormatting_dotDecimalUnderCommaLocale() {
        val previousLocale = Locale.getDefault()
        try {
            Locale.setDefault(Locale.GERMANY)
            val viewModel = BatteryViewModel(app)
            mountShell(viewModel)

            // 实验室通道注入 V×I：4000 mV × 1000 mA = 4.00 W
            viewModel.enterLabMode()
            viewModel.updateLabVoltage(4000)
            viewModel.updateLabCurrent(1000)
            advanceCompose()

            // 旧实现 (无 Locale.US)：de_DE 下渲染 "4,00 W"，本断言失败
            // (功率文本同时出现在 Hero 读数条与指标 11 卡副标题，onAllNodes 多节点安全)
            assert(
                composeRule.onAllNodes(
                    androidx.compose.ui.test.hasText("4.00 W", substring = true)
                ).fetchSemanticsNodes().isNotEmpty()
            )
        } finally {
            Locale.setDefault(previousLocale)
        }
    }

    // ===== 4. 一键模拟充满：判定链路全闭环 =====

    @Test
    fun fullChargeSimulation_closesFullChain() {
        val viewModel = BatteryViewModel(app)
        mountShell(viewModel)

        // B3 判定卡触发按钮在场
        composeRule.onNodeWithText("一键模拟完全充满 (100% + 16mA)").assertExists()
        composeRule.onNodeWithText("一键模拟完全充满 (100% + 16mA)").performClick()
        advanceCompose()

        // 按钮立即进入倒计时禁用态 (15 秒保持期窗口内，先于其他 waitUntil 断言)
        // (按钮文本与副文本同时存在，onAllNodes 多节点安全)
        assert(
            composeRule.onAllNodes(
                androidx.compose.ui.test.hasText("模拟保持中", substring = true)
            ).fetchSemanticsNodes().isNotEmpty()
        )
        composeRule.onAllNodes(
            androidx.compose.ui.test.hasText("模拟保持中", substring = true)
        ).onFirst().assertIsNotEnabled()

        // Hero 状态标签切为"已充满"，核心读数切为 100% (缓动动画收敛后)
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodes(matcher = androidx.compose.ui.test.hasText("已充满"), useUnmergedTree = true)
                .fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodes(matcher = androidx.compose.ui.test.hasText("100%"), useUnmergedTree = true)
                .fetchSemanticsNodes().isNotEmpty()
        }

        // 指标 12 卡片判定态刷新 (锁定容量 4600 已持久化)
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodes(
                matcher = androidx.compose.ui.test.hasText("已满足 100% & 0-25 mA", substring = true),
                useUnmergedTree = true
            ).fetchSemanticsNodes().isNotEmpty()
        }
    }

    // ===== 5. Hero 卡基础读数链路 =====

    @Test
    fun heroCard_rendersCoreReadings() {
        mountShell()

        // Hero 读数条在场 (静态渲染；"剩余电量" 同时命中指标 02 卡，onAllNodes 多节点安全)
        assert(
            composeRule.onAllNodes(
                androidx.compose.ui.test.hasText("剩余电量", substring = true)
            ).fetchSemanticsNodes().isNotEmpty()
        )
        assert(
            composeRule.onAllNodes(
                androidx.compose.ui.test.hasText("mA ·", substring = true)
            ).fetchSemanticsNodes().isNotEmpty()
        )
        // Robolectric 环境设计容量兜底 5000
        assertEquals(5000, BatteryViewModel(app).batteryState.value.designCapacityMah)
    }
}
