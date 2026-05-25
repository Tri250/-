import { Activity, Clock, Sparkles, TrendingUp, Heart } from 'lucide-react';
import { Badge } from './UIEnhancements';

interface StatusCardProps {
  petName: string;
  emotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';
  healthScore: number;
  lastActivity: string;
}

const emotionConfig = {
  happy: { 
    emoji: '😸', 
    label: '开心', 
    color: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    glowColor: 'shadow-green-400/30'
  },
  anxious: { 
    emoji: '😰', 
    label: '焦虑', 
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    glowColor: 'shadow-yellow-400/30'
  },
  angry: { 
    emoji: '😾', 
    label: '生气', 
    color: 'from-red-400 to-pink-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    glowColor: 'shadow-red-400/30'
  },
  needs: { 
    emoji: '🥺', 
    label: '有需求', 
    color: 'from-blue-400 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    glowColor: 'shadow-blue-400/30'
  },
  neutral: { 
    emoji: '😐', 
    label: '平静', 
    color: 'from-gray-400 to-slate-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    glowColor: 'shadow-gray-400/30'
  },
};

export function StatusCard({ petName, emotion, healthScore, lastActivity }: StatusCardProps) {
  const config = emotionConfig[emotion];
  
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white shadow-soft border border-surface-100 animate-fadeInUp">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 via-transparent to-accent-50/30 pointer-events-none" />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`relative`}>
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center text-4xl shadow-lg ${config.glowColor} animate-bounce-soft`}>
                {config.emoji}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                <Sparkles className={`w-4 h-4 ${config.textColor}`} />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-surface-800 tracking-tight">{petName}</h2>
                <Badge variant="success" size="sm" dot pulse>在线</Badge>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bgColor}`}>
                <span className={`text-sm font-semibold ${config.textColor}`}>{config.label}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm text-surface-500">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{lastActivity}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-surface-700">健康指数</span>
              </div>
              <TrendingUp className="w-4 h-4 text-health-good" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="relative h-3 bg-green-200/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">{healthScore}%</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-surface-700">活跃度</span>
              </div>
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="relative h-3 bg-blue-200/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: '85%' }}
                  />
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600">85%</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2 text-sm text-surface-600 bg-surface-50 rounded-xl p-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-medium">最近状态稳定，继续保持观察</span>
        </div>
      </div>
    </div>
  );
}
