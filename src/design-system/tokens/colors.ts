// ============================================
// PawSync Pro - Design Tokens: Colors
// 
// 标准: oklch 色彩空间 (感知线性)
// 梯度: 10级 (50-900)
// 参考: Apple iOS 26 Liquid Glass + 治愈系
// ============================================

export const colors = {
  // ═══════════════════════════════════════════
  // 🌸 Cream 奶油色系 (主背景)
  // ═══════════════════════════════════════════
  cream: {
    50: '#FFFBF5',  // 极浅 - 背景高光
    100: '#FAF3E7', // 浅 - 主背景
    200: '#FFE9D6', // 中浅 - 卡片背景
    300: '#F5DEB8', // 中 - 次级背景
    400: '#E8C99B', // 中深 - 边框
    500: '#D4B896', // 标准 - 分割线
    600: '#C4A882', // 深 - 文字辅助
    700: '#A8916E', // 深深 - 文字次要
    800: '#8B7355', // 极深 - cocoa色
    900: '#6B5A44', // 最深 - 文字主要
  },

  // ═══════════════════════════════════════════
  // 🔥 Primary 橙色系 (主色调)
  // ═══════════════════════════════════════════
  primary: {
    50: '#FFFAF0',  // 极浅 - 按钮背景
    100: '#FFE4D1', // 浅 - 标签背景
    200: '#FFCD91', // 中浅 - 进度条
    300: '#FFB778', // 中 - hover状态
    400: '#FF9D5C', // 标准 - 图标
    500: '#FF8A3D', // 核心 - 主按钮/FAB
    600: '#E87528', // 深 - 按压状态
    700: '#CC5F18', // 深深 - 深色模式
    800: '#B54A0D', // 极深 - 强调
    900: '#8B3506', // 最深 - 文字
  },

  // ═══════════════════════════════════════════
  // 🌅 Warm 暖色系 (渐变辅助)
  // ═══════════════════════════════════════════
  warm: {
    50: '#FFF5EC',
    100: '#FFE4D6',
    200: '#FCD5B5',
    300: '#F5B482',
    400: '#E8956A',
    500: '#D47852',
    600: '#C06240',
    700: '#A84D30',
    800: '#8B3A22',
    900: '#6B2816',
  },

  // ═══════════════════════════════════════════
  // 💗 Blush 玫瑰色系 (情感)
  // ═══════════════════════════════════════════
  blush: {
    50: '#FFF0F3',
    100: '#FFD4E5',
    200: '#FFB1C8',
    300: '#FF8FAF',
    400: '#E66A8C',
    500: '#CC5074',
    600: '#B43860',
    700: '#96284A',
    800: '#781A38',
    900: '#5A0C28',
  },

  // ═══════════════════════════════════════════
  // 🌿 Sage 薄荷色系 (健康/成功)
  // ═══════════════════════════════════════════
  sage: {
    50: '#F0F5EE',
    100: '#C5D5C0',
    200: '#95B895',
    300: '#6B9970',
    400: '#4A7A52',
    500: '#3A6242',
    600: '#2A4A32',
    700: '#1A3822',
    800: '#0A2814',
    900: '#001806',
  },

  // ═══════════════════════════════════════════
  // 💜 Lavender 薰衣草色系 (AI/高级)
  // ═══════════════════════════════════════════
  lavender: {
    50: '#F5F0FA',
    100: '#E2D5F0',
    200: '#C9B0E0',
    300: '#A88BC8',
    400: '#8B6BAE',
    500: '#725596',
    600: '#5A4078',
    700: '#422A5A',
    800: '#2A1840',
    900: '#180828',
  },

  // ═══════════════════════════════════════════
  // 🍫 Cocoa 大地色系 (文字/边框)
  // ═══════════════════════════════════════════
  cocoa: {
    50: '#FAF6F0',
    100: '#F0E6D6',
    200: '#D9C4A3',
    300: '#B89876',
    400: '#8B7355',
    500: '#6B5A44',
    600: '#5A4A38',
    700: '#4A3A2C',
    800: '#3A2A20',
    900: '#2A1A14',
  },

  // ═══════════════════════════════════════════
  // 🌊 Neutral 中性色系 (通用)
  // ═══════════════════════════════════════════
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // ═══════════════════════════════════════════
  // 🎨 Semantic 语义色系 (状态)
  // ═══════════════════════════════════════════
  semantic: {
    success: '#4A7A52',    // 成功 - sage-400
    warning: '#FF9D5C',    // 警告 - primary-400
    error: '#E66A8C',      // 错误 - blush-400
    info: '#8B6BAE',       // 信息 - lavender-400
    healthy: '#6B9970',    // 健康 - sage-300
    caution: '#F5B482',    // 注意 - warm-300
    danger: '#CC5F18',     // 危险 - primary-700
  },

  // ═══════════════════════════════════════════
  // ✨ Special 特殊色 (渐变/光效)
  // ═══════════════════════════════════════════
  special: {
    // 渐变起点
    gradientStart: '#FFB778',
    gradientEnd: '#FF8A3D',
    gradientWarmStart: '#F5B482',
    gradientWarmEnd: '#E8956A',
    gradientBlushStart: '#FFB1C8',
    gradientBlushEnd: '#E66A8C',
    gradientLavenderStart: '#C9B0E0',
    gradientLavenderEnd: '#8B6BAE',
    
    // 光效
    glowPrimary: 'rgba(255, 138, 61, 0.30)',
    glowWarm: 'rgba(232, 149, 106, 0.25)',
    glowBlush: 'rgba(230, 106, 140, 0.20)',
    glowSage: 'rgba(74, 122, 82, 0.15)',
    
    // Liquid Glass
    glassBackground: 'rgba(255, 251, 245, 0.80)',
    glassBorder: 'rgba(255, 243, 231, 0.60)',
    glassHighlight: 'rgba(255, 255, 255, 0.60)',
    glassShadow: 'rgba(122, 90, 56, 0.08)',
  },

  // ═══════════════════════════════════════════
  // 🌙 Dark Mode 深色模式映射
  // ═══════════════════════════════════════════
  dark: {
    background: '#1A1814',
    surface: '#262420',
    card: '#2E2A26',
    border: '#3A3632',
    textPrimary: '#F5F0E8',
    textSecondary: '#A8916E',
    textMuted: '#6B5A44',
    
    // 深色模式渐变
    gradientStart: '#CC5F18',
    gradientEnd: '#8B3506',
    
    // 深色模式玻璃
    glassBackground: 'rgba(38, 36, 32, 0.85)',
    glassBorder: 'rgba(58, 54, 50, 0.60)',
    glassHighlight: 'rgba(255, 255, 255, 0.10)',
    glassShadow: 'rgba(0, 0, 0, 0.20)',
  },
};

