import { Mic, Camera, History, HeartPulse } from 'lucide-react';

interface QuickActionProps {
  onAction: (action: string) => void;
}

const actions = [
  { 
    id: 'record', 
    icon: Mic, 
    label: '录音', 
    gradient: 'from-orange-400 to-red-500',
    bgColor: 'bg-orange-50',
    shadowColor: 'shadow-orange-400/30'
  },
  { 
    id: 'photo', 
    icon: Camera, 
    label: '拍照', 
    gradient: 'from-blue-400 to-cyan-500',
    bgColor: 'bg-blue-50',
    shadowColor: 'shadow-blue-400/30'
  },
  { 
    id: 'history', 
    icon: History, 
    label: '历史', 
    gradient: 'from-purple-400 to-pink-500',
    bgColor: 'bg-purple-50',
    shadowColor: 'shadow-purple-400/30'
  },
  { 
    id: 'health', 
    icon: HeartPulse, 
    label: '健康', 
    gradient: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-50',
    shadowColor: 'shadow-green-400/30'
  },
];

export function QuickAction({ onAction }: QuickActionProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onAction(item.id)}
            className={`
              flex flex-col items-center gap-3 p-4 rounded-2xl
              ${item.bgColor}
              transition-all duration-300 ease-out
              hover:scale-105 hover:shadow-lg
              active:scale-95
              group
            `}
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div className={`
              w-14 h-14 rounded-2xl
              bg-gradient-to-br ${item.gradient}
              flex items-center justify-center
              shadow-lg ${item.shadowColor}
              transition-all duration-300
              group-hover:scale-110
              group-hover:shadow-xl
            `}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <span className="text-sm font-semibold text-surface-700 group-hover:text-surface-800 transition-colors">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
