# 更新日志 (Changelog)

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 风格，版本号遵循语义化版本。

## [Unreleased]

### Added 新增：电压-寿命应力磨损模型（Choi 2002 方法学全量实施，行业独有）
- **`VoltageStressWearModel`**（纯函数模型）：相对磨损速率 `rate(V)=2^(10·(V−4.2))`——由 Choi 2002 Fig.1 / Asakura 2003 交叉验证的「3.92V 以上每 +0.1V 循环寿命减半」规律直接反演；3.95V 以下速率钳制（AccuBattery 公开方法学：SEI 钝化机制效应未量化，不虚构速率曲线）；电压超有效读数域（3.0–4.6V）返回 null 诚实不输出；换算基准 **1 磨损循环 ≡ 4.2V 恒压暴露 2.5h**（Choi 2002 实验条件：1C 充电 + CV 浮充 2.5h + 1C 放电，CV 段为主要伤害源 Fig.2）
- **`BatteryWearTracker`**（时间离散积分器，与 AccuBattery 会话终点法的实施差异）：利用连续实测电压遥测对充电/满充保持期做 `rate×dt` 积分——高压暴露的时长与电压幅值同时参与累积，CV 保持段伤害可连续追踪；仅充电族（CHARGING/FULL）且电压双通道实测帧参与；同拍双源去重（dt≤0）、断流防御（dt>120s 宁少计不虚计）、不可测帧断链防跨断档折算；独立 prefs 持久化（30s 节流 + flush 强制，Double raw bits 存取），类型污染归零不闪退
- **充电管理页新增「电压应力磨损模型 (Choi 2002)」卡**：当前电压相对磨损速率（4.2V=×1.00 基准）+ 累计等效磨损循环 + >3.92V 高压暴露时长 + 积分样本间隔数；四条方法学说明文案全部溯源（Choi 2002 · Asakura 2003 · AccuBattery 公开方法学 · CV 段伤害源与限充建议）；全部输出标注 [模型预测]，电压不可测显示「— 双通道不可读」、无积分数据显示「暂无充电积分数据」——不虚构数值
- 中英双语文案（values / values-en）；ViewModel 发布源头喂样（与历史入档同语义：模拟冻结不影响积分，真实硬件行为如实累积）+ onCleared 退出落盘
- 新增 19 审计断言用例（模型数学 9：基准/翻倍定律/单调性/钳制/有效域/换算/线性/退化输入/文案格式；积分器 10：充电积分/高压累计/放电断链/FULL 计入/同拍去重/断流丢弃/不可测排除/超域排除/跨实例持久化恢复/prefs 污染兜底），249 全绿（230 基线零回退）

## [2.2.1] - 2026-11-19

「三维度全量自检 + 五维度发布审计」版本：数据库 / 机型数据 / 脚本引擎三维度 100% 覆盖审计修复，稳定性 / 性能 / 兼容性 / 权限管理 / 安装卸载五维度发布前全面自检通过。详细条目见上文 [2.2.0] 段「三维度全量自检（数据库 / 机型数据 / 脚本引擎）」与「三维度第二轮全量精读」部分（实际随本版本首次发布）。

### Fixed 修复
- **P1 `BatteryHistoryStore` JSONL 轮转非原子**：`writeText` 截断重写改为 tmp+rename 原子替换（POSIX `rename(2)` 同目录原子覆盖）——轮转瞬间进程被杀不再丢失最多 3000 行样本/500 行会话历史
- **P1 `BatteryHistoryStore` 崩溃遗留半行粘连丢样本**：写入前尾行自愈（RandomAccessFile peek 文件尾，非 `\n` 先补换行）——进程被杀留下的无换行半行不再把新样本/新会话粘连吞掉（样本与会话双文件同款治理）
- **P2 `BatteryCapacityRegressor` 启动闪退缺口**：prefs 获取 / 统计量恢复 / persist 全链路异常兜底——类型污染按空统计量重新积累，与全项目启动闪退治理口径对齐
- **P1 遥测曲线固定窗口削顶**：`telemetrySeriesBounds` 动态窗口（详见 [2.2.0] 段）

