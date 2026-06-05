/**
 * PawSync Pro 4.0 温暖治愈版
 * 宠物动态时间线卡片 - 朋友圈式卡片流
 * 
 * 设计理念：每条记录是一张温暖的卡片，像朋友分享动态
 */

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PawPrint,
  Syringe,
  Scale,
  Pill,
  Heart,
  Camera,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  Flame,
  ChevronRight,
  MoreHorizontal,
  Share2,
  Bookmark,
} from 'lucide-react';
import { cn } from '../lib/utils';

// ============================================================================
// 类型定义
// ============================================================================

export type TimelineRecordType = 
  | 'vaccine'      // 疫苗接种
  | 'weight'       // 体重记录
  | 'medication'   // 喂药记录
  | 'checkup'      // 体检记录
  | 'ai_report'    // AI健康周报
  | 'milestone'    // 成长里程碑
  | 'mood'         // 心情记录
  | 'feeding'      // 喂食记录
  | 'exercise'     // 运动/遛狗
  | 'photo';       // 拍照记录

export interface PetTimelineRecord {
  id: string;
  petId: string;
  petName: string;
  petAvatar?: string;
  petType: 'dog' | 'cat' | 'rabbit' | 'bird' | 'other';
  type: TimelineRecordType;
  title: string;
  description: string;
  timestamp: Date;
  streak?: number;          // 连续记录天数
  celebration?: boolean;     // 是否触发庆祝动画
  data?: Record<string, unknown>;  // 记录数据
}

interface PetTimelineCardProps {
  record: PetTimelineRecord;
  onNavigate?: (page: string) => void;
  onShare?: (record: PetTimelineRecord) => void;
  onBookmark?: (record: PetTimelineRecord) => void;
  showStreak?: boolean;
}

// ============================================================================
// 记录类型配置 - 温暖治愈风格
// ============================================================================

const recordTypeConfig: Record<TimelineRecordType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  celebrationEmoji: string;
  defaultMessage: string;
}> = {
  vaccine: {
    icon: Syringe,
    color: 'text-secondary-500',
    bgColor: 'bg-secondary-50',
    borderColor: 'border-secondary-200',
    celebrationEmoji: '🎉',
    defaultMessage: '完成了疫苗接种，真棒！',
  },
  weight: {
    icon: Scale,
    color: 'text-primary-500',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
    celebrationEmoji: '📈',
    defaultMessage: '体重记录完成，继续保持～',
  },
  medication: {
    icon: Pill,
    color: 'text-lavender-500',
    bgColor: 'bg-lavender-50',
    borderColor: 'border-lavender-200',
    celebrationEmoji: '✅',
    defaultMessage: '喂药完成，小家伙很配合呢！',
  },
  checkup: {
    icon: Heart,
    color: 'text-secondary-500',
    bgColor: 'bg-secondary-50',
    borderColor: 'border-secondary-200',
    celebrationEmoji: '🏥',
    defaultMessage: '体检完成，健康状态良好！',
  },
  ai_report: {
    icon: Sparkles,
    color: 'text-lavender-500',
    bgColor: 'bg-lavender-50',
    borderColor: 'border-lavender-200',
    celebrationEmoji: '✨',
    defaultMessage: 'AI健康周报已生成，快来看看吧～',
  },
  milestone: {
    icon: Award,
    color: 'text-cream-500',
    bgColor: 'bg-cream-50',
    borderColor: 'border-cream-200',
    celebrationEmoji: '🏆',
    defaultMessage: '达成成长里程碑，太厉害了！',
  },
  mood: {
    icon: PawPrint,
    color: 'text-sakura-500',
    bgColor: 'bg-sakura-50',
    borderColor: 'border-sakura-200',
    celebrationEmoji: '😊',
    defaultMessage: '记录了今天的心情状态～',
  },
  feeding: {
    icon: PawPrint,
    color: 'text-primary-500',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
    celebrationEmoji: '🍽️',
    defaultMessage: '喂食记录完成，吃得真香！',
  },
  exercise: {
    icon: TrendingUp,
    color: 'text-secondary-500',
    bgColor: 'bg-secondary-50',
    borderColor: 'border-secondary-200',
    celebrationEmoji: '🏃',
    defaultMessage: '运动完成，活力满满！',
  },
  photo: {
    icon: Camera,
    color: 'text-sky-500',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    celebrationEmoji: '📸',
    defaultMessage: '拍下了珍贵的瞬间～',
  },
};

// ============================================================================
// 宠物类型头像颜色
// ============================================================================

