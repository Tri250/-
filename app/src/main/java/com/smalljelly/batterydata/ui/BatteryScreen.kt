package com.smalljelly.batterydata.ui

import android.content.Context
import android.os.Build
import android.os.PowerManager
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.runtime.rememberCoroutineScope
import kotlin.math.abs
import kotlinx.coroutines.launch
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.compose.ui.zIndex
import com.smalljelly.batterydata.data.BatteryRepository
import com.smalljelly.batterydata.data.ChargeRecordStore
import com.smalljelly.batterydata.data.ChargeRecorder
import com.smalljelly.batterydata.data.RecorderState
import com.smalljelly.batterydata.data.BatterySettings
import com.smalljelly.batterydata.data.BatterySample
import com.smalljelly.batterydata.data.UiDiagnostics
import com.smalljelly.batterydata.data.formatEta
import com.smalljelly.batterydata.ui.components.BatteryHealthCard
import com.smalljelly.batterydata.ui.components.BatteryHeroCard
import com.smalljelly.batterydata.ui.components.CardExpandOverlay
import com.smalljelly.batterydata.ui.components.reportPressTo
import com.smalljelly.batterydata.ui.components.InfoRow
import com.smalljelly.batterydata.ui.components.InnerDivider
import com.smalljelly.batterydata.ui.components.LiveChartCard
import com.smalljelly.batterydata.ui.components.ManualCapacityDialog
import com.smalljelly.batterydata.ui.components.NexioTopBar
import com.smalljelly.batterydata.ui.components.TopBarActionSize
import com.smalljelly.batterydata.ui.components.NexioTopContentSpacer
import com.smalljelly.batterydata.ui.components.rememberNexioTopBarState
import com.smalljelly.batterydata.ui.components.BatteryTabIcon
import com.smalljelly.batterydata.ui.components.RecordsTabIcon
import com.smalljelly.batterydata.ui.components.menuDropdownColors
import com.smalljelly.batterydata.ui.components.capacityText
import com.smalljelly.batterydata.ui.components.designSourceSuffix
import com.smalljelly.batterydata.ui.components.RealtimeStatsCard
import com.haooz.nexioui.bottombar.BottomBar
import com.haooz.nexioui.bottombar.BottomBarItem
import com.haooz.nexioui.topappbar.CollapsibleTopAppBarDefaults
import com.haooz.nexioui.card.Card
import com.haooz.nexioui.text.NexioText
import com.haooz.nexioui.button.FlatTextButton
import com.haooz.nexioui.button.ButtonDefaults
import com.smalljelly.batterydata.ui.components.NexioIconButton
import com.haooz.nexioui.dropdown.DropdownEntry
import com.haooz.nexioui.dropdown.DropdownItem
import com.haooz.nexioui.dropdown.DropdownMaskMode
import com.haooz.nexioui.dropdown.DropdownPanelDragSelectState
import com.haooz.nexioui.dropdown.OverlayDropdownPopup
import com.haooz.nexioui.theme.NexioTheme
import top.yukonga.miuix.kmp.icon.MiuixIcons
import top.yukonga.miuix.kmp.icon.extended.More
import com.smalljelly.batterydata.ui.theme.AppMaterial
import com.haooz.softglass.GlassMaterialLevel
import com.haooz.softglass.SoftGlassTheme
import com.haooz.softglass.backdrop.GlassBackdrop
import com.haooz.softglass.backdrop.GlassEffectScope
import com.haooz.softglass.backdrop.backdrops.layerBackdrop
import com.haooz.softglass.backdrop.backdrops.rememberLayerBackdrop
import com.haooz.softglass.backdrop.drawBackdrop
import com.haooz.softglass.backdrop.effects.blur
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.BlurEffect
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.layer.GraphicsLayer
import androidx.compose.ui.graphics.rememberGraphicsLayer
import java.util.Locale

private const val HISTORY_SIZE = 60

/** 刷新间隔：1 秒（README「1 秒级刷新」承诺；充电记录服务仍按 10 秒采样，见 ChargeRecordService） */
private const val REFRESH_INTERVAL_MS = 1_000L

/** 没有历史电流数据时，估算亮屏时长采用的典型亮屏电流（mA） */
private const val TYPICAL_SCREEN_ON_CURRENT_MA = 450f

