package com.smalljelly.batterydata.ui.components

import com.haooz.nexioui.overlaydialog.OverlayDialog
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.text.font.FontWeight


import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smalljelly.batterydata.data.BatterySample
import com.smalljelly.batterydata.data.healthRatingText
import com.haooz.softglass.backdrop.GlassBackdrop
import com.smalljelly.batterydata.ui.theme.AppMaterial
import com.smalljelly.batterydata.ui.theme.BatteryAmber
import com.smalljelly.batterydata.ui.theme.BatteryGreen
import com.smalljelly.batterydata.ui.theme.BatteryRed
import kotlin.math.roundToInt
import com.haooz.nexioui.button.ButtonDefaults
import com.haooz.nexioui.card.Card
import com.haooz.nexioui.button.FlatTextButton
import com.haooz.nexioui.text.NexioText
import com.haooz.nexioui.theme.NexioTheme
// 输入框用 miuix：NexioUI 的 TextField 没有 keyboardOptions，数字键盘起不来
import top.yukonga.miuix.kmp.basic.TextField
import top.yukonga.miuix.kmp.basic.TextFieldDefaults

/**
 * 电池健康：容量衰减百分比 + 设计容量 / 满电容量 / 循环次数 / 系统状态。
 * 手动设定设计容量的入口在右上角「更多」菜单里，卡片上不再重复。
 */
@Composable
fun BatteryHealthCard(
    sample: BatterySample,
    modifier: Modifier = Modifier,
) {
    val colors = NexioTheme.colorScheme
    val percent = sample.healthPercent
    val rating = if (percent == null) sample.healthText else healthRatingText(percent)
    val accent = when {
        percent == null -> colors.onSurfaceVariantSummary
        percent >= 80f -> BatteryGreen
        percent >= 70f -> BatteryAmber
        else -> BatteryRed
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        cornerRadius = 20.dp,
        insideMargin = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            NexioText(
                text = "电池健康",
                style = NexioTheme.textStyles.title3,
                color = colors.onSurfaceContainer,
            )
            if (percent != null) {
                RatingChip(text = rating, color = accent)
            }
        }
        Spacer(Modifier.height(14.dp))

        Row(verticalAlignment = Alignment.Bottom, modifier = Modifier.fillMaxWidth()) {
            if (percent != null) {
                NexioText(
                    // 四舍五入而不是截断：89.9% 显示成 89% 会让健康度看起来低了一档
                    text = percent.roundToInt().toString(),
                    fontSize = 52.sp,
                    lineHeight = 54.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-1.5).sp,
                    color = colors.onSurfaceContainer,
                )
                NexioText(
                    text = "%",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.onSurfaceVariantSummary,
                    modifier = Modifier.padding(start = 2.dp, bottom = 7.dp),
                )
            } else {
                NexioText(
                    text = sample.healthText,
                    fontSize = 34.sp,
                    lineHeight = 40.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.onSurfaceContainer,
                )
            }
        }

        if (percent != null) {
            Spacer(Modifier.height(10.dp))
            HealthBar(progress = percent / 100f, color = accent)
            Spacer(Modifier.height(6.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                NexioText("0%", fontSize = 11.sp, color = colors.onSurfaceVariantSummary)
                NexioText("100%", fontSize = 11.sp, color = colors.onSurfaceVariantSummary)
            }
        } else {
            Spacer(Modifier.height(6.dp))
            NexioText(
                text = "当前机型未开放容量节点，健康度以系统状态为准",
                fontSize = 12.sp,
                color = colors.onSurfaceVariantSummary,
            )
        }

        Spacer(Modifier.height(12.dp))
        InnerDivider()
        InfoRow(
            label = "设计容量",
            value = capacityText(sample.designCapacityMah) + designSourceSuffix(sample.designSource),
        )
        InnerDivider()
        InfoRow("满电容量", capacityText(sample.estimatedFullChargeMah))
        InnerDivider()
        InfoRow("循环次数", sample.cycleCount?.let { "$it 次" } ?: "未公开")
        InnerDivider()
        InfoRow("系统健康状态", sample.healthText)
    }
}

