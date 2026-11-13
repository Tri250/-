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

## 🚀 2.0 大版本升级 · alpha 批次 (v2.0.0-alpha)

2.0 定位：从「实时读数工具」升级为「电池健康档案与预测工具」，所有改动围绕**数据真实性**与**数据连续性**两条主线。alpha 批次交付 A（采集层）+ B（健康度引擎）+ G（工程升级）三组：

- **批次A · 多节点 sysfs 探测链**：`/sys/class/power_supply/battery` 并非全平台挂载完整电量计——高通 QG/小米澎湃 G1 挂 `bms`、Pixel (Maxim) 挂 `maxfg`、OPPO/一加双电芯挂 `dc`。新增目录探测链（品牌预设优先级 > battery > 特征节点评分降序，探测一次缓存），`charge_full` / `charge_full_design` / `current_now` / `cycle_count` 四类节点改走探测链——bms/maxfg 平台指标 03/04/10/11 从恒降级 0.92 估算升级为实测，估算兜底占比真实下降。
- **批次B · 电池健康度引擎**（`BatteryHealthEngine`，双通道共享）：
  - **动态内阻实测**：统一模型 `V = OCV + I·R`（充电/放电斜率同为 +R），对 96 样本滑窗（约 96 秒 1Hz 遥测）做最小二乘回归，斜率 ×1000 = R(mΩ)；浮充电流（|I|<150mA）不参与、双通道同拍重复样本去重、回归越出 2~200 mΩ 物理区间清窗重来不展示脏值；
  - **三级置信度**：样本数 × 电流跨度双门限（HIGH ≥40 样本且 ≥1200mA / MEDIUM ≥20 且 ≥600 / LOW ≥10 且 ≥300），不足显式 UNAVAILABLE——UI 内阻卡来源随置信度标注「[运行时测算·高置信 n=48]」，无有效测算回退「[工程估算]」，不冒充实测；
  - **循环寿命预测**：基线模型（锂聚合物 800 次完整循环 SOH≈80%，0.025%/次）叠加温度压力项（平均温度每高出 25℃ 基线 1℃，单次损耗上调 2%，EWMA 平滑）；**诚实前提**：仅健康度实测（当前容量 SYSFS + 设计容量非兜底）时输出「预计还可循环约 N 次 [模型预测]」，0.92 估算健康度不参与外推放大。指标 10 卡片副标题动态展示。
- **批次G · 工程升级**：AGP 8.7.2 → 8.10.1（官方支持 compileSdk/targetSdk 36）、Gradle 8.9 → 8.11.1、compileSdk/targetSdk 35 → 36 (Android 16)、签名方案显式启用 v4（经 javap 实证 AGP 8.10.1 DSL 无 v3.1 开关，v3.1 仅对已实际执行密钥轮换的密钥库有意义，v1.2.6 时期的"v3.1 待 AGP 8.9+"注释失实并已校正）；CI 同步升级 SDK/Gradle 版本，Release 自动识别 alpha/beta/rc/dev 版本号并标记 **prerelease**。
- **回归测试**：`BatteryHealthEngineTest`（回归收敛/双极性/诚实降级/脏窗防护/采样守卫/预测口径 11 用例，纯 JVM）+ `BatteryNodeCatalogTest`（目录优先级/品牌预设/跨目录读取/解析器 SYSFS 升级集成，临时目录驱动）。
- **版本升级**：versionName 2.0.0-alpha / versionCode 12，Release 标记预发布。

---

## 🎯 v2.0.0-alpha.1 · 健康度诚实口径 + 四 Tab 信息架构

**用户口径修正（核心）**：电池健康度**是多少就是多少，不再按出厂保持率虚构**：

