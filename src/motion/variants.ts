// ============================================
// PawSync Pro - Motion Variants
// 
// 12种核心微动效变体
// ============================================

import { Variants, Transition } from 'framer-motion';
import { shadows } from '../design-system/tokens/shadows';

// ═══════════════════════════════════════════
// 🎬 Spring 配置
// ═══════════════════════════════════════════

export const springs = {
  // 标准 - 通用
  default: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 1,
  } as Transition,
  
  // 柔和 - 卡片悬停
  gentle: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
    mass: 1,
  } as Transition,
  
  // 弹性 - 按钮反馈
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 20,
    mass: 0.8,
  } as Transition,
  
  // 紧凑 - 快速响应
  stiff: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
    mass: 1,
  } as Transition,
  
  // 松弛 - 大元素
  loose: {
    type: 'spring',
    stiffness: 150,
    damping: 20,
    mass: 1.2,
  } as Transition,
  
  // 悬停 - 卡片浮起
  hover: {
    type: 'spring',
    stiffness: 250,
    damping: 22,
    mass: 0.9,
  } as Transition,
  
  // 按压 - 按钮缩放
  press: {
    type: 'spring',
    stiffness: 350,
    damping: 28,
    mass: 0.7,
  } as Transition,
  
  // 入场 - 元素进入
  enter: {
    type: 'spring',
    stiffness: 280,
    damping: 24,
    mass: 1,
  } as Transition,
  
  // 退场 - 元素离开
  exit: {
    type: 'spring',
    stiffness: 200,
    damping: 30,
    mass: 1,
  } as Transition,
  
  // 模态 - 弹窗动画
  modal: {
    type: 'spring',
    stiffness: 220,
    damping: 25,
    mass: 1.1,
  } as Transition,
  
  // FAB - 悬浮按钮
  fab: {
    type: 'spring',
    stiffness: 320,
    damping: 22,
    mass: 0.8,
  } as Transition,
};

// ═══════════════════════════════════════════
// 🎬 12种核心微动效变体
// ═══════════════════════════════════════════

// 1. 弹性物理 - 按钮按压
export const springPhysics: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  press: { scale: 0.96 },
};

// 2. 液态按压 - Apple标准
export const liquidPress: Variants = {
  rest: { 
    scale: 1, 
    boxShadow: shadows.liquid2,
  },
  hover: { 
    scale: 1.02,
    boxShadow: shadows.liquid3,
  },
  press: { 
    scale: 0.96, 
    boxShadow: shadows.liquid1,
  },
};

// 3. 卡片悬停 - 浮起效果
export const cardHover: Variants = {
  rest: { 
    y: 0, 
    scale: 1, 
    boxShadow: shadows.liquid3,
  },
  hover: { 
    y: -4, 
    scale: 1.02, 
    boxShadow: shadows.liquid4,
  },
  press: {
    y: 0,
    scale: 0.98,
    boxShadow: shadows.liquid2,
  },
};

// 4. 视差滚动 - 背景位移
export const parallaxScroll: Variants = {
  initial: { y: 0 },
  scroll: { y: -50 },
};

// 5. 错峰入场 - 子元素延迟
export const staggerChildren: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springs.enter,
  },
};

// 错峰容器
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// 6. 上滑淡入 - 页面入场
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springs.enter,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: springs.exit,
  },
};

// 7. 标签形变 - iOS 26风格
export const tabMorph: Variants = {
  inactive: { 
    width: 80, 
    opacity: 0.6,
    scale: 0.95,
  },
  active: { 
    width: 100, 
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
};

// 8. 数字滚动 - count-up
export const countUp: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.5,
    y: 10,
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: springs.bouncy,
  },
};

// 9. 骨架屏流光
export const shimmer: Variants = {
  start: { 
    backgroundPosition: '-200% 0',
  },
  end: { 
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// 10. SVG描边
export const svgDraw: Variants = {
  hidden: { 
    pathLength: 0, 
    opacity: 0,
  },
  visible: { 
    pathLength: 1, 
    opacity: 1,
    transition: {
      pathLength: { duration: 1.5, ease: 'easeInOut' },
      opacity: { duration: 0.3 },
    },
  },
};

// 11. 呼吸光晕
export const breathing: Variants = {
  initial: { 
    scale: 1, 
    opacity: 0.3,
  },
  animate: { 
    scale: 1.1, 
    opacity: 0.5,
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    },
  },
};

// 12. 触感弹跳
export const hapticBounce: Variants = {
  rest: { scale: 1 },
  tap: { 
    scale: 0.95,
    transition: springs.press,
  },
  bounce: { 
    scale: 1.02,
    transition: springs.bouncy,
  },
};

// ═══════════════════════════════════════════
// 🎬 页面过渡动画
// ═══════════════════════════════════════════

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: springs.enter,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: springs.exit,
  },
};

// ═══════════════════════════════════════════
// 🎬 模态框动画
// ═══════════════════════════════════════════

export const modalTransition: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  enter: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.modal,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: springs.exit,
  },
};

// 背景遮罩
export const backdropTransition: Variants = {
  initial: { opacity: 0 },
  enter: { 
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// ═══════════════════════════════════════════
// 🎬 底部栏动画
// ═══════════════════════════════════════════

export const tabBarTransition: Variants = {
  visible: {
    y: 0,
    opacity: 1,
    transition: springs.gentle,
  },
  hidden: {
    y: 100,
    opacity: 0,
    transition: springs.exit,
  },
};

// ═══════════════════════════════════════════
// 🎬 FAB动画
// ═══════════════════════════════════════════

export const fabTransition: Variants = {
  rest: {
    scale: 1,
    boxShadow: shadows.glowPrimary,
  },
  hover: {
    scale: 1.05,
    boxShadow: shadows.component.fab.hover,
    transition: springs.fab,
  },
  press: {
    scale: 0.95,
    boxShadow: shadows.component.fab.press,
    transition: springs.press,
  },
};

// FAB菜单展开
export const fabMenuTransition: Variants = {
  collapsed: {
    scale: 0,
    opacity: 0,
    y: 0,
  },
  expanded: (i: number) => ({
    scale: 1,
    opacity: 1,
    y: -(i * 60),
    transition: {
      ...springs.bouncy,
      delay: i * 0.05,
    },
  }),
};

// ═══════════════════════════════════════════
// 🎬 列表项动画
// ═══════════════════════════════════════════

export const listItemTransition: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  enter: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      ...springs.enter,
      delay: i * 0.03,
    },
  }),
  exit: {
    opacity: 0,
    x: 20,
    transition: springs.exit,
  },
};

// ═══════════════════════════════════════════
// 🎬 统一导出
// ═══════════════════════════════════════════

export const variants = {
  springPhysics,
  liquidPress,
  cardHover,
  parallaxScroll,
  staggerChildren,
  staggerContainer,
  fadeUp,
  tabMorph,
  countUp,
  shimmer,
  svgDraw,
  breathing,
  hapticBounce,
  pageTransition,
  modalTransition,
  backdropTransition,
  tabBarTransition,
  fabTransition,
  fabMenuTransition,
  listItemTransition,
};

export default variants;