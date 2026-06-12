/**
 * ProfilePage V3 - 奶油极简风统一版
 * 使用统一设计系统 constants.ts
 */
import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight, Edit3, Bell, Settings as SettingsIcon, Heart, Award, Star, MessageCircle,
  Briefcase, Calendar, Bookmark, Ticket, Home, FileText, Share2, HelpCircle, Info, Zap,
  Signal, Wifi, BatteryFull, Shield, GraduationCap, ShoppingBag, PawPrint,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { COLORS, SHADOWS, RADIUS, FONT, ANIMATION, PET_IMAGE } from '../styles/constants';

export const ProfilePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentPet } = useAppStore();
  const petName = currentPet?.name || 'JOJO';

  const stats = [
    { icon: Heart, label: '成长值', value: '1250', color: COLORS.orange },
    { icon: Award, label: '勋章', value: '12', color: COLORS.blue },
    { icon: Star, label: '关注', value: '8', color: COLORS.red },
    { icon: MessageCircle, label: '互动消息', value: '23', color: COLORS.purple },
  ];

  const services = [
    { icon: Briefcase, label: '服务订单', page: 'services', color: COLORS.orange },
    { icon: Calendar, label: '预约记录', page: 'health-records', color: COLORS.blue },
    { icon: Bookmark, label: '收藏夹', page: 'favorites', color: COLORS.green },
    { icon: Ticket, label: '优惠券', page: 'services', color: COLORS.purple },
  ];

  const menuItems = [
    { icon: PawPrint, label: '宠物管理', page: 'pets', rightText: '查看/管理档案' },
    { icon: Home, label: '我的家庭', rightText: '3位成员', hasAvatars: true },
    { icon: FileText, label: '宠物档案', page: 'pets', rightText: '查看/管理档案' },
    { icon: Share2, label: `分享${petName}`, rightText: '邀请家人一起关爱' },
    { icon: Shield, label: '隐私设置', page: 'settings', rightText: '账号安全' },
    { icon: HelpCircle, label: '帮助与反馈', page: 'help-feedback' },
    { icon: Info, label: '关于我们', page: 'developer-info' },
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
        {/* 头部 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          className="flex items-center justify-between"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('pets')}
            className="flex items-center gap-3"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden" style={{ border: '2px solid #fff', boxShadow: SHADOWS.sm }}>
              <img src={PET_IMAGE.avatar} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span style={{ fontSize: FONT.size['3xl'], fontWeight: FONT.weight.light, color: COLORS.textPrimary }}>{petName}</span>
                <span style={{ color: COLORS.blue }}>♂</span>
              </div>
              <p style={{ fontSize: FONT.size.md, color: COLORS.textSecondary }}>柯基犬 · 2岁</p>
              <motion.div
                className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full"
                style={{ background: COLORS.onlineBg }}
              >
                <Zap className="w-3 h-3" style={{ color: COLORS.online, fill: COLORS.online }} />
                <span style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.medium, color: '#047857' }}>活力充沛</span>
              </motion.div>
            </div>
          </motion.button>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate('settings')}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: COLORS.card, boxShadow: SHADOWS.sm }}
            >
              <SettingsIcon className="w-4 h-4" style={{ color: COLORS.textSecondary }} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full flex items-center justify-center relative"
              style={{ background: COLORS.card, boxShadow: SHADOWS.sm }}
            >
              <Bell className="w-4 h-4" style={{ color: COLORS.textSecondary }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: COLORS.red }} />
            </motion.button>
          </div>
        </motion.div>

        {/* 编辑资料按钮 */}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('pets')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full"
            style={{ background: COLORS.card, boxShadow: SHADOWS.xs, fontSize: FONT.size.sm, fontWeight: FONT.weight.medium, color: COLORS.textSecondary }}
          >
            <Edit3 className="w-3 h-3" />
            编辑资料
          </motion.button>
        </div>

        {/* 4列数据 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ delay: 0.05 }}
          className="p-4"
          style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
        >
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <motion.button
                  key={s.label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-1 py-2"
                >
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: s.color }} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: FONT.size.xs, color: COLORS.textSecondary }}>{s.label}</span>
                  <span style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.light, color: COLORS.textPrimary }}>{s.value}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* 完善资料 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ delay: 0.1 }}
          whileHover={ANIMATION.hoverCard}
          onClick={() => onNavigate('pets')}
          className="p-4 flex items-center gap-3 cursor-pointer"
          style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
        >
          <div className="w-14 h-14 rounded-2xl overflow-hidden">
            <img src={PET_IMAGE.avatar} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>完善宠物资料</span>
            <p style={{ fontSize: FONT.size.base, color: COLORS.textSecondary, marginTop: '2px' }}>完整信息有助于获得个性化建议</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${COLORS.brand}15` }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '80%' }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.brand})` }}
                />
              </div>
              <span style={{ fontSize: FONT.size.xs, color: COLORS.textSecondary }}>已完成 80%</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-0.5"
            style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.medium, color: COLORS.brand }}
          >
            去完善
            <ChevronRight className="w-3 h-3" />
          </motion.button>
        </motion.div>

        {/* 我的服务 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ delay: 0.15 }}
          className="p-4"
          style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
        >
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>我的服务</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => onNavigate('services')}
              className="flex items-center"
              style={{ fontSize: FONT.size.base, color: COLORS.textSecondary }}
            >
              全部订单
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <motion.button
                  key={s.label}
                  onClick={() => onNavigate(s.page)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-1.5 py-2"
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: s.color }} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>{s.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* 快捷服务入口 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('training')}
            className="p-4 flex items-center gap-3"
            style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: COLORS.blueLight }}>
              <GraduationCap className="w-6 h-6" style={{ color: COLORS.blue }} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>训练课程</p>
              <p style={{ fontSize: FONT.size.base, color: COLORS.textTertiary }}>科学训练方法</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto" style={{ color: COLORS.textQuaternary }} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('insurance')}
            className="p-4 flex items-center gap-3"
            style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: COLORS.greenLight }}>
              <Shield className="w-6 h-6" style={{ color: COLORS.green }} strokeWidth={2} />
            </div>
            <div>
              <p style={{ fontSize: FONT.size.lg, fontWeight: FONT.weight.medium, color: COLORS.textPrimary }}>宠物保险</p>
              <p style={{ fontSize: FONT.size.base, color: COLORS.textTertiary }}>医疗保障</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto" style={{ color: COLORS.textQuaternary }} />
          </motion.button>
        </motion.div>

        {/* 菜单列表 */}
        <motion.div
          initial={ANIMATION.fadeInUp.initial}
          animate={ANIMATION.fadeInUp.animate}
          transition={{ delay: 0.25 }}
          className="p-2"
          style={{ background: COLORS.card, borderRadius: RADIUS.card, boxShadow: SHADOWS.sm }}
        >
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                onClick={() => item.page && onNavigate(item.page)}
                whileHover={{ scale: 1.01, background: `${COLORS.brand}05` }}
                whileTap={{ scale: 0.99 }}
                className="flex items-center justify-between w-full py-3 px-3"
                style={{ borderTop: i > 0 ? '0.5px solid rgba(0,0,0,0.04)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: COLORS.bgTertiary }}>
                    <Icon className="w-4 h-4" style={{ color: COLORS.textSecondary }} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: FONT.size.lg, color: COLORS.textPrimary }}>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.hasAvatars && (
                    <div className="flex -space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-amber-200 border-2 border-white" />
                      <div className="w-5 h-5 rounded-full bg-orange-300 border-2 border-white" />
                      <div className="w-5 h-5 rounded-full bg-rose-200 border-2 border-white" />
                    </div>
                  )}
                  {item.rightText && <span style={{ fontSize: FONT.size.base, color: COLORS.textTertiary }}>{item.rightText}</span>}
                  <ChevronRight className="w-4 h-4" style={{ color: COLORS.textQuaternary }} />
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        <div className="h-2" />
      </main>
    </div>
  );
};

export default ProfilePage;