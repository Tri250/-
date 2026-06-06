// ============================================
// Core Features - 精简核心功能入口
// 从6个入口精简为4个高频入口
// ============================================

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  Bot, 
  MessageCircle, 
  Grid3X3,
  ChevronRight
} from 'lucide-react';
// import { useAppStore } from '../../store/appStore';
import { usePetStore } from '../../store/petStore';
import { useReminderStore } from '../../store/reminderStore';
import { cameraAdapterService } from '../../services/cameraAdapterService';
import { useEffect, useState } from 'react';
import type { CameraDevice } from '../../types/camera';

interface CoreFeaturesProps {
  onNavigate: (page: string) => void;
}

interface FeatureItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bgGradient: string;
  badge?: string | number;
  isNew?: boolean;
}

export const CoreFeatures: React.FC<CoreFeaturesProps> = ({ onNavigate }) => {
  // const { currentPet } = useAppStore();
  const { currentPetId } = usePetStore();
  const { getUpcomingReminders } = useReminderStore();
  const [onlineCameras, setOnlineCameras] = useState<CameraDevice[]>([]);
  
  const upcomingReminders = currentPetId ? getUpcomingReminders(currentPetId, 3) : [];

  useEffect(() => {
    const loadCameras = async () => {
      const devices = await cameraAdapterService.getDevices();
      setOnlineCameras(devices.filter(c => c.status === 'online'));
    };
    loadCameras();
  }, []);

  const features: FeatureItem[] = [
    {
      id: 'translator',
      icon: MessageCircle,
      label: 'AI翻译',
      description: '读懂宠物心声',
      color: '#F97316',
      bgGradient: 'from-orange-500 via-red-400 to-rose-500',
      isNew: true,
    },
    {
      id: 'ai-consultant',
      icon: Bot,
      label: '健康顾问',
      description: '智能问诊咨询',
      color: '#8B5CF6',
      bgGradient: 'from-purple-500 via-violet-500 to-fuchsia-500',
    },
    {
      id: 'camera-monitor',
      icon: Video,
      label: '实时监控',
      description: onlineCameras.length > 0 ? `${onlineCameras.length}台设备在线` : '查看毛孩动态',
      color: '#3B82F6',
      bgGradient: 'from-blue-500 via-blue-600 to-cyan-500',
      badge: onlineCameras.length > 0 ? onlineCameras.length : undefined,
    },
    {
      id: 'more',
      icon: Grid3X3,
      label: '更多',
      description: upcomingReminders.length > 0 ? `${upcomingReminders.length}个待办` : '全部功能',
      color: '#10B981',
      bgGradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      badge: upcomingReminders.length > 0 ? upcomingReminders.length : undefined,
    },
  ];

  const handleFeatureClick = (featureId: string) => {
    if (featureId === 'more') {
      // 展开更多功能菜单或跳转到功能列表页
      onNavigate('services');
    } else {
      onNavigate(featureId);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 text-base">
          <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-orange-400 to-rose-500" />
          核心功能
        </h3>
        <button 
          onClick={() => onNavigate('services')}
          className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1 hover:text-orange-500 transition-colors"
        >
          全部功能
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {features.map((feature, index) => (
          <motion.button
            key={feature.id}
            onClick={() => handleFeatureClick(feature.id)}
            className="group relative flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* 图标容器 */}
            <div className="relative mb-2">
              <motion.div 
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.bgGradient} flex items-center justify-center shadow-lg`}
                whileHover={{ 
                  boxShadow: `0 8px 30px ${feature.color}40`,
                }}
              >
                <feature.icon className="w-6 h-6 text-white" strokeWidth={2} />
              </motion.div>
              
              {/* 徽章 */}
              {feature.badge !== undefined && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                  {feature.badge}
                </div>
              )}
              
              {/* New 标记 */}
              {feature.isNew && (
                <div className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-white text-[8px] font-bold shadow-sm">
                  NEW
                </div>
              )}
            </div>
            
            {/* 文字标签 */}
            <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 mb-0.5">
              {feature.label}
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 text-center leading-tight">
              {feature.description}
            </span>
            
            {/* 悬停指示器 */}
            <motion.div 
              className="absolute -bottom-1 w-1 h-1 rounded-full bg-orange-400"
              initial={{ opacity: 0, scale: 0 }}
              whileHover={{ opacity: 1, scale: 1 }}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
};
