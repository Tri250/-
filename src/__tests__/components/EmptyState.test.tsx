import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  const defaultProps = {
    icon: <span data-testid="empty-icon">📭</span>,
    title: '没有数据',
    description: '暂无内容，请稍后再试',
  };

  it('应该渲染标题', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.getByText('没有数据')).toBeInTheDocument();
  });

  it('应该渲染描述', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.getByText('暂无内容，请稍后再试')).toBeInTheDocument();
  });

  it('应该渲染图标', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('应该渲染操作按钮当提供action时', () => {
    const action = {
      label: '添加',
      onClick: vi.fn(),
    };
    render(<EmptyState {...defaultProps} action={action} />);
    expect(screen.getByRole('button', { name: /添加/i })).toBeInTheDocument();
  });

  it('点击操作按钮应该调用onClick', () => {
    const onClick = vi.fn();
    const action = {
      label: '添加',
      onClick,
    };
    render(<EmptyState {...defaultProps} action={action} />);
    fireEvent.click(screen.getByRole('button', { name: /添加/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('不应该渲染操作按钮当没有action时', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('应该包含图标样式', () => {
    const { container } = render(<EmptyState {...defaultProps} />);
    const iconContainer = container.querySelector('.w-24');
    expect(iconContainer).toBeTruthy();
  });

  it('应该包含标题样式', () => {
    render(<EmptyState {...defaultProps} />);
    const title = screen.getByText('没有数据');
    expect(title).toHaveClass('text-lg', 'font-semibold', 'text-gray-800');
  });

  it('应该包含描述样式', () => {
    render(<EmptyState {...defaultProps} />);
    const description = screen.getByText('暂无内容，请稍后再试');
    expect(description).toHaveClass('text-sm', 'text-gray-500');
  });

  it('应该包含容器样式', () => {
    const { container } = render(<EmptyState {...defaultProps} />);
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'py-12');
  });

  it('没有图标时应该显示默认图标', () => {
    const { container } = render(<EmptyState title="测试" />);
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeTruthy();
  });

  it('操作按钮应该包含渐变样式', () => {
    const action = {
      label: '添加',
      onClick: vi.fn(),
    };
    render(<EmptyState {...defaultProps} action={action} />);
    const button = screen.getByRole('button', { name: /添加/i });
    expect(button).toHaveClass('bg-gradient-to-br', 'from-orange-400', 'to-peach-500');
  });

  it('没有描述时不应该渲染描述区域', () => {
    const { container } = render(<EmptyState title="测试" />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });
});
