// ============================================
// PawSync Pro - ProfilePage.tsx
//
// 描述: 我的页面 - 奶油色/米色温暖设计风格
// 顶部用户信息+4列统计+服务入口+列表项
// ============================================

import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Edit3,
  ChevronRight,
  Camera,
  TrendingUp,
  Award,
  Users,
  MessageCircle,
  ShoppingBag,
  Calendar,
  Bookmark,
  Ticket,
  Home as HomeIcon,
  PawPrint,
  Share2,
  HelpCircle,
  Info,
  Zap,
  Battery,
  Wifi,
  Signal,
  Crown,
  Sparkles,
  Shield,
  CreditCard,
  Gift,
  Star,
  LogOut,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useBondStore } from '../store/bondStore';
import { cn } from '../lib/utils';

interface ProfilePageProps {
  onNavigate?: (page: string) => void;
}

const StatCard: React.FC<{
  icon: React.ElementType;
  value: number | string;
  label: string;
  bgColor: string;
  iconColor: string;
}> = ({ icon: Icon, value, label, bgColor, iconColor }) => (
  <div className="flex flex-col items-center justify-center bg-white rounded-2xl py-3.5 px-1.5 shadow-soft active-scale transition-all">
    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center mb-1.5', bgColor)}>
      <Icon className={cn('w-4.5 h-4.5', iconColor)} strokeWidth={2.2} />
    </div>
    <div className="text-lg font-bold text-neutral-800 tabular-nums leading-tight">{value}</div>
    <div className="text-[11px] text-neutral-400 mt-0.5">{label}</div>
  </div>
);

