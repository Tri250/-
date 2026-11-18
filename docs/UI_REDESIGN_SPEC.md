# 电池大师 Android 端 ·「薄荷能量」UI 重构实施方案（v2 · 零商业化）

- 版本：v2.0（可交付评审稿，替代 v1 Web 版）
- 适用范围：`/workspace/android` Android 原生工程（Kotlin 2.0 + Jetpack Compose + Material 3，minSdk 26 / targetSdk 36）
- 设计输入：5 张参考图（电池健康 / 续航分析 / 充电功率 / 社区 / 设置）
- 核心原则：**只借视觉语言，不借假数据，不做商业化**；全部读数来自现有真实数据链（`BatteryViewModel` → `BatteryHardwareReader` / `BatteryReceiver` / `BatteryHealthEngine` / `BatteryHistoryStore` / `DeviceUsageTracker`），单测 141 用例口径不回归。
- 本轮交付以 Android 端为准；Web 端 `src/index.css` 令牌同步列为后续可选批次。

---

## 0. 结论先行

| 决策 | 结论 |
| :--- | :--- |
| 视觉方向 | **薄荷能量（Energy Mint）**：近白薄荷底 + 果绿主色 + 白玻璃卡 + 柔绿投影；深色模式改为「夜航森林绿」（保留 AMOLED 兼容），替换现有赛博 HUD 蓝青体系 |
| 信息架构 | 顶部 `TabRow` 4 Tab → **底部 `NavigationBar` 5 Tab**：总览 / 续航 / 充电 / 健康 / 实验室；顶栏新增设备胶囊 + 「我的」入口（关于 / 更新 / 提示音 / 校准 / 清除记录） |
| 商业化 | **零商业化**：无赞助、打赏、会员、广告、付费功能、云端榜单营销、社交平台引流；应用内更新（GitHub Releases）保留但收进「我的」，退居维护通道 |
| 实现方式 | 改造 `ui/theme/DesignTokens.kt` + `GlassKit.kt`（浅色化），重排 `BatteryScreen.kt` 为 5 Tab，新增 `ui/` 下若干 Screen 文件；**service / viewmodel / receiver 数据层零改动** |
| 诚实性 | 保留并强化 `[实测] / [估算] / [模拟] / [不可测算]` 来源标注、温度 38/45℃ 单源阈值、充满判定 100% + 充电态 + 0~25 mA、功率带符号方向 |

---

## 1. 目标与边界

### 1.1 设计目标

1. **第一眼品质对齐参考图**：浅色通透、圆润白玻璃卡、果绿高光；替换当前深色 HUD 的「工程师玩具」气质为「系统级工具」气质。
2. **信息密度对齐参考图**：首屏 3 秒内回答「剩多少电、健康不健康、在充还是在放」；12 项指标降密度为分组列表。
3. **Android 原生一致性**：Material 3 组件规范、动态字体缩放不裁切（沿用现有处理）、边缘到边缘（edge-to-edge，targetSdk 36 已适配）、深浅色双主题全量覆盖。
4. **零回归**：12 项指标字段、充满判定状态机、实验室模拟覆盖层（`labOverride`）、跨 Tab 遥测历史等既有行为全部保持。

### 1.2 零商业化原则（硬性红线）

参考图中及任何后续迭代中，以下元素**一律不进入产品**：

| 排除项 | 说明 |
| :--- | :--- |
| 赞助 / 打赏 / 爱发电入口 | 参考图第一张左上角「赞助」按钮，不实现 |
| 会员 / VIP / Pro 解锁 | 无任何付费功能分层，全部功能免费 |
| 广告位 / 开屏广告 | 不接入任何广告 SDK |
| 「超越 38.0% 的设备」榜单 | 云端样本排行属营销数据，无数据支撑且不可信；改为本地诚实口径「相对 80% 维护线 +N pt」 |
| 小红书 / 抖音评论区引流 | 参考图「去小红书评论」及 README 中平台引流位，不实现跳转入口 |
| 好评引导弹窗 | 不做应用商店评分诱导 |
| 数据变现 | 现状保持：除更新检查（可开关）外零网络请求，零上传 |

保留的非商业功能：

