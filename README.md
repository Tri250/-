# BatteryData · 电池数据

一个用 Jetpack Compose + [Miuix](https://github.com/miuix-kotlin-multiplatform/miuix) 写的小米风格电池工具：
实时读数、充电曲线、充电记录、健康度，以及给桌面小部件（主题格式）用的数据接口。

<p align="center">
  <img src="screenshots/01-overview.png" width="24%" />
  <img src="screenshots/02-curve.png" width="24%" />
  <img src="screenshots/10-menu.png" width="24%" />
  <img src="screenshots/03-dark.png" width="24%" />
</p>

## 功能

- **实时状态**：电量、电流、功率、电压、温度、充放电状态，1 秒级刷新
- **充放电曲线**：功率 / 电流 / 电压切换，可按住横滑切换指标
- **充电记录**：每次插拔自动记录起止电量、时长、平均/峰值功率、充入电能、反推电池容量
- **超级岛 / 流体云**：充电时在小米 HyperOS 顶部超级岛或 OPPO ColorOS 16+ 流体云胶囊显示电量 / 功率（可在「关于」里关闭；不支持设备自动回退系统实况通知）
- **健康度**：设计容量（手动 > 系统节点 > 机型库）、满电容量、循环次数
- **顶栏渐进模糊**：基于 SoftGlass + AGSL 逐级模糊，滚动时材质渐入、大标题收成小标题
- **桌面小部件接口**：只读 ContentProvider，见下文
- **应用内更新**：直接读 GitHub Releases，下载 APK 并拉起安装器

## 构建

需要 JDK 17+ 与 Android SDK（compileSdk 37）。

```bash
./gradlew :app:assembleDebug
# 产物：app/build/outputs/apk/debug/app-debug.apk
```

## 应用内更新

「关于 → 检查更新」读取

```
https://api.github.com/repos/Alittlejelly/BatteryData/releases/latest
```

- 版本比较用 `tag_name`（如 `v1.0.2`）与本地 `versionName` 逐段比对；
- 安装包取该 release 里第一个 `.apk` 资源，没有资源则退回 release 网页；
- 下载到 `cache/apk/`，通过 FileProvider 交给系统安装器（需要「安装未知应用」授权）。

### 发一个新版本

```bash
tools/release.sh 1.0.2 102 "修复 xxx"
```

脚本会改 `versionName` / `versionCode`、编译 **release** 变体、打 tag、推 main、用 `gh` 创建 Release 并上传 APK。
装过旧版本的机器下一次点「检查更新」就能直接下到这一版。

签名读取根目录的 `keystore.properties`（已在 `.gitignore` 里，不入库）：

```properties
storeFile=keysign/batterydata
storePassword=******
keyAlias=baterrydata
keyPassword=******
```

没有这个文件时 `assembleRelease` 会退回 debug 签名，方便他人 clone 后直接编译；
但**这种包和正式签名的包不能互相覆盖安装**，发布时必须用带密钥的环境。

## 桌面小部件接口（只读）

authority：`com.smalljelly.batterydata.widget`（已 `exported`、无需权限）

| URI | 内容 |
|---|---|
| `.../live` | 当前状态 1 行 |
| `.../last` | 最近一次充电 1 行 |
| `.../today` | 今日与累计统计 1 行 |
| `.../records` | 全部记录（最新在前） |

数值列一律是 `Int`/`Long`（`MatrixCursor` 的 `getInt` 遇到 `Float` 会崩），小数放大成整数：
`temperature_x10`（312 = 31.2℃）、`power_x100`、`energy_x100`、`voltage_x100`。

## 声明

数据来自系统 `BatteryManager` 与 `/sys/class/power_supply` 节点，不联网上传任何内容。
