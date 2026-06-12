// ============================================
// PawSync Pro - Design Tokens: Motion
// 
// 标准: Apple iOS 26 + Framer Motion Spring
// 12种核心微动效
// ============================================

export const motion = {
  // ═══════════════════════════════════════════
  // ⏱️ Duration 时长
  // ═══════════════════════════════════════════
  duration: {
    // 极快 - 微交互
    instant: '100ms',
    
    // 快 - 按压反馈
    fast: '150ms',
    
    // 标准 - 状态切换
    base: '200ms',
    
    // 中 - 卡片动画
    moderate: '300ms',
    
    // 较慢 - 入场动画
    slow: '400ms',
    
    // 慢 - 页面切换
    slower: '500ms',
    
    // 极慢 - 复杂动画
    slowest: '600ms',
    
    // 长动画 - 循环动画
    long: '1000ms',
    
    // 极长 - 骨架屏
    longest: '1500ms',
  },

  // ═══════════════════════════════════════════
  // 🌊 Easing 缓动函数
  // ═══════════════════════════════════════════
  easing: {
    // 线性
    linear: 'linear',
    
    // Apple 标准
    apple: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    
    // 入场缓动
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    
    // 退场缓动
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    
    // 双向缓动
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    
    // 弹性缓动
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    
    // 柔和弹性
    springSoft: 'cubic-bezier(0.22, 1, 0.36, 1)',
    
    // 强弹性
    springStrong: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // ═══════════════════════════════════════════
  // 🎯 Spring 配置 (Framer Motion)
  // ═══════════════════════════════════════════
  spring: {
    // 标准 - 通用动画
    default: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 1,
    },
    
    // 柔和 - 卡片悬停
    gentle: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
      mass: 1,
    },
    
    // 弹性 - 按钮反馈
    bouncy: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
      mass: 0.8,
    },
    
    // 紧凑 - 快速响应
    stiff: {
      type: 'spring',
      stiffness: 500,
      damping: 35,
      mass: 1,
    },
    
    // 松弛 - 大元素
    loose: {
      type: 'spring',
      stiffness: 150,
      damping: 20,
      mass: 1.2,
    },
    
    // 悬停 - 卡片浮起
    hover: {
      type: 'spring',
      stiffness: 250,
      damping: 22,
      mass: 0.9,
    },
    
    // 按压 - 按钮缩放
    press: {
      type: 'spring',
      stiffness: 350,
      damping: 28,
      mass: 0.7,
    },
    
    // 入场 - 元素进入
    enter: {
      type: 'spring',
      stiffness: 280,
      damping: 24,
      mass: 1,
    },
    
    // 退场 - 元素离开
    exit: {
      type: 'spring',
      stiffness: 200,
      damping: 30,
      mass: 1,
    },
    
    // 模态 - 弹窗动画
    modal: {
      type: 'spring',
      stiffness: 220,
      damping: 25,
      mass: 1.1,
    },
    
    // FAB - 悬浮按钮
    fab: {
      type: 'spring',
      stiffness: 320,
      damping: 22,
      mass: 0.8,
    },
  },

  // ═══════════════════════════════════════════
  // 🎬 12种核心微动效变体
  // ═══════════════════════════════════════════
  variants: {
    // 1. 弹性物理 - 按钮按压
    springPhysics: {
      rest: { scale: 1 },
      hover: { scale: 1.02 },
      press: { scale: 0.96 },
    },
    
    // 2. 液态按压 - Apple标准
    liquidPress: {
      rest: { scale: 1, boxShadow: '0 2px 4px rgba(122,90,56,0.08)' },
      press: { scale: 0.96, boxShadow: '0 1px 2px rgba(122,90,56,0.04)' },
    },
    
    // 3. 卡片悬停 - 浮起效果
    cardHover: {
      rest: { y: 0, scale: 1, boxShadow: '0 4px 12px rgba(122,90,56,0.10)' },
      hover: { y: -2, scale: 1.02, boxShadow: '0 8px 24px rgba(122,90,56,0.14)' },
    },
    
    // 4. 视差滚动 - 背景位移
    parallaxScroll: {
      initial: { y: 0 },
      scroll: (scrollY: number) => ({ y: scrollY * 0.5 }),
    },
    
    // 5. 错峰入场 - 子元素延迟
    staggerChildren: {
      hidden: { opacity: 0, y: 20 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.05 },
      }),
    },
    
    // 6. 上滑淡入 - 页面入场
    fadeUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
    
    // 7. 标签形变 - iOS 26风格
    tabMorph: {
      inactive: { width: 80, opacity: 0.6 },
      active: { width: 100, opacity: 1 },
    },
    
    // 8. 数字滚动 - count-up
    countUp: {
      initial: { opacity: 0, scale: 0.5 },
      animate: { opacity: 1, scale: 1 },
    },
    
    // 9. 骨架屏流光
    shimmer: {
      start: { backgroundPosition: '-200% 0' },
      end: { backgroundPosition: '200% 0' },
    },
    
    // 10. SVG描边
    svgDraw: {
      hidden: { pathLength: 0, opacity: 0 },
      visible: { pathLength: 1, opacity: 1 },
    },
    
    // 11. 呼吸光晕
    breathing: {
      initial: { scale: 1, opacity: 0.3 },
      animate: { scale: 1.1, opacity: 0.5 },
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      },
    },
    
    // 12. 触感弹跳
    hapticBounce: {
      rest: { scale: 1 },
      tap: { scale: 0.95 },
      bounce: { scale: 1.02 },
    },
  },

  // ═══════════════════════════════════════════
  // 🔄 循环动画配置
  // ═══════════════════════════════════════════
  loop: {
    // 呼吸动画 (光晕)
    breathing: {
      duration: 3000,
      repeat: Infinity,
      repeatType: 'reverse' as const,
    },
    
    // 浮动动画 (装饰)
    floating: {
      duration: 4000,
      repeat: Infinity,
      repeatType: 'reverse' as const,
    },
    
    // 脉冲动画 (状态)
    pulse: {
      duration: 2000,
      repeat: Infinity,
      repeatType: 'reverse' as const,
    },
    
    // 流光动画 (骨架屏)
    shimmer: {
      duration: 1500,
      repeat: Infinity,
      ease: 'linear' as const,
    },
    
    // 心跳动画
    heartbeat: {
      duration: 1000,
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
  },

  // ═══════════════════════════════════════════
  // ⚡ 性能优化配置
  // ═══════════════════════════════════════════
  performance: {
    // GPU加速属性
    gpuAccelerated: ['transform', 'opacity'],
    
    // 避免重排属性
    avoidLayout: ['width', 'height', 'top', 'left', 'margin', 'padding'],
    
    // will-change 提示
    willChange: {
      card: 'transform',
      fab: 'transform, opacity',
      modal: 'transform, opacity',
      list: 'transform',
    },
  },
};

export type MotionToken = typeof motion;