- **应用内更新**（`AppUpdateCard` / `AppUpdateChecker`，GitHub Releases 直查）：开源项目正常维护通道，非商业化；入口从总览页移至「我的」，首屏不再占据卡片位；`autoUpdateCheckEnabled` 开关保留。
- **关于页开发者署名**：纯文字署名保留，不嵌平台跳转链接。
- **开源与隐私声明**：保留（PRIVACY.md 口径）。

### 1.3 参考图元素 → Android 真实能力映射

| 参考图页面 | 图片中的元素 | Android 端真实数据源 | 新页面落点 |
| :--- | :--- | :--- | :--- |
| 电池健康 · 超级详细 | 健康度 / 容量 / 趋势 / 设备对比 | `BatteryInfo` 12 项指标 + `BatteryHealthEngine` 内阻/置信度 | 总览 + 健康 |
| 续航分析 · 卡顿记录 | 亮屏时长 / 评分 / 应用卡顿 | `DeviceUsageTracker`（真实开机使用时长）+ `BatteryHistoryStore` 会话历史 + 实时电流/温度 | 续航 |
| 充电功率 · 尽在掌控 | 实时功率 / 分段功率柱状图 | `powerWatts`（带符号）+ `telemetryHistory` 120 点真实曲线 | 充电 |
| 加入门派 · 电池江湖 | 社区 / 门派 / 选项列表 | 无此能力 → 不做；场景列表视觉语言用于实验室 4 场景 | 实验室 |
| 功能齐全 · 体验完善 | iCloud 同步 / 设置 / 清理 | 本地无云同步 → 不做；真实设置项：提示音 / 主题 / 更新 / 容量校准 / 清除记录 | 我的 |

「18 个应用卡顿」：Android 端无应用级功耗归因 API（公开通道），**不做**；对应位置放 `SessionHistoryCard`（真实充放电会话：起止时间 / 时长 / 电量区间）。

---

## 2. DesignTokens.kt 2.0（完整落地代码）

替换 `ui/theme/DesignTokens.kt`。对外 API 保持兼容：`statusColor / healthQualityColor / temperatureColor` 签名不变，既有调用点零改动。

