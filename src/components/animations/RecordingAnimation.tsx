/**
 * PawSync Pro - RecordingAnimation
 * 毛球拟态设计系统 - 录音动画组件
 * 
 * 特性：
 * - 有机波浪动画
 * - 爪印呼吸效果
 * - 声波可视化
 * - 粒子效果
 */

import { useEffect, useState, useRef, useMemo } from 'react';

// 主题颜色
const THEME_COLORS = {
  primary: '#f97316',      // orange-500
  secondary: '#fb923c',    // orange-400
  tertiary: '#fdba74',     // orange-300
  success: '#22c55e',      // green-500
  background: '#f8fafc',   // light gray
};

// 爪印SVG组件
function PawPrint({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor">
      <ellipse cx="50" cy="65" rx="25" ry="20" />
      <ellipse cx="25" cy="35" rx="10" ry="12" />
      <ellipse cx="45" cy="25" rx="8" ry="10" />
      <ellipse cx="65" cy="25" rx="8" ry="10" />
      <ellipse cx="80" cy="35" rx="10" ry="12" />
    </svg>
  );
}

// 有机波浪动画
function OrganicWaves({ audioLevel, isActive }: { audioLevel: number; isActive: boolean }) {
  const [phase, setPhase] = useState(0);
  
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setPhase(p => (p + 0.1) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, [isActive]);
  
  const waves = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => {
      const baseRadius = 60 + i * 15;
      const waveAmplitude = isActive ? (audioLevel / 100) * 20 + 5 : 5;
      const points = Array.from({ length: 36 }, (_, j) => {
        const angle = (j / 36) * Math.PI * 2;
        const wave = Math.sin(angle * 4 + phase + i * 0.5) * waveAmplitude;
        const radius = baseRadius + wave;
        const x = 100 + Math.cos(angle) * radius;
        const y = 100 + Math.sin(angle) * radius;
        return `${x},${y}`;
      }).join(' ');
      
      return { points, opacity: 0.3 - i * 0.08, delay: i * 0.15 };
    });
  }, [audioLevel, isActive, phase]);
  
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={THEME_COLORS.primary} />
          <stop offset="50%" stopColor={THEME_COLORS.secondary} />
          <stop offset="100%" stopColor={THEME_COLORS.tertiary} />
        </linearGradient>
      </defs>
      {waves.map((wave, i) => (
        <polygon
          key={i}
          points={wave.points}
          fill="none"
          stroke="url(#waveGradient)"
          strokeWidth="2"
          opacity={wave.opacity}
          style={{
            transition: 'opacity 0.3s ease',
          }}
        />
      ))}
    </svg>
  );
}

// 声波可视化组件
function SoundWaveVisualization({ 
  audioLevel, 
  isActive 
}: { 
  audioLevel: number; 
  isActive: boolean;
}) {
  const [bars, setBars] = useState<number[]>(Array(12).fill(20));
  
  useEffect(() => {
    if (!isActive) {
      setBars(Array(12).fill(20));
      return;
    }
    
    const interval = setInterval(() => {
      setBars(prev => prev.map((_, i) => {
        const centerFactor = 1 - Math.abs(i - 5.5) / 5.5;
        const baseHeight = 20 + (audioLevel / 100) * 60 * centerFactor;
        const variation = Math.random() * 20;
        return Math.min(80, baseHeight + variation);
      }));
    }, 80);
    
    return () => clearInterval(interval);
  }, [isActive, audioLevel]);
  
  return (
    <div className="flex items-end justify-center gap-1 h-16 px-4">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-2 rounded-full transition-all duration-100"
          style={{
            height: `${height}%`,
            background: `linear-gradient(to top, ${THEME_COLORS.primary}, ${THEME_COLORS.secondary})`,
            boxShadow: isActive ? `0 0 8px ${THEME_COLORS.primary}40` : 'none',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}

// 粒子效果
function Particles({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; opacity: number }>>([]);
  const idRef = useRef(0);
  
  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }
    
    const interval = setInterval(() => {
      const newParticle = {
        id: idRef.current++,
        x: 50 + (Math.random() - 0.5) * 80,
        y: 50 + (Math.random() - 0.5) * 80,
        size: 2 + Math.random() * 4,
        opacity: 0.6 + Math.random() * 0.4,
      };
      
      setParticles(prev => [...prev.slice(-15), newParticle]);
    }, 150);
    
    return () => clearInterval(interval);
  }, [isActive]);
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full animate-ping"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: THEME_COLORS.secondary,
            opacity: p.opacity * 0.3,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}

// 主录音动画组件
interface RecordingAnimationProps {
  isActive: boolean;
  audioLevel: number;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export function RecordingAnimation({
  isActive,
  audioLevel,
  size = 'large',
  onClick,
}: RecordingAnimationProps) {
  const [breathScale, setBreathScale] = useState(1);
  
  const sizeConfig = {
    small: { container: 'w-24 h-24', paw: 'w-10 h-10' },
    medium: { container: 'w-32 h-32', paw: 'w-14 h-14' },
    large: { container: 'w-36 h-36', paw: 'w-16 h-16' },
  };
  
  // 呼吸效果
  useEffect(() => {
    if (!isActive) {
      setBreathScale(1);
      return;
    }
    
    const interval = setInterval(() => {
      setBreathScale(() => {
        const base = 1 + (audioLevel / 100) * 0.15;
        const breath = Math.sin(Date.now() / 300) * 0.05;
        return base + breath;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [isActive, audioLevel]);
  
  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* 主按钮 */}
      <button
        onClick={onClick}
        className={`
          relative ${sizeConfig[size].container} rounded-full
          flex items-center justify-center
          transition-all duration-300
          ${isActive 
            ? 'bg-gradient-to-br from-red-400 to-red-600 scale-110' 
            : 'bg-gradient-to-br from-orange-400 to-orange-500 hover:scale-105 active:scale-95'
          }
          shadow-2xl
        `}
        style={{
          boxShadow: isActive 
            ? `0 0 40px rgba(239, 68, 68, 0.4), 0 0 80px rgba(239, 68, 68, 0.2)` 
            : `0 0 30px rgba(249, 115, 22, 0.3)`,
        }}
      >
        {/* 有机波浪 */}
        {isActive && <OrganicWaves audioLevel={audioLevel} isActive={isActive} />}
        
        {/* 粒子效果 */}
        {isActive && <Particles isActive={isActive} />}
        
        {/* 爪印图标 */}
        <div
          className="relative z-10 transition-transform duration-100"
          style={{ transform: `scale(${breathScale})` }}
        >
          {isActive ? (
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 bg-white rounded-sm" />
            </div>
          ) : (
            <PawPrint className={`${sizeConfig[size].paw} text-white drop-shadow-lg`} />
          )}
        </div>
        
        {/* 外圈脉冲 */}
        {isActive && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping opacity-40" />
            <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-30" style={{ animationDelay: '0.3s' }} />
            <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20" style={{ animationDelay: '0.6s' }} />
          </>
        )}
      </button>
      
      {/* 声波可视化 */}
      <SoundWaveVisualization audioLevel={audioLevel} isActive={isActive} />
    </div>
  );
}

export default RecordingAnimation;
