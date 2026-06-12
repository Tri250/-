/**
 * RecordsPage V3 - 奶油极简风统一版
 * 使用统一设计系统 constants.ts
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, Apple, Droplet, Footprints, Activity, FileText, Calendar, Sparkles,
  Signal, Wifi, BatteryFull,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { COLORS, SHADOWS, RADIUS, FONT, ANIMATION, PET_IMAGE } from '../styles/constants';

const typeConfig = {
  all: { icon: Sparkles, label: '全部', color: COLORS.brand },
  feed: { icon: Apple, label: '喂食', color: COLORS.orange },
  water: { icon: Droplet, label: '饮水', color: COLORS.blue },
  activity: { icon: Footprints, label: '活动', color: COLORS.green },
  health: { icon: Activity, label: '健康', color: COLORS.purple },
  other: { icon: FileText, label: '其他', color: COLORS.yellow },
};

export const RecordsPage: React.FC<{ onNavigate: (page: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<keyof typeof typeConfig>('all');
  const [expanded, setExpanded] = useState(true);

  const records = [
    { type: 'feed', title: '喂食', sub: '喂食了 120g 狗粮', time: '08:30', tag: '主食' },
    { type: 'water', title: '饮水', sub: '喝水 200ml', time: '10:15' },
    { type: 'activity', title: '活动', sub: '散步 30 分钟，消耗 120 kcal', time: '14:00', hasImg: true },
    { type: 'health', title: '健康', sub: '体重 12.5kg', time: '20:00' },
    { type: 'other', title: '其他', sub: '洗澡，驱虫', time: '21:30' },
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
          <h1 style={{ fontSize: FONT.size['4xl'], fontWeight: FONT.weight.light, color: COLORS.textPrimary }}>记录</h1>
          <p style={{ fontSize: FONT.size.md, color: COLORS.textSecondary, marginTop: '4px' }}>记录每一次陪伴，见证每一点成长</p>
        </motion.div>

        {/* 宠物图 */}
        <motion.div 
          initial={ANIMATION.fadeInUp.initial} 
          animate={ANIMATION.fadeInUp.animate} 
          transition={{ delay: 0.05 }}
          whileHover={{ scale: 1.01 }}
          className="h-32 rounded-3xl overflow-hidden cursor-pointer"
          style={{ boxShadow: SHADOWS.DEFAULT }}
        >
          <img src={PET_IMAGE.card} alt="" className="w-full h-full object-cover" />
        </motion.div>

        {/* 分类标签 */}
        <motion.div 
          initial={ANIMATION.fadeInUp.initial} 
          animate={ANIMATION.fadeInUp.animate} 
          transition={{ delay: 0.1 }}
          className="p-3 flex justify-between"
          style={{ background: COLORS.card, borderRadius: RADIUS.cardSm, boxShadow: SHADOWS.sm }}
        >
          {Object.entries(typeConfig).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = activeTab === key;
            return (
              <motion.button
                key={key}
                onClick={() => setActiveTab(key as any)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-1"
              >
                <motion.div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: isActive ? `${config.color}15` : 'transparent' }}
                  whileHover={{ scale: 1.1 }}
                >
                  <Icon className="w-5 h-5" style={{ color: isActive ? config.color : COLORS.textTertiary }} strokeWidth={2} />
                </motion.div>
                <span style={{ fontSize: FONT.size.xs, color: isActive ? config.color : COLORS.textTertiary, fontWeight: isActive ? FONT.weight.semibold : FONT.weight.regular }}>{config.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* 日期 */}
        <div className="flex items-center justify-between px-1">
          <h3 style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>2024年5月20日</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{ background: `${COLORS.brand}15`, color: COLORS.brand, fontSize: FONT.size.sm, fontWeight: FONT.weight.medium }}
          >
            <Calendar className="w-3 h-3" />
            选择日期
            <ChevronDown className="w-3 h-3" />
          </motion.button>
        </div>

        {/* 时间线 */}
        <div className="relative pl-3">
          <div className="absolute left-[18px] top-4 bottom-4 w-px" style={{ background: `linear-gradient(180deg, ${COLORS.orange}, ${COLORS.blue}, ${COLORS.green})`, opacity: 0.3 }} />
          <div className="space-y-3">
            {records.map((r, i) => {
              const config = typeConfig[r.type as keyof typeof typeConfig];
              const Icon = config.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  whileHover={{ scale: 1.01, x: 2 }}
                  className="relative flex items-center gap-3 p-3 cursor-pointer"
                  style={{ background: COLORS.card, borderRadius: RADIUS.sm, boxShadow: SHADOWS.xs }}
                >
                  <div className="absolute -left-[5px] w-3 h-3 rounded-full z-10" style={{ background: config.color, boxShadow: `0 0 0 3px ${COLORS.bg}` }} />
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center ml-3" style={{ background: `${config.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: config.color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>{r.title}</span>
                      {r.tag && <span className="px-1.5 py-0 rounded" style={{ background: `${COLORS.orange}15`, fontSize: '9px', color: COLORS.orange }}>{r.tag}</span>}
                    </div>
                    <p style={{ fontSize: FONT.size.base, color: COLORS.textSecondary }}>{r.sub}</p>
                  </div>
                  {r.hasImg && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden">
                      <img src={PET_IMAGE.thumb} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <span style={{ fontSize: FONT.size.sm, color: COLORS.textTertiary }}>{r.time}</span>
                  <ChevronRight className="w-4 h-4" style={{ color: COLORS.textQuaternary }} />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 折叠日期 */}
        <div>
          <motion.button
            onClick={() => setExpanded(!expanded)}
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between w-full mb-3 px-1"
          >
            <h3 style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>2024年5月19日</h3>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4" style={{ color: COLORS.textTertiary }} />
            </motion.div>
          </motion.button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 flex justify-around" style={{ background: COLORS.card, borderRadius: RADIUS.sm, boxShadow: SHADOWS.xs }}>
                  {[
                    { icon: Apple, count: 2, color: COLORS.orange },
                    { icon: Droplet, count: 3, color: COLORS.blue },
                    { icon: Footprints, count: 1, color: COLORS.green },
                    { icon: Activity, count: 1, color: COLORS.purple },
                    { icon: FileText, count: 1, color: COLORS.yellow },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.color} className="flex items-center gap-1">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                          <Icon className="w-3 h-3" style={{ color: s.color }} />
                        </div>
                        <span style={{ fontSize: FONT.size.sm, color: COLORS.textSecondary }}>{s.count}次</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-2" />
      </main>
    </div>
  );
};

export default RecordsPage;