### Added 新增（审计断言测试，230 用例全绿）
- 轮转 tmp 无残留 + 崩溃遗留 tmp 不污染恢复/再轮转、进程被杀半行截断静默跳过且不阻塞后续写入、prefs 类型污染构造不闪退且采集链路正常、崩溃日志前缀过滤/时间升序/空导出 null、会话文件尾行自愈对称治理、遥测动态窗口 6 用例

### 自检结论（发布门禁依据）
- **稳定性**：全链路 Throwable 兜底（Application 崩溃捕获 / Receiver / JSONL / prefs）、R8 精准 keep + DEX 反射构造器冒烟 CI 门禁
- **性能**：1Hz 单数据源、双通道共享 Reader、协议探测 10s TTL、轮转原子化无主线程 IO
- **兼容性**：minSdk 26 / targetSdk 36、`RECEIVER_NOT_EXPORTED` 动态注册、API 31+/34+ 分级适配
- **权限管理**：唯一 `INTERNET` 普通权限（0 运行时权限）、FileProvider exported=false + 白名单最小暴露
- **安装卸载**：备份/换机全数据排除、versionCode 单调递增（26）、aapt2 badging + tag↔versionName 一致性 CI 校验

## [2.2.0] - 2026-11-18

「薄荷能量」UI 2.0 正式版：Android 端全面重构为浅色薄荷绿设计语言，双主题（浅色/深色「夜航森林绿」），5 Tab 信息架构，零商业化。

### Added 新增
- **设计令牌 2.0「薄荷能量」**：`MintColors` 语义色板（38+ 字段）+ `LightMintColors`/`DarkMintColors` 双主题 + `LocalMintColors` CompositionLocal；`DesignTokens` 颜色门面全部改为 `@Composable get()` 代理——3400+ 行存量 UI 零改动即获双主题能力
- **MintTheme 主题系统**：浅色（默认）/深色/跟随系统三态，SharedPreferences 持久化，状态栏图标明暗随主题联动（`WindowCompat.getInsetsController`）；不启用 Material You 动态取色（保持品牌一致性）
- **GlassKit 玻璃拟态主题感知**：`GlassTokens` 高光/阴影按主题分支（浅色白高光+柔绿投影，深色暗面弱高光），`glassSurface()` 空默认边框内部解析主题色
- **MintIcons 自绘矢量图标**：24dp 网格 `ImageVector.Builder` 自绘 23 枚图标（仪表盘/计时/闪电/心形/烧瓶/人像等），不引入 material-icons-extended（APK 体积零增）
- **5 Tab 信息架构**：状态总览 / 续航分析 / 充电管理 / 健康档案 / 硬件实验室 + 顶栏「我的」入口；Tab 切换保留方向感知 slide+fade 动画
- **续航分析页（新）**：预计可用时长卡（瞬时电流线性外推 + 库仑计/估算双口径标注）+ 设备使用时长卡 + 高频硬件遥测分析（三通道曲线 + 采集链路透视 + 会话统计）；`RuntimeScore` 纯函数（不可读不虚构、浮充死区不外推）+ 7 项单测
- **充电管理页（新）**：功率大数字（带符号 +W/−W）+ 距满差额 + 充电状态三态徽章
- **「我的」页（新）**：主题切换 / 提示音开关 / 设计容量校准 / 清除记录 / 应用更新（自动检查开关）/ 关于 APP（版本徽章 + 隐私声明 + **开源许可** + 崩溃日志导出）
- **隐私信任行**：总览页常驻"权限声明：零权限安装即用 · 电池数据全部本地处理，不上传"

