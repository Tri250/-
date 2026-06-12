/**
 * RecordsPage - 记录页面（温情科技风格）
 *
 * 设计参考：
 * - 顶部"记录"标题 + 副标题
 * - 6列分类标签（全部/喂食/饮水/活动/健康/其他）
 * - 时间线列表（彩色圆点 + 类别图标）
 * - 折叠日期组
 */

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Apple,
  Droplet,
  Footprints,
  Activity,
  FileText,
  Calendar,
  Sparkles,
  Dog,
} from 'lucide-react';
import { WarmContainer } from '../components/WarmContainer';
import { useAppStore } from '../store/appStore';

interface RecordItem {
  id: string;
  type: 'feed' | 'water' | 'activity' | 'health' | 'other';
  title: string;
  subtitle: string;
  time: string;
  emoji?: string;
}

const typeConfig = {
  feed: { icon: Apple, label: '喂食', color: '#f59e0b', bg: '#fef3c7' },
  water: { icon: Droplet, label: '饮水', color: '#3b82f6', bg: '#dbeafe' },
  activity: { icon: Footprints, label: '活动', color: '#10b981', bg: '#d1fae5' },
  health: { icon: Activity, label: '健康', color: '#a78bfa', bg: '#ede9fe' },
  other: { icon: FileText, label: '其他', color: '#fbbf24', bg: '#fef3c7' },
  all: { icon: Sparkles, label: '全部', color: '#f97316', bg: '#ffedd5' },
};

export const RecordsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentPet } = useAppStore();
  const petName = currentPet?.name || 'JOJO';
  const [activeTab, setActiveTab] = useState<keyof typeof typeConfig>('all');
  const [expandedDate, setExpandedDate] = useState<string | null>('2024-05-19');

  const records2024_05_20: RecordItem[] = [
    {
      id: '1',
      type: 'feed',
      title: '喂食',
      subtitle: '喂食了 120g 狗粮',
      time: '08:30',
    },
    {
      id: '2',
      type: 'water',
      title: '饮水',
      subtitle: '喝水 200ml',
      time: '10:15',
    },
    {
      id: '3',
      type: 'activity',
      title: '活动',
      subtitle: '散步 30 分钟，消耗 120 kcal',
      time: '14:00',
      emoji: '🐕',
    },
    {
      id: '4',
      type: 'health',
      title: '健康',
      subtitle: '体重 12.5kg',
      time: '20:00',
    },
    {
      id: '5',
      type: 'other',
      title: '其他',
      subtitle: '洗澡，驱虫',
      time: '21:30',
    },
  ];

  const records2024_05_19_summary = {
    feed: 2,
    water: 3,
    activity: 1,
    health: 1,
    other: 1,
  };

  const tabs: Array<keyof typeof typeConfig> = ['all', 'feed', 'water', 'activity', 'health', 'other'];

  return (
    <WarmContainer>
      {/* 顶部 */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">记录</h1>
        <p className="text-sm text-gray-500 mt-1">记录每一次陪伴，见证每一点成长</p>
      </div>

      {/* 宠物主图区域 */}
      <div
        className="mx-4 mt-3 rounded-2xl overflow-hidden relative"
        style={{
          height: '120px',
          background: 'linear-gradient(135deg, #f5e6d3 0%, #d4a574 100%)',
        }}
      >
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Dog className="w-20 h-20 text-amber-900/30" strokeWidth={1} />
        </div>
      </div>

      {/* 分类标签 */}
      <div className="px-4 mt-4">
        <div
          className="rounded-2xl p-3 flex items-center justify-between"
          style={{
            background: 'rgba(255, 251, 244, 0.95)',
            border: '1px solid rgba(255, 220, 180, 0.4)',
          }}
        >
          {tabs.map((tab) => {
            const config = typeConfig[tab];
            const Icon = config.icon;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex flex-col items-center gap-1 flex-1 active:scale-95 transition-transform"
              >
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{
                    background: isActive ? config.color : config.bg,
                  }}
                >
                  <Icon
                    className="w-4.5 h-4.5"
                    style={{ color: isActive ? '#ffffff' : config.color }}
                    strokeWidth={2}
                  />
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    isActive ? '' : 'text-gray-500'
                  }`}
                  style={isActive ? { color: config.color } : {}}
                >
                  {config.label}
                </span>
                {isActive && (
                  <span
                    className="block w-6 h-0.5 rounded-full"
                    style={{ background: config.color }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        {/* 2024年5月20日 */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-base font-bold text-gray-900">2024年5月20日</h3>
            <button
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: 'rgba(249, 115, 22, 0.1)',
                color: '#ea580c',
              }}
            >
              <Calendar className="w-3 h-3" />
              选择日期
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* 时间线列表 */}
          <div className="relative pl-2">
            {/* 时间轴线 */}
            <div
              className="absolute left-[19px] top-3 bottom-3 w-px"
              style={{
                background:
                  'repeating-linear-gradient(to bottom, #d1d5db 0, #d1d5db 4px, transparent 4px, transparent 8px)',
              }}
            />
            <div className="space-y-2.5">
              {records2024_05_20.map((record) => {
                const config = typeConfig[record.type];
                const Icon = config.icon;
                return (
                  <button
                    key={record.id}
                    onClick={() => onNavigate('records')}
                    className="relative flex items-center gap-3 w-full p-3 rounded-xl text-left active:scale-[0.99] transition-transform"
                    style={{
                      background: 'rgba(255, 251, 244, 0.85)',
                      border: '1px solid rgba(255, 220, 180, 0.35)',
                    }}
                  >
                    {/* 圆点 */}
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 z-10"
                      style={{ background: config.color }}
                    />
                    {/* 图标 */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: config.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config.color }} strokeWidth={2} />
                    </div>
                    {/* 文本 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          {record.title}
                        </span>
                        {record.type === 'feed' && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#92400e' }}
                          >
                            主食
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-500 mt-0.5 truncate">
                        {record.subtitle}
                      </p>
                    </div>
                    {/* 时间和箭头 */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[11px] text-gray-400 tabular-nums">{record.time}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                    {/* 缩略图（活动记录） */}
                    {record.emoji && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center text-base">
                        {record.emoji}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2024年5月19日（折叠） */}
        <div>
          <button
            onClick={() => setExpandedDate(expandedDate === '2024-05-19' ? null : '2024-05-19')}
            className="flex items-center justify-between w-full mb-3 px-1"
          >
            <h3 className="text-base font-bold text-gray-900">2024年5月19日</h3>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                expandedDate === '2024-05-19' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedDate === '2024-05-19' ? (
            <div className="rounded-xl p-3 flex items-center justify-around"
              style={{
                background: 'rgba(255, 251, 244, 0.85)',
                border: '1px solid rgba(255, 220, 180, 0.35)',
              }}
            >
              {Object.entries(records2024_05_19_summary).map(([key, value]) => {
                const config = typeConfig[key as keyof typeof typeConfig];
                const Icon = config.icon;
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: config.bg }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                    </div>
                    <span className="text-[11px] text-gray-500">{value}次</span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="h-4" />
      </main>
    </WarmContainer>
  );
};

export default RecordsPage;
