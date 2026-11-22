package com.smalljelly.batterydata.ui

import com.haooz.nexioui.overlaydialog.OverlayDialog
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.isSystemInDarkTheme
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.graphics.layer.GraphicsLayer
import androidx.compose.ui.graphics.layer.drawLayer
import androidx.compose.ui.graphics.rememberGraphicsLayer
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.changedToUp
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.layout
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.material3.Icon
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.haooz.softglass.GlassMaterialLevel
import com.haooz.softglass.SoftGlassTheme
import com.haooz.softglass.backdrop.GlassEffectScope
import com.haooz.softglass.backdrop.backdrops.layerBackdrop
import com.haooz.softglass.backdrop.backdrops.rememberLayerBackdrop
import com.haooz.softglass.backdrop.drawBackdrop
import com.haooz.softglass.backdrop.effects.blur
import com.haooz.softglass.shape.ContinuousCapsule
import com.smalljelly.batterydata.data.BatteryRepository
import com.smalljelly.batterydata.data.BatterySettings
import com.smalljelly.batterydata.data.ChargeRecord
import com.smalljelly.batterydata.data.ChargeRecorder
import com.smalljelly.batterydata.data.RecorderState
import com.smalljelly.batterydata.data.UiDiagnostics
import com.smalljelly.batterydata.ui.components.ManualCapacityDialog
import com.smalljelly.batterydata.ui.components.NexioTopBar
import com.smalljelly.batterydata.ui.components.TopBarActionSize
import com.smalljelly.batterydata.ui.components.menuDropdownColors
import com.smalljelly.batterydata.ui.components.rememberNexioTopBarState
import com.smalljelly.batterydata.ui.components.capacityText
import com.smalljelly.batterydata.ui.components.designSourceSuffix
import com.smalljelly.batterydata.ui.components.pageTopBarHeight
import com.smalljelly.batterydata.ui.components.rememberTopBarPull
import com.haooz.nexioui.button.ButtonDefaults
import com.smalljelly.batterydata.ui.components.NexioIconButton
import com.smalljelly.batterydata.ui.components.reportPressTo
import com.haooz.nexioui.dropdown.DropdownEntry
import com.haooz.nexioui.dropdown.DropdownItem
import com.haooz.nexioui.dropdown.DropdownMaskMode
import com.haooz.nexioui.dropdown.DropdownPanelDragSelectState
import com.haooz.nexioui.dropdown.OverlayDropdownPopup
import com.haooz.nexioui.card.Card
import com.haooz.nexioui.scaffold.Scaffold
import com.haooz.nexioui.text.NexioText
import com.haooz.nexioui.button.FlatTextButton
import com.haooz.nexioui.theme.NexioTheme
import top.yukonga.miuix.kmp.icon.MiuixIcons
import top.yukonga.miuix.kmp.icon.extended.Add
import top.yukonga.miuix.kmp.icon.extended.More
import com.smalljelly.batterydata.ui.components.materialGlassColor
import com.smalljelly.batterydata.ui.theme.AppMaterial
import com.haooz.nexioui.overscroll.overScrollVertical
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.abs
import kotlin.math.roundToInt

private val dateFormat = SimpleDateFormat("yyyy年M月d日", Locale.CHINA)
private val timeFormat = SimpleDateFormat("HH:mm", Locale.CHINA)

/** 健康度变化小于这个值就不显示：本来就是测量误差 */
private const val HEALTH_DELTA_EPSILON = 0.05f

/**
 * 单次充电记录列表。
 *
 * 这里不再手动填表：点右上角“＋”或空态的大按钮，就开始一次记录——
 * 正在充电就立刻记，没在充电就等充电器插上；一直记到拔电，自动结算成一条。
 * 顶栏与首页同一套（大标题 + 渐进模糊带 + 右上角三点菜单），卡片可点进详情、长按删除。
 */