// ═══════════════════════════════════════════
// 🎨 渐变预设
// ═══════════════════════════════════════════
export const gradients = {
  // 主渐变 (FAB/按钮)
  primary: 'linear-gradient(135deg, #FFB778 0%, #FF8A3D 100%)',
  primarySoft: 'linear-gradient(135deg, #FFE4D1 0%, #FFCD91 100%)',
  
  // 暖色渐变 (卡片)
  warm: 'linear-gradient(135deg, #F5B482 0%, #E8956A 100%)',
  warmSoft: 'linear-gradient(135deg, #FFF5EC 0%, #FFE4D6 100%)',
  
  // 玫瑰渐变 (情感)
  blush: 'linear-gradient(135deg, #FFB1C8 0%, #E66A8C 100%)',
  blushSoft: 'linear-gradient(135deg, #FFF0F3 0%, #FFD4E5 100%)',
  
  // 薰衣草渐变 (AI)
  lavender: 'linear-gradient(135deg, #C9B0E0 0%, #8B6BAE 100%)',
  lavenderSoft: 'linear-gradient(135deg, #F5F0FA 0%, #E2D5F0 100%)',
  
  // 薄荷渐变 (健康)
  sage: 'linear-gradient(135deg, #95B895 0%, #4A7A52 100%)',
  sageSoft: 'linear-gradient(135deg, #F0F5EE 0%, #C5D5C0 100%)',
  
  // 奶油渐变 (背景)
  cream: 'linear-gradient(180deg, #FAF3E7 0%, #FFE9D6 50%, #F5DEB8 100%)',
  creamSoft: 'linear-gradient(180deg, #FFFBF5 0%, #FAF3E7 100%)',
  
  // 多彩渐变 (特殊)
  rainbow: 'linear-gradient(135deg, #FFB778 0%, #FFB1C8 33%, #C9B0E0 66%, #95B895 100%)',
  
  // 光晕渐变 (装饰)
  glow: 'radial-gradient(circle, rgba(255,138,61,0.30) 0%, transparent 70%)',
  glowWarm: 'radial-gradient(circle, rgba(232,149,106,0.25) 0%, transparent 70%)',
  glowBlush: 'radial-gradient(circle, rgba(230,106,140,0.20) 0%, transparent 70%)',
};

// ═══════════════════════════════════════════
// 🌈 透明度梯度 (用于叠加)
// ═══════════════════════════════════════════
export const opacity = {
  5: 0.05,
  10: 0.10,
  20: 0.20,
  40: 0.40,
  60: 0.60,
  80: 0.80,
};

export type ColorToken = typeof colors;
export type GradientToken = typeof gradients;