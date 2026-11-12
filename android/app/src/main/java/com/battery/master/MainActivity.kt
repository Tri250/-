package com.battery.master

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import com.battery.master.ui.BatteryScreen
import com.battery.master.ui.theme.DesignTokens
import com.battery.master.viewmodel.BatteryViewModel

class MainActivity : ComponentActivity() {

    private val batteryViewModel: BatteryViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 外壳层审计修复：应用全局强制暗色 HUD (windowBackground #030712 恒暗)，
        // 系统栏图标对比度必须锚定应用自身暗底，而非跟随系统浅色/深色设置。
        // enableEdgeToEdge 默认 SystemBarStyle.auto 按系统模式切换图标明暗，
        // 系统浅色模式下深色图标画在暗色窗口背景上不可见 → 显式强制亮图标
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
        )

        setContent {
            // 统一品牌主题：Material3 色彩/字体体系映射到 DesignTokens 令牌，
            // 消除默认 Material 配色与 HUD 风格组件的割裂感
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = DesignTokens.BrandPrimary,
                    onPrimary = Color.White,
                    primaryContainer = DesignTokens.BgElevated,
                    onPrimaryContainer = DesignTokens.BrandPrimaryLight,
                    secondary = DesignTokens.InfoSky,
                    onSecondary = Color.White,
                    tertiary = DesignTokens.AccentCyan,
                    background = DesignTokens.BgDeep,
                    onBackground = DesignTokens.TextPrimary,
                    surface = DesignTokens.BgSurface,
                    onSurface = DesignTokens.TextPrimary,
                    surfaceVariant = DesignTokens.BgElevated,
                    onSurfaceVariant = DesignTokens.TextSecondary,
                    outline = DesignTokens.BorderStrong,
                    error = DesignTokens.DangerRose,
                    onError = Color.White
                ),
                typography = Typography(
                    // 全站数字/技术标签统一等宽字体，与 Web font-mono 令牌一致
                    bodyLarge = Typography().bodyLarge.copy(fontFamily = FontFamily.Monospace),
                    bodyMedium = Typography().bodyMedium.copy(fontFamily = FontFamily.Monospace),
                    labelLarge = Typography().labelLarge.copy(fontFamily = FontFamily.Monospace)
                )
            ) {
                BatteryScreen(viewModel = batteryViewModel)
            }
        }
    }

    // v1.2.4 P3 审计修复：1Hz 轮询生命周期门控——退后台/锁屏暂停 sysfs 轮询
    // (电池监测工具持续后台轮询属反向耗电缺陷)，回前台恢复；广播通道不受影响
    override fun onResume() {
        super.onResume()
        batteryViewModel.setTelemetryPollingActive(true)
    }

    override fun onPause() {
        super.onPause()
        batteryViewModel.setTelemetryPollingActive(false)
    }
}
