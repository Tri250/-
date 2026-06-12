/**
 * HealthPage V2 - 奶油极简风
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight, Scale, Thermometer, Heart, Wind, Calendar, Edit3,
  Syringe, Bug, Sparkles, Play, Signal, Wifi, BatteryFull,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

const colors = {
  bg: '#FDF8F3', card: '#FFFFFF', textPrimary: '#1A1A1A',
  textSecondary: '#666666', brand: '#F97316', online: '#10B981',
  blue: '#60A5FA', green: '#34D399', orange: '#FB923C', purple: '#A78BFA',
};

export default function HealthPage() {
  const { currentPet } = useAppStore();
  const [activeTab, setActiveTab] = useState<'7d' | '30d' | '90d'>('7d');
  const petName = currentPet?.name || 'JOJO';

  const metrics = [
    { icon: Scale, label: '体重', value: '12.5', unit: 'kg', color: colors.orange },
    { icon: Thermometer, label: '体温', value: '38.6', unit: '°C', color: colors.blue },
    { icon: Heart, label: '心率', value: '120', unit: '次/分', color: '#EF4444' },
    { icon: Wind, label: '呼吸', value: '20', unit: '次/分', color: colors.purple },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: colors.bg }}>
      {/* 状态栏 */}
      <div className="flex items-center justify-between px-6 pt-3 pb-1">
        <span className="text-[15px] font-semibold text-gray-900">9:41</span>
        <div className="flex items-center gap-1">
          <Signal className="w-4 h-4 text-gray-900" strokeWidth={2.5} />
          <Wifi className="w-4 h-4 text-gray-900" strokeWidth={2.5} />
          <BatteryFull className="w-5 h-5 text-gray-900" strokeWidth={2} />
        </div>
      </div>

      <main className="px-4 pt-4 space-y-4">
        {/* 标题 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[24px] font-light text-gray-900">健康</h1>
          <p className="text-[13px] text-gray-500 mt-1">科学管理健康，守护萌宠成长</p>
        </motion.div>

        {/* 宠物信息 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex items-center gap-3 p-4" style={{ background: colors.card, borderRadius: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        >
          <div className="w-14 h-14 rounded-full overflow-hidden" style={{ border: '2px solid #fff' }}>
            <img src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop&auto=format" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[18px] font-light text-gray-900">{petName}</span>
              <span className="text-blue-500">♂</span>
            </div>
            <p className="text-[12px] text-gray-500">柯基犬 · 2岁</p>
          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium" style={{ background: colors.brand + '15', color: colors.brand }}>
            <Edit3 className="w-3 h-3" />健康档案
          </button>
        </motion.div>

        {/* 健康状态 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-4" style={{ background: colors.card, borderRadius: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-medium text-gray-900">健康状态</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: '#D1FAE5', color: '#047857' }}>优秀</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">最近更新：2024.05.20</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-1" style={{ background: `${m.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: m.color }} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] text-gray-500">{m.label}</span>
                  <div className="flex items-baseline gap-0.5 mt-0.5">
                    <span className="text-[16px] font-light text-gray-900 tabular-nums">{m.value}</span>
                    <span className="text-[10px] text-gray-500">{m.unit}</span>
                  </div>
                  <span className="text-[9px] mt-1 px-1.5 py-0 rounded" style={{ background: '#D1FAE5', color: '#047857' }}>正常</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 健康趋势 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="p-4" style={{ background: colors.card, borderRadius: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[16px] font-medium text-gray-900">健康趋势</span>
            <div className="flex items-center gap-1 p-0.5 rounded-full" style={{ background: '#F3F4F6' }}>
              {(['7d', '30d', '90d'] as const).map((t) => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium ${activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                >
                  {t === '7d' ? '7天' : t === '30d' ? '30天' : '90天'}
                </button>
              ))}
            </div>
          </div>
          {/* 简化图表 */}
          <div className="h-32 flex items-end justify-between px-2">
            {[40, 45, 42, 48, 50, 47, 52].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-2 rounded-full" style={{ height: `${h * 1.5}px`, background: i === 6 ? colors.brand : '#E5E7EB' }} />
                <span className="text-[9px] text-gray-400">05/{14 + i}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 疫苗与驱虫 + 健康提醒 */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-3" style={{ background: colors.card, borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <h3 className="text-[14px] font-medium text-gray-900 mb-3">疫苗与驱虫</h3>
            <div className="space-y-2">
              {[
                { name: '狂犬疫苗', status: '已完成', color: '#10B981' },
                { name: '体内驱虫', status: '即将到期', color: '#F59E0B' },
                { name: '体外驱虫', status: '已完成', color: '#10B981' },
              ].map((v, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-700">{v.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${v.color}15`, color: v.color }}>{v.status}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-3" style={{ background: colors.card, borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-medium text-gray-900">健康提醒</h3>
              <span className="text-[10px]" style={{ color: colors.brand }}>+ 添加</span>
            </div>
            <div className="space-y-2">
              {[
                { name: '年度体检', days: 31 },
                { name: '洁牙', days: 87 },
                { name: '疫苗加强', days: 304 },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-700">{r.name}</span>
                  <span className="text-[10px]" style={{ color: colors.brand }}>还有{r.days}天</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* AI健康评估 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)', borderRadius: '24px' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-light text-white">AI健康评估</span>
              <span className="text-[9px] px-1.5 py-0 rounded" style={{ background: colors.brand, color: '#fff' }}>Beta</span>
            </div>
            <p className="text-[11px] text-white/70 mt-1">基于大数据分析，智能评估爱宠健康状况</p>
          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium" style={{ background: colors.brand, color: '#fff' }}>
            开始评估 <Play className="w-3 h-3 fill-current" />
          </button>
        </motion.div>

        <div className="h-2" />
      </main>
    </div>
  );
}
