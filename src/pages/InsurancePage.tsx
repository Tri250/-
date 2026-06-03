// ============================================
// PawSync Pro - InsurancePage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 宠物保险页面
// ============================================

import { useState } from 'react';
import { Shield, Check } from 'lucide-react';
import { useInsuranceStore } from '../store/insuranceStore';

export function InsurancePage() {
  const { plans, policies, selectPlan, purchasePolicy } = useInsuranceStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      selectPlan(plan);
      await purchasePolicy(planId, 'pet-1');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">宠物保险</h1>
              <p className="text-secondary-100">为爱宠提供全方位保障</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Policies */}
      {policies.length > 0 && (
        <div className="px-4 py-6 max-w-md mx-auto">
          <h2 className="text-lg font-bold text-neutral-800 mb-4">我的保单</h2>
          {policies.map((policy) => (
            <div key={policy.id} className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-neutral-800">{policy.planName}</h3>
                  <p className="text-sm text-neutral-500">保障中 · {policy.petName}</p>
                </div>
                <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-xs font-semibold">
                  有效
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">¥{policy.premium}/月</span>
                <span className="text-neutral-500">
                  到期: {policy.endDate.toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insurance Plans */}
      <div className="px-4 max-w-md mx-auto">
        <h2 className="text-lg font-bold text-neutral-800 mb-4">选择保障方案</h2>
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all ${
                selectedPlanId === plan.id 
                  ? 'border-secondary-500 ring-2 ring-secondary-200' 
                  : 'border-neutral-100 hover:border-secondary-200'
              }`}
            >
              {plan.isPopular && (
                <div className="bg-gradient-to-r from-warning-500 to-warning-600 text-white text-center py-1.5 text-sm font-semibold">
                  🔥 最受欢迎
                </div>
              )}
              
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-800 mb-1">{plan.name}</h3>
                    <p className="text-neutral-500 text-sm">{plan.description}</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-secondary-600">¥{plan.price}</span>
                  <span className="text-neutral-500">/月</span>
                </div>

                {/* Coverage */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${plan.coverage.accidents ? 'text-success-500' : 'text-neutral-300'}`} />
                    <span className={plan.coverage.accidents ? 'text-neutral-700' : 'text-neutral-400'}>
                      意外保障
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${plan.coverage.illnesses ? 'text-success-500' : 'text-neutral-300'}`} />
                    <span className={plan.coverage.illnesses ? 'text-neutral-700' : 'text-neutral-400'}>
                      疾病医疗
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${plan.coverage.wellness ? 'text-success-500' : 'text-neutral-300'}`} />
                    <span className={plan.coverage.wellness ? 'text-neutral-700' : 'text-neutral-400'}>
                      健康体检
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${plan.coverage.surgery ? 'text-success-500' : 'text-neutral-300'}`} />
                    <span className={plan.coverage.surgery ? 'text-neutral-700' : 'text-neutral-400'}>
                      手术保障
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {plan.features.map((feature, idx) => (
                    <span key={idx} className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs">
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Policy Details */}
                <div className="bg-neutral-50 rounded-xl p-4 mb-5">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">免赔额</p>
                      <p className="font-bold text-neutral-800">¥{plan.deductible}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">报销比例</p>
                      <p className="font-bold text-neutral-800">{plan.reimbursementPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">年度限额</p>
                      <p className="font-bold text-neutral-800">¥{plan.annualLimit.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className="w-full py-3 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  立即投保
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
