package com.battery.master.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * 电池大师 ·「薄荷能量」设计令牌 2.0
 *
 * 双主题架构：
 * - [MintColors] 承载全部色彩令牌（浅色「薄荷能量」为默认主题）
 * - [LocalMintColors] 为 CompositionLocal，随主题模式切换整体换色
 * - [DesignTokens] 保留既有调用点写法：颜色经 @Composable getter 代理到当前
 *   主题调色板，字体/圆角/动效时长为静态常量
 *
 * 新增 UI 一律使用 `val mint = LocalMintColors.current` 直接取色；
 * [DesignTokens] 门面仅用于存量代码平滑迁移，迁移完成后可删除。
 */
data class MintColors(
    // 画布与表面
    val bgDeep: Color,
    val bgSurface: Color,
    val bgElevated: Color,
    val bgGlass: Color,
    val bgInset: Color,
    // 描边
    val border: Color,
    val borderStrong: Color,
    val borderFocus: Color,
    // 文本
    val textPrimary: Color,
    val textSecondary: Color,
    val textTertiary: Color,
    val textDisabled: Color,
    // 品牌绿
    val brandPrimary: Color,
    val brandPrimaryLight: Color,
    val brandPrimaryDark: Color,
    // 品牌容器色（胶囊底 / 导航指示器）
    val brandChip: Color,
    val brandSurface: Color,
    // 语义色
    val accentCyan: Color,
    val infoSky: Color,
    val fullTeal: Color,
    val featurePurple: Color,
    val accentTeal: Color,
    val accentCyanDark: Color,
    val warningAmber: Color,
    val dangerRose: Color,
    val dangerContainer: Color,
    // 语义文本色（浅底可读优先）
    val textGood: Color,
    val textInfo: Color,
    val textWarning: Color,
    val textDanger: Color,
    val textError: Color,
    val textAmberStrong: Color,
    // 温度色阶
    val tempCold: Color,
    val tempWarm: Color,
    val tempHot: Color,
    val tempPurple: Color,
) {
    /** 电池状态语义色（口径与 BatteryStatus.label 同源） */
    fun statusColor(status: String): Color = when (status) {
        "充电中" -> brandPrimary
        "已充满" -> fullTeal
        "放电中", "未充电" -> infoSky
        else -> textTertiary
    }

    /** 健康状况语义色 */
    fun healthQualityColor(quality: String): Color = when (quality) {
        "良好" -> textGood
        "过热", "超压" -> textWarning
        "损坏" -> textDanger
        else -> textTertiary
    }

    /**
     * 温度分段色——阈值单源 [com.battery.master.service.BatteryTelemetryParser]
     * TEMP_WARM_THRESHOLD_C(38) / TEMP_OVERHEAT_THRESHOLD_C(45)
     */
    fun temperatureColor(temp: Float): Color = when {
        temp > 45f -> tempHot
        temp >= 38f -> tempWarm
        temp <= 0f -> tempCold
        else -> brandPrimary
    }
}

/**
 * 浅色主题 · 薄荷能量（默认）
 * 画布 #F3FAF0 → 卡片纯白玻璃 → 果绿 #2FCB5B 高光；
 * 正文一律使用深绿墨色系保证 WCAG AA 对比度。
 */
