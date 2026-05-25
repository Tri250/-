import { Activity, Clock, Sparkles, TrendingUp, Heart, Target } from 'lucide-react';
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
    glowColor: 'shadow-green-400/50'
  },
  anxious: { 
    emoji: '😰', 
    label: '焦虑', 
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    glowColor: 'shadow-yellow-400/50'
  },
  angry: { 
    emoji: '😾', 
    label: '生气', 
    color: 'from-red-400 to-pink-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    glowColor: 'shadow-red-400/50'
  },
  needs: { 
    emoji: '🥺', 
    label: '有需求', 
    color: 'from-blue-400 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    glowColor: 'shadow-blue-400/50'
  },
  neutral: { 
    emoji: '😐', 
    label: '平静', 
    color: 'from-slate-400 to-slate-500',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
    glowColor: 'shadow-slate-400/50'
  },
};

export function StatusCard({ petName, emotion, healthScore, lastActivity }: StatusCardProps) {
  const config = emotionConfig[emotion];
  
  const healthLevel = healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : 'needs-attention';
  
  const getHealthColor = () => {
    if (healthLevel === 'excellent') return 'from-green-400 to-emerald-500';
    if (healthLevel === 'good') return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };
  
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-50 shadow-xl border border-slate-100/50 animate-fadeInUp">
      <div className="absolute inset-0">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-orange-200/30 to-cyan-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-cyan-200/30 to-purple-200/30 rounded-full blur-3xl" />
      </div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`
                w-20 h-20 rounded-2xl bg-gradient-to-br ${config.color} 
                flex items-center justify-center text-4xl
                shadow-lg ${config.glowColor}
                animate-float
                transition-all duration-700
              `}>
                {config.emoji}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
              </div>
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{petName}</h2>
                <Badge variant="success" size="sm" dot pulse>AI监控中</Badge>
              </div>
              <div className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                ${config.bgColor} border border-white/50 shadow-sm
              `}>
                <Target className={`w-4 h-4 ${config.textColor}`} />
                <span className={`text-sm font-bold ${config.textColor}`}>{config.label}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm text-slate-500 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200/50">
            <Clock className="w-4 h-4" />
            <span className="font-semibold">{lastActivity}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-400/30">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-700">健康指数</span>
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <div className="h-3 bg-slate-200/50 rounded-full overflow-hidden">
                  <div 
                    className={`
                      absolute inset-y-0 left-0 rounded-full
                      bg-gradient-to-r ${getHealthColor()}
                      shadow-inner
                      transition-all duration-1500 ease-out
                    `}
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
              </div>
              <span className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {healthScore}
                <span className="text-lg">%</span>
              </span>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-400/30">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-700">活跃度</span>
              </div>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <div className="h-3 bg-slate-200/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full shadow-inner transition-all duration-1500 ease-out"
                    style={{ width: '85%' }}
                  />
                </div>
              </div>
              <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                85
                <span className="text-lg">%</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm text-slate-600 bg-gradient-to-r from-green-50 via-emerald-50 to-cyan-50 rounded-2xl p-4 border border-green-100/50">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-700">AI 智能健康监控</p>
            <p className="text-xs text-slate-500 mt-0.5">实时分析，数据精准，24小时守护</p>
          </div>
        </div>
      </div>
    </div>
  );
}
