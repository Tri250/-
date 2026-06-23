import { describe, it, expect, vi } from 'vitest';
import { cryptoUtils, secureStorage } from '../utils/security';

interface BenchmarkResult {
  name: string;
  operations: number;
  durationMs: number;
  opsPerSecond: number;
  avgDurationMs: number;
  status: 'pass' | 'warn' | 'fail';
}

interface PerformanceReport {
  timestamp: string;
  overallStatus: 'pass' | 'warn' | 'fail';
  benchmarks: BenchmarkResult[];
  summary: {
    totalTests: number;
    passed: number;
    warned: number;
    failed: number;
  };
}

const BASELINE = {
  aesGcmEncrypt: { minOpsPerSec: 500, warnOpsPerSec: 1000 },
  aesGcmDecrypt: { minOpsPerSec: 500, warnOpsPerSec: 1000 },
  cacheWrite: { minOpsPerSec: 5000, warnOpsPerSec: 10000 },
  cacheRead: { minOpsPerSec: 10000, warnOpsPerSec: 20000 },
  jsonSerialize: { minOpsPerSec: 10000, warnOpsPerSec: 20000 },
  jsonParse: { minOpsPerSec: 10000, warnOpsPerSec: 20000 },
  stringConcat: { minOpsPerSec: 50000, warnOpsPerSec: 100000 },
  stringReplace: { minOpsPerSec: 20000, warnOpsPerSec: 50000 },
};

function runBenchmark(name: string, fn: () => void, iterations: number): BenchmarkResult {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const durationMs = performance.now() - start;
  const opsPerSecond = (iterations / durationMs) * 1000;
  const avgDurationMs = durationMs / iterations;

  const baseline = (BASELINE as Record<string, { minOpsPerSec: number; warnOpsPerSec: number }>)[name];
  let status: 'pass' | 'warn' | 'fail' = 'pass';
  if (baseline) {
    if (opsPerSecond < baseline.minOpsPerSec) {
      status = 'fail';
    } else if (opsPerSecond < baseline.warnOpsPerSec) {
      status = 'warn';
    }
  }

  return {
    name,
    operations: iterations,
    durationMs,
    opsPerSecond: Math.round(opsPerSecond * 100) / 100,
    avgDurationMs: Math.round(avgDurationMs * 10000) / 10000,
    status,
  };
}

async function runAsyncBenchmark(
  name: string,
  fn: () => Promise<void>,
  iterations: number
): Promise<BenchmarkResult> {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  const durationMs = performance.now() - start;
  const opsPerSecond = (iterations / durationMs) * 1000;
  const avgDurationMs = durationMs / iterations;

  const baseline = (BASELINE as Record<string, { minOpsPerSec: number; warnOpsPerSec: number }>)[name];
  let status: 'pass' | 'warn' | 'fail' = 'pass';
  if (baseline) {
    if (opsPerSecond < baseline.minOpsPerSec) {
      status = 'fail';
    } else if (opsPerSecond < baseline.warnOpsPerSec) {
      status = 'warn';
    }
  }

  return {
    name,
    operations: iterations,
    durationMs,
    opsPerSecond: Math.round(opsPerSecond * 100) / 100,
    avgDurationMs: Math.round(avgDurationMs * 10000) / 10000,
    status,
  };
}

function generateReport(results: BenchmarkResult[]): PerformanceReport {
  const passed = results.filter(r => r.status === 'pass').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;

  let overallStatus: 'pass' | 'warn' | 'fail' = 'pass';
  if (failed > 0) {
    overallStatus = 'fail';
  } else if (warned > 0) {
    overallStatus = 'warn';
  }

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    benchmarks: results,
    summary: {
      totalTests: results.length,
      passed,
      warned,
      failed,
    },
  };
}