const ServiceEntry: React.FC<{
  icon: React.ElementType;
  label: string;
  bgColor: string;
  iconColor: string;
  onClick: () => void;
}> = ({ icon: Icon, label, bgColor, iconColor, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 active-scale transition-transform"
  >
    <div className={cn('w-14 h-14 rounded-full flex items-center justify-center shadow-soft', bgColor)}>
      <Icon className={cn('w-6 h-6', iconColor)} strokeWidth={2.2} />
    </div>
    <span className="text-xs font-medium text-neutral-700">{label}</span>
  </button>
);

const ListRow: React.FC<{
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  right?: React.ReactNode;
  onClick?: () => void;
}> = ({ icon: Icon, iconBg, iconColor, title, right, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-cream-100/50 transition-colors active-scale"
  >
    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
      <Icon className={cn('w-5 h-5', iconColor)} strokeWidth={2} />
    </div>
    <span className="flex-1 text-left text-[15px] font-medium text-neutral-800">{title}</span>
    {right}
    <ChevronRight className="w-4.5 h-4.5 text-neutral-300 flex-shrink-0" />
  </button>
);

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { currentPet, analyses } = useAppStore();
  const { badges, totalPoints } = useBondStore();
  const [now] = useState(new Date());

  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const handleNav = (page: string) => onNavigate?.(page);

  const stats = {
    growth: totalPoints,
    badges: badges.filter((b) => b.isUnlocked).length,
    following: 12,
    messages: 3,
  };

  const familyMembers = [
    { name: '妈妈', color: 'from-pink-400 to-rose-500' },
    { name: '爸', color: 'from-blue-400 to-cyan-500' },
    { name: '我', color: 'from-orange-400 to-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-200 pb-24">
      {/* 状态栏 */}
      <div className="flex items-center justify-between px-6 pt-2.5 pb-1 text-[13px] font-semibold text-neutral-800">
        <span className="tabular-nums">{time}</span>
        <div className="flex items-center gap-1.5">
          <Signal className="w-3.5 h-3.5" strokeWidth={2.5} />
          <Wifi className="w-3.5 h-3.5" strokeWidth={2.5} />
          <Battery className="w-5 h-5" strokeWidth={2.2} />
        </div>
      </div>

      {/* 顶部用户信息区 */}
      <header className="px-4 pt-3 pb-5">
        <div className="flex items-start gap-3">
          {/* 宠物头像 */}
          <div className="relative flex-shrink-0">
            <div className="w-[68px] h-[68px] rounded-full bg-white p-1 shadow-soft">
              {currentPet?.avatarUrl ? (
                <img
                  src={currentPet.avatarUrl}
                  alt={currentPet.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center text-2xl">
                  🐱
                </div>
              )}
            </div>
            <button
              onClick={() => handleNav('pets')}
              className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white border-2 border-cream-100 flex items-center justify-center shadow-soft"
            >
              <Camera className="w-3 h-3" strokeWidth={2.5} />
            </button>
          </div>

          {/* 宠物信息 */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[20px] font-bold text-neutral-900 leading-none">
                {currentPet?.name || '毛球'}
              </h1>
              <span className="text-base">♂</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-success-50 text-success-600 text-[10px] font-medium">
                <Zap className="w-2.5 h-2.5 fill-success-500" />
                活力充沛
              </span>
            </div>
            <p className="text-[12px] text-neutral-500 mt-1.5">
              {currentPet?.breed || '英国短毛猫'} · {currentPet?.age || 4}岁 · 5.2kg
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-warning-100 text-warning-600 text-[10px] font-medium">
                <Crown className="w-2.5 h-2.5" />
                Pro会员
              </span>
            </div>
          </div>

          {/* 右上图标按钮 */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => handleNav('settings')}
              className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center active-scale"
              aria-label="设置"
            >
              <SettingsIcon className="w-4.5 h-4.5 text-neutral-600" strokeWidth={2.2} />
            </button>
            <button
              onClick={() => handleNav('reminders')}
              className="relative w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center active-scale"
              aria-label="通知"
            >
              <Bell className="w-4.5 h-4.5 text-neutral-600" strokeWidth={2.2} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger-500 border-2 border-white" />
            </button>
            <button
              onClick={() => handleNav('profile-edit')}
              className="ml-1 px-3 h-9 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-semibold flex items-center gap-1 shadow-glow-cream active-scale"
            >
              <Edit3 className="w-3.5 h-3.5" strokeWidth={2.5} />
              编辑资料
            </button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="px-4 space-y-4">
        {/* 4列统计卡片 */}
        <div className="grid grid-cols-4 gap-2.5">
          <StatCard
            icon={TrendingUp}
            value={stats.growth}
            label="成长值"
            bgColor="bg-orange-50"
            iconColor="text-primary-500"
          />
          <StatCard
            icon={Award}
            value={stats.badges}
            label="勋章"
            bgColor="bg-blue-50"
            iconColor="text-info-500"
          />
          <StatCard
            icon={Users}
            value={stats.following}
            label="关注"
            bgColor="bg-rose-50"
            iconColor="text-danger-500"
          />
          <StatCard
            icon={MessageCircle}
            value={stats.messages}
            label="互动消息"
            bgColor="bg-violet-50"
            iconColor="text-secondary-500"
          />
        </div>

        {/* 完善宠物资料渐变卡 */}
        <div
          onClick={() => handleNav('profile-edit')}
          className="relative overflow-hidden rounded-3xl p-5 cursor-pointer active-scale"
          style={{
            background:
              'linear-gradient(135deg, #FFB778 0%, #FF8A3D 60%, #F5722A 100%)',
          }}
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-36 h-36 rounded-full bg-yellow-200/30 blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-bold text-white leading-tight">
                完善宠物资料
              </h3>
              <p className="text-[12px] text-white/85 mt-1">
                完整信息有助于获得个性化建议
              </p>

              <div className="mt-3.5">
                <div className="flex items-center justify-between text-[11px] text-white/90 mb-1.5">
                  <span>资料完整度</span>
                  <span className="font-bold tabular-nums">68%</span>
                </div>
                <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: '68%' }}
                  />
                </div>
              </div>

              <button className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 text-primary-600 text-xs font-semibold shadow-sm">
                去完善
                <ChevronRight className="w-3 h-3" strokeWidth={3} />
              </button>
            </div>

            <div className="flex-shrink-0 w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              <span className="text-5xl">🐱</span>
            </div>
          </div>
        </div>

        {/* 我的服务 */}
        <div className="bg-white rounded-3xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-neutral-800">我的服务</h2>
            <button
              onClick={() => handleNav('services')}
              className="text-[12px] text-primary-500 font-medium flex items-center gap-0.5"
            >
              全部订单
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <ServiceEntry
              icon={ShoppingBag}
              label="服务订单"
              bgColor="bg-orange-50"
              iconColor="text-primary-500"
              onClick={() => handleNav('services')}
            />
            <ServiceEntry
              icon={Calendar}
              label="预约记录"
              bgColor="bg-amber-50"
              iconColor="text-warning-500"
              onClick={() => handleNav('services')}
            />
            <ServiceEntry
              icon={Bookmark}
              label="收藏夹"
              bgColor="bg-emerald-50"
              iconColor="text-success-500"
              onClick={() => handleNav('favorites')}
            />
            <ServiceEntry
              icon={Ticket}
              label="优惠券"
              bgColor="bg-blue-50"
              iconColor="text-info-500"
              onClick={() => handleNav('services')}
            />
          </div>
        </div>

        {/* 账户管理 */}
        <div className="bg-white rounded-3xl p-4 shadow-soft">
          <h2 className="text-[15px] font-bold text-neutral-800 mb-4">账户管理</h2>
          <div className="grid grid-cols-4 gap-2">
            <ServiceEntry
              icon={Shield}
              label="账户安全"
              bgColor="bg-gradient-to-br from-blue-100 to-cyan-100"
              iconColor="text-info-600"
              onClick={() => handleNav('settings')}
            />
            <ServiceEntry
              icon={CreditCard}
              label="支付管理"
              bgColor="bg-gradient-to-br from-emerald-100 to-teal-100"
              iconColor="text-success-600"
              onClick={() => handleNav('settings')}
            />
            <ServiceEntry
              icon={Gift}
              label="会员权益"
              bgColor="bg-gradient-to-br from-amber-100 to-orange-100"
              iconColor="text-warning-600"
              onClick={() => {}}
            />
            <ServiceEntry
              icon={Star}
              label="我的评价"
              bgColor="bg-gradient-to-br from-violet-100 to-purple-100"
              iconColor="text-secondary-600"
              onClick={() => {}}
            />
          </div>
        </div>

        {/* 翻译次数统计卡（保留原功能） */}
        {analyses.length > 0 && (
          <div className="bg-white rounded-3xl p-4 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-neutral-800">最近翻译</h3>
              <button
                onClick={() => handleNav('history')}
                className="text-[12px] text-primary-500 font-medium flex items-center gap-0.5"
              >
                全部
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center py-2">
                <div className="text-[20px] font-bold text-neutral-900 tabular-nums">
                  {analyses.length}
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">翻译次数</div>
              </div>
              <div className="text-center py-2">
                <div className="text-[20px] font-bold text-neutral-900 tabular-nums">128</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">守护天数</div>
              </div>
              <div className="text-center py-2">
                <div className="text-[20px] font-bold text-neutral-900 tabular-nums">98%</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">健康率</div>
              </div>
            </div>
          </div>
        )}

        {/* 列表项 */}
        <div className="bg-white rounded-3xl shadow-soft overflow-hidden divide-y divide-cream-100">
          <ListRow
            icon={HomeIcon}
            iconBg="bg-orange-50"
            iconColor="text-primary-500"
            title="家庭管理"
            right={
              <div className="flex items-center -space-x-2 mr-1">
                {familyMembers.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white',
                      m.color
                    )}
                  >
                    {m.name.charAt(0)}
                  </div>
                ))}
                <div className="w-7 h-7 rounded-full bg-cream-200 flex items-center justify-center text-neutral-500 text-xs font-semibold border-2 border-white">
                  +
                </div>
              </div>
            }
            onClick={() => handleNav('family')}
          />

          <ListRow
            icon={PawPrint}
            iconBg="bg-blue-50"
            iconColor="text-info-500"
            title="宠物档案"
            onClick={() => handleNav('pets')}
          />

          <ListRow
            icon={SettingsIcon}
            iconBg="bg-violet-50"
            iconColor="text-secondary-500"
            title="应用设置"
            onClick={() => handleNav('settings')}
          />

          <ListRow
            icon={Bell}
            iconBg="bg-amber-50"
            iconColor="text-warning-500"
            title="通知偏好"
            onClick={() => handleNav('reminders')}
          />

          <ListRow
            icon={Share2}
            iconBg="bg-emerald-50"
            iconColor="text-success-500"
            title={`分享${currentPet?.name || 'JOJO'}`}
            onClick={() => handleNav('share')}
          />

          <ListRow
            icon={HelpCircle}
            iconBg="bg-rose-50"
            iconColor="text-danger-500"
            title="帮助与反馈"
            onClick={() => handleNav('help-feedback')}
          />

          <ListRow
            icon={Info}
            iconBg="bg-neutral-100"
            iconColor="text-neutral-500"
            title="关于我们"
            onClick={() => handleNav('developer-info')}
          />
        </div>

        {/* 退出登录 */}
        <button
          className="w-full bg-white rounded-3xl p-4 shadow-soft flex items-center justify-center gap-2 text-danger-500 font-medium active-scale"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>

        {/* 品牌签名 */}
        <div className="text-center pt-2 pb-4">
          <p className="text-[11px] text-neutral-400 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            爪爪连心 v1.0.0 · 爪印同频
          </p>
        </div>
      </main>
    </div>
  );
}
