package com.smalljelly.batterydata.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.haooz.softglass.backdrop.backdrops.layerBackdrop
import com.haooz.softglass.backdrop.backdrops.rememberLayerBackdrop
import com.smalljelly.batterydata.data.ChargeRecord
import com.smalljelly.batterydata.data.UiDiagnostics
import com.smalljelly.batterydata.ui.components.NexioTopBar
import com.smalljelly.batterydata.ui.components.rememberNexioTopBarState
import com.smalljelly.batterydata.ui.components.SegmentedSlider
import com.smalljelly.batterydata.ui.components.rememberTopBarPull
import com.smalljelly.batterydata.ui.components.pageTopBarHeight
import com.smalljelly.batterydata.ui.theme.BatteryGreen
import com.smalljelly.batterydata.ui.theme.ChartBlue
import com.haooz.nexioui.card.Card
import com.smalljelly.batterydata.ui.components.NexioIconButton
import com.haooz.nexioui.scaffold.Scaffold
import com.haooz.nexioui.text.NexioText
import com.haooz.nexioui.icon.NexioIcons
import com.haooz.nexioui.icon.extended.ChevronBackward
import com.haooz.nexioui.theme.NexioTheme
import com.haooz.nexioui.overscroll.overScrollVertical
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val detailDateFormat = SimpleDateFormat("M月d日 HH:mm", Locale.CHINA)
private val detailDateOnlyFormat = SimpleDateFormat("yyyy年M月d日", Locale.CHINA)

private enum class DetailMetric(val label: String, val unit: String, val accent: Color) {
    POWER("功率", "W", BatteryGreen),
    CURRENT("电流", "mA", ChartBlue),
    VOLTAGE("电压", "V", Color(0xFFFFA51F)),
}

/**
 * 单次充电的详情：版式沿用首页（卡片 + 曲线），去掉大电池卡，
 * 换成这次充电的功率 / 电流 / 电压曲线。
 *
 * 顶栏和记录页完全一套：[PageTopBar]（固定高度 + 顶部渐进模糊带），内容从栏下穿过；
 * 操作区只留一个玻璃返回键。用固定高度而不是 Miuix 的折叠顶栏，是因为折叠时栏会变矮、
 * 而让位必须是常数，否则栏下会空出一大截。
 */
