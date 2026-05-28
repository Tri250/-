
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Activity, Stethoscope, Mic, BookOpen, Bell, Camera, ChevronRight, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/DesignSystem/Card';
import { Button } from '../components/DesignSystem/Button';

export default function Home() {
  const navigate = useNavigate();
  const { currentPet, bondScore, upcomingReminders } = useAppStore();

  const quickActions = [
    { icon: Stethoscope, label: 'AI顾问', color: 'primary', path: '/ai-consultant' },
    { icon: Activity, label: '健康记录', color: 'success', path: '/health-records' },
    { icon: Mic, label: '情绪翻译', color: 'purple', path: '/translator' },
    { icon: BookOpen, label: '健康手册', color: 'secondary', path: '/manuals' },
    { icon: Bell, label: '提醒', color: 'warning', path: '/reminders' },
    { icon: Camera, label: '监控', color: 'danger', path: '/camera-monitor' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero 区域 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary-500 via-primary-400 to-orange-300 p-6 pb-24"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">你好，毛孩子家长</h1>
          <button 
            onClick={() => navigate('/pets')}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white transition-all hover:bg-white/30"
          >
            {currentPet?.avatar ? (
              <img src={currentPet.avatar} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                🐾
              </div>
            )}
            <span className="text-sm font-medium">{currentPet?.name || '切换宠物'}</span>
          </button>
        </div>

        {/* 亲密度展示 */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#fff"
                strokeWidth="12"
                fill="transparent"
                strokeOpacity="0.2"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                stroke="#fff"
                strokeWidth="12"
                fill="transparent"
                strokeLinecap="round"
                initial={{ strokeDasharray: 352, strokeDashoffset: 352 }}
                animate={{ strokeDashoffset: 352 - (352 * bondScore) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{bondScore}</span>
              <span className="text-xs text-white/80">亲密度</span>
            </div>
          </div>
          <div className="text-white">
            <h2 className="text-xl font-bold">{currentPet?.name || '毛孩子'}</h2>
            <p className="opacity-90 text-sm">今日健康: <span className="font-semibold">优秀</span></p>
          </div>
        </div>
      </motion.div>

      {/* 健康概览卡片 */}
      <div className="px-4 -mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card elevated className="p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-neutral-800">今日健康</h3>
              <button className="flex items-center text-primary-500 text-sm font-medium">
                查看详情 <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Activity size={20} className="text-success-500" />
                  <span className="text-2xl font-bold text-success-500">92</span>
                </div>
                <div className="text-sm text-neutral-500">健康分</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp size={20} className="text-primary-500" />
                  <span className="text-2xl font-bold text-primary-500">45</span>
                </div>
                <div className="text-sm text-neutral-500">活动分钟</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Heart size={20} className="text-purple-500" />
                  <span className="text-2xl font-bold text-purple-500">12</span>
                </div>
                <div className="text-sm text-neutral-500">睡眠小时</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 即将到来的提醒 */}
        {upcomingReminders && upcomingReminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4 mb-4">
              <h3 className="text-lg font-semibold text-neutral-800 mb-3">即将到来</h3>
              <div className="space-y-3">
                {upcomingReminders.slice(0, 3).map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        reminder.type === 'VACCINE' ? 'bg-primary-100 text-primary-600' :
                        reminder.type === 'CHECKUP' ? 'bg-success-100 text-success-600' :
                        'bg-neutral-100 text-neutral-600'
                      }`}>
                        {reminder.type === 'VACCINE' ? <Syringe size={20} /> : 
                         reminder.type === 'CHECKUP' ? <Stethoscope size={20} /> :
                         <Bell size={20} />}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-800">{reminder.title}</div>
                        <div className="text-sm text-neutral-500">{reminder.date}</div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-neutral-400" />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* 快速功能入口 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-neutral-800 mb-3">快速功能</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.path}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  hover 
                  className="p-4 text-center cursor-pointer transition-all"
                  onClick={() => navigate(action.path)}
                >
                  <action.icon className={`w-8 h-8 mx-auto mb-2 ${
                    action.color === 'primary' ? 'text-primary-500' :
                    action.color === 'success' ? 'text-success-500' :
                    action.color === 'purple' ? 'text-purple-500' :
                    action.color === 'secondary' ? 'text-neutral-600' :
                    action.color === 'warning' ? 'text-yellow-500' :
                    'text-red-500'
                  }`} />
                  <div className="text-sm font-medium text-neutral-700">{action.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 统计数据 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">养宠数据</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-500">156</div>
                <div className="text-sm text-neutral-500">健康记录</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success-500">365</div>
                <div className="text-sm text-neutral-500">相伴天数</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500">5</div>
                <div className="text-sm text-neutral-500">就诊次数</div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function Syringe(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <path d="m15 11-6-6"/>
    </svg>
  );
}