### Changed 调整
- **总览页重构**：薄荷 Hero 电池卡（状态标签 + 剩余电量 + 功率读数条）+ 健康结论卡（分级结论先行，不与指标 01 双读数）+ 12 项指标分组行（电量与容量 / 状态与环境）+ 充满判定卡 + 硬件信息汇总栏
- **遥测分析收编续航页**：`TelemetryAnalysisScreen` 由独立滚动容器改为嵌入续航页 LazyColumn 的单个 item（修复嵌套同向滚动无限高度约束崩溃）
- **版本徽章**：v2.2.0 (25)；`AppUpdateCheckerTest` 新版本 fixture 升至 v2.2.1 适配版本 bump

### Removed 移除（零商业化红线）
- 移除「抖音 / 小红书 平台」行（about_platforms，中英双语资源同步删除）——无赞助/会员/广告/榜单/社交引流

### Fixed 修复
- **六功能模块操作链路审计（100% 覆盖）**：
  - P0「我的」页无返回路径——顶栏「我的」↔「返回」双态切换 + 底栏点击任意 Tab 同步退出设置态 + 底栏选中态在设置页不再误亮（旧实现 `onBack` 死参数、`showSettings` 恒 true，进入设置页后无任何返回途径）
  - P1 充电管理页满充卡倒计时断链——`simulationRemainingSec` 从 VM 单源收集（旧实现硬编码 0L：一键模拟完全充满后 15s 保持期倒计时不显示、按钮可重复触发）
  - P2 续航分析页 CSV 导出失败/无数据静默——补 Toast 可见反馈（VM 注释承诺的"暂无数据"提示此前未兑现）
  - P2「我的」页清空遥测确认对话框 body 误用标题文案——改用与遥测页同源的完整描述 `clear_history_dialog_body`（说明删除范围与不可撤销）
  - 新增 `ModuleChainAuditTest` 6 用例：设置页返回双路径、充电页倒计时接线禁用态、导出按钮数据门控、健康页满充双入口、实验室跨页警示横幅闭环
- **六模块功能真实性审计（100% 覆盖，data/service/viewmodel/derived 全层精读 + UI 交叉核对）**：
  - P1 遥测分析三通道曲线固定归一化窗口削顶失真——电压 3000~5000 mV / 电流 ±6000 mA / 温度 0~60°C 窗口外的真实读数被 coerceIn 贴边（双电芯整包 8800 mV、120W 快充 ±8000 mA、实验室滑杆 12000 mV、高温 >60°C），曲线与实际读数不一致；改为真实样本动态推导窗口（`telemetrySeriesBounds` 纯函数：min/max ±8% 余量，空历史/平坦序列回落典型窗口不贴边），Canvas 归一化曲线恢复与真实读数一致
  - 新增 `TelemetryChartWindowTest` 6 用例锁定窗口契约（双电芯/快充/高温/典型区间/空历史/平坦序列）
  - 审计结论：其余全部功能判定真实实现——sysfs 多节点电量计探测链、库仑计积分回归 + 单点估算、内阻 ΔV/ΔI 滑窗回归、JSONL 遥测持久化 + 会话状态机、BOOT_COUNT 真实开机计量、本地崩溃捕获导出、GitHub Releases 热更新、诚实来源标注体系（[实测]/[工程估算]/[模拟]）均无空壳/伪实现
