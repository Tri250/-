import React from 'react';

interface EmotionIconProps {
  className?: string;
  size?: number;
}

export const EmotionIcons = {
  happy: ({ className = '', size = 24 }: EmotionIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2"/>
      <circle cx="8" cy="10" r="1.5" fill="#22c55e"/>
      <circle cx="16" cy="10" r="1.5" fill="#22c55e"/>
      <path d="M8 14 C10 17, 14 17, 16 14" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 8 Q7 6, 10 7" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 8 Q17 6, 14 7" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  curious: ({ className = '', size = 24 }: EmotionIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#f3e8ff" stroke="#a855f7" strokeWidth="2"/>
      <circle cx="8" cy="10" r="1.5" fill="#a855f7"/>
      <circle cx="16" cy="10" r="1.5" fill="#a855f7"/>
      <ellipse cx="12" cy="14" rx="2" ry="1.5" fill="#a855f7"/>
      <path d="M6 7 L8 9" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 7 L16 9" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  anxious: ({ className = '', size = 24 }: EmotionIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#fef9c3" stroke="#eab308" strokeWidth="2"/>
      <circle cx="8" cy="10" r="1.5" fill="#eab308"/>
      <circle cx="16" cy="10" r="1.5" fill="#eab308"/>
      <path d="M8 15 Q12 13, 16 15" stroke="#eab308" strokeWidth="2" strokeLinecap="round"/>
      <path d="M5 6 L7 8" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M19 6 L17 8" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 5 Q9 3, 11 4" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M15 5 Q15 3, 13 4" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  angry: ({ className = '', size = 24 }: EmotionIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#fee2e2" stroke="#ef4444" strokeWidth="2"/>
      <circle cx="8" cy="10" r="1.5" fill="#ef4444"/>
      <circle cx="16" cy="10" r="1.5" fill="#ef4444"/>
      <path d="M8 15 Q12 13, 16 15" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 8 L9 10" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 8 L15 10" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 5 L10 7" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16 5 L14 7" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  needs: ({ className = '', size = 24 }: EmotionIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2"/>
      <circle cx="8" cy="10" r="2" fill="#3b82f6"/>
      <circle cx="16" cy="10" r="2" fill="#3b82f6"/>
      <ellipse cx="12" cy="15" rx="2" ry="1.5" fill="#3b82f6"/>
      <path d="M6 8 Q7 6, 9 8" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 8 Q17 6, 15 8" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  calm: ({ className = '', size = 24 }: EmotionIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#f3f4f6" stroke="#6b7280" strokeWidth="2"/>
      <circle cx="8" cy="10" r="1.5" fill="#6b7280"/>
      <circle cx="16" cy="10" r="1.5" fill="#6b7280"/>
      <path d="M8 14 L16 14" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  
  excited: ({ className = '', size = 24 }: EmotionIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#fce7f3" stroke="#ec4899" strokeWidth="2"/>
      <path d="M8 9 C8 7, 8 11, 8 9" stroke="#ec4899" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 9 C16 7, 16 11, 16 9" stroke="#ec4899" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 14 C10 17, 14 17, 16 14" stroke="#ec4899" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="6" cy="7" r="1" fill="#ec4899"/>
      <circle cx="18" cy="7" r="1" fill="#ec4899"/>
      <circle cx="7" cy="15" r="1" fill="#ec4899"/>
      <circle cx="17" cy="15" r="1" fill="#ec4899"/>
    </svg>
  ),
  
  safe: ({ className = '', size = 24 }: EmotionIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#ccfbf1" stroke="#14b8a6" strokeWidth="2"/>
      <circle cx="8" cy="10" r="1.5" fill="#14b8a6"/>
      <circle cx="16" cy="10" r="1.5" fill="#14b8a6"/>
      <path d="M8 14 C10 16, 14 16, 16 14" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 8 Q7 7, 9 8" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 8 Q17 7, 15 8" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

export type EmotionType = keyof typeof EmotionIcons;
