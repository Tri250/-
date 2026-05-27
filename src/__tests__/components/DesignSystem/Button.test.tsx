import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/DesignSystem/Button';

describe('DesignSystem Button', () => {
  it('should render children correctly', () => {
    render(<Button>测试按钮</Button>);
    expect(screen.getByText('测试按钮')).toBeInTheDocument();
  });

  it('should render with icon', () => {
    render(<Button icon={<span data-testid="icon">🎯</span>}>带图标按钮</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('带图标按钮')).toBeInTheDocument();
  });

  describe('Variants', () => {
    it('should apply primary variant styles', () => {
      render(<Button variant="primary">主按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-primary', 'text-white');
    });

    it('should apply secondary variant styles', () => {
      render(<Button variant="secondary">次要按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary-500', 'text-white');
    });

    it('should apply outline variant styles', () => {
      render(<Button variant="outline">轮廓按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2', 'border-primary-500', 'text-primary-500');
    });

    it('should apply ghost variant styles', () => {
      render(<Button variant="ghost">幽灵按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-neutral-700');
    });

    it('should apply gradient variant styles', () => {
      render(<Button variant="gradient">渐变按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-primary', 'text-white');
    });
  });

  describe('Sizes', () => {
    it('should apply sm size styles', () => {
      render(<Button size="sm">小按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
    });

    it('should apply md size styles', () => {
      render(<Button size="md">中按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-base');
    });

    it('should apply lg size styles', () => {
      render(<Button size="lg">大按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-8', 'py-4', 'text-lg');
    });

    it('should apply xl size styles', () => {
      render(<Button size="xl">特大按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-10', 'py-5', 'text-xl');
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      const onClick = vi.fn();
      render(<Button disabled onClick={onClick}>禁用按钮</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should be disabled when loading prop is true', () => {
      const onClick = vi.fn();
      render(<Button loading onClick={onClick}>加载按钮</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should show loading spinner when loading', () => {
      render(<Button loading>加载中</Button>);
      const button = screen.getByRole('button');
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should be full width when fullWidth is true', () => {
      render(<Button fullWidth>全宽按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>点击我</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should apply hover styles on hover', () => {
      render(<Button variant="primary">悬停按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:shadow-glow-primary', 'hover:-translate-y-0.5');
    });

    it('should apply active styles on click', () => {
      render(<Button variant="primary">点击按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('active:translate-y-0', 'active:scale-97');
    });
  });

  describe('Accessibility', () => {
    it('should have correct role', () => {
      render(<Button>可访问按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Customization', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">自定义按钮</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });
});