@Composable
fun RecordsScreen(
    records: List<ChargeRecord>,
    recorder: RecorderState,
    /** 这一页是否真正显示在前台（Pager 两页始终组合，动画得等切过来再播） */
    isActive: Boolean,
    menuOpen: Boolean,
    onMenuOpenChange: (Boolean) -> Unit,
    onStartRecording: () -> Unit,
    onCancelRecording: () -> Unit,
    onFinishRecording: () -> Unit,
    onDelete: (Long) -> Unit,
    onOpenRecord: (ChargeRecord, Rect, GraphicsLayer) -> Unit,
    onOpenAbout: () -> Unit,
    onModalVisibleChange: (Boolean) -> Unit,
    onTopBarPressChange: (Boolean) -> Unit,
) {
    val context = LocalContext.current
    val colors = NexioTheme.colorScheme
    val settings = remember { BatterySettings(context.applicationContext) }
    val repository = remember { BatteryRepository(context.applicationContext) }
    var designSample by remember { mutableStateOf(repository.snapshot()) }

    // 列表状态：既喂顶栏的渐进模糊（首项越过 10dp 就淡入），也给回弹用
    val listState = rememberLazyListState()
    // 顶栏材质：跟首页同一口径——停在顶部时没有材质，下滑才淡入。
    // 这里不再加"保底可见度"：以前没内容可糊时用 0.72 强撑一条带子，
    // 看起来就是一层灰条，反而掩盖了"内容根本没到顶栏下面"这个真问题。
    // 拖动位移（短列表的唯一信号）：挂在内层，见 rememberTopBarPull 的注释
    val (pullModifier, pull) = rememberTopBarPull()
    // 顶栏：折叠 / 材质由库的 CollapsibleTopAppBar 负责，这里只建一份共享状态
    val topBarState = rememberNexioTopBarState()
    val backdrop = rememberLayerBackdrop()
    val pageBackdrop = rememberLayerBackdrop()

    val density = LocalDensity.current

    // menuOpen 由容器层持有：菜单展开时底栏依然能点，点它就先收菜单再切页
    var menuMounted by remember { mutableStateOf(false) }
    // 页面三点钮的过渡态：true=进入隐藏方向，false=面板已退场、按钮正常显示
    var menuIconHidden by remember { mutableStateOf(false) }
    var menuFraction by remember { mutableFloatStateOf(0f) }
    var openAboutAfterMenu by remember { mutableStateOf(false) }
    var openCapacityAfterMenu by remember { mutableStateOf(false) }
    var showManualCapacityDialog by remember { mutableStateOf(false) }

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
                        openCapacityAfterMenu = true
                        currentOnMenuOpenChange(false)
                    },
                ),
            ),
        )
    }
    // 下拉收起态就是这颗按钮：库按这个尺寸把面板缩回触发区
    val menuButtonSize = remember(density) {
        val px = with(density) { TopBarActionSize.roundToPx() }
        IntSize(px, px)
    }

    // 展开即进入淡出方向：f=0 时按钮仍可见（与浮层收起态重合），随 fraction 迅速淡出，
    // 不空帧、玻璃采到的残留也是淡出中的（同 NexioSchedule / 首页）
    LaunchedEffect(menuOpen) {
        if (menuOpen) {
            menuMounted = true
            menuIconHidden = true
        }
    }

    // 多选删除：长按卡片进入选择态，底部换成只有「删除」的悬浮操作栏
    var selectionMode by remember { mutableStateOf(false) }
    var selectedIds by remember { mutableStateOf<Set<Long>>(emptySet()) }
    var confirmDelete by remember { mutableStateOf(false) }
    // 正在播"反向让位"动画的 id：先让卡片收起，动画真正播完才从数据里删掉。
    // 用「动画完成回调」而不是定时器，避免时长对不上导致看起来瞬间消失。
    var deletingIds by remember { mutableStateOf<Set<Long>>(emptySet()) }
    var exitDoneIds by remember { mutableStateOf<Set<Long>>(emptySet()) }

    // 取消记录：先让头部卡片播反向收起动画，播完才真正切到 Idle，
    // 否则 onCancelRecording 一调用 state 立刻变 Idle，卡片瞬间消失没有动画。
    var exitingLive by remember { mutableStateOf(false) }
    val requestCancelLive = { if (!exitingLive) exitingLive = true }
    val finishCancelLive = {
        exitingLive = false
        onCancelRecording()
    }

    LaunchedEffect(exitDoneIds) {
        if (deletingIds.isNotEmpty() && exitDoneIds.containsAll(deletingIds)) {
            deletingIds.forEach(onDelete)
            deletingIds = emptySet()
            exitDoneIds = emptySet()
            selectedIds = emptySet()
            selectionMode = false
        }
    }

    // 新记录入场动画：上一帧的 id 集合，用来判断这一帧哪些是"新来的"
    var knownIds by remember { mutableStateOf<Set<Long>?>(null) }
    val currentIds = remember(records) { records.mapTo(HashSet()) { it.id } }
    val addedNow = remember(records) {
        knownIds?.let { currentIds - it }.orEmpty()
    }
    // 一次性标记：只会判定为"新"一次。没有它的话，卡片滑出屏幕再回来、
    // 或者回弹导致重组时，isNew 会再次成立，动画就会被反复重播（看起来就是乱跳）
    val revealedIds = remember { mutableSetOf<Long>() }
    SideEffect { knownIds = currentIds }

    // 记录时通知栏常驻，Android 13+ 需要通知权限（不给也能记，只是没有那条通知）
    val notificationPermission = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        // 刚授权：让前台服务立刻把常驻通知补出来，不用等下一次采样
        if (granted) ChargeRecorder.refreshNotification()
    }

    val startRecording = {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS,
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
        onStartRecording()
    }

    BackHandler(enabled = menuOpen || menuMounted) { onMenuOpenChange(false) }
    // 选择态下返回键退出选择（优先于切页）
    BackHandler(enabled = selectionMode) {
        selectionMode = false
        selectedIds = emptySet()
    }

    // 任何页内弹窗 / 选择态打开时，底栏让位，避免和悬浮操作栏叠在一起
    val dialogOpen = confirmDelete || showManualCapacityDialog
    val bottomHidden = dialogOpen || selectionMode
    LaunchedEffect(bottomHidden) { onModalVisibleChange(bottomHidden) }

    val recording = recorder as? RecorderState.Recording
    val waiting = recorder as? RecorderState.Waiting
    val busy = recording != null || waiting != null

    SoftGlassTheme(
        // 材质档跟关于页的设置走：柔和/液态/磨砂/关闭
        level = AppMaterial.current.glassLevel,
        isDark = isSystemInDarkTheme(),
        hasWallpaper = false,
    ) {
        Box(Modifier.fillMaxSize()) {
            Scaffold(
                modifier = Modifier.layerBackdrop(pageBackdrop),
                topBar = {
                    // 顶栏：库的 CollapsibleTopAppBar（大标题折叠）+ 渐进模糊带
                    NexioTopBar(
                        state = topBarState,
                        title = "记录",
                        largeTitle = "充电记录",
                        backdrop = backdrop,
                        actions = { backdropAlpha, shadowAlpha ->
                            // 空态自己有大按钮；正在记录 / 选择态时也不该再开一条
                            if (!busy && !selectionMode && records.isNotEmpty()) {
                                NexioIconButton(
                                    onClick = { startRecording() },
                                    backdrop = backdrop,
                                    icon = MiuixIcons.Add,
                                    contentDescription = "开始记录",
                                    backdropAlpha = backdropAlpha,
                                    shadowAlpha = shadowAlpha,
                                    iconTint = colors.onBackground,
                                    modifier = Modifier.reportPressTo(onTopBarPressChange),
                                )
                            }
                            // 选择态只留顶部标题，操作都在底部那条删除栏里
                            if (!selectionMode) Box {
                                // 两态玻璃钮 + 延后两帧隐藏（见 menuIconHidden），与首页三点钮同款交接
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
                                    // 展开随 fraction 迅速淡出；退场保持隐藏，onDismissFinished 才回 1
                                    modifier = Modifier
                                        .graphicsLayer {
                                            alpha = if (!menuIconHidden) 1f
                                                else if (menuOpen) (1f - menuFraction / 0.18f).coerceIn(0f, 1f)
                                                else 0f
                                        }
                                        // 按住/拖这颗按钮期间禁用横滑切页
                                        .reportPressTo(onTopBarPressChange),
                                )
                                // 库的浮层下拉：挂到最外层宿主，落在被采样的 Scaffold 之外
                                OverlayDropdownPopup(
                                    entry = menuEntry,
                                    show = menuOpen,
                                    onDismiss = { onMenuOpenChange(false) },
                                    onDismissFinished = {
                                        menuMounted = false
                                        menuIconHidden = false
                                        menuFraction = 0f
                                        if (openAboutAfterMenu) {
                                            openAboutAfterMenu = false
                                            onOpenAbout()
                                        } else if (openCapacityAfterMenu) {
                                            openCapacityAfterMenu = false
                                            showManualCapacityDialog = true
                                        }
                                    },
                                    maxHeight = null,
                                    dropdownColors = menuDropdownColors(),
                                    renderInRootScaffold = true,
                                    collapseOnSelection = false,
                                    onFractionProgress = { menuFraction = it },
                                    // 跟手滑选：按住面板上下滑动连续选择
                                    dragSelectState = remember { DropdownPanelDragSelectState(maskMode = DropdownMaskMode.Sliding) },
                                    liquidGlassBackdrop = if (AppMaterial.current.panelBlurDp > 0.dp) {
                                        pageBackdrop
                                    } else {
                                        null
                                    },
                                    collapseSize = menuButtonSize,
                                    collapseContent = {
                                        // 同首页：42dp Box 居中 22dp 图标，与页面按钮逐像素重合，
                                        // 避免库把裸图标钉在面板右上角导致归位跳动闪烁
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
                },
                containerColor = colors.background,
                contentWindowInsets = WindowInsets(0.dp, 0.dp, 0.dp, 0.dp),
            ) { innerPadding ->
                // 顶栏是**盖在列表上**的：列表从屏幕顶端一直铺到底，内容靠 contentPadding 让开顶栏。
                //
                // 让位高度**必须用 Scaffold 自己量出来的顶栏高度**（innerPadding.top），
                // 不能自己按"状态栏 + 行高 + 大标题"算一个常数：两者不是同一个来源，差一点
                // 就会把列表顶进顶栏里 —— 表现就是大标题压在卡片上、栏下没有内容可糊，
                // 「大标题和模糊一起丢了」。用测量值，栏多高就退多少，不可能错位。
                // 第一帧 innerPadding 还没量到（为 0）时退回常数，避免闪一下。
                val measuredTop = innerPadding.calculateTopPadding()
                val contentTopInset =
                    (if (measuredTop > 0.dp) measuredTop else pageTopBarHeight()) + 8.dp
                val insetPx = with(density) { contentTopInset.roundToPx() }
                UiDiagnostics.band("records").contentTopInsetPx = insetPx

                // 列表实测高度：下面算"还差多少行程"要用
                var viewportPx by remember { mutableIntStateOf(0) }
                // 内容不足一屏时列表**没有滚动范围**：首卡永远停在栏下，顶栏等不到
                // "内容滑进栏下"，渐进模糊就永远不出现（诊断里会看到偏移恒为 0）。
                // 这里在底部补一段刚好够用的行程（正好把首卡推进栏下一个栏高），
                // 让短列表也能滑出顶栏材质；长列表本来就滚得动，这段为 0。
                val baseBottom = 96.dp
                val baseBottomPx = with(density) { baseBottom.roundToPx() }
                val extraRoomPx by remember(listState, insetPx, viewportPx) {
                    derivedStateOf {
                        val info = listState.layoutInfo
                        // 条目没全部组合时 totalItemsSize 不等于真实内容高度，不能当依据
                        if (viewportPx <= 0 || info.totalItemsCount == 0 ||
                            info.visibleItemsInfo.size < info.totalItemsCount
                        ) {
                            return@derivedStateOf 0
                        }
                        // 所有条目都可见时，可见条目高度之和就是内容高度（这个版本的
                        // LazyListLayoutInfo 没有 totalItemsSize）
                        val contentPx = info.visibleItemsInfo.sumOf { it.size }
                        val existing = contentPx + insetPx + baseBottomPx - viewportPx
                        // 只给「3/4 个栏高」的行程：够把首卡推进栏下看到模糊，
                        // 又不至于一路滑到屏幕最顶上、被状态栏压住
                        (insetPx * 3 / 4 - existing).coerceAtLeast(0)
                    }
                }

                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        // 采样层要自带不透明底：layerBackdrop 只录它内层的内容，
                        // 底色必须写在它**后面**。之前底色在外层，录到的图层全透明 ——
                        // 顶栏渐进模糊采不到素材，弹窗玻璃也只剩灰板
                        .layerBackdrop(backdrop)
                        .background(colors.background),
                ) {
                    // 列表从屏幕顶端铺到底：顶栏盖在它上面，靠 contentPadding 让开栏高。
                    LazyColumn(
                        state = listState,
                        modifier = Modifier
                            .fillMaxSize()
                            .onSizeChanged { if (it.height != viewportPx) viewportPx = it.height }
                            // 顶栏折叠 / 材质（按钮两态）的滚动来源：作为 overScrollVertical 的
                            // 父连接，回弹层会把位移先 dispatch 给它 → 大标题收起、材质淡入
                            .nestedScroll(topBarState.scrollBehavior.nestedScrollConnection)
                            // Miuix 自带回弹：内部自带 clipToBounds + 布局期位移，
                            // 且先把位移交给父节点（顶栏），所以不会越界盖住标题、
                            // 也不会吃掉顶栏展开所需的位移
                            .overScrollVertical()
                            // ⚠ 必须在内层：嵌套滚动由内向外派发，内层才能拿到
                            // "列表没消费掉"的那部分增量（也就是回弹位移）
                            .then(pullModifier),
                        // 关掉 foundation 那套：它的 shouldDispatchOverscroll 门控在
                        // 内容不满一屏时压根不派发，留着只会和上面这层叠加
                        overscrollEffect = null,
                        // ⚠ 条目间距不用 spacedBy，改成每个条目自己带一段尾部留白
                        // （见 RevealOnAppear 的 bottomGap）：spacedBy 的间距不参与
                        // 高度动画，条目收回 0 高时那 12dp 还在，等条目真被移除时
                        // 会瞬间塌掉 —— 看起来就是"收回最后一下下面的卡片弹一下"。
                        verticalArrangement = Arrangement.Top,
                        // 顶部让开顶栏，底部留出悬浮底栏，
                        // 左右 16dp 用内边距而不是外层 padding：列表自身要满宽，
                        // 副本才能和顶栏左右对齐
                        contentPadding = PaddingValues(
                            start = 16.dp,
                            end = 16.dp,
                            top = contentTopInset,
                            bottom = baseBottom + with(density) { extraRoomPx.toDp() },
                        ),
                    ) {
                        // 记录中 / 等待充电：作为列表第一项，跟历史记录一起滚
                        when {
                            recording != null -> {
                                item(key = "live_recording") {
                                    RevealOnAppear(
                                        isNew = true,
                                        active = isActive,
                                        exiting = exitingLive,
                                        onExitFinished = finishCancelLive,
                                    ) {
                                        RecordingCard(
                                            state = recording,
                                            onFinish = onFinishRecording,
                                            onCancel = requestCancelLive,
                                        )
                                    }
                                }
                            }

                            waiting != null -> {
                                item(key = "live_waiting") {
                                    RevealOnAppear(
                                        isNew = true,
                                        active = isActive,
                                        exiting = exitingLive,
                                        onExitFinished = finishCancelLive,
                                    ) {
                                        WaitingCard(
                                            state = waiting,
                                            onCancel = requestCancelLive,
                                        )
                                    }
                                }
                            }
                        }

                        itemsIndexed(records, key = { _, item -> item.id }) { index, record ->
                            // 新记录：高度 0 → 满高 + 淡入，下面的卡片就是被"顶"下去的。
                            // 只有记录页真正在前台时才播，否则会在这个"看不见但已组合"的页面里
                            // 悄悄播完（Pager 两页始终同时存在），切过来就只剩结果
                            RevealOnAppear(
                                isNew = record.id in addedNow && revealedIds.add(record.id),
                                active = isActive,
                                exiting = record.id in deletingIds,
                                onExitFinished = { exitDoneIds = exitDoneIds + record.id },
                            ) {
                                RecordCard(
                                    record = record,
                                    healthDelta = healthDelta(records, index),
                                    selectionMode = selectionMode,
                                    selected = record.id in selectedIds,
                                    onClick = { rect, layer ->
                                        if (selectionMode) {
                                            val next = if (record.id in selectedIds) {
                                                selectedIds - record.id
                                            } else {
                                                selectedIds + record.id
                                            }
                                            selectedIds = next
                                            if (next.isEmpty()) selectionMode = false
                                        } else {
                                            onOpenRecord(record, rect, layer)
                                        }
                                    },
                                    onLongClick = {
                                        // 长按进入选择态（并选中这一条），删除放到下面那条悬浮栏
                                        if (!selectionMode) {
                                            selectionMode = true
                                            selectedIds = setOf(record.id)
                                        } else {
                                            selectedIds = selectedIds + record.id
                                        }
                                    },
                                )
                            }
                        }
                    }
                }

                // 空态：不放 LazyColumn 条目里 —— 条目的高度就是内容高度，摆出来天然贴顶，
                // 只有左右能靠 horizontalAlignment 居中。这里单独铺一块「顶栏以下、底栏以上」
                // 的可用区域，让按钮和说明文字在**屏幕垂直方向**也居中。
                // 空态时列表里本来就没有条目，覆盖在上面不会有遮挡。
                if (records.isEmpty() && !busy) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(top = contentTopInset, bottom = baseBottom)
                            .padding(horizontal = 16.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        EmptyRecords(onStart = { startRecording() })
                    }
                }
            }

                if (confirmDelete) {
                    // NexioUI 的对话框：玻璃、模糊、折射、动画都是库自己的实现
                    OverlayDialog(
                        show = true,
                        title = "删除记录",
                        summary = if (selectedIds.size == 1) {
                            val timestamp = records.firstOrNull { it.id in selectedIds }?.dateMillis
                            "确定要删除" + (timestamp?.let { " ${dateFormat.format(Date(it))} " } ?: "") + "的这条记录吗？"
                        } else {
                            "确定要删除选中的 ${selectedIds.size} 条记录吗？"
                        },
                        // 面板自己采样这一层做模糊，背后页面只压暗
                        liquidGlassBackdrop = backdrop,
                        onDismissRequest = { confirmDelete = false },
                        // 挂到最外层 Scaffold 的弹层宿主，才能盖住顶栏 / 底栏
                        renderInRootScaffold = true,
                    ) {
                        // 参照系统确认弹窗：两个等宽灰底按钮，危险操作标红
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            DialogActionButton(
                                text = "取消",
                                textColor = colors.onSurfaceContainer,
                                modifier = Modifier.weight(1f),
                                onClick = { confirmDelete = false },
                            )
                            DialogActionButton(
                                text = "删除",
                                textColor = Color(0xFFE0433C),
                                modifier = Modifier.weight(1f),
                                onClick = {
                                    // 先只标记，让卡片播完"淡出 + 高度收回"再真正删除
                                    deletingIds = selectedIds
                                    confirmDelete = false
                                },
                            )
                        }
                    }
                }

                ManualCapacityDialog(
                    show = showManualCapacityDialog,
                    manualCapacity = settings.manualDesignCapacityMah(),
                    currentDesign = capacityText(designSample.designCapacityMah) +
                        designSourceSuffix(designSample.designSource),
                    backdrop = backdrop,
                    onSet = { value ->
                        settings.setManualDesignCapacityMah(value)
                        designSample = repository.snapshot()
                        showManualCapacityDialog = false
                    },
                    onDismiss = { showManualCapacityDialog = false },
                )

            // 菜单已由库的 OverlayDropdownPopup 渲染到窗口弹层（见顶栏 actions），
            // 这里不再挂第二棵树

            // 选择态的悬浮操作栏：照 Nexio 编辑课表页，只留一个「删除」。
            // 放在被采样的 Scaffold 之外才能安全采样 pageBackdrop（底栏玻璃同款）
            AnimatedVisibility(
                visible = selectionMode,
                enter = fadeIn(tween(140)) + slideInVertically(tween(220)) { it / 2 },
                exit = fadeOut(tween(120)) + slideOutVertically(tween(180)) { it / 2 },
            ) {
                Box(
                    Modifier
                        .fillMaxSize()
                        .windowInsetsPadding(WindowInsets.navigationBars),
                    contentAlignment = Alignment.BottomCenter,
                ) {
                    DeleteActionPill(
                        enabled = selectedIds.isNotEmpty(),
                        backdrop = pageBackdrop,
                        onClick = { confirmDelete = true },
                        modifier = Modifier.padding(bottom = 10.dp),
                    )
                }
            }
        }
    }
}

