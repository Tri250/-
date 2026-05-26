import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordButton } from '@/components/animations/RecordButton';

describe('RecordButton', () => {
  it('应该在未录音状态显示麦克风图标', () => {
    render(<RecordButton isRecording={false} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    const micIcon = button.querySelector('svg');
    expect(micIcon).toBeTruthy();
  });

  it('应该在录音状态显示麦克风关闭图标', () => {
    render(<RecordButton isRecording={true} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('应该正确调用点击回调', () => {
    const onClick = vi.fn();
    render(<RecordButton isRecording={false} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('录音状态应该应用录音样式', () => {
    render(<RecordButton isRecording={true} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('scale-110');
    expect(button).toHaveClass('bg-gradient-to-br', 'from-red-400', 'to-red-600');
  });

  it('未录音状态应该应用默认样式', () => {
    render(<RecordButton isRecording={false} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-br', 'from-orange-400', 'to-orange-500');
    expect(button).not.toHaveClass('scale-110');
  });

  it('禁用状态应该不可点击', () => {
    const onClick = vi.fn();
    render(<RecordButton isRecording={false} onClick={onClick} disabled={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('禁用状态应该有禁用样式', () => {
    render(<RecordButton isRecording={false} onClick={vi.fn()} disabled={true} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  describe('不同尺寸', () => {
    it('小尺寸按钮应该有正确的尺寸', () => {
      render(<RecordButton isRecording={false} onClick={vi.fn()} size="small" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-16', 'h-16');
    });

    it('中尺寸按钮应该有正确的尺寸', () => {
      render(<RecordButton isRecording={false} onClick={vi.fn()} size="medium" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-24', 'h-24');
    });

    it('大尺寸按钮应该有正确的尺寸', () => {
      render(<RecordButton isRecording={false} onClick={vi.fn()} size="large" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-32', 'h-32');
    });
  });

  it('录音状态应该有动画类', () => {
    render(<RecordButton isRecording={true} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('animate-breathe');
  });

  it('未录音状态悬停应该放大', () => {
    render(<RecordButton isRecording={false} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:scale-105');
  });

  it('点击时应该缩小', () => {
    render(<RecordButton isRecording={false} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('active:scale-95');
  });
});
