package com.battery.master.ui.theme

import android.app.Activity
import android.content.Context
import android.content.SharedPreferences
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.core.content.edit
import androidx.compose.ui.text.font.FontFamily

/** 主题模式：跟随系统 / 浅色（薄荷能量，默认）/ 深色（夜航森林绿） */
enum class MintThemeMode { SYSTEM, LIGHT, DARK }

/** 主题偏好持久化（SharedPreferences，原子写入） */
object MintThemeStore {
    private const val PREFS = "mint_theme_prefs"
    private const val KEY_MODE = "theme_mode"

    fun load(context: Context): MintThemeMode {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val name = prefs.getString(KEY_MODE, MintThemeMode.LIGHT.name) ?: MintThemeMode.LIGHT.name
        return runCatching { MintThemeMode.valueOf(name) }.getOrDefault(MintThemeMode.LIGHT)
    }

    fun save(context: Context, mode: MintThemeMode) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit {
            putString(KEY_MODE, mode.name)
        }
    }
}

private val LightScheme = lightColorScheme(
    primary = LightMintColors.brandPrimary,
    onPrimary = Color.White,
    primaryContainer = LightMintColors.brandPrimaryLight,
    onPrimaryContainer = Color.White,
    secondary = LightMintColors.infoSky,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFEAF3FF),
    onSecondaryContainer = Color(0xFF0A66CC),
    tertiary = LightMintColors.accentCyan,
    onTertiary = Color.White,
    error = LightMintColors.dangerRose,
    onError = Color.White,
    errorContainer = Color(0xFFFFECEA),
    onErrorContainer = Color(0xFFB42318),
    background = LightMintColors.bgDeep,
    onBackground = LightMintColors.textPrimary,
    surface = LightMintColors.bgSurface,
    onSurface = LightMintColors.textPrimary,
    surfaceVariant = LightMintColors.bgElevated,
    onSurfaceVariant = LightMintColors.textSecondary,
    outline = LightMintColors.borderStrong,
    outlineVariant = LightMintColors.border,
)

private val DarkScheme = darkColorScheme(
    primary = DarkMintColors.brandPrimary,
    onPrimary = Color(0xFF05230F),
    primaryContainer = Color(0xFF1B4D2B),
    onPrimaryContainer = Color(0xFFB9F6CA),
    secondary = DarkMintColors.infoSky,
    onSecondary = Color(0xFF08243D),
    secondaryContainer = Color(0xFF14324F),
    onSecondaryContainer = DarkMintColors.textInfo,
    tertiary = DarkMintColors.accentCyan,
    onTertiary = Color(0xFF042B33),
    error = DarkMintColors.dangerRose,
    onError = Color(0xFF450A16),
    errorContainer = Color(0xFF5C1225),
    onErrorContainer = Color(0xFFFFDADD),
    background = DarkMintColors.bgDeep,
    onBackground = DarkMintColors.textPrimary,
    surface = DarkMintColors.bgSurface,
    onSurface = DarkMintColors.textPrimary,
    surfaceVariant = DarkMintColors.bgElevated,
    onSurfaceVariant = DarkMintColors.textSecondary,
    outline = DarkMintColors.borderStrong,
    outlineVariant = DarkMintColors.border,
)

/**
 * 「薄荷能量」主题入口。
 *
 * - 默认浅色（对齐参考图）；深色为「夜航森林绿」，随 [mode] 或系统切换
 * - 不启用 Material You 动态取色：品牌绿语义（健康/温度/充放电方向）优先
 * - 同步状态栏/导航栏图标明暗，保证 edge-to-edge 下可读
 */
@Composable
fun MintTheme(
    mode: MintThemeMode = MintThemeMode.SYSTEM,
    content: @Composable () -> Unit
) {
    // 主题状态提升：holder 为唯一事实来源——「我的」页改写后整体重组换肤，
    // MainActivity 仅负责首次加载持久化值，之后不再参与主题决策
    val holder = remember { MintThemeHolder(mode) }
    val current = holder.current
    val dark = when (current) {
        MintThemeMode.SYSTEM -> isSystemInDarkTheme()
        MintThemeMode.LIGHT -> false
        MintThemeMode.DARK -> true
    }
    val colors = if (dark) DarkMintColors else LightMintColors
    val scheme: ColorScheme = if (dark) DarkScheme else LightScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val activity = view.context as? Activity ?: return@SideEffect
            val controller = androidx.core.view.WindowCompat
                .getInsetsController(activity.window, view)
            controller.isAppearanceLightStatusBars = !dark
            controller.isAppearanceLightNavigationBars = !dark
        }
    }

    // 主题 holder 供「我的」页改写 (唯一事实来源，见函数头部)
    androidx.compose.runtime.CompositionLocalProvider(
        LocalMintColors provides colors,
        LocalMintThemeMode provides holder
    ) {
        MaterialTheme(
            colorScheme = scheme,
            typography = Typography(
                // 统一无衬线（薄荷能量为圆润几何风，不用等宽）
                displayLarge = MaterialTheme.typography.displayLarge.copy(fontFamily = FontFamily.SansSerif),
                displayMedium = MaterialTheme.typography.displayMedium.copy(fontFamily = FontFamily.SansSerif),
                displaySmall = MaterialTheme.typography.displaySmall.copy(fontFamily = FontFamily.SansSerif),
                headlineLarge = MaterialTheme.typography.headlineLarge.copy(fontFamily = FontFamily.SansSerif),
                headlineMedium = MaterialTheme.typography.headlineMedium.copy(fontFamily = FontFamily.SansSerif),
                headlineSmall = MaterialTheme.typography.headlineSmall.copy(fontFamily = FontFamily.SansSerif),
                titleLarge = MaterialTheme.typography.titleLarge.copy(fontFamily = FontFamily.SansSerif),
                titleMedium = MaterialTheme.typography.titleMedium.copy(fontFamily = FontFamily.SansSerif),
                titleSmall = MaterialTheme.typography.titleSmall.copy(fontFamily = FontFamily.SansSerif),
                bodyLarge = MaterialTheme.typography.bodyLarge.copy(fontFamily = FontFamily.SansSerif),
                bodyMedium = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.SansSerif),
                bodySmall = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.SansSerif),
                labelLarge = MaterialTheme.typography.labelLarge.copy(fontFamily = FontFamily.SansSerif),
                labelMedium = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.SansSerif),
                labelSmall = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.SansSerif)
            ),
            content = content
        )
    }
}

/** 主题模式状态持有者（可被「我的」页改写） */
class MintThemeHolder(initial: MintThemeMode) {
    var current: MintThemeMode by mutableStateOf(initial)
}

val LocalMintThemeMode = androidx.compose.runtime.staticCompositionLocalOf { MintThemeHolder(MintThemeMode.LIGHT) }