@Composable
fun ManualCapacityDialog(
    show: Boolean,
    manualCapacity: Float?,
    currentDesign: String,
    // 面板模糊的采样源：调用页面的内容层
    backdrop: GlassBackdrop?,
    onSet: (Float?) -> Unit,
    onDismiss: () -> Unit,
) {
    val colors = NexioTheme.colorScheme
    val focusManager = LocalFocusManager.current
    // 直接用 NexioUI 的对话框：玻璃 / 模糊半径 / 折射 / 进出场动画全交给库，
    // 材质档由 NexioMaterial.level 决定（AppMaterial 负责同步）
    OverlayDialog(
        show = show,
        title = "手动设定设计容量",
        summary = "手动值优先于系统节点与机型库数据。\n当前：$currentDesign",
        // 面板自己采样这一层做模糊，背后页面只压暗
        liquidGlassBackdrop = backdrop,
        onDismissRequest = onDismiss,
        // 挂到最外层 Scaffold 的弹层宿主，才能盖住顶栏 / 底栏
        renderInRootScaffold = true,
    ) {
        // 必须把整个 TextFieldValue（含 selection / composition）存在状态里。
        // 之前每帧 new 一个 TextFieldValue(text)：默认 selection 落在末尾、composition 为 null，
        // 于是光标被反复拽回末尾（点不动、拖不动），输入法的组合区还每帧被清掉，
        // 数字会按旧插入点重新落位 —— 看起来就是"倒着输入"。
        var field by remember(show) {
            mutableStateOf(
                TextFieldValue(
                    // 手动值优先；没设过就用当前识别到的容量预填，弹窗一打开就有内容可改，
                    // 不至于是个空框 + 灰掉的「确定」
                    manualCapacity?.roundToInt()?.toString()
                        ?: currentDesign.filter { it.isDigit() }.take(5),
                ),
            )
        }
        // 颜色 / 字号全显式给：miuix 的 TextField 默认从 MiuixTheme 取，而本页主题是 NexioUI，
        // 不传就会拿到 miuix 的默认浅色值（深色模式下输入框会变白块）。
        TextField(
            value = field,
            onValueChange = { value: TextFieldValue ->
                // 只接受 5 位以内的纯数字；不合格的改动整条丢弃（光标位置也一起保留）
                if (value.text.length <= 5 && value.text.all { it.isDigit() }) {
                    field = value
                }
            },
            label = "设计容量 (mAh)",
            singleLine = true,
            colors = TextFieldDefaults.textFieldColors(
                backgroundColor = colors.secondaryContainer,
                labelColor = colors.onSurfaceVariantSummary,
                borderColor = colors.primary,
            ),
            textStyle = TextStyle(
                fontSize = 17.sp,
                color = colors.onSurfaceContainer,
            ),
            cursorBrush = SolidColor(colors.primary),
            // 数字键盘 + 回车收起键盘（NexioUI 那个 TextField 没有这两个参数）
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Number,
                imeAction = ImeAction.Done,
            ),
            keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() }),
        )
        Spacer(Modifier.height(16.dp))
        // NexioUI 对话框的标准收尾：一排等宽按钮、12dp 间距、确认键用主色。
        // 之前是「左一个右两个」的自适应宽度小药丸，一行三种颜色，既不对齐也不像系统弹窗。
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (manualCapacity != null) {
                FlatTextButton(
                    text = "恢复自动",
                    modifier = Modifier.weight(1f),
                    onClick = { onSet(null) },
                )
            }
            FlatTextButton(
                text = "取消",
                modifier = Modifier.weight(1f),
                onClick = onDismiss,
            )
            FlatTextButton(
                text = "确定",
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.textButtonColorsPrimary(),
                enabled = (field.text.toFloatOrNull() ?: 0f) in 1000f..10000f,
                onClick = { onSet(field.text.toFloatOrNull()) },
            )
        }
    }
}

fun designSourceSuffix(source: String?): String = when (source) {
    "手动" -> "（手动）"
    "系统节点" -> ""
    null -> ""
    else -> "（参考）"
}

@Composable
private fun HealthBar(progress: Float, color: Color) {
    val colors = NexioTheme.colorScheme
    val animated by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(800, easing = FastOutSlowInEasing),
        label = "healthBar",
    )
    Box(
        Modifier
            .fillMaxWidth()
            .height(8.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(colors.secondaryContainer),
    ) {
        Box(
            Modifier
                .fillMaxWidth(animated)
                .fillMaxHeight()
                .clip(RoundedCornerShape(4.dp))
                .background(
                    Brush.horizontalGradient(
                        listOf(lerp(color, Color.White, 0.18f), color),
                    ),
                ),
        )
    }
}

@Composable
private fun RatingChip(text: String, color: Color) {
    Box(
        Modifier
            .clip(RoundedCornerShape(50))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        NexioText(text = text, fontSize = 12.sp, color = color)
    }
}

fun capacityText(mah: Float?): String = when {
    mah == null || mah <= 0f -> "未公开"
    else -> "${Math.round(mah)} mAh"
}