```kotlin
package com.battery.master.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Android Battery Master · 设计令牌 2.0「薄荷能量」
 * 浅色为默认主题；深色为「夜航森林绿」。
 * 与 Web 端 src/index.css @theme 对应（后续批次同步）。
 * 全站 UI 只允许引用本对象，禁止 Composable 内散落硬编码色值。
 */
object DesignTokens {

    // ---------------------------------------------------------------
    // 浅色主题 · 薄荷能量（默认）
    // ---------------------------------------------------------------
    val LightCanvas = Color(0xFFF3FAF0)       // 页面底
    val LightCanvasDeep = Color(0xFFE6F5DE)   // 底部深薄荷
    val LightSurface = Color(0xFFFFFFFF)      // 卡片白
    val LightSurfaceMuted = Color(0xFFF7FBF5) // 内嵌槽
    val LightLine = Color(0xFFE4EEE3)         // 分割线
    val LightBorder = Color(0xFFDDEBDA)

    val Ink900 = Color(0xFF0B1A10)            // 标题 / 核心数字
    val Ink700 = Color(0xFF22352A)            // 正文
    val Ink500 = Color(0xFF5A6B60)            // 次级说明
    val Ink300 = Color(0xFF96A69B)            // 弱化 / 脚注

    // 品牌绿
    val Brand700 = Color(0xFF128A39)          // 绿色正文（对比度达标）
    val Brand600 = Color(0xFF1AAE4A)          // 主按钮 / 焦点环
    val Brand500 = Color(0xFF2FCB5B)          // 图形 / 大色块
    val Brand400 = Color(0xFF63E084)          // 渐变高光
    val Brand100 = Color(0xFFDDF8E3)          // 胶囊底
    val Brand50  = Color(0xFFF0FBF2)

    // 语义色（与温度阈值 / 充满判定口径绑定）
    val Warn = Color(0xFFFF9F0A);  val WarnSoft = Color(0xFFFFF4E2)
    val Danger = Color(0xFFFF453A); val DangerSoft = Color(0xFFFFECEA)
    val Info = Color(0xFF0A84FF);  val InfoSoft = Color(0xFFEAF3FF)
    val Violet = Color(0xFF7C5CFF); val VioletSoft = Color(0xFFF1EDFF)  // 实验室模拟态
    val FullTeal = Color(0xFF14B8A6)          // 已充满 / 校准成功

    // ---------------------------------------------------------------
    // 深色主题 · 夜航森林绿（AMOLED 兼容）
    // ---------------------------------------------------------------
    val DarkCanvas = Color(0xFF08120B)
    val DarkSurface = Color(0xFF0F1D13)
    val DarkSurfaceElevated = Color(0xFF16281A)
    val DarkLine = Color(0xFF223A28)
    val DarkInk = Color(0xFFE4F2E6)
    val DarkInkSecondary = Color(0xFF9FB8A6)
    val DarkBrand = Color(0xFF4ADE80)
    val DarkBrandDim = Color(0xFF2FCB5B)

    // ---------------------------------------------------------------
    // 兼容别名（既有 BatteryScreen / HardwareLabScreen 调用点平滑迁移）
    // 迁移完成后可删除
    // ---------------------------------------------------------------
    val BgDeep get() = LightCanvas
    val BgSurface get() = LightSurface
    val BgElevated get() = LightSurfaceMuted
    val BgInset get() = LightSurfaceMuted
    val Border get() = LightBorder
    val BorderStrong get() = LightBorder
    val TextPrimary get() = Ink900
    val TextSecondary get() = Ink500
    val TextTertiary get() = Ink300
    val BrandPrimary get() = Brand600
    val InfoSky get() = Info
    val WarningAmber get() = Warn
    val DangerRose get() = Danger

    // ---------------------------------------------------------------
    // 字号阶梯（7 级；新增 Display/Hero 档）
    // ---------------------------------------------------------------
    val FontMicro = 11.sp
    val Font2xs = 10.sp
    val FontXs = 12.sp
    val FontSm = 14.sp
    val FontBase = 16.sp
    val FontXl = 20.sp
    val Font2xl = 24.sp
    val FontNumXl = 28.sp    // 容量 / 电流 / 温度大读数
    val FontNumHero = 44.sp  // 电量 / 功率 Hero
    val FontHero = 68.sp     // 保留：环形中心百分比

    // ---------------------------------------------------------------
    // 圆角（Android 端 8pt 网格取整）
    // ---------------------------------------------------------------
    val RadiusChip = 10.dp
    val RadiusCard = 18.dp
    val RadiusPanel = 22.dp
    val RadiusHero = 28.dp
    val RadiusPill = 999.dp

    // ---------------------------------------------------------------
    // 动效时长（GlassKit / 转场共用）
    // ---------------------------------------------------------------
    const val DurationMicro = 120
    const val DurationFast = 200
    const val DurationSmooth = 260
    const val DurationSlow = 340
    const val DurationHero = 700

    // ---------------------------------------------------------------
    // 语义状态色快捷映射（签名不变，既有调用点零改动）
    // ---------------------------------------------------------------
    fun statusColor(status: String): Color = when (status) {
        "charging" -> Brand600
        "discharging" -> Info
        "full" -> FullTeal
        else -> Ink500
    }

    fun healthQualityColor(quality: String): Color = when (quality) {
        "good" -> Brand700
        "overheat" -> Warn
        "dead" -> Danger
        "over_voltage" -> Warn
        else -> Ink500
    }

    /** 温度分段色（阈值单源：38℃ 温控 / 45℃ 急停，与 BatteryTelemetryParser 一致） */
    fun temperatureColor(temp: Float): Color = when {
        temp > 45f -> Danger
        temp >= 38f -> Warn
        temp <= 0f -> Info
        else -> Brand600
    }
}
```

### 2.1 Material 3 主题接入

新增 `ui/theme/MintTheme.kt`（MainActivity 现有主题入口替换为它）：

```kotlin
private val LightColors = lightColorScheme(
    primary = DesignTokens.Brand600,
    onPrimary = Color.White,
    primaryContainer = DesignTokens.Brand100,
    onPrimaryContainer = DesignTokens.Brand700,
    secondary = DesignTokens.Info,
    secondaryContainer = DesignTokens.InfoSoft,
    error = DesignTokens.Danger,
    errorContainer = DesignTokens.DangerSoft,
    surface = DesignTokens.LightSurface,
    surfaceVariant = DesignTokens.LightSurfaceMuted,
    background = DesignTokens.LightCanvas,
    onBackground = DesignTokens.Ink900,
    onSurface = DesignTokens.Ink900,
    onSurfaceVariant = DesignTokens.Ink500,
    outline = DesignTokens.LightBorder,
    outlineVariant = DesignTokens.LightLine,
)

private val DarkColors = darkColorScheme(
    primary = DesignTokens.DarkBrand,
    onPrimary = Color(0xFF05230F),
    primaryContainer = Color(0xFF1B4D2B),
    onPrimaryContainer = Color(0xFFB9F6CA),
    surface = DesignTokens.DarkSurface,
    background = DesignTokens.DarkCanvas,
    onBackground = DesignTokens.DarkInk,
    onSurface = DesignTokens.DarkInk,
    onSurfaceVariant = DesignTokens.DarkInkSecondary,
    outline = DesignTokens.DarkLine,
)
```

