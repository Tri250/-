# Android Battery Master (安卓原生应用工程)

本项目为基于 **Kotlin + Jetpack Compose + Material Design 3** 架构构建的 Android 原生电池充放电检测应用。

---

## 📱 12 项功能特点与 Android 原生底层映射

1. **电池健康度（%）**：
   - 算法：`currentCapacityMah / designCapacityMah * 100f`
   - 计算可用活性容量与出厂标称的比值。
   - v2.0.0-alpha.1 诚实口径：健康度是多少就是多少——电量计节点（探测链 bms/maxfg/battery）不可读时显示"无法测算"，不再按出厂保持率（0.92）虚构健康度。

2. **剩余电量（mAh）**：
   - 原生接口：`batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)`（微安时换算为毫安时）。

3. **电池当前容量（mAh）**：
   - 原生接口：读取 Linux sysfs 节点 `/sys/class/power_supply/battery/charge_full` 或系统库仑计容量。

4. **电池设计容量（mAh）**：
   - 支持从系统硬件信息读取或配置自定义出厂额定容量。

5. **电量百分比（%）**：
   - 原生接口：广播 `Intent.ACTION_BATTERY_CHANGED` 中提取 `BatteryManager.EXTRA_LEVEL` 与 `BatteryManager.EXTRA_SCALE`。

6. **电池状态**：
   - 原生接口：`BatteryManager.EXTRA_STATUS`，映射 `BATTERY_STATUS_CHARGING`（充电中）、`BATTERY_STATUS_DISCHARGING`（放电中）、`BATTERY_STATUS_FULL`（已充满）、`BATTERY_STATUS_NOT_CHARGING`（未充电）。

7. **电池温度（℃）**：
   - 原生接口：`BatteryManager.EXTRA_TEMPERATURE`（单位 0.1℃，除以 10.0f 获取标准摄氏度）。

8. **电池健康状况**：
   - 原生接口：`BatteryManager.EXTRA_HEALTH`，涵盖 `GOOD`（良好）、`OVERHEAT`（过热）、`DEAD`（损坏）、`OVER_VOLTAGE`（超压）、`UNKNOWN`（未知）。

9. **电压（mV）**：
   - 原生接口：`BatteryManager.EXTRA_VOLTAGE`（毫伏毫伏级别测量）。

10. **循环计数**：
    - 原生接口：Android 14+（API 34）支持 `BatteryManager.EXTRA_CYCLE_COUNT`，低版本回退读取 `/sys/class/power_supply/battery/cycle_count`。

11. **瞬时电流（mA）**：
    - 原生接口：`batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)`（微安除以 1000）。正值表示充电流入，负值表示放电消耗。

12. **完全充满时的容量（mAh）**：
    - **判定逻辑**：`percentage == 100 && currentNowMa in 0..25`。
    - 仅当电量为 100% 且电流回落至 0~25 mA 浮充截止区间时，判定充满并固化记录此时的实际容量。
    - v1.2.1 全量自检：轮询/广播双通道解析收敛为单一 `BatteryTelemetryParser`（语义零漂移）；电量百分比强制归一化 0~100（修复 ROM 上报 level > scale 时判定永久失效）；`charge_full` 增加合理区间校验，非法容量/时间戳拒绝锁定与持久化；退出硬件实验室不再泄漏模拟容量；回归测试 `FullChargeCapacityTest` 全覆盖。
    - v1.2.2 整体全量自检：稳定性（协程/Receiver/异常兜底）、性能（缓存与 1Hz 轮询）、兼容性（API 分级守卫）、权限（应用声明零运行时/危险权限 + 备份排除）、安装卸载（versionCode=7 时点值单调递增 + CI aapt2 安装属性自检）五维审计确认完备，详见根 README。

---

## 🖥️ 界面中文化与关于卡片 (v1.2.3)

- 顶栏标题中文化：`ANDROID BATTERY MASTER` → **电池大师**；副标题中文化（v1.2.6 起修正为「API xx 电池管理服务 · 原生硬件遥测」，不再宣称 AIDL HAL 直连）。
- 状态总览页新增「关于 APP」功能说明卡片：功能清单 / 数据来源 / 权限声明 / 开发者署名，版本徽章经 `BuildConfig` 单源注入。

---

## 👨‍💻 开发者

- **某厂大牛马【带娃的小陈工】** — 抖音 / 小红书 平台

---

## 🛠️ 如何在 Android Studio 中打开与编译

1. 启动 **Android Studio (Ladybug / Koala 或更高版本)**。
2. 选择 **File -> Open**，选择本项目根目录下的 `android` 文件夹。
3. 等待 Gradle Sync 完成。
4. 连接 Android 手机（需开启 USB 调试模式）或启动内置 Android 虚拟设备（AVD）。
5. 点击上方绿色运行按钮 `Run 'app'`，即可安装至真机并实时采集原生硬件电池信息。
