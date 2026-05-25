import { StatusCard } from '../components/StatusCard';
import { QuickAction } from '../components/QuickAction';
import { useAppStore } from '../store/appStore';
import { Bell, TrendingUp, Activity, Shield, Zap, Calendar, TrendingDown } from 'lucide-react';
import { Badge, GlassCard, GradientButton, PulseDot } from '../components/UIEnhancements';
import { BrandLogo, BrandLogoText, BrandBadge } from '../components/Brand';
import { TechParticles, TechDivider } from '../components/TechEffects';
import { AuroraBackground, AnimatedGradientText, PulseGlow } from '../components/SoundWaveEffects';
import { useState } from 'react';

interface HomePageProps {
 onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { currentPet, healthAlerts } = useAppStore();
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(true);
  
  const weeklyHealthData = [
    { day: '周一', score: 65, trend: 'up' },
    { day: '周二', score: 72, trend: 'up' },
    { day: '周三', score: 68, trend: 'down' },
    { day: '周四', score: 78, trend: 'up' },
    { day: '周五', score: 82, trend: 'up' },
    { day: '周六', score: 85, trend: 'up' },
    { day: '周日', score: 88, trend: 'up' },
  ];

  const maxScore = Math.max(...weeklyHealthData.map(d => d.score));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 relative overflow-hidden">
      <AuroraBackground />
      <TechParticles className="opacity-40" />
      
      <header className="sticky top-0 z-40 glass-effect border-b border-slate-200/50 backdrop-blur-2xl">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo size={48} />
              <BrandLogoText />
            </div>
            <div className="relative">
              <button className="relative p-3 rounded-2xl bg-white/70 hover:bg-white shadow-sm border border-slate-200/50 transition-all duration-300 hover:scale-105 active:scale-95">
                <Bell className="w-6 h-6 text-slate-600" />
                {healthAlerts.length > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-xl shadow-red-400/50 animate-bounce-soft">
                      {healthAlerts.length}
                    </span>
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping opacity-30" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6 animate-fadeInUp relative z-10">
        <StatusCard 
          petName={currentPet?.name || ''} 
          petType="cat"
          emotion="happy"
          healthScore={88} 
          lastActivity="刚刚活跃"
          daysTogether={127}
          memoryCount={45}
        />

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              智能快速入口
            </h2>
            <BrandBadge>AI 驱动</BrandBadge>
          </div>
          <QuickAction onAction={(action) => {
            if (action === 'record' || action === 'photo') {
              onNavigate('translator');
            } else if (action === 'health') {
              onNavigate('health');
            } else if (action === 'history') {
              onNavigate('profile');
            }
          }}/>
        </section>

        <GlassCard className="space-y-5 card-3d-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-400/40 animate-bounce-soft">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-slate-800">健康趋势追踪</h3>
                <p className="text-xs text-slate-500 font-semibold">近7天 AI 深度分析</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('health')}
              className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-orange-500/10 to-cyan-500/10 text-orange-600 hover:from-orange-500/20 hover:to-cyan-500/20 rounded-xl border border-orange-500/20 transition-all duration-300"
            >
              查看详情
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-end gap-2 h-36 pb-2">
              {weeklyHealthData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                  <div 
                    className="w-full rounded-t-xl transition-all duration-700 ease-out group-hover:scale-105 shadow-lg"
                    style={{ 
                      height: `${(item.score / maxScore) * 100}%`,
                      background: item.score >= 80 
                        ? 'linear-gradient(to top, #10b981, #34d399)'
                        : item.score >= 60
                        ? 'linear-gradient(to top, #f59e0b, #fbbf24)'
                        : 'linear-gradient(to top, #ef4444, #f87171)',
                      boxShadow: item.score >= 80 ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <div className="text-xs font-black text-slate-500 group-hover:text-slate-700 transition-colors">
                    {item.day}
                  </div>
                  <div className="text-lg font-black text-slate-700">
                    {item.score}
                  </div>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    item.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {item.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <TechDivider className="my-2" />
            
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100/50 card-3d-hover">
                <div className="text-2xl font-black text-green-600">+12%</div>
                <div className="text-[10px] font-semibold text-green-700 mt-1">周环比</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100/50 card-3d-hover">
                <div className="text-2xl font-black text-blue-600">7天</div>
                <div className="text-[10px] font-semibold text-blue-700 mt-1">数据周期</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100/50 card-3d-hover">
                <div className="text-2xl font-black text-purple-600">优</div>
                <div className="text-[10px] font-semibold text-purple-700 mt-1">健康评级</div>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="space-y-4 border-l-4 border-purple-500 card-3d-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-400/40 animate-bounce-soft">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-slate-800">离家守护模式</h3>
                <p className="text-xs text-slate-500 font-semibold">AI 全天候异常行为检测</p>
              </div>
            </div>
            <button
              onClick={() => setIsProtectionEnabled(!isProtectionEnabled)}
              className={`relative w-16 h-8 rounded-full transition-all duration-500 ${
                isProtectionEnabled 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl shadow-purple-400/40' 
                  : 'bg-slate-200'
              }`}
            >
              <span 
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-xl transition-all duration-500 ${
                  isProtectionEnabled ? 'left-9' : 'left-1'
                }`} 
              />
            </button>
          </div>
          
          {isProtectionEnabled && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100/50">
              <div className="flex items-start gap-3">
                <PulseDot className="w-3 h-3 bg-purple-500" />
                <div className="flex-1">
                  <p className="text-sm font-black text-purple-700 mb-1">守护模式已激活</p>
                  <p className="text-xs text-purple-600 leading-relaxed">
                    {currentPet?.name} 的所有行为数据正在被 AI 深度分析，异常将立即通知
                  </p>
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {healthAlerts.length > 0 && (
          <PulseGlow>
            <GlassCard className="space-y-4 border-l-4 border-orange-500">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-xl shadow-orange-400/40 animate-bounce-soft">
                  <Bell className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-black text-slate-800 text-lg">健康提醒</h3>
                    <Badge variant="warning" size="sm">新通知</Badge>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{healthAlerts[0].message}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <GradientButton 
                      onClick={() => onNavigate('health')}
                      variant="primary"
                      size="sm"
                    >
                      立即处理
                    </GradientButton>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {healthAlerts[0].timestamp}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </PulseGlow>
        )}

        <GlassCard className="text-center space-y-5 pt-4 pb-6 card-3d-hover">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-cyan-500 rounded-3xl shadow-glow animate-glow-pulse" />
            <div className="absolute inset-1 bg-gradient-to-br from-white/30 to-transparent rounded-2xl" />
            <div className="relative w-full h-full flex items-center justify-center">
              <Activity className="w-12 h-12 text-white drop-shadow-lg animate-bounce-soft" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800">
              <AnimatedGradientText>开启智能健康之旅</AnimatedGradientText>
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              PawSync Pro 为您的爱宠提供全方位 AI 守护
            </p>
          </div>
          <GradientButton 
            onClick={() => onNavigate('health')}
            variant="primary"
            size="lg"
            className="w-full"
            icon={<Shield className="w-5 h-5" />}
          >
            开启智能守护
          </GradientButton>
        </GlassCard>
        
        <div className="h-24" />
      </main>
    </div>
  );
}
