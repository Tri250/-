import { AlertTriangle, AlertCircle, Info, Check, X, Camera } from 'lucide-react';
import type { SmartEvent } from '../../types/monitor';

interface EventAlertProps {
  event: SmartEvent;
  onAcknowledge?: () => void;
  onDismiss?: () => void;
  onViewDetails?: () => void;
}

const severityConfig = {
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  critical: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

const typeLabels = {
  behavior: '行为事件',
  emotion: '情绪事件',
  environment: '环境事件',
};

export function EventAlert({ event, onAcknowledge, onDismiss, onViewDetails }: EventAlertProps) {
  const config = severityConfig[event.severity];
  const Icon = config.icon;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    
    if (hours < 1) {
      const minutes = Math.floor(diff / 60000);
      return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${config.borderColor} ${event.acknowledged ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${config.bgColor} ${config.color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
                {typeLabels[event.type]}
              </span>
              {event.acknowledged && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                  已确认
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">{formatTime(event.timestamp)}</span>
          </div>

          <p className="text-sm font-medium text-gray-800 mb-2">{event.description}</p>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Camera className="w-3 h-3" />
            <span>{event.cameraId}</span>
          </div>
        </div>
      </div>

      {!event.acknowledged && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              查看详情
            </button>
          )}
          {onAcknowledge && (
            <button
              onClick={onAcknowledge}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center gap-1"
            >
              <Check className="w-3 h-3" />
              确认
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="py-2 px-3 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
