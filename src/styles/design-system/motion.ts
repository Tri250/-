/**
 * PawSync Pro 3.0 极致体验版
 * 毛球拟态2.0设计系统 - 动效与交互系统
 * 
 * 设计理念：物理质感、弹性动画、自然过渡
 * 包含弹性系数、动画时长、阴影参数等完整动效规范
 * 
 * 作者：带娃的小陈工
 * 版本：3.0.0
 */

// ============================================================================
// 弹性动画系统 - 物理质感核心
// ============================================================================

export const springAnimation = {
  // 标准弹性动画
  standard: {
    tension: 300,      // 张力
    friction: 20,      // 摩擦力
    mass: 1,           // 质量
    clamp: false,       // 是否限制范围
  },
  
  // 轻柔弹性动画（卡片悬停）
  gentle: {
    tension: 200,
    friction: 25,
    mass: 1,
    clamp: false,
  },
  
  // 活泼弹性动画（按钮点击）
  bouncy: {
    tension: 400,
    friction: 15,
    mass: 0.8,
    clamp: false,
  },
  
  // 僵硬弹性动画（进度条）
  stiff: {
    tension: 500,
    friction: 30,
    mass: 1.2,
    clamp: true,
  },
  
  // 超柔软动画（毛玻璃）
  soft: {
    tension: 100,
    friction: 40,
    mass: 0.5,
    clamp: false,
  },
};

// ============================================================================
// 动画时长系统 - 时间规范
// ============================================================================

export const duration = {
  // 极快 - 微交互
  instant: 100,    // 100ms
  
  // 快速 - 按钮反馈
  fast: 150,       // 150ms
  
  // 正常 - 标准过渡
  normal: 200,     // 200ms
  
  // 中等 - 展开动画
  moderate: 300,  // 300ms
  
  // 较慢 - 页面过渡
  slow: 400,       // 400ms
  
  // 缓慢 - 强调动画
  slower: 500,     // 500ms
  
  // 极慢 - 特殊效果
  slowest: 800,    // 800ms
  
  // 持续动画
  continuous: 2000, // 2s及以上
};

// ============================================================================
// 缓动函数系统 - 曲线规范
// ============================================================================

export const easing = {
  // 标准缓动
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // 进入缓动
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  
  // 退出缓动
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  
  // 弹性缓动
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  
  // 回弹缓动
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // 线性（用于进度条）
  linear: 'linear',
};

// ============================================================================
// 阴影系统 - 多层漫反射
// ============================================================================

export const shadows = {
  // 极浅阴影（卡片默认）
  xs: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // 暖色阴影（主要按钮）
  warm: {
    sm: '0 1px 2px 0 rgb(249 115 22 / 0.05)',
    DEFAULT: '0 4px 6px -1px rgb(249 115 22 / 0.1), 0 2px 4px -2px rgb(249 115 22 / 0.1)',
    md: '0 10px 15px -3px rgb(249 115 22 / 0.1), 0 4px 6px -4px rgb(249 115 22 / 0.1)',
    lg: '0 20px 25px -5px rgb(249 115 22 / 0.1), 0 8px 10px -6px rgb(249 115 22 / 0.1)',
  },
  
  // 毛玻璃阴影
  glass: {
    sm: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
    DEFAULT: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
    md: '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
  },
  
  // 内阴影
  inner: {
    sm: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    md: 'inset 0 4px 6px 0 rgb(0 0 0 / 0.1)',
  },
  
  // 呼吸阴影（特殊效果）
  breathe: {
    small: '0 0 20px rgb(249 115 22 / 0.15)',
    DEFAULT: '0 0 30px rgb(249 115 22 / 0.2)',
    large: '0 0 40px rgb(249 115 22 / 0.25)',
  },
};

// ============================================================================
// 圆角系统 - 动态圆角
// ============================================================================

export const borderRadius = {
  // 极小圆角（输入框）
  xs: '0.25rem',   // 4px
  
  // 小圆角（按钮）
  sm: '0.375rem',  // 6px
  
  // 中等圆角（卡片）
  md: '0.75rem',   // 12px
  
  // 正常圆角（模态框）
  DEFAULT: '1rem', // 16px
  
  // 大圆角（大卡片）
  lg: '1.5rem',    // 24px
  
  // 特大圆角（特殊卡片）
  xl: '2rem',      // 32px
  
  // 全圆角（头像）
  full: '9999px',  // 完全圆形
  
  // 动态圆角（悬浮状态）
  dynamic: {
    default: '1rem',
    hover: '1.25rem',
    active: '0.75rem',
  },
};

// ============================================================================
// 间距系统 - 空间韵律
// ============================================================================

export const spacing = {
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  32: '8rem',       // 128px
};

// ============================================================================
// Z-Index层级系统
// ============================================================================

export const zIndex = {
  hide: -1,         // 隐藏
  base: 0,          // 基础
  raised: 1,        // 抬起
  dropdown: 1000,   // 下拉菜单
  sticky: 1100,     // 粘性定位
  fixed: 2000,      // 固定定位
  modalBackdrop: 3000, // 模态背景
  modal: 4000,      // 模态框
  popover: 5000,    // 弹出框
  tooltip: 6000,     // 工具提示
  toast: 7000,      // 吐司通知
};

// ============================================================================
// 毛玻璃效果系统
// ============================================================================

