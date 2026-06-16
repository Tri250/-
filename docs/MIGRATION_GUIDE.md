# 跨平台一致性改进指南

## 📖 概述

本指南帮助你将现有代码迁移到新的跨平台服务架构，确保 **爪爪连心❤️** 应用在 Android 和 Web 端的功能完全一致。

**版本**: 1.0.0
**更新日期**: 2026-06-04

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

这将安装新增的 Capacitor 插件：
- `@capacitor/camera` - 相机功能
- `@capacitor/preferences` - 安全存储

### 2. 配置环境变量

确保项目根目录有以下文件：
- `.env.development` - 开发环境
- `.env.production` - 生产环境
- `.env.staging` - 测试环境

### 3. 同步 Capacitor

```bash
npx cap sync android
```

---

## 📝 迁移指南

### 从 navigator.share 迁移到 ShareService

**旧代码**:
```typescript
const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({
      title: '分享标题',
      text: '分享内容',
      url: 'https://example.com'
    });
  } else {
    // 降级处理
    alert('您的浏览器不支持分享功能');
  }
};
```

**新代码**:
```typescript
import { ShareService } from '../lib/platformService';

const handleShare = async () => {
  const success = await ShareService.share({
    title: '分享标题',
    text: '分享内容',
    url: 'https://example.com',
    dialogTitle: '分享到'
  });

  if (!success) {
    // 已在服务内部处理降级
    console.log('分享失败或被取消');
  }
};
```

**优势**:
- ✅ 自动处理平台差异
- ✅ 优雅降级到剪贴板复制
- ✅ 统一错误处理

---

### 从 console.log 迁移到平台日志

**旧代码**:
```typescript
console.log('User logged in');
console.warn('API response slow');
console.error('Failed to load data', error);
```

**新代码**:
```typescript
import { isFeatureEnabled } from '../lib/featureFlags';

// 仅在开发模式或启用了调试日志时输出
if (isFeatureEnabled('ENABLE_DEBUG_MODE')) {
  console.log('[DEBUG] User logged in');
}

// 错误日志应该总是输出，但使用统一格式
console.error('[ERROR] Failed to load data:', error);
```

---

### 添加触觉反馈

**旧代码**:
```typescript
const handleButtonClick = () => {
  // 仅执行业务逻辑
  submitForm();
};
```

**新代码**:
```typescript
import { HapticsService } from '../lib/platformService';

const handleButtonClick = async () => {
  // 添加触觉反馈
  await HapticsService.medium();
  // 执行业务逻辑
  submitForm();
};

// 或者使用 HapticButton 组件
import { HapticButton } from '../components/ui/ShareButton';

<HapticButton
  onClick={submitForm}
  hapticStyle="medium"
>
  提交表单
</HapticButton>
```

---

### 相机权限处理

**旧代码**:
```typescript
const takePhoto = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = handleFileSelect;
  input.click();
};
```

**新代码**:
```typescript
import { CameraService } from '../lib/platformService';

const takePhoto = async () => {
  try {
    // 检查并请求权限
    const hasPermission = await CameraService.checkPermission();
    if (!hasPermission) {
      const granted = await CameraService.requestPermission();
      if (!granted) {
        alert('需要相机权限才能拍照');
        return;
      }
    }

    // 获取照片（Base64 格式）
    const imageData = await CameraService.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: 'base64'
    });

    if (imageData) {
      // 处理照片
      processImage(imageData);
    }
  } catch (error) {
    console.error('拍照失败:', error);
  }
};
```

---

### 本地存储迁移

**旧代码**:
```typescript
// 直接使用 localStorage
localStorage.setItem('user_token', token);
const token = localStorage.getItem('user_token');
localStorage.removeItem('user_token');
```

**新代码**:
```typescript
import { StorageService } from '../lib/platformService';

// 设置值
await StorageService.set('user_token', token);

// 获取值（带默认值）
const token = await StorageService.get<string>('user_token', '');

// 删除值
await StorageService.remove('user_token');

// 清空所有
await StorageService.clear();
```

**优势**:
- ✅ Android 使用安全的 Capacitor Preferences
- ✅ Web 降级到 localStorage
- ✅ 自动序列化/反序列化

---

### 通知功能

**旧代码**:
```typescript
if (Notification.permission === 'granted') {
  new Notification('标题', {
    body: '内容',
    icon: '/icon.png'
  });
}
```