- **0.92 出厂保持率估算彻底移除**（[BatteryTelemetryParser.kt](android/app/src/main/java/com/battery/master/service/BatteryTelemetryParser.kt)）：电量计节点（charge_full）全链路不可读时，旧实现虚构 `0.92×设计容量` 的"当前容量"再得出精确的"92.0% 健康度"——现已改为容量=0（非法哨兵）、来源 `UNAVAILABLE`（不可测算）、健康度=0 且 `hasMeasuredCapacity=false`，UI 指标 01/02/03 显示 **"— 无法测算"**，测不到就不展示；附带收益：0 被锁定链路合理区间校验拒绝，估算值冒充实测锁定的通路彻底关闭。
- **库仑计钳制语义修正**：容量不可测时 CHARGE_COUNTER 实测剩余电量不再被 `coerceAtMost(0)` 钳制成 0——实测读数仍是真实测量；容量实测时保留"剩余 ≤ 当前容量"防抖钳制。
- **模拟态展示自洽**：一键模拟充满的演示容量固定化（不再依赖真实通道容量，电量计不可读时旧实现 SIMULATED key 永不写入且出现"当前 0 mAh / 剩余 4760 mAh"矛盾）；实验室模拟基准容量在真实容量不可测时退回设计容量，全程 [模拟] 标注。
- **健康档案 Tab 新增**（对齐 Web 端 HEALTH 视图）：健康度实测大数字（无法测算显式空态）、内阻实测卡、循环寿命预测卡、健康诊断建议（过热/损坏/超压/高温/偏热/循环超基线/健康度<80% 七级文案）、充满判定卡双入口、完全充满校准规范说明。
- **遥测分析 Tab 新增**（对齐 Web 端 TELEMETRY 视图，Android 真机独有）：Compose Canvas 自绘三通道实时曲线（电压/电流/温度，1Hz 滑窗 120 秒，零三方依赖）、功率/温度评估卡（38/45℃ 单源分级）、**采集链路状态卡**（探测链命中节点 bms/maxfg、库仑计/CURRENT_NOW 支持性、内阻引擎滑窗 n=样本数·置信度——真实数据来源透视，Web 模拟端无法实现）。
- **Android 端取舍**（与 Web 对比）：Web 端的"原生源码镜像/工程总览"属 Web 演示页说明性内容，不适用于 Android 端，不搬移；Web 端 HEALTH/TELEMETRY 视图按上述补齐。
- **测试**：全量改造为诚实口径（无节点 → 空态断言；需实测的用例改走 `BatterySysfs.installProbeResultForTest` 探测链临时节点注入，验证真实锁定/校准联动路径），`HealthAuthenticityAuditTest` 重写为 v2.0.0-alpha.1 口径。
- **版本升级**：versionName 2.0.0-alpha.1 / versionCode 13，Release 标记预发布。

---

## 🔍 v2.0.0-alpha.2 · 新增内容彻底自检修复

针对 v2.0.0-alpha.1 新增修改的全量自检，发现并修复 **3 项预期范围不一致缺陷**：

- **P0 · 内阻引擎死链路（功能未达预期范围）**：全局只有 `BatteryHealthEngine.snapshot()` 消费（toBatteryState / HardwareInfoResolver）而**无任何 `observe()` 调用**——滑窗永远 n=0、内阻永远"[工程估算]"，遥测分析 Tab 宣称的"运行时测算/引擎滑窗"是死数据。修复：解析出口（[BatteryTelemetryParser.parse()](android/app/src/main/java/com/battery/master/service/BatteryTelemetryParser.kt)）统一喂样，双通道同拍重复读数由引擎内部去重、浮充/不可读电流被采样守卫拒绝；`TelemetryAndHealthTabAuditTest.engineWiring_parseFeedsSamples_reflectedInBatteryState` 端到端断言 30 样本喂入 → 滑窗 31 → BatteryState.engineSampleCount 透传，防退化。
- **P1 · 健康档案内阻卡臆造值**：无引擎测算时卡片展示 14.8 mΩ 工程估算值，与"是多少就是多少"口径冲突。修复：仅 `[运行时测算·置信度 n=N]` 时才展示数值，无测算显示"—"；总览硬件栏保留 v1.2.4 `[工程估算]` 显式标注口径。
- **P2 · 口径双轨漂移**：`healthMeasured` 循环寿命预测门限另写 `currentCapacitySource==SYSFS` 判定，与 `hasMeasuredCapacity` 字段存在漂移风险 → 统一单源；`BatteryState.currentCapacitySource` 默认值与注释同步为 UNAVAILABLE 诚实口径。
- **测试**：新增 `TelemetryAndHealthTabAuditTest`（5 用例：四 Tab 导航 / 遥测曲线+采集链路卡 / 无法测算空态 / 内阻诚实口径 / 引擎接线端到端），全量 **106 用例全绿**。
- **版本升级**：versionName 2.0.0-alpha.2 / versionCode 14，Release 标记预发布。

