# 机型矩阵回归验收清单 (Device Matrix)

> 版本：v2.0.0-beta.1（P0 GA 修复交付物）
> 适用：Android Battery Master（电池大师）`com.battery.master`
> 关联：CI 仪器化测试 job（`.github/workflows/build-apk.yml#instrumented`）+ Firebase Test Lab 云真机矩阵（stub，待项目开通）

## 1. 为什么需要机型矩阵

电池数据采集深度依赖 OEM 差异：

| 差异源 | 影响指标 | 已知风险 |
| --- | --- | --- |
| sysfs 电量计节点路径（`/sys/class/power_supply/battery/` 下节点命名） | 当前容量 / 健康度（指标 01/03） | 高通 `bms`、三星 `maxfg`、联发科 `dc` 平台节点不在标准 battery 目录 |
| `BATTERY_PROPERTY_CURRENT_NOW` 支持性 | 瞬时电流 / 充满判定（指标 11/12） | 不支持的机型返回 `Int.MIN_VALUE`，必须显示 "—" 而非 0 mA |
| `EXTRA_VOLTAGE` 广播字段缺失 | 电压 / 功率（指标 09/P） | 需回退 sysfs `voltage_now`；双通道全缺时显示 "—" 不虚构 |
| PowerProfile 反射可用性 | 设计容量（指标 04） | 部分 OEM ROM 抛 `ExceptionInInitializerError`，须按 Throwable 兜底 |
| ROM 对动态注册广播的限制 | 广播通道 | 注册失败必须退化为纯轮询通道，不得崩溃 |
| 充电电流符号约定 | 充满判定 | 高通/三星部分内核放电上报负值，判定已改为符号无关（\|I\| ≤ 25 mA） |

本清单按**设备能力差异**（而非品牌列表）划分为 8 类，覆盖全部已知采集分支。

## 2. 八类设备验收矩阵

每类设备的验收用例 = 通用冒烟（第 3 节）+ 该类专项用例。✅ = 必须通过；— = 不适用。

| # | 设备类 | 代表机型 | API 档 | 专项验收点 | 通过标准 |
| --- | --- | --- | --- | --- | --- |
| 1 | 标准 Pixel 系（高通，sysfs 标准 battery 目录） | Pixel 6/7/8 | 33~36 | 全指标实测链路；`bms` 节点 charge_full 可读 | 健康度/当前容量显示实测值并标注 "sysfs 实测"；充满判定可锁定 REAL |
| 2 | 三星 Galaxy 系（`maxfg` 节点，负电流上报） | Galaxy S23/S24 | 33~35 | `maxfg` 节点探测链命中；放电负值符号无关判定 | 电量计节点显示 "maxfg"；放电至 100% 拔线不误判充满 |
| 3 | 联发科天玑系（`dc` 平台，节点非标准路径） | Redmi Note 13 / 天玑机型 | 31~34 | `dc` 平台 charge_full_design 探测 | 设计容量来源不落 FALLBACK（PowerProfile 或 sysfs） |
| 4 | 电量计全不可读机型（node 全链路缺失） | 部分小众 ROM / 模拟器 | 26~36 | 诚实降级：健康度 "无法测算"、不虚构 0.92 | 指标 01/03 显示 "—"；库仑计回归/单点估算通道可接管 |
| 5 | CURRENT_NOW 不支持机型 | 低端 Go 设备 / 部分 AOSP | 26~30 | 电流 null 三态判定 | 电流显示 "—"；充满判定 CURRENT_UNAVAILABLE，估算值不写盘 |
| 6 | 双电芯 / 高压快充机型（8.8V 级） | 华为/荣耀部分旗舰 | 30~34 | 电压滑杆区间、双电芯容量展示 | 电压不越界钳制；功率 P = V×I 方向随符号 |
| 7 | 折叠屏 / 大屏（配置变更） | Galaxy Z Fold 5 / Pixel Fold | 33~36 | 旋转/折叠重建：Tab 停留、对话框不丢、历史不丢 | `rememberSaveable` Tab 上下文保留；遥测历史跨重建连续 |
| 8 | Android Go / 低内存设备（26 下限） | Android Go 26~30 | 26~30 | 启动不崩溃（Throwable 兜底链）、1Hz 轮询降级 | 冷启动成功率 100%；退后台轮询暂停（v1.2.4 门控生效） |

### 每类通用冒烟（继承 CI 仪器化测试）

1. `MainActivitySmokeTest.appLaunchesAndShowsOverviewHero` — 冷启动首帧；
2. `MainActivitySmokeTest.allFourTabsNavigateWithoutCrash` — 四 Tab 导航；
3. `MainActivitySmokeTest.telemetryTabRendersSessionHistoryCard` — 遥测会话卡挂载；
4. 遥测历史持久化：前后台切换 + 进程杀掉重启后，曲线从 JSONL 尾部接续；
5. CSV 导出分享：导出曲线/会话 CSV 均弹出系统分享面板。

## 3. CI 模拟器回归（已落地）

`.github/workflows/build-apk.yml` 的 `instrumented` job 在每次 push/PR/tag 时：

- Ubuntu KVM 模拟器 API 30 (x86_64, google_apis 镜像——自带电池服务，粘性广播可投递)；
- `connectedDebugAndroidTest` 执行上述仪器化用例；
- `release` job `needs: [android, web, instrumented]`——仪器化不通过不出包。

## 4. Firebase Test Lab 云真机矩阵（stub，待开通）

云真机按第 2 节矩阵选型（每类 1 台，共 8 台；CI 预算受限时可先跑 1/2/5/8 四类）。
开通后在 `.github/workflows/build-apk.yml` 取消注释 `Run Device Matrix On Firebase Test Lab (stub)` 步骤并：

```bash
gcloud auth activate-service-account --key-file="$FIREBASE_SERVICE_ACCOUNT"
gcloud --quiet firebase test android run \
  --type instrumentation \
  --app android/app/build/outputs/apk/debug/app-debug.apk \
  --test android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk \
  --device model=Pixel2,version=30,locale=zh_CN,orientation=portrait \
  --device model=redfin,version=33,locale=zh_CN,orientation=portrait \
  --device model=shiba,version=34,locale=zh_CN,orientation=portrait \
  --device model=a51,version=31,locale=zh_CN,orientation=portrait \
  --use-orchestrator \
  --environment-variables clearPackageData=true \
  --directories-to-pull /sdcard \
  --timeout 10m
```

Test Lab 可用机型查询：`gcloud firebase test android models list`。
验收失败判定：任一设备任一用例 failed / crashed / not-run 即矩阵回归失败。

## 5. 记录

| 日期 | 版本 | 矩阵范围 | 结论 |
| --- | --- | --- | --- |
| 2026-11-16 | v2.0.0-beta.1 | CI 模拟器 API 30 (x86_64) | 首次纳入发布门禁；云真机矩阵待 Firebase 开通 |
