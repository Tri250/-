/**
 * ProfilePage - 个人中心（温情科技风格）
 *
 * 设计参考：
 * - 顶部宠物头像 + 昵称 + 性别 + 状态
 * - 编辑资料按钮
 * - 4列数据（成长值/勋章/关注/互动消息）
 * - 完善宠物资料进度条
 * - 我的服务（服务订单/预约记录/收藏夹/优惠券）
 * - 列表菜单（我的家庭/宠物档案/分享JOJO/帮助与反馈/关于我们）
 */

import React from 'react';
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
  Dog,
} from 'lucide-react';
import { WarmContainer, WarmCard } from '../components/WarmContainer';
import { useAppStore } from '../store/appStore';

export const ProfilePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentPet } = useAppStore();
  const petName = currentPet?.name || 'JOJO';
  const petBreed = currentPet?.breed || '柯基犬';
  const petAge = currentPet?.birthday
    ? `${new Date().getFullYear() - new Date(currentPet.birthday).getFullYear()}岁`
    : '2岁';

  const stats = [
    { icon: Heart, label: '成长值', value: '1250', color: '#f59e0b' },
    { icon: Award, label: '勋章', value: '12', color: '#3b82f6' },
    { icon: Heart, label: '关注', value: '8', color: '#ef4444' },
    { icon: MessageCircle, label: '互动消息', value: '23', color: '#a78bfa' },
  ];

  const services = [
    { icon: Briefcase, label: '服务订单', color: '#f59e0b', bg: '#fef3c7' },
    { icon: Calendar, label: '预约记录', color: '#3b82f6', bg: '#dbeafe' },
    { icon: Bookmark, label: '收藏夹', color: '#10b981', bg: '#d1fae5' },
    { icon: Ticket, label: '优惠券', color: '#a78bfa', bg: '#ede9fe' },
  ];

  const menuItems = [
    { icon: Home, label: '我的家庭', rightText: '3位成员', hasAvatars: true },
    { icon: FileText, label: '宠物档案', rightText: '查看/管理档案' },
    { icon: Share2, label: `分享${petName}`, rightText: '邀请家人一起关爱' },
    { icon: HelpCircle, label: '帮助与反馈' },
    { icon: Info, label: '关于我们' },
  ];

  return (
    <WarmContainer>
      {/* 顶部 */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.25)',
            }}
          >
            <Dog className="w-9 h-9 text-amber-900" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold text-gray-900">{petName}</h1>
              <span className="text-blue-500 text-sm">♂</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{petBreed} · {petAge}</p>
            <div
              className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{
                background: 'rgba(110, 231, 183, 0.25)',
                color: '#047857',
              }}
            >
              <Zap className="w-3 h-3 fill-current" />
              活力充沛
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('settings')}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 220, 180, 0.4)',
            }}
          >
            <SettingsIcon className="w-4 h-4 text-gray-700" />
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center relative"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 220, 180, 0.4)',
            }}
          >
            <Bell className="w-4 h-4 text-gray-700" />
            <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
          </button>
        </div>
      </div>

      {/* 编辑资料按钮 */}
      <div className="px-4 mt-3 flex justify-end">
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(255, 220, 180, 0.4)',
            color: '#6b7280',
          }}
        >
          <Edit3 className="w-3.5 h-3.5" />
          编辑资料
        </button>
      </div>

      <main className="max-w-md mx-auto px-4 mt-3 space-y-4">
        {/* 4列数据 */}
        <WarmCard padding="md">
          <div className="grid grid-cols-4 gap-2">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-1.5"
                    style={{ background: `${stat.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} strokeWidth={2} />
                  </div>
                  <span className="text-[11px] text-gray-500">{stat.label}</span>
                  <span className="text-base font-bold text-gray-900 mt-0.5">{stat.value}</span>
                </div>
              );
            })}
          </div>
        </WarmCard>

        {/* 完善宠物资料 */}
        <WarmCard padding="md">
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f5e6d3 0%, #d4a574 100%)' }}
            >
              <Dog className="w-10 h-10 text-amber-900" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900">完善宠物资料</h3>
              <p className="text-[12px] text-gray-500 mt-0.5">完整信息有助于获得个性化建议</p>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(249, 115, 22, 0.15)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: '80%',
                      background: 'linear-gradient(90deg, #fbbf24 0%, #f97316 100%)',
                    }}
                  />
                </div>
                <span className="text-[11px] text-gray-500">已完成 80%</span>
              </div>
            </div>
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(249, 115, 22, 0.1)',
                color: '#ea580c',
              }}
            >
              去完善
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </WarmCard>

        {/* 我的服务 */}
        <WarmCard padding="md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">我的服务</h3>
            <button className="text-[11px] text-gray-500 flex items-center gap-0.5">
              全部订单
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {services.map((service, i) => {
              const Icon = service.icon;
              return (
                <button
                  key={i}
                  className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: service.bg }}
                  >
                    <Icon className="w-6 h-6" style={{ color: service.color }} strokeWidth={2} />
                  </div>
                  <span className="text-[12px] text-gray-700 font-medium">
                    {service.label}
                  </span>
                </button>
              );
            })}
          </div>
        </WarmCard>

        {/* 列表菜单 */}
        <WarmCard padding="sm">
          <div>
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  className="flex items-center justify-between w-full py-3 px-2 active:bg-gray-50 transition-colors"
                  style={{
                    borderTop: i > 0 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-500" strokeWidth={2} />
                    <span className="text-sm text-gray-900 font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.hasAvatars && (
                      <div className="flex -space-x-1.5">
                        <div className="w-5 h-5 rounded-full bg-amber-200 border-2 border-white" />
                        <div className="w-5 h-5 rounded-full bg-orange-300 border-2 border-white" />
                      </div>
                    )}
                    {item.rightText && (
                      <span className="text-[12px] text-gray-400">{item.rightText}</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </button>
              );
            })}
          </div>
        </WarmCard>

        <div className="h-4" />
      </main>
    </WarmContainer>
  );
};

export default ProfilePage;
