# Android Battery Master v1.2.0 · 发布文案包

> 版本主题：**UI/UX 设计体系全面焕新**（Android 端 · 玻璃拟态 HUD）
> 适用渠道：GitHub Release / 应用商店 / 社区公告 / 社交媒体

---

## 一、版本主标语（三选一）

| 方案 | 文案 | 适用场景 |
| :---: | :--- | :--- |
| A（推荐） | **「一块玻璃，看见电流的呼吸。」** —— v1.2.0 全面焕新电池监测界面 | 海报封面 / 社媒大字 |
| B | 玻璃拟态 × 赛博 HUD：你的电池数据从未如此清晰 | 商店副标题 |
| C | 不止监测电池，更要好看地监测电池 | 社区公告开头 |

---

## 二、GitHub Release 完整版文案（可整段粘贴）

```markdown
## 🎨 Android Battery Master v1.2.0 — UI/UX 设计体系全面焕新

这一次，我们把 12 项电池遥测装进了一套全新的「玻璃 HUD」里。
全站界面以 AMOLED 暗色玻璃拟态重构，双端设计彻底统一，
每一瓦电流、每一毫伏电压，都以更沉浸、更有质感的方式呈现。

### ✨ 四大更新亮点

**① 统一设计令牌 —— 双端像素级一致**
Web 端 `@theme` 与 Android 端 `DesignTokens.kt` 一一对应：品牌色板（充电 emerald / 放电 sky / 充满 teal / 警告 amber / 危险 rose / HAL cyan）、7 级字号阶梯（10–68sp）、4 级圆角、三级动效时长（微交互 150–250ms / 转场 250–350ms / Hero 700ms），彻底消灭散落的硬编码色值与字号。

**② 玻璃拟态体系 —— 界面全面玻璃化**
半透明底 + 背景模糊 + 细描边 + 顶部 1px 切面高光「四件套」，Hero 卡片、指标卡、硬件实验室面板全部玻璃化，AMOLED 屏幕上呈现出通透的悬浮层次感。

**③ 分层动效体系 —— 让数据"动"起来**
指标网格 45ms 阶梯错落入场、电量读数 700ms 缓动滚动、充电氛围双层呼吸光晕、遥测曲线霓虹辉光 + 最新点脉冲、健康进度条流光条纹、按钮按压回弹——全站动效遵循系统 `prefers-reduced-motion` 无障碍自动降级。

**④ 品牌化细节 —— 每一处交互都有回应**
品牌 focus-visible 焦点环、霓虹拇指 + 聚焦光环的品牌化滑杆、等宽 tabular-nums 数字读数杜绝跳动、Material3 colorScheme 完整映射设计令牌。

### 📦 发布资产
| 资产 | 说明 |
| --- | --- |
| `Android-Battery-Master-v1.2.0-release.apk` | 正式签名 APK（R8 混淆 + 资源收缩，可直接安装） |
| `web-demo-dist.zip` | Web 演示端静态产物 |
| `SHA256SUMS.txt` | 全部资产校验和 |

### 🔄 从旧版本升级
`versionCode` 单调递增，直接覆盖安装 v1.0.0 / v1.1.x 即可，数据不丢失。仍为 **0 运行时权限**，请放心升级。
```

> 注：CI（`softprops/action-gh-release`）会自动追加提交记录与资产校验；以上为正文部分。

---

## 三、应用商店文案

**简短版（≤80 字，用于商店一句话简介）：**

> 12 项电池指标全量实时遥测。v1.2.0 全新玻璃拟态界面：统一设计令牌、分层动效、品牌化交互，AMOLED 暗色 HUD 焕然一新。

**完整版（商店详情页）：**

> **安卓电池管家（Android Battery Master）** 是专业的 Android 原生电池充放电监测与健康诊断应用，零权限读取 12 项核心指标：健康度、剩余电量、当前/设计容量、电量百分比、充放状态、温度、健康状态、电压、循环计数、瞬时电流与完全充满容量。
>
> **v1.2.0 界面全面焕新：**
> - 全新玻璃拟态 HUD——半透明玻璃卡片悬浮于 AMOLED 深空之上，1px 切面高光勾勒质感；
> - 双端统一设计令牌——Android 与 Web 端色板、字号、圆角、动效一一对应，观感完全一致；
> - 分层动效——数字读数缓动滚动、指标阶梯入场、充电呼吸光晕、遥测曲线霓虹辉光；
> - 品牌化细节——霓虹滑杆、品牌焦点环、等宽数字，每一处交互都有回应。
>
> 无广告、无追踪、零运行时权限；电池数据全部来自系统公开 API 与 sysfs 真实硬件通道。

---

## 四、社交媒体短文案

**微博 / 朋友圈版：**

> 🔋 安卓电池管家 v1.2.0 发布！这次不是加功能，是"换皮肤"——整套 UI 重构为 AMOLED 玻璃拟态 HUD：玻璃卡片、霓虹遥测曲线、呼吸充电光晕、700ms 缓动数字滚动。0 权限、12 项电池指标照常全量遥测。Android 8.0+ 可装，欢迎升级体验 ✨

**X / Twitter 版：**

> v1.2.0 is out 🎨
> Full glassmorphism UI overhaul for Android Battery Master:
> ◆ unified design tokens (Compose ↔ Web)
> ◆ glass panels with 1px edge highlight
> ◆ layered motion: 700ms hero count-up, 45ms stagger, breathing glow
> Still 12 battery metrics, 0 permissions.

---

## 五、更新日志（Changelog 条目式）

```
v1.2.0 · 2026-11
[新增] 统一设计令牌体系：DesignTokens.kt ↔ Web @theme，色板/字号/圆角/动效全对齐
[新增] 玻璃拟态界面体系：Hero 卡片、指标卡、实验室面板全面玻璃化（半透明 + 模糊 + 描边 + 切面高光）
[新增] 分层动效：45ms 阶梯入场 / 700ms Hero 滚动 / 呼吸光晕 / 霓虹辉光 / 流光条纹 / 按压回弹
[新增] 品牌化细节：品牌焦点环、霓虹滑杆、tabular-nums 等宽数字、Material3 colorScheme 令牌映射
[优化] 全站移除硬编码色值与散落字号，遵循 prefers-reduced-motion 无障碍降级
```
