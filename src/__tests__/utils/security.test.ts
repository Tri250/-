import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cryptoUtils,
  bruteForceProtection,
  csrfProtection,
  sessionManager,
  xssProtection,
} from '../../../src/utils/security';

describe('Security Utils - Comprehensive Tests', () => {
  describe('CryptoUtils - 加密工具测试', () => {
    it('应该正确进行Base64编码解码', () => {
      const original = 'Hello World';
      const encoded = cryptoUtils.encodeBase64(original);
      const decoded = cryptoUtils.decodeBase64(encoded);
      expect(decoded).toBe(original);
    });

    it('应该正确进行XOR加密', () => {
      const original = 'Secret Message';
      const key = 'mykey';
      const encrypted = cryptoUtils.xorEncrypt(original, key);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('应该生成随机字符串', () => {
      const str1 = cryptoUtils.generateRandomString(16);
      const str2 = cryptoUtils.generateRandomString(16);
      expect(str1).toHaveLength(16);
      expect(str2).toHaveLength(16);
      expect(str1).not.toBe(str2);
    });

    it('应该正确计算SHA256', async () => {
      const hash = await cryptoUtils.sha256('test');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('BruteForceProtection - 暴力破解防护测试', () => {
    it('应该有最大尝试次数限制', () => {
      expect(bruteForceProtection.MAX_ATTEMPTS).toBe(5);
    });

    it('应该有锁定持续时间', () => {
      expect(bruteForceProtection.LOCK_DURATION).toBe(15 * 60 * 1000);
    });
  });

  describe('XSSProtection - XSS防护测试', () => {
    it('应该检测恶意脚本', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      expect(xssProtection.containsMaliciousScript(maliciousInput)).toBe(true);
    });

    it('应该检测javascript伪协议', () => {
      const jsInput = 'javascript:alert("XSS")';
      expect(xssProtection.containsMaliciousScript(jsInput)).toBe(true);
    });

    it('应该检测事件处理器', () => {
      const eventInput = '<img onerror="alert(1)">';
      expect(xssProtection.containsMaliciousScript(eventInput)).toBe(true);
    });

    it('应该检测iframe注入', () => {
      const iframeInput = '<iframe src="http://evil.com"></iframe>';
      expect(xssProtection.containsMaliciousScript(iframeInput)).toBe(true);
    });

    it('应该允许正常文本', () => {
      const normalInput = 'Hello, this is normal text!';
      expect(xssProtection.containsMaliciousScript(normalInput)).toBe(false);
    });

    it('应该清理危险内容', () => {
      const input = '<script>alert("XSS")</script><p>Content</p>';
      const cleaned = xssProtection.sanitizeDangerousContent(input);
      expect(cleaned).not.toContain('<script>');
      expect(cleaned).toContain('Content');
    });

    it('应该允许正常HTML标签', () => {
      const input = '<p>Hello</p><strong>World</strong>';
      const cleaned = xssProtection.sanitizeDangerousContent(input);
      expect(cleaned).toContain('Hello');
      expect(cleaned).toContain('World');
    });
  });
});
