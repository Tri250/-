import { Mic, Camera, History, HeartPulse } from 'lucide-react';

interface QuickActionProps {
  onAction: (action: string) => void;
}

const actions = [
  { id: 'record', icon: Mic, label: '录音', color: 'from-orange-400 to-amber-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  { id: 'photo', icon: Camera, label: '拍照', color: 'from-blue-400 to-cyan-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'history', icon: History, label: '历史', color: 'from-purple-400 to-pink-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 'health', icon: HeartPulse, label: '健康', color: 'from-green-400 to-emerald-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
];

export function QuickAction({ onAction }: QuickActionProps) {
  const handleAction = async (actionId: string) => {
    // 添加触觉反馈
    try {
      const { HapticsService } = await import('../lib/platformService');
      await HapticsService.light();
    } catch {
      // 忽略触觉反馈错误
    }
    
    // 执行操作
    onAction(actionId);
  };

  return (
    <div 
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      role="list"
      aria-label="快捷操作列表"
    >
      {actions.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => handleAction(item.id)}
            className={`flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-2xl ${item.bgColor} border border-neutral-100/50 dark:border-neutral-800/50 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 touch-manipulation min-h-[100px] sm:min-h-[110px]`}
            aria-label={item.label}
            role="listitem"
          >
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`}>
              <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2} />
            </div>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}