/** 单个动作（删除）的玻璃胶囊，尺寸与底部切换栏一致 */
@Composable
private fun DeleteActionPill(
    enabled: Boolean,
    backdrop: com.haooz.softglass.backdrop.GlassBackdrop,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val dark = isSystemInDarkTheme()
    val shape = remember { ContinuousCapsule() }
    val shapeBlock: () -> Shape = remember(shape) { { shape } }
    // 悬浮胶囊：和底栏同一套材质参数（液态更透、磨砂更奶白、关闭不模糊）
    val material = AppMaterial.current
    val effectsBlock: GlassEffectScope.() -> Unit = remember(material.bottomBlurDp) {
        { if (material.bottomBlurDp > 0.dp) blur(material.bottomBlurDp.toPx()) }
    }
    val glassColor = materialGlassColor(dark, material)
    val surfaceBlock: DrawScope.() -> Unit = remember(glassColor) { { drawRect(glassColor) } }
    val contentColor = if (enabled) Color(0xFFE0433C) else Color(0xFF9A9A9A)

    Row(
        modifier = modifier
            .height(56.dp)
            .width(132.dp)
            .drawBackdrop(
                backdrop = backdrop,
                shape = shapeBlock,
                effects = effectsBlock,
                onDrawSurface = surfaceBlock,
            )
            .clickable(
                enabled = enabled,
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick,
            ),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        TrashGlyph(color = contentColor)
        Spacer(Modifier.width(8.dp))
        NexioText(
            text = "删除",
            fontSize = 15.sp,
            fontWeight = FontWeight.Medium,
            color = contentColor,
        )
    }
}

