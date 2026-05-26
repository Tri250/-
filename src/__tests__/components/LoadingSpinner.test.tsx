import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('应该渲染SVG图标', () => {
    render(<LoadingSpinner />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('应该显示自定义文本', () => {
    render(<LoadingSpinner text="请稍候" />);
    expect(screen.getByText('请稍候')).toBeInTheDocument();
  });

  it('没有文本时不应该显示文本', () => {
    render(<LoadingSpinner />);
    expect(screen.queryByText('text')).not.toBeInTheDocument();
  });

  it('应该包含旋转动画', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('应该包含正确的颜色类', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.text-orange-500');
    expect(spinner).toBeTruthy();
  });

  it('应该支持自定义颜色', () => {
    const { container } = render(<LoadingSpinner color="text-blue-500" />);
    const spinner = container.querySelector('.text-blue-500');
    expect(spinner).toBeTruthy();
  });

  it('小尺寸应该有小的尺寸', () => {
    const { container } = render(<LoadingSpinner size="small" />);
    const spinner = container.querySelector('.w-4');
    expect(spinner).toBeTruthy();
  });

  it('中尺寸应该有中的尺寸', () => {
    const { container } = render(<LoadingSpinner size="medium" />);
    const spinner = container.querySelector('.w-8');
    expect(spinner).toBeTruthy();
  });

  it('大尺寸应该有大的尺寸', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    const spinner = container.querySelector('.w-12');
    expect(spinner).toBeTruthy();
  });

  it('应该包含flex布局', () => {
    const { container } = render(<LoadingSpinner />);
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
  });

  it('应该包含间距', () => {
    const { container } = render(<LoadingSpinner />);
    const containerEl = container.firstChild as HTMLElement;
    expect(containerEl).toHaveClass('gap-3');
  });

  it('应该包含文本样式', () => {
    const { container } = render(<LoadingSpinner text="加载中" />);
    const text = container.querySelector('.text-sm');
    expect(text).toBeTruthy();
  });

  it('应该渲染SVG圆圈', () => {
    const { container } = render(<LoadingSpinner />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('应该渲染SVG路径', () => {
    const { container } = render(<LoadingSpinner />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('应该渲染Spinner容器', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('[class*="animate-spin"]');
    expect(spinner).toBeTruthy();
  });
});
