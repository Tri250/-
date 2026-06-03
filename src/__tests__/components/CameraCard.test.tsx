import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CameraCard } from '@/components/camera/CameraCard';
import type { CameraDevice } from '@/types/camera';

const createMockDevice = (overrides: Partial<CameraDevice> = {}): CameraDevice => ({
  id: 'device-1',
  brand: 'xiaomi',
  model: 'MJSXJ02CM',
  name: '客厅摄像头',
  status: 'online',
  streamUrl: 'rtsp://example.com/stream',
  thumbnailUrl: undefined,
  lastActive: new Date().toISOString(),
  lastOnline: new Date().toISOString(),
  location: '客厅',
  capabilities: [],
  settings: {
    resolution: '1080p',
    nightVisionMode: 'auto',
    motionDetection: { enabled: false, sensitivity: 50, notificationEnabled: false },
    recording: { mode: 'off', quality: 'high', storage: 'sd' },
    audio: { enabled: false, volume: 50, noiseReduction: false },
    aiTracking: { enabled: false, targetType: 'pet', smoothTracking: false },
  },
  protocol: 'rtsp',
  ...overrides,
});

describe('CameraCard', () => {
  it('应该正确显示设备名称', () => {
    const device = createMockDevice({ name: '客厅摄像头' });
    render(<CameraCard device={device} onClick={vi.fn()} />);
    expect(screen.getByText('客厅摄像头')).toBeInTheDocument();
  });

  it('应该显示设备品牌和型号', () => {
    const device = createMockDevice({ brand: 'xiaomi', model: 'MJSXJ02CM' });
    render(<CameraCard device={device} />);
    expect(screen.getByText(/小米 · MJSXJ02CM/)).toBeInTheDocument();
  });

  it('在线状态应该显示绿色指示器', () => {
    const onlineDevice = createMockDevice({ status: 'online' });
    const { container } = render(<CameraCard device={onlineDevice} />);
    const indicator = container.querySelector('.bg-green-500');
    expect(indicator).toBeTruthy();
  });

  it('离线状态应该显示灰色指示器', () => {
    const offlineDevice = createMockDevice({ status: 'offline' });
    const { container } = render(<CameraCard device={offlineDevice} />);
    const indicator = container.querySelector('.bg-gray-400');
    expect(indicator).toBeTruthy();
  });

  it('在线状态应该显示WiFi图标', () => {
    const onlineDevice = createMockDevice({ status: 'online' });
    render(<CameraCard device={onlineDevice} />);
    expect(screen.getByText(/在线/)).toBeInTheDocument();
  });

  it('离线状态应该显示WiFi关闭图标', () => {
    const offlineDevice = createMockDevice({ status: 'offline' });
    render(<CameraCard device={offlineDevice} />);
    expect(screen.getByText(/离线/)).toBeInTheDocument();
  });

  it('应该正确调用点击回调', () => {
    const onClick = vi.fn();
    const device = createMockDevice();
    render(<CameraCard device={device} onClick={onClick} />);
    const card = screen.getByText('客厅摄像头').closest('div');
    if (card) {
      fireEvent.click(card);
      expect(onClick).toHaveBeenCalledTimes(1);
    }
  });

  it('应该显示位置信息', () => {
    const device = createMockDevice({ location: '客厅' });
    render(<CameraCard device={device} />);
    expect(screen.getByText('客厅')).toBeInTheDocument();
  });

  it('应该显示最后在线时间', () => {
    const lastOnline = '2026-01-15T10:30:00.000Z';
    const device = createMockDevice({ lastOnline });
    render(<CameraCard device={device} />);
    expect(screen.getByText(/最后在线:/)).toBeInTheDocument();
  });

  it('在线状态应该启用直播按钮', () => {
    const onlineDevice = createMockDevice({ status: 'online' });
    render(<CameraCard device={onlineDevice} onStreamClick={vi.fn()} />);
    const streamButton = screen.getByRole('button', { name: /查看直播/i });
    expect(streamButton).toBeEnabled();
    expect(streamButton).toHaveClass('bg-orange-500', 'text-white');
  });

  it('离线状态应该禁用直播按钮', () => {
    const offlineDevice = createMockDevice({ status: 'offline' });
    render(<CameraCard device={offlineDevice} onStreamClick={vi.fn()} />);
    const streamButton = screen.getByRole('button', { name: /离线/i });
    expect(streamButton).toBeDisabled();
    expect(streamButton).toHaveClass('bg-gray-100', 'text-gray-400');
  });

  it('应该正确调用直播点击回调', () => {
    const onStreamClick = vi.fn();
    const onlineDevice = createMockDevice({ status: 'online' });
    render(<CameraCard device={onlineDevice} onStreamClick={onStreamClick} />);
    fireEvent.click(screen.getByRole('button', { name: /查看直播/i }));
    expect(onStreamClick).toHaveBeenCalledTimes(1);
  });

  it('应该显示删除按钮当提供onDelete回调时', () => {
    const device = createMockDevice();
    render(<CameraCard device={device} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: /删除/i })).toBeInTheDocument();
  });

  it('不应该显示删除按钮当没有onDelete回调时', () => {
    const device = createMockDevice();
    render(<CameraCard device={device} />);
    expect(screen.queryByRole('button', { name: /删除/i })).not.toBeInTheDocument();
  });

  it('应该正确调用删除回调', () => {
    const onDelete = vi.fn();
    const device = createMockDevice();
    render(<CameraCard device={device} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /删除/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('当有缩略图时应该显示图片', () => {
    const device = createMockDevice({ thumbnail: 'https://example.com/thumb.jpg' });
    render(<CameraCard device={device} />);
    const img = screen.getByAltText('客厅摄像头') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://example.com/thumb.jpg');
  });

  it('当没有缩略图时应该显示相机图标', () => {
    const device = createMockDevice({ thumbnailUrl: undefined });
    const { container } = render(<CameraCard device={device} />);
    const cameraIcon = container.querySelector('svg');
    expect(cameraIcon).toBeTruthy();
  });

  it('华为品牌应该显示华为标签', () => {
    const huaweiDevice = createMockDevice({ brand: 'huawei', model: 'HW-123' });
    render(<CameraCard device={huaweiDevice} />);
    expect(screen.getByText(/华为 · HW-123/)).toBeInTheDocument();
  });

  it('荣耀品牌应该显示荣耀标签', () => {
    const honorDevice = createMockDevice({ brand: 'honor', model: 'HR-456' });
    render(<CameraCard device={honorDevice} />);
    expect(screen.getByText(/荣耀 · HR-456/)).toBeInTheDocument();
  });

  it('更新中状态应该显示黄色指示器', () => {
    const updatingDevice = createMockDevice({ status: 'updating' });
    const { container } = render(<CameraCard device={updatingDevice} />);
    const indicator = container.querySelector('.bg-yellow-500');
    expect(indicator).toBeTruthy();
  });

  it('错误状态应该显示红色指示器', () => {
    const errorDevice = createMockDevice({ status: 'error' });
    const { container } = render(<CameraCard device={errorDevice} />);
    const indicator = container.querySelector('.bg-red-500');
    expect(indicator).toBeTruthy();
  });
});