/** 垃圾桶图标（与底栏图标同一套手绘线条） */
@Composable
private fun TrashGlyph(color: Color) {
    Canvas(Modifier.size(20.dp)) {
        val stroke = 1.7.dp.toPx()
        val w = size.width
        val h = size.height
        // 盖
        drawLine(
            color = color,
            start = androidx.compose.ui.geometry.Offset(w * 0.14f, h * 0.24f),
            end = androidx.compose.ui.geometry.Offset(w * 0.86f, h * 0.24f),
            strokeWidth = stroke,
            cap = androidx.compose.ui.graphics.StrokeCap.Round,
        )
        // 提手
        drawLine(
            color = color,
            start = androidx.compose.ui.geometry.Offset(w * 0.38f, h * 0.24f),
            end = androidx.compose.ui.geometry.Offset(w * 0.38f, h * 0.13f),
            strokeWidth = stroke,
            cap = androidx.compose.ui.graphics.StrokeCap.Round,
        )
        drawLine(
            color = color,
            start = androidx.compose.ui.geometry.Offset(w * 0.62f, h * 0.24f),
            end = androidx.compose.ui.geometry.Offset(w * 0.62f, h * 0.13f),
            strokeWidth = stroke,
            cap = androidx.compose.ui.graphics.StrokeCap.Round,
        )
        drawLine(
            color = color,
            start = androidx.compose.ui.geometry.Offset(w * 0.38f, h * 0.13f),
            end = androidx.compose.ui.geometry.Offset(w * 0.62f, h * 0.13f),
            strokeWidth = stroke,
            cap = androidx.compose.ui.graphics.StrokeCap.Round,
        )
        // 桶身
        val left = w * 0.22f
        val right = w * 0.78f
        val top = h * 0.32f
        val bottom = h * 0.88f
        val path = androidx.compose.ui.graphics.Path().apply {
            moveTo(left, top)
            lineTo(left + w * 0.04f, bottom)
            quadraticTo(left + w * 0.05f, bottom, left + w * 0.12f, bottom)
            lineTo(right - w * 0.12f, bottom)
            quadraticTo(right - w * 0.05f, bottom, right - w * 0.04f, bottom)
            lineTo(right, top)
        }
        drawPath(
            path = path,
            color = color,
            style = androidx.compose.ui.graphics.drawscope.Stroke(
                width = stroke,
                cap = androidx.compose.ui.graphics.StrokeCap.Round,
                join = androidx.compose.ui.graphics.StrokeJoin.Round,
            ),
        )
    }
}