---

## ⚡ v2.0.0-alpha.3 · 真实现审查——消灭空实现/简化实现

针对"必须彻底达到真实预期效果，不能空实现、模拟、简化实现"要求，对新增功能逐项审查，发现并修复 **4 项名不副实**：

- **P0 · 遥测曲线历史是 UI 层简化实现**：旧实现历史数据在 `TelemetryAnalysisScreen` 内 `remember` 积累——**切换 Tab 即丢弃**，"最近 120 个采样点"名不副实；实验室冻结/模拟保持期期间曲线停摆（展示态冻结连带历史停录）。真实现（[BatteryViewModel.kt](android/app/src/main/java/com/battery/master/viewmodel/BatteryViewModel.kt)）：历史提升至 `BatteryViewModel.telemetryHistory`（StateFlow 整列表快照），**在发布源头 publish() 内积累**——冻结判定之前，真实硬件读数无论 UI 展示态如何始终如实入档；VM 存活期持久，跨 Tab/配置变更不丢。曲线始终反映真实硬件行为。
- **P0 · 双通道同拍节流 + 首拍边界**：广播与轮询双通道每秒各触发一次 publish，400ms 节流窗口去重（避免曲线密度失真）；**开机首拍边界**——elapsedRealtime 从 0 起算，节流初值 0 会让首拍遥测被窗口误弃（测试暴露的真实边界），初值改 -WINDOW 保证首拍必入档。
- **P1 · gaugeNodeLabel 失实标注**：探测链未命中任何存在目录时回退显示 "battery"，但此时并未从 battery 目录读到任何数据——诚实口径改为显示"无"。
- **P2 · SnapshotStateList 与 Compose 测试快照冲突**：VM 内 mutableStateListOf 在桌面 Compose 测试环境与 Recomposer 快照 apply 循环冲突（AppNotIdle 无限重组）→ 改用与 _batteryState 同语义的 StateFlow 发布（整列表不可变快照，1Hz 更新成本可忽略）。
- **测试**：新增 3 个真实链路用例——广播同款链路（onReceive → parse → publish）入档/同拍节流/越窗入档、125→120 滑窗截断（旧样本丢弃/新样本尾部）、**切 Tab 历史保留**（VM 单源断言 + 面板标题样本数一致）；节流时间源注入点（`elapsedClock`）绕开 Robolectric shadow 时钟不随真实睡眠推进的环境限制，测试完全确定。全量 **109 用例全绿**。
- **版本升级**：versionName 2.0.0-alpha.3 / versionCode 15，Release 标记预发布。

---

## ⚡ v2.0.0-alpha.4 · 电池健康度真实显示——库仑计积分回归通道

针对"健康度是否可以真实显示"彻底解决：新增**库仑计积分回归实测满充容量**通道（[BatteryCapacityRegressor.kt](android/app/src/main/java/com/battery/master/service/BatteryCapacityRegressor.kt)），sysfs `charge_full` 节点不可读的机型（SELinux 拒绝/ROM 未导出——大量机型形态）不再卡死"无法测算"。