/** 亮屏电流样本的滑动窗口：3 分钟（1 秒一采，180 个样本） */
private const val SCREEN_ON_WINDOW = 180

/** 少于这个数量就不信样本，退回典型值 */
private const val MIN_SCREEN_ON_SAMPLES = 6

/** 记录详情展开时，下层页面最终虚化的半径 */
private val DetailBlurRadius = 12.dp

/** 页面：底栏两页 + 关于页 + 充电详情 */
private sealed interface Screen {
    data object Home : Screen
    data object Records : Screen
    data object About : Screen
    data class Detail(val id: Long) : Screen
}

private fun Screen.depth(): Int = when (this) {
    Screen.Home -> 0
    Screen.Records -> 1
    is Screen.Detail -> 2
    Screen.About -> 2
}

private val AppTabs = listOf(
    BottomBarItem(icon = BatteryTabIcon, label = "电池", contentDescription = "电池"),
    BottomBarItem(icon = RecordsTabIcon, label = "记录", contentDescription = "记录"),
)

@Composable
fun BatteryScreen() {
    val context = LocalContext.current
    val store = remember { ChargeRecordStore(context.applicationContext) }
    // 单次记录的记录器是全局单例：状态与落盘都在它内部，切页、进详情都不受影响
    val recorderState by ChargeRecorder.state.collectAsState()
    val recordsVersion by ChargeRecorder.recordsVersion.collectAsState()

    LaunchedEffect(Unit) {
        ChargeRecorder.ensure(context.applicationContext)
        BatteryRepository(context.applicationContext).stream(REFRESH_INTERVAL_MS).collect { sample ->
            // 记录器自己会去重，前台页面也喂一份，服务万一没起来也不至于漏采
            ChargeRecorder.onSample(sample)
        }
    }

    // 顶栏模糊自检的入口（日志页的「界面诊断」）已经去掉，这个开关不再暴露给用户。
    // 启动时强制归零：之前开着自检就等于永久关掉了模糊，而界面上再也关不掉。
    LaunchedEffect(Unit) {
        val settings = BatterySettings(context.applicationContext)
        if (settings.topBlurSelfTest()) settings.setTopBlurSelfTest(false)
        UiDiagnostics.selfTest = false
    }

    val scope = rememberCoroutineScope()
    // 两个主页面用 Pager 承载：跟手横滑、页面不重建，所以不会闪
    val pagerState = rememberPagerState(initialPage = 0) { 2 }
    // 哪一页的「更多」菜单展开着（-1 = 没展开）。
    // 不能用单个 Boolean：两个主页面在 Pager 里始终同时活着，共用一个 bool 会让
    // 两页的菜单同时挂载，出现两份重叠的面板。
    var menuPage by remember { mutableIntStateOf(-1) }
    // 手势闭包只创建一次，必须实时读菜单状态，否则会一直拿到首次组合时的值
    val menuPageState by rememberUpdatedState(menuPage)
    // 顶栏玻璃按钮正被按住/拖拽（拉伸交互）：期间禁用 Pager 横滑切页。
    // 按下瞬间就置 true（手势尚无位移），比按位移阈值拦截更稳，斜向拖也不漏。
    var topBarDragging by remember { mutableStateOf(false) }
    // 页内弹窗（删除确认 / 设计容量）打开时，底栏要让位
    var modalVisible by remember { mutableStateOf(false) }
    // 底栏选中项：点击/拖拽时先乐观更新，再由 pager 的落位回写，避免"滑块卡在两格之间"
    var barIndex by remember { mutableIntStateOf(0) }
    // 二级页：关于（右侧推入）/ 单次充电详情（卡片原地展开）
    var showAbout by remember { mutableStateOf(false) }
    var showLogs by remember { mutableStateOf(false) }
    // 日志详情：内容和可见性分开存。关闭时只把可见性置 false，内容留着播完滑出动画，
    // 否则滑出去的是个空面板，看起来像"啪一下消失"。
    var viewingLog by remember { mutableStateOf<Pair<com.smalljelly.batterydata.data.LogFile, String>?>(null) }
    var logDetailVisible by remember { mutableStateOf(false) }
    var detailId by remember { mutableStateOf<Long?>(null) }
    var detailVisible by remember { mutableStateOf(false) }
    // 正在播收起动画：这期间仍算"二级页打开"，底栏不能提前滑进来盖住缩小的面板
    var detailClosing by remember { mutableStateOf(false) }
    // 被点卡片在 root 里的位置，作为展开动画的起点
    var detailOrigin by remember { mutableStateOf<Rect?>(null) }
    // 展开进度放在容器层：面板和它后面的页面共用这一条，节奏才一致
    val detailAnim = remember { Animatable(0f) }
    val detailBlurPx = with(LocalDensity.current) { DetailBlurRadius.toPx() }
    // 被点卡片的图层快照：展开开头用它顶替卡片画面
    var detailSnapshot by remember { mutableStateOf<GraphicsLayer?>(null) }
    val overlayOpen = showAbout || showLogs || logDetailVisible || detailVisible || detailClosing

    // 底栏的玻璃采样源：整页内容。底栏自己画在这层**外面**，
    // 否则"采样层里包含采样者"会让 HWUI 渲染树成环（之前踩过，直接 SIGSEGV）。
    val barBackdrop = rememberLayerBackdrop()

    // 顶栏按钮行（状态栏 + 折叠行）的底边 Y：在这行里横向拖拽是在拖玻璃按钮（拉伸交互），
    // 不应触发左右切页。按钮的 inspectDragGestures observeConsumed=true，吃掉横向事件后
    // 它仍能观察到拉伸，Pager 却不会翻页。
    val topRowBottomPx = with(LocalDensity.current) {
        (WindowInsets.statusBars.asPaddingValues().calculateTopPadding() +
            CollapsibleTopAppBarDefaults.CollapsedHeight).toPx()
    }

    LaunchedEffect(pagerState.currentPage) {
        barIndex = pagerState.currentPage
        // 换了页，上一页的菜单不该还挂着
        if (menuPage >= 0) menuPage = -1
    }

    // 返回键一级一级退：日志详情 → 日志收集 → 关于 → 主页面。
    // 之前是一次性把 viewingLog / showLogs / showAbout 全清掉，
    // 从"日志详情"按返回就直接掉回主页面（连跳两级），像是没进过日志页。
    BackHandler(enabled = overlayOpen || pagerState.currentPage != 0) {
        when {
            logDetailVisible -> logDetailVisible = false
            showLogs -> showLogs = false
            showAbout -> showAbout = false
            detailVisible -> {
                detailVisible = false
                detailClosing = true
            }
            else -> scope.launch { pagerState.animateScrollToPage(0) }
        }
    }

    Box(Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .layerBackdrop(barBackdrop)
                // 两种情况在 Initial 阶段吃掉横向位移，Pager 在 Main 阶段看到已消费就不翻页：
                // 1) 菜单展开时横滑只用来收菜单；2) 在顶栏按钮行里横滑是在拖玻璃按钮（拉伸），
                //    不切页。按钮 inspectDragGestures observeConsumed=true，仍能观察到拉伸。
                .pointerInput(Unit) {
                    awaitEachGesture {
                        val down = awaitFirstDown(
                            requireUnconsumed = false,
                            pass = PointerEventPass.Initial,
                        )
                        val inTopButtonRow = down.position.y < topRowBottomPx
                        var blocking = false
                        while (true) {
                            val event = awaitPointerEvent(PointerEventPass.Initial)
                            val change = event.changes.firstOrNull { it.id == down.id }
                                ?: event.changes.firstOrNull { it.pressed }
                            if (change == null || !change.pressed) break
                            if (!blocking) {
                                val menuOpen = menuPageState >= 0
                                // 菜单没开、又不在顶栏按钮行 → 让 Pager 正常翻页
                                if (!menuOpen && !inTopButtonRow) break
                                val total = change.position - down.position
                                if (abs(total.x) > viewConfiguration.touchSlop &&
                                    abs(total.x) > abs(total.y)
                                ) {
                                    blocking = true
                                    // 菜单开着才播收起动画；按钮行拖拽只是吃掉横滑，不动菜单
                                    if (menuOpen) menuPage = -1
                                } else if (abs(total.y) > viewConfiguration.touchSlop) {
                                    // 纵向：交给列表滚动 / 顶栏折叠
                                    break
                                }
                            }
                            if (blocking) change.consume()
                        }
                    }
                },
        ) {
            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .fillMaxSize()
                    // 记录详情展开时下层页面逐渐虚化：压暗 + 模糊一起上，
                    // 面板和背景的层次才拉开。模糊半径跟着展开进度走，
                    // 读的是 detailAnim（不在组合期读，只更新图层属性）
                    .graphicsLayer {
                        val p = detailAnim.value.coerceIn(0f, 1f)
                        renderEffect = if (
                            Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && p > 0.01f
                        ) {
                            val r = detailBlurPx * p
                            BlurEffect(r, r, TileMode.Clamp)
                        } else {
                            null
                        }
                    },
                beyondViewportPageCount = 1,
                // 菜单展开时整页锁死：横滑只用来收菜单（下面的 Initial 拦截负责），
                // 页面一动不动。光靠消费事件不够稳 —— Pager 的拖动检测有时已经启动，
                // 这一条是硬开关，保证不会再出现"菜单开着页面滑走一半"。
                userScrollEnabled = menuPage < 0 && !topBarDragging,
                // 滑到头不要回弹拉伸（否则会露出页面外的空白，像是"滑出界")
                overscrollEffect = null,
            ) { page ->
                when (page) {
                    0 -> HomeScreen(
                        menuOpen = menuPage == 0,
                        onMenuOpenChange = { open -> menuPage = if (open) 0 else -1 },
                        onOpenAbout = { showAbout = true },
                        onModalVisibleChange = { modalVisible = it },
                        onTopBarPressChange = { topBarDragging = it },
                    )

                    else -> {
                        val records = remember(recordsVersion) { store.all() }
                        RecordsScreen(
                            records = records,
                            recorder = recorderState,
                            // 只有记录页真的在当前可见位置时，新记录才播入场动画
                            isActive = pagerState.currentPage == 1 && !overlayOpen,
                            menuOpen = menuPage == 1,
                            onMenuOpenChange = { open -> menuPage = if (open) 1 else -1 },
                            onStartRecording = { ChargeRecorder.arm(context) },
                            onCancelRecording = { ChargeRecorder.cancel(context) },
                            onFinishRecording = { ChargeRecorder.stopAndSave(context) },
                            onDelete = { id ->
                                store.delete(id)
                                ChargeRecorder.notifyRecordsChanged()
                            },
                            onOpenRecord = { record, rect, layer ->
                                detailOrigin = rect
                                detailSnapshot = layer
                                detailId = record.id
                                detailClosing = false
                                detailVisible = true
                            },
                            onOpenAbout = { showAbout = true },
                            onModalVisibleChange = { modalVisible = it },
                            onTopBarPressChange = { topBarDragging = it },
                        )
                    }
                }
            }

            // 关于页从右侧推入；两个主页面始终活在 Pager 里，回来时状态不丢
            AnimatedVisibility(
                visible = showAbout,
                enter = slideInHorizontally(spring(dampingRatio = 0.92f, stiffness = 420f)) { it / 5 } +
                    fadeIn(tween(160)),
                exit = slideOutHorizontally(tween(220)) { it / 5 } + fadeOut(tween(160)),
            ) {
                AboutScreen(
                    onBack = { showAbout = false },
                    onOpenLogs = { showLogs = true },
                )
            }

            // 日志诊断页：和关于页同一套右侧推入动画
            AnimatedVisibility(
                visible = showLogs,
                enter = slideInHorizontally(spring(dampingRatio = 0.92f, stiffness = 420f)) { it / 5 } +
                    fadeIn(tween(160)),
                exit = slideOutHorizontally(tween(220)) { it / 5 } + fadeOut(tween(160)),
            ) {
                LogDiagnosticScreen(
                    onBack = { showLogs = false },
                    onOpenLog = { log ->
                        viewingLog = log to com.smalljelly.batterydata.data.LogFileStore(
                            context.applicationContext,
                        ).read(log)
                        logDetailVisible = true
                    },
                )
            }

            // 日志详情：和日志页同一套右侧推入动画
            AnimatedVisibility(
                visible = logDetailVisible,
                enter = slideInHorizontally(spring(dampingRatio = 0.92f, stiffness = 420f)) { it / 5 } +
                    fadeIn(tween(160)),
                exit = slideOutHorizontally(tween(220)) { it / 5 } + fadeOut(tween(160)),
            ) {
                viewingLog?.let { (log, text) ->
                    LogDetailScreen(log = log, content = text, onBack = { logDetailVisible = false })
                }
            }

            // 单次记录详情：从被点的那张卡片原地长成一整页（容器转换）
            val detailRecord = remember(detailId) {
                detailId?.let { id -> store.all().firstOrNull { it.id == id } }
            }
            if (detailRecord != null) {
                CardExpandOverlay(
                    visible = detailVisible,
                    origin = detailOrigin,
                    snapshot = detailSnapshot,
                    progress = detailAnim,
                    onDismissed = {
                        detailId = null
                        detailSnapshot = null
                        detailClosing = false
                    },
                ) {
                    ChargeDetailScreen(
                        record = detailRecord,
                        onBack = {
                            detailVisible = false
                            detailClosing = true
                        },
                    )
                }
            }
        }

        // 底栏在两个主页面始终显示（菜单展开时也留着，点它就收回菜单并切页）；
        // 只有二级页 / 页内弹窗时才让位
        AnimatedVisibility(
            visible = !overlayOpen && !modalVisible,
            enter = fadeIn(tween(160)) + slideInVertically(tween(220)) { it / 2 },
            exit = fadeOut(tween(120)) + slideOutVertically(tween(180)) { it / 2 },
            modifier = Modifier.zIndex(1f),
        ) {
            PageBottomBar(
                selected = barIndex,
                onSelect = { index ->
                    // 菜单是盖在页面上的，先收回它再切页
                    if (menuPage >= 0) menuPage = -1
                    barIndex = index
                    scope.launch { pagerState.animateScrollToPage(index) }
                },
                backdrop = barBackdrop,
            )
        }
    }
}

