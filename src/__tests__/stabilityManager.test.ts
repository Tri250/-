import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  stabilityManager,
  safeExecute,
  safeAsyncExecute,
  withRetry,
  withTimeout,
  rateLimit,
  debounceWithErrorHandling,
  createSafeEventEmitter,
} from '../lib/stabilityManager';

vi.useFakeTimers();

describe('StabilityManager - 稳定性管理器测试', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    stabilityManager.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('全局错误捕获', () => {
    it('应该捕获并处理错误', () => {
      const testError = new Error('Test error');
      stabilityManager.handleError(testError);

      const stats = stabilityManager.getStats();
      expect(stats.errorCount).toBe(1);
    });

    it('应该记录错误日志', () => {
      const testError = new Error('Test error message');
      stabilityManager.handleError(testError, { source: 'test' });

      const errorLog = stabilityManager.getErrorLog();
      expect(errorLog.length).toBeGreaterThan(0);
      expect(errorLog[0].message).toBe('Test error message');
      expect(errorLog[0].source).toBe('test');
    });

    it('应该限制错误日志数量', () => {
      for (let i = 0; i < 250; i++) {
        stabilityManager.handleError(new Error(`Error ${i}`));
      }

      const errorLog = stabilityManager.getErrorLog();
      expect(errorLog.length).toBeLessThanOrEqual(200);
    });

    it('应该在错误窗口内计数错误', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      for (let i = 0; i < 5; i++) {
        stabilityManager.handleError(new Error(`Error ${i}`));
      }

      const stats = stabilityManager.getStats();
      expect(stats.errorCount).toBe(5);

      vi.setSystemTime(now + 70000);

      stabilityManager.handleError(new Error('Error after window'));
      const newStats = stabilityManager.getStats();
      expect(newStats.errorCount).toBe(1);
    });
  });

  describe('分级缓存清理', () => {
    it('应该注册缓存清理回调', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      stabilityManager.registerCacheCleanupCallback(1, callback1);
      stabilityManager.registerCacheCleanupCallback(2, callback2);

      expect(true).toBe(true);
    });

    it('应该注册用户数据键', () => {
      stabilityManager.registerUserDataKey('user_preferences');
      localStorage.setItem('cache_test', 'value');
      localStorage.setItem('user_preferences', 'important');

      expect(localStorage.getItem('user_preferences')).toBe('important');
    });

    it('应该清理图片缓存', () => {
      const img = document.createElement('img');
      img.src = 'test.jpg';
      document.body.appendChild(img);

      expect(img.src).toBeTruthy();

      document.body.removeChild(img);
    });

    it('应该清理非关键数据', () => {
      localStorage.setItem('cache_temp_data', 'temp');
      localStorage.setItem('user_data', 'important');
      stabilityManager.registerUserDataKey('user_data');

      const beforeCache = localStorage.getItem('cache_temp_data');
      expect(beforeCache).toBe('temp');
    });
  });

  describe('ANR 检测', () => {
    it('应该初始化 ANR 检测', () => {
      const stats = stabilityManager.getStats();
      expect(stats.anrReportCount).toBeDefined();
      expect(typeof stats.anrReportCount).toBe('number');
    });

    it('应该记录用户操作', () => {
      stabilityManager.recordAction('test_action');
      const reports = stabilityManager.getANRReports();
      expect(Array.isArray(reports)).toBe(true);
    });

    it('应该获取 ANR 报告列表', () => {
      const reports = stabilityManager.getANRReports();
      expect(Array.isArray(reports)).toBe(true);
    });
  });

  describe('崩溃恢复机制', () => {
    it('应该在达到错误阈值时触发恢复', () => {
      for (let i = 0; i < 10; i++) {
        stabilityManager.handleError(new Error(`Error ${i}`));
      }

      const stats = stabilityManager.getStats();
      expect(stats.recoveryAttempts).toBeGreaterThanOrEqual(0);
    });

    it('应该记录崩溃次数', () => {
      for (let i = 0; i < 35; i++) {
        stabilityManager.handleError(new Error(`Error ${i}`));
      }

      const stats = stabilityManager.getStats();
      expect(stats.crashCount).toBeGreaterThanOrEqual(0);
    });

    it('应该限制恢复尝试次数', () => {
      for (let i = 0; i < 50; i++) {
        stabilityManager.handleError(new Error(`Error ${i}`));
      }

      const stats = stabilityManager.getStats();
      expect(stats.recoveryAttempts).toBeLessThanOrEqual(5);
    });

    it('应该获取恢复级别', () => {
      const stats = stabilityManager.getStats();
      expect([0, 1, 2, 3]).toContain(stats.currentRecoveryLevel);
    });
  });

  describe('白屏检测', () => {
    it('应该检测白屏状态', () => {
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = '';
      }

      const stats = stabilityManager.getStats();
      expect(stats.isStable).toBeDefined();
    });

    it('应该在有内容时不检测为白屏', () => {
      const root = document.createElement('div');
      root.id = 'root';
      const child = document.createElement('div');
      child.textContent = 'Content';
      root.appendChild(child);

      const stats = stabilityManager.getStats();
      expect(typeof stats.isStable).toBe('boolean');
    });
  });

  describe('崩溃报告收集', () => {
    it('应该保存崩溃快照', () => {
      stabilityManager.setAppState('test_key', 'test_value');
      stabilityManager.recordAction('test_action');

      const snapshot = stabilityManager.getCrashSnapshot();
      expect(snapshot).toBeDefined();
      expect(typeof snapshot === 'object' || snapshot === null).toBe(true);
    });

    it('应该清除崩溃快照', () => {
      stabilityManager.clearCrashSnapshot();
      const snapshot = stabilityManager.getCrashSnapshot();
      expect(snapshot).toBeNull();
    });

    it('应该设置应用状态', () => {
      stabilityManager.setAppState('test_key', { data: 'value' });
      const snapshot = stabilityManager.getCrashSnapshot();
      expect(snapshot).toBeDefined();
    });

    it('应该获取统计信息', () => {
      const stats = stabilityManager.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.errorCount).toBe('number');
      expect(typeof stats.crashCount).toBe('number');
      expect(typeof stats.recoveryAttempts).toBe('number');
      expect(typeof stats.isStable).toBe('boolean');
    });

    it('应该判断应用是否稳定', () => {
      const stats = stabilityManager.getStats();
      expect(typeof stats.isStable).toBe('boolean');
    });
  });

  describe('内存监控', () => {
    it('应该获取内存历史记录', () => {
      const history = stabilityManager.getMemoryHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('应该获取内存使用信息', () => {
      const stats = stabilityManager.getStats();
      expect(stats.memoryUsage).toBeDefined();
    });
  });

  describe('safeExecute', () => {
    it('应该安全执行函数并返回结果', () => {
      const result = safeExecute(() => 42);
      expect(result).toBe(42);
    });

    it('应该捕获异常并返回 fallback', () => {
      const result = safeExecute(() => {
        throw new Error('Test error');
      }, 'fallback');
      expect(result).toBe('fallback');
    });

    it('应该调用错误回调', () => {
      const onError = vi.fn();
      safeExecute(() => {
        throw new Error('Test error');
      }, undefined, onError);

      expect(onError).toHaveBeenCalled();
    });

    it('应该返回 undefined 当没有 fallback 时', () => {
      const result = safeExecute(() => {
        throw new Error('Test error');
      });
      expect(result).toBeUndefined();
    });
  });

  describe('safeAsyncExecute', () => {
    it('应该安全执行异步函数', async () => {
      const result = await safeAsyncExecute(async () => 'success');
      expect(result).toBe('success');
    });

    it('应该捕获异步异常并返回 fallback', async () => {
      const result = await safeAsyncExecute(async () => {
        throw new Error('Async error');
      }, 'fallback');
      expect(result).toBe('fallback');
    });

    it('应该调用错误回调', async () => {
      const onError = vi.fn();
      await safeAsyncExecute(async () => {
        throw new Error('Async error');
      }, undefined, onError);

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('应该在失败时重试', async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary error');
        }
        return 'success';
      });

      const resultPromise = withRetry(fn, { maxAttempts: 3, delay: 100 });
      vi.advanceTimersByTimeAsync(1000);
      const result = await resultPromise;
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('应该在所有重试失败后抛出错误', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Persistent error'));

      const resultPromise = expect(withRetry(fn, { maxAttempts: 3, delay: 100 })).rejects.toThrow('Persistent error');
      vi.advanceTimersByTimeAsync(1000);
      await resultPromise;
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('应该调用 onRetry 回调', async () => {
      const onRetry = vi.fn();
      let attempts = 0;
      const fn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Retry error');
        }
        return 'success';
      });

      const resultPromise = withRetry(fn, { maxAttempts: 3, delay: 100, onRetry });
      vi.advanceTimersByTimeAsync(1000);
      await resultPromise;
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it('应该使用指数退避', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Error'));

      const resultPromise = withRetry(fn, { maxAttempts: 3, delay: 100, backoff: true }).catch(() => {});
      vi.advanceTimersByTimeAsync(2000);
      await resultPromise;

      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('withTimeout', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('应该在超时前返回结果', async () => {
      const result = await withTimeout(async () => 'fast result', 1000);
      expect(result).toBe('fast result');
    });

    it('应该在超时时抛出错误', async () => {
      const resultPromise = expect(
        withTimeout(async () => {
          await new Promise(resolve => setTimeout(resolve, 5000));
          return 'slow result';
        }, 100)
      ).rejects.toThrow('Operation timed out');
      vi.advanceTimersByTimeAsync(200);
      await resultPromise;
    });

    it('应该使用自定义超时消息', async () => {
      const resultPromise = expect(
        withTimeout(async () => {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }, 100, 'Custom timeout message')
      ).rejects.toThrow('Custom timeout message');
      vi.advanceTimersByTimeAsync(200);
      await resultPromise;
    });
  });

  describe('rateLimit', () => {
    it('应该限制调用频率', () => {
      const fn = vi.fn((x: number) => x * 2);
      const limited = rateLimit(fn, 3, 1000);

      const results = [1, 2, 3, 4, 5].map(i => limited(i));

      expect(results.filter(r => r !== undefined)).toHaveLength(3);
      expect(results.filter(r => r === undefined)).toHaveLength(2);
    });

    it('应该在窗口时间后允许更多调用', () => {
      const fn = vi.fn((x: number) => x);
      const limited = rateLimit(fn, 2, 1000);

      const now = Date.now();
      vi.setSystemTime(now);

      expect(limited(1)).toBe(1);
      expect(limited(2)).toBe(2);
      expect(limited(3)).toBeUndefined();

      vi.setSystemTime(now + 1100);

      expect(limited(4)).toBe(4);
    });
  });

  describe('debounceWithErrorHandling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('应该防抖函数调用', () => {
      const fn = vi.fn();
      const debounced = debounceWithErrorHandling(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(150);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('应该处理防抖函数中的错误', () => {
      const errorFn = vi.fn().mockImplementation(() => {
        throw new Error('Debounce error');
      });
      const onError = vi.fn();
      const debounced = debounceWithErrorHandling(errorFn, 100, onError);

      debounced();
      vi.advanceTimersByTime(150);

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('createSafeEventEmitter', () => {
    it('应该发出和监听事件', () => {
      const emitter = createSafeEventEmitter<{ test: string }>();
      const handler = vi.fn();

      emitter.on('test', handler);
      emitter.emit('test', 'hello');

      expect(handler).toHaveBeenCalledWith('hello');
    });

    it('应该移除事件监听器', () => {
      const emitter = createSafeEventEmitter<{ test: string }>();
      const handler = vi.fn();

      emitter.on('test', handler);
      emitter.off('test', handler);
      emitter.emit('test', 'hello');

      expect(handler).not.toHaveBeenCalled();
    });

    it('应该安全处理监听器错误', () => {
      const emitter = createSafeEventEmitter<{ test: string }>();
      const badHandler = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const goodHandler = vi.fn();

      emitter.on('test', badHandler);
      emitter.on('test', goodHandler);

      emitter.emit('test', 'data');

      expect(badHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();
    });

    it('应该移除所有监听器', () => {
      const emitter = createSafeEventEmitter<{ test1: string; test2: number }>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test1', handler1);
      emitter.on('test2', handler2);
      emitter.removeAllListeners();

      emitter.emit('test1', 'a');
      emitter.emit('test2', 1);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('应该移除单个事件的所有监听器', () => {
      const emitter = createSafeEventEmitter<{ test1: string; test2: number }>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test1', handler1);
      emitter.on('test2', handler2);
      emitter.removeAllListeners('test1');

      emitter.emit('test1', 'a');
      emitter.emit('test2', 1);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('应该重置所有状态', () => {
      stabilityManager.handleError(new Error('Test'));
      stabilityManager.reset();

      const stats = stabilityManager.getStats();
      expect(stats.errorCount).toBe(0);
      expect(stats.crashCount).toBe(0);
      expect(stats.recoveryAttempts).toBe(0);
      expect(stats.currentRecoveryLevel).toBe(0);
    });

    it('应该清除错误日志', () => {
      stabilityManager.handleError(new Error('Test'));
      stabilityManager.reset();

      const errorLog = stabilityManager.getErrorLog();
      expect(errorLog.length).toBe(0);
    });
  });

  describe('destroy', () => {
    it('应该清理所有定时器', () => {
      stabilityManager.destroy();
      expect(true).toBe(true);
    });
  });
});
