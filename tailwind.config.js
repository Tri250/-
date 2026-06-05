/** @type {import('tailwindcss').Config} */

/**
 * PawSync Pro 4.0 温暖治愈版
 * Tailwind配置 - 双主色系统（暖橙 + 薄荷绿）
 * 
 * 设计理念：温暖、健康、治愈、专业
 * 从冷蓝医疗风 → 温暖治愈双主色
 */

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
      colors: {
        // ============================================================================
        // 双主色系统 - 温暖治愈
        // ============================================================================
        
        // 主色 A - 暖橙（关爱、活力、温暖）
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',  // 标准暖橙
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407',
        },
        
        // 主色 B - 薄荷绿（健康、清新、专业）
        secondary: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',  // 标准薄荷绿
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        
        // ============================================================================
        // 辅助色系 - 情感化配色
        // ============================================================================
        
        // 薰衣草紫 - AI智能
        lavender: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },
        
        // 樱花粉 - 可爱温柔
        sakura: {
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#EC4899',
          600: '#DB2777',
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843',
          950: '#500724',
        },
        
        // 天空蓝 - 清新科技
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
        
        // 奶油黄 - 活力提醒
        cream: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
          950: '#422006',
        },
        
        // ============================================================================
        // 语义化状态色
        // ============================================================================
        
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        
        warning: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
          950: '#422006',
        },
        
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
        },
        
        info: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
        
        // ============================================================================
        // 暖灰中性色系 - 温暖质感
        // ============================================================================
        
        neutral: {
          0: '#FFFFFF',
          50: '#FAFAF9',
          100: '#F5F5F4',
          150: '#F0EFED',
          200: '#E7E5E4',
          250: '#D6D3D1',
          300: '#D4D4D4',
          350: '#A8A29E',
          400: '#78716C',
          500: '#57534E',
          550: '#44403C',
          600: '#292524',
          700: '#1C1917',
          800: '#171412',
          900: '#0C0A09',
        },
        
        // ============================================================================
        // 宠物类型色
        // ============================================================================
        
        pet: {
          dog: '#F97316',      // 狗狗 - 暖橙
          cat: '#8B5CF6',      // 猫咪 - 薰衣草紫
          rabbit: '#F472B6',   // 兔子 - 樱花粉
          bird: '#0EA5E9',     // 鸟类 - 天空蓝
          hamster: '#EAB308',  // 仓鼠 - 奶油黄
          fish: '#38BDF8',     // 鱼 - 明蓝
          turtle: '#22C55E',   // 乌龟 - 薄荷绿
          lizard: '#4ADE80',   // 蜥蜴 - 明绿
          parrot: '#F97316',   // 鹦鹉 - 橙色
          other: '#78716C',    // 其他 - 暖灰
        },
        
        // ============================================================================
        // 健康状态色
        // ============================================================================
        
        health: {
          excellent: '#22C55E',
          good: '#4ADE80',
          fair: '#EAB308',
          concern: '#FB923C',
          warning: '#EF4444',
          critical: '#DC2626',
        },
        
        // ============================================================================
        // 情绪状态色
        // ============================================================================
        
        emotion: {
          happy: '#FACC15',
          excited: '#F97316',
          calm: '#22C55E',
          curious: '#0EA5E9',
          sleepy: '#8B5CF6',
          anxious: '#EAB308',
          sad: '#78716C',
          angry: '#EF4444',
        },
      },
      
      // ============================================================================
      // 圆角系统 - 柔和圆润
      // ============================================================================
      
      borderRadius: {
        sm: '12px',
        DEFAULT: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '40px',
        full: '9999px',
      },
      
      // ============================================================================
      // 阴影系统 - 温暖色调
      // ============================================================================
      
      boxShadow: {
        soft: '0 2px 8px rgba(249, 115, 22, 0.06)',
        card: '0 4px 12px rgba(249, 115, 22, 0.08)',
        elevated: '0 8px 24px rgba(249, 115, 22, 0.12)',
        dropdown: '0 10px 40px rgba(249, 115, 22, 0.15)',
        glow: '0 0 20px rgba(249, 115, 22, 0.3)',
        'glow-mint': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-lavender': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-sakura': '0 0 20px rgba(244, 114, 182, 0.3)',
        glass: '0 4px 30px rgba(249, 115, 22, 0.1)',
        'glass-mint': '0 4px 30px rgba(34, 197, 94, 0.1)',
      },
      
      backdropBlur: {
        xs: '2px',
        sm: '8px',
        DEFAULT: '20px',
        md: '40px',
        lg: '60px',
      },
      
      // ============================================================================
      // 渐变系统 - 温暖治愈
      // ============================================================================
      
      backgroundImage: {
        // 主渐变 - 暖橙系
        'gradient-primary': 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
        'gradient-primary-soft': 'linear-gradient(180deg, #FFF7ED 0%, #FFEDD5 100%)',
        
        // 健康渐变 - 薄荷绿系
        'gradient-secondary': 'linear-gradient(135deg, #22C55E 0%, #4ADE80 100%)',
        'gradient-secondary-soft': 'linear-gradient(180deg, #F0FDF4 0%, #DCFCE7 100%)',
        
        // 双主色渐变
        'gradient-dual': 'linear-gradient(135deg, #F97316 0%, #22C55E 100%)',
        'gradient-dual-soft': 'linear-gradient(180deg, #FFF7ED 0%, #F0FDF4 100%)',
        
        // AI智能渐变
        'gradient-ai': 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
        'gradient-ai-soft': 'linear-gradient(180deg, #F5F3FF 0%, #EDE9FE 100%)',
        
        // 温暖治愈渐变
        'gradient-healing': 'linear-gradient(135deg, #FDBA74 0%, #86EFAC 100%)',
        'gradient-healing-soft': 'linear-gradient(180deg, #FFEDD5 0%, #DCFCE7 100%)',
        
        // 警告渐变
        'gradient-warning': 'linear-gradient(135deg, #EAB308 0%, #FACC15 100%)',
        'gradient-warning-soft': 'linear-gradient(180deg, #FEFCE8 0%, #FEF9C3 100%)',
        
        // 危险渐变
        'gradient-danger': 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
        
        // 玻璃效果
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
        'gradient-glass-warm': 'linear-gradient(135deg, rgba(255, 247, 237, 0.9) 0%, rgba(255, 237, 213, 0.7) 100%)',
        'gradient-glass-mint': 'linear-gradient(135deg, rgba(240, 253, 244, 0.9) 0%, rgba(220, 252, 231, 0.7) 100%)',
        'gradient-dark-glass': 'linear-gradient(135deg, rgba(28, 25, 23, 0.9) 0%, rgba(41, 37, 36, 0.7) 100%)',
      },
      
      fontFamily: {
        sans: ['HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        display: ['HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
      },
      
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '30px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '38px' }],
        '4xl': ['36px', { lineHeight: '44px' }],
        '5xl': ['48px', { lineHeight: '56px' }],
      },
      
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      
      spacing: {
        px: '1px',
        0: '0px',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
      },
      
      transitionDuration: {
        fast: '150ms',
        DEFAULT: '200ms',
        slow: '300ms',
        slower: '400ms',
      },
      
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.33, 1, 0.68, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-in': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      // ============================================================================
      // 动画系统 - 情感化微交互
      // ============================================================================
      
      animation: {
        // 基础动画
        'pulse-slow': 'pulse 3s cubic-bezier(0.22, 0.61, 0.36, 1) infinite',
        'bounce-gentle': 'bounce 2s cubic-bezier(0.22, 0.61, 0.36, 1) infinite',
        
        // 过渡动画
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'slide-left': 'slideLeft 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'slide-right': 'slideRight 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'scale-out': 'scaleOut 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        
        // 情感化动画
        'breathe': 'breathe 3s ease-in-out infinite',
        'ripple': 'ripple 0.8s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'shake': 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        'flip': 'flip 0.6s ease-in-out',
        
        // 宠物开心动画
        'happy-bounce': 'happyBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'happy-wiggle': 'happyWiggle 0.5s ease-in-out',
        'tail-wag': 'tailWag 0.3s ease-in-out infinite',
        
        // Streak火焰特效
        'streak-fire': 'streakFire 0.8s ease-out',
        'fire-pulse': 'firePulse 1s ease-in-out infinite',
        
        // 庆祝动画
        'celebrate': 'celebrate 1s ease-out',
        'confetti': 'confetti 2s ease-out',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
      },
      
      keyframes: {
        // 基础过渡
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
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
        
        // 情感化动画
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
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
        
        // 宠物开心动画
        happyBounce: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '30%': { transform: 'translateY(-20px) scale(1.1)' },
          '50%': { transform: 'translateY(-10px) scale(1.05)' },
          '70%': { transform: 'translateY(-5px) scale(1.02)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        happyWiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
        tailWag: {
          '0%, 100%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(10deg)' },
        },
        
        // Streak火焰特效
        streakFire: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '1' },
        },
        firePulse: {
          '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.1)', filter: 'brightness(1.2)' },
        },
        
        // 庆祝动画
        celebrate: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { transform: 'scale(1.3) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '1' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) rotate(720deg)', opacity: '0' },
        },
        sparkle: {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '0.8' },
        },
      },
      
      zIndex: {
        dropdown: 1000,
        sticky: 2000,
        modal: 3000,
        toast: 4000,
        tooltip: 5000,
      },
    },
  },
  plugins: [],
};