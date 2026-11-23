package com.smalljelly.batterydata.ui

import com.haooz.nexioui.overlaydialog.OverlayDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.haooz.softglass.backdrop.backdrops.layerBackdrop
import com.haooz.softglass.backdrop.backdrops.rememberLayerBackdrop
import com.smalljelly.batterydata.data.LogFile
import com.smalljelly.batterydata.data.LogFileStore
import com.smalljelly.batterydata.ui.components.NexioTopBar
import com.smalljelly.batterydata.ui.components.pageTopBarHeight
import com.smalljelly.batterydata.ui.components.rememberNexioTopBarState
import com.smalljelly.batterydata.ui.components.rememberTopBarPull
import androidx.compose.foundation.layout.size
import androidx.compose.ui.input.nestedscroll.nestedScroll
import com.smalljelly.batterydata.ui.components.NexioIconButton
import com.haooz.nexioui.icon.extended.ChevronBackward
import kotlinx.coroutines.delay
import com.haooz.nexioui.button.Button
import com.haooz.nexioui.button.ButtonDefaults
import com.haooz.nexioui.card.Card
import com.haooz.nexioui.scaffold.Scaffold
import com.haooz.nexioui.text.NexioText
import com.haooz.nexioui.button.FlatTextButton
import com.haooz.nexioui.icon.NexioIcons
import com.haooz.nexioui.icon.extended.Delete
import com.haooz.nexioui.theme.NexioTheme
import com.haooz.nexioui.overscroll.overScrollVertical
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val logTimeFormat = SimpleDateFormat("MM-dd HH:mm:ss", Locale.CHINA)

/** 列表底部留白（不含导航栏、不含为"收标题"补的行程、不含底部按钮栏） */
private val LogListBottomSpace = 24.dp

/** 实时记录的采样间隔 */
private const val LiveSampleIntervalMs = 2_000L

/**
 * 日志诊断页：顶栏和记录页完全一套（大标题 + 顶部渐进模糊带 + 玻璃按钮），
 * 卡片用 Miuix Card，列出应用私有目录里的诊断日志；底部一颗蓝色主按钮开始 / 停止实时记录。
 */
