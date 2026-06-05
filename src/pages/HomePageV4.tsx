/**
 * PawSync Pro 4.0 温暖治愈版
 * 首页重构 - 时间线卡片流 + 健康评分圆环
 * 
 * 设计理念：朋友圈式动态卡片流，温暖治愈的双主色系统
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PawPrint,
  Heart,
  Bot,
  Camera,
  Calendar,
  Sparkles,
  Plus,
  Bell,
  TrendingUp,
  ChevronRight,
  Settings,
  Share2,
  Syringe,
  Scale,
  Pill,
  Award,
  Flame,
  RefreshCw,
} from 'lucide-react';
import { PetTimelineCard, PetTimeline, PetTimelineRecord } from '../components/PetTimelineCard';
import { HealthScoreRing, generateDefaultHealthScore, HealthScoreData } from '../components/HealthScoreRing';
import { useAppStore } from '../store/appStore';
import { usePetStore } from '../store/petStore';
import { useReminderStore } from '../store/reminderStore';
import { useHealthRecordStore } from '../store/healthRecordStore';
import { cn } from '../lib/utils';

interface HomePageV4Props {
  onNavigate: (page: string) => void;
}

// ============================================================================
// 快速记录按钮配置
// ============================================================================

const quickRecordActions = [
  { icon: Syringe, label: '疫苗', color: 'bg-secondary-500', page: 'health-records' },
  { icon: Scale, label: '体重', color: 'bg-primary-500', page: 'health-records' },
  { icon: Pill, label: '喂药', color: 'bg-lavender-500', page: 'health-records' },
  { icon: Camera, label: '拍照', color: 'bg-sky-500', page: 'translator' },
  { icon: PawPrint, label: '心情', color: 'bg-sakura-500', page: 'translator' },
];

// ============================================================================
// 首页组件
// ============================================================================

export const HomePageV4: React.FC<HomePageV4Props> = ({ onNavigate }) => {
  const { currentPet, settings } = useAppStore();
  const { pets, currentPetId, setCurrentPet } = usePetStore();
  const { getUpcomingReminders } = useReminderStore();
  const { getFilteredRecords } = useHealthRecordStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQuickRecord, setShowQuickRecord] = useState(false);
  const [healthScoreData] = useState<HealthScoreData>(generateDefaultHealthScore());
  
  // 获取当前宠物
  const activePet = currentPet || pets.find(p => p.id === currentPetId);
  
  // 获取即将到来的提醒
  const upcomingReminders = currentPetId ? getUpcomingReminders(currentPetId, 5) : [];
  
  // 获取最近的健康记录
  const recentRecords = currentPetId ? getFilteredRecords(currentPetId).slice(0, 10) : [];

  // 生成时间线记录数据
  const timelineRecords: PetTimelineRecord[] = useMemo(() => {
    // 模拟数据（后续从真实数据转换）
    const mockRecords: PetTimelineRecord[] = [
      {
        id: '1',
        petId: currentPetId || 'default',
        petName: activePet?.name || '小橘',
        petType: 'cat',
        type: 'vaccine',
        title: '疫苗接种',
        description: '完成了狂犬疫苗接种，小家伙很勇敢！',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
        celebration: true,
        streak: 5,
      },
      {
        id: '2',
        petId: currentPetId || 'default',
        petName: activePet?.name || '小橘',
        petType: 'cat',
        type: 'weight',
        title: '体重记录',
        description: '本月长了0.3kg，体重趋势稳定～',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
        data: { change: 0.3 },
        streak: 3,
      },
      {
        id: '3',
        petId: currentPetId || 'default',
        petName: activePet?.name || '小橘',
        petType: 'cat',
        type: 'ai_report',
        title: 'AI健康周报',
        description: '本周健康评分85分，建议增加运动量，保持良好饮食习惯。',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
      },
      {
        id: '4',
        petId: currentPetId || 'default',
        petName: activePet?.name || '小橘',
        petType: 'cat',
        type: 'milestone',
        title: '成长里程碑',
        description: '🎉 小橘今天满2岁了！祝小橘生日快乐！',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5天前
        celebration: true,
      },
      {
        id: '5',
        petId: currentPetId || 'default',
        petName: activePet?.name || '小橘',
        petType: 'cat',
        type: 'medication',
        title: '喂药记录',
        description: '按时服用了驱虫药，很配合呢！',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
      },
    ];
    
    return mockRecords;
  }, [currentPetId, activePet]);

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  }, []);

  // 分享记录
  const handleShare = useCallback((record: PetTimelineRecord) => {
    console.log('分享记录:', record);
    // TODO: 实现分享功能
  }, []);

  // 收藏记录
  const handleBookmark = useCallback((record: PetTimelineRecord) => {
    console.log('收藏记录:', record);
    // TODO: 实现收藏功能
  }, []);

  return (
    <div className={cn(
      'min-h-screen pb-24 overflow-y-auto',
      settings.darkMode ? 'bg-neutral-900' : 'bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50'
    )}>
      {/* 头部区域 */}
      <header className="relative overflow-hidden">
        {/* 温暖渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400" />
        
        {/* 装饰性光晕 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/4 animate-float" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary-300/30 rounded-full translate-y-1/2 -translate-x-1/4 animate-float" style={{ animationDelay: '1s' }} />
        
        {/* 内容 */}
        <div className="max-w-md mx-auto px-4 pt-6 pb-20 relative z-10">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <PawPrint className="w-5 h-5 text-white" />
                </div>
                PawSync Pro
              </h1>
              <p className="text-xs text-white/80 mt-1 ml-10">爪印同频 · 温暖守护</p>
            </div>
            
            {/* 设置按钮 */}
            <button
              onClick={() => onNavigate('settings')}
              className="p-2 rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {/* 宠物选择器 */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => setCurrentPet(pet.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl transition-all backdrop-blur-sm',
                  pet.id === currentPetId
                    ? 'bg-white/30 border border-white/40 shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 border border-transparent'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  pet.type === 'dog' ? 'bg-primary-100 text-primary-600' :
                  pet.type === 'cat' ? 'bg-lavender-100 text-lavender-600' :
                  'bg-secondary-100 text-secondary-600'
                )}>
                  {pet.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-white">{pet.name}</span>
              </button>
            ))}
            
            {/* 添加宠物 */}
            <button
              onClick={() => onNavigate('pets')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Plus className="w-5 h-5 text-white/80" />
              <span className="text-sm text-white/80">添加</span>
            </button>
          </div>
          
          {/* 健康评分圆环 */}
          <div className="flex justify-center">
            <div className="glass-card rounded-2xl p-6">
              <HealthScoreRing
                data={healthScoreData}
                size="md"
                showDetails={false}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-md mx-auto px-4 -mt-8 relative z-20">
        {/* 快速记录按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-neutral-700">快速记录</span>
            <button
              onClick={() => setShowQuickRecord(!showQuickRecord)}
              className="text-xs text-primary-500 hover:text-primary-600"
            >
              {showQuickRecord ? '收起' : '展开'}
            </button>
          </div>
          
          <AnimatePresence>
            {showQuickRecord && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-3 overflow-x-auto pb-2"
              >
                {quickRecordActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => onNavigate(action.page)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl transition-transform hover:scale-105 active:scale-95',
                      action.color
                    )}
                  >
                    <action.icon className="w-5 h-5 text-white" />
                    <span className="text-xs text-white font-medium">{action.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 默认显示的主要入口 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('ai-consultant')}
              className="ai-btn flex items-center gap-2"
            >
              <Bot className="w-5 h-5" />
              <span>AI健康顾问</span>
            </button>
            <button
              onClick={() => onNavigate('translator')}
              className="quick-record-btn flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>情绪翻译</span>
            </button>
          </div>
        </motion.div>

        {/* 今日提醒 */}
        {upcomingReminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-mint rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-secondary-500" />
                <span className="text-sm font-semibold text-neutral-700">今日提醒</span>
              </div>
              <button
                onClick={() => onNavigate('reminders')}
                className="text-xs text-secondary-500 hover:text-secondary-600 flex items-center gap-1"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {upcomingReminders.slice(0, 3).map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center gap-3 p-2 rounded-xl bg-white/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-secondary-500" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-neutral-700">{reminder.title}</span>
                    <span className="text-xs text-neutral-400 ml-2">
                      {reminder.time || '今天'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 宠物动态时间线 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-500" />
              <span className="text-lg font-semibold text-neutral-700">宠物动态</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
              {isRefreshing ? '刷新中...' : '刷新'}
            </button>
          </div>
          
          {/* 时间线卡片流 */}
          <PetTimeline
            records={timelineRecords}
            onNavigate={onNavigate}
            onShare={handleShare}
            onBookmark={handleBookmark}
            showStreak={true}
          />
          
          {/* 加载更多 */}
          <button
            onClick={() => onNavigate('health-records')}
            className="w-full py-4 text-center text-sm text-primary-500 hover:text-primary-600 flex items-center justify-center gap-2"
          >
            查看更多记录
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* 功能模块入口 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-4 gap-3 mt-6"
        >
          {[
            { icon: Heart, label: '健康', page: 'health', color: 'text-secondary-500' },
            { icon: Bot, label: 'AI', page: 'ai-consultant', color: 'text-lavender-500' },
            { icon: Calendar, label: '提醒', page: 'reminders', color: 'text-cream-500' },
            { icon: PawPrint, label: '档案', page: 'pets', color: 'text-primary-500' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.page)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/80 hover:bg-white transition-colors shadow-soft"
            >
              <item.icon className={cn('w-6 h-6', item.color)} />
              <span className="text-xs text-neutral-600">{item.label}</span>
            </button>
          ))}
        </motion.div>
      </main>
    </div>
  );
};

export default HomePageV4;