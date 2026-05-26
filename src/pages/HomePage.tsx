// ============================================
// PawSync Pro - HomePage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 应用首页，展示宠物状态和快捷操作
// ============================================

import { StatusCard } from '../components/StatusCard';
import { QuickAction } from '../components/QuickAction';
import { useAppStore } from '../store/appStore';
import { useBondStore } from '../store/bondStore';
import { useTrainingStore } from '../store/trainingStore';
import { 
  Bell, ChevronRight, TrendingUp, Moon, Camera, Monitor, Heart, 
  GraduationCap, Shield, MessageSquare, Stethoscope, Sparkles, 
  Trophy, Activity, Clock 
} from 'lucide-react';
import { useCameraStore } from '../store/cameraStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useState, useEffect } from 'react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

function AnimatedEmoji({ emotion }: { emotion: string }) {
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const emojiMap: Record<string, string> = {
    happy: '😸',
    curious: '🤔',
    anxious: '😰',
    angry: '😾',
    needs: '🥺',
    neutral: '😐',
  };

  return (
    <span className={`text-6xl ${bounce ? 'animate-bounce' : ''}`}>
      {emojiMap[emotion] || '😐'}
    </span>
  );
}

function BondScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          fill="none"
          stroke="currentColor"
          className="text-neutral-200"
          strokeWidth="12"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          fill="none"
          stroke="url(#bondGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="bondGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B00" />
            <stop offset="50%" stopColor="#FF8E3D" />
            <stop offset="100%" stopColor="#FFB473" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-neutral-800">{score}</span>
        <span className="text-xs text-neutral-500">亲密度</span>
      </div>
    </div>
  );
}