@Composable
fun ChargeDetailScreen(
    record: ChargeRecord,
    onBack: () -> Unit,
) {
    val colors = NexioTheme.colorScheme
    var metric by remember { mutableStateOf(DetailMetric.POWER) }
    val scroll = rememberScrollState()
    // 两路信号取最大：滚过 10dp（内容真的进栏下），或拖动时的回弹位移。
    // 详情页内容常常不足一屏、滚不动，只靠滚动量的话材质永远不会出现。
    val density = LocalDensity.current
    val (pullModifier, _) = rememberTopBarPull()
    val backdrop = rememberLayerBackdrop()
    // 顶栏：折叠 / 材质由库的 CollapsibleTopAppBar 负责
    val topBarState = rememberNexioTopBarState()

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            NexioTopBar(
                state = topBarState,
                title = "充电详情",
                largeTitle = "充电详情",
                backdrop = backdrop,
                navigation = { backdropAlpha, shadowAlpha ->
                    NexioIconButton(
                        onClick = onBack,
                        backdrop = backdrop,
                        icon = NexioIcons.ChevronBackward,
                        contentDescription = "返回",
                        backdropAlpha = backdropAlpha,
                        shadowAlpha = shadowAlpha,
                        iconTint = colors.onBackground,
                    )
                },
            )
        },
        containerColor = colors.background,
        contentWindowInsets = WindowInsets(0.dp, 0.dp, 0.dp, 0.dp),
    ) { innerPadding ->
        // 让位 = Scaffold 实测的顶栏高度 + 8dp（不能自己算常数，见记录页的注释：
        // 两个来源对不上时内容会被顶进顶栏，大标题和模糊会一起"消失"）
        val measuredTop = innerPadding.calculateTopPadding()
        val contentTopInset =
            (if (measuredTop > 0.dp) measuredTop else pageTopBarHeight()) + 8.dp
        UiDiagnostics.band("detail").contentTopInsetPx =
            with(density) { contentTopInset.roundToPx() }

        // 视口高度（滚动容器自身）和内容高度（两张卡，不含下面补的行程）各量一次
        val insetPx = with(density) { contentTopInset.roundToPx() }
        val navBottomPx = with(density) {
            WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding().toPx()
        }
        val tailPx = with(density) { DetailTailSpace.toPx() }
        // 大标题收起所需的行程：展开态比折叠态多出来的那段（测量值，未测到时按 62dp）
        val largeTitlePx = topBarState.largeTitleHeightPx.takeIf { it > 0f }
            ?: with(density) { 62.dp.toPx() }
        val travelPx = largeTitlePx + with(density) { 8.dp.toPx() }

        var viewportPx by remember { mutableIntStateOf(0) }
        var contentPx by remember { mutableIntStateOf(0) }

        // 详情页通常只有两张卡，内容不满一屏 -> 根本滚不动 -> scroll.value 恒为 0，
        // 大标题就永远收不起来（模糊靠拖动位移还是会出现，所以只有"不收标题"这一个症状）。
        // 这里在底部补一段**恰好够收完标题**的行程：短页面也能真滚动、内容跟手 1:1，
        // 大标题就会像记录页那样收成小标题。长页面本来就滚得动，补给为 0。
        val extraRoomPx = if (viewportPx <= 0 || contentPx <= 0) {
            0f
        } else {
            val existingPx = insetPx + contentPx + tailPx + navBottomPx - viewportPx
            (travelPx - existingPx).coerceAtLeast(0f)
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                // 量视口：这里的尺寸就是滚动容器的可视高度
                .onSizeChanged { if (it.height != viewportPx) viewportPx = it.height }
                // 采样源是整块滚动内容，原点就是屏幕左上角，和顶栏 1:1 对齐。
                // 底色必须画在采样层里面（layerBackdrop 之后）：只录到卡片、其余全透明时，
                // 顶栏渐进模糊的 AGSL 会把透明采样全部丢弃，糊带等于没画
                .layerBackdrop(backdrop)
                .background(colors.background)
                // 顶栏折叠 / 材质（按钮两态）的滚动来源，作为回弹层的父连接
                .nestedScroll(topBarState.scrollBehavior.nestedScrollConnection)
                .overScrollVertical()
                // 内层才能拿到"列表没消费掉"的增量（回弹位移）
                .then(pullModifier)
                .verticalScroll(scroll, overscrollEffect = null)
                .windowInsetsPadding(WindowInsets.navigationBars)
                .padding(horizontal = 16.dp),
        ) {
            // 顶栏是固定高度，这里只留出让位（也跟着内容一起滚，滚上去就被糊掉）
            Spacer(Modifier.height(contentTopInset))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .onSizeChanged { if (it.height != contentPx) contentPx = it.height },
            ) {
                SummaryCard(record)
                Spacer(Modifier.height(12.dp))
                CurveCard(
                    record = record,
                    metric = metric,
                    onSelectMetric = { metric = it },
                )
            }
            // 短页面的补充行程（正常为空）
            Spacer(Modifier.height(with(density) { extraRoomPx.toDp() }))
            Spacer(Modifier.height(DetailTailSpace))
        }
    }
}

/** 内容末尾留白：也给"已有行程"的算式用 */
private val DetailTailSpace = 24.dp

