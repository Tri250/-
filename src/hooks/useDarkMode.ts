// ============================================
// useDarkMode - 深色模式管理 Hook
// P0-3: 深色模式对比度修复 + 自动切换
// ============================================

import { useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';

interface DarkModeState {
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

export const useDarkMode = (): DarkModeState => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'auto';
    return (localStorage.getItem('theme-mode') as ThemeMode) || 'auto';
  });

  const [isDark, setIsDark] = useState(false);

  // 检测系统深色模式偏好
  const getSystemPreference = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  // 检测当前是否应该使用深色模式
  const shouldUseDarkMode = useCallback(() => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return getSystemPreference();
  }, [mode, getSystemPreference]);

  // 应用深色模式
  const applyDarkMode = useCallback((dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, []);

  // 设置模式
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme-mode', newMode);
    applyDarkMode(shouldUseDarkMode());
  }, [applyDarkMode, shouldUseDarkMode]);

  // 切换模式
  const toggle = useCallback(() => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
  }, [isDark, setMode]);

  // 监听系统主题变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (mode === 'auto') {
        applyDarkMode(mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, applyDarkMode]);

  // 初始化
  useEffect(() => {
    applyDarkMode(shouldUseDarkMode());
  }, [applyDarkMode, shouldUseDarkMode]);

  return { isDark, mode, setMode, toggle };
};

// ============================================
// 深色模式样式工具
// ============================================
export const darkModeClasses = {
  // 背景
  bg: {
    primary: 'bg-white dark:bg-neutral-900',
    secondary: 'bg-neutral-50 dark:bg-neutral-800',
    tertiary: 'bg-neutral-100 dark:bg-neutral-700',
    glass: 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl',
  },
  // 文字
  text: {
    primary: 'text-neutral-900 dark:text-neutral-100',
    secondary: 'text-neutral-600 dark:text-neutral-300',
    tertiary: 'text-neutral-500 dark:text-neutral-400',
    inverse: 'text-white dark:text-neutral-900',
  },
  // 边框
  border: {
    primary: 'border-neutral-200 dark:border-neutral-700',
    secondary: 'border-neutral-300 dark:border-neutral-600',
    glass: 'border-white/20 dark:border-neutral-700/50',
  },
  // 玻璃拟态
  glass: {
    light: 'bg-white/70 dark:bg-neutral-800/70 backdrop-blur-xl',
    medium: 'bg-white/50 dark:bg-neutral-800/50 backdrop-blur-xl',
    heavy: 'bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl',
  },
};
