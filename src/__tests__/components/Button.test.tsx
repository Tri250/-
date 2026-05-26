import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('应该渲染按钮文本', () => {
    render(<Button>点击我</Button>);
    expect(screen.getByText('点击我')).toBeInTheDocument();
  });

  it('应该显示图标', () => {
    render(<Button icon={<span data-testid="icon">🎉</span>}>按钮</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('primary变体应该有橙色渐变背景', () => {
    render(<Button variant="primary">主按钮</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-br', 'from-orange-400', 'to-peach-500');
  });

  it('secondary变体应该有灰色背景', () => {
    render(<Button variant="secondary">次要按钮</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it('ghost变体应该有透明背景', () => {
    render(<Button variant="ghost">幽灵按钮</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-transparent', 'text-gray-600');
  });

  it('小尺寸应该有小padding', () => {
    render(<Button size="small">小按钮</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('中尺寸应该有中等padding', () => {
    render(<Button size="medium">中按钮</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('大尺寸应该有大padding', () => {
    render(<Button size="large">大按钮</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('禁用状态应该不可点击', () => {
    const onClick = vi.fn();
    render(<Button disabled={true} onClick={onClick}>禁用按钮</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('禁用状态应该有禁用样式', () => {
    render(<Button disabled={true}>禁用按钮</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('加载状态应该显示加载图标', () => {
    render(<Button loading={true}>加载中</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('点击应该调用onClick回调', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>点击我</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('全宽模式应该占据全部宽度', () => {
    render(<Button fullWidth={true}>全宽按钮</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  it('应该应用自定义className', () => {
    render(<Button className="custom-class">自定义</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('默认type应该是button', () => {
    render(<Button>按钮</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('应该支持submit类型', () => {
    render(<Button type="submit">提交</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('应该支持reset类型', () => {
    render(<Button type="reset">重置</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'reset');
  });
});
