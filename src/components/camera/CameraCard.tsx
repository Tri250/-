import React from 'react';
import { Video, VideoOff, Wifi, WifiOff } from 'lucide-react';
import { Card } from '../DesignSystem/Card';
import { Device } from '../../types/device';

interface CameraCardProps {
  device: Device;
  onClick?: (device: Device) => void;
  className?: string;
}

export const CameraCard: React.FC<CameraCardProps> = ({
  device,
  onClick,
  className,
}) => {
  const getStatusColor = () => {
    switch (device.status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'error':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    if (device.status === 'online') {
      return <Wifi className="w-3 h-3 text-white" />;
    }
    return <WifiOff className="w-3 h-3 text-white" />;
  };

  return (
    <Card
      className={`overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${className}`}
      onClick={() => onClick?.(device)}
    >
      <div className="relative aspect-video bg-gray-100">
        {device.thumbnailUrl || device.snapshotUrl ? (
          <img
            src={device.snapshotUrl || device.thumbnailUrl}
            alt={device.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Video className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <div className={`${getStatusColor()} w-2 h-2 rounded-full`} />
          {getStatusIcon()}
        </div>
        {device.isRecording && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 rounded text-xs text-white flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            录制中
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-800 truncate">{device.name}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span>{device.type}</span>
          {device.settings?.resolution && (
            <>
              <span>·</span>
              <span>{device.settings.resolution}</span>
            </>
          )}
        </div>
        {device.settings?.batteryLevel !== undefined && (
          <div className="mt-2 text-xs text-gray-500">
            🔋 {device.settings.batteryLevel}%
          </div>
        )}
      </div>
    </Card>
  );
};
