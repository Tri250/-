import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

// Mock AudioContext
const mockAudioContext = {
  createMediaStreamSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
  }),
  createAnalyser: vi.fn().mockReturnValue({
    fftSize: 0,
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
    disconnect: vi.fn(),
  }),
  close: vi.fn(),
};

vi.stubGlobal('AudioContext', vi.fn().mockImplementation(() => mockAudioContext));

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
    expect(screen.getByText('AI 情感翻译机')).toBeInTheDocument();
  });

  it('应该显示宠物名称', () => {
    render(<TranslatorPage />);
    expect(screen.getByText(/宝贝/)).toBeInTheDocument();
  });

  it('应该显示录音翻译按钮', () => {
    render(<TranslatorPage />);
    expect(screen.getByRole('button', { name: /录音翻译/i })).toBeInTheDocument();
  });

  it('应该显示拍照分析按钮', () => {
    render(<TranslatorPage />);
    expect(screen.getByRole('button', { name: /拍照分析/i })).toBeInTheDocument();
  });

  it('应该显示录音按钮', () => {
    render(<TranslatorPage />);
    expect(screen.getByRole('button', { name: /开始录音/i })).toBeInTheDocument();
  });

  it('应该显示小贴士', () => {
    render(<TranslatorPage />);
    expect(screen.getByText(/小贴士/)).toBeInTheDocument();
  });

  it('点击录音按钮应该开始录音', async () => {
    render(<TranslatorPage />);
    const recordButton = screen.getByRole('button', { name: /开始录音/i });
    
    await act(async () => {
      fireEvent.click(recordButton);
    });
    
    expect(screen.getByText(/宝贝正在说话呢/)).toBeInTheDocument();
    expect(screen.getByText(/00:00/)).toBeInTheDocument();
  });

  it('录音时应该显示计时器', async () => {
    render(<TranslatorPage />);
    const recordButton = screen.getByRole('button', { name: /开始录音/i });
    
    await act(async () => {
      fireEvent.click(recordButton);
    });
    
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(screen.getByText(/00:03/)).toBeInTheDocument();
  });

  it('点击停止按钮应该结束录音', async () => {
    render(<TranslatorPage />);
    const recordButton = screen.getByRole('button', { name: /开始录音/i });
    
    await act(async () => {
      fireEvent.click(recordButton);
    });
    
    expect(screen.getByText(/宝贝正在说话呢/)).toBeInTheDocument();
    
    const stopButton = screen.getByRole('button', { name: /停止录音/i });
    
    await act(async () => {
      fireEvent.click(stopButton);
    });
    
    expect(screen.queryByText(/宝贝正在说话呢/)).not.toBeInTheDocument();
  });

  it('录音状态下按钮应该显示停止录音', async () => {
    render(<TranslatorPage />);
    const recordButton = screen.getByRole('button', { name: /开始录音/i });
    
    await act(async () => {
      fireEvent.click(recordButton);
    });
    
    expect(screen.getByRole('button', { name: /停止录音/i })).toBeInTheDocument();
  });

  it('应该显示提示文本', () => {
    render(<TranslatorPage />);
    expect(screen.getByText(/请将麦克风靠近宝贝/)).toBeInTheDocument();
  });

  it('录音时应该显示点击结束提示', async () => {
    render(<TranslatorPage />);
    const recordButton = screen.getByRole('button', { name: /开始录音/i });
    
    await act(async () => {
      fireEvent.click(recordButton);
    });
    
    expect(screen.getByText(/点击按钮结束录音/)).toBeInTheDocument();
  });

  it('应该渲染UI组件', () => {
    render(<TranslatorPage />);
    expect(screen.getByText(/麦克风靠近宝贝/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /录音翻译/i })).toBeInTheDocument();
  });

  it('应该显示页面结构', () => {
    const { container } = render(<TranslatorPage />);
    expect(container.querySelector('.min-h-screen')).toBeTruthy();
    expect(container.querySelector('header')).toBeTruthy();
    expect(container.querySelector('main')).toBeTruthy();
  });

  it('应该有正确的样式类', () => {
    const { container } = render(<TranslatorPage />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('sticky', 'top-0', 'z-40');
  });
});
