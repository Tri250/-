// ============================================
// PawSync Pro - accessibility.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-06-23
// 描述: 无障碍支持工具库
// ============================================

import { useState, useEffect, useCallback } from 'react';

// ============================================================
// 类型定义
// ============================================================

/** 屏幕阅读器类型 */
export type ScreenReaderType = 'talkback' | 'voiceover' | 'nvda' | 'none' | 'unknown';

/** 字体大小偏好 */
export type FontScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/** 无障碍状态 */
export interface AccessibilityState {
  screenReaderEnabled: boolean;
  screenReaderType: ScreenReaderType;
  fontScale: FontScale;
  fontScaleValue: number;
  prefersReducedMotion: boolean;
  highContrast: boolean;
  reducedTransparency: boolean;
  invertColors: boolean;
}

/** 公告优先级 */
export type AnnouncementPriority = 'polite' | 'assertive';

// ============================================================
// A11yManager 无障碍管理器
// ============================================================

class A11yManagerClass {
  private state: AccessibilityState;
  private listeners: Set<(state: AccessibilityState) => void>;
  private announcerElement: HTMLDivElement | null = null;
  private mediaQueryListeners: Array<{ mql: MediaQueryList; handler: (e: MediaQueryListEvent) => void }> = [];

  constructor() {
    this.state = {
      screenReaderEnabled: false,
      screenReaderType: 'none',
      fontScale: 'md',
      fontScaleValue: 1,
      prefersReducedMotion: false,
      highContrast: false,
      reducedTransparency: false,
      invertColors: false,
    };
    this.listeners = new Set();
  }

  /**
   * 初始化无障碍管理器
   * 检测各种无障碍偏好设置
   */
  init(): void {
    if (typeof window === 'undefined') return;

    this.detectScreenReader();
    this.detectFontScale();
    this.detectPrefersReducedMotion();
    this.detectHighContrast();
    this.detectReducedTransparency();
    this.detectInvertColors();
    this.ensureAnnouncer();
  }

  /**
   * 检测屏幕阅读器是否启用
   * 检测 Android TalkBack / iOS VoiceOver / Web NVDA 等
   */
  private detectScreenReader(): void {
    let screenReaderType: ScreenReaderType = 'none';
    let enabled = false;

    const ua = navigator.userAgent.toLowerCase();

    if (/android/.test(ua)) {
      if (window['talkback'] !== undefined || this.detectAndroidAccessibilityService()) {
        screenReaderType = 'talkback';
        enabled = true;
      }
    } else if (/iphone|ipad|ipod/.test(ua) || /macintosh/.test(ua)) {
      if (this.detectiOSVoiceOver()) {
        screenReaderType = 'voiceover';
        enabled = true;
      }
    } else {
      if (this.detectNVDA() || this.detectJAWS() || this.detectVoiceOverMac()) {
        screenReaderType = this.detectNVDA() ? 'nvda' : 'unknown';
        enabled = true;
      }
    }

    if (this.detectGenericScreenReader()) {
      enabled = true;
      if (screenReaderType === 'none') {
        screenReaderType = 'unknown';
      }
    }

    this.state.screenReaderEnabled = enabled;
    this.state.screenReaderType = screenReaderType;
  }

