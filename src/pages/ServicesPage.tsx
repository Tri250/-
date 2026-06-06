// ============================================
// PawSync Pro - ServicesPage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 综合服务页面（保险+医疗）
// ============================================

import { Shield, Stethoscope, ChevronRight, Sparkles, Activity } from 'lucide-react';

interface ServicesPageProps {
  onNavigate?: (page: string) => void;
}

export default function ServicesPage({ onNavigate }: ServicesPageProps) {
  const services = [
    {
      id: 'insurance',
      title: '宠物保险',
      description: '全方位保障，守护爱宠健康',
      icon: Shield,
      color: 'from-secondary-500 to-secondary-600',
      bg: 'bg-secondary-50',
      text: 'text-secondary-600',
      badge: '推荐'
    },
    {
      id: 'medical',
      title: '医疗咨询',
      description: 'AI 预诊 + 专业兽医问诊',
      icon: Stethoscope,
      color: 'from-warning-500 to-warning-600',
      bg: 'bg-warning-50',
      text: 'text-warning-600',
      badge: '热门'
    }
  ];

  const quickActions = [
    { icon: Activity, title: '健康档案', desc: '查看完整健康记录' },
    { icon: Sparkles, title: '健康体检', desc: '预约年度体检服务' }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white px-6 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">爱宠服务</h1>
          <p className="text-secondary-100 mb-6">全面的宠物健康与保障服务</p>
        </div>
      </div>

      {/* Main Services */}
      <div className="px-4 py-6 max-w-md mx-auto space-y-4">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <button
              key={service.id}
              onClick={() => onNavigate?.(service.id)}
              className={`w-full bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 text-left hover:shadow-lg transition-all hover:scale-[1.02] animate-fade-in`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-neutral-800">{service.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${service.bg} ${service.text}`}>
                      {service.badge}
                    </span>
                  </div>
                  <p className="text-neutral-500 text-sm mb-3">{service.description}</p>
                  <div className="flex items-center text-secondary-600 font-medium text-sm">
                    <span>立即体验</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="px-4 max-w-md mx-auto">
        <h2 className="text-lg font-bold text-neutral-800 mb-4">快捷服务</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 text-left hover:bg-neutral-50 transition-all"
              >
                <div className={`w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center mb-2`}>
                  <Icon className="w-5 h-5 text-neutral-600" />
                </div>
                <h4 className="font-semibold text-neutral-800 text-sm">{action.title}</h4>
                <p className="text-neutral-500 text-xs">{action.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div className="px-4 py-6 max-w-md mx-auto">
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-6 border border-primary-100">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-neutral-800">为什么选择我们</h3>
          </div>
          <div className="space-y-3">
            {[
              '24/7 全天候在线服务',
              '专业兽医团队支持',
              '快速理赔流程',
              '个性化健康方案'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-400 rounded-full" />
                <span className="text-neutral-600 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
