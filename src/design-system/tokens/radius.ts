// ============================================
// PawSync Pro - Design Tokens: Radius
// 
// 标准: 黄金比例 (8/16/24/32/40)
// 参考: Apple iOS 26 Liquid Glass
// ============================================

export const radius = {
  // ═══════════════════════════════════════════
  // 📐 圆角值 (iOS 26 灵动曲线)
  // ═══════════════════════════════════════════
  
  // 无圆角
  none: '0px',
  
  // 极小 - 微元素
  xs: '4px',
  
  // 小 - 按钮/标签
  sm: '8px',
  
  // 标准 - 小卡片
  base: '12px',
  
  // 中 - 卡片/输入框
  md: '16px',
  
  // 较大 - 卡片
  lg: '20px',
  
  // 大 - 大卡片
  xl: '24px',
  
  // 超大 - 区块
  '2xl': '28px',
  
  // 巨大 - 页面卡片
  '3xl': '32px',
  
  // 极大 - 模态/底部栏
  '4xl': '40px',
  
  // 圆形
  full: '9999px',
  
  // ═══════════════════════════════════════════
  // 🎯 预设组件圆角
  // ═══════════════════════════════════════════
  component: {
    // 按钮
    button: {
      sm: '8px',
      base: '12px',
      lg: '16px',
      pill: '9999px',
    },
    
    // 卡片
    card: {
      sm: '12px',
      base: '16px',
      lg: '20px',
      xl: '24px',
      '2xl': '28px',
    },
    
    // 输入框
    input: {
      sm: '8px',
      base: '12px',
      lg: '16px',
    },
    
    // 标签
    tag: {
      sm: '4px',
      base: '8px',
      pill: '9999px',
    },
    
    // 头像
    avatar: {
      sm: '12px',
      base: '16px',
      lg: '24px',
      xl: '32px',
      full: '9999px',
    },
    
    // 图标容器
    iconContainer: {
      sm: '8px',
      base: '12px',
      lg: '16px',
      xl: '20px',
      full: '9999px',
    },
    
    // 模态框
    modal: {
      top: '24px',
      full: '24px 24px 0 0',
    },
    
    // 底部栏
    bottomBar: {
      top: '24px',
    },
    
    // FAB
    fab: {
      base: '20px',
      lg: '24px',
      full: '9999px',
    },
    
    // 进度条
    progress: {
      base: '4px',
      lg: '8px',
      full: '9999px',
    },
    
    // 分割线
    divider: {
      base: '2px',
    },
  },
  
  // ═══════════════════════════════════════════
  // 🌊 Liquid Glass 特殊圆角
  // ═══════════════════════════════════════════
  liquid: {
    // 玻璃卡片 (iOS 26 风格)
    glassCard: '24px',
    
    // 玻璃按钮
    glassButton: '16px',
    
    // 玻璃标签栏
    glassTabBar: '24px 24px 0 0',
    
    // 玻璃工具栏
    glassToolbar: '20px',
    
    // 玻璃模态
    glassModal: '28px',
    
    // 玻璃输入框
    glassInput: '16px',
  },
};

export type RadiusToken = typeof radius;