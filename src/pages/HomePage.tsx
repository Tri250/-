/**
 * HomePage V2 - 奶油极简风
 *
 * 完全匹配参考图设计：
 * - 奶油色背景 #FDF8F3
 * - 顶部状态栏透明
 * - 宠物头像（真实图片占位）+ 名称 + 性别 + 状态标签
 * - 引言气泡卡片（大圆角 24px）
 * - 宠物主图区域（全宽，圆角）
 * - 4列快捷功能（图标+标题+副标题）
 * - 设备横向滚动卡片
 * - 今日饮食数据 4列
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Stethoscope,
  FileText,
  Utensils,
  FolderOpen,
  Battery,
  Footprints,
  Plus,
  Droplet,
  Zap,
  Clock,
  Sparkles,
  Signal,
  Wifi,
  BatteryFull,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

// 设计系统
const colors = {
  bg: '#FDF8F3',
  card: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  brand: '#F97316',
  brandLight: '#FFF7ED',
  blue: '#60A5FA',
  blueLight: '#EFF6FF',
  green: '#34D399',
  greenLight: '#ECFDF5',
  orange: '#FB923C',
  orangeLight: '#FFF7ED',
  purple: '#A78BFA',
  purpleLight: '#F5F3FF',
  online: '#10B981',
};

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { currentPet } = useAppStore();
  const petName = currentPet?.name || 'JOJO';
  const petBreed = currentPet?.breed || '柯基犬';
  const petAge = currentPet?.birthday
    ? `${new Date().getFullYear() - new Date(currentPet.birthday).getFullYear()}岁`
    : '2岁';

  const quickActions = [
    { icon: Stethoscope, label: 'AI问诊', sub: '智能问答', color: colors.blue, bg: colors.blueLight },
    { icon: FileText, label: '健康报告', sub: '今日生成', color: colors.green, bg: colors.greenLight },
    { icon: Utensils, label: '饮食建议', sub: '科学喂养', color: colors.orange, bg: colors.orangeLight },
    { icon: FolderOpen, label: '宠物档案', sub: '记录成长', color: colors.purple, bg: colors.purpleLight },
  ];

  const devices = [
    { icon: Utensils, name: `${petName}的碗`, battery: 85, online: true, color: colors.orange },
    { icon: Footprints, name: '智能项圈', battery: 92, online: true, color: colors.blue },
    { icon: Droplet, name: '饮水机', battery: 78, online: true, color: '#22D3EE' },
  ];

  const dietStats = [
    { icon: Utensils, label: '进食次数', value: '8', unit: '次', status: '正常', color: colors.orange },
    { icon: Sparkles, label: '进食总量', value: '320', unit: 'g', status: '正常', color: colors.green },
    { icon: Zap, label: '消耗卡路里', value: '280', unit: 'kcal', status: '正常', color: colors.brand },
    { icon: Clock, label: '进食时长', value: '12', unit: '分钟', status: '正常', color: colors.purple },
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

      <main className="px-4 pt-2 space-y-4">
        {/* 宠物信息头部 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          {/* 宠物头像 */}
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FFE4C4 0%, #DEB887 100%)',
                border: '2px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop&auto=format"
                alt="宠物头像"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-1">
              <h1 className="text-[20px] font-light text-gray-900 tracking-tight">{petName}</h1>
              <span className="text-blue-500 text-base">♂</span>
            </div>
            <p className="text-[13px] text-gray-500 mt-0.5">{petBreed} · {petAge}</p>
            <div
              className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ background: '#D1FAE5', color: '#047857' }}
            >
              <Zap className="w-3 h-3 fill-current" />
              活力充沛
            </div>
          </div>

          <button className="p-2">
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </motion.div>

        {/* 引言气泡 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
          whileTap={{ scale: 0.98 }}
          className="relative p-4 cursor-pointer"
          style={{
            background: colors.card,
            borderRadius: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <span className="absolute top-2 left-4 text-[28px] text-orange-300 leading-none">"</span>
          <div className="flex items-center justify-between">
            <p className="text-[14px] text-gray-700 leading-relaxed pt-2">
              今天我跑了多少圈，<br />感觉活力满满呀~
            </p>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop&auto=format"
                  alt="宠物"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                className="flex items-center gap-0.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
                style={{ background: colors.blueLight, color: colors.blue }}
              >
                孪生宠物
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* 宠物主图 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ scale: 1.01 }}
          className="relative h-48 rounded-3xl overflow-hidden cursor-pointer"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <motion.img
            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop&auto=format"
            alt="宠物主图"
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full text-[11px] font-medium bg-white/90 text-gray-700">
            120g 进食完成
          </div>
        </motion.div>

        {/* 快捷功能 4列 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="p-4"
          style={{
            background: colors.card,
            borderRadius: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  onClick={() => onNavigate('ai-consultant')}
                  className="flex flex-col items-center gap-2 py-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: action.bg }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Icon className="w-6 h-6" style={{ color: action.color }} strokeWidth={2} />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-gray-900">{action.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{action.sub}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* 我的设备 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[16px] font-medium text-gray-900">我的设备</h3>
            <button className="flex items-center text-[12px] text-gray-500">
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div
            className="p-3"
            style={{
              background: colors.card,
              borderRadius: '24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {devices.map((device, i) => {
                const Icon = device.icon;
                return (
                  <div key={i} className="flex flex-col items-center min-w-[80px]">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.online }} />
                      <span className="text-[10px]" style={{ color: colors.online }}>在线</span>
                    </div>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                      style={{ background: `${device.color}15` }}
                    >
                      <Icon className="w-7 h-7" style={{ color: device.color }} strokeWidth={1.5} />
                    </div>
                    <p className="text-[12px] font-medium text-gray-900 text-center">{device.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Battery className="w-3 h-3" style={{ color: colors.online }} />
                      <span className="text-[10px]" style={{ color: colors.online }}>{device.battery}%</span>
                    </div>
                  </div>
                );
              })}
              {/* 添加设备 */}
              <div className="flex flex-col items-center min-w-[80px]">
                <div className="h-4 mb-2" />
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                  style={{ border: '1.5px dashed #E5E7EB' }}
                >
                  <Plus className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-[12px] font-medium text-gray-400">添加设备</p>
                <div className="h-4 mt-1" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* 今日饮食数据 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[16px] font-medium text-gray-900">今日饮食数据</h3>
            <button className="flex items-center text-[12px] text-gray-500">
              更多数据
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div
            className="p-4"
            style={{
              background: colors.card,
              borderRadius: '24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            <div className="grid grid-cols-4 gap-2">
              {dietStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-2">
                      <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} strokeWidth={2.5} />
                      <span className="text-[10px] text-gray-500">{stat.label}</span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[22px] font-light text-gray-900 tabular-nums">{stat.value}</span>
                      <span className="text-[11px] text-gray-500">{stat.unit}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="w-1 h-1 rounded-full" style={{ background: colors.online }} />
                      <span className="text-[10px]" style={{ color: colors.online }}>{stat.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="h-2" />
      </main>
    </div>
  );
};

export default HomePage;
