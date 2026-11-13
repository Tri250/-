# Android Battery Master (安卓电池管家)

[![Build & Release Android APK](https://github.com/actions/workflows/build-apk.yml/badge.svg)](https://github.com)
[![Android](https://img.shields.io/badge/Platform-Android%208.0%2B%20(API%2026--35)-brightgreen.svg)](https://developer.android.com)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.0.21-blue.svg)](https://kotlinlang.org)
[![Compose](https://img.shields.io/badge/Jetpack%20Compose-BOM%202024.10-purple.svg)](https://developer.android.com/jetpack/compose)

专业的 Android 原生电池充放电监测与健康诊断应用。具备完整的 GitHub Actions CI/CD 流水线，代码推送到 GitHub 后**自动编译生成 APK 安装包**供下载与发布。

---

## ⚡ 12 项充放电核心功能特点

| 序号 | 功能特点 | 原生实现逻辑 |
| :---: | :--- | :--- |
| **01** | **电池健康度** | 算法：`当前实际容量 / 出厂设计容量 × 100%`；容量来源显式标注（sysfs 实测 / PowerProfile 实测 / 用户校准 / 0.92 降级估算 / 5000 mAh 兜底），无实测数据时以估算标注展示，不虚构测量精度。 |
| **02** | **剩余电量 (mAh)** | 读取 `BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER` 或由百分比精确折算。 |
| **03** | **电池当前容量** | 电池衰减后的最大可用物理容量（从系统 `/sys/class/power_supply/battery/charge_full` 提取）。 |
| **04** | **电池设计容量** | 手机出厂标称额定容量（支持系统 PowerProfile 自动读取或自定义配置）。 |
| **05** | **电量百分比** | 监听系统原生广播 `Intent.ACTION_BATTERY_CHANGED` 中的 `EXTRA_LEVEL` 与 `EXTRA_SCALE`。 |
| **06** | **电池状态** | 实时系统状态枚举：**充电中**、**放电中**、**已充满**、**未充电**。 |
| **07** | **电池温度** | 读取 `BatteryManager.EXTRA_TEMPERATURE`（0.1℃ 精度换算为摄氏度 ℃），提供过热与低温报警。 |
| **08** | **电池健康状况** | 严格映射 Android 硬件状态：**良好**、**过热**、**损坏**、**超压**、**未知**。 |
| **09** | **电池电压** | 毫伏级别测温与电压：`BatteryManager.EXTRA_VOLTAGE`（mV）。 |
| **10** | **循环计数** | 记录充放电累积循环次数（Android 14+ 原生 API 与 Linux sysfs 双重支持）。 |
| **11** | **瞬时电流** | 实时采样充入与消耗电流：`BatteryManager.BATTERY_PROPERTY_CURRENT_NOW`（毫安 mA），换算瞬时功率（W = V × I）。 |
| **12** | **完全充满时的容量** | **严格执行充满判定规则**：仅当 **电量为 100%** 且 **电流处于 0 ~ 25 mA** 浮充截止区间时，系统才判定为完全充满并锁定显示实际完全充满容量。 |

---

## 🧪 硬件实验室与硬件档案解析 (v1.1.1 新增)

- **硬件实验室**：应用内顶部 Tab 切换。4 个一键场景（充满校准 / 极速闪充 +4800 mA / 高负载游戏放电 −1150 mA / 过热警报）、6 组滑杆（电量 / 电流 / 电压 / 温度 / 循环 / 设计容量）、电池状态与健康枚举强制切换、提示音开关；模拟数据仅作用于展示层，随时一键恢复真实硬件遥测。
- **硬件信息三级回退解析**：PMIC 型号 / 快充协议 / 电芯结构 / 化学体系按 **sysfs + device-tree 实测 → 品牌硬件档案推断 → 主流工程估算** 回退链解析，输出字段带 `[DT 实测]` / `[实测]` / `[品牌档案]` / `[工程估算]` 来源标注，彻底消除"系统未上报"。

---

## 🎨 UI/UX 设计体系 overhaul (v1.2.0)

- **统一设计令牌**：Web 端 `src/index.css` @theme 与 Android 端 `ui/theme/DesignTokens.kt` 一一对应——品牌色板（充电 emerald / 放电 sky / 充满 teal / 警告 amber / 危险 rose / HAL cyan）、7 级字号阶梯（10/12/14/16/20/24/68）、4 级圆角、动效时长（微交互 150-250ms / 转场 250-350ms / Hero 700ms）。双端彻底消除硬编码色值与散落字号。
- **玻璃拟态体系**：半透明底 + 背景模糊 + 细描边 + 顶部 1px 切面高光线四件套（Web `.glass-panel` / `.glass-strong`；Android 以半透明渐变 + 描边模拟玻璃切面），Hero 卡片、指标卡、实验室面板全部玻璃化。
- **动画分层**：Tab 切换淡入上移、指标网格 45ms 阶梯错落入场、电量读数 700ms 缓动滚动、充电氛围双层呼吸光晕、遥测曲线霓虹辉光 + 最新点脉冲、健康进度条流光条纹、按钮按压回弹；全站遵循 `prefers-reduced-motion` 无障碍降级。
- **品牌化细节**：统一 focus-visible 品牌焦点环、品牌化 range slider（霓虹拇指 + 聚焦光环）、等宽 tabular-nums 数字读数杜绝跳动、Material3 colorScheme 映射设计令牌。

---

## 🔩 SoC 主控功能模块全量自检 (v1.2.1)

- **五字段完整档案**：SoC 模块从单一"型号"升级为 **型号 / 厂商 / 制程 / CPU 架构 / GPU** 五字段（Web 端 `HardwareInfo`/`DevicePreset` 与 Android 端 `BatteryState` 同构），硬件摘要栏与 Android 硬件网格同步展示。
- **五级检测链**（`SoCHardwareProfile`）：API 31+ `Build.SOC_MODEL`/`SOC_MANUFACTURER` → soc0 节点 `/sys/devices/soc0/{machine,family,model}` → `/proc/cpuinfo` "Hardware:" 行 → 平台代号档案（pineapple / mt6991 / exynos2400…）→ 品牌体系工程估算，全链路 Throwable 兜底，任何环境不再出现"系统未上报"。
- **平台规格档案**：覆盖骁龙 8 系（865/888/8 Gen1/8+/8 Gen2/8s Gen3/8 Gen3/8 Elite/8 Elite Gen 5）、天玑（8500/9200/9300/9400/9500）、Tensor G3/G4、Exynos 2200/2400、麒麟 9000/9000S、虎贲 T760 的营销名 / 厂商 / 制程 / CPU 核心分级 / GPU（来源：各厂商官方规格页），命中即输出完整架构档案。
- **回归测试**：新增 `SocHardwareProfileTest`（Robolectric）覆盖五级检测链、ShadowBuild 注入实测、平台代号回退、未知型号诚实估算与全部纯解析函数；启动回归测试同步断言五字段非空。

---

## 🔋 完全充满容量模块全量自检 (v1.2.1)

指标 12「完全充满时的容量」——严格执行 **电量 100% 且瞬时电流处于 0~25 mA 浮充截止区间** 才判定完全充满并锁定显示实际充满容量。本版本对该功能模块进行全量深度完整自检与修复：

- **双通道统一解析**：轮询通道（`BatteryHardwareReader`）与广播通道（`BatteryReceiver`）原先各持一套 ~100 行并行遥测解析，存在语义漂移风险；现收敛为单一 `BatteryTelemetryParser`，从结构上保证双通道 12 项指标语义完全一致。锁定容量/时间戳仍以 Reader 为单一数据源，未满足判定时自动回显上次锁定值，跨进程重启不丢失。
- **判定边界加固**：充满判定谓词统一为 `percentage == 100 && currentMa ∈ [0, 25] mA`（含边界值），UI 卡片直接消费 State 不在本地重算；电量百分比强制归一化 0~100——修复部分定制 ROM 上报 `level > scale` 时 `percentage == 100` 永不成立、指标 12 充满判定**永久失效**的缺陷。
- **容量合理性校验**：`charge_full` sysfs 读取增加 500~25000 mAh 合理区间校验（上限覆盖 23800 mAh 三防大电池机），单位异常（个别内核以 mAh 上报）/脏数据一律回退设计容量估算值；锁定与持久化双重拒绝非法容量（≤0）与非法时间戳，杜绝 "0 mAh" 污染指标 12 显示与本地存储。
- **实验室数据隔离**：修复退出硬件实验室后"充满校准"场景合成的容量**泄漏进真实遥测态**的问题（未真实充满却虚假回显）；修复一键模拟保持期内退出实验室仍残留实验室数据的问题；采集异常降级的安全默认态现在保留已锁定容量与时间戳。
- **回归测试**：新增 `FullChargeCapacityTest`（Robolectric）覆盖判定谓词边界、锁定状态机（进入/去重/重锁/保留/拒绝非法值）、跨重启持久化、百分比归一化、双通道共享锁定、一键模拟充满与实验室数据隔离，CI 每次推送强制执行，异常即阻断发布。

---

## 🧭 整体全量自检与发布加固 (v1.2.2)

对整个项目（Android 端 14 个 Kotlin 源文件 + Web 演示端 + CI 工作流）进行五维全面深度自检审计：

- **稳定性**：全链路 `Throwable` 兜底确认完备——ViewModel 协程（轮询/倒计时）异常吞掉不中断、Receiver 注册失败自动降级轮询、`onCleared` 条件注销防泄漏、sysfs 读取异常返回 null、除零防护覆盖 raw=0/Int.MIN_VALUE 等边界。
- **性能**：确认 1Hz 轮询无重复昂贵操作——SoC 解析进程内缓存、live protocol 探测 10s TTL、静态硬件信息仅探测一次；Compose 单数据源 StateFlow 驱动，无更新风暴。
- **兼容性**：`Build.SOC_*` 等 API 全部带 `SDK_INT` 分级守卫（API 31+/34+），sysfs/PMIC 探测异常 ROM 路径全回退，minSdk 26 / targetSdk 35 保持不变。
- **权限管理**：应用声明零运行时/危险权限（合并清单含 1 个 AndroidX 框架自动注入的签名级内部权限，v1.2.6 起如实披露），`exported` 仅 LAUNCHER Activity，备份规则（`backup_rules` + `dataExtractionRules`）显式排除全部应用数据。
- **安装与卸载**：`versionCode` 单调递增（v1.2.2 时点为 7，现已递增至 11），R8 混淆 + 资源收缩 + PowerProfile 反射保留规则齐全；CI 安装属性自检（aapt2 badging：包名/版本/启动 Activity/图标/应用标签）与 tag↔versionName 一致性强制校验。
- **Web 端预检**：`npm ci` + `tsc --noEmit` + `vite build` 本地全通过（dist 产物含 index.html + assets）。
- **版本升级**：versionName 1.2.2 / versionCode 7，覆盖安装兼容旧版（versionCode=1 起单调递增）。

---

## 🖥️ 界面中文化与关于卡片 (v1.2.3)

- **首屏标题中文化**：顶栏主标题 `ANDROID BATTERY MASTER` → **电池大师**，副标题 `Android 15 Battery AIDL HAL · 原生硬件遥测` → **Android 15 电池 AIDL 硬件抽象层 · 原生硬件遥测**，与应用名 `app_name`（电池大师）完全统一。
- **新增「关于 APP」功能说明卡片**：状态总览页底部新增卡片，集中说明应用功能——12 项核心充放电指标实时遥测、完全充满判定（100% 且 0~25 mA 浮充截止）、硬件实验室场景模拟与滑杆调参、硬件信息三级回退解析、数据来源（BatteryManager 公开接口 / 粘性广播 / sysfs，全本地计算零上传）、零权限声明；并展示开发者署名（某厂大牛马【带娃的小陈工】— 抖音 / 小红书 平台）。
- **版本徽章单源注入**：关于卡片版本号经 `BuildConfig.VERSION_NAME/VERSION_CODE` 读取（buildConfig 开启），与 `build.gradle.kts` 单一事实来源，杜绝硬编码漂移。
- **版本升级**：versionName 1.2.3 / versionCode 8。

---

## 🔍 数据真实性与展示口径治理 (v1.2.4)

针对 P2「数据真实性与展示口径」及 P3「资源与工程实现」共 11 项审计发现的逐项修复：

- **温度分级阈值单源**：温度卡（`BatteryScreen`）与温控节流态（`HardwareInfoResolver`）统一消费 `BatteryTelemetryParser.TEMP_WARM/OVERHEAT_THRESHOLD_C` 常量对（38℃/45℃）——修复旧实现两套阈值打架（38~38.5℃ 卡片"偏热"而标签"正常"、44~45℃ 标签"急停"而卡片仅"偏热"，同屏自相矛盾）。
- **节流态与内阻不再冒充实测**：移除臆造的"限制 50%"/"限流 15%"节流百分比（系统无任何 API 上报该数值），电芯内阻（工程估算模型）与节流态显式标注 `[工程估算]`，与 SoC 字段既有来源标注模式一致。
- **功率方向恢复**：解析层移除 `abs()`——功率随符号携带方向（充电 +W / 放电 −W），指标 11 卡片与 Hero 读数条显示充放方向；旧实现放电与充电同显正功率，方向信息丢失。
- **剩余电量口径标注**：指标 02 显式标注数据口径（`[库仑计实测]` = CHARGE_COUNTER / `[估算]` = 百分比×容量）——两条口径量纲基准不同、机型间不可比、运行中切换会跳变，旧实现无任何标注。
- **硬件长文本省略号**：`HardwareItem` 补 `TextOverflow.Ellipsis`（旧实现默认 Clip 静默硬裁切），"快充协议"等长值行允许两行完整展示。
- **ToneGenerator 泄漏修复**：`onCleared()` 统一 `release()`（旧实现仅异常分支释放，每次销毁泄漏一个 native 对象）。
- **`enterLabMode()` 死代码激活**：硬件实验室新增显式"进入模拟模式"入口（带 TONE_PROP_ACK 提示音反馈），与隐式滑杆进入并存。
- **1Hz 轮询生命周期门控**：`MainActivity` onResume/onPause 联动 VM 暂停/恢复轮询——退后台/锁屏不再持续主线程 sysfs 读取（电池监测工具持续后台轮询属反向耗电缺陷）；广播通道不受影响。
- **R8 混淆宣称属实化**：移除 `-keep class com.battery.master.** { *; }` 全量保留规则（业务代码实际未被混淆，与宣称不符）；业务侧反射依赖经清单化评估收敛（ViewModel 反射实例化 / PowerProfile 反射），v1.2.5 补充 ViewModel 构造器保留规则后全量混淆安全。v1.2.2~v1.2.3 的"R8 混淆"宣称自 v1.2.4 起真实生效。
- **debug 签名兜底显性化**：CI 的 `apksigner verify` 改为无条件执行（debug 签名兜底时告警披露），release 产物名与说明按实际签名类型动态生成（`-release.apk` / `-debug.apk`），debug 包不再冒充正式签名发布。
- **版本升级**：versionName 1.2.4 / versionCode 9。

---

## 🛡️ 全端稳定性加固 (v1.2.5)

全面自检（稳定性/性能/兼容性/权限管理/安装卸载）发现的加固项：

- **R8 ViewModel 反射构造器加固**：`ViewModel` 经 `SavedStateViewModelFactory`/`NewInstanceFactory` 反射实例化，显式 `-keepclassmembers` 保留构造器成员（类名仍全量混淆），消除 v1.2.4 全量混淆后反射调用点无法回溯导致启动即崩溃的最坏情形。
- **倒计时协程空转治理**：模拟保持期倒计时在无模拟时段由固定 4Hz（250ms）唤醒降为 500ms 低频轮询（触发后 0.5s 内进入高频），消除全生命周期无意义主线程唤醒。
- **安装属性自检**：versionCode 10 单调递增支持覆盖安装，tag↔versionName 一致性校验、aapt2 badging 校验、SHA256 校验和与无条件 `apksigner verify` 均已在 CI 门禁持续生效。
- **权限口径**：应用声明零运行时/危险权限与"关于 APP"卡片权限声明一致（合并清单含 1 个 AndroidX 框架自动注入的签名级内部权限，v1.2.6 起如实披露）；备份规则（`full-backup-content` / `data-extraction-rules`）全量排除应用数据，卸载即彻底清除。
- **版本升级**：versionName 1.2.5 / versionCode 10。

---

## 📋 外部全量审计修复 (v1.2.6)

针对外部审计报告 17 项发现（P1×3 / P2×6 / P3×8）的逐项核实与修复：

- **P1-1 Web 产物可移植性**：`vite.config.ts` 新增 `base: './'`——旧默认 `/` 使 `dist/index.html` 以绝对路径引用资源，`file://` 直开与子路径部署均白屏；CI 新增 dist 相对路径门禁断言。
- **P1-2 CI 假绿灯治理**：`testDebugUnitTest` 只跑 debug 未混淆变体，无法覆盖 R8 全量混淆后 ViewModel 反射构造器被裁剪的最坏情形——新增 Release DEX 冒烟步骤（解包 release APK，dexdump 断言映射后的 ViewModel 类与 `(Application)` 反射构造器签名在真实产物中保留）+ `mapping.txt` 归档 artifact + 移除与 AGP 8.7.2 不兼容的 `|| gradle` 系统 Gradle 兜底。
- **P1-3 Web 双端口径同步**：新增 `src/lib/batteryConstants.ts` 单源常量文件，Web 端温度阈值（38/45℃）、充满判定三态（100% + 充电态 + |电流|≤25 mA）、功率带符号方向（充电 +W / 放电 −W）、容量合理区间（500~25000 mAh）全面对齐 Android 端 `BatteryTelemetryParser`。
- **P2-1 充电态判定单源化**：`EXTRA_PLUGGED` 默认值 `-1 → 0` 且判定改 `plugged > 0`——旧实现广播缺该 Extra 时被误判"已接电源"，拔线 100% 时电流归一化 0 mA + 判定带恒真，估算容量被冒充实测锁定写盘；充电态判定收敛为 `RawBatteryTelemetry.isCharging` 单字段，双通道（Receiver/Reader）直接消费，消除三处重复推导漂移。
- **P2-2 权限宣称属实化**：Release 说明改为"应用声明权限数 0（无运行时/危险权限）+ 合并清单含 1 个 AndroidX 框架自动注入的签名级内部权限"（`DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`，signature 级）；应用内"关于 APP"卡片同步改为"权限声明"口径。
- **P2-3 apksigner 管道截断修复**：`verify --verbose | head -n 10` 双重缺陷（SIGPIPE 截断输出 + 管道退出码取 head 恒 0 吞掉真实失败）改为先落盘再截断。
- **P2-4 KEY_ALIAS 真读 Secret**：`keyAlias` 改为 `System.getenv("KEY_ALIAS") ?: "battery-master"`——CI Secret 实际注入了别名却被硬编码无视，更换 keystore 不再需要改源码。
- **P2-5 倒计时协程加固**：触发模拟保持期时同步置剩余秒数（消除 0~500ms 显示 0 的竞态窗口）；`catch Throwable` 改为 `catch Exception` 并原样重抛 `CancellationException`，恢复结构化并发取消语义。
- **P2-6 清除记录后锁定值复活修复**：`clearFullChargeRecords()` 同步置空 `lastKnownState`——旧实现采集异常降级时返回含旧锁定值的快照，"已清除"的指标 12 会复活回显。
- **P3 宣称与工程一致性**：AIDL 失实宣称修正（`halVersion`/副标题/硬件栏标签改为 BatteryManager API 真实通道）、README 历史失实行校正（versionCode 时点标注/反射依赖表述/权限口径）、`NativeCodeViewer` 代码快照与真实源码同步并加滞后标注、`__dirname` → `import.meta.dirname`、React.lazy 分包降低主 chunk 体积、移除未使用的 `@google/genai` 依赖与 `.env.example`、三处 checkout 补 `fetch-depth: 0`、签名配置显式启用 v1/v2/v3/v3.1 全方案。
- **targetSdk 36 路线图**：维持 targetSdk 35（API 35 已全量适配）；36 升级涉及 edge-to-edge 与广播注册新行为，待真机回归后单独发版，不在本版冒进。
- **回归测试**：`FullChargeCapacityTest` 新增 3 个充电态判定回归用例（EXTRA_PLUGGED 缺失 + DISCHARGING 不误判、插电通道独立生效、拔线 100% 绝不锁定），既有用例同步按新口径修正。
- **版本升级**：versionName 1.2.6 / versionCode 11。

---

## 👨‍💻 开发者

- **某厂大牛马【带娃的小陈工】** — 抖音 / 小红书 平台

---

## 🛡️ 启动闪退治理 (v1.1.2)

- **启动全链路 Throwable 兜底**：`BatteryManager` 安全转换（缺失服务不再 NPE）、粘性广播查询、sysfs / device-tree 探测、PowerProfile 反射（OEM ROM 抛 `Error` 级异常也捕获）、SharedPreferences 读写、广播注册/注销，全部按 `Throwable` 兜底并降级到最后已知态，采集异常只跳过本拍轮询，进程不退出。
- **广播通道加固**：`ACTION_BATTERY_CHANGED` 为粘性广播，注册瞬间主线程同步回调；`BatteryReceiver.onReceive` 整体兜底，解析失败由 1 秒轮询自动补偿。
- **协程与 UI 回调兜底**：轮询循环、模拟倒计时、`publish` 发布、实验室滑杆/场景/恢复等 UI 回调入口逐一防护，未捕获异常不会杀进程。
- **回归测试**：新增 Robolectric 启动冒烟测试（`StartupCrashRegressionTest`），覆盖 Activity 启动 → ViewModel 构造 → 粘性广播回调 → Compose 首帧渲染，CI 每次推送强制执行，异常即阻断发布。

---

## 🚀 如何推送到 GitHub 并自动编译 APK

本仓库已配置 `.github/workflows/build-apk.yml` 自动化构建工作流。只需将代码推送到 GitHub，即可自动触发云端编译并生成 APK。

### 1. 初始化 Git 并推送到您的 GitHub 仓库

```bash
# 1. 初始化本地仓库
git init

# 2. 添加所有代码文件
git add .

# 3. 提交初始版本
git commit -m "feat: Android Battery Master with auto APK build workflow"

# 4. 设置默认分支为 main
git branch -M main

# 5. 关联您的 GitHub 远程仓库 (替换为您自己的仓库地址)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# 6. 推送代码
git push -u origin main
```

### 2. 在 GitHub Actions 中下载编译好的 APK

1. 打开您的 GitHub 仓库页面，点击顶部的 **Actions** 标签页。
2. 您会看到正在运行的 **`Build & Release Android APK`** 流水线。
3. 编译完成后（约 1~2 分钟），点击该构建记录进入详情页。
4. 页面底部 **Artifacts** 区域即可直接点击下载 **`Android-Battery-Master-Debug-APK.zip`**，解压后即为 `app-debug.apk`，可直接传输到安卓手机安装！

### 3. 发布正式版 Release（可选）

只要在本地打上 `v*` 格式的版本标签（**必须与 `android/app/build.gradle.kts` 中的 `versionName` 一致**，CI 会强制校验）并推送到 GitHub，GitHub Actions 会自动创建 GitHub Release 并将 APK 文件挂载在 Release 附件中：

```bash
# 示例：当前版本 versionName=1.2.6 (versionCode=11)
git tag v1.2.6
git push origin v1.2.6
```

---

## 🛠️ 本地开发与编译 (Android Studio)

如果需要在本地电脑进行调试或二次开发：

1. 启动 **Android Studio (Ladybug / Koala 或更高版本)**。
2. 打开项目根目录下的 **`android`** 文件夹。
3. 等待 Gradle 同步完成，在终端执行以下命令直接编译：
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
4. 编译输出位于：`android/app/build/outputs/apk/debug/app-debug.apk`。

---

## 📄 开源许可证

本项目基于 Apache-2.0 许可证开源。
