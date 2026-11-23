package com.smalljelly.batterydata.ui

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.haooz.softglass.backdrop.backdrops.layerBackdrop
import com.haooz.softglass.backdrop.backdrops.rememberLayerBackdrop
import com.smalljelly.batterydata.data.LogFile
import com.smalljelly.batterydata.ui.components.NexioTopBar
import com.smalljelly.batterydata.ui.components.pageTopBarHeight
import com.smalljelly.batterydata.ui.components.rememberNexioTopBarState
import com.smalljelly.batterydata.ui.components.rememberTopBarPull
import com.smalljelly.batterydata.ui.components.NexioIconButton
import com.haooz.nexioui.icon.extended.ChevronBackward
import com.haooz.nexioui.scaffold.Scaffold
import com.haooz.nexioui.text.NexioText
import com.haooz.nexioui.icon.NexioIcons
import com.haooz.nexioui.icon.extended.Share
import com.haooz.nexioui.theme.NexioTheme
import com.haooz.nexioui.overscroll.overScrollVertical

/**
 * 日志详情的模糊带向下额外覆盖的篇幅（**物理像素**）。
 * 想再宽/再窄直接改这个数，不用碰布局（它是溢出绘制，不占位）。
 */
private const val BlurOverhangPx = 50f

/**
 * 日志详情：居中标题「日志详情」+ 返回 / 分享，正文为可滚动的纯文本。
 *
 * 版式和记录页一致：顶栏在 **Scaffold 的 topBar 槽**，正文是撑满屏幕的 LazyColumn，
 * 靠 `contentPadding.top` 让位、从栏下穿过。
 *
 * ⚠ **模糊素材必须是「不透明底 + 文字」**（见正文 LazyColumn 上的 `background`）。
 * 这页和其它页最大的不同：别处被采样的内容都是**不透明的卡片**，而这里只有一片文字，
 * 页面的底色是 Scaffold 在**采样层外面**画的。于是采样到的图层除了字全是透明 ——
 * 模糊把黑色文字糊成极低的 alpha，再按 `mix(糊, 白, 0.22)` 混一层几乎透明的白，
 * 落在同样白的背景上就等于什么都没画。这正是"怎么调半径都没用、看起来一点没糊"的原因：
 * 不是没画，是画了一层看不见的东西。
 */
@Composable
fun LogDetailScreen(log: LogFile, content: String, onBack: () -> Unit) {
    val context = LocalContext.current
    val colors = NexioTheme.colorScheme
    val listState = rememberLazyListState()

    // 和记录页同一套：滚动量 + 拖动位移，两路取最大
    val (pullModifier, _) = rememberTopBarPull()
    // 顶栏：折叠 / 材质由库的 CollapsibleTopAppBar 负责
    val topBarState = rememberNexioTopBarState()
    val backdrop = rememberLayerBackdrop()
    // 模糊带向下多盖的篇幅（dp）。栏节点会真的变高这么多，所以下面让位时要减掉它，
    // 正文起点才不会跟着往下跑。
    val blurOverhang = with(LocalDensity.current) { BlurOverhangPx.toDp() }

    fun share() {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, log.name)
            putExtra(Intent.EXTRA_TEXT, content)
        }
        runCatching {
            context.startActivity(Intent.createChooser(intent, "分享日志"))
        }
    }

    Scaffold(
        topBar = {
            NexioTopBar(
                state = topBarState,
                title = "日志详情",
                largeTitle = null,
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
                        onClick = { share() },
                        backdrop = backdrop,
                        icon = NexioIcons.Share,
                        contentDescription = "分享日志",
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
        // 让位用 Scaffold 实测的栏高（第一帧还没量到时退回常数）。
        // 栏高里含着 blurOverhang（模糊带多盖的那段），它不参与排版，减掉它正文才回到原位。
        val measuredTop = innerPadding.calculateTopPadding()
        val contentTopInset =
            (if (measuredTop > 0.dp) measuredTop - blurOverhang
            else pageTopBarHeight(hasLargeTitle = false)) + 8.dp
        val navBottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

        Box(
            modifier = Modifier
                .fillMaxSize()
                // 采样源：整块滚动内容（顶栏从这里取模糊素材）
                .layerBackdrop(backdrop),
        ) {
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .fillMaxSize()
                    // ★ 关键：底色必须画在**采样层里面**。
                    // 不画的话采样到的图层只有字、其余全透明，模糊结果是一层看不见的白雾。
                    // 这里在 LazyColumn 自身铺一层页面底色（颜色和 Scaffold 完全一致，
                    // 视觉上无差别），顶栏就能真正糊出"纸面透过磨砂玻璃"的材质。
                    .background(colors.background)
                    // 顶栏折叠 / 材质（按钮两态）的滚动来源，作为回弹层的父连接
                    .nestedScroll(topBarState.scrollBehavior.nestedScrollConnection)
                    .overScrollVertical()
                    // 内层才能拿到"列表没消费掉"的增量（回弹位移）
                    .then(pullModifier),
                overscrollEffect = null,
                contentPadding = PaddingValues(
                    start = 20.dp,
                    end = 20.dp,
                    top = contentTopInset,
                    bottom = 24.dp + navBottom,
                ),
            ) {
                item(key = "body") {
                    NexioText(
                        text = content,
                        fontSize = 14.sp,
                        lineHeight = 22.sp,
                        color = colors.onSurfaceContainer,
                    )
                }
            }
        }
    }
}
