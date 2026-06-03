# CI/CD 配置说明

## ✅ 已配置项

### GitHub Actions 自动构建工作流
- 文件位置：[`.github/workflows/build-android.yml`](file:///workspace/.github/workflows/build-android.yml)
- 触发条件：
  - 推送到 `main`/`develop` 分支
  - 提交 PR 到 `main` 分支
  - 手动触发 (`workflow_dispatch`)

### 流水线分为两个阶段
1. **Validate & Test**：类型检查 (`npm run check`) + 单元测试 (`npm run test`)
2. **Build Android APK**：构建 Debug 和 Release APK

### 兼容性更新
- 文件位置：[`android/variables.gradle`](file:///workspace/android/variables.gradle#L2)
- Min SDK: 23 (Android 7.0) → **与仓库最初配置保持一致**

## 📋 下一步操作指南

### 1. 推送到仓库
```bash
git commit -m "ci: 完善自动构建与推送触发"
git push origin trae/solo-agent-DFainO
```

### 2. 合并到 main 分支
当你准备好时，将该分支合并到 `main`，GitHub Actions 会自动开始构建。

### 3. 获取构建产物
在 Actions 页面可以下载：
- `pawsync-pro-debug-apk`：调试版 APK（30 天保留）
- `pawsync-pro-release-unsigned-apk`：未签名的发布版 APK（30 天保留）
- `build-reports`：构建报告（7 天保留）

## ⚙️ 扩展配置（可选）

### 如果需要 Release 自动签名
在仓库 `Settings → Secrets and variables → Actions → Secrets` 中添加以下变量：
- `ANDROID_KEYSTORE_BASE64`：Base64 编码的签名密钥文件
- `ANDROID_KEYSTORE_PASSWORD`：密钥库密码
- `ANDROID_KEY_ALIAS`：密钥别名
- `ANDROID_KEY_PASSWORD`：密钥密码

### 分支策略建议
- `main`：生产构建分支
- `develop`：开发构建分支（已配置触发）
- `feature/*`：功能分支，仅在合并 PR 时构建验证