- **三维度全量自检（数据库 / 机型数据 / 脚本引擎，100% 功能模块覆盖）**：
  - P1 `BatteryHistoryStore` JSONL 轮转非原子——旧 `writeText` 直接截断重写目标文件，轮转瞬间进程被杀会留下半截文件，最多 3000 行样本/500 行会话历史永久丢失且无 decode 兜底可救（追加写入的半行损坏有 decode 兜底，但轮转截断无兜底）；改为 tmp+rename 原子替换（POSIX `rename(2)` 同目录原子覆盖），rename 成功前旧文件始终完好，失败/被杀只损失 tmp
  - P1 `BatteryHistoryStore` 崩溃遗留半行粘连丢样本——进程被杀留下的半行 JSON **无换行结尾**，恢复后直接追加会把新样本粘连到损坏行上（decode 整行失败 = 新样本永久丢失）；写入前尾行自愈（RandomAccessFile peek 文件尾，非 `\n` 先补换行），损坏半行成为独立行由 decode 静默跳过，新样本无损（样本与会话写入同款治理）
  - P2 `BatteryCapacityRegressor` 构造期 prefs 恢复无异常兜底——类型污染 (`ClassCastException`) 等恢复异常会启动闪退，与 `DeviceUsageTracker`/`AppUpdateChecker`/`BatteryHardwareReader` 启动闪退治理口径不一致；prefs 获取、统计量恢复、`persist()` 全链路兜底，污染统计量按空重新积累
  - 机型数据维度审计结论：无缺陷——`DeviceHardwareProfile` PMIC/快充/电芯/化学三级回退链（DT 实测→品牌档案→工程估算）来源标注齐全，`SoCHardwareProfile` 五字段检测链与营销名别名顺序正确（8 Elite Gen 5 先于 8 Elite 匹配），`BatterySysfs` 16 品牌电量计预设 + 特征评分链兜底闭环，`BatteryCapacityRegressor` 库仑计先验无硬编码冒充实测
  - 脚本引擎维度判定：**N/A 不存在**——全仓 grep 验证无 WebView/JS/Lua/ScriptEngine/Room/SQLite（`evaluateFullCharge` 含 "lua" 子串、"room temperature" 室温均为误报），最接近的"引擎"类组件为 LabScenario 场景模拟引擎（纯函数驱动，无脚本解释器）
  - 新增 3 审计断言用例：轮转 tmp 无残留 + 崩溃遗留 tmp 不污染恢复/再轮转、进程被杀半行截断静默跳过且不阻塞后续写入、prefs 类型污染构造不闪退且采集链路正常
- **三维度第二轮全量精读（补全首轮未覆盖文件，100% 覆盖收口）**：精读 CrashLogHandler、BatteryHardwareReader 全文、BatteryHealthEngine、HardwareInfoResolver、BatteryTelemetryParser、BatteryViewModel 场景覆盖层与存储接线——均无新缺陷：
  - 数据库维度存储域全部收口：JSONL 遥测（首轮已修）+ 4 个 SharedPreferences 域（battery_master_prefs/battery_capacity_regression/app_update_prefs/mint_theme_prefs）+ 本地崩溃日志落盘（滑窗 CRASH_KEEP_MAX=10、前缀过滤、全链路 Throwable 兜底、空导出诚实返回 null）
  - 机型数据维度：Reader 设计容量四级回退链（用户校准区间校验→PowerProfile 反射→sysfs 双单位归一→5000mAh 兜底）、Parser 全部区间常量单源（容量/温度/电压/电流/循环）、HealthEngine 双通道同拍去重与越界清窗、Resolver 三级回退——全部审计通过
  - 脚本引擎维度二次确认：LabScenario 为纯 enum 数据覆盖层（base.copy 数据注入，滑杆区间与 Parser 常量同源），无任何脚本解释器/动态求值组件
  - 新增 3 审计断言用例：崩溃日志前缀过滤+时间升序+空导出 null（2 条）、会话文件尾行自愈对称治理（半行遗留后新会话不被粘连吞掉）
- 测试 JVM 代理透传：Robolectric 首次运行需从 Maven 中央仓库拉取 android-all 依赖，分叉测试 JVM 不继承守护进程代理——`build.gradle.kts` 按环境变量显式下发 `http(s).proxyHost/Port`
- 指标 01 健康度值改为单一 Text（"92.3%"），恢复审计断言兼容

### Changed 基础设施
- 沙箱构建环境：JDK 17 (mise) + Android SDK (cmdline-tools/platform 36/build-tools 36.0.0)；Robolectric android-all-instrumented 14-robolectric-10818077-i7 手动装配 ~/.m2 缓存

