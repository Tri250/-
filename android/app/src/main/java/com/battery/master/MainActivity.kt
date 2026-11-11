package com.battery.master

import android.os.Bundle
import androidx.activity.ComponentActivity
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
        enableEdgeToEdge()

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
}
