import React, { useState } from 'react';
import { ArrowLeft, Settings, Bell, User } from 'lucide-react';
import { HealingStatusCard } from './HealingStatusCard';
import { HealingFAB } from './HealingFAB';
import { HealingPageLayout, InfoSection, HealingCard, HealingTag } from './HealingPageLayout';
import '../styles/healing-animations.css';
import { RecordType } from '../types/health-record';

interface DemoRecord {
  id: string;
  type: RecordType;
  title: string;
  timestamp: string;
}

export const HealingUIDemo: React.FC = () => {
  const [records, setRecords] = useState<DemoRecord[]>([]);

  const handleRecordAction = (type: RecordType) => {
    const newRecord: DemoRecord = {
      id: Date.now().toString(),
      type,
      title: type === 'text' ? '文字记录' :
             type === 'voice' ? '语音记录' :
             type === 'photo' ? '拍照记录' :
             type === 'pdf' ? 'PDF文档' : '视频记录',
      timestamp: new Date().toLocaleString('zh-CN'),
    };
    setRecords(prev => [newRecord, ...prev]);
    alert(`已添加${newRecord.title}`);
  };

  // 模拟宠物数据
  const petStatus = {
    hunger: 85,
    mood: 92,
    health: 95,
    energy: 78,
    hydration: 82,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 via-white to-peach-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-neutral-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button className="p-2 rounded-full hover:bg-neutral-100 active:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </button>
          <h1 className="text-lg font-bold text-neutral-800">治愈系UI示例</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-neutral-100 active:bg-neutral-200 transition-colors">
              <Bell className="w-5 h-5 text-neutral-600" />
            </button>
            <button className="p-2 rounded-full hover:bg-neutral-100 active:bg-neutral-200 transition-colors">
              <Settings className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-28 px-4">
        {/* 宠物状态卡片 */}
        <section className="py-4">
          <div className="animate-fade-in-up">
            <HealingStatusCard
              petName="布丁"
              emotion="happy"
              status={petStatus}
              lastUpdated="刚刚"
            />
          </div>
        </section>

        {/* 宠物状态列表 */}
        <section className="py-4">
          <HealingPageLayout
            title="我的毛孩子"
            subtitle="记录每一个温馨瞬间"
            showBackButton={false}
          >
            <InfoSection
              title="宠物列表"
              icon={<User className="w-4 h-4 text-amber-600" />}
            >
              <div className="grid grid-cols-2 gap-3">
                {['团子', '豆豆', '小雪'].map((name, idx) => (
                  <HealingCard key={name} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                        idx === 0 ? 'from-amber-200 to-orange-300' :
                        idx === 1 ? 'from-blue-200 to-cyan-300' :
                        'from-pink-200 to-rose-300'
                      } flex items-center justify-center text-2xl`}>
                        {idx === 0 ? '🐱' : idx === 1 ? '🐶' : '🐰'}
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-800">{name}</div>
                        <div className="text-xs text-neutral-500">{idx === 0 ? '橘猫 · 2岁' : idx === 1 ? '柯基 · 1岁' : '垂耳兔 · 6个月'}</div>
                      </div>
                    </div>
                  </HealingCard>
                ))}
              </div>
            </InfoSection>

            <InfoSection
              title="今日提醒"
              icon={<Bell className="w-4 h-4 text-emerald-600" />}
            >
              <div className="space-y-2">
                <HealingCard className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">🍖</div>
                    <div>
                      <div className="font-medium text-neutral-700">喂食</div>
                      <div className="text-xs text-neutral-400">12:00 · 已完成</div>
                    </div>
                  </div>
                  <HealingTag variant="success" size="sm">完成</HealingTag>
                </HealingCard>

                <HealingCard className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">💧</div>
                    <div>
                      <div className="font-medium text-neutral-700">喝水</div>
                      <div className="text-xs text-neutral-400">14:00 · 待完成</div>
                    </div>
                  </div>
                  <HealingTag variant="warning" size="sm">提醒</HealingTag>
                </HealingCard>

                <HealingCard className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">💊</div>
                    <div>
                      <div className="font-medium text-neutral-700">驱虫药</div>
                      <div className="text-xs text-neutral-400">18:00 · 待完成</div>
                    </div>
                  </div>
                  <HealingTag variant="danger" size="sm">重要</HealingTag>
                </HealingCard>
              </div>
            </InfoSection>

            <InfoSection
              title="最近记录"
              icon={<User className="w-4 h-4 text-purple-600" />}
            >
              {records.length === 0 ? (
                <HealingCard className="p-6 text-center">
                  <div className="text-4xl mb-2">📝</div>
                  <div className="text-neutral-500 text-sm">点击下方按钮添加第一条记录</div>
                </HealingCard>
              ) : (
                <div className="space-y-2">
                  {records.map((record) => (
                    <HealingCard key={record.id} className="flex items-center justify-between p-3">
                      <div>
                        <div className="font-medium text-neutral-700">{record.title}</div>
                        <div className="text-xs text-neutral-400">{record.timestamp}</div>
                      </div>
                      <HealingTag variant="info" size="sm">
                        {record.type === 'text' ? '📝' :
                         record.type === 'voice' ? '🎤' :
                         record.type === 'photo' ? '📷' :
                         record.type === 'pdf' ? '📄' : '🎬'}
                      </HealingTag>
                    </HealingCard>
                  ))}
                </div>
              )}
            </InfoSection>
          </HealingPageLayout>
        </section>
      </main>

      {/* 治愈系悬浮按钮 */}
      <HealingFAB onAction={handleRecordAction} />

      {/* 装饰元素 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl animate-healing-float" />
        <div className="absolute top-40 right-10 w-24 h-24 bg-rose-200/20 rounded-full blur-2xl animate-healing-float-delay" />
        <div className="absolute bottom-40 left-20 w-20 h-20 bg-teal-200/20 rounded-full blur-2xl animate-healing-pulse" />
      </div>
    </div>
  );
};

export default HealingUIDemo;
