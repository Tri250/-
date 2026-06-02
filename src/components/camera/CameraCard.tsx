import { Camera, Wifi, WifiOff, Clock, MapPin } from 'lucide-react';
import type { CameraDevice } from '../../types/camera';

interface CameraCardProps {
  device: CameraDevice;
  onClick?: () => void;
  onStreamClick?: () => void;
  onDelete?: () => void;
}

const brandLabels: Record<string, string> = {
  xiaomi: '小米',
  huawei: '华为',
  honor: '荣耀',
};

const statusConfig = {
  online: { color: 'bg-green-500', label: '在线' },
  offline: { color: 'bg-gray-400', label: '离线' },
  connecting: { color: 'bg-yellow-500', label: '连接中' },
  error: { color: 'bg-red-500', label: '错误' },
};

export function CameraCard({ device, onClick, onStreamClick, onDelete }: CameraCardProps) {
  const status = statusConfig[device.status];

  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex gap-4">
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {device.thumbnail ? (
            <img
              src={device.thumbnail}
              alt={device.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <Camera className="w-10 h-10 text-gray-500" />
            </div>
          )}
          
          <div className="absolute top-2 right-2">
            <div className={`w-3 h-3 rounded-full ${status.color} shadow-sm`} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-800 truncate">{device.name}</h3>
              <p className="text-xs text-gray-500">{brandLabels[device.brand]} · {device.model}</p>
            </div>
            {device.status === 'online' ? (
              <Wifi className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <WifiOff className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </div>

          <div className="space-y-1 text-xs text-gray-500">
            {device.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{device.location}</span>
              </div>
            )}
            {device.lastOnline && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>最后在线: {new Date(device.lastOnline).toLocaleString('zh-CN')}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStreamClick?.();
              }}
              disabled={device.status !== 'online'}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                device.status === 'online'
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {device.status === 'online' ? '查看直播' : '离线'}
            </button>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="py-2 px-3 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