@Composable
private fun SummaryCard(record: ChargeRecord) {
    val colors = NexioTheme.colorScheme
    Card(
        modifier = Modifier.fillMaxWidth(),
        cornerRadius = 20.dp,
        insideMargin = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            NexioText(
                text = detailDateOnlyFormat.format(Date(record.dateMillis)),
                fontSize = 13.sp,
                color = colors.onSurfaceVariantSummary,
            )
            Spacer(Modifier.weight(1f))
            NexioText(
                text = "全程记录",
                fontSize = 12.sp,
                color = colors.onSurfaceVariantSummary,
            )
        }
        Spacer(Modifier.height(6.dp))
        NexioText(
            text = "${record.fromLevel}~${record.toLevel}%",
            fontSize = 40.sp,
            lineHeight = 46.sp,
            fontWeight = FontWeight.Bold,
            color = colors.onSurfaceContainer,
        )
        Spacer(Modifier.height(4.dp))
        NexioText(
            text = detailDateFormat.format(Date(record.dateMillis)) + " 开始充电",
            fontSize = 12.sp,
            color = colors.onSurfaceVariantSummary,
        )
        Spacer(Modifier.height(14.dp))
        Row(Modifier.fillMaxWidth()) {
            MetricBlock(
                label = "平均功率",
                value = record.avgPowerW?.let { String.format(Locale.US, "%.1f W", it) } ?: "—",
                modifier = Modifier.weight(1f),
            )
            MetricBlock(
                label = "充入电量",
                value = record.energyWh?.let { String.format(Locale.US, "%.1f Wh", it) } ?: "—",
                modifier = Modifier.weight(1f),
            )
            MetricBlock(
                label = "充电时长",
                value = record.durationMinutes?.let { formatDuration(it) } ?: "—",
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth()) {
            MetricBlock(
                label = "健康度",
                value = record.healthPercent?.let { String.format(Locale.US, "%.1f%%", it) } ?: "—",
                modifier = Modifier.weight(1f),
            )
            MetricBlock(
                label = "电池损耗",
                value = record.lossPercent?.let { String.format(Locale.US, "%.1f%%", it) } ?: "—",
                modifier = Modifier.weight(1f),
            )
            MetricBlock(
                label = "测得容量",
                value = record.measuredCapacityMah
                    ?.let { String.format(Locale.US, "%.0f mAh", it) }
                    ?: "—",
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun MetricBlock(label: String, value: String, modifier: Modifier = Modifier) {
    val colors = NexioTheme.colorScheme
    Column(modifier) {
        NexioText(text = label, fontSize = 12.sp, color = colors.onSurfaceVariantSummary)
        Spacer(Modifier.height(4.dp))
        NexioText(text = value, fontSize = 16.sp, fontWeight = FontWeight.Medium, color = colors.onSurfaceContainer)
    }
}

@Composable
private fun CurveCard(
    record: ChargeRecord,
    metric: DetailMetric,
    onSelectMetric: (DetailMetric) -> Unit,
) {
    val colors = NexioTheme.colorScheme
    val values = when (metric) {
        DetailMetric.POWER -> record.powerSeries
        DetailMetric.CURRENT -> record.currentSeries
        DetailMetric.VOLTAGE -> record.voltageSeries
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        cornerRadius = 20.dp,
        insideMargin = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            NexioText(
                text = "充电曲线",
                style = NexioTheme.textStyles.title3,
                color = colors.onSurfaceContainer,
            )
            MetricSegments(selected = metric, onSelect = onSelectMetric)
        }

        Spacer(Modifier.height(12.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(6.dp)
                    .clip(RoundedCornerShape(50))
                    .background(metric.accent),
            )
            Spacer(Modifier.width(6.dp))
            NexioText(
                text = when (metric) {
                    DetailMetric.POWER -> "充电功率"
                    DetailMetric.CURRENT -> "充电电流"
                    DetailMetric.VOLTAGE -> "电池电压"
                },
                fontSize = 12.sp,
                color = colors.onSurfaceVariantSummary,
            )
            Spacer(Modifier.weight(1f))
            NexioText(
                text = if (values.isEmpty()) "无数据" else "${values.size} 个采样点",
                fontSize = 12.sp,
                color = colors.onSurfaceVariantSummary,
            )
        }

        Spacer(Modifier.height(10.dp))

        if (values.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp),
                contentAlignment = Alignment.Center,
            ) {
                NexioText(
                    text = "这条记录没有曲线数据",
                    fontSize = 13.sp,
                    color = colors.onSurfaceVariantSummary,
                    textAlign = TextAlign.Center,
                )
            }
        } else {
            DetailChart(values = values, metric = metric)
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                NexioText("开始", fontSize = 11.sp, color = colors.onSurfaceVariantSummary)
                NexioText("结束", fontSize = 11.sp, color = colors.onSurfaceVariantSummary)
            }
        }
    }
}

