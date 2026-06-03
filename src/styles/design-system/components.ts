/**
 * PawSync Pro 3.0 极致体验版
 * 毛球拟态2.0设计系统 - 组件设计规范
 * 
 * 设计理念：温暖治愈、物理质感、极简交互
 * 包含按钮、卡片、输入框、导航栏、弹窗等基础组件规范
 * 
 * 作者：带娃的小陈工
 * 版本：3.0.0
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion } from 'framer-motion';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { springAnimation, duration, easing } from './motion';
import { shadows, borderRadius } from './motion';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { semanticColors } from './colors';

// ============================================================================
// 按钮组件系统
// ============================================================================

export const buttonTokens = {
  // 按钮尺寸
  size: {
    xs: {
      height: '2rem',      // 32px
      padding: '0 0.75rem', // 12px
      fontSize: '0.75rem',
      borderRadius: borderRadius.sm,
      iconSize: '1rem',
    },
    sm: {
      height: '2.5rem',    // 40px
      padding: '0 1rem',   // 16px
      fontSize: '0.875rem',
      borderRadius: borderRadius.md,
      iconSize: '1.25rem',
    },
    md: {
      height: '3rem',      // 48px
      padding: '0 1.5rem', // 24px
      fontSize: '1rem',
      borderRadius: borderRadius.lg,
      iconSize: '1.5rem',
    },
    lg: {
      height: '3.5rem',    // 56px
      padding: '0 2rem',  // 32px
      fontSize: '1.125rem',
      borderRadius: borderRadius.xl,
      iconSize: '1.75rem',
    },
  },
  
  // 按钮变体
  variant: {
    // 主要按钮 - 橙色渐变
    primary: {
      background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
      color: '#FFFFFF',
      shadow: shadows.warm.md,
      hover: {
        background: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
        shadow: shadows.warm.lg,
        transform: 'scale(1.02)',
      },
      active: {
        background: 'linear-gradient(135deg, #C2410C 0%, #EA580C 100%)',
        shadow: shadows.warm.sm,
        transform: 'scale(0.98)',
      },
    },
    
    // 次要按钮 - 白底
    secondary: {
      background: '#FFFFFF',
      color: '#F97316',
      border: '1px solid #FDBA74',
      shadow: shadows.xs.sm,
      hover: {
        background: '#FFF7ED',
        borderColor: '#FB923C',
        shadow: shadows.warm.sm,
        transform: 'scale(1.02)',
      },
      active: {
        background: '#FED7AA',
        transform: 'scale(0.98)',
      },
    },
    
    // 幽灵按钮 - 透明底
    ghost: {
      background: 'transparent',
      color: '#F97316',
      hover: {
        background: 'rgba(249, 115, 22, 0.1)',
      },
      active: {
        background: 'rgba(249, 115, 22, 0.2)',
      },
    },
    
    // 危险按钮 - 红色
    danger: {
      background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
      color: '#FFFFFF',
      shadow: '0 4px 6px -1px rgb(239 68 68 / 0.3)',
      hover: {
        background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
        shadow: '0 10px 15px -3px rgb(239 68 68 / 0.3)',
      },
    },
    
    // 成功按钮 - 绿色
    success: {
      background: 'linear-gradient(135deg, #22C55E 0%, #4ADE80 100%)',
      color: '#FFFFFF',
      shadow: '0 4px 6px -1px rgb(34 197 94 / 0.3)',
      hover: {
        background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
      },
    },
  },
  
  // 按钮图标间距
  iconGap: {
    left: '0.5rem',
    right: '0.5rem',
  },
};

// ============================================================================
// 卡片组件系统
// ============================================================================

export const cardTokens = {
  // 卡片尺寸
  size: {
    sm: {
      padding: '1rem',      // 16px
      borderRadius: borderRadius.lg,
      gap: '0.75rem',
    },
    md: {
      padding: '1.5rem',   // 24px
      borderRadius: borderRadius.xl,
      gap: '1rem',
    },
    lg: {
      padding: '2rem',     // 32px
      borderRadius: '1.5rem',
      gap: '1.25rem',
    },
  },
  
  // 卡片变体
  variant: {
    // 白色卡片
    white: {
      background: '#FFFFFF',
      shadow: shadows.xs.DEFAULT,
      border: '1px solid rgba(0, 0, 0, 0.05)',
      hover: {
        shadow: shadows.warm.lg,
        transform: 'translateY(-2px)',
      },
    },
    
    // 渐变卡片
    gradient: {
      background: 'linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%)',
      shadow: shadows.warm.sm,
      border: 'none',
      hover: {
        shadow: shadows.warm.lg,
        transform: 'translateY(-2px)',
      },
    },
    
    // 毛玻璃卡片
    glass: {
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      shadow: shadows.glass.DEFAULT,
      hover: {
        background: 'rgba(255, 255, 255, 0.8)',
        shadow: shadows.glass.md,
      },
    },
    
    // 强调卡片
    accent: {
      background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
      color: '#FFFFFF',
      shadow: shadows.warm.md,
      hover: {
        shadow: shadows.warm.lg,
        transform: 'translateY(-2px)',
      },
    },
  },
};

// ============================================================================
// 输入框组件系统
// ============================================================================

export const inputTokens = {
  // 输入框尺寸
  size: {
    sm: {
      height: '2.5rem',    // 40px
      padding: '0 0.75rem',
      fontSize: '0.875rem',
      borderRadius: borderRadius.md,
    },
    md: {
      height: '3rem',      // 48px
      padding: '0 1rem',
      fontSize: '1rem',
      borderRadius: borderRadius.lg,
    },
    lg: {
      height: '3.5rem',    // 56px
      padding: '0 1.25rem',
      fontSize: '1.125rem',
      borderRadius: borderRadius.xl,
    },
  },
  
  // 输入框状态
  state: {
    default: {
      background: '#FFFFFF',
      border: '1px solid #D4D4D4',
      color: '#1C1917',
      placeholder: '#A8A29E',
    },
    hover: {
      border: '1px solid #FB923C',
    },
    focus: {
      border: '2px solid #F97316',
      shadow: '0 0 0 3px rgba(249, 115, 22, 0.1)',
    },
    error: {
      border: '2px solid #EF4444',
      shadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
    },
    disabled: {
      background: '#F5F5F4',
      color: '#A8A29E',
      cursor: 'not-allowed',
    },
  },
};

// ============================================================================
// 导航栏组件系统
// ============================================================================

export const navbarTokens = {
  // 底部导航栏
  bottom: {
    height: '4rem',        // 64px + safe area
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(0, 0, 0, 0.05)',
    itemGap: '0.5rem',
    activeColor: '#F97316',
    inactiveColor: '#78716C',
    iconSize: '1.5rem',
    labelSize: '0.625rem',
  },
  
  // 顶部导航栏
  top: {
    height: '3rem',        // 48px + status bar
    background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)',
    shadow: shadows.xs.sm,
    padding: '0 1rem',
  },
};

// ============================================================================
// 弹窗组件系统
// ============================================================================

export const modalTokens = {
  // 弹窗尺寸
  size: {
    sm: {
      width: '20rem',      // 320px
      padding: '1.5rem',
      borderRadius: borderRadius.xl,
    },
    md: {
      width: '24rem',      // 384px
      padding: '2rem',
      borderRadius: '1.5rem',
    },
    lg: {
      width: '28rem',      // 448px
      padding: '2.5rem',
      borderRadius: '2rem',
    },
    full: {
      width: '100%',
      height: '100%',
      borderRadius: 0,
    },
  },
  
  // 弹窗变体
  variant: {
    default: {
      background: '#FFFFFF',
      shadow: shadows.warm.lg,
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      shadow: shadows.glass.md,
    },
  },
};

// ============================================================================
// 组件工厂函数
// ============================================================================

export const createComponentTokens = (component: string) => {
  const tokens = {
    button: buttonTokens,
    card: cardTokens,
    input: inputTokens,
    navbar: navbarTokens,
    modal: modalTokens,
  };
  
  return tokens[component as keyof typeof tokens] || {};
};

// ============================================================================
// 设计令牌导出
// ============================================================================

export const componentTokens = {
  button: buttonTokens,
  card: cardTokens,
  input: inputTokens,
  navbar: navbarTokens,
  modal: modalTokens,
};

export default componentTokens;
