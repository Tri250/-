import { Share2, Copy, MessageCircle, Heart, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface ShareModalProps {
  title: string;
  content: string;
  petName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ title, content, petName, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `${title}\n\n${content}\n\n——来自 PawSync Pro`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PawSync Pro - 宠物心声',
          text: shareText,
        });
      } catch (error) {
        console.log('分享取消或失败');
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl animate-slide-up">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
        
        <Card variant="default" padding="large" className="rounded-t-3xl border-0 shadow-none">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-peach-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">分享给朋友</h3>
            <p className="text-sm text-gray-500 mt-1">让更多人了解毛孩子的心声</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-peach-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
            {petName && (
              <p className="text-xs text-gray-400 mt-2 text-right">—— {petName}</p>
            )}
          </div>

          <div className="flex gap-3 mb-4">
            <Button 
              variant="secondary" 
              className="flex-1 flex-col gap-1 py-4"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-6 h-6 text-green-500" />
              ) : (
                <Copy className="w-6 h-6" />
              )}
              <span className="text-xs">{copied ? '已复制' : '复制链接'}</span>
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 flex-col gap-1 py-4"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs">分享微信</span>
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 flex-col gap-1 py-4"
            >
              <Heart className="w-6 h-6" />
              <span className="text-xs">收藏</span>
            </Button>
          </div>

          <Button 
            className="w-full"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5 mr-2" />
            更多分享方式
          </Button>
        </Card>
      </div>
    </div>
  );
}