package com.battery.master.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Android Battery Master · 统一设计令牌 (Design Tokens)
 *
 * 与 Web 端 src/index.css 的 @theme 令牌一一对应：
 * 赛博朋克 HUD / AMOLED 暗色玻璃拟态设计语言。
 * 全站 UI 只允许引用本对象中的色值、字号、圆角与动效时长，
 * 禁止在 Composable 中散落硬编码。
 */
object DesignTokens {

    // ---------------------------------------------------------------
    // 背景阶层 (AMOLED 深色玻璃层)
    // ---------------------------------------------------------------
    /** 最深层：页面背景 / Hero 卡片底 */
    val BgDeep = Color(0xFF030712)

    /** 表面层：卡片背景 */
    val BgSurface = Color(0xFF090D16)

    /** 抬高层：卡片内嵌槽 / 输入区 */
    val BgElevated = Color(0xFF0F172A)

    /** 玻璃层：半透明浮层 (80% 不透明度) */
    val BgGlass = Color(0xCC0B1220)

    /** 内嵌槽：徽章 / 读数条最深层 */
    val BgInset = Color(0xFF020617)

    // ---------------------------------------------------------------
    // 描边阶层
    // ---------------------------------------------------------------
    /** 常规描边 */
    val Border = Color(0xFF1E293B)

    /** 强调描边 */
    val BorderStrong = Color(0xFF334155)

    /** 品牌聚焦描边 (emerald 40%) */
    val BorderFocus = Color(0x6610B981)

    // ---------------------------------------------------------------
    // 文字阶层
    // ---------------------------------------------------------------
    /** 主文字 / 核心读数 */
    val TextPrimary = Color(0xFFE2E8F0)

    /** 次级文字 / 标签 */
    val TextSecondary = Color(0xFF94A3B8)

    /** 弱化文字 / 脚注 */
    val TextTertiary = Color(0xFF64748B)

    /** 禁用文字 */
    val TextDisabled = Color(0xFF475569)

    // ---------------------------------------------------------------
    // 品牌语义色板（全端统一）
    // ---------------------------------------------------------------
    /** 主品牌色：充电 / 健康 / 成功 */
    val BrandPrimary = Color(0xFF10B981)
    val BrandPrimaryLight = Color(0xFF34D399)
    val BrandPrimaryDark = Color(0xFF047857)

    /** HAL 技术点缀色（Android 仿真 HAL / 原生源码标识） */
    val AccentCyan = Color(0xFF22D3EE)

    /** 信息色：放电 / 电压 / 常规指标 */
    val InfoSky = Color(0xFF38BDF8)

    /** 充满色：已完全饱和充满 */
    val FullTeal = Color(0xFF2DD4BF)

    /** 特性色：特性标记 / 衰减容量 */
    val FeaturePurple = Color(0xFFA855F7)

    /** 辅助青 (teal-600)：循环计数等次级指标 */
    val AccentTeal = Color(0xFF14B8A6)

    /** 深青 (cyan-600)：HAL 徽章描边 */
    val AccentCyanDark = Color(0xFF06B6D4)

    /** 警告色：偏热 / 循环偏多 */
    val WarningAmber = Color(0xFFF59E0B)

    /** 危险色：低电量 / 过热 / 损坏 */
    val DangerRose = Color(0xFFF43F5E)

    /** 危险容器底：恢复真实遥测等破坏性操作按钮 */
    val DangerContainer = Color(0xFF7C2D12)

    // ---------------------------------------------------------------
    // 语义文字色（暗底可读性优化：400 系列）
    // ---------------------------------------------------------------
    val TextGood = Color(0xFF6EE7B7)
    val TextInfo = Color(0xFF7DD3FC)
    val TextWarning = Color(0xFFFDE68A)
    val TextDanger = Color(0xFFFDA4AF)
    val TextError = Color(0xFFFB7185)
    val TextAmberStrong = Color(0xFFFBBF24)

    // ---------------------------------------------------------------
    // 温度色阶（与 Web tempAssessment 一致）
    // ---------------------------------------------------------------
    val TempCold = Color(0xFFBFDBFE)
    val TempWarm = Color(0xFFFDE68A)
    val TempHot = Color(0xFFFDA4AF)
    val TempPurple = Color(0xFFE9D5FF)

    // ---------------------------------------------------------------
    // 字号阶梯（7 级，与 Web --text-* 对应）
    // ---------------------------------------------------------------
    /** 10sp 微型标签：编号 / 角标 / 脚注 */
    val Font2xs = 10.sp

    /** 12sp 辅助说明：按钮 / 徽章 */
    val FontXs = 12.sp

    /** 14sp 正文：卡片标题 / 正文 */
    val FontSm = 14.sp

    /** 16sp 大标题：区块标题 */
    val FontBase = 16.sp

    /** 20sp 卡片大数字 */
    val FontXl = 20.sp

    /** 24sp 核心读数（循环/容量/内阻） */
    val Font2xl = 24.sp

    /** 68sp 主仪表盘百分比 (Hero) */
    val FontHero = 68.sp

    // ---------------------------------------------------------------
    // 圆角阶梯（与 Web --radius-* 对应）
    // ---------------------------------------------------------------
    val RadiusChip = 8.dp
    val RadiusCard = 16.dp
    val RadiusPanel = 20.dp
    val RadiusHero = 24.dp
    val RadiusPill = 999.dp

    // ---------------------------------------------------------------
    // 动效时长（微交互 150-250ms / 转场 250-350ms / Hero 700ms）
    // ---------------------------------------------------------------
    const val DurationMicro = 150
    const val DurationFast = 200
    const val DurationSmooth = 250
    const val DurationSlow = 350
    const val DurationHero = 700

    // ---------------------------------------------------------------
    // 语义状态色快捷映射（与 Web 端 statusMap / healthQualityMap 对齐）
    // ---------------------------------------------------------------
    fun statusColor(status: String): Color = when (status) {
        "charging" -> BrandPrimary
        "discharging" -> InfoSky
        "full" -> FullTeal
        else -> TextSecondary
    }

    fun healthQualityColor(quality: String): Color = when (quality) {
        "good" -> TextGood
        "overheat" -> TextWarning
        "dead" -> TextDanger
        "over_voltage" -> TextWarning
        else -> TextSecondary
    }

    /** 温度分段色（与 Web getTempAssessment 阈值一致：>45 / 38-45 / ≤0） */
    fun temperatureColor(temp: Float): Color = when {
        temp > 45f -> TempHot
        temp >= 38f -> TempWarm
        temp <= 0f -> TempCold
        else -> TempPurple
    }
}
