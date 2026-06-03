import React from 'react';
import { RefreshCw, Video } from 'lucide-react';
import { Card } from '../DesignSystem/Card';
import { CameraDevice } from '../../types/camera';
import { CameraCard } from '../camera/CameraCard';

interface CameraListComponentProps {
  devices: CameraDevice[];
  onDevicePress?: (device: CameraDevice) => void;
  selectedDeviceId?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const CameraListComponent: React.FC<CameraListComponentProps> = ({
  devices,
  onDevicePress,
  refreshing,
  onRefresh,
}) => {
  if (devices.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">暂无摄像头设备</p>
        <p className="text-xs text-gray-400 mt-1">请添加或连接摄像头设备</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {refreshing && (
        <div className="flex items-center justify-center py-2">
          <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
          <span className="ml-2 text-sm text-gray-500">刷新中...</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <CameraCard
            key={device.id}
            device={device}
            onClick={onDevicePress}
          />
        ))}
      </div>
    </div>
  );
};