## [2.1.0-beta.3] - 2026-11-18

### Changed 调整
- 设备使用时长卡调整至总览第 5 张卡（充满判定卡之后、指标网格之前）

### Enhanced 热更新增强
- 冷启动自动检查更新：24 小时节流 + 应用内开关（默认开，可关闭）；自动路径仅命中新版本时提示，失败静默不打扰启动
- 下载实时进度：入队后 1s 节拍轮询 DownloadManager，卡内进度条 + 百分比展示；成功转"下载完成"态并给安装引导，失败回错误态
- AppUpdateChecker 新增 autoCheckDue/markAutoCheckDone/开关 API（nowMs/intervalMs 可注入测试）；AppUpdateCheckerTest 新增 3 用例，沙箱真实编译执行 22/22 断言全绿

## [Unreleased]

## [2.1.0-beta.2] - 2026-11-17

### Added 新增
- **设备使用时长卡置顶**：从总览第 5 位移至第 0 位（环形仪表盘上方），真实开机天数/小时在最显眼位置呈现。
- **应用内热更新**（新增唯一 `INTERNET` 普通权限）：
  - 「应用更新」卡直查 GitHub Releases 最新版本（`/releases/latest`），语义化版本比对（beta 升位 / beta < GA / v 前缀兼容）；
  - 发现新版本一键经系统 DownloadManager 下载 APK 至公共 Downloads，通知栏点击进入安装（Android 8+ 首次授权"未知来源"，卡内提供直达设置入口）；
  - 状态机 Idle/Checking/UpToDate/Available/Error/DownloadQueued，网络异常全兜底不崩溃；仅读版本元数据与 APK 地址，不采集任何数据；
  - 检查快照落盘 `update_last_*` 键；`AppUpdateCheckerTest` 覆盖版本比较边界、fixture 解析、畸形 JSON 兜底、fetcher 注入与快照落盘。
- **iOS 液态玻璃视觉升级（GlassKit）**：
  - `glassSurface()` 玻璃切面卡底（白高光层→深阴影层垂直渐变 + 顶部反光切线 + 半透明描边），统一应用于使用时长/硬件汇总/充满判定/12 项指标卡/关于/更新共 6 类卡面；
  - `pressGlassScale()` iOS 按压手感（缩放 0.975 + 微降透明度）；
  - `entranceReveal()` 总览卡错峰入场（fade + slide-up，`rememberSaveable` 防滚动重播，系统动画缩放为 0 时自动禁用——无障碍）；
  - Tab 切换 `Crossfade` 升级为方向感知 `AnimatedContent` slide + fade（iOS 页面推入手感）。

## [2.1.0-beta.1] - 2026-11-18

### Added 新增
- **设备使用时长卡**（状态总览 Tab，真实数据、0 权限）：
  - 本次开机时长（`SystemClock.elapsedRealtime`，含息屏待机，重启归零）；
  - 跨重启累计使用时长（应用存活期 1Hz 累加 + SharedPreferences 持久化，每 10 拍/退出 flush 落盘）；
  - 系统真实开机次数（`Settings.Global.BOOT_COUNT`，ROM 未提供时显示"系统未提供"，不编造）；
  - 重启检测双信号：BOOT_COUNT 递增（主信号，跨进程生效）+ elapsedRealtime 单调回退（回退信号）；
  - 口径诚实：每进程首拍建立新基线，应用未运行的间隙不计入累计（卡片明示）。

