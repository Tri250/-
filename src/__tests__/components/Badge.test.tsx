import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('应该渲染徽章内容', () => {
    render(<Badge>徽章文本</Badge>);
    expect(screen.getByText('徽章文本')).toBeInTheDocument();
  });

  it('应该显示图标', () => {
    render(<Badge icon={<span data-testid="badge-icon">🎉</span>}>带图标</Badge>);
    expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
  });

  describe('颜色变体', () => {
    it('orange变体应该有橙色样式', () => {
      render(<Badge color="orange">橙色</Badge>);
      const badge = screen.getByText('橙色');
      expect(badge).toHaveClass('bg-orange-50', 'text-orange-600');
    });

    it('green变体应该有绿色样式', () => {
      render(<Badge color="green">绿色</Badge>);
      const badge = screen.getByText('绿色');
      expect(badge).toHaveClass('bg-green-50', 'text-green-600');
    });

    it('blue变体应该有蓝色样式', () => {
      render(<Badge color="blue">蓝色</Badge>);
      const badge = screen.getByText('蓝色');
      expect(badge).toHaveClass('bg-blue-50', 'text-blue-600');
    });

    it('red变体应该有红色样式', () => {
      render(<Badge color="red">红色</Badge>);
      const badge = screen.getByText('红色');
      expect(badge).toHaveClass('bg-red-50', 'text-red-600');
    });

    it('gray变体应该有灰色样式', () => {
      render(<Badge color="gray">灰色</Badge>);
      const badge = screen.getByText('灰色');
      expect(badge).toHaveClass('bg-gray-50', 'text-gray-600');
    });

    it('yellow变体应该有黄色样式', () => {
      render(<Badge color="yellow">黄色</Badge>);
      const badge = screen.getByText('黄色');
      expect(badge).toHaveClass('bg-yellow-50', 'text-yellow-600');
    });

    it('purple变体应该有紫色样式', () => {
      render(<Badge color="purple">紫色</Badge>);
      const badge = screen.getByText('紫色');
      expect(badge).toHaveClass('bg-purple-50', 'text-purple-600');
    });

    it('pink变体应该有粉色样式', () => {
      render(<Badge color="pink">粉色</Badge>);
      const badge = screen.getByText('粉色');
      expect(badge).toHaveClass('bg-pink-50', 'text-pink-600');
    });
  });

  describe('尺寸变体', () => {
    it('small尺寸应该有小的padding和字号', () => {
      render(<Badge size="small">小徽章</Badge>);
      const badge = screen.getByText('小徽章');
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });

    it('medium尺寸应该有中的padding和字号', () => {
      render(<Badge size="medium">中徽章</Badge>);
      const badge = screen.getByText('中徽章');
      expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
    });
  });

  it('应该应用自定义className', () => {
    render(<Badge className="custom-badge">自定义</Badge>);
    const badge = screen.getByText('自定义');
    expect(badge).toHaveClass('custom-badge');
  });

  it('默认应该是橙色小徽章', () => {
    render(<Badge>默认样式</Badge>);
    const badge = screen.getByText('默认样式');
    expect(badge).toHaveClass('bg-orange-50', 'text-orange-600', 'px-2', 'py-0.5', 'text-xs');
  });

  it('应该包含圆角', () => {
    render(<Badge>圆角</Badge>);
    const badge = screen.getByText('圆角');
    expect(badge).toHaveClass('rounded-full');
  });

  it('应该包含中等字重', () => {
    render(<Badge>字重</Badge>);
    const badge = screen.getByText('字重');
    expect(badge).toHaveClass('font-medium');
  });

  it('应该使用flex布局和居中对齐', () => {
    render(<Badge>布局</Badge>);
    const badge = screen.getByText('布局');
    expect(badge).toHaveClass('inline-flex', 'items-center', 'gap-1');
  });
});