  /**
   * 检测 Android 无障碍服务
   */
  private detectAndroidAccessibilityService(): boolean {
    try {
      if ('accessibility' in navigator) {
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  /**
   * 检测 iOS VoiceOver
   */
  private detectiOSVoiceOver(): boolean {
    try {
      if (window['webkit'] && window['webkit']['notification']) {
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  /**
   * 检测 NVDA 屏幕阅读器
   */
  private detectNVDA(): boolean {
    try {
      if (document.querySelector('[data-nvda]')) {
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  /**
   * 检测 JAWS 屏幕阅读器
   */
  private detectJAWS(): boolean {
    try {
      if (window['jaws'] !== undefined) {
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  /**
   * 检测 macOS VoiceOver
   */
  private detectVoiceOverMac(): boolean {
    return false;
  }

  /**
   * 通用屏幕阅读器检测
   * 通过检测一些常见的屏幕阅读器特征
   */
  private detectGenericScreenReader(): boolean {
    try {
      const style = document.createElement('span').style;
      if ('speech' in style) {
        return true;
      }
    } catch {
      // ignore
    }

    try {
      if (window.matchMedia('(speech: active)').matches) {
        return true;
      }
    } catch {
      // ignore
    }

    return false;
  }

  /**
   * 检测字体大小偏好
   */
  private detectFontScale(): void {
    if (typeof window === 'undefined') return;

    const rootFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    const baseFontSize = 16;
    const scaleValue = rootFontSize / baseFontSize;

    let fontScale: FontScale = 'md';

    if (scaleValue <= 0.75) {
      fontScale = 'xs';
    } else if (scaleValue <= 0.85) {
      fontScale = 'sm';
    } else if (scaleValue <= 1.15) {
      fontScale = 'md';
    } else if (scaleValue <= 1.4) {
      fontScale = 'lg';
    } else if (scaleValue <= 1.8) {
      fontScale = 'xl';
    } else {
      fontScale = 'xxl';
    }

    this.state.fontScale = fontScale;
    this.state.fontScaleValue = scaleValue;

    const mql = window.matchMedia('(text-zoom: 100%)');
    const handler = () => this.detectFontScale();
    mql.addEventListener?.('change', handler);
  }

  /**
   * 检测减少动画偏好 (prefers-reduced-motion)
   */
  private detectPrefersReducedMotion(): void {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.state.prefersReducedMotion = mql.matches;

    const handler = (e: MediaQueryListEvent) => {
      this.state.prefersReducedMotion = e.matches;
      this.notifyListeners();
    };
    mql.addEventListener?.('change', handler);
    this.mediaQueryListeners.push({ mql, handler });
  }

  /**
   * 检测高对比度偏好
   */
  private detectHighContrast(): void {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(prefers-contrast: more)');
    this.state.highContrast = mql.matches;

    const handler = (e: MediaQueryListEvent) => {
      this.state.highContrast = e.matches;
      this.notifyListeners();
    };
    mql.addEventListener?.('change', handler);
    this.mediaQueryListeners.push({ mql, handler });

    const forcedColorsMql = window.matchMedia('(forced-colors: active)');
    if (forcedColorsMql.matches) {
      this.state.highContrast = true;
    }
    const forcedColorsHandler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        this.state.highContrast = true;
      }
      this.notifyListeners();
    };
    forcedColorsMql.addEventListener?.('change', forcedColorsHandler);
    this.mediaQueryListeners.push({ mql: forcedColorsMql, handler: forcedColorsHandler });
  }

  /**
   * 检测减少透明度偏好
   */
  private detectReducedTransparency(): void {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(prefers-reduced-transparency: reduce)');
    this.state.reducedTransparency = mql.matches;

    const handler = (e: MediaQueryListEvent) => {
      this.state.reducedTransparency = e.matches;
      this.notifyListeners();
    };
    mql.addEventListener?.('change', handler);
    this.mediaQueryListeners.push({ mql, handler });
  }

  /**
   * 检测反色偏好
   */
  private detectInvertColors(): void {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(inverted-colors: inverted)');
    this.state.invertColors = mql.matches;

    const handler = (e: MediaQueryListEvent) => {
      this.state.invertColors = e.matches;
      this.notifyListeners();
    };
    mql.addEventListener?.('change', handler);
    this.mediaQueryListeners.push({ mql, handler });
  }

  /**
   * 确保公告元素存在
   * 用于 aria-live 区域动态公告
   */
  private ensureAnnouncer(): void {
    if (typeof document === 'undefined') return;
    if (this.announcerElement) return;

    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    announcer.style.position = 'absolute';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.padding = '0';
    announcer.style.margin = '-1px';
    announcer.style.overflow = 'hidden';
    announcer.style.clip = 'rect(0, 0, 0, 0)';
    announcer.style.whiteSpace = 'nowrap';
    announcer.style.border = '0';

    document.body.appendChild(announcer);
    this.announcerElement = announcer;
  }

  /**
   * 动态内容公告
   * 用于向屏幕阅读器宣布动态内容变化
   */
  announce(message: string, priority: AnnouncementPriority = 'polite'): void {
    if (typeof document === 'undefined') return;

    this.ensureAnnouncer();

    if (!this.announcerElement) return;

    this.announcerElement.setAttribute('aria-live', priority);

    this.announcerElement.textContent = '';

    requestAnimationFrame(() => {
      if (this.announcerElement) {
        this.announcerElement.textContent = message;
      }
    });
  }

  /**
   * 获取当前无障碍状态
   */
  getState(): AccessibilityState {
    return { ...this.state };
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: (state: AccessibilityState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.mediaQueryListeners.forEach(({ mql, handler }) => {
      mql.removeEventListener?.('change', handler);
    });
    this.mediaQueryListeners = [];
    this.listeners.clear();

    if (this.announcerElement && this.announcerElement.parentNode) {
      this.announcerElement.parentNode.removeChild(this.announcerElement);
      this.announcerElement = null;
    }
  }
}

export const A11yManager = new A11yManagerClass();

if (typeof window !== 'undefined') {
  A11yManager.init();
}

// ============================================================
// announceForAccessibility 便捷函数
// ============================================================

/**
 * 无障碍公告函数
 * 用于动态内容变化时通知屏幕阅读器
 *
 * @param message 公告消息
 * @param priority 公告优先级 polite | assertive
 */
export function announceForAccessibility(
  message: string,
  priority: AnnouncementPriority = 'polite'
): void {
  A11yManager.announce(message, priority);
}

// ============================================================
// useAccessibility React Hook
// ============================================================

/**
 * useAccessibility Hook
 * 提供无障碍状态的响应式访问
 *
 * @returns 无障碍状态和公告函数
 */
export function useAccessibility() {
  const [state, setState] = useState<AccessibilityState>(() =>
    A11yManager.getState()
  );

  useEffect(() => {
    const unsubscribe = A11yManager.subscribe((newState) => {
      setState(newState);
    });

    setState(A11yManager.getState());

    return unsubscribe;
  }, []);

  const announce = useCallback(
    (message: string, priority: AnnouncementPriority = 'polite') => {
      A11yManager.announce(message, priority);
    },
    []
  );

  return {
    ...state,
    announce,
    announceForAccessibility: announce,
    screenReaderEnabled: state.screenReaderEnabled,
    screenReaderType: state.screenReaderType,
    prefersReducedMotion: state.prefersReducedMotion,
    highContrast: state.highContrast,
    fontScale: state.fontScale,
    fontScaleValue: state.fontScaleValue,
    reducedTransparency: state.reducedTransparency,
    invertColors: state.invertColors,
  };
}

export default A11yManager;
