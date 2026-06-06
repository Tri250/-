// ============================================
// Personalized Feed - 个性化内容流
// 类似社交Feed的个性化内容展示
// ============================================

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  TrendingUp, 
  BookOpen, 
  Sparkles,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useBondStore } from '../../store/bondStore';
// import { usePetStore } from '../../store/petStore';
import { useHealthRecordStore } from '../../store/healthRecordStore';
import { GlassCard } from '../DesignSystem';

interface PersonalizedFeedProps {
  onNavigate: (page: string) => void;
}

interface FeedItem {
  id: string;
  type: 'emotion' | 'health' | 'knowledge' | 'milestone';
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  content: string;
  action: string;
  targetPage: string;
  priority: number;
}

export const PersonalizedFeed: React.FC<PersonalizedFeedProps> = ({ onNavigate }) => {
  const { currentPet, currentEmotion, healthScore } = useAppStore();
  const { streakDays } = useBondStore();
  // const { pets } = usePetStore();
  const { getFilteredRecords } = useHealthRecordStore();
  
  const currentPetId = currentPet?.id;
  const recentRecords = currentPetId ? getFilteredRecords(currentPetId).slice(0, 3) : [];

  // 辅助函数定义在 useMemo 之前，使用 useCallback 避免重复创建
  const getEmotionLabel = useCallback((emotion: string) => {
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
  }, []);

  const getEmotionAdvice = useCallback((emotion: string) => {
    const map: Record<string, string> = {
      happy: '趁TA开心，多拍些照片记录美好时刻吧！',
      curious: '好奇心旺盛，是训练新技能的好时机',
      anxious: '看起来有些不安，试试播放舒缓音乐',
      angry: '情绪不太好，给TA一些独处空间',
      needs: '在寻求关注，快去陪陪TA吧',
      relaxed: '很放松的状态，适合梳理毛发',
      excited: '精力充沛，可以安排一些运动游戏',
      sleepy: '困了，准备让TA好好休息吧',
      calm: '心情平静，是日常护理的好时机',
    };
    return map[emotion] || '去了解一下TA的需求吧';
  }, []);

  const getDailyTip = useCallback((petType?: string) => {
    const tips = {
      dog: [
        '狗狗每天需要至少30分钟的户外活动',
        '定期修剪指甲可以防止行走不适',
        '狗狗的鼻子湿润程度可以反映健康状况',
      ],
      cat: [
        '猫咪每天需要12-16小时的睡眠',
        '提供猫抓板可以保护家具',
        '猫咪喜欢高处，准备猫爬架很重要',
      ],
      default: [
        '定期体检可以及早发现健康问题',
        '保持饮食规律有助于消化健康',
        '适当的运动对身心健康都很重要',
      ],
    };
    const typeTips = petType === 'dog' ? tips.dog : petType === 'cat' ? tips.cat : tips.default;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return typeTips[dayOfYear % typeTips.length];
  }, []);

  const feedItems = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    const petName = currentPet?.name || '毛孩子';

    // 1. 今日宠物心情（最高优先级）
    if (currentEmotion) {
      items.push({
        id: 'emotion-today',
        type: 'emotion',
        icon: Heart,
        iconColor: 'text-rose-500',
        iconBg: 'bg-rose-100 dark:bg-rose-900/30',
        title: `${petName}今天${getEmotionLabel(currentEmotion)}`,
        content: getEmotionAdvice(currentEmotion),
        action: '去互动',
        targetPage: 'bond-emotion',
        priority: 100,
      });
    }

    // 2. 健康趋势
    if (healthScore > 0) {
      items.push({
        id: 'health-trend',
        type: 'health',
        icon: TrendingUp,
        iconColor: 'text-emerald-500',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        title: healthScore >= 80 ? '健康状况良好' : '需要关注健康',
        content: healthScore >= 80 
          ? `${petName}最近状态不错，继续保持！`
          : `${petName}的健康评分偏低，建议记录更多健康数据`,
        action: '查看详情',
        targetPage: 'health-records',
        priority: healthScore < 80 ? 90 : 70,
      });
    }

    // 3. 连续陪伴天数
    if (streakDays > 0) {
      items.push({
        id: 'streak-milestone',
        type: 'milestone',
        icon: Zap,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        title: `连续陪伴 ${streakDays} 天`,
        content: streakDays >= 7 
          ? '太棒了！你们的关系越来越亲密了'
          : '坚持记录，建立更深的情感连接',
        action: '查看成就',
        targetPage: 'bond-emotion',
        priority: streakDays >= 7 ? 85 : 60,
      });
    }

    // 4. 最近健康记录
    if (recentRecords.length > 0) {
      const latestRecord = recentRecords[0];
      items.push({
        id: 'latest-record',
        type: 'health',
        icon: TrendingUp,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        title: '最近健康记录',
        content: `${latestRecord.title} - ${latestRecord.content?.slice(0, 30)}...`,
        action: '查看全部',
        targetPage: 'health-records',
        priority: 50,
      });
    }

    // 5. 养宠知识推荐
    items.push({
      id: 'daily-tip',
      type: 'knowledge',
      icon: BookOpen,
      iconColor: 'text-indigo-500',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      title: '今日养宠小贴士',
      content: getDailyTip(currentPet?.type),
      action: '了解更多',
      targetPage: 'health-manual',
      priority: 40,
    });

    // 按优先级排序
    return items.sort((a, b) => b.priority - a.priority).slice(0, 4);
  }, [currentPet, currentEmotion, healthScore, streakDays, recentRecords, getEmotionLabel, getEmotionAdvice, getDailyTip]);

  if (feedItems.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-amber-500" />
          为你推荐
        </h3>
      </div>

      <div className="space-y-3">
        {feedItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              variant="liquid"
              className="overflow-hidden cursor-pointer group"
              enable3D={true}
              onClick={() => onNavigate(item.targetPage)}
            >
              <div className="flex items-start gap-3 p-3">
                {/* 图标 */}
                <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                    {item.content}
                  </p>
                </div>

                {/* 操作箭头 */}
                <motion.div 
                  className="flex-shrink-0 self-center"
                  whileHover={{ x: 3 }}
                >
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-orange-500 transition-colors" />
                </motion.div>
              </div>

              {/* 底部操作条 */}
              <div className="px-3 pb-3">
                <div className="flex items-center justify-between pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50">
                  <span className={`text-xs font-medium ${item.iconColor}`}>
                    {item.action}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.iconColor.replace('text-', 'bg-')}`} />
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
