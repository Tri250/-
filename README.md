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
| **01** | **电池健康度** | 算法：`当前实际容量 / 出厂设计容量 × 100%`，结合电量计芯片健康度诊断。 |
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
# 示例：当前版本 versionName=1.1.2 (versionCode=4)
git tag v1.1.2
git push origin v1.1.2
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
