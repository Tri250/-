import React from 'react';

interface PetAvatarProps {
  petName: string;
  petType: 'dog' | 'cat' | 'other';
  emotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
}

const petColors = {
  dog: {
    primary: 'from-amber-400 to-orange-500',
    secondary: 'from-orange-400 to-red-500',
    fur: 'from-yellow-200 to-amber-300'
  },
  cat: {
    primary: 'from-indigo-400 to-purple-500',
    secondary: 'from-purple-400 to-pink-500',
    fur: 'from-slate-200 to-gray-300'
  },
  other: {
    primary: 'from-cyan-400 to-blue-500',
    secondary: 'from-blue-400 to-indigo-500',
    fur: 'from-blue-100 to-cyan-200'
  }
};

const emotionDecorations = {
  happy: (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1">
      <span className="text-lg animate-bounce">⭐</span>
      <span className="text-lg animate-bounce" style={{animationDelay: '0.2s'}}>✨</span>
      <span className="text-lg animate-bounce" style={{animationDelay: '0.4s'}}>🌟</span>
    </div>
  ),
  anxious: (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1">
      <span className="text-lg animate-pulse">💧</span>
      <span className="text-lg animate-pulse" style={{animationDelay: '0.3s'}}>💦</span>
    </div>
  ),
  angry: (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
      <span className="text-2xl animate-pulse">💢</span>
    </div>
  ),
  needs: (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-0.5">
      <span className="text-lg animate-bounce">❓</span>
      <span className="text-lg animate-bounce" style={{animationDelay: '0.2s'}}>💭</span>
    </div>
  ),
  neutral: (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
      <span className="text-lg animate-float">🌙</span>
    </div>
  )
};

export function PetAvatar({ petName, petType, emotion, size = 'md', isOnline = true }: PetAvatarProps) {
  const sizes = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
    xl: 'w-28 h-28 text-5xl'
  };

  const sizesGlow = {
    sm: '-inset-2',
    md: '-inset-3',
    lg: '-inset-4',
    xl: '-inset-6'
  };

  const sizesOrb = {
    sm: '-inset-4',
    md: '-inset-6',
    lg: '-inset-8',
    xl: '-inset-10'
  };

  const colors = petColors[petType];
  const initial = petName.charAt(0).toUpperCase();

  return (
    <div className="relative group">
      {/* 外层3D发光光环 */}
      <div className={`
        absolute ${sizesGlow[size]} bg-gradient-to-br ${colors.primary} 
        rounded-full blur-2xl opacity-30
        animate-breathing-glow
        group-hover:opacity-50 transition-opacity duration-500
      `} />

      {/* 中层脉冲光环 */}
      <div className={`
        absolute ${sizesOrb[size]} bg-gradient-to-br ${colors.secondary} 
        rounded-full blur-3xl opacity-20
        animate-pulse-ring
        group-hover:opacity-40 transition-opacity duration-500
      `} />

      {/* 主体内发光层 */}
      <div className={`
        absolute inset-0 bg-gradient-to-br ${colors.primary}
        rounded-full blur-xl opacity-50
        animate-aurora-flow
        group-hover:opacity-70 transition-opacity duration-500
      `} />

      {/* 主体头像容器 */}
      <div className={`
        relative ${sizes[size]}
        bg-gradient-to-br ${colors.primary} 
        rounded-full shadow-2xl 
        flex items-center justify-center
        transform transition-all duration-500
        group-hover:scale-105 group-hover:rotate-3
        animate-elastic-scale
        ring-4 ring-white/30
      `}>
        {/* 内层渐变效果 */}
        <div className={`
          absolute inset-1 bg-gradient-to-br ${colors.fur}
          rounded-full opacity-40
        `} />

        {/* 高光效果 */}
        <div className={`
          absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent
          rounded-full
        `} />

        {/* 宠物文字首字母 */}
        <span className={`
          relative z-10 font-black text-white
          drop-shadow-lg
          ${size === 'xl' ? 'text-4xl' : ''}
        `}>
          {initial}
        </span>

        {/* 宠物类型图标装饰 */}
        <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-lg animate-bounce-in">
          <span className="text-sm">
            {petType === 'dog' ? '🐕' : petType === 'cat' ? '🐈' : '🐾'}
          </span>
        </div>

        {/* 在线状态指示器 */}
        {isOnline && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white shadow-lg animate-pulse-ring">
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-30" />
          </div>
        )}
      </div>

      {/* 情绪装饰 */}
      <div className="z-20">
        {emotionDecorations[emotion]}
      </div>

      {/* 宠物名字悬停显示 */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white text-xs px-3 py-1.5 rounded-full shadow-xl animate-bounce-in whitespace-nowrap border border-slate-700/50">
          {petName}
        </div>
      </div>
    </div>
  );
}

export function PetMemoryBadge({ 
  petName, 
  memoryCount, 
  daysTogether 
}: { 
  petName: string; 
  memoryCount: number; 
  daysTogether: number; 
}) {
  return (
    <div className="relative p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl border border-pink-100/50 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg animate-bounce-soft">
          <span className="text-2xl">💝</span>
        </div>
        <div className="flex-1">
          <h4 className="font-black text-slate-800 text-sm">与 {petName} 在一起</h4>
          <div className="flex gap-4 text-xs">
            <span className="text-orange-600 font-semibold">✨ {memoryCount} 个记忆</span>
            <span className="text-pink-600 font-semibold">💕 {daysTogether} 天陪伴</span>
          </div>
        </div>
      </div>
      
      {/* 装饰粒子 */}
      <div className="absolute top-2 right-4 flex gap-1">
        <span className="text-xs animate-float">❤️</span>
        <span className="text-xs animate-float" style={{animationDelay: '0.5s'}}>💖</span>
        <span className="text-xs animate-float" style={{animationDelay: '1s'}}>💕</span>
      </div>
    </div>
  );
}