- **物理原理**（AccuBattery 同款，纯电荷积分、零出厂保持率假设）：官方库仑计 API `BATTERY_PROPERTY_CHARGE_COUNTER`（API 21+）报告剩余电荷；百分比变化 Δp 与电荷变化 Δc 线性相关——过原点最小二乘回归 k̂ = ΣΔpΔc/ΣΔp²，满充容量 = k̂×100。测出来是多少就是多少。
- **质量门限**：Δp/Δc 异号（校准跳变）拒绝并重置跟踪点；单样本隐含满容量越界 [1500, 15000] mAh（读数毛刺）拒绝；电荷断档跳段——异常残留基准不得污染后续帧。
- **置信分级**（覆盖广度 Σ|Δp| 驱动，充放电双向积累）：跨度 <30 PENDING 不输出（诚实不输出）；≥30 MEDIUM；≥80 且 n≥12 HIGH。
- **统计量跨会话持久化**：OLS 统计量 (n/Σx/Σy/Σx²/Σxy/跨度) 存 SharedPreferences——真实使用越用越准。
- **融合与标注**：Reader 在 sysfs 实测缺席且回归收敛时融合回归满容量（来源 `COULOMB_REGRESSION`），健康度随之真实显示；sysfs 实测恢复时优先级自动回落 sysfs；健康档案卡/遥测采集链路卡展示 "n=N · 置信度" 标注。
- **测试**：新增 10 用例（OLS 收敛/置信分级/PENDING 诚实门限/跳变与离群拒绝/断档跳段/跨实例持久化/端到端健康度 76% 真实显示/未收敛仍显示无法测算/sysfs 优先级回落）——全量 **119 用例全绿**。
- **版本升级**：versionName 2.0.0-alpha.4 / versionCode 16，Release 标记预发布。

## ⚡ v2.0.0-alpha.5 · 12 项充放电核心指标逐项深度自检

针对 Release v2.0.0-alpha.4 Android 端 12 项充放电核心指标（电池健康度/剩余电量/电池当前容量/电池设计容量/电量百分比/电池状态/电池温度/电池健康状况/电芯电压/充放电循环/瞬时电流/完全充满容量）逐项 100% 深度自检——建立「字段→解析→采集→融合→UI→标注」全链路清单逐项审计，发现并修复 3 处真实缺陷 + 1 处口径标注过时：

- **指标 11/12 · 瞬时电流 mA 上报内核系统性 1000× 低报（缺陷 A，高危）**：[BatterySysfs.kt](android/app/src/main/java/com/battery/master/service/BatterySysfs.kt) 电流归一化在 BatteryManager 属性与 sysfs `current_now` 同源同值（ratio≈1）时一律 /1000——mAh 上报内核（`charge_full` 以 mAh 上报的驱动惯例）的 1150 mA 充电被低报为 1 mA，且连带污染指标 12 充满判定：100% 充电中 1150 mA 落入 0~25 mA 浮充区间被误判"已充满"并锁定写盘。修复：新增电量计容量上报单位惯例检测（`charge_full` mAh 内核 → `current_now` 亦 mA），歧义分支按惯例裁决；规范 μAh 内核照常 /1000 不受影响。
- **指标 02 · 剩余电量库仑计实测读数被隐藏（缺陷 B）**：容量不可测但 `CHARGE_COUNTER` 可读时，真实剩余电荷实测值被 UI 统一显示 "—" 丢弃，且 Hero 行无条件渲染 "2400 / 0 mAh" 矛盾读数。修复：指标 02 卡与 Hero 行三分支口径完全一致——实测态（"库仑计实测剩余电荷 [容量未实测]" / "剩余电量: 2400 mAh · 库仑计实测"）、分式态（容量实测）、空态（诚实 "—"）。
- **遥测链路卡 · 满容量回归标注失实（缺陷 C）**：sysfs 实测优先时回归通道仍在持续积累样本作备用，旧文案"未启用 (无有效库仑计样本)"失实——改为"备用通道 (sysfs 实测优先)"。
- **指标 12 判定卡标题口径过时（缺陷 F）**："完全充满时的容量 (估算)" 与实测锁定口径不符——锁定守卫（容量 ≤0 拒绝锁定 + 0 哨兵语义）已保证真实锁定值仅来自 sysfs/库仑计回归实测容量，标题更正为"(实测)"，模拟演示值由"来源: 模拟" chip 显式区分。
- **其余 8 项指标自检结论**：01 电池健康度（sysfs/回归双通道+诚实空态）、03 电池当前容量（探测链+融合）、04 电池设计容量（四级回退+校准持久化）、05 电量百分比（归一化钳制）、06 电池状态（单源映射+FULL 归一）、07 电池温度（钳制+阈值单源）、08 电池健康状况（五枚举诚实默认）、09 电芯电压（区间校验+中性回退）、10 充放电循环（双通道+诚实空态）——「数据源→解析→采集→融合→UI→标注」链路完整闭环，无断链/口径漂移/诚实性缺失。
- **测试**：新增 [MetricsSelfCheckAuditTest](android/app/src/test/java/com/battery/master/MetricsSelfCheckAuditTest.kt) 13 用例（mA 内核归一化三场景 + 充满判定连带污染集成验证 / 库仑计实测保留与钳制不变式 / Hero-指标 02 三分支口径一致性端到端 / 链路卡回归标注三分支 / 判定卡标题口径）——全量 **132 用例全绿**。
- **版本升级**：versionName 2.0.0-alpha.5 / versionCode 17，Release 标记预发布。

