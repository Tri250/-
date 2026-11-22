# 实施方案：v2.1.0-beta.2 — 使用时长卡置顶 / 应用内热更新 / iOS 玻璃质感视觉升级

## Context

用户对 v2.1.0-beta.1 提出三项迭代：①设备使用时长卡移到总览最顶部显眼位置；②应用内热更新（已确认方案 A：GitHub Releases 检查 + 系统下载器下载安装，新增 INTERNET 普通权限）；③UI/UX 动画 + iOS 玻璃质感组件卡片品质升级至品牌视觉最高水平。完成后直接走发布闭环（beta.2 / versionCode 23）。

已探明现状：`DesignTokens` 已有 `BgGlass` 半透明令牌与动效时长令牌（L148-155）；`CyberHeroBatteryCard` 已有 drawBehind 垂直渐变玻璃 + 呼吸光晕（可复用模式）；`DeviceUsageCard` 目前为实色普通卡、位于总览第 5 位；Tab 切换用 `Crossfade`；版本单源 BuildConfig。

## 1. DeviceUsageCard 置顶 + 玻璃化

- `ui/BatteryScreen.kt` 总览 LazyColumn：`DeviceUsageCard` item 从第 5 位（L438-446）移至第 0 位（`CyberHeroBatteryCard` 之前），注释序号顺延
- `ui/DeviceUsageCard.kt` 视觉重写：复用 Hero 卡的 drawBehind 渐变玻璃模式 + `BgGlass` 令牌 + 入场动画（§3），**所有文案与字符串 key 不变**（不破坏 UI 语义断言测试）

## 2. 应用内热更新（方案 A）

新增：
- `data/AppUpdateInfo.kt`：currentVersion / latestVersion / apkUrl / releaseNotes / isPrerelease / isNewer
- `service/AppUpdateChecker.kt`：注入 `fetcher: (String) -> String`（仿 DeviceUsageTracker 的 tickerClock internal var 注入模式）；默认实现 HttpURLConnection + Dispatchers.IO；GET `https://api.github.com/repos/Tri250/-/releases/latest`；org.json 解析 `tag_name` / `assets[].browser_download_url`（*.apk）/ `body` / `prerelease`；纯函数 `compareVersions(current, latest)`（语义化比较 + pre-release 排序：同版本号 beta < GA）；结果落盘 prefs（`update_last_*` 蛇形键）
- `ui/AppUpdateCard.kt`：当前版本 / 最新版本 / 发布说明摘要 / 状态行（Idle/Checking/UpToDate/Available/Error）+「检查更新」+「下载安装包」（DownloadManager enqueue，mime `application/vnd.android.package-archive`）+ Android 8+ 未知来源授权引导（ACTION_MANAGE_UNKNOWN_APP_SOURCES）+ 打开系统下载管理入口；置于 AboutAppCard 之前

修改：
- `AndroidManifest.xml`：新增 `<uses-permission android:name="android.permission.INTERNET"/>`（普通权限，自动授予）
- `viewmodel/BatteryViewModel.kt`：`checkForAppUpdate()` + `StateFlow<AppUpdateState>`；网络异常全兜底回 Error 态不崩溃
- `strings.xml` zh/en：`update_*` 全套键（两语言同步）
- `build.gradle.kts`：versionCode 23 / versionName 2.1.0-beta.2
- `.github/workflows/build-apk.yml` 发布说明「权限说明」段：0 权限 → 1 个 INTERNET 普通权限 + 热更新说明

测试：`AppUpdateCheckerTest.kt`（fetcher 注入 fake JSON fixture；compareVersions 边界：beta.1 < beta.2、beta.2 < 2.2.0、同号 beta < GA；畸形 JSON 不崩溃）

## 3. iOS 玻璃质感 + 动画升级

新增 `ui/theme/GlassKit.kt`：
- `Modifier.glassSurface()`：白 6%→3% 垂直渐变 + 顶部高光描边 + `BorderStrong` 半透明边框；API 31+ 用 RenderEffect 对背景层做真磨砂 blur，<31 半透明回退
- `Modifier.pressGlass()`：interactionSource + animateFloatAsState 按压缩放 0.98 + 亮度反馈

应用面（统一换 glassSurface）：DeviceUsageCard、HardwareSummaryCard、FullChargeConditionCard、CyberMetricCardItem、AboutAppCard、AppUpdateCard

动画：
- 总览卡入场：按索引错峰 fade + slide-up（LaunchedEffect + animateFloatAsState）；`Settings.Global.ANIMATOR_DURATION_SCALE == 0` 时自动禁用（无障碍）
- Tab 切换：`Crossfade` → `AnimatedContent` slide + fade
- 卡片内容高度变化 `animateContentSize`
- Hero 卡已有呼吸光晕，不动；不改文案 key

## 4. 发布闭环

CHANGELOG 归档 `[2.1.0-beta.2] - 2026-11-18` → 提交推送 main（gh 凭据）→ tag `v2.1.0-beta.2` → CI 三重门禁（单测/构建+体积+tag校验/仪器化）→ 监控至 Release 发布 → `gh release view` 验证资产（APK / web-demo / SHA256SUMS）与权限说明段更新

## 验证

1. 沙箱 kotlinc 桩化真实编译新增 Kotlin 文件 + AppUpdateCheckerTest 断言执行（在 268 断言基线上追加）
2. strings zh/en 键数与 key 集一致性检查
3. CI 兜底：testDebugUnitTest / instrumented / release 三门禁全绿
4. 发布后核对 Release 资产与说明（权限段含 INTERNET）
