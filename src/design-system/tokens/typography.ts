// ============================================
// PawSync Pro - Design Tokens: Typography
// 
// 标准: 黄金比例 Modular Scale (1.25)
// 字体: 苹方(PingFang SC) + SF Pro
// 参考: Apple HIG + iOS 26
// ============================================

export const typography = {
  // ═══════════════════════════════════════════
  // 📝 Font Families 字体族
  // ═══════════════════════════════════════════
  fontFamily: {
    // 主字体 (中文优先)
    primary: '"PingFang SC", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    
    // 数字字体 (等宽对齐)
    numeric: '"SF Pro Display", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    
    // 标题字体 (加粗)
    display: '"PingFang SC Semibold", "SF Pro Display Semibold", -apple-system, BlinkMacSystemFont, sans-serif',
    
    // 正文字体
    body: '"PingFang SC Regular", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  },

  // ═══════════════════════════════════════════
  // 📏 Font Sizes 字号 (黄金比例 1.25)
  // ═══════════════════════════════════════════
  fontSize: {
    // 极小 - 元数据/时间戳
    xs: '10px',
    
    // 小 - 标签/辅助文字
    sm: '12px',
    
    // 标准 - 正文
    base: '14px',
    
    // 中 - 列表项标题
    md: '16px',
    
    // 大 - 卡片标题
    lg: '18px',
    
    // 较大 - 子标题
    xl: '20px',
    
    // 大标题
    '2xl': '24px',
    
    // 超大标题
    '3xl': '28px',
    
    // 巨大标题
    '4xl': '32px',
    
    // 英雄标题
    '5xl': '40px',
  },

  // ═══════════════════════════════════════════
  // 📐 Line Heights 行高
  // ═══════════════════════════════════════════
  lineHeight: {
    // 紧凑 - 标题
    tight: '1.1',
    
    // 较紧 - 子标题
    snug: '1.2',
    
    // 标准 - 卡片标题
    normal: '1.3',
    
    // 较松 - 正文
    relaxed: '1.4',
    
    // 松散 - 长文本
    loose: '1.5',
    
    // 极松 - 引用/说明
    extraLoose: '1.6',
  },

  // ═══════════════════════════════════════════
  // ⚖️ Font Weights 字重
  // ═══════════════════════════════════════════
  fontWeight: {
    // 极细 - 装饰
    thin: '100',
    
    // 细 - 辅助
    light: '300',
    
    // 标准 - 正文
    normal: '400',
    
    // 中等 - 列表项
    medium: '500',
    
    // 半粗 - 标题
    semibold: '600',
    
    // 粗 - 大标题
    bold: '700',
    
    // 极粗 - 英雄标题
    extrabold: '800',
  },

  // ═══════════════════════════════════════════
  // 🔤 Letter Spacing 字间距
  // ═══════════════════════════════════════════
  letterSpacing: {
    // 紧凑 - 中文标题
    tighter: '-0.02em',
    
    // 较紧 - 标题
    tight: '-0.01em',
    
    // 标准 - 正文
    normal: '0',
    
    // 较松 - 英文
    wide: '0.02em',
    
    // 松散 - 装饰
    wider: '0.04em',
    
    // 极松 - 标签
    widest: '0.08em',
  },

  // ═══════════════════════════════════════════
  // 🎯 预设样式组合
  // ═══════════════════════════════════════════
  preset: {
    // 英雄标题 - 页面主标题
    hero: {
      fontFamily: typography.fontFamily.display,
      fontSize: '40px',
      lineHeight: '1.05',
      fontWeight: '700',
      letterSpacing: '-0.02em',
    },
    
    // 大标题 - 页面标题
    h1: {
      fontFamily: typography.fontFamily.display,
      fontSize: '32px',
      lineHeight: '1.1',
      fontWeight: '700',
      letterSpacing: '-0.01em',
    },
    
    // 标题 - 卡片主标题
    h2: {
      fontFamily: typography.fontFamily.primary,
      fontSize: '24px',
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '-0.01em',
    },
    
    // 子标题 - 区块标题
    h3: {
      fontFamily: typography.fontFamily.primary,
      fontSize: '20px',
      lineHeight: '1.3',
      fontWeight: '600',
      letterSpacing: '0',
    },
    
    // 正文 - 主要内容
    body: {
      fontFamily: typography.fontFamily.body,
      fontSize: '16px',
      lineHeight: '1.5',
      fontWeight: '400',
      letterSpacing: '0',
    },
    
    // 正文小 - 辅助内容
    bodySm: {
      fontFamily: typography.fontFamily.body,
      fontSize: '14px',
      lineHeight: '1.4',
      fontWeight: '400',
      letterSpacing: '0',
    },
    
    // 说明 - 描述文字
    caption: {
      fontFamily: typography.fontFamily.body,
      fontSize: '12px',
      lineHeight: '1.3',
      fontWeight: '400',
      letterSpacing: '0.02em',
    },
    
    // 元数据 - 时间戳/标签
    micro: {
      fontFamily: typography.fontFamily.numeric,
      fontSize: '10px',
      lineHeight: '1.2',
      fontWeight: '500',
      letterSpacing: '0.04em',
    },
    
    // 数字 - 统计数据
    number: {
      fontFamily: typography.fontFamily.numeric,
      fontSize: '24px',
      lineHeight: '1',
      fontWeight: '700',
      letterSpacing: '-0.02em',
    },
    
    // 数字大 - 核心指标
    numberLg: {
      fontFamily: typography.fontFamily.numeric,
      fontSize: '32px',
      lineHeight: '1',
      fontWeight: '700',
      letterSpacing: '-0.02em',
    },
    
    // 按钮 - 按钮文字
    button: {
      fontFamily: typography.fontFamily.primary,
      fontSize: '16px',
      lineHeight: '1',
      fontWeight: '600',
      letterSpacing: '0.02em',
    },
    
    // 按钮 - 小按钮
    buttonSm: {
      fontFamily: typography.fontFamily.primary,
      fontSize: '14px',
      lineHeight: '1',
      fontWeight: '600',
      letterSpacing: '0.02em',
    },
    
    // 标签 - Tab/筛选
    label: {
      fontFamily: typography.fontFamily.primary,
      fontSize: '12px',
      lineHeight: '1.2',
      fontWeight: '500',
      letterSpacing: '0.04em',
    },
  },
};

// ═══════════════════════════════════════════
// 📊 文字颜色预设
// ═══════════════════════════════════════════
export const textColors = {
  // 主文字 - 标题/重要内容
  primary: '#6B5A44', // cocoa-900
  
  // 次文字 - 正文
  secondary: '#A8916E', // cocoa-700
  
  // 辅助文字 - 说明
  tertiary: '#C4A882', // cocoa-600
  
  // 淡文字 - 元数据
  muted: '#D4B896', // cocoa-500
  
  // 强调文字 - 链接/高亮
  accent: '#FF8A3D', // primary-500
  
  // 成功文字
  success: '#4A7A52', // sage-400
  
  // 警告文字
  warning: '#FF9D5C', // primary-400
  
  // 错误文字
  error: '#E66A8C', // blush-400
  
  // 反色文字 - 深色背景上
  inverse: '#FFFBF5', // cream-50
};

export type TypographyToken = typeof typography;
export type TextColorToken = typeof textColors;