- 主题切换入口在「我的」页：浅色 / 深色 / 跟随系统（`rememberSaveable` + `isSystemInDarkTheme()` 回退）。
- 不启用 Material You `dynamicColor`（默认关）：品牌一致性优先，避免绿色语义被用户壁纸冲掉。

### 2.2 GlassKit 浅色化

`GlassTokens` 参数按主题切换（结构不动，`glassSurface / pressGlassScale / entranceReveal` 三个 Modifier API 不变）：

| 参数 | 浅色（默认） | 深色（现有值） |
| :--- | :--- | :--- |
| Highlight | `White 0.95` | `White 0.085` |
| HighlightMid | `White 0.80` | `White 0.038` |
| ShadeBase | `Green-black 0.05` | `Black 0.20` |
| EdgeLight | `White 1.0` | `White 0.26` |
| 描边 | `LightBorder` + 顶部 1px 高光切线 | 现状 |

浅色「玻璃」本质 = 白渐变卡 + 柔绿投影 + 顶部高光线；投影改由 `shadowElevation`（`Modifier.shadow(elevation, shape, ambientColor, spotColor)`，ambient/spot 用 `Brand700.copy(alpha=0.18f)`）实现，替代深色阴影。

---

## 3. 信息架构

### 3.1 导航改造

`BatteryScreen.kt` 现为 `Scaffold + 顶部 TabRow(4)`。改为：

```
Scaffold(
  topBar = MintTopAppBar(            // 浅色顶栏
    title = "电池大师",
    trailing = {
      DeviceChip(机型名)             // 点击 → 设计容量校准对话框（现有）
      IconButton(我的)               // → 我的页
    }
  ),
  bottomBar = MintNavigationBar(     // NavigationBar，浅色玻璃
    总览 / 续航 / 充电 / 健康 / 实验室
  )
)
```

| Tab | id | 图标 | 承载内容（全部真实数据） |
| :--- | :--- | :--- | :--- |
| 总览 | overview | `Dashboard`（或 `BatteryStd`） | Hero 环 + 健康结论 + 12 项指标分组列表 + 硬件摘要 |
| 续航 | runtime | `Speed` | 预计可用时长 + `DeviceUsageCard` + 会话历史 + 负载分布 |
| 充电 | charging | `Bolt` | 充电功率大数字 + 功率曲线 + `FullChargeConditionCard` |
| 健康 | health | `Favorite` | 健康档案（现有 `HealthProfileScreen`）+ 容量对比 + 维护建议 |
| 实验室 | lab | `Science` | 现有 `HardwareLabScreen`（场景 / 滑杆 / 枚举 / 提示音） |

- Tab 状态沿用 `rememberSaveable { mutableStateOf(0) }`，配置变更不丢（现有行为保持）。
- Tab 切换转场保留方向感知 slide + fade（现有实现），时长换用 `DurationSmooth`。
- 遥测分析 Tab（现有 TELEMETRY 视图）拆分并入「续航」（曲线 + 会话 + 使用时长）与「充电」（功率 + 数据源标注卡）。

### 3.2 「我的」页（非 Tab，顶栏进入）

新文件 `ui/SettingsScreen.kt`，全浅色列表，分组：

| 分组 | 条目 | 数据源 / 行为 |
| :--- | :--- | :--- |
| 通用 | 主题（浅/深/跟随系统）、语言（跟随系统 / English，跳转系统语言设置）、提示音开关 | 现有 soundPreferences 通道 |
| 采集 | 实时遥测运行状态展示（只读说明，Android 端无暂停开关则不放假开关） | 如实展示 |
| 数据 | 设计容量校准（复用现有对话框）、清除完全充满记录（二次确认）、清除本地历史 | 现有 ViewModel 动作 |
| 应用 | 检查更新（`AppUpdateCard` 内容收编于此，下载进度沿用）、关于（版本 `BuildConfig.VERSION_NAME`、署名、隐私说明、零上传声明、源码仓库） | 现有 `appUpdateState` / `downloadProgress` / `autoUpdateCheckEnabled` |

