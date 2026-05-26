import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmotionCard } from '@/components/emotion/EmotionCard';
import type { EmotionAnalysis } from '@/types/emotion';

const createMockAnalysis = (overrides = {}): EmotionAnalysis => ({
  id: 'test-id-1',
  petId: 'pet-1',
  primaryEmotion: 'happy',
  intensity: 85,
  confidence: 92,
  subEmotions: ['好奇', '兴奋'],
  translation: '宝贝今天很开心呢！',
  context: {
    timeContext: '今天下午',
    locationContext: '客厅',
  },
  createdAt: new Date().toISOString(),
  source: 'voice',
  ...overrides,
});

describe('EmotionCard', () => {
  const mockAnalysis = createMockAnalysis();

  it('应该正确显示情感类型标签', () => {
    render(<EmotionCard analysis={mockAnalysis} />);
    expect(screen.getByText('开心')).toBeInTheDocument();
  });

  it('应该显示翻译内容', () => {
    render(<EmotionCard analysis={mockAnalysis} />);
    expect(screen.getByText('"宝贝今天很开心呢！"')).toBeInTheDocument();
  });

  it('应该显示置信度', () => {
    render(<EmotionCard analysis={mockAnalysis} />);
    expect(screen.getByText(/置信度: 92%/)).toBeInTheDocument();
  });

  it('应该显示情感强度', () => {
    render(<EmotionCard analysis={mockAnalysis} />);
    expect(screen.getByText('情感强度')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('应该显示次要情感标签', () => {
    render(<EmotionCard analysis={mockAnalysis} />);
    expect(screen.getByText('好奇')).toBeInTheDocument();
    expect(screen.getByText('兴奋')).toBeInTheDocument();
  });

  it('当showActions为true时应该显示操作按钮', () => {
    render(<EmotionCard analysis={mockAnalysis} onShare={vi.fn()} onRetry={vi.fn()} showActions={true} />);
    expect(screen.getByText('再录一次')).toBeInTheDocument();
    expect(screen.getByText('分享')).toBeInTheDocument();
  });

  it('当showActions为false时不应该显示操作按钮', () => {
    render(<EmotionCard analysis={mockAnalysis} showActions={false} />);
    expect(screen.queryByText('再录一次')).not.toBeInTheDocument();
    expect(screen.queryByText('分享')).not.toBeInTheDocument();
  });

  it('应该正确调用重试回调', () => {
    const onRetry = vi.fn();
    render(<EmotionCard analysis={mockAnalysis} onRetry={onRetry} showActions={true} />);
    fireEvent.click(screen.getByText('再录一次'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('应该正确调用分享回调', () => {
    const onShare = vi.fn();
    render(<EmotionCard analysis={mockAnalysis} onShare={onShare} showActions={true} />);
    fireEvent.click(screen.getByText('分享'));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('开心情感应该显示绿色标签', () => {
    const happyAnalysis = createMockAnalysis({ primaryEmotion: 'happy' });
    const { container } = render(<EmotionCard analysis={happyAnalysis} />);
    const emotionLabel = container.querySelector('.text-green-500');
    expect(emotionLabel).toBeTruthy();
  });

  it('焦虑情感应该显示黄色标签', () => {
    const anxiousAnalysis = createMockAnalysis({ primaryEmotion: 'anxious' });
    const { container } = render(<EmotionCard analysis={anxiousAnalysis} />);
    const emotionLabel = container.querySelector('.text-yellow-500');
    expect(emotionLabel).toBeTruthy();
  });

  it('生气情感应该显示红色标签', () => {
    const angryAnalysis = createMockAnalysis({ primaryEmotion: 'angry' });
    const { container } = render(<EmotionCard analysis={angryAnalysis} />);
    const emotionLabel = container.querySelector('.text-red-500');
    expect(emotionLabel).toBeTruthy();
  });

  it('有需求情感应该显示蓝色标签', () => {
    const needsAnalysis = createMockAnalysis({ primaryEmotion: 'needs' });
    const { container } = render(<EmotionCard analysis={needsAnalysis} />);
    const emotionLabel = container.querySelector('.text-blue-500');
    expect(emotionLabel).toBeTruthy();
  });

  it('平静情感应该显示灰色标签', () => {
    const calmAnalysis = createMockAnalysis({ primaryEmotion: 'calm' });
    const { container } = render(<EmotionCard analysis={calmAnalysis} />);
    const emotionLabel = container.querySelector('.text-gray-500');
    expect(emotionLabel).toBeTruthy();
  });

  it('应该显示来源标签', () => {
    render(<EmotionCard analysis={mockAnalysis} />);
    expect(screen.getByText(/🎤 声音/)).toBeInTheDocument();
  });

  it('声音来源应该显示麦克风图标', () => {
    render(<EmotionCard analysis={mockAnalysis} />);
    expect(screen.getByText(/🎤 声音/)).toBeInTheDocument();
  });

  it('图像来源应该显示相机图标', () => {
    const imageAnalysis = createMockAnalysis({ source: 'image' });
    render(<EmotionCard analysis={imageAnalysis} />);
    expect(screen.getByText(/📷 图像/)).toBeInTheDocument();
  });

  it('行为来源应该显示视频图标', () => {
    const behaviorAnalysis = createMockAnalysis({ source: 'behavior' });
    render(<EmotionCard analysis={behaviorAnalysis} />);
    expect(screen.getByText(/📹 行为/)).toBeInTheDocument();
  });

  it('没有次要情感时不显示次要情感区域', () => {
    const noSubEmotions = createMockAnalysis({ subEmotions: [] });
    render(<EmotionCard analysis={noSubEmotions} />);
    expect(screen.queryByText('次要情感')).not.toBeInTheDocument();
  });

  it('应该显示时间上下文', () => {
    render(<EmotionCard analysis={mockAnalysis} />);
    expect(screen.getByText('今天下午')).toBeInTheDocument();
  });
});
