package com.battery.master.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.unit.dp

/**
 * 「薄荷能量」图标库——自绘 24dp 网格矢量图标（filled 风格）。
 * 不引入 material-icons-extended，保持包体；fillColor 由调用方 tint。
 */
object MintIcons {

    private fun icon(path: String): ImageVector = ImageVector.Builder(
        defaultWidth = 24.dp,
        defaultHeight = 24.dp,
        viewportWidth = 24f,
        viewportHeight = 24f
    ).apply {
        addPath(
            pathData = addPathNodes(path),
            fill = SolidColor(Color.Black),
            fillAlpha = 1f
        )
    }.build()

    /** 底部导航 · 总览（仪表盘） */
    val Dashboard: ImageVector by lazy { icon("M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10-3h8v11h-8V10z") }

    /** 底部导航 · 续航（计时器） */
    val Timer: ImageVector by lazy {
        icon("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z")
    }

    /** 底部导航 · 充电（闪电） */
    val Bolt: ImageVector by lazy {
        icon("M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.4 0 .62.19.42.72C13.97 17.55 11 21 11 21z")
    }

    /** 底部导航 · 健康（心形） */
    val Heart: ImageVector by lazy {
        icon("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")
    }

    /** 底部导航 · 实验室（烧瓶） */
    val Flask: ImageVector by lazy {
        icon("M10 2h4v2h-1v5.6l5.4 9.9A2 2 0 0 1 16.6 22H7.4a2 2 0 0 1-1.8-2.5L11 9.6V4h-1V2zm-1.2 12.4L5.8 20h12.4l-3-5.6H8.8z")
    }

    /** 我的（人形） */
    val Person: ImageVector by lazy {
        icon("M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.34 0-10 1.67-10 5v3h20v-3c0-3.33-6.66-5-10-5z")
    }

    /** 右箭头 */
    val ChevronRight: ImageVector by lazy { icon("M8.6 3.4 7.2 4.8 14.4 12l-7.2 7.2 1.4 1.4L17.2 12z") }

    /** 对勾 */
    val Check: ImageVector by lazy { icon("M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z") }

    /** 重置/刷新 */
    val Refresh: ImageVector by lazy {
        icon("M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z")
    }

    /** 信息 */
    val Info: ImageVector by lazy {
        icon("M11 7h2v2h-2V7zm0 4h2v6h-2v-6zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z")
    }

    /** 删除/清除 */
    val Trash: ImageVector by lazy {
        icon("M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z")
    }

    /** 提示音 */
    val Bell: ImageVector by lazy {
        icon("M12 22a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 22zm7-5.3v.5c0 .4-.3.8-.8.8H5.8c-.5 0-.8-.4-.8-.8v-.5l1.8-1.8V10a6 6 0 0 1 4.2-5.7V4a1 1 0 0 1 2 0v.3A6 6 0 0 1 18 10v4.9L19 16.7z")
    }

    /** 语言 */
    val Globe: ImageVector by lazy {
        icon("M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14a7.85 7.85 0 0 1 0-4h3.38a16.6 16.6 0 0 0 0 4H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.08 16zm2.95-8H5.08a7.99 7.99 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82A13.9 13.9 0 0 1 12 19.96zM14.34 14H9.66a14.4 14.4 0 0 1 0-4h4.68a14.4 14.4 0 0 1 0 4zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14a16.6 16.6 0 0 0 0-4h3.38a7.85 7.85 0 0 1 0 4h-3.38z")
    }

    /** 隐私盾牌 */
    val Shield: ImageVector by lazy {
        icon("M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z")
    }

    /** 主题调色板 */
    val Palette: ImageVector by lazy {
        icon("M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.42-4.03-8-9-8zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z")
    }

    /** 下载更新 */
    val Download: ImageVector by lazy { icon("M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z") }

    /** 闪电小标（充电功率页） */
    val BoltSmall: ImageVector get() = Bolt

    /** 电池 */
    val Battery: ImageVector by lazy {
        icon("M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z")
    }

    /** 手机/设备 */
    val Device: ImageVector by lazy {
        icon("M17 1H7a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm0 19H7V5h10v15z")
    }

    /** 加号 */
    val Plus: ImageVector by lazy { icon("M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z") }

    /** 关闭 */
    val Close: ImageVector by lazy { icon("M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z") }

    /** 警示 */
    val Warning: ImageVector by lazy { icon("M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z") }

    /** 曲线/图表 */
    val Chart: ImageVector by lazy {
        icon("M3.5 18.5 9 12l4 4 7.5-8.5-1.4-1.4L13 13.6 9 9.6 2.1 17.1l1.4 1.4zM3 21h18v-2H3v2z")
    }

    /** 星星（评级） */
    val Star: ImageVector by lazy {
        icon("M12 2l2.4 7.2H22l-5.8 4.2 2.2 7.1L12 16.2 5.6 20.5l2.2-7.1L2 9.2h7.6L12 2z")
    }
}
