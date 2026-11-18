package com.battery.master.ui.theme

import android.provider.Settings
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * iOS 液态玻璃 (Liquid Glass) 组件套件 ·「薄荷能量」版。
 *
 * 玻璃切面语义：白色高光层 + 深色阴影层 + 半透明细描边，形成可叠加于任何
 * 底色的玻璃质感。Compose 无 backdrop 采样能力，对节点自身做 RenderEffect.blur
 * 会连内容一起糊掉，因此这里采用层叠透明模拟（真磨砂需引入第三方 backdrop 库，
 * 暂不引入）。
 *
 * 双主题：[GlassTokens] 的颜色经 @Composable getter 随 [LocalMintColors] 切换——
 * 浅色「薄荷能量」为高亮白玻璃 + 柔绿投影，深色「夜航森林绿」为暗色玻璃。
 */
object GlassTokens {
    /** 顶部高光层（浅色：近白不透明；深色：微弱白） */
    val Highlight: Color @Composable get() = if (LocalMintColors.current === DarkMintColors)
        Color.White.copy(alpha = 0.085f) else Color.White.copy(alpha = 0.95f)

    /** 中部过渡层 */
    val HighlightMid: Color @Composable get() = if (LocalMintColors.current === DarkMintColors)
        Color.White.copy(alpha = 0.038f) else Color.White.copy(alpha = 0.72f)

    /** 底部阴影层（浅色：绿黑阴影营造悬浮感） */
    val ShadeBase: Color @Composable get() = if (LocalMintColors.current === DarkMintColors)
        Color.Black.copy(alpha = 0.20f) else Color(0xFF0F3D1E).copy(alpha = 0.05f)

    /** 顶部反光切线 */
    val EdgeLight: Color @Composable get() = if (LocalMintColors.current === DarkMintColors)
        Color.White.copy(alpha = 0.26f) else Color.White.copy(alpha = 1.0f)

    /** 卡片外投影色（浅色主题的柔绿投影；深色主题透明由高度阴影承担） */
    val ShadowAmbient: Color @Composable get() = if (LocalMintColors.current === DarkMintColors)
        Color.Transparent else Color(0x2E1AAE4A)

    const val ENTER_STAGGER_MS = 55L
    const val ENTER_SLIDE_DP = 26f
}

/**
 * 玻璃切面卡片底：垂直渐变玻璃 + 顶部高光切线 + 半透明描边。
 * 替代实色卡 + 实色描边的旧写法；可叠加于任何底色。
 *
 * @param borderColor 为空时取当前主题描边色（避免 @Composable 默认参数问题）
 */
fun Modifier.glassSurface(
    cornerRadius: Dp = DesignTokens.RadiusPanel,
    borderColor: Color? = null
): Modifier = composed {
    val radiusPx = with(LocalDensity.current) { cornerRadius.toPx() }
    // 组合作用域内捕获主题色，供 drawBehind（非组合回调）使用
    val highlight = GlassTokens.Highlight
    val highlightMid = GlassTokens.HighlightMid
    val shadeBase = GlassTokens.ShadeBase
    val edgeLight = GlassTokens.EdgeLight
    val edge = borderColor ?: LocalMintColors.current.borderStrong
    this.drawBehind {
        drawRoundRect(
            brush = Brush.verticalGradient(
                colors = listOf(highlight, highlightMid, shadeBase)
            ),
            cornerRadius = CornerRadius(radiusPx, radiusPx)
        )
        // 顶部高光切线：模拟玻璃上缘反光
        drawLine(
            brush = Brush.horizontalGradient(
                colors = listOf(
                    Color.Transparent,
                    edgeLight,
                    Color.Transparent
                )
            ),
            start = Offset(0f, 0.5f),
            end = Offset(size.width, 0.5f),
            strokeWidth = 1.dp.toPx()
        )
    }.border(1.dp, edge.copy(alpha = 0.6f), RoundedCornerShape(cornerRadius))
}

/**
 * iOS 按压手感：缩放 0.98 + 微降透明度。
 * 与 clickable 共享同一 [interactionSource] 才能收到按压事件。
 */
fun Modifier.pressGlassScale(interactionSource: MutableInteractionSource): Modifier = composed {
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.975f else 1f,
        animationSpec = tween(DesignTokens.DurationMicro, easing = FastOutSlowInEasing),
        label = "glass-press-scale"
    )
    val alpha by animateFloatAsState(
        targetValue = if (pressed) 0.92f else 1f,
        animationSpec = tween(DesignTokens.DurationMicro),
        label = "glass-press-alpha"
    )
    this.graphicsLayer {
        scaleX = scale
        scaleY = scale
        this.alpha = alpha
    }
}

/**
 * 总览卡片错峰入场：fade + slide-up。
 * rememberSaveable 保证滚动往返不重复播放；系统动画缩放为 0（无障碍关闭动画）时直接呈现。
 */
fun Modifier.entranceReveal(index: Int): Modifier = composed {
    val context = LocalContext.current
    val animationsDisabled = remember {
        try {
            Settings.Global.getFloat(
                context.contentResolver,
                Settings.Global.ANIMATOR_DURATION_SCALE,
                1f
            ) == 0f
        } catch (e: Throwable) {
            false
        }
    }
    var revealed by rememberSaveable { mutableStateOf(animationsDisabled) }
    if (!revealed) {
        LaunchedEffect(Unit) {
            kotlinx.coroutines.delay(index * GlassTokens.ENTER_STAGGER_MS)
            revealed = true
        }
    }
    val progress by animateFloatAsState(
        targetValue = if (revealed) 1f else 0f,
        animationSpec = tween(DesignTokens.DurationSlow, easing = FastOutSlowInEasing),
        label = "glass-entrance-$index"
    )
    this.graphicsLayer {
        alpha = progress
        translationY = (1f - progress) * GlassTokens.ENTER_SLIDE_DP * density
    }
}
