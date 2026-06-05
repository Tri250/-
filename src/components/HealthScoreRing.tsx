/**
 * PawSync Pro 4.0 温暖治愈版
 * 健康评分圆环组件 - 苹果健康风格
 * 
 * 设计理念：游戏化健康评分，像信用分一样直观
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Activity,
  Scale,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Info,
} from 'lucide-react';
import { cn } from '../lib/utils';

// ============================================================================
// 类型定义
// ============================================================================

export interface HealthScoreDimension {
  name: string;
  score: number;        // 0-100
  weight: number;       // 权重百分比
  maxScore: number;     // 该维度满分
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  suggestion?: string;
}

export interface HealthScoreData {
  totalScore: number;           // 总分 0-100
  dimensions: HealthScoreDimension[];
  lastUpdated: Date;
  trend: 'up' | 'down' | 'stable';
  trendValue?: number;
}

interface HealthScoreRingProps {
  data: HealthScoreData;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onNavigate?: (page: string) => void;
  className?: string;
}

// ============================================================================
// 健康评分维度配置
// ============================================================================

const defaultDimensions: HealthScoreDimension[] = [
  {
    name: '疫苗接种',
    score: 85,
    weight: 30,
    maxScore: 100,
    icon: Shield,
    color: 'text-secondary-500',
    bgColor: 'bg-secondary-50',
    description: '疫苗接种完整度',
    suggestion: '还有1针疫苗待接种',
  },
  {
    name: '定期体检',
    score: 70,
    weight: 25,
    maxScore: 100,
    icon: Activity,
    color: 'text-primary-500',
    bgColor: 'bg-primary-50',
    description: '体检完成度',
    suggestion: '建议每季度体检一次',
  },
  {
    name: '体重趋势',
    score: 90,
    weight: 20,
    maxScore: 100,
    icon: Scale,
    color: 'text-lavender-500',
    bgColor: 'bg-lavender-50',
    description: '体重趋势正常度',
    suggestion: '体重稳定，继续保持',
  },
  {
    name: '记录活跃',
    score: 60,
    weight: 15,
    maxScore: 100,
    icon: Calendar,
    color: 'text-cream-500',
    bgColor: 'bg-cream-50',
    description: '记录活跃度',
    suggestion: '连续记录3天可获得火焰',
  },
  {
    name: 'AI评估',
    score: 95,
    weight: 10,
    maxScore: 100,
    icon: Sparkles,
    color: 'text-sakura-500',
    bgColor: 'bg-sakura-50',
    description: 'AI综合评估加分',
    suggestion: 'AI评估健康状态良好',
  },
];

// ============================================================================
// 评分等级配置
// ============================================================================

const scoreLevels: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  ringColor: string;
  description: string;
}> = {
  excellent: {
    label: '极佳',
    color: 'text-secondary-500',
    bgColor: 'bg-secondary-50',
    ringColor: '#22C55E',
    description: '健康状态极佳，继续保持！',
  },
  good: {
    label: '良好',
    color: 'text-secondary-400',
    bgColor: 'bg-secondary-50',
    ringColor: '#4ADE80',
    description: '健康状态良好，还有提升空间',
  },
  fair: {
    label: '一般',
    color: 'text-cream-500',
    bgColor: 'bg-cream-50',
    ringColor: '#EAB308',
    description: '健康状态一般，建议关注',
  },
  concern: {
    label: '关注',
    color: 'text-primary-500',
    bgColor: 'bg-primary-50',
    ringColor: '#FB923C',
    description: '健康状态需要关注',
  },
  warning: {
    label: '警告',
    color: 'text-danger-500',
    bgColor: 'bg-danger-50',
    ringColor: '#EF4444',
    description: '健康状态需要立即关注',
  },
};

// ============================================================================
// 获取评分等级
// ============================================================================

const getScoreLevel = (score: number) => {
  if (score >= 90) return scoreLevels.excellent;
  if (score >= 75) return scoreLevels.good;
  if (score >= 60) return scoreLevels.fair;
  if (score >= 40) return scoreLevels.concern;
  return scoreLevels.warning;
};

// ============================================================================
// 圆环尺寸配置
// ============================================================================

const sizeConfig = {
  sm: { ring: 120, center: 80, strokeWidth: 8 },
  md: { ring: 160, center: 120, strokeWidth: 12 },
  lg: { ring: 200, center: 160, strokeWidth: 16 },
};

// ============================================================================
// 健康评分圆环组件
// ============================================================================

export const HealthScoreRing = memo<HealthScoreRingProps>(({
  data,
  size = 'lg',
  showDetails = true,
  onNavigate,
  className,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showDimensionDetails, setShowDimensionDetails] = useState(false);
  
  const config = sizeConfig[size];
  const level = getScoreLevel(data.totalScore);
  
  // 动画效果：分数从0增长到实际值
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = data.totalScore / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= data.totalScore) {
        setAnimatedScore(data.totalScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [data.totalScore]);

  // 计算圆环路径
  const radius = (config.ring - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;
  const center = config.ring / 2;

  return (
    <div className={cn('relative', className)}>
      {/* 圆环容器 */}
      <div className="relative inline-flex items-center justify-center">
        {/* SVG圆环 */}
        <svg
          width={config.ring}
          height={config.ring}
          className="transform -rotate-90"
        >
          {/* 背景圆环 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#E7E5E4"
            strokeWidth={config.strokeWidth}
            className="opacity-30"
          />
          
          {/* 进度圆环 */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={level.ringColor}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDasharray: 0, strokeDashoffset: 0 }}
            animate={{
              strokeDasharray: circumference,
              strokeDashoffset: circumference - progress,
            }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="drop-shadow-lg"
          />
          
          {/* 发光效果 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={level.ringColor}
            strokeWidth={config.strokeWidth / 2}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="opacity-30 blur-sm"
          />
        </svg>
        
        {/* 中心内容 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* 分数 */}
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className={cn(
              'text-4xl font-bold',
              size === 'sm' && 'text-2xl',
              size === 'md' && 'text-3xl',
              level.color
            )}
          >
            {animatedScore}
          </motion.span>
          
          {/* 等级标签 */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className={cn(
              'text-sm font-medium mt-1 px-2 py-0.5 rounded-full',
              level.bgColor,
              level.color
            )}
          >
            {level.label}
          </motion.span>
          
          {/* 趋势指示 */}
          {data.trend && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center gap-1 mt-1"
            >
              {data.trend === 'up' && (
                <TrendingUp className="w-3 h-3 text-secondary-500" />
              )}
              {data.trend === 'down' && (
                <TrendingDown className="w-3 h-3 text-danger-500" />
              )}
              {data.trendValue && (
                <span className={cn(
                  'text-xs',
                  data.trend === 'up' ? 'text-secondary-500' : 'text-danger-500'
                )}>
                  {data.trend === 'up' ? '+' : '-'}{Math.abs(data.trendValue)}
                </span>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* 详细维度展示 */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-6"
        >
          {/* 展开按钮 */}
          <button
            onClick={() => setShowDimensionDetails(!showDimensionDetails)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <span className="text-sm font-medium text-neutral-700">评分维度分解</span>
            <ChevronRight className={cn(
              'w-4 h-4 text-neutral-400 transition-transform',
              showDimensionDetails && 'rotate-90'
            )} />
          </button>
          
          {/* 维度详情 */}
          <AnimatePresence>
            {showDimensionDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
              >
                {data.dimensions.map((dimension, index) => {
                  const IconComponent = dimension.icon;
                  const dimLevel = getScoreLevel(dimension.score);
                  
                  return (
                    <motion.div
                      key={dimension.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl',
                        dimension.bgColor
                      )}
                    >
                      {/* 图标 */}
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        dimension.color,
                        'bg-white/50'
                      )}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      
                      {/* 维度信息 */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-700">
                            {dimension.name}
                          </span>
                          <span className={cn('text-sm font-bold', dimLevel.color)}>
                            {dimension.score}
                          </span>
                        </div>
                        
                        {/* 进度条 */}
                        <div className="mt-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${dimension.score}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className={cn('h-full rounded-full', `bg-[${dimLevel.ringColor}]`)}
                            style={{ backgroundColor: dimLevel.ringColor }}
                          />
                        </div>
                        
                        {/* 权重提示 */}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-neutral-400">
                            权重 {dimension.weight}%
                          </span>
                          {dimension.suggestion && (
                            <span className="text-xs text-neutral-500">
                              {dimension.suggestion}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* 查看详情 */}
                      <button
                        onClick={() => onNavigate?.('health-report')}
                        className="p-1 rounded-lg hover:bg-white/50 transition-colors"
                      >
                        <Info className="w-4 h-4 text-neutral-400" />
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* 描述文字 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center text-sm text-neutral-500 mt-4"
      >
        {level.description}
      </motion.p>
    </div>
  );
});

HealthScoreRing.displayName = 'HealthScoreRing';

// ============================================================================
// 默认健康评分数据生成器
// ============================================================================

export const generateDefaultHealthScore = (): HealthScoreData => {
  return {
    totalScore: Math.round(
      defaultDimensions.reduce((sum, dim) => sum + dim.score * dim.weight / 100, 0)
    ),
    dimensions: defaultDimensions,
    lastUpdated: new Date(),
    trend: 'up',
    trendValue: 5,
  };
};

export default HealthScoreRing;