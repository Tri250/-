package com.smalljelly.batterydata.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smalljelly.batterydata.ui.theme.ChartBlue
import com.haooz.nexioui.card.Card
import com.haooz.nexioui.text.NexioText
import com.haooz.nexioui.theme.NexioTheme
import java.util.Locale
import kotlin.math.ceil
import kotlin.math.floor

enum class ChartMetric(val label: String, val unit: String) {
    CURRENT("电流", "mA"),
    VOLTAGE("电压", "V"),
}

private const val WINDOW = 60

/**
 * 最近 60 个采样点的电流 / 电压曲线，样式参考系统设置里的耗电曲线。
 *
 * @param intervalMs 采样间隔，用于横轴时间标注。
 */
@Composable
fun LiveChartCard(
    currentHistory: List<Float>,
    voltageHistory: List<Float>,
    intervalMs: Long = 30_000L,
    modifier: Modifier = Modifier,
) {
    val colors = NexioTheme.colorScheme
    var metric by remember { mutableStateOf(ChartMetric.CURRENT) }

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
                text = "实时曲线",
                style = NexioTheme.textStyles.title3,
                color = colors.onSurfaceContainer,
            )
            SegmentedSlider(
                labels = ChartMetric.entries.map { it.label },
                selectedIndex = ChartMetric.entries.indexOf(metric),
                onSelect = { metric = ChartMetric.entries[it] },
            )
        }

        Spacer(Modifier.height(14.dp))

        val values = if (metric == ChartMetric.CURRENT) currentHistory else voltageHistory
        val latest = values.lastOrNull()

        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(if (metric == ChartMetric.CURRENT) ChartBlue else Color(0xFFFFA51F)),
            )
            Spacer(Modifier.width(6.dp))
            NexioText(
                text = if (metric == ChartMetric.CURRENT) "充放电电流" else "电池电压",
                fontSize = 12.sp,
                color = colors.onSurfaceVariantSummary,
            )
            Spacer(Modifier.weight(1f))
            NexioText(
                text = latest?.let { formatValue(metric, it) + " " + metric.unit } ?: "等待采样",
                fontSize = 12.sp,
                color = colors.onSurfaceVariantSummary,
            )
        }

        Spacer(Modifier.height(10.dp))

        MetricChart(
            values = values,
            metric = metric,
            accent = if (metric == ChartMetric.CURRENT) ChartBlue else Color(0xFFFFA51F),
        )

        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            NexioText(startAxisLabel(intervalMs), fontSize = 11.sp, color = colors.onSurfaceVariantSummary)
            NexioText("现在", fontSize = 11.sp, color = colors.onSurfaceVariantSummary)
        }
    }
}

private fun startAxisLabel(intervalMs: Long): String {
    val totalSeconds = WINDOW * (intervalMs / 1000L)
    return if (totalSeconds >= 90L) "${totalSeconds / 60L} 分钟前" else "$totalSeconds 秒前"
}

@Composable
private fun MetricChart(
    values: List<Float>,
    metric: ChartMetric,
    accent: Color,
) {
    val colors = NexioTheme.colorScheme
    // 注意：values 是同一个 SnapshotStateList 实例，不能用 remember(values) 做 key，
    // 否则纵轴范围会一直停留在第一次（空列表）计算出的 0..1。
    val range = computeRange(
        values = values,
        minSpan = if (metric == ChartMetric.CURRENT) 200f else 0.1f,
        step = if (metric == ChartMetric.CURRENT) 100f else 0.05f,
    )

    Row(Modifier.fillMaxWidth()) {
        Canvas(
            Modifier
                .weight(1f)
                .height(168.dp),
        ) {
            val dash = PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(), 5.dp.toPx()))
            for (i in 0..2) {
                val y = size.height * i / 2f
                drawLine(
                    color = colors.dividerLine,
                    start = Offset(0f, y),
                    end = Offset(size.width, y),
                    strokeWidth = 1.dp.toPx(),
                    pathEffect = dash,
                )
            }

            if (values.size < 2) return@Canvas

            val stepX = size.width / (WINDOW - 1)
            val points = values.mapIndexed { index, value ->
                val ratio = ((value - range.first) / (range.second - range.first)).coerceIn(0f, 1f)
                Offset(index * stepX, size.height - ratio * size.height)
            }

            val linePath = Path().apply {
                moveTo(points[0].x, points[0].y)
                for (i in 1 until points.size) {
                    val previous = points[i - 1]
                    val current = points[i]
                    val midX = (previous.x + current.x) / 2f
                    cubicTo(midX, previous.y, midX, current.y, current.x, current.y)
                }
            }

            val fillPath = Path().apply {
                addPath(linePath)
                lineTo(points.last().x, size.height)
                lineTo(0f, size.height)
                close()
            }

            drawPath(
                path = fillPath,
                brush = Brush.verticalGradient(
                    colors = listOf(accent.copy(alpha = 0.24f), accent.copy(alpha = 0.01f)),
                ),
            )
            drawPath(
                path = linePath,
                color = accent,
                style = Stroke(
                    width = 2.2.dp.toPx(),
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round,
                ),
            )

            val last = points.last()
            drawCircle(color = colors.surfaceContainer, radius = 5.dp.toPx(), center = last)
            drawCircle(color = accent, radius = 3.dp.toPx(), center = last)
        }

        Spacer(Modifier.width(8.dp))

        Box(
            modifier = Modifier
                .width(46.dp)
                .height(168.dp),
        ) {
            AxisLabel(
                text = formatValue(metric, range.second),
                modifier = Modifier.align(Alignment.TopEnd).offset(y = (-7).dp),
            )
            AxisLabel(
                text = formatValue(metric, (range.first + range.second) / 2f),
                modifier = Modifier.align(Alignment.CenterEnd),
            )
            AxisLabel(
                text = formatValue(metric, range.first),
                modifier = Modifier.align(Alignment.BottomEnd).offset(y = 7.dp),
            )
        }
    }
}

@Composable
private fun AxisLabel(text: String, modifier: Modifier = Modifier) {
    NexioText(
        text = text,
        fontSize = 11.sp,
        color = NexioTheme.colorScheme.onSurfaceVariantSummary,
        textAlign = TextAlign.End,
        modifier = modifier.fillMaxWidth(),
    )
}

private fun computeRange(values: List<Float>, minSpan: Float, step: Float): Pair<Float, Float> {
    if (values.isEmpty()) return 0f to minSpan
    val min = values.min()
    val max = values.max()
    val span = (max - min).coerceAtLeast(minSpan)
    val center = (max + min) / 2f
    val padding = span * 0.18f
    val low = floor((center - span / 2f - padding) / step) * step
    val high = ceil((center + span / 2f + padding) / step) * step
    return low to high
}

private fun formatValue(metric: ChartMetric, value: Float): String = when (metric) {
    ChartMetric.CURRENT -> String.format(Locale.US, "%.0f", value)
    ChartMetric.VOLTAGE -> String.format(Locale.US, "%.2f", value)
}
