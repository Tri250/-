/**
 * Design System V2 - 奶油极简风
 *
 * 参考：参考图片的极简温暖风格
 * 核心：奶油色背景 + 超细字体 + 大圆角 + 极淡阴影
 */

// ============================================
// 1. 色彩系统 - 纯净奶油色
// ============================================
export const colors = {
  // 页面背景 - 温暖的奶油色
  background: {
    primary: '#FDF8F3',      // 主背景 - 暖奶油
    secondary: '#FAF5EE',    // 次背景 - 浅米色
    tertiary: '#F5EFE6',     // 第三层 - 淡卡其
  },

  // 卡片背景
  surface: {
    primary: '#FFFFFF',      // 纯白卡片
    secondary: '#FFFBF7',    // 暖白卡片
    elevated: '#FFFFFF',     // 悬浮卡片
  },

  // 文字色
  text: {
    primary: '#1A1A1A',      // 主文字 - 近黑
    secondary: '#666666',    // 次文字 - 深灰
    tertiary: '#999999',     // 辅助文字 - 中灰
    quaternary: '#CCCCCC',   // 最淡文字 - 浅灰
  },

  // 品牌色 - 温暖橙
  brand: {
    50: '#FFF8F0',
    100: '#FFEFD6',
    200: '#FFE0B8',
    300: '#FFC88A',
    400: '#FFA94D',
    500: '#F97316',    // 主品牌色
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },

  // 功能色 - 柔和 pastel
  functional: {
    blue: '#60A5FA',       // 问诊
    blueLight: '#EFF6FF',
    green: '#34D399',      // 健康
    greenLight: '#ECFDF5',
    orange: '#FB923C',     // 喂食
    orangeLight: '#FFF7ED',
    purple: '#A78BFA',     // 档案
    purpleLight: '#F5F3FF',
    red: '#F87171',        // 心率
    redLight: '#FEF2F2',
    cyan: '#22D3EE',       // 饮水
    cyanLight: '#ECFEFF',
  },

  // 状态色
  status: {
    online: '#10B981',     // 在线 - 翠绿
    onlineBg: '#D1FAE5',
    warning: '#F59E0B',    // 警告 - 琥珀
    warningBg: '#FEF3C7',
    error: '#EF4444',      // 错误 - 红
    errorBg: '#FEE2E2',
    success: '#10B981',    // 成功
    successBg: '#D1FAE5',
  },
};

// ============================================
// 2. 阴影 - 极淡悬浮感
// ============================================
export const shadows = {
  // 超淡阴影 - 几乎不可见
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.02)',
  sm: '0 2px 8px rgba(0, 0, 0, 0.04)',
  DEFAULT: '0 4px 16px rgba(0, 0, 0, 0.06)',
  md: '0 8px 24px rgba(0, 0, 0, 0.08)',
  lg: '0 12px 32px rgba(0, 0, 0, 0.1)',

  // 彩色光晕
  glowOrange: '0 4px 20px rgba(249, 115, 22, 0.15)',
  glowGreen: '0 4px 20px rgba(16, 185, 129, 0.15)',
  glowBlue: '0 4px 20px rgba(96, 165, 250, 0.15)',

  // 内阴影
  inner: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
};

// ============================================
// 3. 圆角 - 超大圆角
// ============================================
export const radius = {
  none: '0',
  xs: '8px',
  sm: '12px',
  DEFAULT: '16px',
  md: '20px',
  lg: '24px',
  xl: '28px',
  '2xl': '32px',
  full: '9999px',
};

// ============================================
// 4. 字体系统 - 超细精致
// ============================================
export const typography = {
  // 字体族
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "SF Pro SC", "SF Pro Text", "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },

  // 字号 - 参考图比例
  size: {
    '2xs': '10px',    // 标签
    xs: '11px',       // 辅助
    sm: '12px',       // 小字
    base: '13px',     // 正文
    md: '14px',       // 列表
    lg: '16px',       // 标题
    xl: '18px',       // 大标题
    '2xl': '20px',    // 页面标题
    '3xl': '24px',    // 主标题
    '4xl': '28px',    // 超大标题
  },

  // 字重 - 超细为主
  weight: {
    thin: '100',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // 行高
  lineHeight: {
    tight: '1.2',
    snug: '1.4',
    normal: '1.5',
    relaxed: '1.6',
    loose: '1.8',
  },

  // 字间距
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.01em',
    wider: '0.02em',
  },
};

// ============================================
// 5. 间距系统
// ============================================
export const spacing = {
  0: '0',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
};

// ============================================
// 6. 动效
// ============================================
export const transitions = {
  // 时长
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
  },

  // 缓动
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // iOS风格
    ios: 'cubic-bezier(0.4, 0, 0.2, 1)',
    iosOut: 'cubic-bezier(0, 0, 0.2, 1)',
    // 弹性
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

// ============================================
// 7. 组件预设
// ============================================
export const components = {
  // 卡片
  card: {
    background: colors.surface.primary,
    borderRadius: radius.xl,
    shadow: shadows.sm,
    padding: spacing[4],
  },

  // 按钮
  button: {
    borderRadius: radius.lg,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    padding: `${spacing[2.5]} ${spacing[4]}`,
  },

  // 输入框
  input: {
    borderRadius: radius.lg,
    borderColor: colors.background.tertiary,
    focusBorderColor: colors.brand[500],
    padding: spacing[3],
  },

  // 标签
  tag: {
    borderRadius: radius.full,
    fontSize: typography.size['2xs'],
    fontWeight: typography.weight.medium,
    padding: `${spacing[1]} ${spacing[2]}`,
  },
};

export default {
  colors,
  shadows,
  radius,
  typography,
  spacing,
  transitions,
  components,
};
