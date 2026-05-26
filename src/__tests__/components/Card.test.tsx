import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('应该渲染子内容', () => {
    render(<Card>卡片内容</Card>);
    expect(screen.getByText('卡片内容')).toBeInTheDocument();
  });

  it('default变体应该有白色背景和阴影', () => {
    const { container } = render(<Card variant="default">默认卡片</Card>);
    const card = container.querySelector('.bg-white');
    expect(card).toBeTruthy();
    expect(container.textContent).toContain('默认卡片');
  });

  it('elevated变体应该有更大的阴影', () => {
    const { container } = render(<Card variant="elevated">提升卡片</Card>);
    const card = container.querySelector('.shadow-lg');
    expect(card).toBeTruthy();
    expect(container.textContent).toContain('提升卡片');
  });

  it('gradient变体应该有渐变背景', () => {
    const { container } = render(<Card variant="gradient">渐变卡片</Card>);
    const card = container.querySelector('.bg-gradient-to-br');
    expect(card).toBeTruthy();
    expect(container.textContent).toContain('渐变卡片');
  });

  it('none padding不应该有padding', () => {
    const { container } = render(<Card padding="none">无padding</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('p-3');
    expect(card.className).not.toContain('p-5');
    expect(card.className).not.toContain('p-6');
  });

  it('small padding应该有小的padding', () => {
    const { container } = render(<Card padding="small">小padding</Card>);
    const card = container.querySelector('.p-3');
    expect(card).toBeTruthy();
  });

  it('medium padding应该有中的padding', () => {
    const { container } = render(<Card padding="medium">中padding</Card>);
    const card = container.querySelector('.p-5');
    expect(card).toBeTruthy();
  });

  it('large padding应该有大padding', () => {
    const { container } = render(<Card padding="large">大padding</Card>);
    const card = container.querySelector('.p-6');
    expect(card).toBeTruthy();
  });

  it('提供onClick时应该有可点击样式', () => {
    const { container } = render(<Card onClick={vi.fn()}>可点击卡片</Card>);
    const card = container.querySelector('.cursor-pointer');
    expect(card).toBeTruthy();
  });

  it('点击可点击卡片应该调用onClick', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>点击我</Card>);
    fireEvent.click(screen.getByText('点击我'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('可点击卡片应该可聚焦', () => {
    const { container } = render(<Card onClick={vi.fn()}>可聚焦卡片</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('按Enter键应该触发onClick', () => {
    const onClick = vi.fn();
    const { container } = render(<Card onClick={onClick}>按Enter键</Card>);
    const card = container.firstChild as HTMLElement;
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('应该应用自定义className', () => {
    const { container } = render(<Card className="custom-card">自定义</Card>);
    const card = container.querySelector('.custom-card');
    expect(card).toBeTruthy();
  });

  it('不提供onClick时不应该有button角色', () => {
    const { container } = render(<Card>普通卡片</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveAttribute('role', 'button');
  });

  it('提供onClick时应该有button角色', () => {
    const { container } = render(<Card onClick={vi.fn()}>按钮卡片</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute('role', 'button');
  });
});
