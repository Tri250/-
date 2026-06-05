/**
 * PawSync Pro 4.0 温暖治愈版
 * 首页完整功能展示 - 所有功能入口一览
 * 
 * 产品经理优化要点：
 * 1. 功能分类展示：核心功能、健康模块、AI智能、宠物管理、个人中心
 * 2. 功能发现区域：用户可以一览所有功能，快速找到需要的功能
 * 3. 视觉层次清晰：每个模块有独立色彩标识，卡片式布局
 * 4. 交互体验流畅：功能入口一键直达，减少操作层级
 */

import React, { useState, useMemo } from 'react';
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
  Shield,
  MessageCircle,
  Activity,
  BookOpen,
  FileText,
  TrendingUp,
  Video,
  Stethoscope,
  Umbrella,
  GraduationCap,
  Briefcase,
  Star,
  HelpCircle,
  Info,
  User,
  Grid3X3,
  Search,
} from 'lucide-react';
import { HealthScoreRing, generateDefaultHealthScore, HealthScoreData } from '../components/HealthScoreRing';
import { useAppStore } from '../store/appStore';
import { usePetStore } from '../store/petStore';
import { useReminderStore } from '../store/reminderStore';
import { cn } from '../lib/utils';

interface HomePageCompleteProps {
  onNavigate: (page: string) => void;
}

// ============================================================================
// 完整功能分类配置
// ============================================================================

const featureCategories = [
  {
    id: 'health',
    label: '健康管理',
    icon: Heart,
    color: 'secondary', // 薄荷绿
    description: '记录、分析、守护宠物健康',
    features: [
      { icon: FileText, label: '健康记录', page: 'health-records', desc: '体重、疫苗、体检记录' },
      { icon: Activity, label: '健康报告', page: 'health-report', desc: 'AI生成健康分析报告' },
      { icon: BookOpen, label: '健康手册', page: 'health-manual', desc: '60+篇专业养宠知识' },
      { icon: TrendingUp, label: '高级健康', page: 'advanced-health', desc: '数据可视化、趋势分析' },
      { icon: Stethoscope, label: '医疗记录', page: 'medical', desc: '就诊、用药、检查记录' },
      { icon: Umbrella, label: '保险服务', page: 'insurance', desc: '宠物保险推荐与管理' },
    ],
  },
  {
    id: 'ai',
    label: 'AI智能',
    icon: Bot,
    color: 'lavender', // 薰衣草紫
    description: 'AI驱动的智能功能',
    features: [
      { icon: Bot, label: 'AI健康顾问', page: 'ai-consultant', desc: '智能问诊、健康分析', highlight: true },
      { icon: MessageCircle, label: '情绪翻译', page: 'translator', desc: '语音+拍照识别宠物情绪', highlight: true },
      { icon: Sparkles, label: '情感纽带', page: 'bond-emotion', desc: '记忆墙、互动中心' },
      { icon: Video, label: '摄像头监控', page: 'camera-monitor', desc: '实时监控、远程互动' },
    ],
  },
  {
    id: 'pet',
    label: '宠物管理',
    icon: PawPrint,
    color: 'sakura', // 樱花粉
    description: '宠物档案与日常管理',
    features: [
      { icon: PawPrint, label: '宠物档案', page: 'pets', desc: '多宠物支持、详细信息' },
      { icon: Calendar, label: '智能提醒', page: 'reminders', desc: '疫苗、体检、喂药提醒' },
      { icon: GraduationCap, label: '训练记录', page: 'training', desc: '训练进度、技巧学习' },
      { icon: Briefcase, label: '服务预约', page: 'services', desc: '美容、医疗、寄养服务' },
    ],
  },
  {
    id: 'personal',
    label: '个人中心',
    icon: User,
    color: 'neutral', // 暖灰
    description: '设置与个人管理',
    features: [
      { icon: Settings, label: '设置', page: 'settings', desc: '主题、通知、数据管理' },
      { icon: Star, label: '收藏', page: 'favorites', desc: '收藏的健康手册、记录' },
      { icon: HelpCircle, label: '帮助反馈', page: 'help-feedback', desc: '使用指南、问题反馈' },
      { icon: Info, label: '关于我们', page: 'developer-info', desc: '开发者信息、版本' },
    ],
  },
];

// 快速记录配置
const quickRecordActions = [
  { icon: Syringe, label: '疫苗', page: 'health-records', color: 'bg-secondary-500' },
  { icon: Scale, label: '体重', page: 'health-records', color: 'bg-primary-500' },
  { icon: Pill, label: '喂药', page: 'health-records', color: 'bg-lavender-500' },
  { icon: MessageCircle, label: '心情', page: 'translator', color: 'bg-sakura-500' },
];

// ============================================================================
// 首页完整功能展示组件
// ============================================================================

