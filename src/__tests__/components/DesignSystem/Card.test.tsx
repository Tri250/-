import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '@/components/DesignSystem/Card';

describe('DesignSystem Card', () => {
  it('should render children correctly', () => {
    render(<Card>卡片内容</Card>);
    expect(screen.getByText('卡片内容')).toBeInTheDocument();
  });

  describe('Variants', () => {
    it('should apply default variant styles', () => {
      render(<Card variant="default">默认卡片</Card>);
      const card = screen.getByText('默认卡片').closest('div');
      expect(card).toHaveClass('bg-white', 'shadow-card');
    });

    it('should apply elevated variant styles', () => {
      render(<Card variant="elevated">悬浮卡片</Card>);
      const card = screen.getByText('悬浮卡片').closest('div');
      expect(card).toHaveClass('bg-white', 'shadow-elevated', 'border-transparent');
    });

    it('should apply gradient variant styles', () => {
      render(<Card variant="gradient">渐变卡片</Card>);
      const card = screen.getByText('渐变卡片').closest('div');
      expect(card).toHaveClass('bg-gradient-to-br', 'from-white', 'to-neutral-50');
    });

    it('should apply outlined variant styles', () => {
      render(<Card variant="outlined">轮廓卡片</Card>);
      const card = screen.getByText('轮廓卡片').closest('div');
      expect(card).toHaveClass('bg-white', 'border-neutral-200', 'shadow-soft');
    });
  });

  describe('Padding', () => {
    it('should apply no padding when padding is none', () => {
      render(<Card padding="none">无内边距</Card>);
      const card = screen.getByText('无内边距').closest('div');
      expect(card).not.toHaveClass('p-3', 'p-5', 'p-6', 'p-8');
    });

    it('should apply small padding', () => {
      render(<Card padding="sm">小内边距</Card>);
      const card = screen.getByText('小内边距').closest('div');
      expect(card).toHaveClass('p-3');
    });

    it('should apply medium padding', () => {
      render(<Card padding="md">中等内边距</Card>);
      const card = screen.getByText('中等内边距').closest('div');
      expect(card).toHaveClass('p-5');
    });

    it('should apply large padding', () => {
      render(<Card padding="lg">大内边距</Card>);
      const card = screen.getByText('大内边距').closest('div');
      expect(card).toHaveClass('p-6');
    });

    it('should apply extra large padding', () => {
      render(<Card padding="xl">特大内边距</Card>);
      const card = screen.getByText('特大内边距').closest('div');
      expect(card).toHaveClass('p-8');
    });
  });

  describe('Hover', () => {
    it('should apply hover styles when hover is true (default)', () => {
      render(<Card>悬停卡片</Card>);
      const card = screen.getByText('悬停卡片').closest('div');
      expect(card).toHaveClass('hover:-translate-y-1', 'hover:shadow-elevated', 'hover:border-primary-100', 'active:translate-y-0', 'cursor-pointer');
    });

    it('should not apply hover styles when hover is false', () => {
      render(<Card hover={false}>无悬停卡片</Card>);
      const card = screen.getByText('无悬停卡片').closest('div');
      expect(card).not.toHaveClass('hover:-translate-y-1', 'cursor-pointer');
    });
  });

  describe('Interactions', () => {
    it('should be clickable when onClick is provided', () => {
      const onClick = vi.fn();
      render(<Card onClick={onClick}>可点击卡片</Card>);
      const card = screen.getByText('可点击卡片').closest('div');
      
      fireEvent.click(card!);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should handle onClick even without hover', () => {
      const onClick = vi.fn();
      render(<Card onClick={onClick} hover={false}>无悬停可点击卡片</Card>);
      const card = screen.getByText('无悬停可点击卡片').closest('div');
      
      fireEvent.click(card!);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Customization', () => {
    it('should apply custom className', () => {
      render(<Card className="custom-card">自定义卡片</Card>);
      const card = screen.getByText('自定义卡片').closest('div');
      expect(card).toHaveClass('custom-card');
    });

    it('should have base classes', () => {
      render(<Card>基础卡片</Card>);
      const card = screen.getByText('基础卡片').closest('div');
      expect(card).toHaveClass('rounded-2xl', 'border', 'border-neutral-100', 'transition-all', 'duration-300');
    });
  });

  describe('Accessibility', () => {
    it('should have correct base structure', () => {
      render(<Card>可访问卡片</Card>);
      const card = screen.getByText('可访问卡片').closest('div');
      expect(card).toBeInTheDocument();
    });
  });
});