@Composable
fun LogDiagnosticScreen(onBack: () -> Unit, onOpenLog: (LogFile) -> Unit) {
    val context = LocalContext.current
    val colors = NexioTheme.colorScheme
    val store = remember { LogFileStore(context.applicationContext) }

    var logs by remember { mutableStateOf<List<LogFile>>(emptyList()) }
    var confirmClear by remember { mutableStateOf(false) }
    var recording by remember { mutableStateOf(false) }
    var recordedSec by remember { mutableIntStateOf(0) }

    /**
     * [seedIfEmpty] 只在首次进页面时为 true：没有任何日志时抓一份快照，页面不至于空白。
     * 清空之后必须传 false —— 否则立刻又补一份新快照，看起来就是"清空了文件还在"。
     */
    fun refresh(seedIfEmpty: Boolean = true) {
        if (seedIfEmpty && store.list().isEmpty()) store.collect()
        logs = store.list()
    }

    LaunchedEffect(Unit) { refresh() }

    // 实时记录：每 2 秒追一条采样，顺带刷新列表里的大小，用户能看见文件在长
    LaunchedEffect(recording) {
        if (!recording) return@LaunchedEffect
        var ticks = 0
        while (true) {
            store.appendLiveSample()
            recordedSec = ticks * (LiveSampleIntervalMs / 1000).toInt()
            logs = store.list()
            ticks++
            delay(LiveSampleIntervalMs)
        }
    }

    // 离开页面就收尾（补一行结束时间），不要在后台留一个"还在记"的假状态
    DisposableEffect(Unit) {
        onDispose {
            recording = false
            if (store.liveRecording != null) store.stopLiveRecording()
        }
    }

    val listState = rememberLazyListState()
    // 顶栏材质：与记录页同一口径 —— 停在顶部时没有材质，内容钻进栏下才淡入
    val (pullModifier, _) = rememberTopBarPull()
    // 顶栏：折叠 / 材质由库的 CollapsibleTopAppBar 负责
    val topBarState = rememberNexioTopBarState()
    val backdrop = rememberLayerBackdrop()
    val density = LocalDensity.current

    Box(Modifier.fillMaxSize()) {
    Scaffold(
        topBar = {
            NexioTopBar(
                state = topBarState,
                title = "日志收集",
                largeTitle = "日志收集",
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
                actions = { backdropAlpha, shadowAlpha ->
                    NexioIconButton(
                        onClick = { confirmClear = true },
                        backdrop = backdrop,
                        icon = NexioIcons.Delete,
                        contentDescription = "清空日志",
                        backdropAlpha = backdropAlpha,
                        shadowAlpha = shadowAlpha,
                        iconTint = colors.onBackground,
                    )
                },
            )
        },
        bottomBar = {
            LogRecordBar(
                recording = recording,
                recordedSec = recordedSec,
                onToggle = {
                    if (recording) {
                        recording = false
                        store.stopLiveRecording()
                        logs = store.list()
                    } else if (store.startLiveRecording() != null) {
                        recordedSec = 0
                        recording = true
                        logs = store.list()
                    }
                },
            )
        },
        containerColor = colors.background,
        contentWindowInsets = WindowInsets(0.dp, 0.dp, 0.dp, 0.dp),
    ) { innerPadding ->
        // 让位用 Scaffold 实测的栏高（第一帧还没量到时退回常数）
        val measuredTop = innerPadding.calculateTopPadding()
        val contentTopInset =
            (if (measuredTop > 0.dp) measuredTop else pageTopBarHeight()) + 8.dp
        val insetPx = with(density) { contentTopInset.roundToPx() }
        val baseBottomPx = with(density) { LogListBottomSpace.roundToPx() }
        // 底部按钮栏（含导航栏让位）——Scaffold 已经算好了
        val bottomBarPx = with(density) { innerPadding.calculateBottomPadding().roundToPx() }

        var viewportPx by remember { mutableIntStateOf(0) }

        // 内容不足一屏时列表没有滚动范围 -> 顶栏永远等不到"内容钻进栏下"，
        // 大标题也收不起来。和记录页同一套办法：底部补一段够用的行程（3/4 个栏高）。
        val extraRoomPx by remember(listState, insetPx, viewportPx, bottomBarPx) {
            derivedStateOf {
                val info = listState.layoutInfo
                if (viewportPx <= 0 || info.totalItemsCount == 0 ||
                    info.visibleItemsInfo.size < info.totalItemsCount
                ) {
                    return@derivedStateOf 0f
                }
                // 全部可见时，可见条目高度之和就是内容高度（这个版本的
                // LazyListLayoutInfo 没有 totalItemsSize）
                val contentPx = info.visibleItemsInfo.sumOf { it.size }
                val existing = contentPx + insetPx + baseBottomPx + bottomBarPx - viewportPx
                (insetPx * 3 / 4f - existing).coerceAtLeast(0f)
            }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                // 采样源：整块滚动内容（顶栏从这里取模糊素材）。
                // 底色必须画在采样层里面（layerBackdrop 之后）：layerBackdrop 只录
                // 它内层的内容，底色在外层时录到的图层全透明，糊带 / 弹窗都采不到东西
                .layerBackdrop(backdrop)
                .background(colors.background),
        ) {
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .fillMaxSize()
                    .onSizeChanged { if (it.height != viewportPx) viewportPx = it.height }
                    // 顶栏折叠 / 材质（按钮两态）的滚动来源，作为回弹层的父连接
                    .nestedScroll(topBarState.scrollBehavior.nestedScrollConnection)
                    .overScrollVertical()
                    // 内层才能拿到"列表没消费掉"的增量（回弹位移）
                    .then(pullModifier),
                overscrollEffect = null,
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(
                    start = 16.dp,
                    end = 16.dp,
                    top = contentTopInset,
                    bottom = LogListBottomSpace + with(density) { extraRoomPx.toDp() } +
                        with(density) { bottomBarPx.toDp() },
                ),
            ) {
                items(logs, key = { it.name }) { log ->
                    LogCard(
                        log = log,
                        onClick = { onOpenLog(log) },
                    )
                }
                if (logs.isEmpty()) {
                    item {
                        NexioText(
                            text = "暂无日志文件",
                            fontSize = 14.sp,
                            color = colors.onSurfaceVariantSummary,
                            modifier = Modifier.padding(vertical = 24.dp),
                        )
                    }
                }
            }
        }

    }

    // 弹窗放在 Scaffold 外面，才能盖住顶栏 / 底栏；模糊发生在面板自己身上，背景只压暗
    // NexioUI 的对话框：玻璃、模糊、折射、动画都是库自己的实现
    OverlayDialog(
        show = confirmClear,
        title = "清空日志",
        summary = "将删除全部诊断日志文件，此操作不可恢复。",
        // 面板自己采样这一层做模糊，背后页面只压暗
        liquidGlassBackdrop = backdrop,
        onDismissRequest = { confirmClear = false },
        // 挂到最外层 Scaffold 的弹层宿主，才能盖住顶栏 / 底栏
        renderInRootScaffold = true,
    ) {
            // 和 NexioUI 自己的对话框一致：等宽按钮、12dp 间距、主操作走主色
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                FlatTextButton(
                    text = "取消",
                    modifier = Modifier.weight(1f),
                    onClick = { confirmClear = false },
                )
                FlatTextButton(
                    text = "清空",
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.textButtonColorsPrimary(),
                    onClick = {
                        // 正在记录的文件也算日志，一起停掉再删
                        if (store.liveRecording != null) {
                            recording = false
                            store.stopLiveRecording()
                        }
                        store.deleteAll()
                        confirmClear = false
                        refresh(seedIfEmpty = false)
                    },
                )
            }
        }
    }
}

