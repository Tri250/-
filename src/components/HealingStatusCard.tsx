import React from 'react';
import { Heart, Utensils, Smile, Activity, Droplets, Zap } from 'lucide-react';

interface PetStatus {
  hunger: number;      // 饥饿度 0-100
  mood: number;        // 心情 0-100
  health: number;      // 健康值 0-100
  energy: number;      // 精力 0-100
  hydration: number;   // 水分 0-100
}

interface HealingStatusCardProps {
  petName: string;
  petAvatar?: string;
  emotion: 'happy' | 'excited' | 'calm' | 'curious' | 'sleepy' | 'anxious' | 'sad' | 'angry';
  status: PetStatus;
  lastUpdated: string;
}

const emotionConfig = {
  happy: { emoji: '😸', label: '开心', gradient: 'from-amber-300 to-yellow-400', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
  excited: { emoji: '🤩', label: '兴奋', gradient: 'from-orange-300 to-amber-400', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  calm: { emoji: '😌', label: '平静', gradient: 'from-teal-300 to-emerald-400', bgColor: 'bg-teal-50', textColor: 'text-teal-700' },
  curious: { emoji: '🤔', label: '好奇', gradient: 'from-blue-300 to-cyan-400', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  sleepy: { emoji: '😴', label: '困倦', gradient: 'from-indigo-300 to-purple-400', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
  anxious: { emoji: '😰', label: '焦虑', gradient: 'from-rose-300 to-pink-400', bgColor: 'bg-rose-50', textColor: 'text-rose-700' },
  sad: { emoji: '😢', label: '难过', gradient: 'from-slate-300 to-gray-400', bgColor: 'bg-slate-50', textColor: 'text-slate-700' },
  angry: { emoji: '😾', label: '生气', gradient: 'from-red-300 to-rose-400', bgColor: 'bg-red-50', textColor: 'text-red-700' },
};

interface StatusBarProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

const StatusBar = ({ icon: Icon, label, value, color, bgColor }: StatusBarProps) => {
  const getStatusColor = (val: number) => {
    if (val >= 80) return 'bg-emerald-400';
    if (val >= 60) return 'bg-amber-400';
    if (val >= 40) return 'bg-orange-400';
    return 'bg-rose-400';
  };

  const getStatusText = (val: number) => {
    if (val >= 80) return '很好';
    if (val >= 60) return '良好';
    if (val >= 40) return '一般';
    return '需关注';
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-neutral-600">{label}</span>
          <span className={`text-xs font-semibold ${value >= 60 ? 'text-emerald-600' : value >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
            {getStatusText(value)}
          </span>
        </div>
        <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${getStatusColor(value)}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-bold text-neutral-700 w-10 text-right">{value}</span>
    </div>
  );
};

export const HealingStatusCard: React.FC<HealingStatusCardProps> = ({
  petName,
  petAvatar,
  emotion,
  status,
  lastUpdated,
}) => {
  const config = emotionConfig[emotion];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-cream-50 to-peach-50/50 shadow-soft border border-white/60">
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-rose-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-200/20 to-blue-200/20 rounded-full blur-2xl" />

      <div className="relative p-5">
        {/* 头部信息 */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-3xl shadow-lg`}>
                {petAvatar ? (
                  <img src={petAvatar} alt={petName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  config.emoji
                )}
              </div>
              {/* 在线状态指示器 */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white shadow-md flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-800">{petName}</h2>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} ${config.textColor} mt-1`}>
                <span className="text-sm">{config.emoji}</span>
                <span className="text-xs font-medium">{config.label}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-400">更新于</div>
            <div className="text-xs font-medium text-neutral-500">{lastUpdated}</div>
          </div>
        </div>

        {/* 状态指示器网格 */}
        <div className="space-y-4">
          <StatusBar
            icon={Utensils}
            label="饱食度"
            value={status.hunger}
            color="text-amber-500"
            bgColor="bg-amber-100"
          />
          <StatusBar
            icon={Smile}
            label="心情值"
            value={status.mood}
            color="text-rose-500"
            bgColor="bg-rose-100"
          />
          <StatusBar
            icon={Heart}
            label="健康值"
            value={status.health}
            color="text-red-500"
            bgColor="bg-red-100"
          />
          <StatusBar
            icon={Zap}
            label="精力值"
            value={status.energy}
            color="text-yellow-500"
            bgColor="bg-yellow-100"
          />
          <StatusBar
            icon={Droplets}
            label="水分"
            value={status.hydration}
            color="text-blue-500"
            bgColor="bg-blue-100"
          />
        </div>

        {/* 底部提示 */}
        <div className="mt-5 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>
              {status.hunger < 40 ? '该喂食啦～' : 
               status.mood < 40 ? '需要更多陪伴' : 
               status.health < 60 ? '建议关注健康状况' : 
               status.energy < 30 ? '需要休息' : '状态很棒，继续保持！'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealingStatusCard;
