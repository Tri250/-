# PawSync Pro 动画系统使用指南

## 概述

PawSync Pro 应用已添加完整的交互动画系统，包含 22+ 种动画效果和 7 个可复用动画组件。

## 文件结构

### 创建的文件

1. **CSS 动画系统**
   - `/workspace/src/styles/animations.css` - 包含所有核心动画定义

2. **动画组件** (位于 `/workspace/src/components/animations/`)
   - `WaveformAnimation.tsx` - 情感声波可视化
   - `EmotionPulse.tsx` - 情感脉冲效果
   - `CardAnimations.tsx` - 卡片交互和骨架屏
   - `RecordButton.tsx` - 录音按钮动画
   - `SuccessAnimation.tsx` - 成功/错误反馈动画
   - `PageTransition.tsx` - 页面过渡动画
   - `index.ts` - 组件导出文件

3. **更新的文件**
   - `/workspace/src/index.css` - 添加动画工具类
   - `/workspace/src/main.tsx` - 导入动画样式

## 动画列表

### 基础动画 (CSS 类)

| 动画类名 | 描述 | 用途 |
|---------|------|------|
| `.animate-fade-in` | 淡入动画 | 元素进入时的基础动画 |
| `.animate-breathe` | 呼吸动画 | 录音按钮、活动状态指示 |
| `.animate-pulse-indicator` | 脉冲环动画 | 在线状态指示器 |
| `.animate-heartbeat` | 心跳动画 | 情感翻译模块 |
| `.animate-shake` | 摇晃动画 | 警告、错误提示 |
| `.animate-bounce-once` | 单次弹跳 | 成功反馈 |
| `.animate-spin` | 旋转动画 | 加载状态 |
| `.animate-ripple` | 波纹扩散 | 录音状态、点击反馈 |
| `.animate-slide-in-right` | 右滑入 | 侧边栏、通知 |
| `.animate-slide-in-left` | 左滑入 | 返回导航 |
| `.animate-slide-in-up` | 上滑入 | 弹窗、模态框 |
| `.animate-slide-in-down` | 下滑入 | 下拉菜单 |
| `.animate-scale-in` | 缩放弹入 | 弹窗、卡片 |
| `.animate-gradient` | 渐变流动 | 背景装饰 |
| `.animate-blink` | 闪烁动画 | 重要提示 |
| `.animate-float` | 浮动动画 | 装饰元素 |
| `.animate-scale-pulse` | 缩放脉冲 | 强调效果 |
| `.animate-glow` | 发光动画 | 按钮、图标 |
| `.animate-typewriter` | 打字机 | 文字动画 |
| `.animate-fade-out` | 淡出动画 | 元素离开 |
| `.animate-rotate-scale` | 旋转缩放 | 加载、强调 |
| `.animate-color-shift` | 颜色渐变 | 装饰效果 |

### 工具类

| 类名 | 描述 |
|------|------|
| `.gpu-accelerated` | 启用GPU加速优化 |
| `.transition-smooth` | 平滑过渡效果 |
| `.hover-lift` | 悬停上浮效果 |
| `.active-scale` | 点击缩放效果 |
| `.loading-dots` | 加载点动画 |
| `.stagger-container` | 列表交错入场 |
| `.btn-ripple` | 按钮波纹效果 |
| `.card-glow` | 卡片悬停发光 |
| `.gradient-border` | 渐变边框 |

## 使用示例

### 1. 声波动画组件

```tsx
import { WaveformAnimation } from '@/components/animations';

// 在情感仪表板中使用
<WaveformAnimation
  isActive={isRecording}
  emotion="happy" // happy | anxious | angry | needs | neutral
  barCount={20}
  height={60}
/>
```

### 2. 情感脉冲组件

```tsx
import { EmotionPulse } from '@/components/animations';

// 显示宠物当前情绪
<EmotionPulse
  emotion="happy"
  isActive={true}
  size="large" // small | medium | large
/>
```

### 3. 卡片动画

```tsx
import { CardAnimation, CardSkeleton, AnimatedCard } from '@/components/animations';

// 悬停效果卡片
<CardAnimation type="hover">
  <div>卡片内容</div>
</CardAnimation>

// 点击效果卡片
<CardAnimation type="click">
  <button>可点击</button>
</CardAnimation>

// 入场动画卡片
<CardAnimation type="enter">
  <div>入场动画</div>
</CardAnimation>

// 加载骨架屏
<CardSkeleton count={3} />

// 延迟入场卡片
<AnimatedCard delay={200}>
  <div>延迟200ms入场</div>
</AnimatedCard>
```

### 4. 录音按钮

```tsx
import { RecordButton } from '@/components/animations';

<RecordButton
  isRecording={isRecording}
  onClick={toggleRecording}
  size="large" // small | medium | large
  disabled={false}
/>
```

### 5. 成功/错误反馈

```tsx
import { SuccessAnimation, ErrorAnimation } from '@/components/animations';

// 成功动画
<SuccessAnimation
  show={showSuccess}
  message="情感分析完成"
  duration={2000}
  onClose={() => setShowSuccess(false)}
/>

// 错误动画
<ErrorAnimation
  show={showError}
  message="网络连接失败"
  onClose={() => setShowError(false)}
/>
```