@Composable
private fun MetricSegments(selected: DetailMetric, onSelect: (DetailMetric) -> Unit) {
    // 和首页实时曲线同一个控件：可点、也可按住横向拖过去换指标
    SegmentedSlider(
        labels = DetailMetric.entries.map { it.label },
        selectedIndex = DetailMetric.entries.indexOf(selected),
        onSelect = { onSelect(DetailMetric.entries[it]) },
    )
}

@Composable
private fun DetailChart(values: List<Float>, metric: DetailMetric) {
    val colors = NexioTheme.colorScheme
    val range = remember(values, metric) { computeRange(values, metric) }
    val gridColor = colors.dividerLine

    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(
            modifier = Modifier
                .width(46.dp)
                .height(150.dp),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.End,
        ) {
            AxisLabel(formatValue(metric, range.second), colors.onSurfaceVariantSummary)
            AxisLabel(formatValue(metric, (range.first + range.second) / 2f), colors.onSurfaceVariantSummary)
            AxisLabel(formatValue(metric, range.first), colors.onSurfaceVariantSummary)
        }
        Spacer(Modifier.width(8.dp))
        Canvas(
            modifier = Modifier
                .weight(1f)
                .height(150.dp),
        ) {
            val width = size.width
            val height = size.height
            // 三条虚线网格（顶部 / 中部 / 底部），和首页曲线保持一致
            listOf(0f, 0.5f, 1f).forEach { fraction ->
                val y = height * fraction
                drawLine(
                    color = gridColor,
                    start = Offset(0f, y),
                    end = Offset(width, y),
                    strokeWidth = 1f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 8f)),
                )
            }

            val span = (range.second - range.first).takeIf { it > 0f } ?: 1f
            fun pointAt(index: Int): Offset {
                val x = if (values.size == 1) width else width * index / (values.size - 1).toFloat()
                val normalized = ((values[index] - range.first) / span).coerceIn(0f, 1f)
                return Offset(x, height - normalized * height)
            }

            val linePath = Path()
            val fillPath = Path()
            values.indices.forEach { index ->
                val p = pointAt(index)
                if (index == 0) {
                    linePath.moveTo(p.x, p.y)
                    fillPath.moveTo(p.x, height)
                    fillPath.lineTo(p.x, p.y)
                } else {
                    linePath.lineTo(p.x, p.y)
                    fillPath.lineTo(p.x, p.y)
                }
            }
            fillPath.lineTo(width, height)
            fillPath.close()

            drawPath(
                path = fillPath,
                brush = Brush.verticalGradient(
                    colors = listOf(
                        metric.accent.copy(alpha = 0.28f),
                        metric.accent.copy(alpha = 0.02f),
                    ),
                ),
            )
            drawPath(
                path = linePath,
                color = metric.accent,
                style = androidx.compose.ui.graphics.drawscope.Stroke(
                    width = 2.2.dp.toPx(),
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round,
                ),
            )
        }
    }
}

@Composable
private fun AxisLabel(text: String, color: Color) {
    NexioText(text = text, fontSize = 11.sp, color = color)
}

private fun computeRange(values: List<Float>, metric: DetailMetric): Pair<Float, Float> {
    val minSpan = when (metric) {
        DetailMetric.POWER -> 2f
        DetailMetric.CURRENT -> 200f
        DetailMetric.VOLTAGE -> 0.05f
    }
    val min = values.min()
    val max = values.max()
    val span = (max - min).coerceAtLeast(minSpan)
    val center = (min + max) / 2f
    val padding = span * 0.15f
    return (center - span / 2f - padding) to (center + span / 2f + padding)
}

private fun formatValue(metric: DetailMetric, value: Float): String = when (metric) {
    DetailMetric.POWER -> String.format(Locale.US, "%.1f", value)
    DetailMetric.CURRENT -> String.format(Locale.US, "%.0f", value)
    DetailMetric.VOLTAGE -> String.format(Locale.US, "%.2f", value)
}

private fun formatDuration(minutes: Int): String {
    val h = minutes / 60
    val m = minutes % 60
    return if (h > 0) "${h}小时${m}分" else "${m} 分钟"
}