> 首屏不再出现更新卡片；更新检查默认按现有 `autoUpdateCheckEnabled` 策略执行。

---

## 4. 页面级方案

### 4.1 总览

```
┌ 顶栏：电池大师        [Pixel 8 Pro ▾] [我的] ┐
│ Hero 环（surface-float）                     │
│   状态胶囊「充电中」  78%（44sp/800）          │
│   3,850 / 4,620 mAh                          │
│   [+9.8 W] [33.6 ℃] [92.4% 健康] 三胶囊       │
│   [断开充电]  [一键充满校准]                   │
│ LabSimulationBanner（模拟态时置顶，保留现有）  │
│ 健康结论卡：92.4 · 高于 80% 维护线 +12.4pt     │
│   「查看诊断 >」→ 健康 Tab · 容量来源标签      │
│ 12 项指标 · 分组列表（3 组，MetricRow × 12）   │
│ 硬件摘要卡（HardwareSummaryCard 浅色化，折叠） │
└ 底部导航 ────────────────────────────────────┘
```

- **MetricRow**（替代 `CyberMetricCardItem` 双列网格）：高 64dp，行式布局——36dp 圆角图标块 + 标题/来源标注（两行）+ 右侧读数（`Font2xl`/800，tabular）+ 状态胶囊 + chevron。点击展开口径详情（`AnimatedVisibility`），原文案（hint / 口径说明）收进行内展开区。
- 编号（01–12）保留为灰度 micro 标签，去掉现有编号底板徽章。
- `AboutAppCard` 移出总览 → 「我的」页。
- `AppUpdateCard` 移出总览 → 「我的」页。

### 4.2 续航

```
续航分析            按当前负载估算（诚实标注）
┌ 预计可用 ──────────────────┐
│ 8 小时 28 分钟（28sp）      │
│ 剩余 3,850 mAh · 负载 -420mA│
└────────────────────────────┘
[DeviceUsageCard 浅色化：真实开机使用时长]
[Segmented: 电流 | 电压 | 温度]
[TelemetryChartPanel 浅色化：120 点真实曲线]
[续航评分卡 94 · 优秀 [模型评分]]
  健康 92.4 / 温度 33.6 / 负载 三因子展开说明
[SessionHistoryCard：真实充放电会话列表]
```

- 续航估算公式沿用现有展示层口径（剩余容量 ÷ 当前放电电流，非放电态按典型负载，界面标注口径）。
- 续航评分为**新增本地纯函数**（`ui/derived/RuntimeScore.kt`）：`score = 60×健康分 + 20×温度分段 + 20×负载分段`，明确标注「模型评分」；不冒充系统数据；配套纯 JVM 单测。
- 负载分布取真实遥测滑窗按 |电流| 三档计数，不出现应用名 / 卡顿排行。

### 4.3 充电

```
充电功率                        [+ 充电 | − 放电 胶囊]
┌ 9.8 W（44sp/800，品牌渐变数字）──────────┐
│ 66W 协议协商 · 预计充满 0:42（按当前功率）│
└──────────────────────────────────────────┘
[功率柱状图：telemetryHistory 真实功率序列]
[FullChargeConditionCard 浅色化（现有逻辑零改动）]
  条件 1 电量 100% / 条件 2 充电态 / 条件 3 |I|≤25mA
  锁定容量 · 上次记录 · [一键模拟充满]
数据由本机实时遥测生成 · 本地计算 · 零上传
```

- 大数字只显示绝对值，方向由胶囊表达（`+` 绿 / `−` 蓝）；禁止 `abs()` 吞方向（现有口径保持）。
- 柱状图用真实功率序列（复用 `TelemetryChartPanel` 的 Canvas 绘制改柱状），不伪造「10% 档位功率表」。

### 4.4 健康

现有 `HealthProfileScreen` 浅色化 + 重排：

