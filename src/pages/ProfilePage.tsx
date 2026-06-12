/**
 * ProfilePage 2026 - 顶级设计
 *
 * 借鉴：得物、小红书、Apple ID
 * 特性：
 * - 渐变Hero（粉橙暖系）
 * - 4列统计+圆形发光图标
 * - 进度条+资料完善度
 * - 服务4列+菜单列表（带箭头）
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Edit3,
  Bell,
  Settings as SettingsIcon,
  Heart,
  Award,
  Star,
  MessageCircle,
  Briefcase,
  Calendar,
  Bookmark,
  Ticket,
  Home,
  FileText,
  Share2,
  HelpCircle,
  Info,
  Zap,
  Search,
} from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import { shadows } from '../styles/design-system';
import { useAppStore } from '../store/appStore';

export const ProfilePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentPet } = useAppStore();
  const petName = currentPet?.name || 'JOJO';
  const petBreed = currentPet?.breed || '柯基犬';
  const petAge = currentPet?.birthday
    ? `${new Date().getFullYear() - new Date(currentPet.birthday).getFullYear()}岁`
    : '2岁';

  const stats = [
    { icon: Heart, label: '成长值', value: '1250', color: '#F59E0B', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' },
    { icon: Award, label: '勋章', value: '12', color: '#3B82F6', bg: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)' },
    { icon: Star, label: '关注', value: '8', color: '#EF4444', bg: 'linear-gradient(135deg, #FEE2E2 0%, #FEF2F2 100%)' },
    { icon: MessageCircle, label: '互动消息', value: '23', color: '#A855F7', bg: 'linear-gradient(135deg, #F3E8FF 0%, #FAF5FF 100%)' },
  ];

  const services = [
    { icon: Briefcase, label: '服务订单', color: '#F59E0B', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' },
    { icon: Calendar, label: '预约记录', color: '#3B82F6', bg: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)' },
    { icon: Bookmark, label: '收藏夹', color: '#10B981', bg: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)' },
    { icon: Ticket, label: '优惠券', color: '#A855F7', bg: 'linear-gradient(135deg, #F3E8FF 0%, #FAF5FF 100%)' },
  ];

  const menuItems = [
    { icon: Home, label: '我的家庭', rightText: '3位成员', hasAvatars: true },
    { icon: FileText, label: '宠物档案', rightText: '查看/管理档案' },
    { icon: Share2, label: `分享${petName}`, rightText: '邀请家人一起关爱' },
    { icon: HelpCircle, label: '帮助与反馈' },
    { icon: Info, label: '关于我们' },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FFF7ED' }}>
      {/* ===== 渐变Hero (粉橙) ===== */}
      <div className="relative" style={{
        background: 'linear-gradient(135deg, #FB923C 0%, #F97316 50%, #EA580C 100%)'
      }}>
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse at top right, rgba(254, 215, 170, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at bottom left, rgba(244, 114, 182, 0.3) 0%, transparent 50%)
          `,
        }} />
        <div className="absolute top-32 right-0 w-40 h-40 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #FED7AA 0%, transparent 70%)', filter: 'blur(24px)' }}
        />

        <StatusBar dark={false} />

        <div className="relative px-5 pt-1 pb-2 flex items-center justify-between">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-[22px] font-bold text-white tracking-tight"
          >
            我的
          </motion.h1>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', border: '0.5px solid rgba(255, 255, 255, 0.3)' }}
            >
              <Search className="w-[16px] h-[16px] text-white" strokeWidth={2.5} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNavigate('settings')}
              className="w-9 h-9 rounded-full flex items-center justify-center relative"
              style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', border: '0.5px solid rgba(255, 255, 255, 0.3)' }}
            >
              <SettingsIcon className="w-[16px] h-[16px] text-white" strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>

        {/* 用户卡片 */}
        <div className="relative px-5 pt-4 pb-6 flex items-center gap-3.5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-2xl"
              style={{ background: 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%)', filter: 'blur(8px)', transform: 'scale(1.2)' }}
            />
            <div className="relative w-[68px] h-[68px] rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #FED7AA 100%)', border: '2.5px solid rgba(255, 255, 255, 0.7)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)' }}
            >
              <span className="text-4xl">🐕</span>
            </div>
          </motion.div>

          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[24px] font-bold text-white tracking-tight">{petName}</h2>
              <span className="text-white/90 text-[14px]">♂</span>
            </div>
            <p className="text-[12.5px] text-white/85 mt-0.5 font-medium">{petBreed} · {petAge}</p>
            <div
              className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
              style={{ background: 'rgba(110, 231, 183, 0.95)', color: '#065F46' }}
            >
              <Zap className="w-3 h-3 fill-current" />
              活力充沛
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.9 }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(255, 255, 255, 0.95)', color: '#EA580C', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
          >
            <Edit3 className="w-3 h-3" />
            编辑资料
          </motion.button>
        </div>
      </div>

      <main className="relative px-4 -mt-3 space-y-3.5">
        {/* 4列数据 */}
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
          <div className="p-3 grid grid-cols-4 gap-1">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.92 }}
                  className="flex flex-col items-center gap-1 py-1.5 rounded-2xl"
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: stat.bg, boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10.5px] text-gray-500 font-medium mt-0.5">{stat.label}</span>
                  <span className="text-[15px] font-bold text-gray-900 tabular-nums tracking-tight" style={{ fontFeatureSettings: '"tnum"' }}>
                    {stat.value}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* 完善宠物资料 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FED7AA 0%, #FB923C 100%)' }}
            >
              <span className="text-3xl">🐕</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14.5px] font-bold text-gray-900 tracking-tight">完善宠物资料</h3>
              <p className="text-[11px] text-gray-500 mt-0.5 font-medium">完整信息有助于获得个性化建议</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(249, 115, 22, 0.12)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '80%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #FBBF24 0%, #F97316 100%)' }}
                  />
                </div>
                <span className="text-[10.5px] text-gray-500 font-bold">已完成 80%</span>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.9 }}
              className="flex items-center gap-0.5 px-3 py-1.5 rounded-full text-[11px] font-bold flex-shrink-0"
              style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#EA580C' }}
            >
              去完善
              <ChevronRight className="w-3 h-3" strokeWidth={3} />
            </motion.button>
          </div>
        </motion.div>

        {/* 我的服务 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '20px',
            boxShadow: shadows.DEFAULT,
            border: '0.5px solid rgba(255, 255, 255, 0.8)',
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">我的服务</h3>
              <button className="text-[11px] text-gray-500 flex items-center font-medium">
                全部订单
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {services.map((service, i) => {
                const Icon = service.icon;
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.92 }}
                    className="flex flex-col items-center gap-1.5 py-1"
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: service.bg, boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: service.color }} strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] text-gray-700 font-semibold">{service.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* 列表菜单 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '20px',
            boxShadow: shadows.DEFAULT,
            border: '0.5px solid rgba(255, 255, 255, 0.8)',
          }}
        >
          <div className="p-1">
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.99, backgroundColor: 'rgba(0,0,0,0.02)' }}
                  className="flex items-center justify-between w-full py-3 px-3 rounded-xl"
                  style={{ borderTop: i > 0 ? '0.5px solid rgba(0, 0, 0, 0.04)' : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                      <Icon className="w-4 h-4 text-gray-600" strokeWidth={2.2} />
                    </div>
                    <span className="text-[13.5px] text-gray-900 font-semibold">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.hasAvatars && (
                      <div className="flex -space-x-1.5">
                        <div className="w-5 h-5 rounded-full bg-amber-200 border-2 border-white" />
                        <div className="w-5 h-5 rounded-full bg-orange-300 border-2 border-white" />
                        <div className="w-5 h-5 rounded-full bg-rose-200 border-2 border-white" />
                      </div>
                    )}
                    {item.rightText && (
                      <span className="text-[11px] text-gray-400 font-medium">{item.rightText}</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <div className="h-2" />
      </main>
    </div>
  );
};

export default ProfilePage;