/** 悬浮底栏：避开导航栏，胶囊宽度与拖拽手势都由 NexioUI 的 BottomBar 负责 */
@Composable
private fun PageBottomBar(
    selected: Int,
    onSelect: (Int) -> Unit,
    backdrop: com.haooz.softglass.backdrop.GlassBackdrop,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .windowInsetsPadding(WindowInsets.navigationBars),
        contentAlignment = Alignment.BottomCenter,
    ) {
        BottomBar(
            items = AppTabs,
            selectedIndex = selected,
            onSelect = onSelect,
            backdrop = backdrop,
            modifier = Modifier.padding(bottom = 10.dp),
        )
    }
}

@Composable
private fun HomeScreen(
    menuOpen: Boolean,
    onMenuOpenChange: (Boolean) -> Unit,
    onOpenAbout: () -> Unit,
    onModalVisibleChange: (Boolean) -> Unit,
    onTopBarPressChange: (Boolean) -> Unit,
) {
    val context = LocalContext.current
    val colors = NexioTheme.colorScheme
    val repository = remember { BatteryRepository(context.applicationContext) }
    val settings = remember { BatterySettings(context.applicationContext) }
    var sample by remember { mutableStateOf(repository.snapshot()) }
    val currentHistory = remember { mutableStateListOf<Float>() }
    val voltageHistory = remember { mutableStateListOf<Float>() }
    // 亮屏状态下的放电电流样本。只这一个池子用来估「可亮屏时长」：
    // 混进熄屏待机的电流会把时长算得离谱地长，跟系统那个混合使用的预估也完全对不上。
    val screenOnCurrents = remember { mutableStateListOf<Float>() }
    val powerManager = remember(context) {
        context.getSystemService(Context.POWER_SERVICE) as PowerManager
    }

    LaunchedEffect(Unit) {
        repository.stream(REFRESH_INTERVAL_MS).collect { latest ->
            sample = latest
            latest.currentMa?.let { currentHistory.append(it) }
            if (latest.voltageMv > 0) voltageHistory.append(latest.voltageMv / 1_000f)
            // 放电 + 屏幕亮着 才算有效样本（充电时的负电流、待机时的低电流都不能用）
            val discharge = latest.currentMa
            if (!latest.isPlugged && discharge != null && discharge < 0f && powerManager.isInteractive) {
                screenOnCurrents.append(-discharge, SCREEN_ON_WINDOW)
            }
        }
    }

    val scrollState = rememberScrollState()
    // 顶栏：折叠、材质和内容让位共用一份状态（内部是库的 CollapsibleTopAppBar + 渐进模糊带）
    val topBarState = rememberNexioTopBarState()
    val backdrop = rememberLayerBackdrop()
    val pageBackdrop = rememberLayerBackdrop()
    // menuOpen 由容器层持有（底栏要能在菜单展开时点），menuMounted 是本页的挂载态：
    // 收起动画播完才移除
    var menuMounted by remember { mutableStateOf(false) }
    // 页面这颗三点钮的过渡态：true=进入隐藏方向（展开淡出 / 退场保持隐藏），
    // false=面板已彻底退场、按钮正常显示。alpha 随 fraction 迅速淡出（见按钮 graphicsLayer）。
    var menuIconHidden by remember { mutableStateOf(false) }
    var menuFraction by remember { mutableFloatStateOf(0f) }
    var openAboutAfterMenu by remember { mutableStateOf(false) }
    var openCapacityDialogAfterMenu by remember { mutableStateOf(false) }
    // 菜单形变的锚点由库的浮层自己从触发区测量，这里不再手记坐标
    var showManualCapacityDialog by remember { mutableStateOf(false) }

    // 外部（底栏点击）把 menuOpen 置 false 时，本页照样要挂载出来播收起动画。
    // 展开即进入淡出方向：f=0 时 alpha 仍为 1（按钮可见，与浮层收起态重合），随 fraction 迅速淡出，
    // 不会空帧；玻璃采到的残留也是淡出中的，不会闪。
    LaunchedEffect(menuOpen) {
        if (menuOpen) {
            menuMounted = true
            menuIconHidden = true
        }
    }

    BackHandler(enabled = menuOpen || menuMounted) { onMenuOpenChange(false) }

    // 设计容量弹窗打开时，底栏让位
    LaunchedEffect(showManualCapacityDialog) { onModalVisibleChange(showManualCapacityDialog) }

    SoftGlassTheme(
        // 材质档跟关于页的设置走：柔和/液态/磨砂/关闭
        level = AppMaterial.current.glassLevel,
        isDark = isSystemInDarkTheme(),
        hasWallpaper = false,
    ) {
    Box(Modifier.fillMaxSize().layerBackdrop(pageBackdrop)) {
        // 采样层要自带不透明底：layerBackdrop 只录它内层的内容，底色必须写在它**后面**。
        // 之前底色在外层，录到的图层全透明 —— 顶栏渐进模糊的 AGSL 把透明采样全部丢弃，
        // 糊带等于没画（"顶部没有渐进模糊"）；弹窗玻璃从这里取素材也只剩灰板。
        Box(
            modifier = Modifier
                .fillMaxSize()
                .layerBackdrop(backdrop)
                .background(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    // 顶栏让位放进滚动内容里（下面的 NexioTopContentSpacer），不套在容器外：
                    // 外层 padding 会把视口裁到糊带之下，内容永远滚不进糊带、糊不到东西
                    .nestedScroll(topBarState.scrollBehavior.nestedScrollConnection)
                    .verticalScroll(scrollState)
                    .padding(horizontal = 16.dp),
            ) {
                // 让位 = 状态栏 + 折叠行 + 大标题展开段（随折叠在布局期收起）
                NexioTopContentSpacer(topBarState)
                Spacer(Modifier.height(10.dp))
                BatteryHeroCard(sample = sample, etaText = etaText(sample, screenOnCurrents))
            // 充电预计时间已在大电池卡内显示，下面不再重复一张时长卡
            Spacer(Modifier.height(12.dp))
            RealtimeStatsCard(sample = sample)
            Spacer(Modifier.height(12.dp))
            BatteryHealthCard(sample = sample)
            Spacer(Modifier.height(12.dp))
            LiveChartCard(
                currentHistory = currentHistory,
                voltageHistory = voltageHistory,
                intervalMs = REFRESH_INTERVAL_MS,
            )
            Spacer(Modifier.height(12.dp))
            InfoCard(sample)
            Spacer(Modifier.height(18.dp))
            NexioText(
                text = "数据每秒从系统 BatteryManager 与 power_supply 节点读取\n个别机型不开放电流、容量数据时会显示“未公开”",
                fontSize = 11.sp,
                lineHeight = 16.sp,
                color = colors.onSurfaceVariantSummary,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
            // 悬浮底栏不再占 Scaffold 的 bottomBar 槽，这里手动留出栏高（56dp + 边距）
                Spacer(Modifier.height(28.dp + 76.dp))
            }
        }

        // 菜单条目：点击先收菜单，等收起动画播完再切页 / 弹对话框
        val currentOnMenuOpenChange by rememberUpdatedState(onMenuOpenChange)
        val menuEntry = remember {
            DropdownEntry(
                items = listOf(
                    DropdownItem(
                        text = "关于",
                        onClick = {
                            openAboutAfterMenu = true
                            currentOnMenuOpenChange(false)
                        },
                    ),
                    DropdownItem(
                        text = "手动设置电池容量",
                        onClick = {
                            openCapacityDialogAfterMenu = true
                            currentOnMenuOpenChange(false)
                        },
                    ),
                ),
            )
        }
        val menuButtonSize = with(LocalDensity.current) {
            val px = TopBarActionSize.roundToPx()
            IntSize(px, px)
        }

        // 顶栏盖在内容之上：库的折叠栏自己变高变矮，内容位置由上面的 inset 固定
        NexioTopBar(
            state = topBarState,
            title = "电池",
            largeTitle = "电池数据",
            backdrop = backdrop,
            modifier = Modifier.align(Alignment.TopCenter),
            actions = { backdropAlpha, shadowAlpha ->
                // 三点按钮就是下拉的锚点：面板从这颗按钮的位置长开，收回到它
                Box {
                    // 两态玻璃钮：页面顶部普通态、滚出材质后玻璃态。节点保持渲染只用 alpha 隐藏，
                    // 展开时延后两帧再藏（见 menuIconHidden）——先让浮层把收起态图标画上屏，
                    // 避免「页面图标已没、浮层还没画」的空帧，也避免图标残留被玻璃采成鬼影。
                    NexioIconButton(
                        onClick = {
                            menuMounted = true
                            onMenuOpenChange(true)
                        },
                        backdrop = backdrop,
                        icon = MiuixIcons.More,
                        contentDescription = "更多",
                        backdropAlpha = backdropAlpha,
                        shadowAlpha = shadowAlpha,
                        iconTint = colors.onBackground,
                        enabled = !menuOpen,
                        // 展开随 fraction 迅速淡出（玻璃钮整体淡出，不另加模糊以免糊掉玻璃）；
                        // 退场保持隐藏，onDismissFinished 才硬切回 1。收起态图标已由 collapseContent
                        // 用同尺寸居中 Box 与按钮逐像素重合，交接不跳。
                        modifier = Modifier
                            .graphicsLayer {
                                alpha = if (!menuIconHidden) 1f
                                    else if (menuOpen) (1f - menuFraction / 0.18f).coerceIn(0f, 1f)
                                    else 0f
                            }
                            // 按住/拖这颗按钮期间禁用横滑切页
                            .reportPressTo(onTopBarPressChange),
                    )
                    // 库的浮层下拉挂到最外层 Scaffold 的弹层宿主：
                    // 它落在被采样页面层**之外**，采样层不会包含采样者。
                    // （之前自研菜单和采样层在同一棵子树里，渲染树成环 → 首页一点就闪退）
                    OverlayDropdownPopup(
                        entry = menuEntry,
                        show = menuOpen,
                        onDismiss = { onMenuOpenChange(false) },
                        onDismissFinished = {
                            menuMounted = false
                            // 退场动画彻底跑完才把页面这颗按钮还回来（硬切，不做半透明过渡）
                            menuIconHidden = false
                            menuFraction = 0f
                            if (openAboutAfterMenu) {
                                openAboutAfterMenu = false
                                onOpenAbout()
                            } else if (openCapacityDialogAfterMenu) {
                                openCapacityDialogAfterMenu = false
                                showManualCapacityDialog = true
                            }
                        },
                        maxHeight = null,
                        dropdownColors = menuDropdownColors(),
                        renderInRootScaffold = true,
                        collapseOnSelection = false,
                        onFractionProgress = { menuFraction = it },
                        // 跟手滑选：按住面板上下滑动即可连续选择选项
                        dragSelectState = remember { DropdownPanelDragSelectState(maskMode = DropdownMaskMode.Sliding) },
                        liquidGlassBackdrop = if (AppMaterial.current.panelBlurDp > 0.dp) {
                            pageBackdrop
                        } else {
                            null
                        },
                        collapseSize = menuButtonSize,
                        collapseContent = {
                            // 收起态必须和页面那颗按钮逐像素重合：按钮是 42dp 圆里居中 22dp 图标，
                            // 这里也用同尺寸 Box 居中同一图标。之前直接放 22dp 图标会被库钉在
                            // 面板右上角，与按钮的居中图标差约 10dp —— 展开 / 归位交接时图标
                            // 跳一下，就是用户看到的「闪烁」。
                            Box(
                                modifier = Modifier.size(TopBarActionSize),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector = MiuixIcons.More,
                                    contentDescription = null,
                                    modifier = Modifier.size(22.dp),
                                    tint = colors.onBackground,
                                )
                            }
                        },
                        anchorOffsetX = 0.dp,
                        anchorOffsetY = 0.dp,
                    )
                }
            },
        )

        // 弹窗盖在顶栏之上（玻璃面板自己模糊，背景只压暗）
        ManualCapacityDialog(
            show = showManualCapacityDialog,
            manualCapacity = settings.manualDesignCapacityMah(),
            currentDesign = capacityText(sample.designCapacityMah) + designSourceSuffix(sample.designSource),
            backdrop = backdrop,
            onSet = { value ->
                settings.setManualDesignCapacityMah(value)
                sample = repository.snapshot()
                showManualCapacityDialog = false
            },
            onDismiss = { showManualCapacityDialog = false },
        )

        // 菜单已由库的 OverlayDropdownPopup 渲染到窗口弹层，这里不再挂第二棵树
    }
    }
}