export const HomePageComplete: React.FC<HomePageCompleteProps> = ({ onNavigate }) => {
  const { currentPet, settings } = useAppStore();
  const { pets, currentPetId } = usePetStore();
  const { getUpcomingReminders } = useReminderStore();
  
  const [healthScoreData] = useState<HealthScoreData>(generateDefaultHealthScore());
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  
  const activePet = currentPet || pets.find(p => p.id === currentPetId);
  const upcomingReminders = currentPetId ? getUpcomingReminders(currentPetId, 3) : [];

  // 问候语
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }, []);

  // 今日宠物状态
  const todayStatus = useMemo(() => ({
    mood: 'happy',
    moodLabel: '开心',
    moodEmoji: '😸',
    healthLevel: 'excellent',
    streakDays: 5,
    nextReminder: upcomingReminders[0]?.title || '无待办提醒',
  }), [upcomingReminders]);

  // 获取颜色类名
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
      secondary: { bg: 'bg-secondary-50', text: 'text-secondary-600', border: 'border-secondary-200', gradient: 'from-secondary-400 to-secondary-500' },
      lavender: { bg: 'bg-lavender-50', text: 'text-lavender-600', border: 'border-lavender-200', gradient: 'from-lavender-400 to-lavender-500' },
      sakura: { bg: 'bg-sakura-50', text: 'text-sakura-600', border: 'border-sakura-200', gradient: 'from-sakura-400 to-sakura-500' },
      primary: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200', gradient: 'from-primary-400 to-primary-500' },
      neutral: { bg: 'bg-neutral-50', text: 'text-neutral-600', border: 'border-neutral-200', gradient: 'from-neutral-400 to-neutral-500' },
    };
    return colors[color] || colors.neutral;
  };

  return (
    <div className={cn(
      'min-h-screen pb-20 overflow-y-auto',
      settings.darkMode ? 'bg-neutral-900' : 'bg-gradient-to-b from-neutral-50 via-primary-50/20 to-secondary-50/10'
    )}>
      
      {/* ================================================================
          第一区域：今日宠物状态 + 健康评分
          ================================================================ */}
      
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-4"
      >
        {/* 顶部问候 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('pets')}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-500 shadow-lg shadow-primary-500/20 flex items-center justify-center cursor-pointer"
            >
              <span className="text-2xl">{todayStatus.moodEmoji}</span>
            </motion.div>
            <div>
              <p className="text-sm text-neutral-500">{greeting}</p>
              <h1 className="text-lg font-bold text-neutral-800">
                {activePet?.name || '小橘'}
                <span className="text-xs ml-2 text-primary-500">· {todayStatus.moodLabel}</span>
              </h1>
            </div>
          </div>
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
          className="rounded-2xl p-4 mb-4 bg-gradient-to-br from-white/90 to-primary-50/50 border border-primary-100 shadow-card"
        >
          {/* 状态网格 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl p-3 text-center bg-sakura-50">
              <span className="text-2xl mb-1">{todayStatus.moodEmoji}</span>
              <p className="text-xs text-neutral-600">{todayStatus.moodLabel}</p>
              <p className="text-xs text-neutral-400">心情</p>
            </div>
            <div className="rounded-xl p-3 text-center bg-secondary-50">
              <Shield className="w-6 h-6 mx-auto mb-1 text-secondary-500" />
              <p className="text-xs font-medium text-secondary-600">{todayStatus.healthLevel === 'excellent' ? '极佳' : '良好'}</p>
              <p className="text-xs text-neutral-400">健康</p>
            </div>
            <div className="rounded-xl p-3 text-center bg-primary-50">
              {todayStatus.streakDays >= 3 ? (
                <Flame className="w-6 h-6 mx-auto mb-1 text-primary-500 animate-fire-pulse" />
              ) : (
                <Activity className="w-6 h-6 mx-auto mb-1 text-neutral-400" />
              )}
              <p className="text-xs font-medium text-primary-600">{todayStatus.streakDays}天</p>
              <p className="text-xs text-neutral-400">连续</p>
            </div>
          </div>
          
          {/* 健康评分圆环 */}
          <div className="flex justify-center py-2">
            <HealthScoreRing
              data={healthScoreData}
              size="sm"
              showDetails={false}
              onNavigate={onNavigate}
            />
          </div>
          
          {/* 下一步提醒 */}
          <button
            onClick={() => onNavigate('reminders')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary-50 border border-secondary-100 hover:bg-secondary-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-secondary-500" />
              <span className="text-sm text-neutral-600">下一步</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-secondary-600">{todayStatus.nextReminder}</span>
              <ChevronRight className="w-4 h-4 text-secondary-400" />
            </div>
          </button>
        </motion.div>
      </motion.section>

      {/* ================================================================
          第二区域：快速记录 + AI核心入口
          ================================================================ */}
      
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4 mb-4"
      >
        {/* 快速记录 */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-white/90 to-primary-50/30 border border-primary-100 shadow-card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-5 h-5 text-primary-500" />
            <span className="text-base font-semibold text-neutral-700">快速记录</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {quickRecordActions.map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(action.page)}
                className={cn('flex flex-col items-center gap-2 p-3 rounded-xl transition-all', action.color, 'shadow-soft')}
              >
                <action.icon className="w-5 h-5 text-white" />
                <span className="text-xs text-white font-medium">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* AI核心入口 */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('ai-consultant')}
            className="rounded-2xl p-4 text-left bg-gradient-to-br from-lavender-400 to-lavender-500 shadow-lg shadow-lavender-500/20"
          >
            <Bot className="w-8 h-8 text-white mb-2" />
            <h3 className="text-base font-semibold text-white">AI顾问</h3>
            <p className="text-xs text-white/80 mt-1">智能问诊咨询</p>
            <div className="flex items-center gap-1 mt-2">
              <Sparkles className="w-3 h-3 text-white/60" />
              <span className="text-xs text-white/60">95%+准确率</span>
            </div>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('translator')}
            className="rounded-2xl p-4 text-left bg-gradient-to-br from-primary-400 to-primary-500 shadow-lg shadow-primary-500/20"
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
          第三区域：功能发现 - 所有功能一览
          ================================================================ */}
      
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 mb-4"
      >
        {/* 功能发现标题 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-neutral-500" />
            <span className="text-base font-semibold text-neutral-700">功能发现</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-600">
              {featureCategories.reduce((sum, cat) => sum + cat.features.length, 0)}个功能
            </span>
          </div>
          <button
            onClick={() => setShowAllFeatures(!showAllFeatures)}
            className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
          >
            {showAllFeatures ? '收起' : '展开全部'}
            <ChevronRight className={cn('w-4 h-4 transition-transform', showAllFeatures && 'rotate-90')} />
          </button>
        </div>

        {/* 功能分类卡片 */}
        <div className="space-y-4">
          {featureCategories.map((category, categoryIndex) => {
            const colorClasses = getColorClasses(category.color);
            const isExpanded = expandedCategory === category.id || showAllFeatures;
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * categoryIndex }}
                className={cn(
                  'rounded-2xl overflow-hidden',
                  'bg-gradient-to-br from-white/90',
                  colorClasses.bg,
                  'border',
                  colorClasses.border,
                  'shadow-card'
                )}
              >
                {/* 分类标题 */}
                <button
                  onClick={() => setExpandedCategory(isExpanded && !showAllFeatures ? null : category.id)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorClasses.bg)}>
                      <category.icon className={cn('w-5 h-5', colorClasses.text)} />
                    </div>
                    <div>
                      <h3 className={cn('text-sm font-semibold', colorClasses.text)}>{category.label}</h3>
                      <p className="text-xs text-neutral-400">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">{category.features.length}个</span>
                    <ChevronRight className={cn('w-4 h-4 text-neutral-400 transition-transform', isExpanded && 'rotate-90')} />
                  </div>
                </button>

                {/* 功能列表 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {category.features.map((feature, featureIndex) => (
                          <motion.button
                            key={feature.page}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * featureIndex }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onNavigate(feature.page)}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-xl',
                              'bg-white/60 hover:bg-white/80 transition-colors',
                              feature.highlight && 'ring-2 ring-offset-1',
                              feature.highlight && colorClasses.border
                            )}
                          >
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colorClasses.bg)}>
                              <feature.icon className={cn('w-4 h-4', colorClasses.text)} />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-neutral-700">{feature.label}</p>
                              <p className="text-xs text-neutral-400">{feature.desc}</p>
                            </div>
                            {feature.highlight && (
                              <Sparkles className={cn('w-4 h-4', colorClasses.text)} />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ================================================================
          第四区域：今日提醒（精简展示）
          ================================================================ */}
      
      {upcomingReminders.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-4 mb-4"
        >
          <div className="rounded-2xl p-4 bg-gradient-to-br from-white/90 to-cream-50/30 border border-cream-100 shadow-card">
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
            
            <div className="space-y-2">
              {upcomingReminders.slice(0, 3).map((reminder, index) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => onNavigate('reminders')}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/60 hover:bg-white/80 transition-colors cursor-pointer"
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', index === 0 ? 'bg-primary-100' : 'bg-neutral-100')}>
                    <Calendar className={cn('w-5 h-5', index === 0 ? 'text-primary-500' : 'text-neutral-400')} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-700">{reminder.title}</p>
                    <p className="text-xs text-neutral-400">{reminder.time || '今天'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* ================================================================
          第五区域：快捷入口（宠物档案、设置）
          ================================================================ */}
      
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 mb-6"
      >
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('pets')}
            className="rounded-2xl p-4 flex items-center gap-3 bg-white/80 hover:bg-white transition-colors border border-neutral-100 shadow-soft"
          >
            <div className="w-10 h-10 rounded-xl bg-sakura-100 flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-sakura-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700">宠物档案</p>
              <p className="text-xs text-neutral-400">{pets.length}只宠物</p>
            </div>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('profile')}
            className="rounded-2xl p-4 flex items-center gap-3 bg-white/80 hover:bg-white transition-colors border border-neutral-100 shadow-soft"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
              <User className="w-5 h-5 text-neutral-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700">个人中心</p>
              <p className="text-xs text-neutral-400">设置与收藏</p>
            </div>
          </motion.button>
        </div>
      </motion.section>

      {/* 底部间距 */}
      <div className="h-4" />
    </div>
  );
};

export default HomePageComplete;