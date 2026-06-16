/**
 * Logger Utility - 生产环境安全日志工具
 *
 * 开发环境：正常输出日志
 * 生产环境：静默所有 console.log，仅保留 console.warn/error
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.debug(...args);
    }
  },
  table: (data: unknown): void => {
    if (isDev) {
      console.table(data);
    }
  },
  group: (label: string): void => {
    if (isDev) {
      console.group(label);
    }
  },
  groupEnd: (): void => {
    if (isDev) {
      console.groupEnd();
    }
  },
};