@Composable
private fun InfoCard(sample: BatterySample) {
    val colors = NexioTheme.colorScheme
    Card(
        modifier = Modifier.fillMaxWidth(),
        cornerRadius = 20.dp,
        insideMargin = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
    ) {
        NexioText(
            text = "电池信息",
            style = NexioTheme.textStyles.title3,
            color = colors.onSurfaceContainer,
        )
        Spacer(Modifier.height(10.dp))
        InfoRow("电池技术", sample.technology)
        InnerDivider()
        InfoRow("充电方式", sample.pluggedText)
        InnerDivider()
        InfoRow("当前状态", sample.statusText)
        InnerDivider()
        InfoRow(
            label = "剩余电量",
            value = "${sample.level}%",
        )
        InnerDivider()
        InfoRow("采样间隔", "1 秒")
    }
}

private fun etaText(sample: BatterySample, screenOnCurrents: List<Float>): String {
    val temperature = sample.temperatureC?.let { String.format(Locale.US, "%.1f °C", it) }
    return when {
        sample.isFull -> "已充满，建议断开充电器"
        sample.isCharging -> formatEta(sample.etaMinutes)?.let { "预计 $it 后充满" }
            ?: temperature?.let { "电池温度 $it" }
            ?: "剩余电量 ${sample.level}%"
        // 和「可亮屏时长」共用同一套估算：大电池下面和时长卡里的数字必须一致，
        // 否则同一屏上两个"还能用多久"互相打架
        !sample.isPlugged -> formatEta(estimateScreenOnMinutes(sample, screenOnCurrents))
            ?.let { "预计可用 $it" }
            ?: temperature?.let { "电池温度 $it，状态${sample.healthText}" }
            ?: "剩余电量 ${sample.level}%"
        temperature != null -> "电池温度 $temperature，状态${sample.healthText}"
        else -> "剩余电量 ${sample.level}%"
    }
}