@Composable
private fun DialogActionButton(
    text: String,
    textColor: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val colors = NexioTheme.colorScheme
    Box(
        modifier = modifier
            .height(44.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(colors.secondaryContainer)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick,
            ),
        contentAlignment = Alignment.Center,
    ) {
        NexioText(
            text = text,
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium,
            color = textColor,
        )
    }
}

/**
 * 正在记录：显示已充到多少、充了多久、平均功率，可以提前结束或直接放弃。
 * 拔电后它自动消失，列表顶部出现一条正式记录。
 */
@Composable
private fun RecordingCard(
    state: RecorderState.Recording,
    onFinish: () -> Unit,
    onCancel: () -> Unit,
) {
    val colors = NexioTheme.colorScheme
    Card(
        modifier = Modifier.fillMaxWidth(),
        cornerRadius = 20.dp,
        insideMargin = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
    ) {
        Column(Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                NexioText(
                    text = dateFormat.format(Date(state.startAt)) +
                        " " + timeFormat.format(Date(state.startAt)),
                    fontSize = 15.sp,
                    color = colors.onSurfaceContainer,
                )
                Spacer(Modifier.weight(1f))
                NexioText(
                    text = if (state.minutes > 0) "已充 ${state.minutes} 分钟" else "刚开始",
                    fontSize = 11.sp,
                    color = colors.onSurfaceVariantSummary,
                )
            }
            Spacer(Modifier.height(6.dp))
            NexioText(
                text = "记录中",
                fontSize = 32.sp,
                lineHeight = 38.sp,
                fontWeight = FontWeight.Bold,
                color = colors.primary,
            )
            Spacer(Modifier.height(10.dp))
            NexioText(
                text = "${state.fromLevel}% → ${state.level}%",
                fontSize = 15.sp,
                color = colors.onSurfaceContainer,
            )
            Spacer(Modifier.height(4.dp))
            NexioText(
                text = liveValues(state),
                fontSize = 13.sp,
                color = colors.onSurfaceVariantSummary,
            )
            Spacer(Modifier.height(2.dp))
            NexioText(
                text = buildString {
                    append("平均 ")
                    append(state.avgPowerW?.let { "${formatOne(it)} W" } ?: "—")
                    state.energyWh?.let { append("，已输入 ${formatOne(it)} Wh") }
                    append("，拔电后自动保存")
                },
                fontSize = 13.sp,
                color = colors.onSurfaceVariantSummary,
            )
            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                FlatTextButton(text = "放弃", onClick = onCancel)
                Spacer(Modifier.width(8.dp))
                FlatTextButton(
                    text = "结束并保存",
                    colors = ButtonDefaults.textButtonColorsPrimary(),
                    onClick = onFinish,
                )
            }
        }
    }
}

