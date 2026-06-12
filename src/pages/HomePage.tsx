/**
 * HomePage V3 - 奶油极简风统一版
 * 
 * 核心功能入口完整覆盖
 * 使用统一设计系统 constants.ts
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
  Heart,
  Activity,
  Calendar,
  PawPrint,
  Camera,
  MessageCircle,
  Shield,
  ShoppingBag,
  GraduationCap,
  Syringe,
  Bell,
  Settings,
  Users,
  Share2,
  MapPin,
  Car,
  Home,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { usePetStore } from '../store/petStore';
import { COLORS, SHADOWS, RADIUS, FONT, ANIMATION, PET_IMAGE } from '../styles/constants';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

// 功能配置
const QUICK_ACTIONS = [
  { icon: Stethoscope, label: 'AI问诊', sub: '智能问答', page: 'ai-consultant', color: COLORS.blue, bg: COLORS.blueLight },
  { icon: Activity, label: '健康报告', sub: '今日生成', page: 'health-report', color: COLORS.green, bg: COLORS.greenLight },
  { icon: Utensils, label: '饮食建议', sub: '科学喂养', page: 'health-manual', color: COLORS.orange, bg: COLORS.orangeLight },
  { icon: FolderOpen, label: '宠物档案', sub: '记录成长', page: 'pets', color: COLORS.purple, bg: COLORS.purpleLight },
];

const SERVICES = [
  { icon: GraduationCap, label: '训练课程', page: 'training', color: COLORS.blue },
  { icon: Shield, label: '宠物保险', page: 'insurance', color: COLORS.green },
  { icon: Heart, label: '医疗服务', page: 'medical', color: COLORS.red },
  { icon: ShoppingBag, label: '服务商城', page: 'services', color: COLORS.orange },
];

const MORE_FEATURES = [
  { icon: PawPrint, label: '宠物管理', page: 'pets', color: COLORS.brand },
  { icon: Camera, label: '实时监控', page: 'camera-monitor', color: COLORS.cyan },
  { icon: MessageCircle, label: '情感绑定', page: 'bond-emotion', color: COLORS.purple },
  { icon: Bell, label: '提醒设置', page: 'reminders', color: COLORS.yellow },
  { icon: Calendar, label: '预约记录', page: 'health-records', color: COLORS.green },
  { icon: Settings, label: '系统设置', page: 'settings', color: COLORS.blue },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { currentPet } = useAppStore();
  const { getCurrentPet, pets } = usePetStore();
  
  // 使用petStore的真实数据
  const realPet = getCurrentPet() || pets[0] || currentPet;
  const petName = realPet?.name || '小橘';
  const petBreed = realPet?.breed || '橘猫';
  const petAge = realPet?.birthday
    ? `${new Date().getFullYear() - new Date(realPet.birthday).getFullYear()}岁`
    : `${realPet?.age || 2}岁`;
  const petAvatar = realPet?.avatar || PET_IMAGE.avatar;

  const devices = [
    { icon: Utensils, name: `${petName}的碗`, battery: 85, online: true, color: COLORS.orange },
    { icon: Footprints, name: '智能项圈', battery: 92, online: true, color: COLORS.blue },
    { icon: Droplet, name: '饮水机', battery: 78, online: true, color: COLORS.cyan },
  ];

  const dietStats = [
    { icon: Utensils, label: '进食次数', value: '8', unit: '次', color: COLORS.orange },
    { icon: Sparkles, label: '进食总量', value: '320', unit: 'g', color: COLORS.green },
    { icon: Zap, label: '消耗卡路里', value: '280', unit: 'kcal', color: COLORS.brand },
    { icon: Clock, label: '进食时长', value: '12', unit: '分钟', color: COLORS.purple },
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

      <main className="px-4 pt-2 space-y-4">
        {/* 宠物信息头部 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ duration: ANIMATION.duration.normal }}
          className="flex items-center gap-3"
        >
          {/* 宠物头像 - 点击进入宠物管理 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('pets')}
            className="relative"
          >
            <div
              className="w-16 h-16 rounded-full overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FFE4C4 0%, #DEB887 100%)',
                border: '2px solid #fff',
                boxShadow: SHADOWS.sm,
              }}
            >
              <img
                src={petAvatar}
                alt="宠物头像"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: COLORS.brand, boxShadow: SHADOWS.sm }}
            >
              <PawPrint className="w-3 h-3 text-white" />
            </div>
          </motion.button>

          <div className="flex-1">
            <div className="flex items-center gap-1">
              <h1 style={{ fontSize: FONT.size['3xl'], fontWeight: FONT.weight.light, color: COLORS.textPrimary }}>{petName}</h1>
              <span style={{ color: COLORS.blue }}>♂</span>
            </div>
            <p style={{ fontSize: FONT.size.md, color: COLORS.textSecondary, marginTop: '2px' }}>{petBreed} · {petAge}</p>
            <motion.div
              className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full"
              style={{ background: COLORS.onlineBg }}
            >
              <Zap className="w-3 h-3" style={{ color: COLORS.online, fill: COLORS.online }} />
              <span style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.medium, color: '#047857' }}>活力充沛</span>
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('pets')}
            className="p-2"
          >
            <ChevronRight className="w-5 h-5" style={{ color: COLORS.textQuaternary }} />
          </motion.button>
        </motion.div>

        {/* 引言气泡 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ duration: ANIMATION.duration.normal, delay: 0.05 }}
          whileHover={ANIMATION.hoverCard}
          whileTap={ANIMATION.tapButton}
          onClick={() => onNavigate('bond-emotion')}
          className="relative p-4 cursor-pointer"
          style={{
            background: COLORS.card,
            borderRadius: RADIUS.card,
            boxShadow: SHADOWS.sm,
          }}
        >
          <span className="absolute top-2 left-4 text-[28px] text-orange-300 leading-none">"</span>
          <div className="flex items-center justify-between">
            <p style={{ fontSize: FONT.size.lg, color: COLORS.textSecondary, lineHeight: '1.6', paddingTop: '8px' }}>
              今天我跑了多少圈，<br />感觉活力满满呀~
            </p>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl overflow-hidden">
                <img src={PET_IMAGE.thumb} alt="宠物" className="w-full h-full object-cover" />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-0.5 px-3 py-1.5 rounded-full"
                style={{ background: COLORS.blueLight, color: COLORS.blue }}
              >
                <span style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.medium }}>孪生宠物</span>
                <ChevronRight className="w-3 h-3" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* 宠物主图 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ duration: ANIMATION.duration.normal, delay: 0.1 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => onNavigate('camera-monitor')}
          className="relative h-48 rounded-3xl overflow-hidden cursor-pointer"
          style={{ boxShadow: SHADOWS.DEFAULT }}
        >
          <motion.img
            src={PET_IMAGE.hero}
            alt="宠物主图"
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: ANIMATION.duration.slow }}
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.9)', fontSize: FONT.size.sm, fontWeight: FONT.weight.medium, color: COLORS.textSecondary }}
          >
            120g 进食完成
          </motion.div>
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

        {/* 快捷功能 4列 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ duration: ANIMATION.duration.normal, delay: 0.15 }}
          className="p-4"
          style={{
            background: COLORS.card,
            borderRadius: RADIUS.card,
            boxShadow: SHADOWS.sm,
          }}
        >
          <div className="grid grid-cols-4 gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  onClick={() => onNavigate(action.page)}
                  className="flex flex-col items-center gap-2 py-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: action.bg }}
                    whileHover={{ scale: 1.1 }}
                    transition={ANIMATION.easing.spring}
                  >
                    <Icon className="w-6 h-6" style={{ color: action.color }} strokeWidth={2} />
                  </motion.div>
                  <div className="text-center">
                    <p style={{ fontSize: FONT.size.md, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>{action.label}</p>
                    <p style={{ fontSize: FONT.size.xs, color: COLORS.textTertiary, marginTop: '2px' }}>{action.sub}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* 服务大厅 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ duration: ANIMATION.duration.normal, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>服务大厅</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => onNavigate('services')}
              className="flex items-center"
              style={{ fontSize: FONT.size.base, color: COLORS.textSecondary }}
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
          <motion.div
            className="p-4"
            style={{
              background: COLORS.card,
              borderRadius: RADIUS.card,
              boxShadow: SHADOWS.sm,
            }}
          >
            <div className="grid grid-cols-4 gap-3">
              {SERVICES.map((service) => {
                const Icon = service.icon;
                return (
                  <motion.button
                    key={service.label}
                    onClick={() => onNavigate(service.page)}
                    className="flex flex-col items-center gap-2 py-2"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center"
                      style={{ background: `${service.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: service.color }} strokeWidth={2} />
                    </div>
                    <span style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>{service.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>

        {/* 我的设备 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ duration: ANIMATION.duration.normal, delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>我的设备</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => onNavigate('devices')}
              className="flex items-center"
              style={{ fontSize: FONT.size.base, color: COLORS.textSecondary }}
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
          <motion.div
            className="p-3"
            style={{
              background: COLORS.card,
              borderRadius: RADIUS.card,
              boxShadow: SHADOWS.sm,
            }}
          >
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {devices.map((device) => {
                const Icon = device.icon;
                return (
                  <motion.div
                    key={device.name}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate('devices')}
                    className="flex flex-col items-center min-w-[80px] cursor-pointer"
                  >
                    <div className="flex items-center gap-1 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS.online }} />
                      <span style={{ fontSize: FONT.size.xs, color: COLORS.online }}>在线</span>
                    </div>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                      style={{ background: `${device.color}15` }}
                    >
                      <Icon className="w-7 h-7" style={{ color: device.color }} strokeWidth={1.5} />
                    </div>
                    <p style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>{device.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Battery className="w-3 h-3" style={{ color: COLORS.online }} />
                      <span style={{ fontSize: FONT.size.xs, color: COLORS.online }}>{device.battery}%</span>
                    </div>
                  </motion.div>
                );
              })}
              {/* 添加设备 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('devices')}
                className="flex flex-col items-center min-w-[80px]"
              >
                <div className="h-4 mb-2" />
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                  style={{ border: `1.5px dashed ${COLORS.textQuaternary}` }}
                >
                  <Plus className="w-6 h-6" style={{ color: COLORS.textQuaternary }} />
                </div>
                <p style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.medium, color: COLORS.textTertiary }}>添加设备</p>
                <div className="h-4 mt-1" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* 今日饮食数据 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ duration: ANIMATION.duration.normal, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>今日饮食数据</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => onNavigate('records')}
              className="flex items-center"
              style={{ fontSize: FONT.size.base, color: COLORS.textSecondary }}
            >
              更多数据
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
          <motion.div
            className="p-4"
            style={{
              background: COLORS.card,
              borderRadius: RADIUS.card,
              boxShadow: SHADOWS.sm,
            }}
          >
            <div className="grid grid-cols-4 gap-2">
              {dietStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-2">
                      <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} strokeWidth={2.5} />
                      <span style={{ fontSize: FONT.size.xs, color: COLORS.textSecondary }}>{stat.label}</span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span style={{ fontSize: '22px', fontWeight: FONT.weight.light, color: COLORS.textPrimary }} className="tabular-nums">{stat.value}</span>
                      <span style={{ fontSize: FONT.size.sm, color: COLORS.textSecondary }}>{stat.unit}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="w-1 h-1 rounded-full" style={{ background: COLORS.online }} />
                      <span style={{ fontSize: FONT.size.xs, color: COLORS.online }}>正常</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>

        {/* 更多功能入口 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ duration: ANIMATION.duration.normal, delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>更多功能</h3>
          </div>
          <motion.div
            className="p-4"
            style={{
              background: COLORS.card,
              borderRadius: RADIUS.card,
              boxShadow: SHADOWS.sm,
            }}
          >
            <div className="grid grid-cols-3 gap-3">
              {MORE_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.button
                    key={feature.label}
                    onClick={() => onNavigate(feature.page)}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: `${feature.color}08` }}
                    whileHover={{ scale: 1.02, background: `${feature.color}15` }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${feature.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: feature.color }} strokeWidth={2} />
                    </div>
                    <span style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>{feature.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>

        {/* 快捷入口 - 底部 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ duration: ANIMATION.duration.normal, delay: 0.4 }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('health')}
            className="p-4 flex items-center gap-3"
            style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: COLORS.greenLight }}>
              <Heart className="w-6 h-6" style={{ color: COLORS.green }} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>健康中心</p>
              <p style={{ fontSize: FONT.size.base, color: COLORS.textTertiary }}>查看健康数据</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto" style={{ color: COLORS.textQuaternary }} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('translator')}
            className="p-4 flex items-center gap-3"
            style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: COLORS.purpleLight }}>
              <MessageCircle className="w-6 h-6" style={{ color: COLORS.purple }} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>宠物翻译</p>
              <p style={{ fontSize: FONT.size.base, color: COLORS.textTertiary }}>理解宠物语言</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto" style={{ color: COLORS.textQuaternary }} />
          </motion.button>
        </motion.div>

        <div className="h-2" />
      </main>
    </div>
  );
};

export default HomePage;