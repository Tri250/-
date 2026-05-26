import { Gift, Users, Zap, Heart, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface ReferralProgramProps {
  className?: string;
}

export function ReferralProgram({ className }: ReferralProgramProps) {
  const [copied, setCopied] = useState(false);
  const referralCode = 'PAW' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const benefits = [
    { icon: Gift, title: '分享快乐', desc: '邀请好友一起关爱宠物' },
    { icon: Users, title: '共同成长', desc: '和朋友一起学习养宠知识' },
    { icon: Zap, title: '解锁成就', desc: '邀请好友获得专属徽章' },
  ];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败', error);
    }
  };

  return (
    <Card variant="gradient" padding="large" className={className}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-peach-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">邀请好友一起养宠</h3>
        <p className="text-sm text-gray-500 mt-1">好东西要和好朋友分享</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div key={index} className="text-center">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-xs font-semibold text-gray-700">{benefit.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{benefit.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">我的邀请码</span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-orange-500 text-sm font-medium hover:text-orange-600"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <div className="bg-orange-50 rounded-lg px-4 py-3 text-center">
          <span className="text-2xl font-bold text-orange-500 tracking-widest">{referralCode}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-500" />
          <span className="text-gray-600">已邀请 <span className="font-bold text-orange-500">0</span> 人</span>
        </div>
        <Button variant="secondary" size="small">
          查看邀请记录
        </Button>
      </div>
    </Card>
  );
}