import { Activity, Clock, Sparkles, TrendingUp, Heart, Target } from 'lucide-react';
import { Badge } from './UIEnhancements';
import { PetAvatar, PetMemoryBadge } from './PetAvatar';

interface StatusCardProps {
  petName: string;
  petType: 'dog' | 'cat' | 'other';
  emotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';
  healthScore: number;
  lastActivity: string;
  daysTogether: number;
  memoryCount: number;
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

export function StatusCard({ petName, petType, emotion, healthScore, lastActivity, daysTogether, memoryCount }: StatusCardProps) {
  const config = emotionConfig[emotion];
  
  const healthLevel = healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : 'needs-attention';
  
  const getHealthColor = () => {
    if (healthLevel === 'excellent') return 'from-green-400 to-emerald-500';
    if (healthLevel === 'good') return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };
  
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-50 shadow-xl border border-slate-100/50 animate-fadeInUp">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-orange-200/25 to-cyan-200/25 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-br from-cyan-200/25 to-purple-200/25 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>
      
      <div className="relative p-6">
        {/* 顶部：宠物头像与基本信息 */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-5">
            {/* 专业级宠物头像 */}
            <PetAvatar 
              petName={petName}
              petType={petType}
              emotion={emotion}
              size="xl"
              isOnline={true}
            />
            
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{petName}</h2>
                <Badge variant="success" size="sm" dot pulse>AI监控中</Badge>
                <div className={`
                  inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                  ${config.bgColor} border border-white/50 shadow-sm
                `}>
                  <Target className={`w-3.5 h-3.5 ${config.textColor}`} />
                  <span className={`text-sm font-bold ${config.textColor}`}>{config.label}</span>
                </div>
              </div>
              
              {/* 陪伴记忆徽章 */}
              <div className="pt-2">
                <PetMemoryBadge 
                  petName={petName} 
                  memoryCount={memoryCount} 
                  daysTogether={daysTogether} 
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/60 px-3 py-2 rounded-2xl border border-slate-200/60 shadow-sm">
            <Clock className="w-4 h-4" />
            <span className="font-semibold">{lastActivity}</span>
          </div>
        </div>
        
        {/* 健康与活跃度数据卡片 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-1 group card-3d-hover">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-400/30 animate-bounce-soft">
                  <Heart className="w-5.5 h-5.5 text-white" />
                </div>
                <span className="text-sm font-black text-slate-700">健康指数</span>
              </div>
              <TrendingUp className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <div className="h-3.5 bg-slate-200/60 rounded-full overflow-hidden">
                  <div className={`
                    absolute inset-y-0 left-0 rounded-full
                    bg-gradient-to-r ${getHealthColor()}
                    shadow-inner
                    transition-all duration-1500 ease-out
                  `} style={{ width: `${healthScore}%` }} />
                </div>
              </div>
              <span className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {healthScore}
                <span className="text-lg">%</span>
              </span>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-1 group card-3d-hover">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-400/30 animate-bounce-soft" style={{ animationDelay: '0.3s' }}>
                  <Activity className="w-5.5 h-5.5 text-white" />
                </div>
                <span className="text-sm font-black text-slate-700">活跃度</span>
              </div>
              <TrendingUp className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <div className="h-3.5 bg-slate-200/60 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full shadow-inner transition-all duration-1500 ease-out" style={{ width: '85%' }} />
                </div>
              </div>
              <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                85
                <span className="text-lg">%</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* AI智能健康监控条 */}
        <div className="flex items-center gap-4 text-sm text-slate-600 bg-gradient-to-r from-green-50 via-emerald-50 to-cyan-50 rounded-2xl p-4.5 border border-green-100/50">
          <div className="relative flex-shrink-0">
            <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
            <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-500 animate-ping" />
          </div>
          <div className="flex-1">
            <p className="font-black text-slate-700 text-base">AI 智能健康监控</p>
            <p className="text-xs text-slate-500 mt-0.5">实时分析，数据精准，{daysTogether}天24小时守护</p>
          </div>
          <div className="flex-shrink-0">
            <Sparkles className="w-6 h-6 text-orange-500 animate-bounce-soft" />
          </div>
        </div>
      </div>
    </div>
  );
}
