import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  state: 'running',
  createMediaStreamSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
  }),
  createAnalyser: vi.fn().mockReturnValue({
    fftSize: 0,
    smoothingTimeConstant: 0,
    getFloatTimeDomainData: vi.fn(),
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
    disconnect: vi.fn(),
  }),
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn(),
};

vi.stubGlobal('AudioContext', vi.fn().mockImplementation(() => mockAudioContext));
vi.stubGlobal('webkitAudioContext', vi.fn().mockImplementation(() => mockAudioContext));

// Mock MediaRecorder
vi.stubGlobal('MediaRecorder', vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  state: 'inactive',
  ondataavailable: null,
  onstop: null,
  mimeType: 'audio/webm',
})));
vi.stubGlobal('MediaRecorder.isTypeSupported', vi.fn().mockReturnValue(true));

describe('TranslatorPage', () => {
  beforeEach(() => {
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
    // 新UI使用RecordingAnimation组件，通过录音翻译按钮触发
    expect(screen.getByRole('button', { name: /录音翻译/i })).toBeInTheDocument();
  });

  it('应该显示小贴士', () => {
    render(<TranslatorPage />);
    expect(screen.getByText(/小贴士/)).toBeInTheDocument();
  });

  it('应该显示初始状态提示', () => {
    render(<TranslatorPage />);
    // 初始状态显示"就绪" - 使用 getAllByText 因为有多个匹配
    const readyElements = screen.getAllByText(/就绪/);
    expect(readyElements.length).toBeGreaterThan(0);
  });

  it('应该显示提示文本', () => {
    render(<TranslatorPage />);
    expect(screen.getByText(/请将麦克风靠近宝贝/)).toBeInTheDocument();
  });

  it('应该显示点击开始录音提示', () => {
    render(<TranslatorPage />);
    expect(screen.getByText(/点击爪印按钮开始录音/)).toBeInTheDocument();
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

  it('应该显示分析维度标题', () => {
    render(<TranslatorPage />);
    expect(screen.getByText(/分析维度/)).toBeInTheDocument();
  });

  it('应该显示AI准确率提示', () => {
    render(<TranslatorPage />);
    // 使用 getAllByText 因为有多个匹配
    const accuracyElements = screen.getAllByText(/95%/);
    expect(accuracyElements.length).toBeGreaterThan(0);
  });
});
