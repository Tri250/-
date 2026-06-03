/**
 * PawSync Pro - ResultAnimation
 * 毛球拟态设计系统 - 结果动画组件
 * 
 * 特性：
 * - 交错显示动画
 * - 情感图标弹跳效果
 * - 置信度填充动画
 * - 打字机效果
 */

import { useEffect, useState, useRef } from 'react';
import { Activity } from 'lucide-react';

// 主题颜色
const THEME_COLORS = {
  primary: '#f97316',      // orange-500
  secondary: '#fb923c',    // orange-400
  tertiary: '#fdba74',     // orange-300
  success: '#22c55e',      // green-500
  background: '#f8fafc',   // light gray
};

// 弹簧动画hook
function useSpring(target: number, tension = 0.15, friction = 0.8) {
  const [value, setValue] = useState(0);
  const velocityRef = useRef(0);
  
  useEffect(() => {
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

// 打字机效果hook
function useTypewriter(text: string, speed = 50, delay = 0) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    setDisplayText('');
    setIsComplete(false);
    
    const startTimeout = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1));
          index++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, speed);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(startTimeout);
  }, [text, speed, delay]);
  
  return { displayText, isComplete };
}

// 情感图标弹跳动画
interface EmotionIconAnimationProps {
  icon: React.ReactNode;
  emotion: string;
  delay?: number;
}

export function EmotionIconAnimation({ icon, emotion, delay = 0 }: EmotionIconAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState(0);
  
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      // 弹跳动画序列
      setScale(1.2);
      setTimeout(() => setScale(0.9), 100);
      setTimeout(() => setScale(1.05), 200);
      setTimeout(() => setScale(1), 300);
    }, delay);
    
    return () => clearTimeout(showTimer);
  }, [delay]);
  
  if (!isVisible) return null;
  
  const emotionColors: Record<string, string> = {
    happy: '#22c55e',
    anxious: '#eab308',
    angry: '#ef4444',
    needs: '#3b82f6',
    calm: '#6b7280',
    curious: '#8b5cf6',
    excited: '#ec4899',
    safe: '#14b8a6',
  };
  
  const color = emotionColors[emotion] || THEME_COLORS.primary;
  
  return (
    <div 
      className="relative inline-flex items-center justify-center p-4 rounded-full bg-white shadow-lg"
      style={{
        transform: `scale(${scale})`,
        transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: `0 0 30px ${color}30`,
      }}
    >
      {/* 背景光晕 */}
      <div 
        className="absolute inset-0 rounded-full animate-pulse"
        style={{ 
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        }}
      />
      
      {/* 图标 */}
      <div className="relative z-10">
        {icon}
      </div>
      
      {/* 粒子效果 */}
      {isVisible && (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{
                backgroundColor: color,
                opacity: 0.4,
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 60}deg) translateY(-30px)`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

// 置信度填充动画
interface ConfidenceMeterAnimationProps {
  confidence: number;
  delay?: number;
}

export function ConfidenceMeterAnimation({ confidence, delay = 0 }: ConfidenceMeterAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const animatedValue = useSpring(isVisible ? confidence : 0, 0.08, 0.75);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  const isHigh = confidence >= 95;
  const color = isHigh ? THEME_COLORS.success : THEME_COLORS.primary;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 flex items-center gap-1">
          <Activity className="w-3.5 h-3.5" />
          情感置信度
        </span>
        <span 
          className="font-semibold"
          style={{ color: isHigh ? THEME_COLORS.success : THEME_COLORS.primary }}
        >
          {Math.round(animatedValue)}%
          {isHigh && <span className="ml-1">✓</span>}
        </span>
      </div>
      
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        {/* 背景渐变 */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
          }}
        />
        
        {/* 填充条 */}
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${animatedValue}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${color}cc 50%, ${color}99 100%)`,
            boxShadow: `0 0 10px ${color}40`,
          }}
        />
        
        {/* 光点效果 */}
        {isVisible && (
          <div 
            className="absolute top-0 w-4 h-full bg-white/50 rounded-full animate-pulse"
            style={{ left: `${Math.max(0, animatedValue - 4)}%` }}
          />
        )}
      </div>
      
      {/* 高置信度标记 */}
      {isHigh && animatedValue >= 95 && (
        <div 
          className="text-xs text-center animate-pulse"
          style={{ color: THEME_COLORS.success }}
        >
          ✓ 达到95%+标准
        </div>
      )}
    </div>
  );
}

// 打字机文本动画
interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
}

export function TypewriterText({ text, speed = 40, delay = 0, className = '' }: TypewriterTextProps) {
  const { displayText, isComplete } = useTypewriter(text, speed, delay);
  
  return (
    <span className={className}>
      "{displayText}"
      {!isComplete && (
        <span 
          className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
          style={{ backgroundColor: THEME_COLORS.primary }}
        />
      )}
    </span>
  );
}

// 交错显示容器
interface StaggeredRevealProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  initialDelay?: number;
}

export function StaggeredReveal({ 
  children, 
  staggerDelay = 150,
  initialDelay = 0,
}: StaggeredRevealProps) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  
  useEffect(() => {
    children.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, initialDelay + index * staggerDelay);
      
      return () => clearTimeout(timer);
    });
  }, [children, staggerDelay, initialDelay]);
  
  return (
    <>
      {children.map((child, index) => (
        <div
          key={index}
          style={{
            opacity: visibleItems.includes(index) ? 1 : 0,
            transform: visibleItems.includes(index) 
              ? 'translateY(0) scale(1)' 
              : 'translateY(20px) scale(0.95)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          {child}
        </div>
      ))}
    </>
  );
}

// 结果卡片动画
interface ResultCardAnimationProps {
  children: React.ReactNode;
  delay?: number;
}

export function ResultCardAnimation({ children, delay = 0 }: ResultCardAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const scale = useSpring(isVisible ? 1 : 0.9, 0.12, 0.75);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: `scale(${scale})`,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      {children}
    </div>
  );
}

// 徽章弹跳动画
interface BadgeAnimationProps {
  children: React.ReactNode;
  delay?: number;
}

export function BadgeAnimation({ children, delay = 0 }: BadgeAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [bounce, setBounce] = useState(false);
  
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setBounce(true);
      setTimeout(() => setBounce(false), 500);
    }, delay);
    
    return () => clearTimeout(showTimer);
  }, [delay]);
  
  if (!isVisible) return null;
  
  return (
    <div
      className={bounce ? 'animate-bounce' : ''}
      style={{
        animationDuration: '0.5s',
      }}
    >
      {children}
    </div>
  );
}

export default {
  EmotionIconAnimation,
  ConfidenceMeterAnimation,
  TypewriterText,
  StaggeredReveal,
  ResultCardAnimation,
  BadgeAnimation,
};
