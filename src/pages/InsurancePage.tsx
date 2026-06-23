// ============================================
// PawSync Pro - InsurancePage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 宠物保险页面
// ============================================

import { useState, useEffect } from 'react';
import { Shield, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { useInsuranceStore } from '../store/insuranceStore';
import { EmptyState } from '../components/EmptyState';

export default function InsurancePage() {
  const { plans, policies, selectPlan, purchasePolicy, fetchPlans, fetchPolicies, loading, error } = useInsuranceStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchPolicies();
  }, [fetchPlans, fetchPolicies]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchPlans(), fetchPolicies()]);
    setIsRefreshing(false);
  };

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlanId(planId);
    setPurchasing(planId);
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      selectPlan(plan);
      await purchasePolicy(planId, 'pet-1');
    }
    setPurchasing(null);
  };

  const renderSkeleton = () => (
    <div className="px-4 max-w-md mx-auto space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="h-6 bg-neutral-200 rounded w-1/3 mb-3" />
          <div className="h-4 bg-neutral-100 rounded w-2/3 mb-2" />
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4" />
          <div className="space-y-2 mb-5">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-4 bg-neutral-100 rounded w-1/2" />
            ))}
          </div>
          <div className="h-10 bg-neutral-200 rounded" />
        </div>
      ))}
    </div>
  );

  if (loading && plans.length === 0 && policies.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-24">
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
        <div className="pt-6">{renderSkeleton()}</div>
      </div>
    );
  }

  if (error && plans.length === 0 && policies.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-24">
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
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-800 mb-2">加载失败</h2>
          <p className="text-neutral-500 text-sm mb-6 text-center">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-secondary-500 text-white rounded-xl font-semibold hover:bg-secondary-600 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            重试
          </button>
        </div>
      </div>
    );
  }

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

      {/* Refresh Button */}
      <div className="px-4 py-3 max-w-md mx-auto flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-secondary-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* My Policies */}
      {policies.length > 0 && (
        <div className="px-4 py-2 max-w-md mx-auto">
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
        {plans.length === 0 ? (
          <EmptyState
            icon={<Shield className="w-12 h-12" />}
            title="暂无保险方案"
            description="暂时没有可用的保险方案，请稍后再来查看"
            actionText="刷新"
            onAction={handleRefresh}
          />
        ) : (
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
                    disabled={purchasing === plan.id}
                    className="w-full py-3 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {purchasing === plan.id ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        投保中...
                      </>
                    ) : (
                      '立即投保'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}