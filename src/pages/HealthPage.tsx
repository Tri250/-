/**
 * HealthPage V3 - 奶油极简风统一版
 * 使用统一设计系统 constants.ts
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight, Scale, Thermometer, Heart, Wind, Calendar, Edit3,
  Syringe, Bug, Sparkles, Play, Signal, Wifi, BatteryFull,
  Activity, FileText, Bell,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { COLORS, SHADOWS, RADIUS, FONT, ANIMATION, PET_IMAGE } from '../styles/constants';

export default function HealthPage() {
  const { currentPet } = useAppStore();
  const [activeTab, setActiveTab] = useState<'7d' | '30d' | '90d'>('7d');
  const petName = currentPet?.name || 'JOJO';

  const metrics = [
    { icon: Scale, label: '体重', value: '12.5', unit: 'kg', color: COLORS.orange },
    { icon: Thermometer, label: '体温', value: '38.6', unit: '°C', color: COLORS.blue },
    { icon: Heart, label: '心率', value: '120', unit: '次/分', color: COLORS.red },
    { icon: Wind, label: '呼吸', value: '20', unit: '次/分', color: COLORS.purple },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.bg }}>
      {/* 状态栏 */}
      <div className="flex items-center justify-between px-6 pt-3 pb-1">
        <span style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.semibold, color: COLORS.textPrimary }}>9:41</span>
        <div className="flex items-center gap-1">
          <Signal className="w-4 h-4" style={{ color: COLORS.textPrimary, strokeWidth: 2.5 }} />
          <Wifi className="w-4 h-4" style={{ color: COLORS.textPrimary, strokeWidth: 2.5 }} />
          <BatteryFull className="w-5 h-5" style={{ color: COLORS.textPrimary, strokeWidth: 2 }} />
        </div>
      </div>

      <main className="px-4 pt-4 space-y-4">
        {/* 标题 */}
        <motion.div initial={ANIMATION.fadeInUp.initial} animate={ANIMATION.fadeInUp.animate}>
          <h1 style={{ fontSize: FONT.size['4xl'], fontWeight: FONT.weight.light, color: COLORS.textPrimary }}>健康</h1>
          <p style={{ fontSize: FONT.size.md, color: COLORS.textSecondary, marginTop: '4px' }}>科学管理健康，守护萌宠成长</p>
        </motion.div>

        {/* 宠物信息 */}
        <motion.div 
          initial={ANIMATION.fadeInUp.initial} 
          animate={ANIMATION.fadeInUp.animate} 
          transition={{ delay: 0.05 }}
          whileHover={ANIMATION.hoverCard}
          onClick={() => window.location.hash = 'pets'}
          className="flex items-center gap-3 p-4 cursor-pointer"
          style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
        >
          <div className="w-14 h-14 rounded-full overflow-hidden" style={{ border: '2px solid #fff' }}>
            <img src={PET_IMAGE.avatar} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span style={{ fontSize: FONT.size['2xl'], fontWeight: FONT.weight.light, color: COLORS.textPrimary }}>{petName}</span>
              <span style={{ color: COLORS.blue }}>♂</span>
            </div>
            <p style={{ fontSize: FONT.size.base, color: COLORS.textSecondary }}>柯基犬 · 2岁</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full"
            style={{ background: `${COLORS.brand}15`, color: COLORS.brand }}
          >
            <Edit3 className="w-3 h-3" />
            <span style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.medium }}>健康档案</span>
          </motion.button>
        </motion.div>

        {/* 健康状态 */}
        <motion.div 
          initial={ANIMATION.fadeInUp.initial} 
          animate={ANIMATION.fadeInUp.animate} 
          transition={{ delay: 0.1 }}
          className="p-4"
          style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>健康状态</span>
                <span className="px-2 py-0.5 rounded-full" style={{ background: COLORS.onlineBg, fontSize: FONT.size.xs, fontWeight: FONT.weight.medium, color: '#047857' }}>优秀</span>
              </div>
              <p style={{ fontSize: FONT.size.sm, color: COLORS.textTertiary, marginTop: '4px' }}>最近更新：2024.05.20</p>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: COLORS.textQuaternary }} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.label}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-1" style={{ background: `${m.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: m.color }} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: FONT.size.xs, color: COLORS.textSecondary }}>{m.label}</span>
                  <div className="flex items-baseline gap-0.5 mt-0.5">
                    <span style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.light, color: COLORS.textPrimary }} className="tabular-nums">{m.value}</span>
                    <span style={{ fontSize: FONT.size.xs, color: COLORS.textSecondary }}>{m.unit}</span>
                  </div>
                  <span className="mt-1 px-1.5 py-0 rounded" style={{ background: COLORS.onlineBg, fontSize: '9px', color: '#047857' }}>正常</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 健康趋势 */}
        <motion.div 
          initial={ANIMATION.fadeInUp.initial} 
          animate={ANIMATION.fadeInUp.animate} 
          transition={{ delay: 0.15 }}
          className="p-4"
          style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
        >
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>健康趋势</span>
            <div className="flex items-center gap-1 p-0.5 rounded-full" style={{ background: COLORS.bgTertiary }}>
              {(['7d', '30d', '90d'] as const).map((t) => (
                <motion.button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-1 rounded-full ${activeTab === t ? 'bg-white shadow-sm' : ''}`}
                  style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.medium, color: activeTab === t ? COLORS.textPrimary : COLORS.textSecondary }}
                >
                  {t === '7d' ? '7天' : t === '30d' ? '30天' : '90天'}
                </motion.button>
              ))}
            </div>
          </div>
          {/* 简化图表 */}
          <div className="h-32 flex items-end justify-between px-2">
            {[40, 45, 42, 48, 50, 47, 52].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h * 1.5}px` }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-2 rounded-full" style={{ background: i === 6 ? COLORS.brand : COLORS.textQuaternary }} />
                <span style={{ fontSize: '9px', color: COLORS.textTertiary }}>05/{14 + i}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 疫苗与驱虫 + 健康提醒 */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            initial={ANIMATION.fadeInUp.initial} 
            animate={ANIMATION.fadeInUp.animate} 
            transition={{ delay: 0.2 }}
            whileHover={ANIMATION.hoverCard}
            onClick={() => window.location.hash = 'health-manual'}
            className="p-3 cursor-pointer"
            style={{ background: COLORS.card, borderRadius: RADIUS.cardSm, boxShadow: SHADOWS.sm }}
          >
            <h3 style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary, marginBottom: '12px' }}>疫苗与驱虫</h3>
            <div className="space-y-2">
              {[
                { name: '狂犬疫苗', status: '已完成', color: COLORS.online },
                { name: '体内驱虫', status: '即将到期', color: COLORS.warning },
                { name: '体外驱虫', status: '已完成', color: COLORS.online },
              ].map((v) => (
                <div key={v.name} className="flex items-center justify-between">
                  <span style={{ fontSize: FONT.size.base, color: COLORS.textPrimary }}>{v.name}</span>
                  <span className="px-1.5 py-0.5 rounded" style={{ background: `${v.color}15`, fontSize: FONT.size.xs, color: v.color }}>{v.status}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={ANIMATION.fadeInUp.initial} 
            animate={ANIMATION.fadeInUp.animate} 
            transition={{ delay: 0.2 }}
            whileHover={ANIMATION.hoverCard}
            onClick={() => window.location.hash = 'reminders'}
            className="p-3 cursor-pointer"
            style={{ background: COLORS.card, borderRadius: RADIUS.cardSm, boxShadow: SHADOWS.sm }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>健康提醒</h3>
              <span style={{ fontSize: FONT.size.xs, color: COLORS.brand }}>+ 添加</span>
            </div>
            <div className="space-y-2">
              {[
                { name: '年度体检', days: 31 },
                { name: '洁牙', days: 87 },
                { name: '疫苗加强', days: 304 },
              ].map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <span style={{ fontSize: FONT.size.base, color: COLORS.textPrimary }}>{r.name}</span>
                  <span style={{ fontSize: FONT.size.xs, color: COLORS.brand }}>还有{r.days}天</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 快捷入口 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.hash = 'health-records'}
            className="p-4 flex items-center gap-3"
            style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: COLORS.blueLight }}>
              <FileText className="w-6 h-6" style={{ color: COLORS.blue }} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>健康档案</p>
              <p style={{ fontSize: FONT.size.base, color: COLORS.textTertiary }}>查看历史记录</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto" style={{ color: COLORS.textQuaternary }} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.hash = 'advanced-health'}
            className="p-4 flex items-center gap-3"
            style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: COLORS.purpleLight }}>
              <Activity className="w-6 h-6" style={{ color: COLORS.purple }} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>高级分析</p>
              <p style={{ fontSize: FONT.size.base, color: COLORS.textTertiary }}>深度健康洞察</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto" style={{ color: COLORS.textQuaternary }} />
          </motion.button>
        </motion.div>

        {/* AI健康评估 */}
        <motion.div 
          initial={ANIMATION.fadeInUp.initial} 
          animate={ANIMATION.fadeInUp.animate} 
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.hash = 'ai-consultant'}
          className="p-4 flex items-center justify-between cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)', borderRadius: RADIUS.card }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.light, color: '#fff' }}>AI健康评估</span>
              <span className="px-1.5 py-0 rounded" style={{ background: COLORS.brand, fontSize: '9px', color: '#fff' }}>Beta</span>
            </div>
            <p style={{ fontSize: FONT.size.sm, color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>基于大数据分析，智能评估爱宠健康状况</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full"
            style={{ background: COLORS.brand, fontSize: FONT.size.sm, fontWeight: FONT.weight.medium, color: '#fff' }}
          >
            开始评估
            <Play className="w-3 h-3" style={{ fill: '#fff' }} />
          </motion.button>
        </motion.div>

        <div className="h-2" />
      </main>
    </div>
  );
}