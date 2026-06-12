/**
 * ProfilePage V2 - 奶油极简风
 */
import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight, Edit3, Bell, Settings as SettingsIcon, Heart, Award, Star, MessageCircle,
  Briefcase, Calendar, Bookmark, Ticket, Home, FileText, Share2, HelpCircle, Info, Zap,
  Signal, Wifi, BatteryFull,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

const colors = {
  bg: '#FDF8F3', card: '#FFFFFF', brand: '#F97316', online: '#10B981',
  orange: '#FB923C', blue: '#60A5FA', red: '#EF4444', purple: '#A78BFA',
};

export const ProfilePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentPet } = useAppStore();
  const petName = currentPet?.name || 'JOJO';

  const stats = [
    { icon: Heart, label: '成长值', value: '1250', color: colors.orange },
    { icon: Award, label: '勋章', value: '12', color: colors.blue },
    { icon: Star, label: '关注', value: '8', color: colors.red },
    { icon: MessageCircle, label: '互动消息', value: '23', color: colors.purple },
  ];

  const services = [
    { icon: Briefcase, label: '服务订单', color: colors.orange },
    { icon: Calendar, label: '预约记录', color: colors.blue },
    { icon: Bookmark, label: '收藏夹', color: colors.online },
    { icon: Ticket, label: '优惠券', color: colors.purple },
  ];

  const menuItems = [
    { icon: Home, label: '我的家庭', rightText: '3位成员', hasAvatars: true },
    { icon: FileText, label: '宠物档案', rightText: '查看/管理档案' },
    { icon: Share2, label: `分享${petName}`, rightText: '邀请家人一起关爱' },
    { icon: HelpCircle, label: '帮助与反馈' },
    { icon: Info, label: '关于我们' },
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

      <main className="px-4 pt-4 space-y-4">
        {/* 头部 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full overflow-hidden" style={{ border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <img src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop&auto=format" alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[20px] font-light text-gray-900">{petName}</span>
                <span className="text-blue-500">♂</span>
              </div>
              <p className="text-[13px] text-gray-500">柯基犬 · 2岁</p>
              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: '#D1FAE5', color: '#047857' }}>
                <Zap className="w-3 h-3 fill-current" />活力充沛
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: colors.card, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <SettingsIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center relative" style={{ background: colors.card, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
          </div>
        </motion.div>

        {/* 编辑资料按钮 */}
        <div className="flex justify-end">
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium" style={{ background: colors.card, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <Edit3 className="w-3 h-3" />编辑资料
          </button>
        </div>

        {/* 4列数据 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-4" style={{ background: colors.card, borderRadius: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        >
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <button key={i} className="flex flex-col items-center gap-1 py-2">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: s.color }} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] text-gray-500">{s.label}</span>
                  <span className="text-[16px] font-light text-gray-900">{s.value}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* 完善资料 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-4 flex items-center gap-3" style={{ background: colors.card, borderRadius: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        >
          <div className="w-14 h-14 rounded-2xl overflow-hidden">
            <img src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop&auto=format" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="text-[15px] font-medium text-gray-900">完善宠物资料</span>
            <p className="text-[12px] text-gray-500 mt-0.5">完整信息有助于获得个性化建议</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${colors.brand}15` }}>
                <motion.div initial={{ width: 0 }} animate={{ width: '80%' }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${colors.orange}, ${colors.brand})` }} />
              </div>
              <span className="text-[10px] text-gray-500">已完成 80%</span>
            </div>
          </div>
          <button className="flex items-center gap-0.5 text-[12px] font-medium" style={{ color: colors.brand }}>
            去完善<ChevronRight className="w-3 h-3" />
          </button>
        </motion.div>

        {/* 我的服务 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="p-4" style={{ background: colors.card, borderRadius: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[16px] font-medium text-gray-900">我的服务</span>
            <button className="flex items-center text-[12px] text-gray-500">全部订单<ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <button key={i} className="flex flex-col items-center gap-1.5 py-2">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: s.color }} strokeWidth={2} />
                  </div>
                  <span className="text-[12px] text-gray-700">{s.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* 菜单列表 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-2" style={{ background: colors.card, borderRadius: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        >
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button key={i} className="flex items-center justify-between w-full py-3 px-3" style={{ borderTop: i > 0 ? '0.5px solid rgba(0,0,0,0.04)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                    <Icon className="w-4 h-4 text-gray-600" strokeWidth={2} />
                  </div>
                  <span className="text-[14px] text-gray-900">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.hasAvatars && (
                    <div className="flex -space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-amber-200 border-2 border-white" />
                      <div className="w-5 h-5 rounded-full bg-orange-300 border-2 border-white" />
                      <div className="w-5 h-5 rounded-full bg-rose-200 border-2 border-white" />
                    </div>
                  )}
                  {item.rightText && <span className="text-[12px] text-gray-400">{item.rightText}</span>}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </button>
            );
          })}
        </motion.div>

        <div className="h-2" />
      </main>
    </div>
  );
};

export default ProfilePage;
