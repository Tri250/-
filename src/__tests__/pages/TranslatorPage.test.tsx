import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TranslatorPage } from '@/pages/TranslatorPage';

const mockNavigatorShare = vi.fn();
const mockNavigatorClipboard = {
  writeText: vi.fn(),
};

vi.stubGlobal('navigator', {
  ...navigator,
  share: mockNavigatorShare,
  clipboard: mockNavigatorClipboard,
  mediaDevices: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [],
    }),
  },
});

describe('TranslatorPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该正确渲染页面标题', () => {
    render(<TranslatorPage />);
    expect(screen.getByText('宠物翻译器')).toBeInTheDocument();
  });

  it('应该显示宠物名称', () => {
    render(<TranslatorPage />);
    expect(screen.getByText(/聆听小橘的心声/)).toBeInTheDocument();
  });

  it('应该显示录音按钮', () => {
    render(<TranslatorPage />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('应该显示翻译历史标题', () => {
    render(<TranslatorPage />);
    expect(screen.getByText('翻译历史')).toBeInTheDocument();
  });

  it('点击录音按钮应该开始录音', () => {
    render(<TranslatorPage />);
    const recordButton = screen.getByRole('button');
    fireEvent.click(recordButton);

    expect(screen.getByText('正在聆听...')).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('录音时应该显示计时器', async () => {
    render(<TranslatorPage />);
    const recordButton = screen.getByRole('button');

    fireEvent.click(recordButton);

    // Timer starts at 00:00
    expect(screen.getByText('00:00')).toBeInTheDocument();

    // Verify recording state is active
    expect(screen.getByText('正在聆听...')).toBeInTheDocument();
  });

  it('点击停止按钮应该结束录音', () => {
    render(<TranslatorPage />);
    const recordButton = screen.getByRole('button');
    fireEvent.click(recordButton);

    expect(screen.getByText('正在聆听...')).toBeInTheDocument();

    // Click again to stop
    fireEvent.click(recordButton);

    expect(screen.queryByText('正在聆听...')).not.toBeInTheDocument();
  });

  it('录音状态下应该显示停止提示', () => {
    render(<TranslatorPage />);
    const recordButton = screen.getByRole('button');
    fireEvent.click(recordButton);

    expect(screen.getByText('再次点击停止录音')).toBeInTheDocument();
  });

  it('应该显示提示文本', () => {
    render(<TranslatorPage />);
    expect(screen.getByText(/点击按钮开始录音/)).toBeInTheDocument();
  });

  it('应该渲染UI组件', () => {
    render(<TranslatorPage />);
    expect(screen.getByText('宠物翻译器')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('应该显示页面结构', () => {
    const { container } = render(<TranslatorPage />);
    expect(container.querySelector('.min-h-screen')).toBeTruthy();
  });

  it('应该有正确的样式类', () => {
    const { container } = render(<TranslatorPage />);
    const mainDiv = container.querySelector('.min-h-screen');
    expect(mainDiv).toHaveClass('bg-gradient-to-br');
  });

  it('应该显示翻译历史列表', () => {
    render(<TranslatorPage />);
    const historyItems = screen.getAllByText(/主人|太好啦|好舒服呀/);
    expect(historyItems.length).toBeGreaterThan(0);
  });
});
