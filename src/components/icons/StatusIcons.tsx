import React from 'react';

interface StatusIconProps {
  className?: string;
  size?: number;
}

export const StatusIcons = {
  online: ({ className = '', size = 12 }: StatusIconProps) => (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <span 
        className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-200"
        style={{ width: size, height: size }}
      />
    </div>
  ),
  
  offline: ({ className = '', size = 12 }: StatusIconProps) => (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <span 
        className="w-3 h-3 bg-gray-400 rounded-full"
        style={{ width: size, height: size }}
      />
    </div>
  ),
  
  error: ({ className = '', size = 12 }: StatusIconProps) => (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <span 
        className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-200"
        style={{ width: size, height: size }}
      />
    </div>
  ),
  
  connecting: ({ className = '', size = 12 }: StatusIconProps) => (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <span 
        className="w-3 h-3 bg-yellow-500 rounded-full animate-ping shadow-lg shadow-yellow-200"
        style={{ width: size, height: size }}
      />
    </div>
  ),
};

export type StatusType = keyof typeof StatusIcons;
