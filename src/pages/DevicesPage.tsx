/**
 * DevicesPage V3 - 奶油极简风统一版
 * 使用统一设计系统 constants.ts
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight, Plus, Edit3, Battery, Utensils, Footprints, Droplet, ListFilter,
  Signal, Wifi, BatteryFull, Camera, Activity,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { COLORS, SHADOWS, RADIUS, FONT, ANIMATION, PET_IMAGE } from '../styles/constants';

export const DevicesPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentPet } = useAppStore();
  const petName = currentPet?.name || 'JOJO';
  const [activeTab, setActiveTab] = useState<'all' | 'feed' | 'wear'>('all');

  const devices = [
    { id: '1', name: `${petName}的碗`, type: 'feed', battery: 85, icon: Utensils, color: COLORS.orange, data: [{ label: '今日喂食', value: '2次' }, { label: '今日进食', value: '320g' }, { label: '设备状态', value: '正常' }] },
    { id: '2', name: '智能项圈', type: 'wear', battery: 92, icon: Footprints, color: COLORS.blue, data: [{ label: '今日步数', value: '5780步' }, { label: '今日活动', value: '68分钟' }, { label: '设备状态', value: '正常' }] },
    { id: '3', name: '饮水机', type: 'feed', battery: 78, icon: Droplet, color: COLORS.cyan, data: [{ label: '今日饮水', value: '5次' }, { label: '今日饮水量', value: '1200ml' }, { label: '设备状态', value: '正常' }] },
  ];

  const filtered = devices.filter(d => activeTab === 'all' ? true : activeTab === 'feed' ? d.type === 'feed' : d.type === 'wear');

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
        <motion.div initial={ANIMATION.fadeInUp.initial} animate={ANIMATION.fadeInUp.animate} className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: FONT.size['4xl'], fontWeight: FONT.weight.light, color: COLORS.textPrimary }}>我的设备</h1>
            <p style={{ fontSize: FONT.size.md, color: COLORS.textSecondary, marginTop: '4px' }}>智能设备，守护爱宠每一天</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: COLORS.card, boxShadow: SHADOWS.sm }}
          >
            <Plus className="w-5 h-5" style={{ color: COLORS.textPrimary }} />
          </motion.button>
        </motion.div>

        {/* 宠物图 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ delay: 0.05 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => onNavigate('camera-monitor')}
          className="h-40 rounded-3xl overflow-hidden cursor-pointer"
          style={{ boxShadow: SHADOWS.DEFAULT }}
        >
          <img src={PET_IMAGE.card} alt="" className="w-full h-full object-cover" />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onNavigate('camera'); }}
            className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.9)', boxShadow: SHADOWS.sm }}
          >
            <Camera className="w-5 h-5" style={{ color: COLORS.brand }} />
          </motion.button>
        </motion.div>

        {/* 标签页 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            {[
              { key: 'all', label: '全部设备', count: 3 },
              { key: 'feed', label: '喂食设备', count: 2 },
              { key: 'wear', label: '穿戴设备', count: 1 },
            ].map((t) => (
              <motion.button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="pb-2 relative"
                style={{ fontSize: FONT.size.lg, fontWeight: activeTab === t.key ? FONT.weight.bold : FONT.weight.medium, color: activeTab === t.key ? COLORS.brand : COLORS.textTertiary }}
              >
                {t.label} ({t.count})
                {activeTab === t.key && (
                  <motion.div
                    layoutId="tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: COLORS.brand }}
                  />
                )}
              </motion.button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 flex items-center justify-center"
          >
            <ListFilter className="w-4 h-4" style={{ color: COLORS.textSecondary }} />
          </motion.button>
        </motion.div>

        {/* 设备列表 */}
        <div className="space-y-3">
          {filtered.map((d, i) => {
            const Icon = d.icon;
            return (
              <motion.div
                key={d.id}
                initial={ANIMATION.fadeInUp.initial}
                animate={ANIMATION.fadeInUp.animate}
                transition={{ delay: 0.15 + i * 0.05 }}
                whileHover={ANIMATION.hoverCard}
                className="p-4 cursor-pointer"
                style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${d.color}10` }}>
                    <Icon className="w-8 h-8" style={{ color: d.color }} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <span style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>{d.name}</span>
                        <Edit3 className="w-3.5 h-3.5" style={{ color: COLORS.textTertiary }} />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-2.5 py-0.5 rounded-full"
                        style={{ background: `${COLORS.brand}15`, fontSize: FONT.size.xs, fontWeight: FONT.weight.medium, color: COLORS.brand }}
                      >
                        设备管理
                      </motion.button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS.online }} />
                      <span style={{ fontSize: FONT.size.sm, color: COLORS.online }}>在线</span>
                      <span style={{ color: COLORS.textQuaternary }}>|</span>
                      <span style={{ fontSize: FONT.size.sm, color: COLORS.textSecondary }}>剩余电量 {d.battery}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                      {d.data.map((item) => (
                        <div key={item.label} className="flex flex-col items-center text-center">
                          <span style={{ fontSize: FONT.size.xs, color: COLORS.textTertiary }}>{item.label}</span>
                          <span style={{ fontSize: FONT.size.md, fontWeight: FONT.weight.medium, color: COLORS.textPrimary, marginTop: '2px' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 添加设备 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="p-6 flex flex-col items-center justify-center text-center cursor-pointer"
          style={{ background: `${COLORS.brand}08`, borderRadius: RADIUS.card, border: `1.5px dashed ${COLORS.brand}40` }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${COLORS.brand}15` }}>
            <Plus className="w-6 h-6" style={{ color: COLORS.brand }} />
          </div>
          <span style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>添加设备</span>
          <span style={{ fontSize: FONT.size.base, color: COLORS.textSecondary, marginTop: '4px' }}>添加更多智能设备，开启智慧养宠生活</span>
        </motion.div>

        {/* 快捷入口 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('camera-monitor')}
            className="p-4 flex items-center gap-3"
            style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: COLORS.cyanLight }}>
              <Camera className="w-6 h-6" style={{ color: COLORS.cyan }} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>实时监控</p>
              <p style={{ fontSize: FONT.size.base, color: COLORS.textTertiary }}>查看宠物状态</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto" style={{ color: COLORS.textQuaternary }} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('monitor')}
            className="p-4 flex items-center gap-3"
            style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: COLORS.purpleLight }}>
              <Activity className="w-6 h-6" style={{ color: COLORS.purple }} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>活动追踪</p>
              <p style={{ fontSize: FONT.size.base, color: COLORS.textTertiary }}>运动数据分析</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto" style={{ color: COLORS.textQuaternary }} />
          </motion.button>
        </motion.div>

        <div className="h-2" />
      </main>
    </div>
  );
};

export default DevicesPage;