package com.battery.master

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * v2.0.0-beta.1 P0 GA 修复：仪器化冒烟测试 (真机/模拟器 connectedDebugAndroidTest)
 *
 * GA 阻断项"补仪器化测试"的真实现：Robolectric 单测只能覆盖 JVM 语义，
 * 真机链路 (Activity 生命周期 / 系统电池广播 / Compose 语义树 / FileProvider)
 * 必须在模拟器或真机验证。CI 侧由 build-apk.yml 的 instrumented job 在
 * Ubuntu KVM 模拟器 (API 30) 执行本文件全部用例；机型矩阵扩展验收清单见
 * docs/DEVICE_MATRIX.md。
 *
 * 稳定性设计：遥测发布 1Hz 刷新导致语义树周期性变化，全部断言改用
 * waitUntil (显式超时) 而非 waitForIdle 后立即断言，避免 AppNotIdle 抖动；
 * Tab 文本断言使用精确匹配 (substring=false 默认) 保证语义节点唯一。
 */
@RunWith(AndroidJUnit4::class)
class MainActivitySmokeTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    /** 等待指定精确文本节点出现 (默认 15s 显式超时) */
    private fun awaitText(text: String, timeoutMs: Long = 15_000L) {
        composeRule.waitUntil(timeoutMillis = timeoutMs) {
            composeRule.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun appLaunchesAndShowsOverviewHero() {
        // 启动冒烟：Activity onCreate → ViewModel 构造 → Compose 首帧渲染全链路，
        // 任何一环真机异常 (ROM 差异/系统服务缺失) 都会在本用例暴露
        awaitText("电池大师")
        composeRule.onNodeWithText("电池大师").assertIsDisplayed()
        awaitText("状态总览")
        composeRule.onNodeWithText("状态总览").assertIsDisplayed()
    }

    @Test
    fun allFourTabsNavigateWithoutCrash() {
        // 四 Tab 导航：总览 → 遥测分析 → 健康档案 → 硬件实验室 → 回总览，
        // 每个 Tab 停留并确认导航条目存在，页面渲染崩溃即失败
        awaitText("遥测分析")
        listOf("遥测分析", "健康档案", "硬件实验室", "状态总览").forEach { tab ->
            composeRule.onNodeWithText(tab).performClick()
            awaitText(tab, timeoutMs = 10_000L)
        }
    }

    @Test
    fun telemetryTabRendersSessionHistoryCard() {
        // P0 持久化链路真机验证：遥测分析 Tab 挂载充放电会话统计卡
        // (BatteryHistoryStore 会话/样本持久化的 UI 入口)
        awaitText("遥测分析")
        composeRule.onNodeWithText("遥测分析").performClick()
        composeRule.waitUntil(timeoutMillis = 15_000L) {
            composeRule.onAllNodesWithText("充放电会话统计", substring = true)
                .fetchSemanticsNodes().isNotEmpty()
        }
    }
}