/** 等待充电：已经点过开始记录，等充电器插上 */
@Composable
private fun WaitingCard(state: RecorderState.Waiting, onCancel: () -> Unit) {
    val colors = NexioTheme.colorScheme
    Card(
        modifier = Modifier.fillMaxWidth(),
        cornerRadius = 20.dp,
        insideMargin = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
    ) {
        Column(Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                NexioText(
                    text = timeFormat.format(Date(state.since)) + " 开始等待",
                    fontSize = 15.sp,
                    color = colors.onSurfaceContainer,
                )
                Spacer(Modifier.weight(1f))
                NexioText(
                    text = "当前 ${state.level}%",
                    fontSize = 11.sp,
                    color = colors.onSurfaceVariantSummary,
                )
            }
            Spacer(Modifier.height(6.dp))
            NexioText(
                text = "等待充电",
                fontSize = 32.sp,
                lineHeight = 38.sp,
                fontWeight = FontWeight.Bold,
                color = colors.primary,
            )
            Spacer(Modifier.height(10.dp))
            NexioText(
                text = "插上充电器后自动开始记录，拔电时保存这一次的曲线",
                fontSize = 13.sp,
                color = colors.onSurfaceVariantSummary,
            )
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                FlatTextButton(text = "取消", onClick = onCancel)
            }
        }
    }
}

