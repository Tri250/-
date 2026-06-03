/**
 * PawSync Pro - AnalysisAnimation
 * 毛球拟态设计系统 - 分析动画组件
 * 
 * 特性：
 * - 平滑变形过渡
 * - 进度环动画
 * - 分步分析阶段
 * - 弹簧物理动画
 */

import { useEffect, useState, useRef } from 'react';
import { Sparkles, Activity, Waves, Music2 } from 'lucide-react';

// 主题颜色
const THEME_COLORS = {
  primary: '#f97316',      // orange-500
  secondary: '#fb923c',    // orange-400
  tertiary: '#fdba74',     // orange-300
  success: '#22c55e',      // green-500
  purple: '#8b5cf6',       // purple-500
  blue: '#3b82f6',         // blue-500
};

// 弹簧物理动画
function useSpring(target: number, tension = 0.15, friction = 0.8) {
  const [value, setValue] = useState(0);
  const velocityRef = useRef(0);
  const prevTargetRef = useRef(target);
  
  useEffect(() => {
    if (prevTargetRef.current !== target) {
      prevTargetRef.current = target;
    }
    
    const animate = () => {
      setValue(prev => {
        const force = (target - prev) * tension;
        velocityRef.current = velocityRef.current * friction + force;
        return prev + velocityRef.current;
      });
    };
    
    const interval = setInterval(animate, 16);
    return () => clearInterval(interval);
  }, [target, tension, friction]);
  
  return value;
}

// 进度环组件
function ProgressRing({ 
  progress, 
  size = 120,
  strokeWidth = 8,
}: { 
  progress: number; 
  size?: number;
  strokeWidth?: number;
}) {
  const animatedProgress = useSpring(progress, 0.1, 0.7);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={THEME_COLORS.primary} />
            <stop offset="50%" stopColor={THEME_COLORS.secondary} />
            <stop offset="100%" stopColor={THEME_COLORS.success} />
          </linearGradient>
        </defs>
        
        {/* 背景环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        
        {/* 进度环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.1s ease-out',
            filter: `drop-shadow(0 0 6px ${THEME_COLORS.primary}40)`,
          }}
        />
      </svg>
      
      {/* 中心内容 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className="text-2xl font-bold"
          style={{ color: THEME_COLORS.primary }}
        >
          {Math.round(animatedProgress)}%
        </span>
      </div>
    </div>
  );
}

// 分析阶段配置
const ANALYSIS_STAGES = [
  { 
    id: 'init', 
    label: '初始化', 
    icon: Sparkles, 
    color: THEME_COLORS.primary,
    duration: 500,
  },
  { 
    id: 'pitch', 
    label: '音调分析', 
    icon: Music2, 
    color: THEME_COLORS.purple,
    duration: 800,
  },
  { 
    id: 'frequency', 
    label: '频率检测', 
    icon: Waves, 
    color: THEME_COLORS.blue,
    duration: 700,
  },
  { 
    id: 'rhythm', 
    label: '节奏识别', 
    icon: Activity, 
    color: THEME_COLORS.success,
    duration: 600,
  },
];

// 单个阶段动画
function StageItem({ 
  stage, 
  isActive, 
  isCompleted,
}: { 
  stage: typeof ANALYSIS_STAGES[0];
  isActive: boolean;
  isCompleted: boolean;
}) {
  const [showPulse, setShowPulse] = useState(false);
  
  useEffect(() => {
    if (isActive) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isActive]);
  
  const Icon = stage.icon;
  
  return (
    <div 
      className="flex items-center gap-3 transition-all duration-300"
      style={{
        opacity: isCompleted || isActive ? 1 : 0.4,
        transform: isActive ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* 图标容器 */}
      <div 
        className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          backgroundColor: isCompleted ? stage.color : isActive ? `${stage.color}20` : '#f3f4f6',
          boxShadow: isActive ? `0 0 20px ${stage.color}40` : 'none',
        }}
      >
        <Icon 
          className="w-5 h-5 transition-all duration-300"
          style={{ 
            color: isCompleted ? '#fff' : isActive ? stage.color : '#9ca3af',
          }}
        />
        
        {/* 脉冲效果 */}
        {showPulse && (
          <div 
            className="absolute inset-0 rounded-full animate-ping"
            style={{ backgroundColor: `${stage.color}30` }}
          />
        )}
      </div>
      
      {/* 标签 */}
      <div className="flex-1">
        <span 
          className="text-sm font-medium transition-colors duration-300"
          style={{ color: isCompleted || isActive ? stage.color : '#9ca3af' }}
        >
          {stage.label}
        </span>
        
        {/* 进度条 */}
        {isActive && (
          <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full animate-pulse"
              style={{ 
                backgroundColor: stage.color,
                width: '60%',
              }}
            />
          </div>
        )}
      </div>
      
      {/* 状态指示 */}
      <div className="w-6 flex justify-center">
        {isCompleted && (
          <span className="text-green-500 animate-bounce">✓</span>
        )}
        {isActive && (
          <div 
            className="w-4 h-4 rounded-full animate-spin"
            style={{ 
              border: `2px solid ${stage.color}`,
              borderTopColor: 'transparent',
            }}
          />
        )}
      </div>
    </div>
  );
}

// 主分析动画组件
interface AnalysisAnimationProps {
  isActive: boolean;
  source?: 'voice' | 'image';
  onStageChange?: (stage: string) => void;
}

export function AnalysisAnimation({
  isActive,
  source = 'voice',
  onStageChange,
}: AnalysisAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  
  // 分析阶段动画
  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      setCurrentStage(0);
      startTimeRef.current = null;
      return;
    }
    
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
    
    const totalDuration = ANALYSIS_STAGES.reduce((sum, s) => sum + s.duration, 0);
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const newProgress = Math.min(100, (elapsed / totalDuration) * 100);
      setProgress(newProgress);
      
      // 计算当前阶段
      let accumulated = 0;
      for (let i = 0; i < ANALYSIS_STAGES.length; i++) {
        accumulated += ANALYSIS_STAGES[i].duration;
        if (elapsed < accumulated) {
          if (currentStage !== i) {
            setCurrentStage(i);
            onStageChange?.(ANALYSIS_STAGES[i].id);
          }
          break;
        }
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [isActive, currentStage, onStageChange]);
  
  // 图像分析阶段
  const imageStages = [
    { id: 'face', label: '表情识别', icon: Sparkles, color: THEME_COLORS.primary, duration: 600 },
    { id: 'pose', label: '姿态分析', icon: Activity, color: THEME_COLORS.purple, duration: 500 },
    { id: 'eyes', label: '眼神检测', icon: Waves, color: THEME_COLORS.blue, duration: 400 },
  ];
  
  const stages = source === 'image' ? imageStages : ANALYSIS_STAGES;
  
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* 进度环 */}
      <ProgressRing progress={progress} size={140} strokeWidth={10} />
      
      {/* 分析阶段列表 */}
      <div className="w-full max-w-xs space-y-3">
        {stages.map((stage, index) => (
          <StageItem
            key={stage.id}
            stage={stage}
            isActive={index === currentStage && isActive}
            isCompleted={index < currentStage || (index === stages.length - 1 && progress >= 100)}
          />
        ))}
      </div>
      
      {/* 分析提示 */}
      <div className="text-center">
        <p className="text-sm text-gray-500 animate-pulse">
          {source === 'image' ? '正在识别宝贝的表情特征...' : '正在分析音频特征、情感维度...'}
        </p>
      </div>
    </div>
  );
}

export default AnalysisAnimation;
