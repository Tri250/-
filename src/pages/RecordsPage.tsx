/**
 * RecordsPage 2026 - 顶级设计
 *
 * 借鉴：Keep、Notion、Apple Notes 时间线
 * 特性：
 * - 渐变Hero（薄荷绿+橙）
 * - 时间线列表（发光圆点）
 * - 6列分类毛玻璃标签
 * - 折叠日期组（手风琴动画）
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import { shadows } from '../styles/design-system';
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
  feed: { icon: Apple, label: '喂食', color: '#F59E0B', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' },
  water: { icon: Droplet, label: '饮水', color: '#3B82F6', bg: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)' },
  activity: { icon: Footprints, label: '活动', color: '#10B981', bg: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)' },
  health: { icon: Activity, label: '健康', color: '#A855F7', bg: 'linear-gradient(135deg, #F3E8FF 0%, #FAF5FF 100%)' },
  other: { icon: FileText, label: '其他', color: '#FBBF24', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' },
  all: { icon: Sparkles, label: '全部', color: '#F97316', bg: 'linear-gradient(135deg, #FFEDD5 0%, #FFF7ED 100%)' },
};

export const RecordsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentPet } = useAppStore();
  const petName = currentPet?.name || 'JOJO';
  const [activeTab, setActiveTab] = useState<keyof typeof typeConfig>('all');
  const [expandedDate, setExpandedDate] = useState<string | null>('2024-05-19');

  const records2024_05_20: RecordItem[] = [
    { id: '1', type: 'feed', title: '喂食', subtitle: '喂食了 120g 狗粮', time: '08:30' },
    { id: '2', type: 'water', title: '饮水', subtitle: '喝水 200ml', time: '10:15' },
    { id: '3', type: 'activity', title: '活动', subtitle: '散步 30 分钟，消耗 120 kcal', time: '14:00', emoji: '🐕' },
    { id: '4', type: 'health', title: '健康', subtitle: '体重 12.5kg', time: '20:00' },
    { id: '5', type: 'other', title: '其他', subtitle: '洗澡，驱虫', time: '21:30' },
  ];

  const records2024_05_19_summary = { feed: 2, water: 3, activity: 1, health: 1, other: 1 };
  const tabs: Array<keyof typeof typeConfig> = ['all', 'feed', 'water', 'activity', 'health', 'other'];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAF8F5' }}>
      {/* ===== 渐变Hero ===== */}
      <div className="relative" style={{
        background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 50%, #0E7490 100%)'
      }}>
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at top right, rgba(110, 231, 183, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse at bottom left, rgba(251, 146, 60, 0.3) 0%, transparent 50%)
            `,
          }}
        />
        <StatusBar dark={false} />

        <div className="relative px-5 pt-1 pb-5">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[28px] font-bold text-white tracking-tight"
          >
            记录
          </motion.h1>
          <p className="text-[12px] text-white/85 mt-1 font-medium">记录每一次陪伴，见证每一点成长</p>
        </div>
      </div>

      <main className="relative px-4 -mt-3 space-y-3.5">
        {/* 分类标签毛玻璃 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '18px',
            boxShadow: shadows.DEFAULT,
            border: '0.5px solid rgba(255, 255, 255, 0.8)',
          }}
        >
          <div className="p-2.5 flex items-center justify-between">
            {tabs.map((tab) => {
              const config = typeConfig[tab];
              const Icon = config.icon;
              const isActive = activeTab === tab;
              return (
                <motion.button
                  key={tab}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveTab(tab)}
                  className="flex flex-col items-center gap-0.5 flex-1 py-1"
                >
                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all"
                    style={{
                      background: isActive ? `linear-gradient(135deg, ${config.color} 0%, ${config.color}DD 100%)` : 'transparent',
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: isActive ? '#fff' : config.color }}
                      strokeWidth={2.5}
                    />
                  </div>
                  <span
                    className="text-[10.5px] tracking-tight"
                    style={{
                      color: isActive ? config.color : '#6B7280',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {config.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* 2024年5月20日 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">2024年5月20日</h3>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{
                background: 'rgba(249, 115, 22, 0.1)',
                color: '#EA580C',
              }}
            >
              <Calendar className="w-3 h-3" strokeWidth={2.5} />
              选择日期
              <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
            </motion.button>
          </div>

          {/* 时间线列表 */}
          <div className="relative pl-2.5">
            {/* 时间轴线 */}
            <div
              className="absolute left-[19px] top-4 bottom-4 w-px"
              style={{
                background: 'linear-gradient(180deg, #F97316 0%, #A855F7 50%, #3B82F6 100%)',
                opacity: 0.3,
              }}
            />
            <div className="space-y-2.5">
              {records2024_05_20.map((record, i) => {
                const config = typeConfig[record.type];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative flex items-center gap-3 w-full p-3 rounded-2xl cursor-pointer"
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      boxShadow: shadows.sm,
                      border: '0.5px solid rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    {/* 圆点（带光晕） */}
                    <div
                      className="absolute -left-[6px] w-3 h-3 rounded-full z-10"
                      style={{
                        background: config.color,
                        boxShadow: `0 0 0 3px #fff, 0 0 8px ${config.color}80`,
                      }}
                    />
                    {/* 图标 */}
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ml-3"
                      style={{
                        background: config.bg,
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config.color }} strokeWidth={2.5} />
                    </div>
                    {/* 文本 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13.5px] font-semibold text-gray-900 tracking-tight">
                          {record.title}
                        </span>
                        {record.type === 'feed' && (
                          <span
                            className="px-1.5 py-0 rounded text-[9.5px] font-bold"
                            style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#92400E' }}
                          >
                            主食
                          </span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-gray-500 mt-0.5 truncate font-medium">
                        {record.subtitle}
                      </p>
                    </div>
                    {/* 时间和箭头 */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[10.5px] text-gray-400 font-semibold tabular-nums" style={{ fontFeatureSettings: '"tnum"' }}>
                        {record.time}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* 2024年5月19日（折叠） */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <button
            onClick={() => setExpandedDate(expandedDate === '2024-05-19' ? null : '2024-05-19')}
            className="flex items-center justify-between w-full mb-3 px-1"
          >
            <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">2024年5月19日</h3>
            <motion.div animate={{ rotate: expandedDate === '2024-05-19' ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-gray-400" strokeWidth={2.5} />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedDate === '2024-05-19' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-2xl p-3 flex items-center justify-around mb-1"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    boxShadow: shadows.sm,
                    border: '0.5px solid rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {Object.entries(records2024_05_19_summary).map(([key, value]) => {
                    const config = typeConfig[key as keyof typeof typeConfig];
                    const Icon = config.icon;
                    return (
                      <div key={key} className="flex items-center gap-1.5">
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ background: config.bg }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: config.color }} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10.5px] text-gray-500 font-semibold">
                          {value}次
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="h-2" />
      </main>
    </div>
  );
};

export default RecordsPage;
