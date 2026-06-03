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

    it('应该处理空输入', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('应该处理只有falsy值的输入', () => {
      const result = cn(false, null, undefined, '', 0);
      expect(result).toBe('');
    });

    it('应该处理数字输入', () => {
      const result = cn('class1', 123, 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('应该处理Tailwind冲突类', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toContain('p-8');
      expect(result).not.toContain('p-4');
    });

    it('应该处理Tailwind颜色冲突', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toContain('text-blue-500');
      expect(result).not.toContain('text-red-500');
    });

    it('应该处理复杂的Tailwind类组合', () => {
      const result = cn(
        'flex',
        'items-center',
        'justify-between',
        'p-4',
        'bg-white',
        'rounded-lg',
        'shadow-md'
      );
      expect(result).toContain('flex');
      expect(result).toContain('items-center');
      expect(result).toContain('justify-between');
      expect(result).toContain('p-4');
      expect(result).toContain('bg-white');
      expect(result).toContain('rounded-lg');
      expect(result).toContain('shadow-md');
    });

    it('应该处理响应式类', () => {
      const result = cn('text-sm', 'md:text-base', 'lg:text-lg');
      expect(result).toContain('text-sm');
      expect(result).toContain('md:text-base');
      expect(result).toContain('lg:text-lg');
    });

    it('应该处理状态变体类', () => {
      const result = cn('bg-blue-500', 'hover:bg-blue-600', 'active:bg-blue-700');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('hover:bg-blue-600');
      expect(result).toContain('active:bg-blue-700');
    });

    it('应该处理暗黑模式类', () => {
      const result = cn('bg-white', 'dark:bg-gray-800', 'text-gray-900', 'dark:text-white');
      expect(result).toContain('bg-white');
      expect(result).toContain('dark:bg-gray-800');
      expect(result).toContain('text-gray-900');
      expect(result).toContain('dark:text-white');
    });

    it('应该处理多个条件类', () => {
      const isPrimary = true;
      const isLarge = false;
      const isDisabled = true;
      
      const result = cn(
        'btn',
        isPrimary && 'btn-primary',
        isLarge && 'btn-lg',
        isDisabled && 'btn-disabled'
      );
      
      expect(result).toContain('btn');
      expect(result).toContain('btn-primary');
      expect(result).not.toContain('btn-lg');
      expect(result).toContain('btn-disabled');
    });

    it('应该处理动态类名生成', () => {
      const size = 'md';
      const variant = 'primary';
      
      const result = cn(
        `btn-${size}`,
        `btn-${variant}`
      );
      
      expect(result).toContain('btn-md');
      expect(result).toContain('btn-primary');
    });

    it('应该处理重复的类名', () => {
      const result = cn('class1', 'class2', 'class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('应该处理非常长的类名字符串', () => {
      const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      const result = cn(...classes);
      
      classes.forEach(cls => {
        expect(result).toContain(cls);
      });
    });

    it('应该正确处理优先级覆盖', () => {
      const result = cn('px-4', 'py-2', 'px-8');
      expect(result).toContain('px-8');
      expect(result).toContain('py-2');
    });

    it('应该处理函数返回的类名', () => {
      const getClassName = (active: boolean) => active ? 'active' : 'inactive';
      const result = cn(getClassName(true), 'base');
      
      expect(result).toContain('active');
      expect(result).toContain('base');
    });
  });
});