function HealthTrendChart() {
  const data = [65, 72, 68, 78, 82, 75, 88];
  const maxValue = Math.max(...data);
  
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2 h-24">
        {data.map((value, index) => {
          const height = (value / maxValue) * 100;
          const isToday = index === data.length - 1;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: '80px' }}>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    isToday 
                      ? 'bg-gradient-to-t from-primary-500 to-primary-400 shadow-lg shadow-primary-200' 
                      : 'bg-gradient-to-t from-primary-300 to-primary-200'
                  }`}
                  style={{ 
                    height: `${height}%`,
                    animationDelay: `${index * 0.1}s`
                  }}
                />
              </div>
              <span className={`text-xs ${isToday ? 'font-bold text-primary-500' : 'text-neutral-400'}`}>
                {['一', '二', '三', '四', '五', '六', '日'][index]}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success-500" />
          <span className="text-neutral-600">本周趋势</span>
        </div>
        <Badge color="green" size="small">+12%</Badge>
      </div>
    </div>
  );
}

function AlertBanner({ alert, onClick }: { alert: any; onClick: () => void }) {
  return (
    <Card 
      variant="gradient" 
      padding="medium" 
      onClick={onClick}
      className="cursor-pointer hover:scale-102 transition-transform"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-danger-100 to-danger-200 flex items-center justify-center">
            <Bell className="w-7 h-7 text-danger-500" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger-500 rounded-full animate-pulse" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-neutral-800">健康提醒</span>
            <Badge color="red" size="small">重要</Badge>
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed">
            {alert.message}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {alert.time || '刚刚'}
          </p>
        </div>
        
        <button className="px-4 py-2 bg-white rounded-full text-sm font-medium text-primary-500 hover:bg-primary-50 transition-colors shadow-sm">
          查看
        </button>
      </div>
    </Card>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  color, 
  onClick, 
  badge 
}: { 
  icon: any, 
  title: string, 
  description: string, 
  color: string,
  onClick: () => void,
  badge?: string
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 text-left hover:shadow-md hover:scale-[1.02] transition-all group animate-fade-in"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-neutral-800">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full text-xs font-medium">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-primary-400 transition-colors" />
      </div>
    </button>
  );
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { currentPet, currentEmotion, healthScore, healthAlerts } = useAppStore();
  const { metrics, badges, totalPoints, streakDays } = useBondStore();
  const { courses, totalTrainingTime } = useTrainingStore();
  const { devices, loadDevices } = useCameraStore();
  const lastActivity = '刚刚活跃';

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const unlockedBadges = badges.filter(b => b.isUnlocked).length;
  const inProgressCourses = courses.filter(c => c.progress > 0).length;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary-500 via-primary-500 to-primary-600 text-white">
        <div className="max-w-md mx-auto px-4 pt-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Heart className="w-6 h-6 fill-current" />
                PawSync Pro
              </h1>
              <p className="text-xs text-primary-100 mt-1">温暖守护 · 陪伴成长</p>
            </div>
            <button 
              className="relative p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-colors"
              onClick={() => onNavigate('health')}
            >
              <Bell className="w-6 h-6"/>
              {healthAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-warning-400 rounded-full animate-pulse" />
              )}
            </button>
          </div>

          {/* Bond Score & Quick Stats */}
          <div className="flex items-center gap-6">
            <BondScoreCircle score={metrics.overall} />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-warning-300" />
                  <span className="text-sm">{unlockedBadges} 徽章</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-secondary-200" />
                  <span className="text-sm">{streakDays} 天</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-warning-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(totalPoints / 2000) * 100}%` }}
                  />
                </div>
                <span className="text-xs">{totalPoints} 积分</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 -mt-8 space-y-5">
        {/* Status Card */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-neutral-100 animate-slide-up">
          <StatusCard 
            petName={currentPet?.name || ''} 
            emotion={currentEmotion} 
            healthScore={healthScore} 
            lastActivity={lastActivity}
          />
        </div>

        {/* Quick Features Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('camera')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 text-center hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-neutral-800 text-sm">设备管理</h3>
            <p className="text-xs text-neutral-500">
              {devices.length} 个设备 · {onlineDevices} 在线
            </p>
          </button>

          <button
            onClick={() => onNavigate('monitor')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 text-center hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-neutral-800 text-sm">实时监控</h3>
            <p className="text-xs text-neutral-500">
              {onlineDevices > 0 ? '点击开始监控' : '暂无设备在线'}
            </p>
          </button>
        </div>

        {/* Feature Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500" />
              核心功能
            </h2>
          </div>

          <FeatureCard
            icon={MessageSquare}
            title="AI 情绪翻译"
            description="了解毛孩子的心声"
            color="bg-gradient-to-br from-primary-400 to-primary-500"
            onClick={() => onNavigate('translator')}
            badge="热门"
          />

          <FeatureCard
            icon={GraduationCap}
            title="宠物训练"
            description={`${inProgressCourses > 0 ? `已完成 ${inProgressCourses} 课程` : '开始训练之旅'}`}
            color="bg-gradient-to-br from-purple-400 to-purple-500"
            onClick={() => onNavigate('training')}
          />

          <FeatureCard
            icon={Heart}
            title="健康守护"
            description="全方位健康监测"
            color="bg-gradient-to-br from-success-400 to-success-500"
            onClick={() => onNavigate('health')}
          />

          <FeatureCard
            icon={Sparkles}
            title="更多服务"
            description="保险、医疗咨询一站式"
            color="bg-gradient-to-br from-secondary-400 to-secondary-500"
            onClick={() => onNavigate('services')}
          />
        </section>

        {/* Health Trend */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-success-500" />
              <h2 className="text-base font-semibold text-neutral-800">健康趋势</h2>
            </div>
            <button 
              className="text-xs text-primary-500 font-medium flex items-center gap-1 hover:text-primary-600 transition-colors"
              onClick={() => onNavigate('health')}
            >
              查看详情 <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
          <HealthTrendChart />
        </section>

        {/* Home Guardian */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-purple-500" />
              <h2 className="text-base font-semibold text-neutral-800">离家守护</h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary-400 peer-checked:to-primary-500"></div>
            </label>
          </div>
          <p className="text-sm text-neutral-500 leading-relaxed">
            守护模式已开启，{currentPet?.name || '毛球'}的异常行为将被实时监测
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
            <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
            <span>正在守护中</span>
          </div>
        </section>

        {healthAlerts.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-warning-500" />
              待处理提醒
            </h2>
            {healthAlerts.slice(0, 2).map((alert, index) => (
              <AlertBanner 
                key={index} 
                alert={alert} 
                onClick={() => onNavigate('health')}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
