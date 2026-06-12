// ============================================
// PawSync Pro - Design Tokens: Z-Index
// 
// 标准: 10级层级系统
// 参考: Apple iOS 26
// ============================================

export const zIndex = {
  // ═══════════════════════════════════════════
  // 📊 层级值 (10级系统)
  // ═══════════════════════════════════════════
  
  // 0级 - 背景层
  background: -10,
  decorative: -5,
  
  // 1级 - 内容层
  base: 0,
  content: 1,
  
  // 2级 - 卡片层
  card: 10,
  listItem: 15,
  
  // 3级 - 交互层
  interactive: 20,
  button: 25,
  
  // 4级 - 固定元素
  sticky: 30,
  header: 35,
  
  // 5级 - 导航层
  navigation: 40,
  tabBar: 45,
  
  // 6级 - FAB层
  fab: 50,
  
  // 7级 - 覆盖层
  overlay: 60,
  backdrop: 65,
  
  // 8级 - 模态层
  modal: 70,
  drawer: 75,
  
  // 9级 - 弹窗层
  popover: 80,
  tooltip: 85,
  
  // 10级 - 最高层
  toast: 90,
  notification: 95,
  top: 100,
  
  // ═══════════════════════════════════════════
  // 🎯 预设组件层级
  // ═══════════════════════════════════════════
  component: {
    // 页面背景装饰
    decoration: -5,
    
    // 页面内容
    pageContent: 0,
    
    // 卡片
    card: 10,
    
    // 列表项
    listItem: 15,
    
    // 悬停卡片
    cardHover: 18,
    
    // 页面头部
    pageHeader: 30,
    
    // 底部导航
    bottomNav: 40,
    
    // FAB
    fab: 50,
    
    // 模态背景
    modalBackdrop: 60,
    
    // 模态内容
    modalContent: 70,
    
    // Toast通知
    toast: 90,
    
    // 加载遮罩
    loadingOverlay: 95,
  },
  
  // ═══════════════════════════════════════════
  // 🌊 Liquid Glass 特殊层级
  // ═══════════════════════════════════════════
  liquid: {
    // 玻璃背景
    glassBackground: 0,
    
    // 玻璃内容
    glassContent: 1,
    
    // 玻璃工具栏
    glassToolbar: 35,
    
    // 玻璃标签栏
    glassTabBar: 45,
    
    // 玻璃模态
    glassModal: 70,
  },
};

export type ZIndexToken = typeof zIndex;