@Composable
private fun EmptyRecords(onStart: () -> Unit, modifier: Modifier = Modifier) {
    val colors = NexioTheme.colorScheme
    Column(
        // 必须撑满：Column 默认宽度只有内容宽（300dp 的按钮），躺在列表左边缘，
        // 里面的 horizontalAlignment 就没有可居中的余量，整块会贴着左边。
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        // 设计稿里是蓝色填充的大圆角按钮，配色改用主题主色
        Box(
            modifier = Modifier
                .width(300.dp)
                .height(62.dp)
                .clip(RoundedCornerShape(18.dp))
                .background(colors.primary)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onStart,
                ),
            contentAlignment = Alignment.Center,
        ) {
            NexioText(
                text = "开始记录",
                fontSize = 18.sp,
                fontWeight = FontWeight.Medium,
                color = Color.White,
            )
        }
        Spacer(Modifier.height(12.dp))
        NexioText(
            text = "点一下就开始，插上充电器自动记录\n拔电时自动保存这一次的完整过程",
            fontSize = 14.sp,
            lineHeight = 21.sp,
            color = colors.onSurfaceVariantSummary,
            textAlign = TextAlign.Center,
        )
    }
}

/** 选择态的勾选圈：选中是实心圆 + 白勾，未选中是空心圈 */
@Composable
private fun SelectionMark(selected: Boolean) {
    val colors = NexioTheme.colorScheme
    Box(
        modifier = Modifier
            .size(22.dp)
            .clip(CircleShape)
            .background(if (selected) colors.primary else Color.Transparent)
            .then(
                if (selected) {
                    Modifier
                } else {
                    Modifier.border(
                        width = 1.5.dp,
                        color = colors.onSurfaceVariantSummary.copy(alpha = 0.45f),
                        shape = CircleShape,
                    )
                },
            ),
        contentAlignment = Alignment.Center,
    ) {
        if (selected) {
            Canvas(Modifier.size(13.dp)) {
                val w = size.width
                val h = size.height
                val path = androidx.compose.ui.graphics.Path().apply {
                    moveTo(w * 0.14f, h * 0.52f)
                    lineTo(w * 0.4f, h * 0.78f)
                    lineTo(w * 0.87f, h * 0.24f)
                }
                drawPath(
                    path = path,
                    color = Color.White,
                    style = androidx.compose.ui.graphics.drawscope.Stroke(
                        width = 1.9.dp.toPx(),
                        cap = androidx.compose.ui.graphics.StrokeCap.Round,
                        join = androidx.compose.ui.graphics.StrokeJoin.Round,
                    ),
                )
            }
        }
    }
}

/**
 * 新条目的入场：高度 0 → 满高，同时淡入。
 *
 * 高度是真的在长，所以下面的卡片是被平滑"顶"下去的（这就是让位动画本身），
 * 不依赖 LazyColumn 自带的 item 动画。
 *
 * [active] 是这一页是否真的在前台。Pager 的两个页面一直同时组合着，新记录往往
 * 是在首页那侧生成的，如果在组合时就播，动画会在看不见的地方播完，切过来只剩结果。
 * 所以：先定性（[isNew] 只在第一次组合时读一次），等 [active] 变 true 才真正开始。
 */
@Composable
private fun RevealOnAppear(
    isNew: Boolean,
    active: Boolean,
    exiting: Boolean = false,
    onExitFinished: () -> Unit = {},
    /** 条目尾部留白：跟着高度一起收放，条目被移除时不会突然塌掉一段 */
    bottomGap: Dp = 12.dp,
    content: @Composable () -> Unit,
) {
    // 第一次组合时定性，之后 isNew 变回 false 也不影响（remember 不带 key）
    val play = remember { isNew }
    val progress = remember { Animatable(if (play) 0f else 1f) }
    var started by remember { mutableStateOf(false) }

    LaunchedEffect(active) {
        if (play && active && !started) {
            started = true
            progress.animateTo(
                targetValue = 1f,
                animationSpec = spring(dampingRatio = 0.88f, stiffness = 240f),
            )
        }
    }
    LaunchedEffect(exiting) {
        if (exiting) {
            // 删除 = 进场的反向：高度收回 0 + 淡出，下面的卡片顺势上移补位。
            // 动画真正结束才回调，数据删除由回调驱动，不会出现"瞬间消失"。
            progress.animateTo(0f, animationSpec = tween(420))
            onExitFinished()
        }
    }
    Box(
        Modifier
            .graphicsLayer { alpha = progress.value.coerceIn(0f, 1f) }
            // 高度没长满之前裁掉，否则卡片会画到下面那张上去
            .clipToBounds()
            .layout { measurable, constraints ->
                val placeable = measurable.measure(constraints.copy(minHeight = 0))
                val height = (placeable.height * progress.value.coerceIn(0f, 1f)).roundToInt()
                layout(placeable.width, height) { placeable.place(0, 0) }
            },
    ) {
        // 尾部留白放在被裁的这一层里面：height 收到 0 时它也一起收掉，
        // 移除条目的那一帧列表高度没有突变，下面的卡片不会被"弹"一下
        Column {
            content()
            Spacer(Modifier.height(bottomGap))
        }
    }
}

