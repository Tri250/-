import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CameraCard } from '../../../components/camera/CameraCard';
import { Device } from '../../../types/device';

const mockDevice: Device = {
  id: 'camera-001',
  name: '测试摄像头',
  type: 'camera',
  status: 'online',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  settings: {
    resolution: '1080p',
    nightVision: true,
    motionDetection: true,
    batteryLevel: 85,
  },
};

const mockOnClick = jest.fn();

describe('CameraCard Component', () => {
  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders device name correctly', () => {
    render(
      <CameraCard
        device={mockDevice}
        onClick={mockOnClick}
      />
    );
    expect(screen.getByText('测试摄像头')).toBeInTheDocument();
  });

  it('renders online status indicator', () => {
    const { container } = render(
      <CameraCard
        device={mockDevice}
        onClick={mockOnClick}
      />
    );
    const statusIndicator = container.querySelector('.status-indicator');
    expect(statusIndicator).toBeInTheDocument();
  });

  it('renders device thumbnail', () => {
    const { container } = render(
      <CameraCard
        device={mockDevice}
        onClick={mockOnClick}
      />
    );
    const thumbnail = container.querySelector('img');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail?.src).toContain('thumb.jpg');
  });

  it('renders settings badge when settings exist', () => {
    const { getByText } = render(
      <CameraCard
        device={mockDevice}
        onClick={mockOnClick}
      />
    );
    expect(getByText(/1080p/i)).toBeInTheDocument();
  });

  it('renders night vision indicator when enabled', () => {
    const { getByText } = render(
      <CameraCard
        device={mockDevice}
        onClick={mockOnClick}
      />
    );
    expect(getByText(/夜视/i)).toBeInTheDocument();
  });

  it('renders motion detection indicator when enabled', () => {
    const { getByText } = render(
      <CameraCard
        device={mockDevice}
        onClick={mockOnClick}
      />
    );
    expect(getByText(/移动侦测/i)).toBeInTheDocument();
  });

  it('renders battery level indicator', () => {
    const { getByText } = render(
      <CameraCard
        device={mockDevice}
        onClick={mockOnClick}
      />
    );
    expect(getByText(/85%/)).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(
      <CameraCard
        device={mockDevice}
        onClick={mockOnClick}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('renders offline state correctly', () => {
    const offlineDevice: Device = {
      ...mockDevice,
      status: 'offline',
    };
    const { container } = render(
      <CameraCard
        device={offlineDevice}
        onClick={mockOnClick}
      />
    );
    const statusIndicator = container.querySelector('.status-indicator');
    expect(statusIndicator).toHaveClass('offline');
  });

  it('renders low battery warning for devices below 20%', () => {
    const lowBatteryDevice: Device = {
      ...mockDevice,
      settings: {
        ...mockDevice.settings,
        batteryLevel: 15,
      },
    };
    const { getByText } = render(
      <CameraCard
        device={lowBatteryDevice}
        onClick={mockOnClick}
      />
    );
    expect(getByText(/15%/)).toBeInTheDocument();
  });

  it('renders placeholder when no thumbnail is available', () => {
    const deviceWithoutThumbnail: Device = {
      ...mockDevice,
      thumbnailUrl: undefined,
    };
    const { container } = render(
      <CameraCard
        device={deviceWithoutThumbnail}
        onClick={mockOnClick}
      />
    );
    const placeholder = container.querySelector('.placeholder-thumbnail');
    expect(placeholder).toBeInTheDocument();
  });

  it('renders device snapshot when available', () => {
    const deviceWithSnapshot: Device = {
      ...mockDevice,
      snapshotUrl: 'https://example.com/snapshot.jpg',
    };
    const { container } = render(
      <CameraCard
        device={deviceWithSnapshot}
        onClick={mockOnClick}
      />
    );
    const images = container.querySelectorAll('img');
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it('renders recording indicator when device is recording', () => {
    const recordingDevice: Device = {
      ...mockDevice,
      isRecording: true,
    };
    const { getByText } = render(
      <CameraCard
        device={recordingDevice}
        onClick={mockOnClick}
      />
    );
    expect(getByText(/录制中/i)).toBeInTheDocument();
  });

  it('handles click event correctly', async () => {
    render(
      <CameraCard
        device={mockDevice}
        onClick={mockOnClick}
      />
    );
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    await waitFor(() => {
      expect(mockOnClick).toHaveBeenCalledWith(mockDevice);
    });
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <CameraCard
        device={mockDevice}
        onClick={mockOnClick}
        className="custom-class"
      />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders device type badge', () => {
    const { getByText } = render(
      <CameraCard
        device={mockDevice}
        onClick={mockOnClick}
      />
    );
    expect(getByText(/摄像头/i)).toBeInTheDocument();
  });

  it('renders last seen time for offline devices', () => {
    const offlineDevice: Device = {
      ...mockDevice,
      status: 'offline',
      lastSeen: new Date('2024-01-15T10:30:00Z'),
    };
    const { getByText } = render(
      <CameraCard
        device={offlineDevice}
        onClick={mockOnClick}
      />
    );
    expect(getByText(/最后在线/i)).toBeInTheDocument();
  });

  it('handles device with minimal settings', () => {
    const minimalDevice: Device = {
      id: 'camera-minimal',
      name: '最小设备',
      type: 'camera',
      status: 'online',
    };
    const { getByText } = render(
      <CameraCard
        device={minimalDevice}
        onClick={mockOnClick}
      />
    );
    expect(getByText('最小设备')).toBeInTheDocument();
  });

  it('applies theme classes correctly', () => {
    const { container } = render(
      <CameraCard
        device={mockDevice}
        onClick={mockOnClick}
        theme="dark"
      />
    );
    expect(container.firstChild).toHaveClass('theme-dark');
  });
});
