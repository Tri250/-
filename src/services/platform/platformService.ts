// ============================================
// PawSync Pro - Platform Service
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 跨平台服务抽象层，统一处理 Android/iOS/Web 平台差异
// ============================================

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Keyboard } from '@capacitor/keyboard';
import { isPlatform } from '@capacitor/core';

/**
 * 平台类型
 */
export type PlatformType = 'web' | 'android' | 'ios' | 'unknown';

/**
 * 触觉反馈强度
 */
export type HapticImpact = 'light' | 'medium' | 'heavy';

/**
 * 触觉反馈类型
 */
export type HapticNotification = 'success' | 'warning' | 'error';

/**
 * 分享选项
 */
export interface ShareOptions {
  title: string;
  text: string;
  url?: string;
  dialogTitle?: string;
}

/**
 * 键盘显示选项
 */
export interface KeyboardOptions {
  animated?: boolean;
}

/**
 * 平台服务类
 * 提供跨平台一致的功能接口
 */
class PlatformService {
  private currentPlatform: PlatformType = 'unknown';

  constructor() {
    this.detectPlatform();
  }

  /**
   * 检测当前平台
   */
  private detectPlatform(): void {
    if (isPlatform('android')) {
      this.currentPlatform = 'android';
    } else if (isPlatform('ios')) {
      this.currentPlatform = 'ios';
    } else if (typeof window !== 'undefined') {
      this.currentPlatform = 'web';
    }
  }

  /**
   * 获取当前平台
   */
  getPlatform(): PlatformType {
    return this.currentPlatform;
  }

  /**
   * 检查是否为原生平台 (Android/iOS)
   */
  isNative(): boolean {
    return this.currentPlatform === 'android' || this.currentPlatform === 'ios';
  }

  /**
   * 检查是否为 Web 平台
   */
  isWeb(): boolean {
    return this.currentPlatform === 'web';
  }

  // ==================== 触觉反馈 ====================

  /**
   * 触发触觉冲击反馈
   * @param style 冲击强度: light | medium | heavy
   */
  async impact(style: HapticImpact = 'medium'): Promise<void> {
    if (!this.isNative()) {
      // Web 端使用 Vibration API 降级
      if ('vibrate' in navigator) {
        const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 30;
        navigator.vibrate(duration);
      }
      return;
    }

    try {
      await Haptics.impact({
        style: ImpactStyle[style.toUpperCase() as keyof typeof ImpactStyle]
      });
    } catch (error) {
      console.warn('[Platform] 触觉反馈失败:', error);
    }
  }

  /**
   * 触发触觉通知反馈
   * @param type 通知类型: success | warning | error
   */
  async notification(type: HapticNotification = 'success'): Promise<void> {
    if (!this.isNative()) {
      // Web 端使用 Vibration API 降级
      if ('vibrate' in navigator) {
        const pattern = type === 'success' ? [50] : type === 'warning' ? [30, 50, 30] : [100];
        navigator.vibrate(pattern);
      }
      return;
    }

    try {
      const notificationType = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error
      }[type];
      
      await Haptics.notification({ type: notificationType });
    } catch (error) {
      console.warn('[Platform] 触觉通知失败:', error);
    }
  }

  /**
   * 触发选择变化反馈
   */
  async selectionChanged(): Promise<void> {
    if (!this.isNative()) return;

    try {
      await Haptics.selectionChanged();
    } catch (error) {
      console.warn('[Platform] 选择反馈失败:', error);
    }
  }

  /**
   * 触发振动
   * @param duration 振动时长 (ms)
   */
  async vibrate(duration: number = 100): Promise<void> {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }

  // ==================== 分享功能 ====================

  /**
   * 分享内容
   * @param options 分享选项
   */
  async share(options: ShareOptions): Promise<boolean> {
    // 原生平台使用 Capacitor Share
    if (this.isNative()) {
      try {
        await Share.share({
          title: options.title,
          text: options.text,
          url: options.url,
          dialogTitle: options.dialogTitle
        });
        return true;
      } catch (error) {
        // 用户取消分享
        if ((error as Error).message?.includes('cancel')) {
          return false;
        }
        console.warn('[Platform] 原生分享失败，降级到 Web Share:', error);
      }
    }

    // Web 端使用 Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url
        });
        return true;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return false; // 用户取消
        }
        console.warn('[Platform] Web Share 失败:', error);
      }
    }

    // 降级：复制到剪贴板
    try {
      const textToCopy = options.url 
        ? `${options.title}\n${options.text}\n${options.url}`
        : `${options.title}\n${options.text}`;
      await navigator.clipboard.writeText(textToCopy);
      return true;
    } catch (error) {
      console.error('[Platform] 复制到剪贴板失败:', error);
      return false;
    }
  }

  /**
   * 检查是否支持分享
   */
  canShare(): boolean {
    return this.isNative() || !!navigator.share || !!navigator.clipboard;
  }

  // ==================== 键盘控制 ====================

  /**
   * 显示键盘
   */
  async showKeyboard(options?: KeyboardOptions): Promise<void> {
    if (!this.isNative()) return;

    try {
      await Keyboard.show();
    } catch (error) {
      console.warn('[Platform] 显示键盘失败:', error);
    }
  }

  /**
   * 隐藏键盘
   */
  async hideKeyboard(options?: KeyboardOptions): Promise<void> {
    if (!this.isNative()) {
      // Web 端：让当前活动元素失焦
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      return;
    }

    try {
      await Keyboard.hide();
    } catch (error) {
      console.warn('[Platform] 隐藏键盘失败:', error);
    }
  }

  /**
   * 设置键盘样式 (iOS 专用)
   * @param style 键盘样式: default | light | dark
   */
  async setKeyboardStyle(style: 'default' | 'light' | 'dark'): Promise<void> {
    if (!this.isNative()) return;

    try {
      await Keyboard.setStyle({ style });
    } catch (error) {
      console.warn('[Platform] 设置键盘样式失败:', error);
    }
  }

  /**
   * 监听键盘显示事件
   */
  onKeyboardShow(callback: (info: { keyboardHeight: number }) => void): void {
    if (!this.isNative()) {
      // Web 端：监听 resize 事件估算键盘高度
      let windowHeight = window.innerHeight;
      window.addEventListener('resize', () => {
        const newHeight = window.innerHeight;
        if (newHeight < windowHeight) {
          callback({ keyboardHeight: windowHeight - newHeight });
        }
      });
      return;
    }

    Keyboard.addListener('keyboardWillShow', callback);
  }

  /**
   * 监听键盘隐藏事件
   */
  onKeyboardHide(callback: () => void): void {
    if (!this.isNative()) {
      window.addEventListener('resize', () => {
        if (window.innerHeight >= screen.height * 0.9) {
          callback();
        }
      });
      return;
    }

    Keyboard.addListener('keyboardWillHide', callback);
  }

  // ==================== 剪贴板 ====================

  /**
   * 写入剪贴板
   */
  async writeToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('[Platform] 写入剪贴板失败:', error);
      return false;
    }
  }

  /**
   * 读取剪贴板
   */
  async readFromClipboard(): Promise<string | null> {
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      console.error('[Platform] 读取剪贴板失败:', error);
      return null;
    }
  }

  // ==================== 应用信息 ====================

  /**
   * 获取应用版本
   */
  getAppVersion(): string {
    return import.meta.env.VITE_APP_VERSION || '1.0.0';
  }

  /**
   * 获取构建号
   */
  getBuildNumber(): string {
    return import.meta.env.VITE_BUILD_NUMBER || '1';
  }
}

// 导出单例
export const platformService = new PlatformService();
export default platformService;
