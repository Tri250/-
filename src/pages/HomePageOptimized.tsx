/**
 * PawSync Pro 4.0 温暖治愈版
 * 首页专家级优化 - 信息架构重构 + 视觉层次优化
 * 
 * 产品经理优化要点：
 * 1. 信息架构：今日·宠物动态 → 健康·数据看板 → AI·智能伙伴 → 我的·宠物档案
 * 2. 视觉层次：健康评分圆环作为第一视觉焦点，时间线作为第二焦点
 * 3. 交互体验：核心功能一键直达，快速记录始终可见
 * 4. 布局结构：卡片式布局，每个模块独立成卡，减少信息密度
 * 5. 颜色搭配：暖橙(关爱) + 薄荷绿(健康) + 薰衣草紫(AI) + 樱花粉(个人)
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  ChevronRight,
  Settings,
  Syringe,
  Scale,
  Pill,
  Flame,
  Sun,
  Moon,
  Activity,
  Shield,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';
import { HealthScoreRing, generateDefaultHealthScore, HealthScoreData } from '../components/HealthScoreRing';
import { useAppStore } from '../store/appStore';
import { usePetStore } from '../store/petStore';
import { useReminderStore } from '../store/reminderStore';
import { cn } from '../lib/utils';

interface HomePageOptimizedProps {
  onNavigate: (page: string) => void;
}

// ============================================================================
// 专家级优化：色彩层级系统
// ============================================================================

// 主色层级：暖橙(关爱/温暖) - 用于情感化内容、快速操作
const PRIMARY_COLORS = {
  bg: 'bg-primary-50',
  card: 'bg-primary-100/80',
  text: 'text-primary-600',
  border: 'border-primary-200',
  gradient: 'from-primary-400 to-primary-500',
};

// 健康层级：薄荷绿(健康/专业) - 用于健康数据、评分
const HEALTH_COLORS = {
  bg: 'bg-secondary-50',
  card: 'bg-secondary-100/80',
  text: 'text-secondary-600',
  border: 'border-secondary-200',
  gradient: 'from-secondary-400 to-secondary-500',
};

// AI层级：薰衣草紫(智能/神秘) - 用于AI功能、智能推荐
const AI_COLORS = {
  bg: 'bg-lavender-50',
  card: 'bg-lavender-100/80',
  text: 'text-lavender-600',
  border: 'border-lavender-200',
  gradient: 'from-lavender-400 to-lavender-500',
};

// 个人层级：樱花粉(可爱/温柔) - 用于个人中心、宠物档案
const PERSONAL_COLORS = {
  bg: 'bg-sakura-50',
  card: 'bg-sakura-100/80',
  text: 'text-sakura-600',
  border: 'border-sakura-200',
  gradient: 'from-sakura-400 to-sakura-500',
};

// ============================================================================
// 专家级优化：快速记录配置（简化为4个核心入口）
// ============================================================================

const quickRecordActions = [
  { 
    icon: Syringe, 
    label: '疫苗', 
    sublabel: '接种记录',
    colors: HEALTH_COLORS,
    page: 'health-records',
    recordType: 'vaccine',
  },
  { 
    icon: Scale, 
    label: '体重', 
    sublabel: '今日测量',
    colors: PRIMARY_COLORS,
    page: 'health-records',
    recordType: 'weight',
  },
  { 
    icon: Pill, 
    label: '喂药', 
    sublabel: '用药记录',
    colors: AI_COLORS,
    page: 'health-records',
    recordType: 'medication',
  },
  { 
    icon: MessageCircle, 
    label: '心情', 
    sublabel: '情绪记录',
    colors: PERSONAL_COLORS,
    page: 'translator',
    recordType: 'mood',
  },
];

// ============================================================================
// 专家级优化：首页组件
// ============================================================================

export const HomePageOptimized: React.FC<HomePageOptimizedProps> = ({ onNavigate }) => {
  const { currentPet, settings } = useAppStore();
  const { pets, currentPetId, setCurrentPet } = usePetStore();
  const { getUpcomingReminders } = useReminderStore();
  
  const [healthScoreData] = useState<HealthScoreData>(generateDefaultHealthScore());
  const [selectedQuickRecord, setSelectedQuickRecord] = useState<string | null>(null);
  
  // 获取当前宠物
  const activePet = currentPet || pets.find(p => p.id === currentPetId);
  
  // 获取即将到来的提醒
  const upcomingReminders = currentPetId ? getUpcomingReminders(currentPetId, 3) : [];

  // 模拟今日宠物状态
  const todayPetStatus = useMemo(() => ({
    mood: 'happy',
    moodLabel: '开心',
    moodEmoji: '😸',
    healthLevel: 'excellent',
    healthLabel: '极佳',
    streakDays: 5,
    lastRecordTime: '2小时前',
    nextReminder: upcomingReminders[0]?.title || '无待办提醒',
  }), [upcomingReminders]);

  // 格式化问候语
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }, []);

  return (
    <div className={cn(
      'min-h-screen pb-20 overflow-y-auto',
      settings.darkMode 
        ? 'bg-neutral-900' 
        : 'bg-gradient-to-b from-neutral-50 via-primary-50/30 to-secondary-50/20'
    )}>
      
      {/* ================================================================
          第一视觉焦点：今日宠物状态卡片
          设计理念：一眼看到宠物今日状态，建立情感连接
          ================================================================ */}
      
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4"
      >
        {/* 顶部问候 + 宠物选择 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* 宠物头像 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('pets')}
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer',
                'bg-gradient-to-br from-primary-400 to-primary-500',
                'shadow-lg shadow-primary-500/20'
              )}
            >
              <span className="text-2xl">{todayPetStatus.moodEmoji}</span>
            </motion.div>
            
            {/* 问候语 + 宠物名 */}
            <div>
              <p className="text-sm text-neutral-500">{greeting}</p>
              <h1 className="text-lg font-bold text-neutral-800">
                {activePet?.name || '小橘'}
                <span className="text-xs ml-2 text-primary-500">· {todayPetStatus.moodLabel}</span>
              </h1>
            </div>
          </div>
          
          {/* 设置入口 */}
          <button
            onClick={() => onNavigate('settings')}
            className="p-2.5 rounded-xl bg-white/80 hover:bg-white transition-colors shadow-soft"
          >
            <Settings className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* 今日状态卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'rounded-2xl p-4 mb-4',
            'bg-gradient-to-br from-white/90 to-primary-50/50',
            'border border-primary-100',
            'shadow-card'
          )}
        >
          {/* 状态网格 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* 心情状态 */}
            <div className={cn(
              'rounded-xl p-3 text-center',
              PERSONAL_COLORS.bg
            )}>
              <span className="text-2xl mb-1">{todayPetStatus.moodEmoji}</span>
              <p className="text-xs text-neutral-600">{todayPetStatus.moodLabel}</p>
              <p className="text-xs text-neutral-400">心情</p>
            </div>
            
            {/* 健康状态 */}
            <div className={cn(
              'rounded-xl p-3 text-center',
              HEALTH_COLORS.bg
            )}>
              <Shield className="w-6 h-6 mx-auto mb-1 text-secondary-500" />
              <p className="text-xs font-medium text-secondary-600">{todayPetStatus.healthLabel}</p>
              <p className="text-xs text-neutral-400">健康</p>
            </div>
            
            {/* 连续记录 */}
            <div className={cn(
              'rounded-xl p-3 text-center',
              todayPetStatus.streakDays >= 3 ? 'bg-primary-50' : 'bg-neutral-50'
            )}>
              {todayPetStatus.streakDays >= 3 ? (
                <Flame className="w-6 h-6 mx-auto mb-1 text-primary-500 animate-fire-pulse" />
              ) : (
                <Activity className="w-6 h-6 mx-auto mb-1 text-neutral-400" />
              )}
              <p className="text-xs font-medium text-primary-600">{todayPetStatus.streakDays}天</p>
              <p className="text-xs text-neutral-400">连续</p>
            </div>
          </div>
          
          {/* 下一步提醒 */}
          <div className={cn(
            'flex items-center justify-between p-3 rounded-xl',
            'bg-secondary-50 border border-secondary-100'
          )}>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-secondary-500" />
              <span className="text-sm text-neutral-600">下一步</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-secondary-600">
                {todayPetStatus.nextReminder}
              </span>
              <ChevronRight className="w-4 h-4 text-secondary-400" />
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ================================================================
          第二视觉焦点：健康评分圆环
          设计理念：游戏化健康评分，像信用分一样直观
          ================================================================ */}
      
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4 mb-4"
      >
        <div className={cn(
          'rounded-2xl p-6',
          'bg-gradient-to-br from-white/95 to-secondary-50/30',
          'border border-secondary-100',
          'shadow-card'
        )}>
          {/* 标题 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-secondary-500" />
              <span className="text-base font-semibold text-neutral-700">健康评分</span>
            </div>
            <button
              onClick={() => onNavigate('health-report')}
              className="text-xs text-secondary-500 hover:text-secondary-600 flex items-center gap-1"
            >
              详细报告
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* 圆环 */}
          <div className="flex justify-center">
            <HealthScoreRing
              data={healthScoreData}
              size="md"
              showDetails={false}
              onNavigate={onNavigate}
            />
          </div>
          
          {/* 快捷维度入口 */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {[
              { icon: Shield, label: '疫苗', score: 85, color: 'text-secondary-500' },
              { icon: Activity, label: '体检', score: 70, color: 'text-primary-500' },
              { icon: Scale, label: '体重', score: 90, color: 'text-lavender-500' },
              { icon: Calendar, label: '记录', score: 60, color: 'text-cream-500' },
              { icon: Sparkles, label: 'AI', score: 95, color: 'text-sakura-500' },
            ].map((dim) => (
              <button
                key={dim.label}
                onClick={() => onNavigate('health-report')}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/50 hover:bg-white transition-colors"
              >
                <dim.icon className={cn('w-4 h-4', dim.color)} />
                <span className="text-xs font-medium text-neutral-600">{dim.score}</span>
                <span className="text-xs text-neutral-400">{dim.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ================================================================
          第三视觉焦点：快速记录（始终可见，一键直达）
          设计理念：减少操作层级，核心功能一键直达
          ================================================================ */}
      
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 mb-4"
      >
        <div className={cn(
          'rounded-2xl p-4',
          'bg-gradient-to-br from-white/90 to-primary-50/30',
          'border border-primary-100',
          'shadow-card'
        )}>
          {/* 标题 */}
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-5 h-5 text-primary-500" />
            <span className="text-base font-semibold text-neutral-700">快速记录</span>
            <span className="text-xs text-neutral-400 ml-auto">一键直达</span>
          </div>
          
          {/* 4个核心入口 */}
          <div className="grid grid-cols-4 gap-3">
            {quickRecordActions.map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(action.page)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                  'bg-gradient-to-br',
                  action.colors.gradient,
                  'shadow-soft'
                )}
              >
                <action.icon className="w-5 h-5 text-white" />
                <span className="text-xs text-white font-medium">{action.label}</span>
                <span className="text-xs text-white/70">{action.sublabel}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ================================================================
          第四视觉焦点：AI智能入口
          设计理念：突出AI差异化功能，引导用户使用
          ================================================================ */}
      
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-4 mb-4"
      >
        <div className="grid grid-cols-2 gap-3">
          {/* AI健康顾问 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('ai-consultant')}
            className={cn(
              'rounded-2xl p-4 text-left',
              'bg-gradient-to-br from-lavender-400 to-lavender-500',
              'shadow-lg shadow-lavender-500/20'
            )}
          >
            <Bot className="w-8 h-8 text-white mb-2" />
            <h3 className="text-base font-semibold text-white">AI顾问</h3>
            <p className="text-xs text-white/80 mt-1">智能问诊咨询</p>
            <div className="flex items-center gap-1 mt-2">
              <Sparkles className="w-3 h-3 text-white/60" />
              <span className="text-xs text-white/60">95%+准确率</span>
            </div>
          </motion.button>
          
          {/* 情绪翻译 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('translator')}
            className={cn(
              'rounded-2xl p-4 text-left',
              'bg-gradient-to-br from-primary-400 to-primary-500',
              'shadow-lg shadow-primary-500/20'
            )}
          >
            <MessageCircle className="w-8 h-8 text-white mb-2" />
            <h3 className="text-base font-semibold text-white">情绪翻译</h3>
            <p className="text-xs text-white/80 mt-1">读懂宠物心声</p>
            <div className="flex items-center gap-1 mt-2">
              <Heart className="w-3 h-3 text-white/60" />
              <span className="text-xs text-white/60">语音+拍照</span>
            </div>
          </motion.button>
        </div>
      </motion.section>

      {/* ================================================================
          第五视觉焦点：今日提醒（精简展示）
          设计理念：只展示最重要的提醒，避免信息过载
          ================================================================ */}
      
      {upcomingReminders.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="px-4 mb-4"
        >
          <div className={cn(
            'rounded-2xl p-4',
            'bg-gradient-to-br from-white/90 to-cream-50/30',
            'border border-cream-100',
            'shadow-card'
          )}>
            {/* 标题 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-cream-500" />
                <span className="text-base font-semibold text-neutral-700">今日提醒</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cream-100 text-cream-600">
                  {upcomingReminders.length}条
                </span>
              </div>
              <button
                onClick={() => onNavigate('reminders')}
                className="text-xs text-cream-500 hover:text-cream-600 flex items-center gap-1"
              >
                全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* 提醒列表（最多3条） */}
            <div className="space-y-2">
              {upcomingReminders.slice(0, 3).map((reminder, index) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl',
                    'bg-white/60 hover:bg-white/80 transition-colors cursor-pointer'
                  )}
                  onClick={() => onNavigate('reminders')}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    index === 0 ? 'bg-primary-100' : 'bg-neutral-100'
                  )}>
                    <Calendar className={cn(
                      'w-5 h-5',
                      index === 0 ? 'text-primary-500' : 'text-neutral-400'
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-700">{reminder.title}</p>
                    <p className="text-xs text-neutral-400">
                      {reminder.time || '今天'} · {reminder.type || '提醒'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* ================================================================
          底部功能入口（精简为2个）
          设计理念：减少底部入口，避免与导航栏重复
          ================================================================ */}
      
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-4 mb-6"
      >
        <div className="grid grid-cols-2 gap-3">
          {/* 健康记录 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('health-records')}
            className={cn(
              'rounded-2xl p-4 flex items-center gap-3',
              'bg-white/80 hover:bg-white transition-colors',
              'border border-neutral-100',
              'shadow-soft'
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-secondary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700">健康记录</p>
              <p className="text-xs text-neutral-400">完整记录历史</p>
            </div>
          </motion.button>
          
          {/* 宠物档案 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('pets')}
            className={cn(
              'rounded-2xl p-4 flex items-center gap-3',
              'bg-white/80 hover:bg-white transition-colors',
              'border border-neutral-100',
              'shadow-soft'
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-sakura-100 flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-sakura-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700">宠物档案</p>
              <p className="text-xs text-neutral-400">管理宠物信息</p>
            </div>
          </motion.button>
        </div>
      </motion.section>

      {/* ================================================================
          底部间距（适配导航栏）
          ================================================================ */}
      
      <div className="h-4" />
    </div>
  );
};

export default HomePageOptimized;