import { Activity, Clock, Sparkles } from 'lucide-react';

interface StatusCardProps {
  petName: string;
  emotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';
  healthScore: number;
  lastActivity: string;
}

const emotionConfig = {
  happy: { emoji: '😸', label: '开心', color: 'text-green-500', bgColor: 'bg-green-50' },
  anxious: { emoji: '😰', label: '焦虑', color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  angry: { emoji: '😾', label: '生气', color: 'text-red-500', bgColor: 'bg-red-50' },
  needs: { emoji: '🥺', label: '有需求', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  neutral: { emoji: '😐', label: '平静', color: 'text-gray-500', bgColor: 'bg-gray-50' },
};

export function StatusCard({ petName, emotion, healthScore, lastActivity }: StatusCardProps) {
  const config = emotionConfig[emotion];

  return (
    <div className="bg-gradient-to-br from-orange-50 via-white to-peach-50 rounded-2xl p-5 shadow-sm border border-orange-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-peach-400 flex items-center justify-center text-2xl shadow-lg">
            {config.emoji}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{petName}</h2>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
              <Sparkles className="w-3 h-3" />
              {config.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <Clock className="w-4 h-4" />
          {lastActivity}
        </div>
      </div>

      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${healthScore}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-700">健康指数 {healthScore}%</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
        <Activity className="w-4 h-4" />
        <span>最近状态稳定，继续保持观察</span>
      </div>
    </div>
  );
}