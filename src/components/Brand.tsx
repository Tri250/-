import React from 'react';

export function BrandLogo({ size = 48, className = '' }: { size?: number, className?: string }) {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-400 to-cyan-500 rounded-2xl animate-gradient" />
      <div className="absolute inset-1 bg-gradient-to-br from-white/30 to-transparent rounded-xl" />
      <div className="relative text-2xl font-black text-white tracking-tight drop-shadow-lg">
        🐾
      </div>
    </div>
  );
}

export function BrandLogoText({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-orange-600 via-orange-500 to-cyan-600 bg-clip-text text-transparent tracking-tight">
        PawSync Pro
      </h1>
      <p className="text-xs text-slate-500 font-medium">爪印同频 · AI守护版</p>
    </div>
  );
}

export function BrandBadge({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`
      inline-flex items-center gap-1.5 
      px-3 py-1 rounded-full
      bg-gradient-to-r from-orange-500/10 to-cyan-500/10
      border border-orange-500/20
      text-orange-700 text-xs font-semibold
      ${className}
    `}>
      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-cyan-500 animate-pulse" />
      {children}
    </div>
  );
}