/**
 * 底部固定栏：一颗 Miuix 主色（蓝）按钮。
 * 记录中文案变成「停止记录 · 00:12」并带计时，停止后文件留在上面的列表里可点开。
 *
 * 底色用**渐进遮罩**而不是一块实色：从顶边全透明过渡到按钮上方的实色，
 * 列表滚到底部时自然"化"进背景，不会在栏的上沿切出一条硬边（和顶栏渐进模糊同一个思路，
 * 这里只要渐变、不需要模糊）。
 */
@Composable
private fun LogRecordBar(
    recording: Boolean,
    recordedSec: Int,
    onToggle: () -> Unit,
) {
    val colors = NexioTheme.colorScheme
    val background = colors.background
    val scrim = remember(background) {
        Brush.verticalGradient(
            colorStops = arrayOf(
                0f to background.copy(alpha = 0f),
                0.28f to background.copy(alpha = 0.55f),
                0.52f to background,
                1f to background,
            ),
        )
    }
    Box(Modifier.fillMaxWidth()) {
        // 列表从下面穿过，这一层负责"渐隐"：越往上越透，内容在上面就慢慢消失
        Box(
            Modifier
                .matchParentSize()
                .background(scrim),
        )
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .windowInsetsPadding(WindowInsets.navigationBars)
                .padding(horizontal = 16.dp)
                .padding(top = 20.dp, bottom = 10.dp),
        ) {
            Button(
                onClick = onToggle,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                colors = ButtonDefaults.buttonColorsPrimary(),
                insideMargin = PaddingValues(horizontal = 16.dp),
            ) {
                NexioText(
                    text = if (recording) "停止记录 · ${formatElapsed(recordedSec)}" else "开始记录日志",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                )
            }
        }
    }
}

private fun formatElapsed(seconds: Int): String {
    val m = seconds / 60
    val s = seconds % 60
    return String.format(Locale.US, "%02d:%02d", m, s)
}

@Composable
private fun LogCard(log: LogFile, onClick: () -> Unit) {
    val colors = NexioTheme.colorScheme
    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick,
        cornerRadius = 20.dp,
        insideMargin = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                NexioText(
                    text = if (log.name.startsWith("live-")) "实时记录" else "运行日志",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = ColorPrimary,
                )
                Spacer(Modifier.height(4.dp))
                NexioText(
                    text = log.name,
                    fontSize = 15.sp,
                    color = colors.onSurfaceContainer,
                )
                Spacer(Modifier.height(2.dp))
                NexioText(
                    text = "Size: ${formatSize(log.sizeBytes)}",
                    fontSize = 12.sp,
                    color = colors.onSurfaceVariantSummary,
                )
            }
            Spacer(Modifier.width(12.dp))
            NexioText(
                text = logTimeFormat.format(Date(log.modifiedMillis)),
                fontSize = 12.sp,
                color = colors.onSurfaceVariantSummary,
            )
        }
    }
}

private val ColorPrimary = androidx.compose.ui.graphics.Color(0xFF2962FF)

private fun formatSize(bytes: Long): String = when {
    bytes >= 1024 * 1024 -> String.format(Locale.US, "%.1f MB", bytes / 1024f / 1024f)
    bytes >= 1024 -> "${bytes / 1024} KB"
    else -> "$bytes B"
}