## ⚡ v2.0.0-alpha.6 · 指标 01 电池健康度真实显示修复

真实设备反馈"01 电池健康度不显示"（sysfs 电量计节点不可读机型上，回归通道需累计 30 个百分点覆盖才收敛，刚安装期间恒显"无法测算"）。本次新增三条真实通道并保持诚实标注，健康度在安装后即可真实显示：

- **通道一 · sysfs `energy_full` 探测扩展**：部分设备（Pixel 部分世代/联发科平台）只导出 `energy_full`/`energy_full_design`（μWh）而不导出 `charge_full`（μAh）——[BatterySysfs.kt](android/app/src/main/java/com/battery/master/service/BatterySysfs.kt) 探测链新增 energy 系节点物理折算 `Q(mAh) = E(μWh) / V(mV)`，折算电压取节点 `voltage_now`（μV→mV）并钳制标称窗口 [3400, 4000] mV（满充 4.4V/关机 3.3V 极值回落标称 3850 mV 防失真）；`charge_full` 在场时仍优先（零折算误差），energy 系仅兜底。energy-only 机型 sysfs 实测通道直接打通（指标 01/03/04 同时受益）。
- **通道二 · 库仑计单点瞬时估算（立即显示）**：[BatteryHardwareReader.kt](android/app/src/main/java/com/battery/master/service/BatteryHardwareReader.kt) 新增融合分支 `F = CHARGE_COUNTER 实测剩余电荷 ÷ 实时百分比 × 100`——纯传感器读数物理推导（AccuBattery 单点形式），无出厂保持率假设。质量门限：电荷不可读不估、百分比 <20 不估（±1% 电量格舍入误差 >5%）、结果越出物理区间 [1500, 15000] mAh 不估。融合优先级 sysfs 实测 > 库仑计回归 > 单点估算，回归收敛后自动升级为高置信通道；单点估算不参与循环寿命外推（防止估算值被放大成"精确的剩余循环数"）。剩余电量保留库仑计实测读数（`F×p/100 ≡ c/1000` 恒等，无口径漂移）。
- **通道三 · 采样进度诚实显示**：01 卡在双门限均未过时显示"回归采样中 · n=N · 覆盖≥30%收敛"而非死空态，用户可预期健康度显示时点。
- **测试**：新增 10 用例（energy 折算 4 场景含电压钳制/优先级、单点估算 5 场景含门限与 100% 精确读数、端到端 UI 92.3% 真实显示）——全量 **141 用例全绿**；4 份源码快照（sysfs/reader/state/compose）逐字同步，Web 构建通过。
- **版本升级**：versionName 2.0.0-alpha.6 / versionCode 18，Release 标记预发布。

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
# 示例：当前版本 versionName=2.0.0-alpha.6 (versionCode=18)
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
