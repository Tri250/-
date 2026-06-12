/**
 * DevicesPage V2 - 奶油极简风
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight, Plus, Edit3, Battery, Utensils, Footprints, Droplet, Apple, Activity, ListFilter,
  Signal, Wifi, BatteryFull,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

const colors = {
  bg: '#FDF8F3', card: '#FFFFFF', brand: '#F97316', online: '#10B981',
  orange: '#FB923C', blue: '#60A5FA', cyan: '#22D3EE',
};

export const DevicesPage: React.FC<{ onNavigate: (page: string) => void }> = () => {
  const { currentPet } = useAppStore();
  const petName = currentPet?.name || 'JOJO';
  const [activeTab, setActiveTab] = useState<'all' | 'feed' | 'wear'>('all');

  const devices = [
    { id: '1', name: `${petName}的碗`, type: 'feed', battery: 85, icon: Utensils, color: colors.orange, data: [{ label: '今日喂食', value: '2次' }, { label: '今日进食', value: '320g' }, { label: '设备状态', value: '正常' }] },
    { id: '2', name: '智能项圈', type: 'wear', battery: 92, icon: Footprints, color: colors.blue, data: [{ label: '今日步数', value: '5780步' }, { label: '今日活动', value: '68分钟' }, { label: '设备状态', value: '正常' }] },
    { id: '3', name: '饮水机', type: 'feed', battery: 78, icon: Droplet, color: colors.cyan, data: [{ label: '今日饮水', value: '5次' }, { label: '今日饮水量', value: '1200ml' }, { label: '设备状态', value: '正常' }] },
  ];

  const filtered = devices.filter(d => activeTab === 'all' ? true : activeTab === 'feed' ? d.type === 'feed' : d.type === 'wear');

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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-light text-gray-900">我的设备</h1>
            <p className="text-[13px] text-gray-500 mt-1">智能设备，守护爱宠每一天</p>
          </div>
          <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: colors.card, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Plus className="w-5 h-5 text-gray-700" />
          </button>
        </motion.div>

        {/* 宠物图 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="h-40 rounded-3xl overflow-hidden">
          <img src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=500&fit=crop&auto=format" alt="" className="w-full h-full object-cover" />
        </motion.div>

        {/* 标签页 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {[
              { key: 'all', label: '全部设备', count: 3 },
              { key: 'feed', label: '喂食设备', count: 1 },
              { key: 'wear', label: '穿戴设备', count: 1 },
            ].map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key as any)} className="pb-2 text-[14px] relative" style={{ color: activeTab === t.key ? colors.brand : '#9CA3AF', fontWeight: activeTab === t.key ? 700 : 500 }}>
                {t.label} ({t.count})
                {activeTab === t.key && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: colors.brand }} />}
              </button>
            ))}
          </div>
          <button className="w-8 h-8 flex items-center justify-center"><ListFilter className="w-4 h-4 text-gray-500" /></button>
        </motion.div>

        {/* 设备列表 */}
        <div className="space-y-3">
          {filtered.map((d, i) => {
            const Icon = d.icon;
            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                className="p-4" style={{ background: colors.card, borderRadius: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${d.color}10` }}>
                    <Icon className="w-8 h-8" style={{ color: d.color }} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[16px] font-medium text-gray-900">{d.name}</span>
                        <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <button className="px-2.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: `${colors.brand}15`, color: colors.brand }}>设备管理</button>
                    </div>
                    <div className="flex items-center gap-2 mb-2 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.online }} />
                      <span style={{ color: colors.online }}>在线</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">剩余电量 {d.battery}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                      {d.data.map((item, j) => (
                        <div key={j} className="flex flex-col items-center text-center">
                          <span className="text-[10px] text-gray-400">{item.label}</span>
                          <span className="text-[13px] font-medium text-gray-900 mt-0.5">{item.value}</span>
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-6 flex flex-col items-center justify-center text-center" style={{ background: `${colors.brand}08`, borderRadius: '24px', border: `1.5px dashed ${colors.brand}40` }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${colors.brand}15` }}>
            <Plus className="w-6 h-6" style={{ color: colors.brand }} />
          </div>
          <span className="text-[15px] font-medium text-gray-900">添加设备</span>
          <span className="text-[12px] text-gray-500 mt-1">添加更多智能设备，开启智慧养宠生活</span>
        </motion.div>

        <div className="h-2" />
      </main>
    </div>
  );
};

export default DevicesPage;