**新代码**:
```typescript
import { NotificationService } from '../lib/platformService';

// 检查权限
const hasPermission = await NotificationService.checkPermission();
if (!hasPermission) {
  const granted = await NotificationService.requestPermission();
  if (!granted) return;
}

// 发送通知
await NotificationService.show({
  title: '标题',
  body: '内容',
  id: Date.now()
});
```

---

### 功能开关使用

**示例：在组件中条件渲染**

```typescript
import { isFeatureEnabled } from '../lib/featureFlags';

function AIConsultantPage() {
  return (
    <div>
      {/* AI 咨询始终显示 */}
      <AIConsultation />

      {/* 高级功能根据平台启用 */}
      {isFeatureEnabled('ENABLE_HEALTH_ALERTS') && (
        <HealthAlerts />
      )}

      {/* 仅在移动端显示 */}
      {isFeatureEnabled('ENABLE_NATIVE_CAMERA') && (
        <CameraButton />
      )}
    </div>
  );
}
```

**示例：在服务中条件执行**

```typescript
import { isFeatureEnabled } from '../lib/featureFlags';

async function uploadFile(file: File) {
  // 始终上传文件

  // 仅在支持时发送推送通知
  if (isFeatureEnabled('ENABLE_PUSH_NOTIFICATIONS')) {
    await sendUploadNotification();
  }

  // 仅在移动端启用分析
  if (isFeatureEnabled('ENABLE_BACKGROUND_SYNC')) {
    await scheduleBackgroundSync();
  }
}
```

---

## 🎯 最佳实践

### 1. 始终使用平台服务

❌ **不要**:
```typescript
if (isAndroid) {
  // Android 特定代码
} else {
  // Web 代码
}
```

✅ **应该**:
```typescript
import { PlatformServices } from '../lib/platformService';
await PlatformServices.haptics.medium();
```

### 2. 提供优雅降级

❌ **不要**:
```typescript
const image = await Camera.getPhoto(); // 在 Web 上会失败
```

✅ **应该**:
```typescript
const imageData = await CameraService.getPhoto();
// 自动处理平台差异和错误
```

### 3. 统一错误处理

✅ **应该**:
```typescript
try {
  await someNativeFunction();
} catch (error) {
  // 使用统一的错误格式
  console.error('[ServiceName] Operation failed:', error);
  // 提供用户友好的提示
  showToast('操作失败，请重试');
}
```

### 4. 使用功能标志

✅ **应该**:
```typescript
if (isFeatureEnabled('ENABLE_DEBUG_MODE')) {
  console.log('Debug info:', data);
}
```

❌ **不要**:
```typescript
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}
```

### 5. 权限检查

✅ **应该**:
```typescript
const hasPermission = await PermissionService.checkCamera();
if (!hasPermission) {
  const granted = await PermissionService.requestCamera();
  if (!granted) return;
}
// 继续执行
```

---

## 🔧 故障排除

### 问题：Android 构建失败

**解决方案**:
1. 清理构建缓存：
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

2. 重新同步：
   ```bash
   npx cap sync android
   ```

3. 重新构建：
   ```bash
   npx cap copy android
   cd android && ./gradlew assembleDebug
   ```

### 问题：Web 端找不到模块

**解决方案**:
1. 确保所有导入路径正确：
   ```typescript
   // ✅ 正确
   import { ShareService } from '../lib/platformService';

   // ❌ 错误
   import { ShareService } from 'platformService';
   ```

2. 检查 TypeScript 配置：
   ```bash
   npm run check
   ```

### 问题：权限请求无响应

**解决方案**:
1. 检查 AndroidManifest.xml 是否正确声明权限
2. 确保权限名称与代码中一致
3. Android 6.0+ 需要运行时请求权限

---

## 📊 测试清单

### 功能测试

- [ ] 分享功能在 Android 和 Web 都正常工作
- [ ] 触觉反馈在 Android 上触发
- [ ] 相机拍照功能跨平台一致
- [ ] 通知在 Android 上原生显示
- [ ] 数据存储在两个平台都正确

### 性能测试

- [ ] 页面加载时间对比
- [ ] 动画流畅度（60 FPS）
- [ ] 内存占用

### 兼容性测试

- [ ] Android 7.0+ (API 24)
- [ ] Android 14+ (API 34)
- [ ] Chrome、Firefox、Safari
- [ ] iOS 13+ (如果适用)

---

## 📚 更多资源

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Android 权限指南](https://developer.android.com/training/permissions/requesting)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

**最后更新**: 2026-06-04
**维护者**: 带娃的小陈工
