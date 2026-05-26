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
import { Bell, ChevronRight, TrendingUp, Moon, Camera, Monitor, Heart } from 'lucide-react';
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
                      ? 'bg-gradient-to-t from-orange-500 to-peach-400 shadow-lg shadow-orange-200' 
                      : 'bg-gradient-to-t from-orange-300 to-peach-200'
                  }`}
                  style={{ 
                    height: `${height}%`,
                    animationDelay: `${index * 0.1}s`
                  }}
                />
              </div>
              <span className={`text-xs ${isToday ? 'font-bold text-orange-500' : 'text-gray-400'}`}>
                {['一', '二', '三', '四', '五', '六', '日'][index]}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">本周趋势</span>
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
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
            <Bell className="w-7 h-7 text-red-500" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-800">健康提醒</span>
            <Badge color="red" size="small">重要</Badge>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {alert.message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {alert.time || '刚刚'}
          </p>
        </div>
        
        <button className="px-4 py-2 bg-white rounded-full text-sm font-medium text-orange-500 hover:bg-orange-50 transition-colors shadow-sm">
          查看
        </button>
      </div>
    </Card>
  );
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { currentPet, currentEmotion, healthScore, healthAlerts } = useAppStore();
  const { devices, loadDevices } = useCameraStore();
  const lastActivity = '刚刚活跃';

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const onlineDevices = devices.filter(d => d.status === 'online').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-peach-50/30 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Heart className="w-6 h-6 text-orange-500" />
              PawSync Pro
            </h1>
            <p className="text-xs text-gray-400">爪印同频 · 守护版</p>
          </div>
          <button 
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => onNavigate('health')}
          >
            <Bell className="w-6 h-6 text-gray-600"/>
            {healthAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        <StatusCard 
          petName={currentPet?.name || ''} 
          emotion={currentEmotion} 
          healthScore={healthScore} 
          lastActivity={lastActivity}
        />

        <div className="grid grid-cols-2 gap-3">
          <Card 
            variant="gradient" 
            padding="large"
            onClick={() => onNavigate('camera')}
            className="cursor-pointer hover:scale-102 transition-transform"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-peach-500 flex items-center justify-center shadow-lg">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">设备管理</h3>
                <p className="text-sm text-gray-500">
                  {devices.length} 个设备 · {onlineDevices} 在线
                </p>
              </div>
            </div>
          </Card>

          <Card 
            variant="gradient" 
            padding="large"
            onClick={() => onNavigate('monitor')}
            className={`cursor-pointer hover:scale-102 transition-transform ${
              onlineDevices === 0 ? 'opacity-60' : ''
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                onlineDevices > 0 
                  ? 'bg-gradient-to-br from-purple-400 to-violet-500' 
                  : 'bg-gradient-to-br from-gray-300 to-gray-400'
              }`}>
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">实时监控</h3>
                <p className="text-sm text-gray-500">
                  {onlineDevices > 0 ? '点击开始监控' : '暂无设备在线'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <span className="text-xl">✨</span>
              快捷操作
            </h2>
            <button 
              className="text-xs text-orange-500 font-medium flex items-center gap-1 hover:text-orange-600 transition-colors"
              onClick={() => onNavigate('translator')}
            >
              查看全部 <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
          <QuickAction onAction={(action) => {
            if (action === 'record' || action === 'photo') {
              onNavigate('translator');
            }
            else if (action === 'health') {
              onNavigate('health');
            }
            else if (action === 'history') {
              onNavigate('profile');
            }
          }}/>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h2 className="text-base font-semibold text-gray-700">健康趋势</h2>
            </div>
            <button 
              className="text-xs text-orange-500 font-medium flex items-center gap-1 hover:text-orange-600 transition-colors"
              onClick={() => onNavigate('health')}
            >
              查看详情 <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
          <HealthTrendChart />
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-purple-500" />
              <h2 className="text-base font-semibold text-gray-700">离家守护</h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-400 peer-checked:to-peach-500"></div>
            </label>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            守护模式已开启，{currentPet?.name || '小橘'}的异常行为将被实时监测
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>正在守护中</span>
          </div>
        </section>

        {healthAlerts.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="text-xl">🔔</span>
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
