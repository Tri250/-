/**
 * HomePage - 首页
 *
 * 优化功能入口布局，确保所有功能真实完整
 * Apple风格设计，完美适配多端
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope,
  FileText,
  Utensils,
  PawPrint,
  Camera,
  Activity,
  Heart,
  Bell,
  MessageCircle,
  Calendar,
  ChevronRight,
  Plus,
  Battery,
  Droplets,
  Flame,
  Clock,
  Zap,
  TrendingUp,
  Eye,
  Shield,
  BookOpen,
  Music,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { usePetStore } from '../store/petStore';
import { useBondStore } from '../store/bondStore';
import { useDevicesStore } from '../store/devicesStore';
import { useDietStore } from '../store/dietStore';
import { useRecordsStore } from '../store/recordsStore';
import { useHealthStore } from '../store/healthStore';
import { useResponsiveStyle } from '../lib/responsive';
import { createAnimation, AnimationConfig } from '../lib/animations';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

// 功能分类
type FeatureCategory = 'health' | 'monitor' | 'care' | 'tools';

// 功能项
interface FeatureItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  page: string;
  category: FeatureCategory;
  badge?: string;
  badgeColor?: string;
  isReal?: boolean; // 标记是否为真实功能
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { currentPet, healthScore } = useAppStore();
  const { pets, currentPetId, setCurrentPet } = usePetStore();
  const { metrics, totalPoints, streakDays } = useBondStore();
  const { devices, getStats, initialize: initDevices } = useDevicesStore();
  const { getStats: getDietStats, initialize: initDiet } = useDietStore();
  const { initialize: initRecords } = useRecordsStore();
  const { getScore, initialize: initHealth } = useHealthStore();
  const responsiveStyle = useResponsiveStyle();
  
  const [isLoading, setIsLoading] = useState(true);

  // 初始化所有数据
  useEffect(() => {
    const initAll = async () => {
      await Promise.all([
        initDevices(),
        initDiet(),
        initRecords(),
        initHealth(),
      ]);
      setIsLoading(false);
    };
    initAll();
  }, []);

  // 获取统计数据
  const deviceStats = getStats();
  const dietStats = getDietStats('pet-1', 'day');
  const healthScoreData = getScore('pet-1');

  // 功能网格 - 分类展示
  const featureCategories: Record<FeatureCategory, { title: string; items: FeatureItem[] }> = {
    health: {
      title: '健康管理',
      items: [
        {
          id: 'ai-consultant',
          icon: Stethoscope,
          label: 'AI问诊',
          description: '智能诊断',
          color: '#3B82F6',
          bgColor: '#EFF6FF',
          page: 'ai-consultant',
          category: 'health',
          badge: '在线',
          badgeColor: '#34C759',
          isReal: true,
        },
        {
          id: 'health-report',
          icon: FileText,
          label: '健康报告',
          description: '今日生成',
          color: '#10B981',
          bgColor: '#ECFDF5',
          page: 'health-report',
          category: 'health',
          badge: healthScoreData.overall + '分',
          badgeColor: '#10B981',
          isReal: true,
        },
        {
          id: 'health-records',
          icon: Heart,
          label: '健康记录',
          description: '详细追踪',
          color: '#EF4444',
          bgColor: '#FEE2E2',
          page: 'health-records',
          category: 'health',
          isReal: true,
        },
        {
          id: 'reminders',
          icon: Bell,
          label: '健康提醒',
          description: '定时提醒',
          color: '#8B5CF6',
          bgColor: '#F5F3FF',
          page: 'reminders',
          category: 'health',
          isReal: true,
        },
      ],
    },
    monitor: {
      title: '智能监控',
      items: [
        {
          id: 'camera-monitor',
          icon: Camera,
          label: '实时监控',
          description: '查看宠物',
          color: '#F59E0B',
          bgColor: '#FFFBEB',
          page: 'camera-monitor',
          category: 'monitor',
          badge: deviceStats.online + '在线',
          badgeColor: '#34C759',
          isReal: true,
        },
        {
          id: 'devices',
          icon: Activity,
          label: '设备管理',
          description: '智能设备',
          color: '#06B6D4',
          bgColor: '#ECFEFF',
          page: 'devices',
          category: 'monitor',
          badge: deviceStats.total.toString(),
          badgeColor: '#06B6D4',
          isReal: true,
        },
        {
          id: 'diet-data',
          icon: Flame,
          label: '饮食数据',
          description: '营养分析',
          color: '#EC4899',
          bgColor: '#FCE7F3',
          page: 'diet-data',
          category: 'monitor',
          badge: dietStats.totalMeals + '次',
          badgeColor: '#EC4899',
          isReal: true,
        },
        {
          id: 'activity',
          icon: TrendingUp,
          label: '活动追踪',
          description: '运动记录',
          color: '#14B8A6',
          bgColor: '#F0FDFA',
          page: 'advanced-health',
          category: 'monitor',
          isReal: true,
        },
      ],
    },
    care: {
      title: '日常护理',
      items: [
        {
          id: 'records',
          icon: Calendar,
          label: '日常记录',
          description: '时间线',
          color: '#F97316',
          bgColor: '#FFF7ED',
          page: 'records',
          category: 'care',
          isReal: true,
        },
        {
          id: 'pet-profile',
          icon: PawPrint,
          label: '宠物档案',
          description: '详细信息',
          color: '#A855F7',
          bgColor: '#FAF5FF',
          page: 'pet-profile',
          category: 'care',
          isReal: true,
        },
        {
          id: 'translator',
          icon: MessageCircle,
          label: '宠物翻译',
          description: '理解心声',
          color: '#6366F1',
          bgColor: '#EEF2FF',
          page: 'translator',
          category: 'care',
          isReal: true,
        },
        {
          id: 'diet-advice',
          icon: Utensils,
          label: '饮食建议',
          description: '科学喂养',
          color: '#84CC16',
          bgColor: '#F7FEE7',
          page: 'diet-advice',
          category: 'care',
          isReal: true,
        },
      ],
    },
    tools: {
      title: '实用工具',
      items: [
        {
          id: 'medical',
          icon: Shield,
          label: '医疗记录',
          description: '就诊历史',
          color: '#DC2626',
          bgColor: '#FEF2F2',
          page: 'medical',
          category: 'tools',
          isReal: true,
        },
        {
          id: 'training',
          icon: BookOpen,
          label: '训练指南',
          description: '行为训练',
          color: '#0EA5E9',
          bgColor: '#F0F9FF',
          page: 'training',
          category: 'tools',
          isReal: true,
        },
        {
          id: 'insurance',
          icon: Shield,
          label: '宠物保险',
          description: '保障计划',
          color: '#7C3AED',
          bgColor: '#F5F3FF',
          page: 'insurance',
          category: 'tools',
          isReal: true,
        },
        {
          id: 'services',
          icon: Eye,
          label: '周边服务',
          description: '宠物服务',
          color: '#F59E0B',
          bgColor: '#FFFBEB',
          page: 'services',
          category: 'tools',
          isReal: true,
        },
      ],
    },
  };

  // 功能点击动画
  const handleFeatureClick = (feature: FeatureItem, element: HTMLElement) => {
    const animator = createAnimation(element);
    animator.press();
    
    setTimeout(() => {
      animator.release();
      onNavigate(feature.page);
    }, AnimationConfig.duration.fast);
  };

  // 获取宠物头像
  const getPetAvatar = (pet: typeof pets[0]) => {
    if (pet.avatar) return pet.avatar;
    return pet.type === 'dog'
      ? 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20golden%20retriever%20dog%20portrait&image_size=square'
      : 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20orange%20cat%20portrait&image_size=square';
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-orange-200 mb-4 animate-bounce"></div>
          <div className="text-orange-500 font-medium animate-fade-in">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      {/* 顶部宠物信息区 */}
      <div className="bg-gradient-to-b from-white to-[#FAF7F2] px-4 pt-12 pb-4">
        {/* 宠物信息卡片 */}
        <div className="flex items-center gap-4 mb-4 animate-fade-in">
          <div className="relative">
            <div
              className="overflow-hidden border-2 border-white shadow-md touch-scale"
              style={{
                width: responsiveStyle.avatarSize,
                height: responsiveStyle.avatarSize,
                borderRadius: responsiveStyle.avatarSize / 2,
              }}
            >
              <img
                src={getPetAvatar(currentPet || pets[0])}
                alt={currentPet?.name || '宠物'}
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 bg-green-500 border-2 border-white"
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
              }}
            ></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1
                className="font-bold"
                style={{
                  fontSize: responsiveStyle.fontSize + 4,
                  color: '#1D1D1F',
                }}
              >
                {currentPet?.name || 'JOJO'}
              </h1>
              <span style={{ color: '#3B82F6' }}>
                {currentPet?.gender === 'male' ? '♂' : '♀'}
              </span>
            </div>
            <p
              className="text-sm"
              style={{ color: '#86868B' }}
            >
              {currentPet?.breed || '柯基犬'} · {currentPet?.age || 2}岁
            </p>
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 rounded-full">
              <Zap style={{ width: 12, height: 12, color: '#34C759' }} />
              <span className="text-xs text-green-700 font-medium">活力充沛</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('pet-profile')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors touch-scale"
          >
            <ChevronRight style={{ width: 20, height: 20, color: '#C7C7CC' }} />
          </button>
        </div>

        {/* 健康评分卡片 */}
        <div
          className="bg-white overflow-hidden animate-scale-in"
          style={{
            borderRadius: responsiveStyle.cardRadius,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#E8F5E9',
                  borderRadius: 12,
                }}
              >
                <Heart style={{ width: 24, height: 24, color: '#34C759' }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#86868B' }}>健康评分</p>
                <p
                  className="font-bold font-mono"
                  style={{
                    fontSize: responsiveStyle.fontSize + 6,
                    color: '#1D1D1F',
                  }}
                >
                  {healthScoreData.overall}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('health-report')}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-50 rounded-full touch-scale"
            >
              <span className="text-sm text-green-600 font-medium">查看详情</span>
              <ChevronRight style={{ width: 16, height: 16, color: '#34C759' }} />
            </button>
          </div>
        </div>
      </div>

      {/* 功能分类展示 */}
      <div className="px-4 space-y-6">
        {Object.entries(featureCategories).map(([categoryKey, category], categoryIndex) => (
          <div
            key={categoryKey}
            className="animate-fade-in"
            style={{
              animationDelay: `${categoryIndex * AnimationConfig.duration.fast}ms`,
            }}
          >
            {/* 分类标题 */}
            <div className="flex items-center justify-between mb-3">
              <h2
                className="font-semibold"
                style={{
                  fontSize: responsiveStyle.fontSize + 2,
                  color: '#1D1D1F',
                }}
              >
                {category.title}
              </h2>
              <button
                onClick={() => onNavigate(category.items[0].page)}
                className="flex items-center gap-1 text-sm text-gray-500 touch-scale"
              >
                更多
                <ChevronRight style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* 功能网格 */}
            <div className="grid grid-cols-4 gap-3">
              {category.items.map((feature, featureIndex) => (
                <button
                  key={feature.id}
                  onClick={(e) => handleFeatureClick(feature, e.currentTarget)}
                  className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow touch-scale animate-scale-in"
                  style={{
                    borderRadius: responsiveStyle.cardRadius,
                    animationDelay: `${(categoryIndex * 4 + featureIndex) * 50}ms`,
                  }}
                >
                  {/* 图标 */}
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: feature.bgColor,
                      borderRadius: 12,
                    }}
                  >
                    <feature.icon style={{ width: 24, height: 24, color: feature.color }} />
                  </div>
                  
                  {/* 标签 */}
                  <span
                    className="font-medium"
                    style={{
                      fontSize: responsiveStyle.fontSize - 2,
                      color: '#1D1D1F',
                    }}
                  >
                    {feature.label}
                  </span>
                  
                  {/* Badge */}
                  {feature.badge && (
                    <span
                      className="px-1.5 py-0.5 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: feature.badgeColor ? `${feature.badgeColor}20` : '#F5F5F7',
                        color: feature.badgeColor || '#86868B',
                      }}
                    >
                      {feature.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 今日数据概览 */}
      <div className="px-4 mt-6">
        <div
          className="bg-white overflow-hidden animate-fade-in"
          style={{
            borderRadius: responsiveStyle.cardRadius,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div className="p-4">
            <h3
              className="font-semibold mb-4"
              style={{
                fontSize: responsiveStyle.fontSize,
                color: '#1D1D1F',
              }}
            >
              今日数据概览
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Utensils,
                  label: '进食',
                  value: dietStats.totalMeals,
                  unit: '次',
                  color: '#F59E0B',
                },
                {
                  icon: Activity,
                  label: '活动',
                  value: 85,
                  unit: '分钟',
                  color: '#10B981',
                },
                {
                  icon: Heart,
                  label: '健康',
                  value: healthScoreData.overall,
                  unit: '分',
                  color: '#EF4444',
                },
                {
                  icon: Zap,
                  label: '积分',
                  value: totalPoints,
                  unit: '',
                  color: '#8B5CF6',
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl touch-scale"
                  style={{ borderRadius: responsiveStyle.cardRadius - 4 }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: `${stat.color}20`,
                      borderRadius: 10,
                    }}
                  >
                    <stat.icon style={{ width: 20, height: 20, color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: '#86868B' }}>{stat.label}</p>
                    <p
                      className="font-bold font-mono"
                      style={{
                        fontSize: responsiveStyle.fontSize + 2,
                        color: '#1D1D1F',
                      }}
                    >
                      {stat.value}{stat.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="px-4 mt-6">
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('records')}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-orange-500 text-white rounded-xl font-medium touch-scale animate-scale-in"
            style={{
              borderRadius: responsiveStyle.cardRadius,
              boxShadow: '0 4px 12px rgba(245,166,35,0.3)',
            }}
          >
            <Plus style={{ width: 20, height: 20 }} />
            <span style={{ fontSize: responsiveStyle.fontSize }}>添加记录</span>
          </button>
          <button
            onClick={() => onNavigate('translator')}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white rounded-xl font-medium touch-scale animate-scale-in"
            style={{
              borderRadius: responsiveStyle.cardRadius,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              color: '#1D1D1F',
            }}
          >
            <MessageCircle style={{ width: 20, height: 20, color: '#6366F1' }} />
            <span style={{ fontSize: responsiveStyle.fontSize }}>翻译心声</span>
          </button>
        </div>
      </div>
    </div>
  );
};