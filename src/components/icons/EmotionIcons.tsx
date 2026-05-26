// ============================================
// PawSync Pro - EmotionIcons.tsx
// 
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 动物主题情感图标组件（猫咪造型）
// ============================================

import React from 'react';

interface EmotionIconProps {
  className?: string;
  size?: number;
}

export const EmotionIcons = {
  happy: ({ className = '', size = 24 }: EmotionIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="36" rx="22" ry="18" fill="#FFB347"/>
      <ellipse cx="32" cy="36" rx="20" ry="16" fill="#FFD93D"/>
      <ellipse cx="20" cy="18" rx="8" ry="12" fill="#FFB347" transform="rotate(-20 20 18)"/>
      <ellipse cx="44" cy="18" rx="8" ry="12" fill="#FFB347" transform="rotate(20 44 18)"/>
      <ellipse cx="24" cy="32" rx="4" ry="5" fill="white"/>
      <ellipse cx="40" cy="32" rx="4" ry="5" fill="white"/>
      <circle cx="25" cy="33" r="2" fill="#333"/>
      <circle cx="41" cy="33" r="2" fill="#333"/>
      <ellipse cx="32" cy="40" rx="6" ry="4" fill="#FF8C42"/>
      <path d="M26 46 Q32 52, 38 46" stroke="#333" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M18 28 Q14 24, 18 20" stroke="#FF6B6B" strokeWidth="2" fill="none"/>
      <path d="M46 28 Q50 24, 46 20" stroke="#FF6B6B" strokeWidth="2" fill="none"/>
    </svg>
  ),
  
  anxious: ({ className = '', size = 24 }: EmotionIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="36" rx="22" ry="18" fill="#E8D5B7"/>
      <ellipse cx="32" cy="36" rx="20" ry="16" fill="#F5E6D3"/>
      <ellipse cx="20" cy="18" rx="8" ry="12" fill="#E8D5B7" transform="rotate(-20 20 18)"/>
      <ellipse cx="44" cy="18" rx="8" ry="12" fill="#E8D5B7" transform="rotate(20 44 18)"/>
      <ellipse cx="24" cy="32" rx="5" ry="6" fill="white"/>
      <ellipse cx="40" cy="32" rx="5" ry="6" fill="white"/>
      <circle cx="25" cy="34" r="2.5" fill="#333"/>
      <circle cx="41" cy="34" r="2.5" fill="#333"/>
      <path d="M20 28 L26 30" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
      <path d="M44 28 L38 30" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="32" cy="40" rx="5" ry="3" fill="#C4A77D"/>
      <path d="M27 46 Q32 44, 37 46" stroke="#333" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M28 48 L30 50 L32 48 L34 50 L36 48" stroke="#333" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  
  angry: ({ className = '', size = 24 }: EmotionIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="36" rx="22" ry="18" fill="#8B7355"/>
      <ellipse cx="32" cy="36" rx="20" ry="16" fill="#A0896C"/>
      <ellipse cx="20" cy="18" rx="8" ry="12" fill="#8B7355" transform="rotate(-20 20 18)"/>
      <ellipse cx="44" cy="18" rx="8" ry="12" fill="#8B7355" transform="rotate(20 44 18)"/>
      <ellipse cx="24" cy="32" rx="5" ry="6" fill="white"/>
      <ellipse cx="40" cy="32" rx="5" ry="6" fill="white"/>
      <circle cx="25" cy="34" r="3" fill="#333"/>
      <circle cx="41" cy="34" r="3" fill="#333"/>
      <path d="M19 26 L27 30" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
      <path d="M45 26 L37 30" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="32" cy="40" rx="5" ry="3" fill="#6B5344"/>
      <path d="M25 47 L32 44 L39 47" stroke="#333" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M26 49 L28 52" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
      <path d="M38 49 L36 52" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  
  needs: ({ className = '', size = 24 }: EmotionIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="36" rx="22" ry="18" fill="#D4A574"/>
      <ellipse cx="32" cy="36" rx="20" ry="16" fill="#E8C9A0"/>
      <ellipse cx="20" cy="18" rx="8" ry="12" fill="#D4A574" transform="rotate(-20 20 18)"/>
      <ellipse cx="44" cy="18" rx="8" ry="12" fill="#D4A574" transform="rotate(20 44 18)"/>
      <ellipse cx="24" cy="32" rx="5" ry="6" fill="white"/>
      <ellipse cx="40" cy="32" rx="5" ry="6" fill="white"/>
      <circle cx="25" cy="34" r="2" fill="#333"/>
      <circle cx="41" cy="34" r="2" fill="#333"/>
      <path d="M23 37 L23 39" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
      <path d="M41 37 L41 39" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="32" cy="42" rx="7" ry="5" fill="#333"/>
      <ellipse cx="32" cy="40" rx="3" ry="2" fill="#FF69B4"/>
      <path d="M18 40 Q16 36, 18 32" stroke="#FFB6C1" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M46 40 Q48 36, 46 32" stroke="#FFB6C1" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  
  neutral: ({ className = '', size = 24 }: EmotionIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="36" rx="22" ry="18" fill="#C0C0C0"/>
      <ellipse cx="32" cy="36" rx="20" ry="16" fill="#D3D3D3"/>
      <ellipse cx="20" cy="18" rx="8" ry="12" fill="#C0C0C0" transform="rotate(-20 20 18)"/>
      <ellipse cx="44" cy="18" rx="8" ry="12" fill="#C0C0C0" transform="rotate(20 44 18)"/>
      <ellipse cx="24" cy="32" rx="4" ry="5" fill="white"/>
      <ellipse cx="40" cy="32" rx="4" ry="5" fill="white"/>
      <circle cx="25" cy="33" r="2" fill="#666"/>
      <circle cx="41" cy="33" r="2" fill="#666"/>
      <ellipse cx="32" cy="40" rx="5" ry="3" fill="#A0A0A0"/>
      <path d="M27 46 L37 46" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

export type EmotionType = keyof typeof EmotionIcons;