```
健康 Hero：92.4% 环形 + 评级 + [实测/估算] 来源标签
容量对比卡：当前 4,620 / 设计 5,000 mAh · 损耗 380 mAh（双色横条）
寿命卡：循环 N 次 + 内阻 [运行时测算·高置信 n=48]（BatteryHealthEngine 现有置信度口径）
HealthAdviceCard（现有三条建议，浅色化）
校准规范说明（现有文案保留）
```

- 不可测算时显示 `—` + 「无法测算」，不显示 0%（v2.0.0-alpha.1 口径保持）。
- 不输出「还可循环 N 次」伪精确预测（诚实前提不满足则不展示，沿用引擎口径）。

### 4.5 实验室

`HardwareLabScreen` 结构保留（4 场景 / 滑杆 / 枚举 / 提示音 / 恢复真实遥测），视觉重排：

- 场景卡：白卡 + 图标 + 标题 + 参数行；选中态浅绿底 + 2dp `Brand600` 描边 + 对勾（参考图「选择加入门派」的选择态语言）。
- 模拟激活时：页面顶部 `LabSimulationBanner`（现有，紫色化 `VioletSoft` 底）跨 Tab 常驻（现有行为）。
- 所有模拟读数带 `[模拟]` 标签（现有 labOverride 机制）。

### 4.6 装饰策略（Android 差异）

- **无 3D 贴纸背景层**：手机端首屏 overdraw 敏感，参考图的贴纸阵仅转化为：空状态插画（健康 `—` 态 / 历史为空态）、关于页头部一枚电池插画（vector 绘制，不走位图资源）。
- 启动页 / 图标不改动（`ic_launcher` 保持现状，可另立批次升级为绿色电池风格 adaptive icon）。

---

## 5. 组件清单与现有代码映射

| 新组件 / 改造 | 现有代码 | 改造内容 |
| :--- | :--- | :--- |
| `MintHeroBatteryCard` | `CyberHeroBatteryCard` | 渐变弧浅色化、中心 44sp 读数、三数据胶囊；判定/动画逻辑保留 |
| `MetricRow` | `CyberMetricCardItem` | 网格双列 → 分组单列行式；口径说明进展开区 |
| `StatTile` | （新增） | 88dp 高小块：Hero 下三胶囊 / 续航评分因子 |
| `MintTopAppBar` | 顶栏 Row | 浅色、设备胶囊、我的入口 |
| `MintNavigationBar` | （新增） | `NavigationBar` + 浅色玻璃 surface |
| `Chip` | 散落胶囊写法 | 统一 6 变体：good/warn/danger/info/neutral/[模拟] |
| `SourceTag` | 散落来源标注 | 统一：实测/估算/工程估算/运行时测算/模拟/不可测算 |
| `SettingsScreen` | `AboutAppCard` + `AppUpdateCard` + 散落开关 | 收编为分组列表 |
| `RuntimeScore.kt` | （新增纯函数） | 续航模型评分 + 单测 |
| `GlassKit.kt` | 保留三 Modifier | `GlassTokens` 双主题参数化 |
| `MintTheme.kt` | MainActivity 主题 | light/dark ColorScheme + 主题状态 |

**禁止改动**：`service/*`（解析/采集/引擎）、`viewmodel/*` 状态机、`receiver/*`、`data/BatteryState.kt` 口径字段、`BatteryTelemetryParser` 阈值常量。UI 只消费，不重算。

---

## 6. 动效（复用 GlassKit，无新增依赖）

| 场景 | 实现 |
| :--- | :--- |
| 卡片错峰入场 | 现有 `entranceReveal(index)` 原样保留（55ms 阶梯） |
| 按压手感 | 现有 `pressGlassScale` 原样保留 |
| Tab 转场 | 现有方向感知 slide+fade，时长换 `DurationSmooth` |
| 环形进度 | 现有 `animateIntAsState` / 弧动画保留，`DurationHero` |
| 柱状图生长 | Canvas 高度按 60ms 阶梯动画 |
| 模拟态呼吸 | `LabSimulationBanner` 低幅度 `infiniteRepeatable`（现有模式） |
| 系统动画关闭 | 沿用 `ANIMATOR_DURATION_SCALE == 0` 直现逻辑（现有实现已覆盖） |

---

## 7. 数据诚实性红线（逐项验收）

