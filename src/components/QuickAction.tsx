import { Mic, Camera, History, HeartPulse } from 'lucide-react';

interface QuickActionProps {
  onAction: (action: string) => void;
}

const actions = [
  { id: 'record', icon: Mic, label: '录音', color: 'from-orange-400 to-peach-400', bgColor: 'bg-orange-50' },
  { id: 'photo', icon: Camera, label: '拍照', color: 'from-blue-400 to-cyan-400', bgColor: 'bg-blue-50' },
  { id: 'history', icon: History, label: '历史', color: 'from-purple-400 to-pink-400', bgColor: 'bg-purple-50' },
  { id: 'health', icon: HeartPulse, label: '健康', color: 'from-green-400 to-emerald-400', bgColor: 'bg-green-50' },
];

export function QuickAction({ onAction }: QuickActionProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onAction(item.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl ${item.bgColor} hover:scale-105 transition-all duration-300`}
          >
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}