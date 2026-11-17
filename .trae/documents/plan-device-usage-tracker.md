# 实施方案：设备使用时长（真实开机天数/小时显示）— Android 端 v2.0.0-beta

## Context

用户需求：真实知道手机已经使用了多少天多少小时。当前应用 12 项指标全部聚焦电池本体，无设备维度的使用时长统计。第三方应用拿不到出厂首开时间（需 root），因此采用三项**真实可得、0 权限**的数据源，诚实标注口径：

1. **本次开机时长**：`SystemClock.elapsedRealtime()`（含息屏待机，重启归零）
2. **跨重启累计使用时长**：应用存活期 1Hz 累加 + SharedPreferences 持久化，重启不丢（应用未运行的时间不计，UI 明示口径）
3. **真实开机次数**：`Settings.Global.BOOT_COUNT`（系统级统计，自恢复出厂起）

展示位置：状态总览 Tab 底部新增「设备使用时长」卡片（用户已确认口径方案 1 + 位置方案 1）。

## 新增文件

### 1. `data/DeviceUsageSnapshot.kt`（数据类）
```kotlin
data class DeviceUsageSnapshot(
    val uptimeMs: Long,          // 本次开机时长
    val cumulativeMs: Long,      // 跨重启累计（应用存活期）
    val bootCount: Int?,         // 系统开机次数，ROM 不提供时 null
    val rebootDetected: Boolean  // 本次进程存活期内检测到过重启
)
```

### 2. `service/DeviceUsageTracker.kt`（核心逻辑）
- 构造：`DeviceUsageTracker(context)`，内部创建 `DeviceUsageTracker.tickerClock: () -> Long`（默认 `SystemClock::elapsedRealtime`，测试注入虚拟时钟——仿 BatteryViewModel.elapsedClock L146 既有注入模式）
- SharedPreferences：沿用 `BatteryHardwareReader.PREFS_NAME` 同一 prefs 文件，key 蛇形命名：`usage_accumulated_ms` / `usage_last_elapsed_ms` / `usage_boot_count_last`
- `tick()`（每秒由 ViewModel 调用，**放在 telemetryPollingActive 门控之外**——后台存活期仍属"应用运行期"，且轮询循环 delay(1000) 后台不中断）：
  - 读当前 elapsed；BOOT_COUNT 变化（>上次值）→ 判定重启：保留 accumulated、重置 elapsed 引用、立即落盘、标记 rebootDetected；BOOT_COUNT 不可读时回退 `last > now` 单调比较
  - delta = now - last（防御性上限 24h），累加进 accumulated
  - 落盘节奏：每 10 拍 + 重启检测瞬间 + `flush()`；全链路 try-catch
- `readBootCount()`: `Settings.Global.getInt(resolver, Settings.Global.BOOT_COUNT)`，捕获 `Settings.SettingNotFoundException`/Throwable → null
- `flush()` + `snapshot(): DeviceUsageSnapshot`

### 3. `service/UsageDurationFormatter.kt`（纯函数，可单测）
`formatUsageDuration(ms: Long): String` → `X 天 X 小时` / `X 小时 X 分钟` / `X 分钟` / `不足 1 分钟`；`formatBootCount(n: Int?): String` → `N 次` / `系统未提供`。

### 4. `ui/DeviceUsageCard.kt`（Compose 卡片）
- 大字主行：累计使用时长（天/小时）；副行：本次开机时长 + 开机次数 + 重启检测角标
- 样式复用 BatteryScreen 既有卡片惯例：DesignTokens 令牌、Monospace、来源标注 `[实测]`、口径说明副文案（"累计=应用运行期真实累计，含息屏待机"）

## 修改文件

### 5. `viewmodel/BatteryViewModel.kt`
- `private val usageTracker = DeviceUsageTracker(application)` —— **内部创建，不改构造签名**（保护 `(Application)` 次构造器反射链与 19 个既有测试）
- 新增 `_deviceUsage = MutableStateFlow(initial)` + `val deviceUsage: StateFlow<DeviceUsageSnapshot>`
- `startTelemetryPolling()` while 循环内、`telemetryPollingActive` 门控**外**：`usageTracker.tick()` 后发布快照
- `onCleared()`：`historyStore.flush()` 之后追加 `usageTracker.flush()`（同样 try-catch）

### 6. `ui/BatteryScreen.kt`（总览 Tab LazyColumn）
在"关于 APP" item 前插入 `DeviceUsageCard(usage)`，usage 来自新 StateFlow collectAsState。

### 7. `res/values/strings.xml`
新增 key：`usage_card_title` / `usage_card_subtitle` / `usage_total_label` / `usage_uptime_label` / `usage_boot_count_label` / `usage_reboot_detected` / `usage_caveat`（文案全屏唯一，避免 onNodeWithText 多节点命中）。

## 测试（新增 1 个文件）

`test/java/com/battery/master/DeviceUsageTrackerTest.kt`（Robolectric，仿 BatteryHistoryStoreTest 模式）：
- 累加正确性（虚拟时钟推进 N 拍）
- 重启检测：注入 BOOT_COUNT 变化 → accumulated 保留、引用重置、落盘验证
- 回退路径：BOOT_COUNT 不可读时 last>now 判重启
- 持久化往返：新 tracker 实例从 prefs 恢复 accumulated
- Formatter 边界：0、59s、61min、24h+1s、多天多时
- Robolectric 下用 `Settings.Global.putInt(cr, BOOT_COUNT, n)` 注入

既有测试影响评估（已核实）：AppShellAuditTest / OverviewTabAuditTest / StartupCrashRegressionTest 均为语义断言（assertExists / isNotEmpty），无节点计数断言，新增卡片不破坏；VM 构造签名不变，30 处调用点安全。

## 验证

1. 本地：`cd android && ./gradlew testDebugUnitTest`（沙箱无 SDK 时由 CI 兜底）
2. CI：testDebugUnitTest 全绿 → assembleRelease → aapt2/签名/体积门禁 → KVM 仪器化 MainActivitySmokeTest（新卡挂载冒烟可顺带覆盖总览 Tab 渲染）
3. 手动验收清单（真机）：冷启看卡显示 → 息屏数分钟回来时长应增长 → 重启手机后累计不丢且开机次数 +1 → 清后台杀进程后累计落盘恢复
4. Web 端不受影响（本次不改 Web）

## 明确不做

- 不加亮屏时间统计（需 UsageStats 特殊权限，用户已选不加）
- 不虚构出厂首开时间；BOOT_COUNT 缺失显示"—"而非编造
- 不改 Web 端与 CI 工作流