describe('Performance Benchmark - 性能基准测试', () => {
  const results: BenchmarkResult[] = [];

  describe('AES-GCM 加密/解密性能', () => {
    const key = cryptoUtils.generateSecureKeyBytes(32);
    const testData = JSON.stringify({
      id: 'test-123',
      name: '测试宠物',
      age: 3,
      type: 'dog',
      breed: '金毛寻回犬',
      weight: 25.5,
      health: {
        vaccinated: true,
        lastCheckup: '2024-01-01',
        conditions: [],
      },
      owners: [
        { id: 1, name: '张三', relation: '主人' },
        { id: 2, name: '李四', relation: '家人' },
      ],
    });

    it('AES-GCM 加密性能', async () => {
      const result = await runAsyncBenchmark(
        'aesGcmEncrypt',
        async () => {
          await cryptoUtils.aesGcmEncrypt(testData, key);
        },
        100
      );

      results.push(result);

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.status).not.toBe('fail');
    });

    it('AES-GCM 解密性能', async () => {
      const encrypted = await cryptoUtils.aesGcmEncrypt(testData, key);

      const result = await runAsyncBenchmark(
        'aesGcmDecrypt',
        async () => {
          await cryptoUtils.aesGcmDecrypt(encrypted, key);
        },
        100
      );

      results.push(result);

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.status).not.toBe('fail');
    });

    it('AES-GCM 大数据加密性能', async () => {
      const largeData = 'x'.repeat(10000);

      const result = await runAsyncBenchmark(
        'aesGcmEncryptLarge',
        async () => {
          await cryptoUtils.aesGcmEncrypt(largeData, key);
        },
        50
      );

      console.log(`[Benchmark] ${result.name} (10KB): ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });
  });

  describe('缓存读写性能', () => {
    const testKey = 'benchmark_test_key';
    const testValue = {
      id: 'data-1',
      name: '测试数据',
      timestamp: Date.now(),
      items: Array.from({ length: 10 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      })),
    };

    it('缓存写入性能', async () => {
      const result = await runAsyncBenchmark(
        'cacheWrite',
        async () => {
          await secureStorage.set(testKey, testValue, false, false);
        },
        500
      );

      results.push(result);

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.status).not.toBe('fail');
    });

    it('缓存读取性能', async () => {
      await secureStorage.set(testKey, testValue, false, false);

      const result = await runAsyncBenchmark(
        'cacheRead',
        async () => {
          await secureStorage.get(testKey, false, false);
        },
        1000
      );

      results.push(result);

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.status).not.toBe('fail');
    });

    it('加密缓存写入性能', async () => {
      const result = await runAsyncBenchmark(
        'encryptedCacheWrite',
        async () => {
          await secureStorage.set(testKey, testValue, true, false);
        },
        200
      );

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });

    it('加密缓存读取性能', async () => {
      await secureStorage.set(testKey, testValue, true, false);

      const result = await runAsyncBenchmark(
        'encryptedCacheRead',
        async () => {
          await secureStorage.get(testKey, true, false);
        },
        200
      );

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });

    it('localStorage 原生读写性能', () => {
      const nativeResult = runBenchmark(
        'localStorageNativeWrite',
        () => {
          localStorage.setItem('native_test', JSON.stringify(testValue));
        },
        1000
      );

      console.log(`[Benchmark] ${nativeResult.name}: ${nativeResult.opsPerSecond} ops/sec`);

      const readResult = runBenchmark(
        'localStorageNativeRead',
        () => {
          localStorage.getItem('native_test');
        },
        2000
      );

      console.log(`[Benchmark] ${readResult.name}: ${readResult.opsPerSecond} ops/sec`);

      expect(nativeResult.opsPerSecond).toBeGreaterThan(0);
      expect(readResult.opsPerSecond).toBeGreaterThan(0);
    });
  });

  describe('JSON 序列化性能', () => {
    const smallObject = { id: 1, name: 'test', value: 42 };

    const mediumObject = {
      id: 'abc-123',
      name: '测试对象',
      type: 'medium',
      data: {
        nested: {
          array: Array.from({ length: 10 }, (_, i) => ({
            index: i,
            value: `item-${i}`,
            active: i % 2 === 0,
          })),
        },
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      },
    };

    const largeObject = {
      id: 'large-1',
      items: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `This is item number ${i} with a longer description to test performance`,
        price: Math.random() * 100,
        category: ['A', 'B', 'C'][i % 3],
        tags: Array.from({ length: 5 }, (_, j) => `tag-${i}-${j}`),
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          views: Math.floor(Math.random() * 1000),
        },
      })),
      pagination: {
        total: 1000,
        page: 1,
        perPage: 100,
      },
    };

    it('JSON 序列化 (小对象)', () => {
      const result = runBenchmark(
        'jsonSerializeSmall',
        () => {
          JSON.stringify(smallObject);
        },
        10000
      );

      results.push(result);

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.status).not.toBe('fail');
    });

    it('JSON 序列化 (中对象)', () => {
      const result = runBenchmark(
        'jsonSerialize',
        () => {
          JSON.stringify(mediumObject);
        },
        5000
      );

      results.push(result);

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.status).not.toBe('fail');
    });

    it('JSON 序列化 (大对象)', () => {
      const result = runBenchmark(
        'jsonSerializeLarge',
        () => {
          JSON.stringify(largeObject);
        },
        1000
      );

      console.log(`[Benchmark] ${result.name} (100 items): ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });

    it('JSON 解析 (小对象)', () => {
      const jsonStr = JSON.stringify(smallObject);

      const result = runBenchmark(
        'jsonParseSmall',
        () => {
          JSON.parse(jsonStr);
        },
        10000
      );

      results.push(result);

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.status).not.toBe('fail');
    });

    it('JSON 解析 (中对象)', () => {
      const jsonStr = JSON.stringify(mediumObject);

      const result = runBenchmark(
        'jsonParse',
        () => {
          JSON.parse(jsonStr);
        },
        5000
      );

      results.push(result);

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.status).not.toBe('fail');
    });

    it('JSON 解析 (大对象)', () => {
      const jsonStr = JSON.stringify(largeObject);

      const result = runBenchmark(
        'jsonParseLarge',
        () => {
          JSON.parse(jsonStr);
        },
        1000
      );

      console.log(`[Benchmark] ${result.name} (100 items): ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });

    it('JSON 序列化 + 解析往返', () => {
      const result = runBenchmark(
        'jsonRoundTrip',
        () => {
          const str = JSON.stringify(mediumObject);
          JSON.parse(str);
        },
        2000
      );

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });
  });

  describe('字符串处理性能', () => {
    const testString = 'Hello World! 这是一个测试字符串，用于性能测试。'.repeat(10);

    it('字符串拼接性能', () => {
      const result = runBenchmark(
        'stringConcat',
        () => {
          let result = '';
          for (let i = 0; i < 10; i++) {
            result += 'part' + i + '-';
          }
          return result;
        },
        5000
      );

      results.push(result);

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.status).not.toBe('fail');
    });

    it('模板字符串性能', () => {
      const result = runBenchmark(
        'templateString',
        () => {
          const arr = Array.from({ length: 10 }, (_, i) => `part${i}-`);
          return arr.join('');
        },
        5000
      );

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });

    it('字符串替换性能', () => {
      const result = runBenchmark(
        'stringReplace',
        () => {
          testString.replace('测试', '替换').replace('性能', '效率');
        },
        5000
      );

      results.push(result);

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.status).not.toBe('fail');
    });

    it('正则表达式替换性能', () => {
      const result = runBenchmark(
        'regexReplace',
        () => {
          testString.replace(/测试/g, '替换').replace(/性能/g, '效率');
        },
        2000
      );

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });

    it('字符串分割性能', () => {
      const result = runBenchmark(
        'stringSplit',
        () => {
          testString.split('，');
        },
        5000
      );

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });

    it('字符串截取性能', () => {
      const result = runBenchmark(
        'stringSubstring',
        () => {
          testString.substring(0, 50);
          testString.slice(-10);
        },
        10000
      );

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });

    it('Base64 编解码性能', () => {
      const encoded = cryptoUtils.encodeBase64(testString);

      const encodeResult = runBenchmark(
        'base64Encode',
        () => {
          cryptoUtils.encodeBase64(testString);
        },
        5000
      );

      console.log(`[Benchmark] ${encodeResult.name}: ${encodeResult.opsPerSecond} ops/sec`);

      const decodeResult = runBenchmark(
        'base64Decode',
        () => {
          cryptoUtils.decodeBase64(encoded);
        },
        5000
      );

      console.log(`[Benchmark] ${decodeResult.name}: ${decodeResult.opsPerSecond} ops/sec`);

      expect(encodeResult.opsPerSecond).toBeGreaterThan(0);
      expect(decodeResult.opsPerSecond).toBeGreaterThan(0);
    });

    it('SHA-256 哈希性能', async () => {
      const result = await runAsyncBenchmark(
        'sha256Hash',
        async () => {
          await cryptoUtils.sha256(testString);
        },
        500
      );

      console.log(`[Benchmark] ${result.name}: ${result.opsPerSecond} ops/sec, avg ${result.avgDurationMs}ms`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });
  });

  describe('数组操作性能', () => {
    const arraySize = 1000;
    const testArray = Array.from({ length: arraySize }, (_, i) => ({
      id: i,
      value: Math.random(),
      category: ['A', 'B', 'C'][i % 3],
      active: i % 2 === 0,
    }));

    it('数组过滤性能', () => {
      const result = runBenchmark(
        'arrayFilter',
        () => {
          testArray.filter(item => item.active && item.category === 'A');
        },
        1000
      );

      console.log(`[Benchmark] ${result.name} (${arraySize} items): ${result.opsPerSecond} ops/sec`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });

    it('数组映射性能', () => {
      const result = runBenchmark(
        'arrayMap',
        () => {
          testArray.map(item => ({
            ...item,
            doubled: item.value * 2,
          }));
        },
        1000
      );

      console.log(`[Benchmark] ${result.name} (${arraySize} items): ${result.opsPerSecond} ops/sec`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });

    it('数组归约性能', () => {
      const result = runBenchmark(
        'arrayReduce',
        () => {
          testArray.reduce((sum, item) => sum + item.value, 0);
        },
        2000
      );

      console.log(`[Benchmark] ${result.name} (${arraySize} items): ${result.opsPerSecond} ops/sec`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });

    it('数组查找性能', () => {
      const result = runBenchmark(
        'arrayFind',
        () => {
          testArray.find(item => item.id === 500);
        },
        5000
      );

      console.log(`[Benchmark] ${result.name} (${arraySize} items): ${result.opsPerSecond} ops/sec`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });

    it('数组排序性能', () => {
      const result = runBenchmark(
        'arraySort',
        () => {
          [...testArray].sort((a, b) => a.value - b.value);
        },
        200
      );

      console.log(`[Benchmark] ${result.name} (${arraySize} items): ${result.opsPerSecond} ops/sec`);

      expect(result.opsPerSecond).toBeGreaterThan(0);
    });
  });

  describe('性能报告输出', () => {
    it('应该生成完整的性能报告', () => {
      const report = generateReport(results);

      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.overallStatus).toBeDefined();
      expect(['pass', 'warn', 'fail']).toContain(report.overallStatus);
      expect(report.benchmarks.length).toBeGreaterThan(0);
      expect(report.summary.totalTests).toBe(results.length);

      console.log('\n========== 性能基准测试报告 ==========');
      console.log(`测试时间: ${report.timestamp}`);
      console.log(`总体状态: ${report.overallStatus.toUpperCase()}`);
      console.log(`总计: ${report.summary.totalTests} | 通过: ${report.summary.passed} | 警告: ${report.summary.warned} | 失败: ${report.summary.failed}`);
      console.log('\n详细结果:');

      report.benchmarks.forEach(benchmark => {
        const statusIcon = benchmark.status === 'pass' ? '✓' : benchmark.status === 'warn' ? '⚠' : '✗';
        console.log(
          `${statusIcon} ${benchmark.name}: ${benchmark.opsPerSecond.toLocaleString()} ops/sec ` +
          `(avg ${benchmark.avgDurationMs.toFixed(4)}ms) [${benchmark.status.toUpperCase()}]`
        );
      });

      console.log('=====================================\n');
    });

    it('性能不应该显著退化', () => {
      const failedBenchmarks = results.filter(r => r.status === 'fail');

      if (failedBenchmarks.length > 0) {
        console.warn('以下基准测试未达到最低性能要求:');
        failedBenchmarks.forEach(b => {
          console.warn(`  - ${b.name}: ${b.opsPerSecond} ops/sec`);
        });
      }

      expect(failedBenchmarks.length).toBe(0);
    });
  });
});
