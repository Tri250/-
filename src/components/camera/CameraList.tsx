import { Camera, Plus } from 'lucide-react';
import { CameraCard } from './CameraCard';
import type { CameraDevice } from '../../types/camera';

interface CameraListProps {
  devices: CameraDevice[];
  onDeviceClick?: (device: CameraDevice) => void;
  onStreamClick?: (device: CameraDevice) => void;
  onDeleteDevice?: (device: CameraDevice) => void;
  onAddClick?: () => void;
  loading?: boolean;
}

export function CameraList({
  devices,
  onDeviceClick,
  onStreamClick,
  onDeleteDevice,
  onAddClick,
  loading = false,
}: CameraListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-xl" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Camera className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">暂无摄像头设备</h3>
        <p className="text-sm text-gray-500 mb-6">添加摄像头设备，实时监控宠物状态</p>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">添加设备</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {devices.map((device) => (
        <CameraCard
          key={device.id}
          device={device}
          onClick={() => onDeviceClick?.(device)}
          onStreamClick={() => onStreamClick?.(device)}
          onDelete={onDeleteDevice ? () => onDeleteDevice(device) : undefined}
        />
      ))}
      
      {onAddClick && (
        <button
          onClick={onAddClick}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">添加更多设备</span>
        </button>
      )}
    </div>
  );
}