### 6. 页面过渡

```tsx
import { PageTransition, StaggeredList } from '@/components/animations';

// 页面过渡
<PageTransition mode="in" direction="up">
  <div>页面内容</div>
</PageTransition>

// 交错列表动画
<StaggeredList staggerDelay={100}>
  <div>项目1</div>
  <div>项目2</div>
  <div>项目3</div>
</StaggeredList>
```

### 7. CSS 类直接使用

```tsx
// 淡入动画
<div className="animate-fade-in">
  淡入内容
</div>

// 带延迟的淡入
<div className="animate-fade-in animate-delay-200">
  延迟200ms淡入
</div>

// 悬停上浮
<div className="hover-lift">
  悬停时上浮
</div>

// GPU加速优化
<div className="gpu-accelerated animate-spin">
  优化的旋转动画
</div>

// 列表交错入场
<div className="stagger-container">
  <div>项目1</div>
  <div>项目2</div>
  <div>项目3</div>
</div>

// 按钮波纹效果
<button className="btn-ripple">
  点击查看波纹
</button>

// 卡片发光效果
<div className="card-glow p-4">
  悬停发光
</div>
```

## 设计原则

### 1. 性能优化

- ✅ 使用 `transform` 和 `opacity` 实现动画（GPU加速）
- ✅ 添加 `.gpu-accelerated` 类启用硬件加速
- ✅ 使用 `will-change` 提示浏览器优化
- ✅ 避免触发布局变化的属性动画

### 2. 用户体验

- ✅ 动画时长控制在 100ms - 1000ms 之间
- ✅ 提供多种缓动函数（弹性、平滑等）
- ✅ 支持延迟动画，实现交错效果
- ✅ 尊重用户偏好（`prefers-reduced-motion`）

### 3. 可访问性

- ✅ 所有动画支持 `prefers-reduced-motion` 媒体查询
- ✅ 动画不会干扰主要内容
- ✅ 提供足够的动画时间让用户感知

## 动画时长变量

```css
--duration-instant: 100ms;   /* 瞬间 */
--duration-fast: 200ms;      /* 快速 */
--duration-normal: 300ms;     /* 正常 */
--duration-slow: 500ms;       /* 慢速 */
--duration-slower: 800ms;     /* 较慢 */
--duration-slowest: 1000ms;   /* 最慢 */
```

## 缓动函数

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);           /* 进入 */
--ease-out: cubic-bezier(0, 0, 0.2, 1);           /* 退出 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);     /* 进入退出 */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);  /* 弹性 */
--ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1); /* 平滑 */
```

## 集成到现有组件

### 在情感仪表板中使用

```tsx
import { WaveformAnimation, EmotionPulse } from '@/components/animations';

export function EmotionDashboard() {
  const [isRecording, setIsRecording] = useState(false);
  const currentEmotion = 'happy';

  return (
    <div className="space-y-6">
      <EmotionPulse emotion={currentEmotion} size="large" />
      <WaveformAnimation
        isActive={isRecording}
        emotion={currentEmotion}
      />
    </div>
  );
}
```

### 在录音功能中使用

```tsx
import { RecordButton, WaveformAnimation } from '@/components/animations';

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6">
      <WaveformAnimation isActive={isRecording} emotion="neutral" />
      <RecordButton
        isRecording={isRecording}
        onClick={() => setIsRecording(!isRecording)}
      />
    </div>
  );
}
```

### 在卡片列表中使用

```tsx
import { StaggeredList, CardAnimation } from '@/components/animations';

export function CameraList({ cameras }) {
  return (
    <StaggeredList staggerDelay={100} className="space-y-4">
      {cameras.map(camera => (
        <CardAnimation key={camera.id} type="hover">
          <CameraCard camera={camera} />
        </CardAnimation>
      ))}
    </StaggeredList>
  );
}
```

## 最佳实践

1. **避免过度使用动画**
   - 仅在关键交互点添加动画
   - 保持动画简洁明了

2. **考虑性能**
   - 移动端减少复杂动画
   - 使用 `.gpu-accelerated` 优化
   - 避免同时运行太多动画

3. **测试用户体验**
   - 确保动画不会让用户等待
   - 提供取消动画的选项
   - 在不同设备上测试

4. **可访问性**
   - 始终尊重 `prefers-reduced-motion`
   - 不要依赖动画传达关键信息
   - 提供非动画替代方案

## 维护指南

### 添加新动画

1. 在 `animations.css` 中添加新的 `@keyframes`
2. 创建对应的 CSS 类
3. 导出到组件（如果需要）
4. 更新本文档

### 性能监控

- 使用浏览器 DevTools 检查动画性能
- 监控 FPS 是否稳定在 60
- 检查是否有布局抖动（Layout Thrashing）

## 技术支持

如有问题，请查阅：
- Tailwind CSS 动画文档
- React 性能优化指南
- CSS 动画性能最佳实践
