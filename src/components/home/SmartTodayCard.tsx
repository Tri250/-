// ============================================
// Smart Today Card - 智能今日卡片
// 根据时间/场景动态展示不同内容
// ============================================

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, 
  Moon, 
  CloudSun, 
  Heart, 
  Activity,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useBondStore } from '../../store/bondStore';
import { useReminderStore } from '../../store/reminderStore';
import { GlassCard } from '../DesignSystem';

interface SmartTodayCardProps {
  onNavigate: (page: string) => void;
}

type TimeSlot = 'morning' | 'day' | 'evening' | 'night';

interface CardContent {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  action: string;
  targetPage: string;
  gradient: string;
  bgGradient: string;
}

export const SmartTodayCard: React.FC<SmartTodayCardProps> = ({ onNavigate }) => {
  const { currentPet, currentEmotion, healthScore } = useAppStore();
  const { metrics, streakDays } = useBondStore();
  const { getUpcomingReminders } = useReminderStore();
  
  const currentPetId = currentPet?.id;
  const upcomingReminders = currentPetId ? getUpcomingReminders(currentPetId, 1) : [];

  // 获取当前时间段
  const getTimeSlot = (): TimeSlot => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 17) return 'day';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  };

  const timeSlot = getTimeSlot();

  // 根据时间段和状态生成卡片内容
  const cardContent = useMemo<CardContent>(() => {
    const petName = currentPet?.name || '毛孩子';
    
    // 优先显示紧急提醒
    if (upcomingReminders.length > 0) {
      const reminder = upcomingReminders[0];
      return {
        icon: Sparkles,
        title: `今日提醒`,
        subtitle: reminder.title,
        action: '查看详情',
        targetPage: 'reminders',
        gradient: 'from-amber-500 to-orange-500',
        bgGradient: 'from-amber-50 to-orange-50',
      };
    }

    switch (timeSlot) {
      case 'morning':
        return {
          icon: Sun,
          title: `早安，${petName}醒了`,
          subtitle: healthScore >= 80 
            ? '今天状态很棒，记得记录晨间活动' 
            : '今天需要多关注健康状况',
          action: '记录晨检',
          targetPage: 'health-records',
          gradient: 'from-orange-500 to-amber-500',
          bgGradient: 'from-orange-50 to-amber-50',
        };
      
      case 'day':
        return {
          icon: CloudSun,
          title: `${petName}的下午时光`,
          subtitle: metrics.overall >= 70 
            ? '亲密度持续提升，互动很成功' 
            : '今天还没怎么互动呢，去陪陪TA吧',
          action: '实时互动',
          targetPage: 'camera-monitor',
          gradient: 'from-blue-500 to-cyan-500',
          bgGradient: 'from-blue-50 to-cyan-50',
        };
      
      case 'evening':
        return {
          icon: Heart,
          title: `今晚${petName}的情绪`,
          subtitle: currentEmotion 
            ? `今天${petName}${getEmotionLabel(currentEmotion)}，记得晚安互动`
            : '晚上是情感交流的好时光',
          action: '情感连接',
          targetPage: 'bond-emotion',
          gradient: 'from-pink-500 to-rose-500',
          bgGradient: 'from-pink-50 to-rose-50',
        };
      
      case 'night':
        return {
          icon: Moon,
          title: '晚安，好梦',
          subtitle: streakDays > 0 
            ? `已连续陪伴 ${streakDays} 天，明天见` 
            : '记得设置明日提醒',
          action: '查看今日总结',
          targetPage: 'health-report',
          gradient: 'from-indigo-500 to-purple-500',
          bgGradient: 'from-indigo-50 to-purple-50',
        };
    }
  }, [timeSlot, currentPet, healthScore, metrics.overall, currentEmotion, streakDays, upcomingReminders]);

  const getEmotionLabel = (emotion: string) => {
    const map: Record<string, string> = {
      happy: '很开心',
      curious: '很好奇',
      anxious: '有点焦虑',
      angry: '有点生气',
      needs: '需要关注',
      relaxed: '很放松',
      excited: '很兴奋',
      sleepy: '困了',
      calm: '很平静',
    };
    return map[emotion] || '心情不错';
  };

  const getTimeEmoji = () => {
    switch (timeSlot) {
      case 'morning': return '🌅';
      case 'day': return '☀️';
      case 'evening': return '🌆';
      case 'night': return '🌙';
    }
  };

  return (
    <GlassCard 
      variant="liquid" 
      className="overflow-hidden"
      enable3D={true}
      enableLiquid={true}
    >
      <motion.div 
        className={`relative p-4 rounded-2xl bg-gradient-to-br ${cardContent.bgGradient}`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onNavigate(cardContent.targetPage)}
      >
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        
        <div className="relative flex items-start gap-4">
          {/* 左侧图标 */}
          <motion.div 
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cardContent.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              repeatType: 'loop'
            }}
          >
            <cardContent.icon className="w-7 h-7 text-white" />
          </motion.div>
          
          {/* 中间内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getTimeEmoji()}</span>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">
                {cardContent.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {cardContent.subtitle}
            </p>
          </div>
          
          {/* 右侧箭头 */}
          <motion.div 
            className="flex-shrink-0 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center shadow-sm"
            whileHover={{ x: 3 }}
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </motion.div>
        </div>
        
        {/* 底部操作按钮 */}
        <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {healthScore > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">健康 {healthScore}</span>
                </div>
              )}
              {metrics.overall > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">亲密 {metrics.overall}%</span>
                </div>
              )}
            </div>
            <span className={`text-xs font-semibold bg-gradient-to-r ${cardContent.gradient} bg-clip-text text-transparent`}>
              {cardContent.action} →
            </span>
          </div>
        </div>
      </motion.div>
    </GlassCard>
  );
};
