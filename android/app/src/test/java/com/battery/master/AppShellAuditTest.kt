package com.battery.master

import android.app.Application
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.core.app.ApplicationProvider
import com.battery.master.ui.BatteryScreen
import com.battery.master.viewmodel.BatteryViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * 应用外壳层审计回归测试 (Robolectric + Compose Test，无模拟器)
 *
 * 覆盖 v1.2.3 外壳层审计修复点：
 * 1. 双 Tab (状态总览/硬件实验室) 导航功能完整、内容正确切换；
 * 2. Tab 选中态跨配置变更 (StateRestorationTester 模拟 Activity 重建) 保留——
 *    旧实现 remember 会在重建后弹回 Tab 0，丢失用户在实验室的调试上下文；
 * 3. 设计容量校准对话框跨配置变更存活，输入上下文不丢失；
 * 4. TopAppBar 副标题按真实运行 API 动态渲染 (旧实现硬编码 "Android 15"，
 *    在 minSdk 26~34 设备上宣称失实)；
 * 5. 关于 APP 版本徽章经 BuildConfig 单源注入，与构建配置一致。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w1200dp-h3000dp")
class AppShellAuditTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    @get:Rule
    val composeRule = createComposeRule()

    /** 以真实 BatteryViewModel 挂载外壳层 BatteryScreen，返回状态恢复测试器 */
    private fun mountShell(): StateRestorationTester {
        val viewModel = BatteryViewModel(app)
        return StateRestorationTester(composeRule).apply {
            setContent { BatteryScreen(viewModel = viewModel) }
        }
    }

    // ===== 1. 双 Tab 导航功能完整 =====

    @Test
    fun tabs_switchBetweenOverviewAndLab() {
        mountShell()

        // 默认 Tab 0：状态总览内容在场
        composeRule.onNodeWithText("12 项充放电核心指标详情").assertExists()

        // 切换到硬件实验室：实验室专属内容在场
        composeRule.onNodeWithText("硬件实验室").performClick()
        composeRule.onNodeWithText("一键工作场景模拟").assertExists()
        composeRule.onNodeWithText("恢复真实硬件遥测").assertExists()

        // 四个一键场景齐备 (外壳层 → 实验室模块链路完整)
        for (scenario in listOf("充满校准", "极速闪充", "高负载游戏放电", "电池过热警报")) {
            composeRule.onNodeWithText(scenario).assertExists()
        }

        // 返回状态总览：实验室内容退场
        composeRule.onNodeWithText("状态总览").performClick()
        composeRule.onNodeWithText("12 项充放电核心指标详情").assertExists()
    }

    // ===== 2. Tab 选中态跨配置变更保留 =====

    @Test
    fun tabSelection_survivesActivityRecreation() {
        val tester = mountShell()

        composeRule.onNodeWithText("硬件实验室").performClick()
        composeRule.onNodeWithText("一键工作场景模拟").assertExists()

        // 模拟 Activity 重建 (旋转/折叠/字体变更)：rememberSaveable 恢复选中态
        // (ui-test-junit4 1.7.x API 名为 emulateSavedInstanceStateRestore，1.8+ 才更名 emulateSaveAndRestore)
        tester.emulateSavedInstanceStateRestore()

        // 旧实现 remember：重建后弹回 Tab 0，"一键工作场景模拟" 消失
        composeRule.onNodeWithText("一键工作场景模拟").assertExists()
        composeRule.onNodeWithText("恢复真实硬件遥测").assertExists()
    }

    // ===== 3. 校准对话框跨配置变更存活 =====

    @Test
    fun designCapacityDialog_survivesRecreation() {
        val tester = mountShell()

        // 打开设计容量校准对话框 (按钮文案含当前容量，用子串匹配)
        composeRule.onNodeWithText("校准设计容量", substring = true).performClick()
        composeRule.onNodeWithText("校准设计容量 (指标 04)").assertExists()

        // 配置变更重建后对话框不得消失 (旧实现 remember 直接丢失)
        tester.emulateSavedInstanceStateRestore()
        composeRule.onNodeWithText("校准设计容量 (指标 04)").assertExists()
    }

    // ===== 4. TopAppBar 副标题按真实 API 渲染 =====

    @Test
    fun topAppBar_subtitleReflectsActualApiLevel() {
        mountShell()

        composeRule.onNodeWithText("电池大师").assertExists()
        // 副标题按真实运行 API 动态渲染，而非硬编码 "Android 15"
        val expected = "API ${android.os.Build.VERSION.SDK_INT} 电池管理服务 · 原生硬件遥测"
        composeRule.onNodeWithText(expected).assertExists()
    }

    // ===== 5. 版本徽章 BuildConfig 单源注入 =====

    @Test
    fun aboutCard_versionBadgeInjectedFromBuildConfig() {
        mountShell()

        // 徽章文案与构建配置严格一致 (单源注入；版本号语义校验避免每次 bump 逐字失效)
        composeRule.onNodeWithText("v${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})").assertExists()
        assertTrue(
            "versionName 必须为语义化版本 (允许 alpha/beta/rc/dev 预发布后缀，如 2.0.0-alpha)",
            Regex("""\d+\.\d+\.\d+(-[\w.]+)?""").matches(BuildConfig.VERSION_NAME)
        )
        assertTrue("versionCode 必须单调递增 (v2.0.0-alpha.4=16)", BuildConfig.VERSION_CODE >= 10)
    }
}