/** 剩余电量（mAh）：优先用库仑计，读不到就按「电量% × 满电容量」反推 */
private fun remainingMah(sample: BatterySample): Float? {
    sample.chargeCounterMah?.takeIf { it > 100f }?.let { return it }
    val full = sample.estimatedFullChargeMah ?: sample.designCapacityMah ?: return null
    if (full <= 0f) return null
    return full * sample.level / 100f
}

/**
 * 亮屏时长估算：剩余电量 ÷ 亮屏平均放电电流。
 * 只用屏幕亮着时的放电样本，样本不足时退回典型亮屏电流。
 */
private fun estimateScreenOnMinutes(
    sample: BatterySample,
    screenOnCurrents: List<Float>,
): Int? {
    val mah = remainingMah(sample) ?: return null
    val averageMa = screenOnCurrents
        .takeIf { it.size >= MIN_SCREEN_ON_SAMPLES }
        ?.average()
        ?.toFloat()
        ?.takeIf { it > 0f }
        ?: TYPICAL_SCREEN_ON_CURRENT_MA
    return (mah / averageMa * 60f).toInt().takeIf { it > 0 }
}

private fun MutableList<Float>.append(value: Float, cap: Int = HISTORY_SIZE) {
    if (size >= cap) removeAt(0)
    add(value)
}
