/**
 * 设计系统常量 - 奶油极简风 V2
 * 
 * 所有页面必须使用此文件中的常量，确保风格统一
 */

// ============================================
// 1. 颜色系统 - 纯净奶油色
// ============================================
export const COLORS = {
  // 页面背景
  bg: '#FDF8F3',           // 主背景 - 暖奶油
  bgSecondary: '#FAF5EE',  // 次背景 - 浅米色
  bgTertiary: '#F5EFE6',   // 第三层 - 淡卡其
  
  // 卡片背景
  card: '#FFFFFF',         // 纯白卡片
  cardWarm: '#FFFBF7',     // 暖白卡片
  
  // 文字色
  textPrimary: '#1A1A1A',  // 主文字 - 近黑
  textSecondary: '#666666', // 次文字 - 深灰
  textTertiary: '#999999',  // 辅助文字 - 中灰
  textQuaternary: '#CCCCCC', // 最淡文字 - 浅灰
  
  // 品牌色 - 温暖橙
  brand: '#F97316',
  brandLight: '#FFF7ED',
  brandDark: '#EA580C',
  
  // 功能色 - 柔和 pastel
  blue: '#60A5FA',
  blueLight: '#EFF6FF',
  green: '#34D399',
  greenLight: '#ECFDF5',
  orange: '#FB923C',
  orangeLight: '#FFF7ED',
  purple: '#A78BFA',
  purpleLight: '#F5F3FF',
  red: '#F87171',
  redLight: '#FEF2F2',
  cyan: '#22D3EE',
  cyanLight: '#ECFEFF',
  yellow: '#FBBF24',
  yellowLight: '#FEF3C7',
  
  // 状态色
  online: '#10B981',
  onlineBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  success: '#10B981',
  successBg: '#D1FAE5',
};

// ============================================
// 2. 阴影系统 - 极淡悬浮感
// ============================================
export const SHADOWS = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.02)',
  sm: '0 2px 8px rgba(0, 0, 0, 0.04)',
  DEFAULT: '0 4px 16px rgba(0, 0, 0, 0.06)',
  md: '0 8px 24px rgba(0, 0, 0, 0.08)',
  lg: '0 12px 32px rgba(0, 0, 0, 0.1)',
  hover: '0 8px 24px rgba(0, 0, 0, 0.08)',
  
  // 彩色光晕
  glowBrand: '0 4px 20px rgba(249, 115, 22, 0.15)',
  glowGreen: '0 4px 20px rgba(16, 185, 129, 0.15)',
  glowBlue: '0 4px 20px rgba(96, 165, 250, 0.15)',
};

// ============================================
// 3. 圆角系统 - 超大圆角
// ============================================
export const RADIUS = {
  xs: '8px',
  sm: '12px',
  DEFAULT: '16px',
  md: '20px',
  lg: '24px',
  xl: '28px',
  '2xl': '32px',
  full: '9999px',
  
  // 卡片专用
  card: '24px',
  cardSm: '20px',
  button: '12px',
  tag: '9999px',
};

// ============================================
// 4. 字体系统 - 超细精致
// ============================================
export const FONT = {
  // 字号
  size: {
    xs: '10px',      // 标签
    sm: '11px',      // 辅助
    base: '12px',    // 小字
    md: '13px',      // 正文
    lg: '14px',      // 列表
    xl: '16px',      // 小标题
    '2xl': '18px',   // 标题
    '3xl': '20px',   // 大标题
    '4xl': '24px',   // 页面标题
    '5xl': '28px',   // 超大标题
  },
  
  // 字重
  weight: {
    light: '300',      // 超细 - 用于大标题、数字
    regular: '400',    // 正常 - 用于正文
    medium: '500',     // 中等 - 用于副标题
    semibold: '600',   // 半粗 - 用于强调
    bold: '700',       // 粗体 - 用于特殊强调
  },
};

// ============================================
// 5. 间距系统
// ============================================
export const SPACE = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
};

// ============================================
// 6. 动效配置
// ============================================
export const ANIMATION = {
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.4,
    slower: 0.5,
  },
  
  easing: {
    default: [0.4, 0, 0.2, 1],
    spring: { type: "spring", stiffness: 400, damping: 17 },
    bounce: { type: "spring", stiffness: 300, damping: 20 },
  },
  
  // 入场动画
  fadeInUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  },
  
  // hover效果
  hoverCard: {
    y: -2,
    boxShadow: SHADOWS.hover,
  },
  
  hoverButton: {
    scale: 1.02,
  },
  
  tapButton: {
    scale: 0.98,
  },
};

// ============================================
// 7. 卡片样式预设
// ============================================
export const CARD_STYLE = {
  primary: {
    background: COLORS.card,
    borderRadius: RADIUS.card,
    boxShadow: SHADOWS.sm,
  },
  secondary: {
    background: COLORS.cardWarm,
    borderRadius: RADIUS.cardSm,
    boxShadow: SHADOWS.xs,
  },
};

// ============================================
// 8. 按钮样式预设
// ============================================
export const BUTTON_STYLE = {
  primary: {
    background: COLORS.brand,
    color: '#FFFFFF',
    borderRadius: RADIUS.button,
  },
  secondary: {
    background: COLORS.brandLight,
    color: COLORS.brand,
    borderRadius: RADIUS.tag,
  },
  ghost: {
    background: 'transparent',
    color: COLORS.textSecondary,
    borderRadius: RADIUS.button,
  },
};

// ============================================
// 9. 宠物图片URL
// ============================================
export const PET_IMAGE = {
  avatar: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop&auto=format',
  hero: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop&auto=format',
  card: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop&auto=format',
  thumb: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop&auto=format',
};

// ============================================
// 10. 状态栏样式
// ============================================
export const STATUS_BAR_STYLE = {
  timeFont: `${FONT.size.lg} ${FONT.weight.semibold}`,
  iconStroke: 2.5,
};

export default {
  COLORS,
  SHADOWS,
  RADIUS,
  FONT,
  SPACE,
  ANIMATION,
  CARD_STYLE,
  BUTTON_STYLE,
  PET_IMAGE,
  STATUS_BAR_STYLE,
};