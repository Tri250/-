# 性能基线与体积预算 (Performance Baselines)

> 版本基准：v2.0.0-beta.1 · 建立：2026-11-16
> 关联：CI `build-apk.yml#android` job 的 "APK Size Gate" 步骤 + 关于卡版本徽章

## 1. APK 体积预算

| 指标 | 基线值 | 告警阈值 (CI warning) | 硬上限 (CI fail) | 说明 |
| --- | --- | --- | --- | --- |
| release APK (R8 全量混淆+资源收缩) | 记录于本表下方"实测记录" | 25 MB | 35 MB | 超硬上限即构建失败 |

预算依据：本应用仅依赖 Compose + AndroidX 核心（无图片资源、无 WebView、无网络栈），R8 后合理体积 < 15 MB；35 MB 硬上限留出 2 倍冗余防意外膨胀（如误放宽 keep 规则、引入新依赖）。

任何新增依赖须在 PR 说明中评估体积影响；>2 MB 的依赖必须说明必要性（项目信条避免三方依赖）。

### 实测记录

| 日期 | 版本 | 体积 | 备注 |
| --- | --- | --- | --- |
| 2026-11-16 | v2.0.0-beta.1 | **1.18 MB**（app-release.apk，R8 全量混淆 + 资源收缩，debug 密钥兜底签名） | 体积门禁上线基线；距 25 MB 告警阈值余量 >20× |

## 2. 运行时性能预算

| 指标 | 预算 | 当前实现 | 状态 |
| --- | --- | --- | --- |
| 主线程 1Hz 轮询单拍耗时 | < 5 ms (p95) | sysfs 节点顺序读取 + 解析，单拍 ~1-2 ms | ✅ 预算内 |
| 历史落盘 | 不阻塞主线程 | 发布源头打点后由 daemon 单线程异步写 JSONL | ✅ |
| 冷启动到首帧 | < 800 ms (中端机) | Compose 直渲染，无启动图 IO；构造期全 Throwable 兜底 | ✅ |
| 内存滑窗 | 历史 ≤120 点内存态 | VM StateFlow 整列表快照替换 | ✅ |
| 前后台耗电 | 退后台零自轮询 | v1.2.4 轮询生命周期门控（广播通道保留） | ✅ |
| 模拟倒计时空转 | 无模拟时 500ms 低频 | v1.2.5 降频修复 | ✅ |

## 3. 持久化 IO 预算（v2.0.0-beta.1 新增链路）

| 操作 | 频率 | 成本 | 防护 |
| --- | --- | --- | --- |
| 样本 JSONL 追加 | ≤2.5 次/秒 (400ms 节流) | 单行 ~100B append | daemon 线程；磁盘满 Throwable 兜底 |
| 样本文件轮转 | 每 ~4000 行重写保留 3000 行 | 一次性 ~300KB 重写 | 计数器触发，不每拍检查 |
| 会话 JSONL 追加 | 会话闭合时 1 次 | 单行 ~200B | 同上 |
| CSV 导出 | 用户点击触发 | 全量读文件 + 写缓存目录 | Dispatchers.IO；空历史返回 null 不产空文件 |
| 启动回填 | 每次冷启动 1 次 | 尾部 ≤200 行读取 | 解析失败按空处理，不阻塞启动 |

## 4. 崩溃捕获预算（v2.0.0-beta.1 新增）

- 单份崩溃文件 < 100 KB（堆栈文本），保留最近 10 份，超出滑窗删除；
- 写盘在默认崩溃链之前完成（try/Throwable 包裹，失败不阻塞崩溃退出）；
- 零网络：捕获器无任何上传路径。

## 5. 回归方法

1. **体积**：CI `APK Size Gate` 自动执行；本地 `ls -l android/app/build/outputs/apk/release/`；
2. **轮询单拍**：Robolectric 单测 `StartupCrashRegressionTest` 覆盖构造/发布链路稳定性；真机用 `adb shell dumpsys gfxinfo com.battery.master` 抽查；
3. **IO 回归**：`BatteryHistoryStoreTest` / `BatteryHistoryPersistenceIntegrationTest` 全绿即回归通过；
4. 新增性能敏感代码：在本表追加预算行 + 说明防护措施，不得只凭感觉。
