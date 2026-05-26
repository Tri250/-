/**
 * PawSync Pro 3.0 极致体验版
 * 毛球拟态2.0设计系统 - 字体与排版系统
 * 
 * 设计理念：清晰、易读、层次分明
 * 包含字体族、智能字重调节、响应式字号等完整规范
 * 
 * 作者：带娃的小陈工
 * 版本：3.0.0
 */

// ============================================================================
// 字体族系统
// ============================================================================

export const fontFamily = {
  // 主字体 - 中文优先
  primary: {
    chinese: '"HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    english: '"HarmonyOS Sans", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  
  // 数字字体
  numeric: {
    tabular: '"SF Mono", "HarmonyOS Sans Mono", "Roboto Mono", monospace',
    proportional: '"SF Pro Rounded", "HarmonyOS Sans Rounded", sans-serif',
  },
  
  // 代码字体
  mono: {
    code: '"JetBrains Mono", "Fira Code", "Source Code Pro", monospace',
  },
};

// ============================================================================
// 字号系统 - 响应式
// ============================================================================

export const fontSize = {
  // 极小字号
  xs: {
    size: '0.75rem',    // 12px
    lineHeight: '1rem', // 16px
    letterSpacing: '0.01em',
  },
  
  // 小字号
  sm: {
    size: '0.875rem',   // 14px
    lineHeight: '1.25rem', // 20px
    letterSpacing: '0.01em',
  },
  
  // 基准字号
  base: {
    size: '1rem',       // 16px
    lineHeight: '1.5rem', // 24px
    letterSpacing: '0',
  },
  
  // 中等字号
  lg: {
    size: '1.125rem',   // 18px
    lineHeight: '1.75rem', // 28px
    letterSpacing: '-0.01em',
  },
  
  // 大字号
  xl: {
    size: '1.25rem',    // 20px
    lineHeight: '1.75rem', // 28px
    letterSpacing: '-0.02em',
  },
  
  // 特大字号
  '2xl': {
    size: '1.5rem',     // 24px
    lineHeight: '2rem', // 32px
    letterSpacing: '-0.02em',
  },
  
  // 超级特大字号
  '3xl': {
    size: '1.875rem',   // 30px
    lineHeight: '2.25rem', // 36px
    letterSpacing: '-0.02em',
  },
  
  // 标题字号
  '4xl': {
    size: '2.25rem',    // 36px
    lineHeight: '2.5rem', // 40px
    letterSpacing: '-0.03em',
  },
  
  // 巨型字号
  '5xl': {
    size: '3rem',       // 48px
    lineHeight: '1.1',   // 动态行高
    letterSpacing: '-0.04em',
  },
  
  // 超巨型字号
  '6xl': {
    size: '3.75rem',    // 60px
    lineHeight: '1',
    letterSpacing: '-0.05em',
  },
};

// ============================================================================
// 字重系统 - 智能调节
// ============================================================================

export const fontWeight = {
  // 极细
  hairline: 100,
  
  // 细体
  thin: 200,
  
  // 超轻
  extralight: 300,
  
  // 轻体
  light: 400,
  
  // 常规
  normal: 500,
  
  // 中等
  medium: 600,
  
  // 半粗
  semibold: 700,
  
  // 粗体
  bold: 800,
  
  // 特粗
  extrabold: 900,
};

// ============================================================================
// 响应式字号断点
// ============================================================================

export const responsiveFontSize = {
  // 手机
  mobile: {
    display: '2xl',
    h1: 'xl',
    h2: 'lg',
    h3: 'base',
    body: 'sm',
    caption: 'xs',
  },
  
  // 平板
  tablet: {
    display: '3xl',
    h1: '2xl',
    h2: 'xl',
    h3: 'lg',
    body: 'base',
    caption: 'sm',
  },
  
  // 桌面
  desktop: {
    display: '4xl',
    h1: '3xl',
    h2: '2xl',
    h3: 'xl',
    body: 'base',
    caption: 'sm',
  },
};

// ============================================================================
// 标题样式预设
// ============================================================================

export const headingStyles = {
  h1: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
    marginBottom: '1.5rem',
  },
  
  h2: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: '1.25',
    letterSpacing: '-0.01em',
    marginBottom: '1.25rem',
  },
  
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
    marginBottom: '1rem',
  },
  
  h4: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: '1.4',
    marginBottom: '0.75rem',
  },
  
  h5: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: '1.5',
    marginBottom: '0.5rem',
  },
  
  h6: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: '1.5',
    marginBottom: '0.5rem',
  },
};

// ============================================================================
// 文本样式预设
// ============================================================================

export const textStyles = {
  // 主文本
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: '1.6',
  },
  
  // 辅助文本
  secondary: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: '1.5',
    color: 'warmGray.600',
  },
  
  // 提示文本
  hint: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: '1.4',
    color: 'warmGray.500',
  },
  
  // 强调文本
  emphasis: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: '1.6',
  },
  
  // 数字文本
  numeric: {
    fontFamily: fontFamily.numeric.tabular,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0',
  },
  
  // 代码文本
  code: {
    fontFamily: fontFamily.mono.code,
    fontSize: '0.9em',
    fontWeight: fontWeight.normal,
  },
};

// ============================================================================
// 设计令牌导出
// ============================================================================

export const typographyTokens = {
  fontFamily,
  fontSize,
  fontWeight,
  responsiveFontSize,
  headingStyles,
  textStyles,
};

export default typographyTokens;