val LightMintColors = MintColors(
    bgDeep = Color(0xFFF3FAF0),
    bgSurface = Color(0xFFFFFFFF),
    bgElevated = Color(0xFFF7FBF5),
    bgGlass = Color(0xF2FFFFFF),
    bgInset = Color(0xFFF2F8F0),
    border = Color(0xFFE4EEE3),
    borderStrong = Color(0xFFDDEBDA),
    borderFocus = Color(0x661AAE4A),
    textPrimary = Color(0xFF0B1A10),
    textSecondary = Color(0xFF4E6153),
    textTertiary = Color(0xFF7E9384),
    textDisabled = Color(0xFFB6C6BA),
    brandPrimary = Color(0xFF1AAE4A),
    brandPrimaryLight = Color(0xFF128A39),
    brandPrimaryDark = Color(0xFF0E6B2C),
    brandChip = Color(0xFFDDF8E3),
    brandSurface = Color(0xFFF0FBF2),
    accentCyan = Color(0xFF0891B2),
    infoSky = Color(0xFF0A84FF),
    fullTeal = Color(0xFF0F9488),
    featurePurple = Color(0xFF7C5CFF),
    accentTeal = Color(0xFF0F766E),
    accentCyanDark = Color(0xFF0E7490),
    warningAmber = Color(0xFFD97706),
    dangerRose = Color(0xFFDC2626),
    dangerContainer = Color(0xFFB42318),
    textGood = Color(0xFF128A39),
    textInfo = Color(0xFF0A66CC),
    textWarning = Color(0xFFB26B00),
    textDanger = Color(0xFFC53030),
    textError = Color(0xFFB42318),
    textAmberStrong = Color(0xFFB26B00),
    tempCold = Color(0xFF2563EB),
    tempWarm = Color(0xFFD97706),
    tempHot = Color(0xFFDC2626),
    tempPurple = Color(0xFF0E7490),
)

/**
 * 深色主题 · 夜航森林绿
 * 近黑墨绿底 + 亮绿强调，AMOLED 纯黑延展由 canvas 微亮保证卡片可读。
 */
val DarkMintColors = MintColors(
    bgDeep = Color(0xFF08120B),
    bgSurface = Color(0xFF0F1D13),
    bgElevated = Color(0xFF16281A),
    bgGlass = Color(0xE60F1D13),
    bgInset = Color(0xFF0B1710),
    border = Color(0xFF223A28),
    borderStrong = Color(0xFF2E4A34),
    borderFocus = Color(0x664ADE80),
    textPrimary = Color(0xFFE4F2E6),
    textSecondary = Color(0xFFA8BFAE),
    textTertiary = Color(0xFF7E9A85),
    textDisabled = Color(0xFF4C6353),
    brandPrimary = Color(0xFF4ADE80),
    brandPrimaryLight = Color(0xFF86EFAC),
    brandPrimaryDark = Color(0xFF2FCB5B),
    brandChip = Color(0xFF1B4D2B),
    brandSurface = Color(0xFF12291A),
    accentCyan = Color(0xFF22D3EE),
    infoSky = Color(0xFF38BDF8),
    fullTeal = Color(0xFF2DD4BF),
    featurePurple = Color(0xFFC4B5FD),
    accentTeal = Color(0xFF14B8A6),
    accentCyanDark = Color(0xFF22D3EE),
    warningAmber = Color(0xFFFBBF24),
    dangerRose = Color(0xFFFB7185),
    dangerContainer = Color(0xFF9F1239),
    textGood = Color(0xFF6EE7B7),
    textInfo = Color(0xFF7DD3FC),
    textWarning = Color(0xFFFDE68A),
    textDanger = Color(0xFFFDA4AF),
    textError = Color(0xFFFB7185),
    textAmberStrong = Color(0xFFFBBF24),
    tempCold = Color(0xFFBFDBFE),
    tempWarm = Color(0xFFFDE68A),
    tempHot = Color(0xFFFDA4AF),
    tempPurple = Color(0xFFE9D5FF),
)

/** 当前主题调色板；默认浅色「薄荷能量」 */
val LocalMintColors = staticCompositionLocalOf { LightMintColors }

/**
 * 设计令牌门面。
 *
 * 颜色：@Composable getter 代理 [LocalMintColors]，存量调用点零改动即可双主题。
 * 字体/圆角/动效：静态常量，与主题无关。
 *
 * 注意：颜色 getter 仅可在 @Composable 上下文求值；drawBehind/Canvas 等
 * 非组合回调内需先在组合作用域捕获为局部 val。
 */
object DesignTokens {

    // ---- 画布与表面 ----
    val BgDeep: Color @Composable get() = LocalMintColors.current.bgDeep
    val BgSurface: Color @Composable get() = LocalMintColors.current.bgSurface
    val BgElevated: Color @Composable get() = LocalMintColors.current.bgElevated
    val BgGlass: Color @Composable get() = LocalMintColors.current.bgGlass
    val BgInset: Color @Composable get() = LocalMintColors.current.bgInset

