import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('utils', () => {
  describe('cn - className合并工具', () => {
    it('应该合并多个className', () => {
      const result = cn('text-red-500', 'bg-blue-500', 'p-4');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('p-4');
    });

    it('应该处理条件className', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class', !isActive && 'inactive-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
      expect(result).not.toContain('inactive-class');
    });

    it('应该处理undefined和null', () => {
      const result = cn('class1', undefined, null, 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('应该处理空字符串', () => {
      const result = cn('', 'class1', '');
      expect(result).toContain('class1');
    });

    it('应该处理对象形式的className', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true,
      });
      expect(result).toContain('class1');
      expect(result).toContain('class3');
      expect(result).not.toContain('class2');
    });

    it('应该合并数组形式的className', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('应该处理嵌套数组', () => {
      const result = cn(['class1', ['class2', 'class3']], 'class4');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
      expect(result).toContain('class4');
    });

    it('应该处理混合类型输入', () => {
      const falsyCondition = false;
      const result = cn(
        'base',
        { 'conditional': true },
        ['array1', { 'arrayConditional': true }],
        falsyCondition && 'falsy'
      );
      expect(result).toContain('base');
      expect(result).toContain('conditional');
      expect(result).toContain('array1');
      expect(result).toContain('arrayConditional');
      expect(result).not.toContain('falsy');
    });
  });
});
