import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('should return empty string when no inputs', () => {
    expect(cn()).toBe('');
  });

  it('should return single class string', () => {
    expect(cn('class1')).toBe('class1');
  });

  it('should combine multiple class strings', () => {
    expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
  });

  it('should handle conditional classes with true', () => {
    expect(cn('base', true && 'conditional')).toBe('base conditional');
  });

  it('should handle conditional classes with false', () => {
    expect(cn('base', false && 'conditional')).toBe('base');
  });

  it('should handle null values', () => {
    expect(cn('base', null, 'other')).toBe('base other');
  });

  it('should handle undefined values', () => {
    expect(cn('base', undefined, 'other')).toBe('base other');
  });

  it('should handle empty string', () => {
    expect(cn('base', '', 'other')).toBe('base other');
  });

  it('should handle clsx-style arrays', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
  });

  it('should handle clsx-style objects', () => {
    expect(cn({ 'class-a': true, 'class-b': false, 'class-c': true })).toBe('class-a class-c');
  });

  it('should merge conflicting Tailwind classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should merge conflicting spacing classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('should merge conflicting color classes', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should preserve non-conflicting classes', () => {
    expect(cn('text-red-500', 'bg-blue-500', 'p-4')).toBe('text-red-500 bg-blue-500 p-4');
  });

  it('should handle mixed input types', () => {
    const result = cn(
      'base',
      true && 'conditional-true',
      false && 'conditional-false',
      null,
      undefined,
      { 'obj-class': true },
      ['array-class1', 'array-class2']
    );
    expect(result).toBe('base conditional-true obj-class array-class1 array-class2');
  });

  it('should handle deep nested arrays', () => {
    expect(cn(['class1', ['class2', ['class3']]])).toBe('class1 class2 class3');
  });

  it('should handle complex conditional logic', () => {
    const isActive = true;
    const isDisabled = false;
    const size = 'large';

    const result = cn(
      'btn',
      isActive && 'btn-active',
      isDisabled && 'btn-disabled',
      size === 'large' && 'btn-large',
      size === 'small' && 'btn-small'
    );

    expect(result).toBe('btn btn-active btn-large');
  });

  it('should handle empty arrays', () => {
    expect(cn('base', [], 'other')).toBe('base other');
  });

  it('should handle empty objects', () => {
    expect(cn('base', {}, 'other')).toBe('base other');
  });

  it('should handle special characters in class names', () => {
    expect(cn('hover:bg-red-500', 'focus:outline-none', 'md:p-4')).toBe('hover:bg-red-500 focus:outline-none md:p-4');
  });
});