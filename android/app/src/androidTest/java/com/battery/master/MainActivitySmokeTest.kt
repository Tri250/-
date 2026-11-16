package com.battery.master

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeUp
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * v2.0.0-beta.1 P0 GA 修复：仪器化冒烟测试 (真机/模拟器 connectedDebugAndroidTest)
 *
 * GA 阻断项"补仪器化测试"的真实现：Robolectric 单测只能覆盖 JVM 语义，
 * 真机链路 (Activity 生命周期 / 系统电池广播 / Compose 语义树 / FileProvider)
 * 必须在模拟器或真机验证。CI 侧由 build-apk.yml 的 instrumented job 在
 * Ubuntu 模拟器 (API 30) 执行本文件全部用例；机型矩阵扩展验收清单见
 * docs/DEVICE_MATRIX.md。
 *
 * locale 无关设计 (CI Run 43772453265 回归修复)：模拟器默认 en_US locale 时
 * values-en 英文资源胜出，硬编码中文断言永久 miss 导致 ComposeTimeoutException
 * (Condition still not satisfied after 15000 ms)。全部文案改经
 * targetContext.getString(R.string.*) 动态解析——设备 locale 是什么，断言文本
 * 就与实际渲染文本同源，任何 locale (zh/en/…) 下都成立。
 *
 * 稳定性设计：遥测发布 1Hz 刷新导致语义树周期性变化，全部断言改用
 * waitUntil (显式超时) 而非 waitForIdle 后立即断言，避免 AppNotIdle 抖动；
 * 纯软件模拟 (-accel off，无 KVM) 首帧极慢，默认超时 15s → 30s；
 * Tab 文本断言使用精确匹配 (substring=false 默认) 保证语义节点唯一。
 */
@RunWith(AndroidJUnit4::class)
class MainActivitySmokeTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    /** 设备 locale 同源文案：与被测 UI 的 stringResource 渲染文本严格一致 */
    private fun res(id: Int): String =
        InstrumentationRegistry.getInstrumentation().targetContext.getString(id)

    private val tabOverview get() = res(R.string.tab_overview)
    private val tabTelemetry get() = res(R.string.tab_telemetry)
    private val tabHealth get() = res(R.string.tab_health)
    private val tabLab get() = res(R.string.tab_lab)

    /** 等待指定精确文本节点出现 (默认 30s 显式超时，容纳纯软件模拟慢首帧) */
    private fun awaitText(text: String, timeoutMs: Long = 30_000L) {
        composeRule.waitUntil(timeoutMillis = timeoutMs) {
            composeRule.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun appLaunchesAndShowsOverviewHero() {
        // 启动冒烟：Activity onCreate → ViewModel 构造 → Compose 首帧渲染全链路，
        // 任何一环真机异常 (ROM 差异/系统服务缺失) 都会在本用例暴露
        awaitText(res(R.string.app_name))
        composeRule.onNodeWithText(res(R.string.app_name)).assertIsDisplayed()
        awaitText(tabOverview)
        composeRule.onNodeWithText(tabOverview).assertIsDisplayed()
    }

    @Test
    fun allFourTabsNavigateWithoutCrash() {
        // 四 Tab 导航：总览 → 遥测分析 → 健康档案 → 硬件实验室 → 回总览，
        // 每个 Tab 停留并确认导航条目存在，页面渲染崩溃即失败
        awaitText(tabTelemetry)
        listOf(tabTelemetry, tabHealth, tabLab, tabOverview).forEach { tab ->
            composeRule.onNodeWithText(tab).performClick()
            awaitText(tab, timeoutMs = 15_000L)
        }
    }

    @Test
    fun telemetryTabRendersSessionHistoryCard() {
        // P0 持久化链路真机验证：遥测分析 Tab 挂载充放电会话统计卡
        // (BatteryHistoryStore 会话/样本持久化的 UI 入口)
        awaitText(tabTelemetry)
        composeRule.onNodeWithText(tabTelemetry).performClick()
        // 会话卡是遥测页 LazyColumn 尾部的 item，手机视口下位于首屏之下未被组合
        // (语义树不存在，Run 43775947015 超时根因)。performScrollToNode 在 1Hz
        // 遥测重组流上滚动失效 (Run 43777025731)，改用确定性上滑循环：每滑一次
        // 检查一次语义树，滑到 LazyColumn 末尾该卡片必然被组合
        val sessionCardTitle = res(R.string.session_card_title)
        var cardVisible = false
        for (attempt in 0 until 8) {
            if (composeRule.onAllNodesWithText(sessionCardTitle, substring = true)
                    .fetchSemanticsNodes().isNotEmpty()
            ) {
                cardVisible = true
                break
            }
            composeRule.onRoot().performTouchInput { swipeUp() }
        }
        assertTrue(
            "充放电会话统计卡未在遥测页出现 (8 次上滑后): $sessionCardTitle",
            cardVisible
        )
    }
}