const petTypeColors: Record<string, string> = {
  dog: 'bg-primary-100 text-primary-600',
  cat: 'bg-lavender-100 text-lavender-600',
  rabbit: 'bg-sakura-100 text-sakura-600',
  bird: 'bg-sky-100 text-sky-600',
  other: 'bg-neutral-100 text-neutral-600',
};

// ============================================================================
// 时间线卡片组件
// ============================================================================

export const PetTimelineCard = memo<PetTimelineCardProps>(({
  record,
  onNavigate,
  onShare,
  onBookmark,
  showStreak = true,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(record.celebration);
  
  const config = recordTypeConfig[record.type];
  const IconComponent = config.icon;
  
  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  // 触发庆祝动画
  const triggerCelebration = () => {
    setIsCelebrating(true);
    setTimeout(() => setIsCelebrating(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pet-timeline-card p-4 mb-4"
      onClick={() => setShowActions(!showActions)}
    >
      {/* 头部：宠物信息 + 时间 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* 宠物头像 */}
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            petTypeColors[record.petType]
          )}>
            {record.petAvatar ? (
              <img src={record.petAvatar} alt={record.petName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <PawPrint className="w-5 h-5" />
            )}
          </div>
          
          {/* 宠物名称 + 记录类型 */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-700">{record.petName}</span>
              <div className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                config.bgColor,
                config.color
              )}>
                <IconComponent className="w-3 h-3 inline mr-1" />
                {record.title}
              </div>
            </div>
            <span className="text-xs text-neutral-400">{formatTime(record.timestamp)}</span>
          </div>
        </div>
        
        {/* Streak火焰 */}
        {showStreak && record.streak && record.streak >= 3 && (
          <div className="flex items-center gap-1 animate-streak">
            <Flame className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-bold text-primary-500">{record.streak}</span>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className={cn(
        'rounded-xl p-3 border',
        config.bgColor,
        config.borderColor
      )}>
        {/* 插画占位（后续替换真实插画） */}
        <div className="illustration-placeholder h-32 mb-3">
          <span className="text-4xl">{config.celebrationEmoji}</span>
        </div>
        
        {/* 描述文字 */}
        <p className="text-sm text-neutral-600 leading-relaxed">
          {record.description || config.defaultMessage}
        </p>
        
        {/* 数据展示（如体重变化） */}
        {record.type === 'weight' && record.data && (
          <div className="mt-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-secondary-500" />
            <span className="text-xs text-secondary-600">
              这月{(record.data.change as number) > 0 ? '长了' : '减了'}{Math.abs(record.data.change as number)}kg
            </span>
          </div>
        )}
        
        {/* AI周报特殊展示 */}
        {record.type === 'ai_report' && (
          <div className="mt-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-lavender-500 animate-sparkle" />
            <span className="text-xs text-lavender-600">点击查看完整健康周报</span>
            <ChevronRight className="w-4 h-4 text-lavender-400" />
          </div>
        )}
      </div>

      {/* 庆祝动画 */}
      <AnimatePresence>
        {isCelebrating && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="text-6xl animate-celebrate">🎉</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 操作按钮 */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-around pt-3 border-t border-neutral-200 mt-3"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare?.(record);
              }}
              className="flex items-center gap-1 text-neutral-500 hover:text-primary-500 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs">分享</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmark?.(record);
              }}
              className="flex items-center gap-1 text-neutral-500 hover:text-secondary-500 transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              <span className="text-xs">收藏</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerCelebration();
              }}
              className="flex items-center gap-1 text-neutral-500 hover:text-lavender-500 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-xs">庆祝</span>
            </button>
            
            <button
              className="flex items-center gap-1 text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="text-xs">更多</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

PetTimelineCard.displayName = 'PetTimelineCard';

// ============================================================================
// 时间线列表组件
// ============================================================================

interface PetTimelineProps {
  records: PetTimelineRecord[];
  onNavigate?: (page: string) => void;
  onShare?: (record: PetTimelineRecord) => void;
  onBookmark?: (record: PetTimelineRecord) => void;
  showStreak?: boolean;
}

export const PetTimeline = memo<PetTimelineProps>(({
  records,
  onNavigate,
  onShare,
  onBookmark,
  showStreak = true,
}) => {
  return (
    <div className="space-y-4">
      {records.map((record, index) => (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <PetTimelineCard
            record={record}
            onNavigate={onNavigate}
            onShare={onShare}
            onBookmark={onBookmark}
            showStreak={showStreak}
          />
        </motion.div>
      ))}
    </div>
  );
});

PetTimeline.displayName = 'PetTimeline';

export default PetTimelineCard;