| 项 | 要求 |
| :--- | :--- |
| 来源标注 | 12 项指标每项可见 `[实测]/[估算]/[工程估算]/[运行时测算]/[模拟]/[不可测算]` 之一 |
| 温度 | 38/45℃ 单源 `BatteryTelemetryParser.TEMP_*`，UI 不再本地定义 |
| 充满判定 | `100% + 充电态 + |I|≤25 mA` 三态逐条展示，拔线不锁定 |
| 功率 | 带符号：充电 `+W` 绿 / 放电 `−W` 蓝；Hero 大数字绝对值 + 方向胶囊 |
| 健康度 | 容量不可测算 → `— 无法测算`，绝不显示 0% |
| 模拟态 | `LabSimulationBanner` 跨 Tab 常驻 + 读数带 `[模拟]` |
| 续航/评分 | 明确「按当前负载估算」「模型评分」 |
| 零商业化 | 无赞助/会员/广告/榜单/引流；更新入口在「我的」；除更新检查外零网络 |
| 排名类 | 只允许「相对 80% 维护线 ±N pt」（本地计算） |

---

## 8. strings.xml 新增 key（中英双语）

```xml
<!-- 新页面 -->
<string name="tab_runtime">续航</string>
<string name="tab_charging">充电</string>
<string name="nav_more">我的</string>
<string name="runtime_title">续航分析</string>
<string name="runtime_estimate_note">按当前负载估算</string>
<string name="runtime_score_label">续航评分（模型评分，非系统数据）</string>
<string name="charging_title">充电功率</string>
<string name="charging_power_negotiated">%1$s 协议协商</string>
<string name="settings_title">我的</string>
<string name="settings_theme">主题</string>
<string name="settings_sound">提示音</string>
<string name="settings_clear_full_charge">清除完全充满记录</string>
<string name="settings_update">检查更新</string>
<string name="settings_about_privacy">数据仅本机计算，不上传（更新检查除外，可关闭）</string>
<!-- 诚实性 -->
<string name="source_measured">实测</string>
<string name="source_estimated">估算</string>
<string name="source_simulated">模拟</string>
<string name="source_unavailable">无法测算</string>
<string name="health_vs_maintenance_line">相对 80%% 维护线 %1$s</string>
```

（`values-en` 同步补齐；既有 key 不改语义。）

---

## 9. 无障碍与性能

- **字体缩放**：`FontNumHero = 44sp` 用 `maxFontScale` 钳制或 `heightIn(min)` 保证 200% 缩放不裁切（沿用 Tab 文本现有处理模式推广到 Hero 读数）。
- **TalkBack**：MetricRow `contentDescription` = 「标题 当前值 单位 状态」；胶囊不只靠颜色（全部带文字/图标）；状态变更 `LiveRegion.Polite`。
- **触达**：底部导航、按钮 ≥ 48dp；行式列表整行可点。
- **对比度**：绿色正文一律 `Brand700`（浅色）/ `DarkBrand`（深色）；`Brand500` 仅图形。
- **性能**：`LazyColumn` 分组列表替代 12 卡网格（减少组合数）；Canvas 图表沿用现有 drawSeries 模式；不引入 Coil/图表库等新依赖；深浅色切换用 `CompositionLocal` 主题，不重建 Activity。
- **edge-to-edge**：底部导航加 `WindowInsets.navigationBars` padding（targetSdk 36 已适配，保持）。

---

## 10. 文件级改造清单

| 文件 | 动作 |
| :--- | :--- |
| `ui/theme/DesignTokens.kt` | 重写为 2.0（§2），保留兼容别名 |
| `ui/theme/GlassKit.kt` | `GlassTokens` 双主题化，三 Modifier API 不变 |
| `ui/theme/MintTheme.kt` | 新增：ColorScheme + 主题状态 |
| `ui/BatteryScreen.kt` | 顶部 TabRow → 底部 5 Tab；顶栏改造；指标网格 → 分组列表；`AboutAppCard` / `AppUpdateCard` 迁出；Hero/满充卡浅色化 |
| `ui/HardwareLabScreen.kt` | 场景卡选择态重排、滑杆浅色化；逻辑零改动 |
| `ui/DeviceUsageCard.kt` | 浅色化，迁入续航页 |
| `ui/AppUpdateCard.kt` | 浅色化，迁入我的页 |
| `ui/SettingsScreen.kt` | 新增 |
| `ui/components/MintNav.kt` `MintChips.kt` `MetricRow.kt` | 新增原语 |
| `ui/derived/RuntimeScore.kt` | 新增纯函数 + 单测 |
| `MainActivity.kt` | 挂 `MintTheme`；edge-to-edge 核对 |
| `res/values/strings.xml` + `values-en` | §8 新 key |
| `res/values/colors.xml` / `themes.xml` | 状态栏/导航栏浅色对齐 |

