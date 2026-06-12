/**
 * Design System 2026 - 顶级设计语言
 *
 * 参考：ColorOS 16、HarmonyOS 5、夸克、小米澎湃OS、腾讯Light
 * 特性：液态玻璃、超细描边、微妙渐变、骨架动效、HDR高亮
 */

// ============================================
// 1. 主题色 (iOS ColorOS 16 风)
// ============================================
export const colors = {
  // 品牌主色 - 温暖琥珀金
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // 主色
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },

  // 中性灰（暖色调）
  neutral: {
    0: '#ffffff',
    25: '#fdfbf7', // 暖白
    50: '#faf8f5', // 页面背景
    100: '#f5f1ea', // 卡片背景
    200: '#ebe6dd',
    300: '#d6cfc1',
    400: '#a8a195',
    500: '#7c7568',
    600: '#5c564b',
    700: '#3f3a32',
    800: '#26221c',
    900: '#0f0e0c',
  },

  // 状态色
  success: {
    light: '#d1fae5',
    DEFAULT: '#10b981',
    dark: '#047857',
  },
  warning: {
    light: '#fef3c7',
    DEFAULT: '#f59e0b',
    dark: '#b45309',
  },
  danger: {
    light: '#fee2e2',
    DEFAULT: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    DEFAULT: '#3b82f6',
    dark: '#1d4ed8',
  },

  // 功能色
  food: '#f59e0b',      // 喂食 - 暖橙
  water: '#3b82f6',     // 饮水 - 蓝
  activity: '#10b981',  // 活动 - 翠绿
  health: '#a78bfa',    // 健康 - 紫
  sleep: '#818cf8',     // 睡眠 - 靛
  mood: '#f472b6',      // 心情 - 粉
};

// ============================================
// 2. 渐变 (高级感)
// ============================================
export const gradients = {
  // Hero 渐变 - 暖阳金
  hero: 'linear-gradient(135deg, #FFA940 0%, #FF7A18 50%, #FF4D00 100%)',
  heroSoft: 'linear-gradient(135deg, #FFE0B2 0%, #FFCC80 100%)',

  // 卡片渐变
  cardPeach: 'linear-gradient(135deg, #FFF1E6 0%, #FFE0CC 100%)',
  cardMint: 'linear-gradient(135deg, #E0F2FE 0%, #DBEAFE 100%)',
  cardRose: 'linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)',
  cardLavender: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',

  // 主题色
  primary: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
  primarySoft: 'linear-gradient(135deg, #FED7AA 0%, #FFEDD5 100%)',
  success: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
  info: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
  purple: 'linear-gradient(135deg, #C084FC 0%, #A855F7 100%)',
  gold: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',

  // 液态玻璃
  glass:
    'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.25) 100%)',
  glassWarm:
    'linear-gradient(135deg, rgba(255,247,237,0.85) 0%, rgba(255,237,213,0.5) 100%)',
  glassDark:
    'linear-gradient(135deg, rgba(28,25,23,0.85) 0%, rgba(28,25,23,0.55) 100%)',
};

// ============================================
// 3. 阴影 (超精致分层)
// ============================================
export const shadows = {
  // 卡片基础阴影
  xs: '0 1px 2px rgba(124, 58, 0, 0.04)',
  sm: '0 2px 4px rgba(124, 58, 0, 0.04), 0 1px 2px rgba(124, 58, 0, 0.03)',
  DEFAULT: '0 4px 12px rgba(124, 58, 0, 0.06), 0 1px 3px rgba(124, 58, 0, 0.04)',
  md: '0 8px 24px rgba(124, 58, 0, 0.08), 0 2px 6px rgba(124, 58, 0, 0.04)',
  lg: '0 16px 40px rgba(124, 58, 0, 0.1), 0 4px 12px rgba(124, 58, 0, 0.05)',
  xl: '0 24px 56px rgba(124, 58, 0, 0.12), 0 8px 16px rgba(124, 58, 0, 0.06)',

  // 彩色光晕阴影
  orange: '0 8px 24px rgba(249, 115, 22, 0.25), 0 2px 6px rgba(249, 115, 22, 0.1)',
  blue: '0 8px 24px rgba(59, 130, 246, 0.25), 0 2px 6px rgba(59, 130, 246, 0.1)',
  green: '0 8px 24px rgba(16, 185, 129, 0.25), 0 2px 6px rgba(16, 185, 129, 0.1)',
  purple: '0 8px 24px rgba(167, 139, 250, 0.3), 0 2px 6px rgba(167, 139, 250, 0.1)',

  // 内阴影（按下态）
  inner: 'inset 0 1px 2px rgba(124, 58, 0, 0.06)',
  innerStrong: 'inset 0 2px 4px rgba(124, 58, 0, 0.1)',

  // 毛玻璃阴影
  glass:
    '0 8px 32px rgba(124, 58, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset',

  // 焦点环
  ring: '0 0 0 3px rgba(249, 115, 22, 0.2)',
};

// ============================================
// 4. 圆角
// ============================================
export const radius = {
  none: '0',
  xs: '4px',
  sm: '8px',
  DEFAULT: '12px',
  md: '14px',
  lg: '18px',
  xl: '22px',
  '2xl': '28px',
  '3xl': '36px',
  full: '9999px',
};

// ============================================
// 5. 动效曲线 (iOS 风)
// ============================================
export const easings = {
  // 标准
  linear: 'linear',
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',

  // iOS 风格
  iosStandard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  iosDecelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  iosAccelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  iosSharp: 'cubic-bezier(0.4, 0, 0.6, 1)',

  // 弹性
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // 强调
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
};

// ============================================
// 6. 字体
// ============================================
export const typography = {
  // 字重
  weights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // 字号
  sizes: {
    '2xs': ['10px', { lineHeight: '14px' }],
    xs: ['11px', { lineHeight: '16px' }],
    sm: ['13px', { lineHeight: '18px' }],
    base: ['15px', { lineHeight: '22px' }],
    md: ['16px', { lineHeight: '24px' }],
    lg: ['18px', { lineHeight: '26px' }],
    xl: ['20px', { lineHeight: '28px' }],
    '2xl': ['24px', { lineHeight: '32px' }],
    '3xl': ['28px', { lineHeight: '36px' }],
    '4xl': ['32px', { lineHeight: '40px' }],
    display: ['40px', { lineHeight: '48px', letterSpacing: '-0.02em' }],
  },
};

// ============================================
// 7. 间距 (4px 基准)
// ============================================
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
};

// ============================================
// 8. 微交互 (Spring 配置)
// ============================================
export const springs = {
  // 按下
  tap: { type: 'spring' as const, stiffness: 500, damping: 30, mass: 0.5 },
  // 弹跳
  bounce: { type: 'spring' as const, stiffness: 300, damping: 15, mass: 0.8 },
  // 平滑
  smooth: { type: 'spring' as const, stiffness: 200, damping: 25, mass: 1 },
  // 慢速
  gentle: { type: 'spring' as const, stiffness: 100, damping: 20, mass: 1.2 },
};

// ============================================
// 9. 常用动画
// ============================================
export const animations = {
  // 渐入
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  // 上滑
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
  // 缩放
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 },
  },
};

export default {
  colors,
  gradients,
  shadows,
  radius,
  easings,
  typography,
  spacing,
  springs,
  animations,
};
