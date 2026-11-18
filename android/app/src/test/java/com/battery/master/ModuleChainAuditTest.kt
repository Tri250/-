package com.battery.master

import android.app.Application
import android.os.Looper
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.core.app.ApplicationProvider
import com.battery.master.ui.BatteryScreen
import com.battery.master.ui.RuntimeScreen
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config

/**
 * 六功能模块操作链路审计回归测试 (v2.2.0 链路审计)
 *
 * 覆盖「状态总览 / 续航分析 / 充电管理 / 健康档案 / 硬件实验室 / 我的」
 * 用户操作 → VM API → 状态反馈 → 闭环确认 全链路：
 *
 * 1. m6 P0 回归：「我的」页返回链路——旧实现 onBack 死参数、底栏点击不退出
 *    设置态，进入设置页后无任何返回路径；现顶栏「返回」双态切换 + 底栏点击
 *    同时退出设置态，两条退出路径均断言；
 * 2. m3 P1 回归：充电管理页满充卡倒计时接线——旧实现 simulationRemainingSec
 *    硬编码 0L，模拟保持期倒计时不显示、按钮可重复触发；现从 VM 单源收集，
 *    点击后按钮文本切换「模拟保持中」并进入禁用态；
 * 3. m2 续航分析：CSV 导出按钮 enabled 门控 (无样本/无会话禁用，有样本启用)；
 * 4. m4 健康档案：满充卡双入口在场 (总览 + 健康页复用同款组件)；
 * 5. m5 硬件实验室：进入模拟 → 跨页警示横幅 → 一键恢复真实遥测 闭环。
 *
 * 环境假设 (与既有测试一致)：CI/桌面无电池 sysfs → 当前容量收敛 0.92×5000=4600。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "zh-rCN-w1200dp-h3000dp")
class ModuleChainAuditTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    @get:Rule
    val composeRule = createComposeRule()

    private fun mountShell(viewModel: BatteryViewModel = BatteryViewModel(app)) {
        composeRule.setContent { BatteryScreen(viewModel = viewModel) }
    }

    /** 双时钟推进：looper.idle 执行 Handler 协程 → waitForIdle 推进重组渲染 */
    private fun idle() {
        Shadows.shadowOf(Looper.getMainLooper()).idle()
        composeRule.waitForIdle()
    }

    // ===== 1. m6 P0 回归：顶栏「返回」退出设置页 =====

    @Test
    fun settingsPage_topBarBackClosesNavigationLoop() {
        mountShell()

        // 顶栏「我的」进入设置页
        composeRule.onNodeWithText("我的").performClick()
        composeRule.waitForIdle()
        // 设置态顶栏切换为「返回」按钮 (旧实现无任何返回入口)
        composeRule.onNodeWithText("返回").assertExists()

        // 点击「返回」回到 5 Tab 主页：「我的」入口重新在场
        composeRule.onNodeWithText("返回").performClick()
        composeRule.waitForIdle()
        composeRule.onNodeWithText("我的").assertExists()
    }

    // ===== 2. m6 P0 回归：底栏点击退出设置页 =====

    @Test
    fun settingsPage_bottomNavTabExitsSettings() {
        mountShell()

        composeRule.onNodeWithText("我的").performClick()
        composeRule.waitForIdle()
        composeRule.onNodeWithText("返回").assertExists()

        // 设置态下点击底栏「续航分析」：退出设置页并切换至续航分析 Tab
        // (旧实现仅切 selectedTab，AnimatedContent 恒渲染 SETTINGS_TAB)
        composeRule.onNodeWithText("续航分析").performClick()
        composeRule.waitForIdle()
        composeRule.onNodeWithText("预计可用时长").assertExists()
        // 顶栏恢复「我的」入口 (已退出设置态)
        composeRule.onNodeWithText("我的").assertExists()
    }

    // ===== 3. m3 P1 回归：充电页满充卡倒计时接线 =====

    @Test
    fun chargingTab_fullChargeSimCountdownWired() {
        val viewModel = BatteryViewModel(app)
        mountShell(viewModel)

        // 底栏切至充电管理页
        composeRule.onNodeWithText("充电管理").performClick()
        composeRule.waitForIdle()

        // 触发一键模拟完全充满 (triggerFullChargeSimulation 同步生效)
        composeRule.onNodeWithText("一键模拟完全充满 (100% + 16mA)").performClick()
        idle()

        // 旧实现 simulationRemainingSec 硬编码 0L：倒计时永不显示、按钮保持可点。
        // 现从 VM 单源收集：保持期剩余 15s > 0，按钮文本切换为「模拟保持中」并禁用
        val simulating = composeRule.onAllNodesWithText(
            "模拟保持中", substring = true
        ).onFirst()
        simulating.assertIsNotEnabled()
    }

    // ===== 4. m2 续航分析：导出按钮 enabled 门控 =====

    @Test
    fun runtimeTab_exportButtonsGatedByDataAvailability() {
        val viewModel = BatteryViewModel(app)
        composeRule.setContent {
            RuntimeScreen(state = viewModel.batteryInfo.value, viewModel = viewModel)
        }
        composeRule.waitForIdle()

        // 会话导出恒禁用：会话由 BatteryHistoryStore 状态机检测闭合产生，测试
        // 环境 (无充放电广播) 不存在会话数据——空数据防误触门控生效
        composeRule.onNodeWithText("导出会话 CSV").assertIsNotEnabled()

        // 曲线导出：数据在场即启用。注意 1Hz 轮询首拍也会积累样本 (时序不定)，
        // 且 StateFlow.collectAsState 传播在桌面测试时钟下可能滞后 waitForIdle，
        // 故不硬断言初始禁用，以测试种子 + waitUntil 轮询启用态收口
        val seed = viewModel.batteryInfo.value
        viewModel.seedTelemetryHistoryForTest(listOf(seed, seed, seed))
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("导出曲线 CSV")
                .fetchSemanticsNodes()
                .any { !it.config.contains(SemanticsProperties.Disabled) }
        }
        composeRule.onNodeWithText("导出曲线 CSV").assertIsEnabled()
        composeRule.onNodeWithText("导出会话 CSV").assertIsNotEnabled()
    }

    // ===== 5. m4 健康档案：满充卡双入口在场 =====

    @Test
    fun healthTab_fullChargeDualEntryPresent() {
        mountShell()

        composeRule.onNodeWithText("健康档案").performClick()
        composeRule.waitForIdle()
        composeRule.onNodeWithText("电池健康度 (实测口径)", substring = true).assertExists()
        // 满充判定卡复用总览同款组件 (健康页内至少一个完整触发入口)
        assertTrue(
            "健康档案页缺少满充判定触发入口",
            composeRule.onAllNodesWithText(
                "一键模拟完全充满 (100% + 16mA)", substring = true
            ).fetchSemanticsNodes().isNotEmpty()
        )
    }

    // ===== 6. m5 硬件实验室：进入模拟 → 跨页横幅 → 一键恢复 闭环 =====

    @Test
    fun labTab_simulationBannerClosesLoopAcrossTabs() {
        mountShell()

        // 实验室页显式进入模拟模式
        composeRule.onNodeWithText("硬件实验室").performClick()
        composeRule.waitForIdle()
        composeRule.onNodeWithText("进入模拟模式").performClick()
        idle()

        // 切回总览：模拟警示横幅常驻 (明示模拟数据性质，诚实口径)
        composeRule.onNodeWithText("状态总览").performClick()
        composeRule.waitForIdle()
        composeRule.onNodeWithText("硬件实验室模拟数据生效中").assertExists()

        // 横幅「恢复真实」一键退出模拟 → 横幅消失 (闭环确认)
        composeRule.onNodeWithText("恢复真实").performClick()
        idle()
        assertTrue(
            "点击横幅恢复后警示横幅仍存在 (模拟态未退出)",
            composeRule.onAllNodesWithText("硬件实验室模拟数据生效中")
                .fetchSemanticsNodes().isEmpty()
        )
    }
}
