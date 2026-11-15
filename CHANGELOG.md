# 更新日志 (Changelog)

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 风格，版本号遵循语义化版本。

## [Unreleased]

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
