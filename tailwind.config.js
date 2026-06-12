/** @type {import('tailwindcss').Config} */

// ============================================
// PawSync Pro - Tailwind Config
// 
// 苹果级设计系统整合
// iOS 26 Liquid Glass + 治愈系
// ============================================

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
      },
    },
    extend: {
      // ═══════════════════════════════════════════
      // 🎨 Colors - 10级色彩梯度 (oklch感知线性)
      // ═══════════════════════════════════════════
      colors: {
        // 奶油色系 (主背景)
        cream: {
          50: '#FFFBF5',
          100: '#FAF3E7',
          200: '#FFE9D6',
          300: '#F5DEB8',
          400: '#E8C99B',
          500: '#D4B896',
          600: '#C4A882',
          700: '#A8916E',
          800: '#8B7355',
          900: '#6B5A44',
        },
        
        // 主橙色系（品牌色）
        primary: {
          50: '#FFFAF0',
          100: '#FFE4D1',
          200: '#FFCD91',
          300: '#FFB778',
          400: '#FF9D5C',
          500: '#FF8A3D',
          600: '#E87528',
          700: '#CC5F18',
          800: '#B54A0D',
          900: '#8B3506',
        },
        
        // 暖色系（渐变辅助）
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
        
        // 玫瑰色系（情感）
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
        
        // 薄荷色系（健康/成功）
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
        
        // 薰衣草色系（AI/高级）
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
        
        // 大地色系（文字/边框）
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
        
        // 中性色系（通用）
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
        
        // 语义色系（状态）
        semantic: {
          success: '#4A7A52',
          warning: '#FF9D5C',
          error: '#E66A8C',
          info: '#8B6BAE',
          healthy: '#6B9970',
          caution: '#F5B482',
          danger: '#CC5F18',
        },
        
        // 深色模式
        dark: {
          background: '#1A1814',
          surface: '#262420',
          card: '#2E2A26',
          border: '#3A3632',
          textPrimary: '#F5F0E8',
          textSecondary: '#A8916E',
          textMuted: '#6B5A44',
        },
        
        // 宠物色系
        pet: {
          cat: '#FF9F43',
          dog: '#6C5CE7',
          bird: '#00B894',
          fish: '#0E9CE5',
          rabbit: '#FD79A8',
        },
        
        // 情绪色系
        emotion: {
          happy: '#FFB400',
          excited: '#FF6B00',
          calm: '#0E9CE5',
          curious: '#10B981',
          sleepy: '#8B5CF6',
          anxious: '#F59E0B',
          sad: '#6B7280',
          angry: '#EF4444',
        },
        
        // 健康状态色系
        health: {
          excellent: '#00B894',
          good: '#0E9CE5',
          normal: '#F59E0B',
          warning: '#F97316',
          critical: '#EF4444',
        },
        
        // 兼容旧色系
        secondary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#6C5CE7',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },
        success: {
          50: '#F0FDF4',
          100: '#D8F9E3',
          200: '#ABF2C7',
          300: '#73E6A3',
          400: '#3DD87C',
          500: '#00B894',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#022C22',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C5C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
        },
        info: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          950: '#083344',
        },
      },
      
      // ═══════════════════════════════════════════
      // 📐 Radius - iOS 26 灵动曲线
      // ═══════════════════════════════════════════
      borderRadius: {
        xs: '4px',
        sm: '8px',
        DEFAULT: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '28px',
        '3xl': '32px',
        '4xl': '40px',
        full: '9999px',
      },
      
      // ═══════════════════════════════════════════
      // 🌊 Shadows - Liquid Glass 5级阴影
      // ═══════════════════════════════════════════
      boxShadow: {
        // Liquid Glass 阴影
        'liquid-1': '0 1px 2px rgba(122, 90, 56, 0.04), 0 1px 3px rgba(122, 90, 56, 0.06)',
        'liquid-2': '0 2px 4px rgba(122, 90, 56, 0.06), 0 4px 8px rgba(122, 90, 56, 0.08)',
        'liquid-3': '0 4px 8px rgba(122, 90, 56, 0.08), 0 8px 16px rgba(122, 90, 56, 0.10)',
        'liquid-4': '0 8px 16px rgba(122, 90, 56, 0.10), 0 16px 32px rgba(122, 90, 56, 0.12)',
        'liquid-5': '0 16px 32px rgba(122, 90, 56, 0.12), 0 32px 64px rgba(122, 90, 56, 0.16)',
        
        // 光晕阴影
        'glow-primary': '0 0 20px rgba(255, 138, 61, 0.30), 0 0 40px rgba(255, 138, 61, 0.20)',
        'glow-warm': '0 0 16px rgba(232, 149, 106, 0.25), 0 0 32px rgba(232, 149, 106, 0.15)',
        'glow-blush': '0 0 12px rgba(230, 106, 140, 0.20), 0 0 24px rgba(230, 106, 140, 0.10)',
        'glow-sage': '0 0 10px rgba(74, 122, 82, 0.15), 0 0 20px rgba(74, 122, 82, 0.08)',
        'glow-lavender': '0 0 14px rgba(139, 107, 174, 0.20), 0 0 28px rgba(139, 107, 174, 0.10)',
        
        // 内阴影 (高光)
        'highlight-top': 'inset 0 1px 0 rgba(255, 255, 255, 0.60)',
        'highlight-all': 'inset 0 1px 0 rgba(255, 255, 255, 0.60), inset 0 -1px 0 rgba(122, 90, 56, 0.04)',
        
        // 组合阴影
        'glass-card': '0 4px 12px rgba(122, 90, 56, 0.10), 0 8px 24px rgba(122, 90, 56, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.60)',
        'glass-button': '0 2px 4px rgba(122, 90, 56, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.60)',
        'fab-full': '0 6px 20px rgba(255, 138, 61, 0.30), 0 0 40px rgba(255, 138, 61, 0.20), inset 0 2px 0 rgba(255, 255, 255, 0.30)',
        'floating-card': '0 8px 24px rgba(122, 90, 56, 0.12), 0 16px 48px rgba(122, 90, 56, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.60)',
        
        // 兼容旧阴影
        soft: '0 2px 8px rgba(122, 90, 56, 0.06)',
        card: '0 4px 16px rgba(122, 90, 56, 0.08)',
        elevated: '0 8px 24px rgba(122, 90, 56, 0.10)',
        dropdown: '0 10px 40px rgba(122, 90, 56, 0.12)',
        glow: '0 0 20px rgba(255, 138, 61, 0.30)',
        'glow-purple': '0 0 20px rgba(108, 92, 231, 0.30)',
        'glow-success': '0 0 20px rgba(0, 184, 148, 0.30)',
        'glow-cream': '0 6px 24px rgba(255, 184, 120, 0.25)',
        'glass-cream': '0 4px 30px rgba(122, 90, 56, 0.08)',
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
      
      // ═══════════════════════════════════════════
      // 🌫️ Backdrop Blur
      // ═══════════════════════════════════════════
      backdropBlur: {
        xs: '2px',
        sm: '8px',
        DEFAULT: '12px',
        md: '20px',
        lg: '32px',
        xl: '40px',
        '2xl': '60px',
      },
      
      // ═══════════════════════════════════════════
      // 🎨 Background Images - 渐变
      // ═══════════════════════════════════════════
      backgroundImage: {
        // 奶油渐变
        'gradient-cream': 'linear-gradient(135deg, #FAF3E7 0%, #FFE9D6 100%)',
        'gradient-cream-soft': 'linear-gradient(180deg, #FFFBF5 0%, #FAF3E7 100%)',
        'gradient-cream-page': 'linear-gradient(180deg, #FAF3E7 0%, #FFE9D6 50%, #F5DEB8 100%)',
        
        // 主渐变
        'gradient-primary': 'linear-gradient(135deg, #FFB778 0%, #FF8A3D 100%)',
        'gradient-primary-soft': 'linear-gradient(135deg, #FFE4D1 0%, #FFCD91 100%)',
        
        // 暖色渐变
        'gradient-warm': 'linear-gradient(135deg, #F5B482 0%, #E8956A 100%)',
        'gradient-warm-soft': 'linear-gradient(135deg, #FFF5EC 0%, #FFE4D6 100%)',
        
        // 玫瑰渐变
        'gradient-blush': 'linear-gradient(135deg, #FFB1C8 0%, #E66A8C 100%)',
        'gradient-blush-soft': 'linear-gradient(135deg, #FFF0F3 0%, #FFD4E5 100%)',
        
        // 薰衣草渐变
        'gradient-lavender': 'linear-gradient(135deg, #C9B0E0 0%, #8B6BAE 100%)',
        'gradient-lavender-soft': 'linear-gradient(135deg, #F5F0FA 0%, #E2D5F0 100%)',
        
        // 薄荷渐变
        'gradient-sage': 'linear-gradient(135deg, #95B895 0%, #4A7A52 100%)',
        'gradient-sage-soft': 'linear-gradient(135deg, #F0F5EE 0%, #C5D5C0 100%)',
        
        // 多彩渐变
        'gradient-rainbow': 'linear-gradient(135deg, #FFB778 0%, #FFB1C8 33%, #C9B0E0 66%, #95B895 100%)',
        
        // 光晕渐变
        'gradient-glow': 'radial-gradient(circle, rgba(255,138,61,0.30) 0%, transparent 70%)',
        'gradient-glow-warm': 'radial-gradient(circle, rgba(232,149,106,0.25) 0%, transparent 70%)',
        'gradient-glow-blush': 'radial-gradient(circle, rgba(230,106,140,0.20) 0%, transparent 70%)',
        
        // 玻璃渐变
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
        'gradient-dark-glass': 'linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.7) 100%)',
        
        // 兼容旧渐变
        'gradient-secondary': 'linear-gradient(135deg, #6C5CE7 0%, #A78BFA 100%)',
        'gradient-success': 'linear-gradient(135deg, #00B894 0%, #3DD87C 100%)',
        'gradient-warning': 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
        'gradient-danger': 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
      },
      
      // ═══════════════════════════════════════════
      // 📝 Typography - 黄金比例 Modular Scale
      // ═══════════════════════════════════════════
      fontFamily: {
        sans: ['"PingFang SC"', '"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['"PingFang SC Semibold"', '"SF Pro Display Semibold"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['"PingFang SC Regular"', '"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        numeric: ['"SF Pro Display"', 'ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      
      fontSize: {
        // 极小 - 元数据
        xs: ['10px', { lineHeight: '12px', letterSpacing: '0.04em' }],
        // 小 - 标签
        sm: ['12px', { lineHeight: '16px', letterSpacing: '0.02em' }],
        // 标准 - 正文
        base: ['14px', { lineHeight: '20px' }],
        // 中 - 列表项
        md: ['16px', { lineHeight: '24px' }],
        // 大 - 卡片标题
        lg: ['18px', { lineHeight: '26px' }],
        // 较大 - 子标题
        xl: ['20px', { lineHeight: '30px', letterSpacing: '-0.01em' }],
        // 大标题
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
        // 超大标题
        '3xl': ['28px', { lineHeight: '38px', letterSpacing: '-0.02em' }],
        // 巨大标题
        '4xl': ['32px', { lineHeight: '44px', letterSpacing: '-0.02em' }],
        // 英雄标题
        '5xl': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em' }],
      },
      
      // ═══════════════════════════════════════════
      // 📏 Spacing - 8px基础单位
      // ═══════════════════════════════════════════
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
        px: '1px',
        13: '52px',
      },
      
      width: {
        13: '52px',
      },
      
      height: {
        13: '52px',
      },
      
      // ═══════════════════════════════════════════
      // ⏱️ Transitions - Apple HIG标准
      // ═══════════════════════════════════════════
      transitionDuration: {
        instant: '50ms',
        faster: '100ms',
        fast: '150ms',
        DEFAULT: '200ms',
        medium: '250ms',
        slow: '300ms',
        slower: '400ms',
        slowest: '500ms',
        long: '1000ms',
        longest: '1500ms',
      },
      
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'spring-strong': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      // ═══════════════════════════════════════════
      // 🎬 Animations - 12种核心微动效
      // ═══════════════════════════════════════════
      animation: {
        // 基础动画
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.2s ease-in',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'slide-left': 'slideLeft 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'slide-right': 'slideRight 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
        
        // 缩放动画
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'scale-out': 'scaleOut 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        
        // 治愈系动画
        'breathe': 'breathe 3s ease-in-out infinite',
        'breathe-soft': 'breathe 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-soft': 'float 8s ease-in-out infinite',
        'pulse-soft': 'pulse 3s cubic-bezier(0.22, 0.61, 0.36, 1) infinite',
        'heartbeat': 'heartbeat 1s ease-in-out infinite',
        
        // 反馈动画
        'ripple': 'ripple 0.8s ease-out',
        'shimmer': 'shimmer 1.5s linear infinite',
        'shake': 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        'flip': 'flip 0.6s ease-in-out',
        'bounce-gentle': 'bounce 2s cubic-bezier(0.22, 0.61, 0.36, 1) infinite',
        
        // 液态动画
        'liquid-press': 'liquidPress 0.15s ease-out',
        'liquid-hover': 'liquidHover 0.2s ease-out',
        
        // 数字动画
        'count-up': 'countUp 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.3' },
          '50%': { transform: 'scale(1.1)', opacity: '0.5' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.1)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(1)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        flip: {
          '0%': { transform: 'perspective(400px) rotateY(90deg)' },
          '100%': { transform: 'perspective(400px) rotateY(0)' },
        },
        liquidPress: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.96)' },
        },
        liquidHover: {
          '0%': { transform: 'scale(1)', boxShadow: '0 4px 12px rgba(122, 90, 56, 0.10)' },
          '100%': { transform: 'scale(1.02)', boxShadow: '0 8px 24px rgba(122, 90, 56, 0.14)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.5)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      
      // ═══════════════════════════════════════════
      // 📊 Z-Index - 10级层级
      // ═══════════════════════════════════════════
      zIndex: {
        background: '-10',
        decorative: '-5',
        base: '0',
        content: '1',
        card: '10',
        listItem: '15',
        interactive: '20',
        button: '25',
        sticky: '30',
        header: '35',
        navigation: '40',
        tabBar: '45',
        fab: '50',
        overlay: '60',
        backdrop: '65',
        modal: '70',
        drawer: '75',
        popover: '80',
        tooltip: '85',
        toast: '90',
        notification: '95',
        top: '100',
        dropdown: '1000',
        stickyLegacy: '2000',
        modalLegacy: '3000',
        toastLegacy: '4000',
        tooltipLegacy: '5000',
      },
    },
  },
  plugins: [],
};