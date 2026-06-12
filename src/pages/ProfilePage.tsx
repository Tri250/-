/**
 * Profile Page - 我的页面
 *
 * Apple风格设计，统一风格、颜色、字体搭配
 * 完美适配多端分辨率
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Settings,
  Bell,
  Shield,
  Heart,
  PawPrint,
  Star,
  Gift,
  HelpCircle,
  MessageCircle,
  Share2,
  User,
  Camera,
  Edit3,
  Crown,
  Award,
  Zap,
  Moon,
  LogOut,
} from 'lucide-react';
import { useUserProfileStore, type MembershipStatus } from '../store/userProfileStore';
import { useSettingsStore } from '../store/settingsStore';
import { useResponsive, useResponsiveStyle } from '../lib/responsive';
import { createAnimation, AnimationConfig } from '../lib/animations';
import '../styles/apple-style.css';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

// 菜单项类型
interface MenuItem {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  page?: string;
  action?: () => void;
}

// 分组类型
interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { profile, membership: rawMembership, stats: rawStats, isLoggedIn, updateProfile } = useUserProfileStore();
  // 使用默认值防止 undefined
  const stats = rawStats || { totalPets: 0, totalRecords: 0, totalDays: 0, achievements: 0, points: 0 };
  const membership = rawMembership || { level: 'free', features: ['basic_features'] };
  const { display, toggleDarkMode, notifications } = useSettingsStore();
  const responsive = useResponsive();
  const responsiveStyle = useResponsiveStyle();
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // 头像点击动画
  const handleAvatarClick = async (element: HTMLElement) => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    const animator = createAnimation(element);
    await animator.bounce(AnimationConfig.duration.slow);
    
    setIsAnimating(false);
  };

  // 获取会员图标和颜色
  const getMembershipStyle = (level: MembershipStatus['level']) => {
    const styles: Record<MembershipStatus['level'], { icon: React.ElementType; color: string; bgColor: string }> = {
      free: { icon: User, color: '#86868B', bgColor: '#F5F5F7' },
      basic: { icon: Star, color: '#34C759', bgColor: '#E8F5E9' },
      premium: { icon: Crown, color: '#F5A623', bgColor: '#FFF4E5' },
      vip: { icon: Award, color: '#AF52DE', bgColor: '#F5E5FF' },
    };
    return styles[level];
  };

  // 菜单分组
  const menuGroups: MenuGroup[] = [
    {
      title: '账户管理',
      items: [
        {
          id: 'pets',
          icon: PawPrint,
          title: '我的宠物',
          subtitle: `${stats.totalPets || 0} 只宠物`,
          badge: (stats.totalPets || 0).toString(),
          badgeColor: '#F5A623',
          page: 'pets',
        },
        {
          id: 'favorites',
          icon: Heart,
          title: '我的收藏',
          subtitle: '收藏的内容和服务',
          page: 'favorites',
        },
        {
          id: 'achievements',
          icon: Award,
          title: '成就徽章',
          subtitle: `${stats.achievements || 0} 个徽章`,
          badge: (stats.achievements || 0).toString(),
          badgeColor: '#34C759',
          page: 'achievements',
        },
      ],
    },
    {
      title: '会员服务',
      items: [
        {
          id: 'membership',
          icon: getMembershipStyle(membership.level || 'free').icon,
          title: '会员中心',
          subtitle: (membership.level || 'free') === 'free' ? '升级享受更多权益' : `${membership.level || 'free'}会员`,
          badge: (membership.level || 'free') !== 'free' ? 'VIP' : undefined,
          badgeColor: getMembershipStyle(membership.level || 'free').color,
          page: 'membership',
        },
        {
          id: 'points',
          icon: Zap,
          title: '积分商城',
          subtitle: `${stats.points || 0} 积分`,
          badge: (stats.points || 0).toString(),
          badgeColor: '#FF9500',
          page: 'points',
        },
        {
          id: 'gift',
          icon: Gift,
          title: '邀请好友',
          subtitle: '分享获得奖励',
          page: 'invite',
        },
      ],
    },
    {
      title: '应用设置',
      items: [
        {
          id: 'settings',
          icon: Settings,
          title: '设置',
          subtitle: '应用偏好设置',
          page: 'settings',
        },
        {
          id: 'notifications',
          icon: Bell,
          title: '通知管理',
          subtitle: notifications.enabled ? '已开启' : '已关闭',
          badge: notifications.enabled ? '开' : '关',
          badgeColor: notifications.enabled ? '#34C759' : '#86868B',
          page: 'notifications',
        },
        {
          id: 'darkmode',
          icon: Moon,
          title: '深色模式',
          subtitle: display.darkMode ? '已开启' : '已关闭',
          action: () => toggleDarkMode(),
        },
        {
          id: 'privacy',
          icon: Shield,
          title: '隐私安全',
          subtitle: '数据与隐私设置',
          page: 'privacy',
        },
      ],
    },
    {
      title: '帮助与支持',
      items: [
        {
          id: 'help',
          icon: HelpCircle,
          title: '帮助中心',
          subtitle: '常见问题解答',
          page: 'help-feedback',
        },
        {
          id: 'feedback',
          icon: MessageCircle,
          title: '意见反馈',
          subtitle: '帮助我们改进',
          page: 'help-feedback',
        },
        {
          id: 'share',
          icon: Share2,
          title: '分享应用',
          subtitle: '推荐给好友',
          action: () => {
            // 分享功能
          },
        },
        {
          id: 'developer',
          icon: Heart,
          title: '开发者',
          subtitle: '带娃的小陈工',
          badge: '❤️',
          badgeColor: '#F5A623',
          page: 'developer-info',
        },
      ],
    },
  ];

  // 菜单项点击处理
  const handleMenuClick = (item: MenuItem, element: HTMLElement) => {
    // 点击动画
    const animator = createAnimation(element);
    animator.press();
    
    setTimeout(() => {
      animator.release();
      
      if (item.action) {
        item.action();
      } else if (item.page) {
        onNavigate(item.page);
      }
    }, AnimationConfig.duration.fast);
  };

  // 渲染菜单项
  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    
    return (
      <button
        key={item.id}
        onClick={(e) => handleMenuClick(item, e.currentTarget)}
        className="w-full flex items-center gap-4 p-4 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors touch-scale"
        style={{
          borderRadius: responsiveStyle.cardRadius,
        }}
      >
        {/* 图标 */}
        <div
          className="flex items-center justify-center"
          style={{
            width: responsiveStyle.iconSize + 8,
            height: responsiveStyle.iconSize + 8,
            backgroundColor: '#F5F5F7',
            borderRadius: responsiveStyle.cardRadius - 4,
          }}
        >
          <Icon
            style={{
              width: responsiveStyle.iconSize,
              height: responsiveStyle.iconSize,
              color: '#F5A623',
            }}
          />
        </div>
        
        {/* 标题和副标题 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-medium truncate"
              style={{
                fontSize: responsiveStyle.fontSize,
                color: '#1D1D1F',
              }}
            >
              {item.title}
            </span>
            {item.badge && (
              <span
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: item.badgeColor ? `${item.badgeColor}20` : '#F5F5F7',
                  color: item.badgeColor || '#86868B',
                }}
              >
                {item.badge}
              </span>
            )}
          </div>
          {item.subtitle && (
            <span
              className="text-sm truncate"
              style={{
                color: '#86868B',
              }}
            >
              {item.subtitle}
            </span>
          )}
        </div>
        
        {/* 右箭头 */}
        <ChevronRight
          style={{
            width: responsiveStyle.iconSize - 4,
            height: responsiveStyle.iconSize - 4,
            color: '#C7C7CC',
          }}
        />
      </button>
    );
  };

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        backgroundColor: '#FAF7F2',
        paddingTop: responsiveStyle.safeAreaPadding.paddingTop + 48,
      }}
    >
      {/* 顶部导航 */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl"
        style={{
          paddingTop: responsiveStyle.safeAreaPadding.paddingTop + 12,
          paddingBottom: 12,
          borderBottom: '1px solid rgba(60, 60, 67, 0.12)',
        }}
      >
        <div className="flex items-center justify-between px-4">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors touch-scale"
          >
            <ChevronLeft style={{ width: 24, height: 24, color: '#1D1D1F' }} />
          </button>
          <h1
            className="font-semibold"
            style={{
              fontSize: responsiveStyle.fontSize + 2,
              color: '#1D1D1F',
            }}
          >
            我的
          </h1>
          <button
            onClick={() => onNavigate('settings')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors touch-scale"
          >
            <Settings style={{ width: 20, height: 20, color: '#1D1D1F' }} />
          </button>
        </div>
      </div>

      {/* 用户信息卡片 */}
      <div className="px-4 mb-6">
        <div
          className="bg-white overflow-hidden animate-scale-in"
          style={{
            borderRadius: responsiveStyle.cardRadius + 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          {/* 用户头像和基本信息 */}
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={(e) => handleAvatarClick(e.currentTarget)}
              className="relative overflow-hidden touch-scale"
              style={{
                width: responsiveStyle.avatarSize,
                height: responsiveStyle.avatarSize,
                borderRadius: responsiveStyle.avatarSize / 2,
              }}
            >
              <img
                src={profile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'}
                alt="用户头像"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute bottom-0 right-0 flex items-center justify-center bg-white"
                style={{
                  width: responsiveStyle.avatarSize / 4,
                  height: responsiveStyle.avatarSize / 4,
                  borderRadius: responsiveStyle.avatarSize / 8,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}
              >
                <Camera style={{ width: 12, height: 12, color: '#F5A623' }} />
              </div>
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  className="font-semibold truncate"
                  style={{
                    fontSize: responsiveStyle.fontSize + 4,
                    color: '#1D1D1F',
                  }}
                >
                  {profile?.name || '宠物主人'}
                </h2>
                <Edit3 style={{ width: 16, height: 16, color: '#86868B' }} />
              </div>
              <p
                className="text-sm truncate"
                style={{ color: '#86868B' }}
              >
                {profile?.email || 'user@pawsync.com'}
              </p>
            </div>
            
            {/* 会员标识 */}
            <div
              className="flex items-center gap-1 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: getMembershipStyle(membership.level || 'free').bgColor,
              }}
            >
              {React.createElement(getMembershipStyle(membership.level || 'free').icon, {
                style: { width: 16, height: 16, color: getMembershipStyle(membership.level || 'free').color },
              })}
              <span
                className="text-xs font-medium"
                style={{ color: getMembershipStyle(membership.level || 'free').color }}
              >
                {(membership.level || 'free') === 'free' ? '普通' : (membership.level || 'free').toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* 统计数据 */}
          <div
            className="flex justify-around py-4"
            style={{
              borderTop: '1px solid rgba(60, 60, 67, 0.12)',
            }}
          >
            {[
              { label: '宠物', value: stats.totalPets || 0, icon: PawPrint },
              { label: '记录', value: stats.totalRecords || 0, icon: Heart },
              { label: '天数', value: stats.totalDays || 0, icon: Zap },
              { label: '积分', value: stats.points || 0, icon: Star },
            ].map((stat, index) => (
              <button
                key={index}
                className="flex flex-col items-center gap-1 touch-scale"
                onClick={(e) => {
                  const animator = createAnimation(e.currentTarget);
                  animator.bounce(AnimationConfig.duration.normal);
                }}
              >
                <stat.icon style={{ width: 20, height: 20, color: '#F5A623' }} />
                <span
                  className="font-semibold font-mono"
                  style={{
                    fontSize: responsiveStyle.fontSize + 2,
                    color: '#1D1D1F',
                  }}
                >
                  {stat.value}
                </span>
                <span
                  className="text-xs"
                  style={{ color: '#86868B' }}
                >
                  {stat.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 菜单列表 */}
      <div className="px-4 space-y-4">
        {menuGroups.map((group, groupIndex) => (
          <div
            key={group.title}
            className="animate-fade-in"
            style={{
              animationDelay: `${groupIndex * AnimationConfig.duration.fast}ms`,
            }}
          >
            {/* 分组标题 */}
            <h3
              className="px-2 mb-2 font-medium"
              style={{
                fontSize: responsiveStyle.fontSize - 2,
                color: '#86868B',
              }}
            >
              {group.title}
            </h3>
            
            {/* 分组内容 */}
            <div
              className="bg-white overflow-hidden"
              style={{
                borderRadius: responsiveStyle.cardRadius,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              {group.items.map((item, itemIndex) => (
                <div
                  key={item.id}
                  style={{
                    borderBottom: itemIndex < group.items.length - 1
                      ? '1px solid rgba(60, 60, 67, 0.12)'
                      : 'none',
                  }}
                >
                  {renderMenuItem(item)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 退出登录按钮 */}
      <div className="px-4 mt-6">
        <button
          onClick={(e) => {
            const animator = createAnimation(e.currentTarget);
            animator.press();
            setTimeout(() => {
              animator.release();
              setShowLogoutModal(true);
            }, AnimationConfig.duration.fast);
          }}
          className="w-full flex items-center justify-center gap-2 py-4 bg-white rounded-xl text-red-500 font-medium touch-scale"
          style={{
            borderRadius: responsiveStyle.cardRadius,
          }}
        >
          <LogOut style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: responsiveStyle.fontSize }}>退出登录</span>
        </button>
      </div>

      {/* 版本信息 */}
      <div className="text-center mt-6 mb-4">
        <p className="text-xs" style={{ color: '#AEAEB2' }}>
          PawSync Pro v1.0.0
        </p>
        <p className="text-xs mt-1" style={{ color: '#C7C7CC' }}>
          © 2024 PawSync Team
        </p>
      </div>

      {/* 退出确认模态框 */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-fade-in"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingBottom: responsiveStyle.safeAreaPadding.paddingBottom + 24,
            }}
          >
            <div className="text-center mb-6">
              <h3
                className="font-semibold mb-2"
                style={{
                  fontSize: responsiveStyle.fontSize + 4,
                  color: '#1D1D1F',
                }}
              >
                确认退出登录？
              </h3>
              <p
                className="text-sm"
                style={{ color: '#86868B' }}
              >
                退出后需要重新登录才能使用完整功能
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 bg-gray-100 rounded-xl font-medium"
                style={{
                  fontSize: responsiveStyle.fontSize,
                  color: '#1D1D1F',
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  // 执行退出登录
                }}
                className="flex-1 py-3 bg-red-500 rounded-xl font-medium text-white"
                style={{
                  fontSize: responsiveStyle.fontSize,
                }}
              >
                确认退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;