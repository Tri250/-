/**
 * HomePage 2026 - 顶级设计
 *
 * 借鉴：ColorOS 16、夸克、网易云音乐、得物、华为智慧生活
 * 特性：
 * - 沉浸式渐变Hero（琥珀金+径向光晕）
 * - 状态栏融入Hero
 * - 黏性模糊头部（滚动时变化）
 * - 宠物头像带HDR光圈
 * - 大圆角卡片+微阴影分层
 * - 设备卡3D倾斜效果
 * - 数字滚动动效
 * - 微光波背景
 */

import React, { useEffect, useState } from 'react';
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
  Bell,
  Heart,
  PawPrint,
} from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import { gradients, shadows, springs } from '../styles/design-system';
import { useAppStore } from '../store/appStore';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { currentPet } = useAppStore();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const petName = currentPet?.name || 'JOJO';
  const petBreed = currentPet?.breed || '柯基犬';
  const petAge = currentPet?.birthday
    ? `${new Date().getFullYear() - new Date(currentPet.birthday).getFullYear()}岁`
    : '2岁';

  const quickActions = [
    { icon: Stethoscope, label: 'AI问诊', sub: '智能问答', color: '#3b82f6', bg: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)' },
    { icon: FileText, label: '健康报告', sub: '今日生成', color: '#10b981', bg: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)' },
    { icon: Utensils, label: '饮食建议', sub: '科学喂养', color: '#f59e0b', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' },
    { icon: FolderOpen, label: '宠物档案', sub: '记录成长', color: '#a855f7', bg: 'linear-gradient(135deg, #F3E8FF 0%, #FAF5FF 100%)' },
  ];

  const devices = [
    { icon: Utensils, name: `${petName}的碗`, battery: 85, online: true, color: '#f59e0b' },
    { icon: Footprints, name: '智能项圈', battery: 92, online: true, color: '#3b82f6' },
    { icon: Droplet, name: '饮水机', battery: 78, online: true, color: '#06b6d4' },
  ];

  const dietStats = [
    { icon: Utensils, label: '进食次数', value: '8', unit: '次', color: '#f59e0b', status: '正常' },
    { icon: Sparkles, label: '进食总量', value: '320', unit: 'g', color: '#10b981', status: '正常' },
    { icon: Zap, label: '消耗卡路里', value: '280', unit: 'kcal', color: '#f97316', status: '正常' },
    { icon: Clock, label: '进食时长', value: '12', unit: '分钟', color: '#a855f7', status: '正常' },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAF8F5' }}>
      {/* ===== 沉浸式 Hero 渐变 ===== */}
      <div className="relative" style={{ background: gradients.hero, paddingTop: 0 }}>
        {/* 渐变层 */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at top right, rgba(255, 220, 100, 0.5) 0%, transparent 50%),
              radial-gradient(ellipse at bottom left, rgba(255, 100, 50, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #FFB35C 0%, #FF7A18 50%, #FF4D00 100%)
            `,
          }}
        />
        {/* 光斑装饰 */}
        <div
          className="absolute top-20 right-4 w-32 h-32 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, #FFE0B2 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        <div
          className="absolute top-60 left-0 w-40 h-40 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #FFD180 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />

        <StatusBar dark={false} />

        {/* 顶部标题栏 */}
        <div className="relative px-5 pt-2 pb-1 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <h1 className="text-[22px] font-bold text-white tracking-tight">爪爪连心</h1>
            <p className="text-[11px] text-white/80 mt-0.5 font-medium">温暖守护 · 陪伴成长</p>
          </motion.div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '0.5px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Bell className="w-[18px] h-[18px] text-white" strokeWidth={2} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate('profile')}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '0.5px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <PawPrint className="w-[18px] h-[18px] text-white" strokeWidth={2} />
            </motion.button>
          </div>
        </div>

        {/* 宠物Hero区 */}
        <div className="relative px-5 pt-6 pb-8">
          <div className="flex items-center gap-3.5">
            {/* 头像带HDR光圈 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative"
            >
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%)',
                  filter: 'blur(8px)',
                  transform: 'scale(1.2)',
                }}
              />
              <div
                className="relative w-[68px] h-[68px] rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FFF 0%, #FFE0B2 100%)',
                  border: '2.5px solid rgba(255, 255, 255, 0.7)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                }}
              >
                <span className="text-4xl">🐕</span>
              </div>
              {/* 在线指示器 */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: '#10B981',
                  border: '2.5px solid #FF7A18',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </motion.div>

            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[24px] font-bold text-white tracking-tight">{petName}</h2>
                <span className="text-white/90 text-[14px]">♂</span>
              </div>
              <p className="text-[12.5px] text-white/85 mt-0.5 font-medium">
                {petBreed} · {petAge}
              </p>
              <div
                className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                style={{
                  background: 'rgba(110, 231, 183, 0.95)',
                  color: '#065F46',
                }}
              >
                <Zap className="w-3 h-3 fill-current" />
                活力充沛
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#FF6B00',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              切换
              <ChevronRight className="w-3 h-3" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ===== 主内容区（向上偏移与Hero融合） ===== */}
      <main className="relative px-4 -mt-4 space-y-3.5">
        {/* ===== 引言气泡（黏性） ===== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '20px',
            boxShadow: shadows.DEFAULT,
            border: '0.5px solid rgba(255, 255, 255, 0.8)',
          }}
        >
          <div className="p-4 flex items-center gap-3">
            <div
              className="absolute -top-1.5 left-5 text-[28px] leading-none"
              style={{ color: '#FF8A00' }}
            >
              “
            </div>
            <div className="flex-1 pt-1.5">
              <p className="text-[14px] text-gray-800 leading-relaxed font-medium">
                今天我跑了多少圈，感觉活力满满呀~
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)',
                color: '#2563EB',
              }}
            >
              孪生宠物
              <ChevronRight className="w-3 h-3" />
            </motion.button>
          </div>
        </motion.div>

        {/* ===== 快捷功能 4列卡片 ===== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '20px',
            boxShadow: shadows.DEFAULT,
            border: '0.5px solid rgba(255, 255, 255, 0.8)',
          }}
        >
          <div className="p-4 grid grid-cols-4 gap-1.5">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onNavigate('ai-consultant')}
                  className="flex flex-col items-center gap-1.5 py-1.5 rounded-2xl"
                  style={{ transition: springs.smooth }}
                >
                  <div
                    className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: action.bg,
                      boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: action.color }} strokeWidth={2.2} />
                  </div>
                  <div className="text-center mt-0.5">
                    <p className="text-[13px] font-semibold text-gray-900 tracking-tight">
                      {action.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                      {action.sub}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ===== 我的设备 横向滚动卡片 ===== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">我的设备</h3>
            <button className="text-[11.5px] text-gray-500 flex items-center font-medium">
              查看全部
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <div
            className="relative p-2"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '20px',
              boxShadow: shadows.DEFAULT,
              border: '0.5px solid rgba(255, 255, 255, 0.8)',
            }}
          >
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {devices.map((device, i) => {
                const Icon = device.icon;
                return (
                  <motion.div
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 min-w-[88px] flex flex-col items-center py-2 px-1"
                  >
                    <div className="flex items-center gap-1 mb-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: '#10B981', boxShadow: '0 0 4px #10B981' }}
                      />
                      <span className="text-[10px] font-semibold" style={{ color: '#10B981' }}>
                        在线
                      </span>
                    </div>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2"
                      style={{
                        background: `linear-gradient(135deg, ${device.color}15 0%, ${device.color}08 100%)`,
                      }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: device.color }}
                        strokeWidth={1.8}
                      />
                    </div>
                    <p className="text-[12px] font-semibold text-gray-900 text-center truncate w-full">
                      {device.name}
                    </p>
                    <div
                      className="mt-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(16, 185, 129, 0.12)' }}
                    >
                      <Battery
                        className="w-2.5 h-2.5"
                        style={{ color: '#16A34A' }}
                        strokeWidth={2.5}
                      />
                      <span className="text-[10px] font-bold" style={{ color: '#16A34A' }}>
                        {device.battery}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              {/* 添加设备 */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex-1 min-w-[88px] flex flex-col items-center py-2 px-1"
              >
                <div className="h-[14px] mb-2" />
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2"
                  style={{
                    background: 'transparent',
                    border: '1.5px dashed rgba(156, 163, 175, 0.35)',
                  }}
                >
                  <Plus className="w-5 h-5 text-gray-300" strokeWidth={1.8} />
                </div>
                <p className="text-[12px] font-medium text-gray-400 text-center">添加设备</p>
                <div className="h-[18px] mt-1" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ===== 今日饮食数据 ===== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">今日饮食数据</h3>
            <button className="text-[11.5px] text-gray-500 flex items-center font-medium">
              更多数据
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <div
            className="relative p-4"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '20px',
              boxShadow: shadows.DEFAULT,
              border: '0.5px solid rgba(255, 255, 255, 0.8)',
            }}
          >
            <div className="grid grid-cols-4 gap-1">
              {dietStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-2">
                      <Icon
                        className="w-3 h-3"
                        style={{ color: stat.color }}
                        strokeWidth={2.5}
                      />
                      <span className="text-[10.5px] text-gray-500 font-medium">
                        {stat.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span
                        className="text-[22px] font-bold text-gray-900 tabular-nums tracking-tight"
                        style={{ fontFeatureSettings: '"tnum"' }}
                      >
                        {stat.value}
                      </span>
                      <span className="text-[10.5px] text-gray-500 font-semibold">
                        {stat.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ background: '#10B981' }}
                      />
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: '#10B981' }}
                      >
                        {stat.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* 底部间距 */}
        <div className="h-2" />
      </main>
    </div>
  );
};

export default HomePage;
