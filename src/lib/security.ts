/**
 * OPPO级别安全工具库
 * 提供输入验证、数据清理、防XSS等安全功能
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 工具函数：合并类名
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// XSS防护：清理HTML内容
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// XSS防护：安全设置innerHTML
export function safeInnerHtml(element: HTMLElement, content: string): void {
  element.textContent = content;
}

// 输入验证：字符串长度检查
export function validateStringLength(
  value: string,
  min: number = 0,
  max: number = 1000
): boolean {
  const length = value?.length || 0;
  return length >= min && length <= max;
}

// 输入验证：清理字符串
export function sanitizeString(value: string | null | undefined): string {
  if (value == null) return '';
  return String(value).trim();
}

// 输入验证：安全获取数字
export function safeNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

// 输入验证：安全ID生成
export function generateSafeId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 安全存储工具
export const SafeStorage = {
  setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('SafeStorage setItem error:', error);
    }
  },

  getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item == null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('SafeStorage getItem error:', error);
      return defaultValue;
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('SafeStorage removeItem error:', error);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('SafeStorage clear error:', error);
    }
  },
};

// 数据验证：宠物数据
export function validatePet(pet: any): boolean {
  return (
    pet &&
    typeof pet === 'object' &&
    typeof pet.id === 'string' &&
    typeof pet.name === 'string' &&
    typeof pet.breed === 'string' &&
    typeof pet.age === 'number'
  );
}

// 数据验证：分析数据
export function validateAnalysis(analysis: any): boolean {
  return (
    analysis &&
    typeof analysis === 'object' &&
    typeof analysis.petId === 'string' &&
    ['voice', 'image'].includes(analysis.type) &&
    analysis.result &&
    typeof analysis.result === 'object'
  );
}

// 安全JSON解析
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

// 安全JSON字符串化
export function safeJsonStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

// 防止点击劫持
export function preventClickJacking(): void {
  if (typeof window !== 'undefined') {
    try {
      if (window.top !== window.self) {
        window.top.location.href = window.self.location.href;
      }
    } catch {
      // 忽略跨域错误
    }
  }
}

// 内容安全策略辅助
export function getCspMeta(): string {
  return `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.trim().replace(/\s+/g, ' ');
}