### Fixed 修复
- **历史存储轮转 P0 数据损坏**：`BatteryHistoryStore` 样本/会话文件轮转重写时 `joinToString` 使用空分隔符，把保留的 JSONL 行粘连成单行——轮转后 2999/3000 条样本（及会话）磁盘级不可解析、历史永久损坏，且既有轮转测试断言（`size <= KEEP`）过弱未能拦截。修复为 `"\n"` 分隔符；测试强化为精确计数（轮转后 3050 条全可解码 + 头尾时间戳断言）并新增会话轮转回归用例；经证伪实验验证（缺陷态下恰好仅 2 条新断言失败）。
- 设备使用时长累计口径：修复"从 prefs 恢复 elapsed 引用导致应用死亡间隙被计入使用时长"的缺陷（与卡片"应用未运行时间不计"口径矛盾）；深度审计以真实编译 + 45 项断言全绿验证。

## [2.0.0-beta.1] - 2026-11-16

GA 交付差距（P0/P1/P2 阻断项）全面修复批次：长期数据连续性、仪器化测试、发布合规与本地化。

### Added 新增
- **P0** 遥测历史与充放电会话跨会话持久化（`BatteryHistoryStore`）：
  - 真实遥测样本 JSONL 本地落盘（`filesDir/telemetry/samples.jsonl`），进程重启曲线自动接续，滑窗约 3000 条滚动淘汰；
  - 充放电会话自动检测（状态族切换 / 断流闭合），独立会话文件保留约 500 条；
  - 遥测分析页新增"充放电会话统计"卡（最近 5 条会话：类型/起止电量/Δ电量/时长/均值电流）；
  - 曲线/会话 CSV 导出（FileProvider 系统分享）与一键清空（二次确认）。
- **P0** 仪器化测试：`MainActivitySmokeTest`（启动冒烟 / 四 Tab 导航 / 遥测会话卡挂载），CI 新增 `instrumented` job（Ubuntu KVM 模拟器 API 30），发布 gate 纳入仪器化结果；
- **P0** 机型矩阵回归验收清单 `docs/DEVICE_MATRIX.md`（8 类设备 + Firebase Test Lab 云真机 CI stub）；
- **P1** 正式签名 fail-fast：tag 触发构建缺签名密钥直接失败，debug 签名物料不得进入 v* 发布；
- **P1** 商店合规物料：`PRIVACY.md` 隐私政策 + 应用内"隐私与数据声明"卡 + `docs/STORE_LISTING.md` 上架清单（含 Data Safety 问卷答案）；
- **P2** 本地化：全部 UI 文案迁移 `strings.xml` 并新增 `values-en` 英文资源；
- **P2** 用户文档：`docs/USER_GUIDE.md`（手册 + FAQ）与 `CHANGELOG.md`；
- **P2** 轻量崩溃捕获（`CrashLogHandler` + `BatteryMasterApplication`）：堆栈本地落盘（最近 10 份），关于卡一键导出，零三方 SDK 零上传；
- **P2** CI APK 体积门禁（>35MB 失败 / >25MB 告警）+ `docs/PERFORMANCE_BASELINES.md` 基线。

### Changed 变更
- 版本策略收敛 alpha → beta：`2.0.0-alpha.8` → `2.0.0-beta.1`（versionCode 20 → 21）；
- `tools:targetApi` 34 → 36，targetSdk 36 行为加固审计通过（edge-to-edge 强制执行已合规、动态注册 RECEIVER_NOT_EXPORTED 已合规）。

### Security 安全
- FileProvider 仅授权 `cacheDir/exports/` 与 `filesDir/telemetry/` 白名单目录，最小暴露。

### Notes 说明
- 持久化全部本地化（私有目录 JSONL），不引入 Room/网络依赖，与零权限零上传信条一致；
- 云真机矩阵待 Firebase Test Lab 开通后启用（stub 已就位）。

## [2.0.0-alpha.8] - 2026-11-15

### Fixed
- 实验室模拟中修改设计容量的指标联动闭环（滑杆 → Reader → 指标 01/02/03）；
- 模拟保持期倒计时与恢复链路；遥测历史跨 Tab 切换保留。

### Changed
- compileSdk/targetSdk 升至 36 (Android 16)；AGP 8.10.1；签名方案显式启用 v1~v4。

（更早版本记录见仓库 README 各版本审计章节）