/** 卡片位置的可变持有者：故意不用 snapshot state，位置变化不该触发重组 */
private class CardBounds {
    var rect: Rect = Rect.Zero
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun RecordCard(
    record: ChargeRecord,
    healthDelta: Float?,
    selectionMode: Boolean,
    selected: Boolean,
    onClick: (Rect, GraphicsLayer) -> Unit,
    onLongClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = NexioTheme.colorScheme
    // 位置只写进普通对象，不用 snapshot state：回弹时列表每帧都在动，
    // 用 state 会让所有卡片每帧重组，入场动画随之被反复触发（就是之前"乱"的原因）
    val bounds = remember { CardBounds() }
    // 卡片自己的图层：展开动画靠它当"快照"，开头看到的才是这张卡片本身
    val cardLayer = rememberGraphicsLayer()
    Box(
        modifier = modifier
            .fillMaxWidth()
            .onGloballyPositioned { bounds.rect = it.boundsInRoot() }
            .combinedClickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = { onClick(bounds.rect, cardLayer) },
                onLongClick = onLongClick,
            )
            .drawWithContent {
                val scope = this
                cardLayer.record { scope.drawContent() }
                drawLayer(cardLayer)
            },
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            cornerRadius = 20.dp,
            insideMargin = PaddingValues(horizontal = 18.dp, vertical = 16.dp),
        ) {
            Column(Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    NexioText(
                        text = dateFormat.format(Date(record.dateMillis)),
                        fontSize = 15.sp,
                        color = colors.onSurfaceContainer,
                    )
                    Spacer(Modifier.weight(1f))
                    if (selectionMode) {
                        // 选择态：右上角换成勾选圈（时长让位，退出选择态就回来）
                        SelectionMark(selected = selected)
                    } else {
                        NexioText(
                            text = record.durationMinutes?.let { formatDuration(it) } ?: "—",
                            fontSize = 11.sp,
                            color = colors.onSurfaceVariantSummary,
                        )
                    }
                }
                Spacer(Modifier.height(6.dp))
                NexioText(
                    text = "${record.fromLevel}~${record.toLevel}%",
                    fontSize = 32.sp,
                    lineHeight = 38.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.onSurfaceContainer,
                )
                Spacer(Modifier.height(12.dp))
                Row(Modifier.fillMaxWidth()) {
                    StatBlock(
                        label = "平均功率",
                        value = record.avgPowerW?.let { "${formatOne(it)} W" } ?: "—",
                        modifier = Modifier.weight(1f),
                    )
                    StatBlock(
                        label = "健康度",
                        value = record.healthPercent?.let { "${formatOne(it)}%" } ?: "—",
                        note = healthDelta
                            // 变化小于测量误差就不显示，免得每条记录都挂着"较上次 +0.01%"
                            ?.takeIf { abs(it) > HEALTH_DELTA_EPSILON }
                            ?.let { delta ->
                                // 一次充电只能测一次容量，所以变化是跟上一条有数据的记录比的
                                "较上次 ${if (delta < -HEALTH_DELTA_EPSILON) "−" else "+"}${formatTwo(abs(delta))}%"
                            },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }
}

@Composable
private fun StatBlock(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    note: String? = null,
) {
    val colors = NexioTheme.colorScheme
    Column(modifier) {
        NexioText(text = "$label：", fontSize = 12.sp, color = colors.onSurfaceVariantSummary)
        Spacer(Modifier.height(3.dp))
        Row(verticalAlignment = Alignment.Bottom) {
            NexioText(text = value, fontSize = 15.sp, color = colors.onSurfaceContainer)
            if (note != null) {
                Spacer(Modifier.width(6.dp))
                NexioText(
                    text = note,
                    fontSize = 11.sp,
                    color = colors.onSurfaceVariantSummary,
                    modifier = Modifier.padding(bottom = 1.dp),
                )
            }
        }
    }
}

/** 记录中的瞬时值：功率 / 电流 / 电压，读不到的项跳过 */
private fun liveValues(state: RecorderState.Recording): String {
    val parts = buildList {
        state.lastPowerW?.let { add("${formatOne(it)} W") }
        state.lastCurrentMa?.let { add("${formatOne(it / 1000f)} A") }
        state.lastVoltageV?.let { add("${formatTwo(it)} V") }
    }
    return if (parts.isEmpty()) "正在读取电流与电压" else "当前 " + parts.joinToString("，")
}

/** 跟列表中更旧的一条有健康度的记录比：负数表示这次测出来更低了 */
private fun healthDelta(records: List<ChargeRecord>, index: Int): Float? {
    val current = records.getOrNull(index)?.healthPercent ?: return null
    val previous = records.drop(index + 1).firstNotNullOfOrNull { it.healthPercent } ?: return null
    return current - previous
}

private fun formatOne(value: Float): String = String.format(Locale.US, "%.1f", value)

private fun formatTwo(value: Float): String = String.format(Locale.US, "%.2f", value)

private fun formatDuration(minutes: Int): String {
    val h = minutes / 60
    val m = minutes % 60
    return if (h > 0) "${h} 小时 ${m} 分" else "${m} 分钟"
}
