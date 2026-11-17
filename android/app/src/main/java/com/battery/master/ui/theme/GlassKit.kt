package com.battery.master.ui.theme

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import android.provider.Settings

/**
 * iOS 液态玻璃 (Liquid Glass) 组件套件 (v2.1.0-beta.2 品牌视觉升级)。
 *
 * 玻璃切面语义与 CyberHeroBatteryCard 的 drawBehind 渐变模式同源：
 * 白色高光层 + 深色阴影层 + 半透明细描边，形成可叠加于任何底色的玻璃质感。
 * 注：Compose 无 backdrop 采样能力，对节点自身做 RenderEffect.blur 会连内容一起糊掉，
 * 因此这里采用与 Hero 卡一致的层叠透明模拟（真磨砂需引入第三方 backdrop 库，暂不引入）。
 */
object GlassTokens {
    val Highlight = Color.White.copy(alpha = 0.085f)
    val HighlightMid = Color.White.copy(alpha = 0.038f)
    val ShadeBase = Color.Black.copy(alpha = 0.20f)
    val EdgeLight = Color.White.copy(alpha = 0.26f)
    const val ENTER_STAGGER_MS = 55L
    const val ENTER_SLIDE_DP = 26f
}

/**
 * 玻璃切面卡片底：垂直渐变玻璃 + 顶部高光切线 + 半透明描边。
 * 替代 [DesignTokens.BgSurface] 实色卡 + 实色描边的旧写法。
 */
fun Modifier.glassSurface(
    cornerRadius: Dp = DesignTokens.RadiusPanel,
    borderColor: Color = DesignTokens.BorderStrong
): Modifier = composed {
    val radiusPx = with(LocalDensity.current) { cornerRadius.toPx() }
    this.drawBehind {
        drawRoundRect(
            brush = Brush.verticalGradient(
                colors = listOf(
                    GlassTokens.Highlight,
                    GlassTokens.HighlightMid,
                    GlassTokens.ShadeBase
                )
            ),
            cornerRadius = CornerRadius(radiusPx, radiusPx)
        )
        // 顶部高光切线：模拟玻璃上缘反光
        drawLine(
            brush = Brush.horizontalGradient(
                colors = listOf(
                    Color.Transparent,
                    GlassTokens.EdgeLight,
                    Color.Transparent
                )
            ),
            start = Offset(0f, 0.5f),
            end = Offset(size.width, 0.5f),
            strokeWidth = 1.dp.toPx()
        )
    }.border(1.dp, borderColor.copy(alpha = 0.6f), RoundedCornerShape(cornerRadius))
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