    // ---- 描边 ----
    val Border: Color @Composable get() = LocalMintColors.current.border
    val BorderStrong: Color @Composable get() = LocalMintColors.current.borderStrong
    val BorderFocus: Color @Composable get() = LocalMintColors.current.borderFocus

    // ---- 文本 ----
    val TextPrimary: Color @Composable get() = LocalMintColors.current.textPrimary
    val TextSecondary: Color @Composable get() = LocalMintColors.current.textSecondary
    val TextTertiary: Color @Composable get() = LocalMintColors.current.textTertiary
    val TextDisabled: Color @Composable get() = LocalMintColors.current.textDisabled

    // ---- 品牌 ----
    val BrandPrimary: Color @Composable get() = LocalMintColors.current.brandPrimary
    val BrandPrimaryLight: Color @Composable get() = LocalMintColors.current.brandPrimaryLight
    val BrandPrimaryDark: Color @Composable get() = LocalMintColors.current.brandPrimaryDark
    val BrandChip: Color @Composable get() = LocalMintColors.current.brandChip
    val BrandSurface: Color @Composable get() = LocalMintColors.current.brandSurface

    // ---- 语义 ----
    val AccentCyan: Color @Composable get() = LocalMintColors.current.accentCyan
    val InfoSky: Color @Composable get() = LocalMintColors.current.infoSky
    val FullTeal: Color @Composable get() = LocalMintColors.current.fullTeal
    val FeaturePurple: Color @Composable get() = LocalMintColors.current.featurePurple
    val AccentTeal: Color @Composable get() = LocalMintColors.current.accentTeal
    val AccentCyanDark: Color @Composable get() = LocalMintColors.current.accentCyanDark
    val WarningAmber: Color @Composable get() = LocalMintColors.current.warningAmber
    val DangerRose: Color @Composable get() = LocalMintColors.current.dangerRose
    val DangerContainer: Color @Composable get() = LocalMintColors.current.dangerContainer

    // ---- 语义文本 ----
    val TextGood: Color @Composable get() = LocalMintColors.current.textGood
    val TextInfo: Color @Composable get() = LocalMintColors.current.textInfo
    val TextWarning: Color @Composable get() = LocalMintColors.current.textWarning
    val TextDanger: Color @Composable get() = LocalMintColors.current.textDanger
    val TextError: Color @Composable get() = LocalMintColors.current.textError
    val TextAmberStrong: Color @Composable get() = LocalMintColors.current.textAmberStrong

    // ---- 温度色阶 ----
    val TempCold: Color @Composable get() = LocalMintColors.current.tempCold
    val TempWarm: Color @Composable get() = LocalMintColors.current.tempWarm
    val TempHot: Color @Composable get() = LocalMintColors.current.tempHot
    val TempPurple: Color @Composable get() = LocalMintColors.current.tempPurple

    // ---- 字号阶梯（7 级 + Hero）----
    val Font2xs = 10.sp
    val FontXs = 12.sp
    val FontSm = 14.sp
    val FontBase = 16.sp
    val FontXl = 20.sp
    val Font2xl = 24.sp
    val FontHero = 68.sp

    // ---- 圆角 ----
    val RadiusChip = 8.dp
    val RadiusCard = 16.dp
    val RadiusPanel = 20.dp
    val RadiusHero = 24.dp
    val RadiusPill = 999.dp

    // ---- 动效时长 ----
    const val DurationMicro = 150
    const val DurationFast = 200
    const val DurationSmooth = 250
    const val DurationSlow = 350
    const val DurationHero = 700

    // ---- 语义映射（代理当前调色板）----
    @Composable
    fun statusColor(status: String): Color = LocalMintColors.current.statusColor(status)

    @Composable
    fun healthQualityColor(quality: String): Color = LocalMintColors.current.healthQualityColor(quality)

    @Composable
    fun temperatureColor(temp: Float): Color = LocalMintColors.current.temperatureColor(temp)
}
