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

const statusConfig: Record<string, { color: string; label: string }> = {
  online: { color: 'bg-green-500', label: '在线' },
  offline: { color: 'bg-gray-400', label: '离线' },
  connecting: { color: 'bg-yellow-500', label: '连接中' },
  updating: { color: 'bg-yellow-500', label: '更新中' },
  error: { color: 'bg-red-500', label: '错误' },
};

export function CameraCard({ device, onClick, onStreamClick, onDelete }: CameraCardProps) {
  const status = statusConfig[device.status];

  return (
    <div
      className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer w-full"
      onClick={onClick}
    >
      <div className="flex gap-3 sm:gap-4">
        {/* 响应式缩略图 - 使用 aspect-ratio 保持比例 */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {device.thumbnail ? (
            <img
              src={device.thumbnail}
              alt={device.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <Camera className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gray-500" />
            </div>
          )}
          
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${status.color} shadow-sm`} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1.5 sm:mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm sm:text-base text-gray-800 truncate">{device.name}</h3>
              <p className="text-xs text-gray-500 truncate">{brandLabels[device.brand]} · {device.model}</p>
            </div>
            <div className="flex-shrink-0 ml-2">
              {device.status === 'online' ? (
                <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              )}
            </div>
          </div>

          <div className="space-y-0.5 sm:space-y-1 text-xs text-gray-500">
            {device.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{device.location}</span>
              </div>
            )}
            {device.lastOnline && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">最后在线: {new Date(device.lastOnline).toLocaleString('zh-CN')}</span>
              </div>
            )}
          </div>

          {/* 按钮区域 - 触摸目标至少 44px */}
          <div className="flex gap-2 mt-2 sm:mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStreamClick?.();
              }}
              disabled={device.status !== 'online'}
              className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center ${
                device.status === 'online'
                  ? 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700'
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
                className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
