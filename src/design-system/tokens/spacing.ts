// ============================================
// PawSync Pro - Design Tokens: Spacing
// 
// 标准: 8px 基础单位 (黄金比例)
// 参考: Apple HIG + iOS 26
// ============================================

export const spacing = {
  // ═══════════════════════════════════════════
  // 📏 基础间距 (8px 基数)
  // ═══════════════════════════════════════════
  0: '0px',
  0.5: '2px',   // 极小 - 微调
  1: '4px',     // 小 - 内部间距
  1.5: '6px',   // 较小 - 紧凑间距
  2: '8px',     // 标准 - 基础单位
  2.5: '10px',  // 中小 - 元素间距
  3: '12px',    // 中 - 卡片内间距
  3.5: '14px',  // 中大 - 列表间距
  4: '16px',    // 大 - 区块间距
  5: '20px',    // 较大 - 页面间距
  6: '24px',    // 大 - 卡片间距
  7: '28px',    // 较大 - 区块标题间距
  8: '32px',    // 大 - 页面区块间距
  9: '36px',    // 较大 - 大区块间距
  10: '40px',   // 大 - 页面边距
  11: '44px',   // 较大 - 安全区
  12: '48px',   // 大 - 页面顶部间距
  14: '56px',   // 较大 - 页面底部间距
  16: '64px',   // 大 - 模块间距
  20: '80px',   // 较大 - 页面间距
  24: '96px',   // 大 - 英雄区间距
  28: '112px',  // 较大 - 页面间距
  32: '128px',  // 大 - 特殊间距
};

// ═══════════════════════════════════════════
// 📐 Padding 内边距预设
// ═══════════════════════════════════════════
export const padding = {
  // 极小 - 微元素
  xs: '4px',
  
  // 小 - 按钮/标签
  sm: '8px',
  
  // 标准 - 卡片
  base: '12px',
  
  // 中 - 列表项
  md: '16px',
  
  // 大 - 区块
  lg: '20px',
  
  // 较大 - 卡片
  xl: '24px',
  
  // 大 - 页面
  '2xl': '32px',
  
  // 超大 - 模块
  '3xl': '40px',
  
  // 按钮内边距
  button: {
    sm: '6px 12px',
    base: '8px 16px',
    lg: '12px 24px',
    xl: '16px 32px',
  },
  
  // 卡片内边距
  card: {
    sm: '12px',
    base: '16px',
    lg: '20px',
    xl: '24px',
  },
  
  // 页面内边距
  page: {
    horizontal: '16px',
    vertical: '20px',
    safeAreaTop: 'env(safe-area-inset-top, 0px)',
    safeAreaBottom: 'env(safe-area-inset-bottom, 0px)',
  },
};

// ═══════════════════════════════════════════
// 📏 Margin 外边距预设
// ═══════════════════════════════════════════
export const margin = {
  // 极小
  xs: '4px',
  
  // 小
  sm: '8px',
  
  // 标准
  base: '12px',
  
  // 中
  md: '16px',
  
  // 大
  lg: '20px',
  
  // 较大
  xl: '24px',
  
  // 大
  '2xl': '32px',
  
  // 超大
  '3xl': '40px',
  
  // 区块间距
  section: {
    sm: '16px',
    base: '24px',
    lg: '32px',
    xl: '48px',
  },
};

// ═══════════════════════════════════════════
// 📊 Gap 间隙预设 (Flex/Grid)
// ═══════════════════════════════════════════
export const gap = {
  // 极小
  xs: '4px',
  
  // 小 - 紧凑排列
  sm: '8px',
  
  // 标准 - 元素间隙
  base: '12px',
  
  // 中 - 卡片间隙
  md: '16px',
  
  // 大 - 区块间隙
  lg: '20px',
  
  // 较大
  xl: '24px',
  
  // 大
  '2xl': '32px',
  
  // 网格间隙
  grid: {
    sm: '8px',
    base: '12px',
    lg: '16px',
  },
  
  // 列表间隙
  list: {
    sm: '8px',
    base: '12px',
    lg: '16px',
  },
};

export type SpacingToken = typeof spacing;
export type PaddingToken = typeof padding;
export type MarginToken = typeof margin;
export type GapToken = typeof gap;