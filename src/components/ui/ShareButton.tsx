/**
 * 跨平台分享按钮组件示例
 *
 * 演示如何使用 PlatformService 确保 Android 和 Web 功能一致性
 */

import React from 'react';
import { Share2, Check, Copy, AlertCircle } from 'lucide-react';
import { ShareService } from '../lib/platformService';
import { Button } from './ui/Button';
import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'copied'>('idle');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    setStatus('idle');

    try {
      const success = await ShareService.share({
        title,
        text,
        url,
        dialogTitle: '分享到',
      });

      if (success) {
        setStatus('success');
        // 3秒后重置状态
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        // 尝试复制到剪贴板
        try {
          await navigator.clipboard.writeText(`${title}\n${text}${url ? '\n' + url : ''}`);
          setStatus('copied');
          setTimeout(() => setStatus('idle'), 3000);
        } catch {
          setStatus('error');
        }
      }
    } catch (error) {
      console.error('[ShareButton] Share failed:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <Check className="w-4 h-4" />;
      case 'copied':
        return <Copy className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Share2 className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return '已分享';
      case 'copied':
        return '已复制';
      case 'error':
        return '分享失败';
      default:
        return '分享';
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      disabled={loading}
      className={`${className} ${status === 'success' ? 'bg-green-500 hover:bg-green-600' : ''} ${status === 'error' ? 'bg-red-500 hover:bg-red-600' : ''}`}
      leftIcon={getStatusIcon()}
    >
      {loading ? '分享中...' : getStatusText()}
    </Button>
  );
};

/**
 * 带触觉反馈的按钮组件
 */
interface HapticButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  hapticStyle?: 'light' | 'medium' | 'heavy' | 'selection';
  disabled?: boolean;
  className?: string;
}

export const HapticButton: React.FC<HapticButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  hapticStyle = 'medium',
  disabled = false,
  className = '',
}) => {
  const { HapticsService } = require('../lib/platformService');

  const handleClick = async () => {
    // 触发触觉反馈
    await HapticsService[hapticStyle]();
    // 执行点击回调
    onClick();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </Button>
  );
};

/**
 * 带权限检查的相机按钮
 */
interface CameraButtonProps {
  onCapture: (imageData: string) => void;
  onError?: (error: Error) => void;
  quality?: number;
  className?: string;
}

export const CameraButton: React.FC<CameraButtonProps> = ({
  onCapture,
  onError,
  quality = 80,
  className = '',
}) => {
  const { CameraService } = require('../lib/platformService');
  const [capturing, setCapturing] = useState(false);

  const handleCapture = async () => {
    setCapturing(true);

    try {
      // 检查权限
      const hasPermission = await CameraService.checkPermission();
      if (!hasPermission) {
        const granted = await CameraService.requestPermission();
        if (!granted) {
          throw new Error('Camera permission denied');
        }
      }

      // 获取照片
      const imageData = await CameraService.getPhoto({
        quality,
        allowEditing: false,
        resultType: 'base64',
      });

      if (imageData) {
        onCapture(imageData);
      } else {
        throw new Error('Failed to capture image');
      }
    } catch (error) {
      console.error('[CameraButton] Capture failed:', error);
      onError?.(error as Error);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="lg"
      onClick={handleCapture}
      disabled={capturing}
      className={className}
      leftIcon={<div className="camera-icon" />}
    >
      {capturing ? '拍摄中...' : '拍照'}
    </Button>
  );
};
