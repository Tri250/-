/**
 * HomePage - 主页（温情科技风格）
 *
 * 设计参考：温色系宠物APP，仿iOS ColorOS 风格
 * - 顶部米色背景，宠物头像+昵称+性别图标
 * - 宠物主图（柯基）
 * - 引言气泡 + "孪生宠物"按钮
 * - 4列快捷功能（AI问诊/健康报告/饮食建议/宠物档案）
 * - 我的设备横向卡片
 * - 今日饮食数据 4列统计
 */

import React from 'react';
import {
  ChevronRight,
  Stethoscope,
  FileText,
  Utensils,
  FolderOpen,
  BatteryMedium,
  Footprints,
  Plus,
  Battery,
  Zap,
  Droplet,
  Clock,
  CheckCircle2,
  Dog,
  Sparkles,
} from 'lucide-react';
import { WarmContainer, PageHeader, WarmCard, SectionTitle } from '../components/WarmContainer';
import { useAppStore } from '../store/appStore';

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
    { icon: Stethoscope, label: 'AI问诊', sub: '智能问答', color: '#3b82f6', bg: 'rgba(219, 234, 254, 0.7)' },
    { icon: FileText, label: '健康报告', sub: '今日生成', color: '#10b981', bg: 'rgba(209, 250, 229, 0.7)' },
    { icon: Utensils, label: '饮食建议', sub: '科学喂养', color: '#f59e0b', bg: 'rgba(254, 243, 199, 0.7)' },
    { icon: FolderOpen, label: '宠物档案', sub: '记录成长', color: '#a78bfa', bg: 'rgba(237, 233, 254, 0.7)' },
  ];

  const devices = [
    { icon: Utensils, name: `${petName}的碗`, battery: 85, online: true, color: '#f59e0b' },
    { icon: Footprints, name: '智能项圈', battery: 92, online: true, color: '#3b82f6' },
    { icon: Droplet, name: '饮水机', battery: 78, online: true, color: '#06b6d4' },
  ];

  const dietStats = [
    { icon: Utensils, label: '进食次数', value: '8', unit: '次', status: '正常', color: '#f59e0b' },
    { icon: Sparkles, label: '进食总量', value: '320', unit: 'g', status: '正常', color: '#10b981' },
    { icon: Zap, label: '消耗卡路里', value: '280', unit: 'kcal', status: '正常', color: '#f97316' },
    { icon: Clock, label: '进食时长', value: '12', unit: '分钟', status: '正常', color: '#a78bfa' },
  ];

  return (
    <WarmContainer>
      {/* 顶部宠物卡片 */}
      <div className="px-4 pt-6 pb-2 flex items-center gap-3">
        <div className="relative">
          <div
            className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.25)',
            }}
          >
            <Dog className="w-9 h-9 text-amber-900" strokeWidth={2} />
          </div>
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
        <button
          onClick={() => onNavigate('profile')}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          aria-label="切换宠物"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* 引言气泡 */}
      <div className="px-4 mt-3">
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-3 relative"
          style={{
            background: 'rgba(255, 251, 244, 0.95)',
            border: '1px solid rgba(255, 220, 180, 0.4)',
          }}
        >
          <span
            className="absolute -top-1 left-4 text-2xl leading-none"
            style={{ color: '#fbbf24' }}
          >
            "
          </span>
          <div className="flex-1 pt-1.5">
            <p className="text-sm text-gray-700 leading-relaxed">
              今天我跑了多少圈，感觉活力满满呀~
            </p>
          </div>
          <Dog className="w-9 h-9 text-amber-700" strokeWidth={1.5} />
          <button
            className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
            }}
          >
            孪生宠物
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 宠物主图区域 */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden relative" style={{ height: '180px', background: 'linear-gradient(135deg, #f5e6d3 0%, #d4a574 100%)' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Dog className="w-32 h-32 text-amber-900/40" strokeWidth={1} />
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px]" style={{ background: 'rgba(255, 255, 255, 0.85)', color: '#92400e' }}>
            <Utensils className="w-3 h-3" />
            120g 进食完成
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 mt-5 space-y-5">
        {/* 快捷功能 4列 */}
        <WarmCard padding="md">
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => onNavigate('ai-consultant')}
                  className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: action.bg }}
                  >
                    <Icon className="w-6 h-6" style={{ color: action.color }} strokeWidth={2} />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold text-gray-900">{action.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{action.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </WarmCard>

        {/* 我的设备 */}
        <div>
          <SectionTitle
            title="我的设备"
            rightAction={
              <button className="text-xs text-gray-500 flex items-center gap-0.5">
                查看全部
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <WarmCard padding="md">
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
              {devices.map((device, i) => {
                const Icon = device.icon;
                return (
                  <div
                    key={i}
                    className="flex-1 min-w-[100px] flex flex-col items-center"
                  >
                    <div className="flex items-center gap-1 mb-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: '#10b981' }}
                      />
                      <span className="text-[10px]" style={{ color: '#10b981' }}>
                        在线
                      </span>
                    </div>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                      style={{ background: 'rgba(255, 255, 255, 0.8)' }}
                    >
                      <Icon className="w-8 h-8" style={{ color: device.color }} strokeWidth={1.5} />
                    </div>
                    <p className="text-[13px] font-semibold text-gray-900 text-center truncate w-full">
                      {device.name}
                    </p>
                    <div
                      className="mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(34, 197, 94, 0.12)' }}
                    >
                      <Battery className="w-3 h-3" style={{ color: '#16a34a' }} />
                      <span className="text-[10px] font-semibold" style={{ color: '#16a34a' }}>
                        {device.battery}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {/* 添加设备 */}
              <div className="flex-1 min-w-[100px] flex flex-col items-center">
                <div className="h-4 mb-2" />
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2 border-2 border-dashed"
                  style={{ borderColor: 'rgba(156, 163, 175, 0.3)' }}
                >
                  <Plus className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-[13px] font-medium text-gray-400 text-center">添加设备</p>
                <div className="h-5 mt-1.5" />
              </div>
            </div>
          </WarmCard>
        </div>

        {/* 今日饮食数据 */}
        <div>
          <SectionTitle
            title="今日饮食数据"
            rightAction={
              <button className="text-xs text-gray-500 flex items-center gap-0.5">
                更多数据
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <WarmCard padding="md">
            <div className="grid grid-cols-4 gap-1">
              {dietStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-1.5">
                      <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} strokeWidth={2} />
                      <span className="text-[10px] text-gray-500">{stat.label}</span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-2xl font-bold text-gray-900 tabular-nums">{stat.value}</span>
                      <span className="text-[11px] text-gray-500 font-medium">{stat.unit}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      <span className="w-1 h-1 rounded-full" style={{ background: '#10b981' }} />
                      <span className="text-[10px]" style={{ color: '#10b981' }}>
                        {stat.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </WarmCard>
        </div>

        {/* 底部留白 */}
        <div className="h-4" />
      </main>
    </WarmContainer>
  );
};

export default HomePage;