export const glassmorphism = {
  // 轻度毛玻璃
  light: {
    background: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
  },
  
  // 中度毛玻璃
  medium: {
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.24)',
  },
  
  // 重度毛玻璃
  heavy: {
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  
  // 暗色毛玻璃
  dark: {
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
};

// ============================================================================
// ColorOS 16 液态玻璃效果系统
// ============================================================================

export const liquidGlass = {
  // 液态玻璃模糊级别
  blur: {
    subtle: 'blur(12px) saturate(150%)',
    medium: 'blur(20px) saturate(180%)',
    strong: 'blur(30px) saturate(200%)',
    ultra: 'blur(40px) saturate(220%)',
  },
  
  // 液态玻璃透明度
  opacity: {
    subtle: 0.5,
    medium: 0.7,
    strong: 0.85,
    solid: 0.95,
  },
  
  // 液态玻璃边框
  border: {
    subtle: '1px solid rgba(255, 255, 255, 0.2)',
    medium: '1px solid rgba(255, 255, 255, 0.3)',
    strong: '1px solid rgba(255, 255, 255, 0.4)',
    glow: '1px solid rgba(255, 255, 255, 0.5)',
  },
  
  // 液态玻璃阴影
  shadow: {
    subtle: '0 4px 20px rgba(0, 0, 0, 0.06)',
    medium: '0 8px 32px rgba(0, 0, 0, 0.1)',
    strong: '0 16px 48px rgba(0, 0, 0, 0.15)',
    elevated: '0 20px 60px rgba(0, 0, 0, 0.2)',
  },
  
  // 液态玻璃内阴影（高光效果）
  innerShadow: {
    top: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    bottom: 'inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
    both: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
  },
  
  // 液态玻璃圆角
  radius: {
    small: '16px',
    medium: '20px',
    large: '24px',
    xlarge: '28px',
    hero: '32px',
  },
};

// ============================================================================
// 液态动画预设
// ============================================================================

export const liquidAnimations = {
  // 液态变形动画
  morph: {
    duration: 600,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    scale: { from: 1, to: 1.02 },
    borderRadius: { from: '24px', to: '28px' },
  },
  
  // 液态波动动画
  wave: {
    duration: 2000,
    easing: 'ease-in-out',
    keyframes: {
      '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
      '25%': { transform: 'scale(1.02) rotate(1deg)' },
      '50%': { transform: 'scale(0.98) rotate(0deg)' },
      '75%': { transform: 'scale(1.01) rotate(-1deg)' },
    },
  },
  
  // 液态悬浮动画
  float: {
    duration: 3000,
    easing: 'ease-in-out',
    keyframes: {
      '0%, 100%': { transform: 'translateY(0px)' },
      '50%': { transform: 'translateY(-10px)' },
    },
  },
  
  // 液态呼吸动画
  breathe: {
    duration: 4000,
    easing: 'ease-in-out',
    keyframes: {
      '0%, 100%': { 
        transform: 'scale(1)',
        opacity: 0.8,
      },
      '50%': { 
        transform: 'scale(1.05)',
        opacity: 1,
      },
    },
  },
  
  // 液态涟漪动画
  ripple: {
    duration: 800,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    keyframes: {
      '0%': { 
        transform: 'scale(0)',
        opacity: 0.5,
      },
      '100%': { 
        transform: 'scale(4)',
        opacity: 0,
      },
    },
  },
  
  // 液态光泽动画
  shine: {
    duration: 600,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    from: { left: '-100%' },
    to: { left: '100%' },
  },
  
  // 液态弹跳动画
  bounce: {
    duration: 500,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    keyframes: {
      '0%': { transform: 'scale(0.3)' },
      '50%': { transform: 'scale(1.05)' },
      '70%': { transform: 'scale(0.9)' },
      '100%': { transform: 'scale(1)' },
    },
  },
  
  // 液态渐入动画
  fadeIn: {
    duration: 400,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    keyframes: {
      '0%': { 
        opacity: 0,
        transform: 'translateY(20px) scale(0.95)',
      },
      '100%': { 
        opacity: 1,
        transform: 'translateY(0) scale(1)',
      },
    },
  },
  
  // 液态滑入动画
  slideIn: {
    duration: 500,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    keyframes: {
      '0%': { 
        opacity: 0,
        transform: 'translateX(-30px)',
      },
      '100%': { 
        opacity: 1,
        transform: 'translateX(0)',
      },
    },
  },
};

// ============================================================================
// 动效预设组合
// ============================================================================

export const presets = {
  // 卡片悬停
  cardHover: {
    duration: duration.slow,
    easing: easing.spring,
    scale: 1.02,
    shadow: shadows.warm.lg,
  },
  
  // 按钮点击
  buttonPress: {
    duration: duration.fast,
    easing: easing.bounce,
    scale: 0.95,
  },
  
  // 页面进入
  pageEnter: {
    duration: duration.moderate,
    easing: easing.enter,
    opacity: [0, 1],
    translateY: [20, 0],
  },
  
  // 页面退出
  pageExit: {
    duration: duration.slow,
    easing: easing.exit,
    opacity: [1, 0],
    translateY: [0, -20],
  },
  
  // 模态框进入
  modalEnter: {
    duration: duration.moderate,
    easing: easing.spring,
    opacity: [0, 1],
    scale: [0.9, 1],
  },
  
  // 加载动画
  loading: {
    duration: duration.continuous,
    easing: easing.linear,
    rotate: 360,
  },
  
  // 呼吸动画
  breathe: {
    duration: duration.slowest,
    easing: easing.standard,
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
  },
  
  // 脉冲动画
  pulse: {
    duration: duration.slower,
    easing: easing.standard,
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
  },
};

// ============================================================================
// 设计令牌导出
// ============================================================================

export const motionTokens = {
  spring: springAnimation,
  duration,
  easing,
  shadows,
  borderRadius,
  spacing,
  zIndex,
  glassmorphism,
  liquidGlass,
  liquidAnimations,
  presets,
};

export default motionTokens;
