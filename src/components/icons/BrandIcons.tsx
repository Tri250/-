import React from 'react';

interface BrandIconProps {
  className?: string;
  size?: number;
}

export const BrandIcons = {
  xiaomi: ({ className = '', size = 24 }: BrandIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#ff6900"/>
      <path d="M12 4 C8 4, 6 6, 6 10 L6 14 C6 18, 8 20, 12 20 C16 20, 18 18, 18 14 L18 10 C18 6, 16 4, 12 4 Z" fill="white"/>
      <circle cx="9" cy="10" r="1.5" fill="#ff6900"/>
      <circle cx="15" cy="10" r="1.5" fill="#ff6900"/>
      <path d="M9 14 Q12 16, 15 14" stroke="#ff6900" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  
  huawei: ({ className = '', size = 24 }: BrandIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#cf0a2c"/>
      <path d="M12 6 L18 18 L6 18 Z" fill="white"/>
      <path d="M12 10 L14.5 16 L9.5 16 Z" fill="#cf0a2c"/>
    </svg>
  ),
  
  honor: ({ className = '', size = 24 }: BrandIconProps) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#000000"/>
      <path d="M6 8 L12 16 L18 8" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 8 L12 14 L16 8" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export type BrandType = keyof typeof BrandIcons;