**不改动**：`service/*`、`viewmodel/*`、`receiver/*`、`data/*`、CI 工作流（`build-apk.yml` 不动，产物照常）。

---

## 11. 实施顺序

| 阶段 | 内容 | 完成标志 |
| :--- | :--- | :--- |
| S0 | 本方案冻结 | 评审通过 |
| S1 | 令牌 + 主题 + GlassKit 浅色化 | 全应用浅色可跑，深色切换正常，旧别名兼容零编译错 |
| S2 | 导航改造（底部 5 Tab + 顶栏 + 我的骨架） | 5 Tab 切换 / 状态保持 / 我的可进 |
| S3 | 总览页（Hero / 结论 / MetricRow / 硬件卡） | 12 项指标齐全，口径标注完整 |
| S4 | 健康 + 充电页 | 满充三态、功率方向、容量对比正确 |
| S5 | 续航 + 实验室 + 设置收编 | 曲线/会话/使用时长/评分真实；更新入口入「我的」 |
| S6 | QA + 双语文案 + 无障碍 + 构建 | §12 全通过，CI APK 绿 |

---

## 12. 验收清单

**视觉**
- [ ] 360 / 411 / 768dp 宽度无溢出；深浅色全 Tab 走查。
- [ ] 白玻璃卡：白渐变 + 1dp 高光线 + 柔绿投影；无深色 HUD 残留（grep `0xFF030712` 等旧色为零）。
- [ ] Hero 数字 tabular，刷新不抖动。

**功能（零回归）**
- [ ] 12 项指标与 ViewModel 数值一致；充满判定三态与拔线不锁定回归用例通过。
- [ ] 实验室 4 场景 / 滑杆 / 枚举 / 恢复真实遥测 / `labOverride` 跨 Tab 横幅正常。
- [ ] 设计容量校准、清除充满记录、会话历史、使用时长累计正常。
- [ ] 141 既有单测全绿 + 新增 `RuntimeScore` 单测。

**零商业化审查**
- [ ] 全仓 grep：`赞助/sponsor/donate/广告/ad-/vip/member/premium` 零命中。
- [ ] 总览页无更新卡、无榜单卡、无引流入口；更新仅在「我的」。

**工程质量**
- [ ] `./gradlew :app:assembleDebug` + `testDebugUnitTest` 本地通过；CI 产物照常（aapt2 badging / versionCode 递增 / 签名校验）。
- [ ] 字体 200% 缩放无裁切；TalkBack 走查核心流程；`ANIMATOR_DURATION_SCALE=0` 直现。

---

## 13. 风险与规避

| 风险 | 规避 |
| :--- | :--- |
| 旧深色色值残留（DesignTokens 别名兜底掩盖） | S1 起每文件 grep `BgDeep/TextPrimary/0xFF03/0xFF0F172A` 逐一替换，别名仅作过渡 |
| 底部导航挤压内容区（原 4 Tab 页面加长） | 全部页迁移 `LazyColumn`；Tab 内容按 §4 拆分不堆叠 |
| 浅色下玻璃对比不足 | GlassTokens 浅色参数 + `shadowElevation` 绿投影双保险 |
| 续航评分被误读为系统数据 | 命名与文案强制「模型评分」，来源标签不可省略 |
| 单测/CI 回归 | 数据层零改动 + 阶段性 `testDebugUnitTest` 门禁 |

---

## 14. 交付物

1. 本方案（Android 端 v2）。
2. 重构后 APK（GitHub Actions 产物，versionName 递增）。
3. `CHANGELOG.md` 新增「v2.2.0 UI：薄荷能量重构 + 零商业化治理」条目。
4. 三档宽度 × 深浅色 × 5 Tab 走查截图。
5. （后续可选批次）Web 端 `src/index.css` 令牌同步，恢复双端对应关系。

---

> 评审通过后从 S1 开始：S1 完成即整体呈现参考图同款「薄荷能量」气质；S2 起逐页替换，每阶段独立可构建、可回归。
