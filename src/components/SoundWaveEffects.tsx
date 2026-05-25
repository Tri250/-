import React from 'react';

interface SoundWaveProps {
  isActive?: boolean;
  className?: string;
  color?: string;
}

export const SoundWave: React.FC<SoundWaveProps> = ({ 
  isActive = true, 
  className = '', 
  color = 'from-orange-500 to-cyan-500' 
}) => {
  return (
    <div className={`flex items-end justify-center gap-2 h-16 ${className}`}>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`w-2 rounded-full bg-gradient-to-t ${color} shadow-lg ${
            isActive ? 'animate-soundwave' : 'opacity-40'
          }`}
          style={{
            height: `${30 + Math.random() * 40}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.6 + Math.random() * 0.4}s`
          }}
        />
      ))}
    </div>
  );
};

interface AuroraBackgroundProps {
  className?: string;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-purple-400/20 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
    </div>
  );
};

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <span className={`bg-gradient-to-r from-orange-600 via-orange-500 to-cyan-600 bg-clip-text text-transparent animate-gradient-shift ${className}`}>
      {children}
    </span>
  );
};

interface PulseGlowProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export const PulseGlow: React.FC<PulseGlowProps> = ({ 
  children, 
  color = 'shadow-orange-400/50', 
  className = '' 
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-r from-orange-500 to-cyan-500 rounded-2xl blur-xl opacity-50 animate-pulse-glow`} />
      <div className="relative">
        {children}
      </div>
    </div>
  );
};
