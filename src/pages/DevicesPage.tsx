/**
 * DevicesPage 2026 - 顶级设计
 *
 * 借鉴：米家、华为智慧生活、Apple Home
 * 特性：
 * - 渐变Hero（蓝绿智能风）
 * - 设备卡（LED状态灯+电量环+实时数据）
 * - 选中态下划线指示器
 * - 渐变占位的"添加设备"
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit3,
  Battery,
  Utensils,
  Footprints,
  Droplet,
  Apple,
  Activity,
  ListFilter,
  Wifi,
  Search,
} from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import { shadows } from '../styles/design-system';
import { useAppStore } from '../store/appStore';

export const DevicesPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentPet } = useAppStore();
  const petName = currentPet?.name || 'JOJO';
  const [activeTab, setActiveTab] = useState<'all' | 'feed' | 'wear'>('all');

  const devices = [
    {
      id: '1', name: `${petName}的碗`, type: 'feed', online: true, battery: 85,
      icon: Utensils, color: '#F59E0B', iconBg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
      data: [
        { icon: Apple, label: '今日喂食', value: '2次', color: '#F59E0B' },
        { icon: Utensils, label: '今日进食', value: '320g', color: '#10B981' },
        { icon: Activity, label: '设备状态', value: '正常', color: '#3B82F6' },
      ],
    },
    {
      id: '2', name: '智能项圈', type: 'wear', online: true, battery: 92,
      icon: Footprints, color: '#3B82F6', iconBg: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)',
      data: [
        { icon: Footprints, label: '今日步数', value: '5780步', color: '#3B82F6' },
        { icon: Activity, label: '今日活动', value: '68分钟', color: '#10B981' },
        { icon: Activity, label: '设备状态', value: '正常', color: '#A855F7' },
      ],
    },
    {
      id: '3', name: '饮水机', type: 'feed', online: true, battery: 78,
      icon: Droplet, color: '#06B6D4', iconBg: 'linear-gradient(135deg, #CFFAFE 0%, #ECFEFF 100%)',
      data: [
        { icon: Droplet, label: '今日饮水', value: '5次', color: '#06B6D4' },
        { icon: Droplet, label: '今日饮水量', value: '1200ml', color: '#3B82F6' },
        { icon: Activity, label: '设备状态', value: '正常', color: '#10B981' },
      ],
    },
  ];

  const filteredDevices = devices.filter((d) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'feed') return d.type === 'feed';
    if (activeTab === 'wear') return d.type === 'wear';
    return true;
  });

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F0F9FF' }}>
      {/* ===== 渐变Hero (蓝绿) ===== */}
      <div className="relative" style={{
        background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%)'
      }}>
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse at top right, rgba(110, 231, 183, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at bottom left, rgba(167, 139, 250, 0.3) 0%, transparent 50%)
          `,
        }} />
        <div className="absolute top-32 right-0 w-40 h-40 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7DD3FC 0%, transparent 70%)', filter: 'blur(24px)' }}
        />

        <StatusBar dark={false} />

        <div className="relative px-5 pt-1 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-white tracking-tight">我的设备</h1>
            <p className="text-[11px] text-white/85 mt-0.5 font-medium">智能设备，守护爱宠每一天</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', border: '0.5px solid rgba(255, 255, 255, 0.3)' }}
            >
              <Search className="w-[16px] h-[16px] text-white" strokeWidth={2.5} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', border: '0.5px solid rgba(255, 255, 255, 0.3)' }}
            >
              <Plus className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>

        {/* Hero卡片 */}
        <div className="relative px-5 pt-3 pb-6">
          <div className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', border: '0.5px solid rgba(255, 255, 255, 0.2)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #DBEAFE 100%)' }}
            >
              <Wifi className="w-5 h-5" style={{ color: '#0369A1' }} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-white">3 台设备已连接</p>
              <p className="text-[10.5px] text-white/80 mt-0.5">实时同步，状态正常</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-[10.5px] font-bold text-emerald-300">在线</span>
            </div>
          </div>
        </div>
      </div>

      <main className="relative px-4 -mt-3 space-y-3.5">
        {/* 标签页 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-5">
            {[
              { key: 'all', label: '全部设备', count: 3 },
              { key: 'feed', label: '喂食设备', count: 1 },
              { key: 'wear', label: '穿戴设备', count: 1 },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className="pb-2 text-[14px] relative tracking-tight"
                style={{
                  color: activeTab === tab.key ? '#0284C7' : '#6B7280',
                  fontWeight: activeTab === tab.key ? 700 : 500,
                }}
              >
                {tab.label} ({tab.count})
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="devices-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #0EA5E9 0%, #0284C7 100%)' }}
                  />
                )}
              </button>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.9 }} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
            <ListFilter className="w-4 h-4 text-gray-500" strokeWidth={2.5} />
          </motion.button>
        </motion.div>

        {/* 设备列表 */}
        <div className="space-y-3">
          {filteredDevices.map((device, i) => {
            const Icon = device.icon;
            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                whileTap={{ scale: 0.99 }}
                className="relative"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  borderRadius: '20px',
                  boxShadow: shadows.DEFAULT,
                  border: '0.5px solid rgba(255, 255, 255, 0.8)',
                }}
              >
                <div className="p-4 flex items-start gap-3">
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{
                        background: device.iconBg,
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      <Icon className="w-8 h-8" style={{ color: device.color }} strokeWidth={2} />
                    </div>
                    {/* 在线LED */}
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: '#10B981', border: '2.5px solid #fff' }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">{device.name}</h3>
                        <Edit3 className="w-3 h-3 text-gray-400" />
                      </div>
                      <button
                        className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold"
                        style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0369A1' }}
                      >
                        设备管理
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-2.5 text-[10.5px]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981', boxShadow: '0 0 4px #10B981' }} />
                      <span className="font-bold" style={{ color: '#10B981' }}>在线</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500 font-medium">
                        {device.type === 'wear' ? '剩余电量' : '滤芯剩余'} {device.battery}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-gray-100">
                      {device.data.map((item, j) => {
                        const DataIcon = item.icon;
                        return (
                          <div key={j} className="flex flex-col items-center text-center">
                            <div className="flex items-center gap-1 mb-1">
                              <DataIcon className="w-3 h-3" style={{ color: item.color }} strokeWidth={2.5} />
                              <span className="text-[9.5px] text-gray-500 font-medium">{item.label}</span>
                            </div>
                            <span className="text-[12.5px] font-bold text-gray-900 tabular-nums tracking-tight" style={{ fontFeatureSettings: '"tnum"' }}>
                              {item.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 添加设备 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(167, 139, 250, 0.05) 100%)',
            border: '1.5px dashed rgba(14, 165, 233, 0.3)',
          }}
        >
          <motion.div whileTap={{ scale: 0.9 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)', boxShadow: '0 8px 20px rgba(14, 165, 233, 0.3)' }}
          >
            <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
          </motion.div>
          <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">添加设备</h3>
          <p className="text-[11.5px] text-gray-500 mt-1 font-medium">添加更多智能设备，开启智慧养宠生活</p>
        </motion.div>

        <div className="h-2" />
      </main>
    </div>
  );
};

export default DevicesPage;
