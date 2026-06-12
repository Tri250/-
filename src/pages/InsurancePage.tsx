// ============================================
// PawSync Pro - InsurancePage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 宠物保险页面 - 完整功能实现
// ============================================

import { useState } from 'react';
import { Shield, Check, FileText, DollarSign, Calendar, AlertCircle, ChevronRight, CreditCard, Clock, Phone, Download, Eye, Plus, X, Upload, Camera, Info } from 'lucide-react';
import { useInsuranceStore } from '../store/insuranceStore';
import { usePetStore } from '../store/petStore';
import { Card, Button, Badge, GlassModal } from '../components/DesignSystem';
import { useResponsiveStyle } from '../lib/responsiveStyle';

export default function InsurancePage() {
  const { plans, policies, claims, selectedPlan, selectPlan, purchasePolicy, submitClaim } = useInsuranceStore();
  const { pets, selectedPetId } = usePetStore();
  const responsive = useResponsiveStyle();
  
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showPolicyDetailModal, setShowPolicyDetailModal] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'policies' | 'claims'>('plans');
  const [purchaseStep, setPurchaseStep] = useState(1);
  
  // 理赔表单状态
  const [claimForm, setClaimForm] = useState({
    policyId: '',
    type: 'medical',
    amount: 0,
    description: '',
    date: new Date(),
    documents: []
  });

  const selectedPet = pets.find(p => p.id === selectedPetId);
  const selectedPolicy = policies.find(p => p.id === selectedPolicyId);
  const selectedPlanData = plans.find(p => p.id === selectedPlanId);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      selectPlan(plan);
      setShowPurchaseModal(true);
      setPurchaseStep(1);
    }
  };

  const handlePurchasePolicy = async () => {
    if (!selectedPlanId || !selectedPetId) return;
    
    const success = await purchasePolicy(selectedPlanId, selectedPetId);
    if (success) {
      setShowPurchaseModal(false);
      setSelectedPlanId(null);
      setPurchaseStep(1);
      setActiveTab('policies');
    }
  };

  const handleSubmitClaim = async () => {
    if (!claimForm.policyId || !claimForm.description || claimForm.amount <= 0) {
      return;
    }
    
    const success = await submitClaim({
      policyId: claimForm.policyId,
      type: claimForm.type,
      amount: claimForm.amount,
      description: claimForm.description,
      date: claimForm.date,
      documents: claimForm.documents
    });
    
    if (success) {
      setShowClaimModal(false);
      setClaimForm({
        policyId: '',
        type: 'medical',
        amount: 0,
        description: '',
        date: new Date(),
        documents: []
      });
      setActiveTab('claims');
    }
  };

  const handleViewPolicyDetail = (policyId: string) => {
    setSelectedPolicyId(policyId);
    setShowPolicyDetailModal(true);
  };

  const handleStartClaim = (policyId: string) => {
    setClaimForm(prev => ({ ...prev, policyId }));
    setShowClaimModal(true);
  };

  const getClaimStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: '已提交',
      under_review: '审核中',
      approved: '已批准',
      rejected: '已拒绝'
    };
    return labels[status] || status;
  };

  const getClaimStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'primary',
      under_review: 'warning',
      approved: 'success',
      rejected: 'danger'
    };
    return colors[status] || 'default';
  };

  const getPolicyStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: '有效',
      pending: '待生效',
      expired: '已过期',
      cancelled: '已取消'
    };
    return labels[status] || status;
  };

  const getPolicyStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'success',
      pending: 'warning',
      expired: 'default',
      cancelled: 'danger'
    };
    return colors[status] || 'default';
  };

  const getClaimTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      medical: '医疗费用',
      accident: '意外伤害',
      surgery: '手术费用',
      wellness: '健康体检'
    };
    return labels[type] || type;
  };

  // 计算统计数据
  const totalCoverage = policies.reduce((sum, p) => {
    const plan = plans.find(pl => pl.id === p.planId);
    return sum + (plan?.annualLimit || 0);
  }, 0);
  const totalClaimsAmount = claims.reduce((sum, c) => sum + c.amount, 0);
  const approvedClaimsCount = claims.filter(c => c.status === 'approved').length;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white px-6 py-8" style={{ paddingTop: responsive.safeAreaPadding.paddingTop + 32 }}>
        <div style={{ maxWidth: responsive.contentMaxWidth, margin: '0 auto' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">宠物保险</h1>
              <p className="text-secondary-100">为爱宠提供全方位保障</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/20 backdrop-blur rounded-xl p-3">
              <div className="text-sm text-secondary-100">保障总额</div>
              <div className="text-xl font-bold">¥{totalCoverage.toLocaleString()}</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3">
              <div className="text-sm text-secondary-100">理赔金额</div>
              <div className="text-xl font-bold">¥{totalClaimsAmount.toLocaleString()}</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3">
              <div className="text-sm text-secondary-100">成功理赔</div>
              <div className="text-xl font-bold">{approvedClaimsCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 sticky top-0 bg-neutral-50 z-10">
        <div className="flex gap-2" style={{ maxWidth: responsive.contentMaxWidth, margin: '0 auto' }}>
          {(['plans', 'policies', 'claims'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-secondary-500 text-white shadow-lg'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {tab === 'plans' ? '保险方案' : tab === 'policies' ? '我的保单' : '理赔记录'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4" style={{ maxWidth: responsive.contentMaxWidth, margin: '0 auto' }}>
        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-neutral-800">选择保障方案</h2>
            
            <div className="space-y-4">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  variant="default"
                  padding="lg"
                  hover
                  onClick={() => handleSelectPlan(plan.id)}
                  className={selectedPlanId === plan.id ? 'border-secondary-500 ring-2 ring-secondary-200' : ''}
                >
                  {plan.isPopular && (
                    <div className="bg-gradient-to-r from-warning-500 to-warning-600 text-white text-center py-1.5 text-sm font-semibold -mt-5 -mx-5 mb-4 rounded-t-2xl">
                      🔥 最受欢迎
                    </div>
                  )}
                  
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
                    <div className="flex items-center gap-2 text-sm">
                      <Check className={`w-4 h-4 ${plan.coverage.emergency ? 'text-success-500' : 'text-neutral-300'}`} />
                      <span className={plan.coverage.emergency ? 'text-neutral-700' : 'text-neutral-400'}>
                        急诊服务
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {plan.features.map((feature, idx) => (
                      <Badge key={idx} variant="default" size="sm">
                        {feature}
                      </Badge>
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

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={<Shield className="w-4 h-4" />}
                  >
                    立即投保
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-800">我的保单</h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('plans')}
                icon={<Plus className="w-4 h-4" />}
              >
                新投保
              </Button>
            </div>

            {policies.length === 0 ? (
              <Card variant="outlined" padding="lg">
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500">暂无保单</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setActiveTab('plans')}
                  >
                    选择保险方案
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {policies.map((policy) => {
                  const plan = plans.find(p => p.id === policy.planId);
                  return (
                    <Card key={policy.id} variant="default" padding="md" hover>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-secondary-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-neutral-800">{policy.planName}</h3>
                            <p className="text-sm text-neutral-500">{policy.petName}</p>
                          </div>
                        </div>
                        <Badge variant={getPolicyStatusColor(policy.status) as any} size="sm">
                          {getPolicyStatusLabel(policy.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <DollarSign className="w-4 h-4" />
                          <span>¥{policy.premium}/月</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Calendar className="w-4 h-4" />
                          <span>到期: {policy.endDate.toLocaleDateString()}</span>
                        </div>
                      </div>

                      {plan && (
                        <div className="bg-neutral-50 rounded-lg p-3 mb-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">年度限额</span>
                            <span className="font-medium text-neutral-800">¥{plan.annualLimit.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-neutral-500">报销比例</span>
                            <span className="font-medium text-neutral-800">{plan.reimbursementPercentage}%</span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          fullWidth 
                          onClick={() => handleViewPolicyDetail(policy.id)}
                          icon={<Eye className="w-4 h-4" />}
                        >
                          详情
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          fullWidth 
                          onClick={() => handleStartClaim(policy.id)}
                          icon={<FileText className="w-4 h-4" />}
                        >
                          理赔
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Claims Tab */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-800">理赔记录</h2>
              {policies.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStartClaim(policies[0].id)}
                  icon={<Plus className="w-4 h-4" />}
                >
                  新理赔
                </Button>
              )}
            </div>

            {claims.length === 0 ? (
              <Card variant="outlined" padding="lg">
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500">暂无理赔记录</p>
                  {policies.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => handleStartClaim(policies[0].id)}
                    >
                      申请理赔
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {claims.map((claim) => {
                  const policy = policies.find(p => p.id === claim.policyId);
                  return (
                    <Card key={claim.id} variant="default" padding="md" hover>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            claim.status === 'approved' ? 'bg-success-100' : 
                            claim.status === 'rejected' ? 'bg-danger-100' : 
                            'bg-warning-100'
                          }`}>
                            <FileText className={`w-5 h-5 ${
                              claim.status === 'approved' ? 'text-success-600' : 
                              claim.status === 'rejected' ? 'text-danger-600' : 
                              'text-warning-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-neutral-800">{getClaimTypeLabel(claim.type)}</h3>
                            <p className="text-sm text-neutral-500">{policy?.planName || '未知保单'}</p>
                          </div>
                        </div>
                        <Badge variant={getClaimStatusColor(claim.status) as any} size="sm">
                          {getClaimStatusLabel(claim.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <DollarSign className="w-4 h-4" />
                          <span>¥{claim.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Calendar className="w-4 h-4" />
                          <span>{claim.date.toLocaleDateString()}</span>
                        </div>
                      </div>

                      <p className="text-sm text-neutral-600 p-2 bg-neutral-50 rounded-lg">
                        {claim.description}
                      </p>

                      {claim.status === 'under_review' && (
                        <div className="mt-3 p-2 bg-warning-50 rounded-lg flex items-center gap-2">
                          <Clock className="w-4 h-4 text-warning-500" />
                          <span className="text-sm text-warning-700">预计审核时间: 3-5个工作日</span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      <GlassModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        title="投保确认"
        size="lg"
      >
        {selectedPlanData && (
          <div className="space-y-4">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    purchaseStep >= step ? 'bg-secondary-500 text-white' : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    {purchaseStep > step ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-1 ${purchaseStep > step ? 'bg-secondary-500' : 'bg-neutral-100'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Plan Summary */}
            {purchaseStep === 1 && (
              <div>
                <h4 className="font-bold text-neutral-800 mb-3">保险方案详情</h4>
                
                <Card variant="gradient" padding="md">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-secondary-600" />
                    </div>
                    <div>
                      <h5 className="font-bold text-neutral-800">{selectedPlanData.name}</h5>
                      <p className="text-sm text-neutral-500">{selectedPlanData.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-bold text-secondary-600">¥{selectedPlanData.price}</span>
                    <span className="text-neutral-500">/月</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center p-3 bg-white/50 rounded-xl">
                    <div>
                      <p className="text-xs text-neutral-500">免赔额</p>
                      <p className="font-bold text-neutral-800">¥{selectedPlanData.deductible}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">报销比例</p>
                      <p className="font-bold text-neutral-800">{selectedPlanData.reimbursementPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">年度限额</p>
                      <p className="font-bold text-neutral-800">¥{selectedPlanData.annualLimit.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>

                {/* Coverage List */}
                <div className="mt-4">
                  <h5 className="font-medium text-neutral-700 mb-2">保障范围</h5>
                  <div className="space-y-2">
                    {Object.entries(selectedPlanData.coverage).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <Check className={`w-4 h-4 ${value ? 'text-success-500' : 'text-neutral-300'}`} />
                        <span className={value ? 'text-neutral-700' : 'text-neutral-400'}>
                          {key === 'accidents' ? '意外保障' : 
                           key === 'illnesses' ? '疾病医疗' : 
                           key === 'wellness' ? '健康体检' : 
                           key === 'dental' ? '牙科护理' : 
                           key === 'surgery' ? '手术保障' : 
                           key === 'emergency' ? '急诊服务' : key}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Pet Selection */}
            {purchaseStep === 2 && (
              <div>
                <h4 className="font-bold text-neutral-800 mb-3">选择投保宠物</h4>
                
                {selectedPet && (
                  <Card variant="gradient" padding="md" className="border-secondary-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                        <span className="text-xl">🐾</span>
                      </div>
                      <div>
                        <h5 className="font-bold text-neutral-800">{selectedPet.name}</h5>
                        <p className="text-sm text-neutral-500">{selectedPet.species} · {selectedPet.breed}</p>
                      </div>
                      <Check className="w-5 h-5 text-secondary-500 ml-auto" />
                    </div>
                  </Card>
                )}

                {!selectedPet && pets.length > 0 && (
                  <div className="space-y-2">
                    {pets.map((pet) => (
                      <Card key={pet.id} variant="default" padding="md" hover>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🐾</span>
                          </div>
                          <div>
                            <h5 className="font-bold text-neutral-800">{pet.name}</h5>
                            <p className="text-sm text-neutral-500">{pet.species} · {pet.breed}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {pets.length === 0 && (
                  <Card variant="outlined" padding="lg">
                    <div className="text-center py-4">
                      <p className="text-neutral-500">请先添加宠物信息</p>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {purchaseStep === 3 && (
              <div>
                <h4 className="font-bold text-neutral-800 mb-3">支付确认</h4>
                
                <Card variant="gradient" padding="md">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">保险方案</span>
                      <span className="font-medium text-neutral-800">{selectedPlanData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">投保宠物</span>
                      <span className="font-medium text-neutral-800">{selectedPet?.name || '未选择'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">保障期限</span>
                      <span className="font-medium text-neutral-800">1年</span>
                    </div>
                    <div className="border-t border-neutral-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">月缴金额</span>
                        <span className="font-bold text-secondary-600">¥{selectedPlanData.price}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-neutral-600">年缴总额</span>
                        <span className="font-bold text-neutral-800">¥{selectedPlanData.price * 12}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Payment Method */}
                <div className="mt-4">
                  <h5 className="font-medium text-neutral-700 mb-2">支付方式</h5>
                  <div className="space-y-2">
                    <Card variant="default" padding="sm" className="border-secondary-200">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-secondary-500" />
                        <span className="font-medium text-neutral-800">微信支付</span>
                        <Check className="w-4 h-4 text-secondary-500 ml-auto" />
                      </div>
                    </Card>
                    <Card variant="outlined" padding="sm">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-neutral-400" />
                        <span className="text-neutral-600">支付宝</span>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Terms */}
                <div className="mt-4 p-3 bg-neutral-50 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-neutral-400 mt-0.5" />
                    <p className="text-xs text-neutral-500">
                      投保即表示您同意《宠物保险服务协议》和《隐私政策》。保险生效后，您可随时申请理赔。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {purchaseStep > 1 && (
                <Button variant="ghost" size="lg" onClick={() => setPurchaseStep(purchaseStep - 1)}>
                  上一步
                </Button>
              )}
              {purchaseStep < 3 ? (
                <Button 
                  variant="primary" 
                  size="lg" 
                  fullWidth 
                  onClick={() => setPurchaseStep(purchaseStep + 1)}
                  disabled={purchaseStep === 2 && !selectedPet}
                >
                  下一步
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  size="lg" 
                  fullWidth 
                  onClick={handlePurchasePolicy}
                  disabled={!selectedPet}
                  icon={<CreditCard className="w-4 h-4" />}
                >
                  确认支付 ¥{selectedPlanData.price * 12}
                </Button>
              )}
            </div>
          </div>
        )}
      </GlassModal>

      {/* Claim Modal */}
      <GlassModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        title="申请理赔"
        size="lg"
      >
        <div className="space-y-4">
          {/* Policy Info */}
          {claimForm.policyId && (
            <div className="p-3 bg-secondary-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-secondary-600" />
                <span className="font-medium text-secondary-700">
                  保单: {policies.find(p => p.id === claimForm.policyId)?.planName}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">理赔类型</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all"
              value={claimForm.type}
              onChange={(e) => setClaimForm(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="medical">医疗费用</option>
              <option value="accident">意外伤害</option>
              <option value="surgery">手术费用</option>
              <option value="wellness">健康体检</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">发生日期</label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all"
              value={claimForm.date.toISOString().split('T')[0]}
              onChange={(e) => setClaimForm(prev => ({ ...prev, date: new Date(e.target.value) }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">理赔金额 *</label>
            <input
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all"
              placeholder="请输入理赔金额"
              value={claimForm.amount}
              onChange={(e) => setClaimForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">详细描述 *</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all resize-none"
              placeholder="请详细描述理赔原因和经过"
              rows={4}
              value={claimForm.description}
              onChange={(e) => setClaimForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">上传凭证</label>
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center hover:border-secondary-300 transition-all">
              <Camera className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">点击上传医疗发票、诊断证明等凭证</p>
              <p className="text-xs text-neutral-400 mt-1">支持 JPG、PNG 格式</p>
            </div>
          </div>
          
          {/* Tips */}
          <div className="p-3 bg-warning-50 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-warning-500 mt-0.5" />
              <div className="text-sm text-warning-700">
                <p className="font-medium mb-1">理赔提示</p>
                <ul className="space-y-1 text-xs">
                  <li>• 请确保上传的凭证清晰完整</li>
                  <li>• 理赔金额需在保单限额范围内</li>
                  <li>• 审核周期一般为3-5个工作日</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" size="lg" fullWidth onClick={() => setShowClaimModal(false)}>
              取消
            </Button>
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              onClick={handleSubmitClaim}
              disabled={!claimForm.policyId || !claimForm.description || claimForm.amount <= 0}
              icon={<FileText className="w-4 h-4" />}
            >
              提交理赔
            </Button>
          </div>
        </div>
      </GlassModal>

      {/* Policy Detail Modal */}
      <GlassModal
        isOpen={showPolicyDetailModal}
        onClose={() => setShowPolicyDetailModal(false)}
        title="保单详情"
        size="lg"
      >
        {selectedPolicy && (
          <div className="space-y-4">
            {/* Policy Header */}
            <Card variant="gradient" padding="md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-secondary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-800">{selectedPolicy.planName}</h4>
                  <p className="text-sm text-neutral-500">保单号: {selectedPolicy.id}</p>
                </div>
              </div>
              <Badge variant={getPolicyStatusColor(selectedPolicy.status) as any} size="md">
                {getPolicyStatusLabel(selectedPolicy.status)}
              </Badge>
            </Card>

            {/* Policy Info */}
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-neutral-50 rounded-xl">
                <span className="text-neutral-600">投保宠物</span>
                <span className="font-medium text-neutral-800">{selectedPolicy.petName}</span>
              </div>
              <div className="flex justify-between p-3 bg-neutral-50 rounded-xl">
                <span className="text-neutral-600">生效日期</span>
                <span className="font-medium text-neutral-800">{selectedPolicy.startDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-neutral-50 rounded-xl">
                <span className="text-neutral-600">到期日期</span>
                <span className="font-medium text-neutral-800">{selectedPolicy.endDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-neutral-50 rounded-xl">
                <span className="text-neutral-600">月缴保费</span>
                <span className="font-medium text-secondary-600">¥{selectedPolicy.premium}</span>
              </div>
              <div className="flex justify-between p-3 bg-neutral-50 rounded-xl">
                <span className="text-neutral-600">下次缴费</span>
                <span className="font-medium text-neutral-800">{selectedPolicy.nextBillingDate.toLocaleDateString()}</span>
              </div>
            </div>

            {/* Coverage Details */}
            {(() => {
              const plan = plans.find(p => p.id === selectedPolicy.planId);
              if (!plan) return null;
              
              return (
                <div>
                  <h5 className="font-medium text-neutral-700 mb-2">保障详情</h5>
                  <div className="grid grid-cols-3 gap-3 p-3 bg-secondary-50 rounded-xl text-center">
                    <div>
                      <p className="text-xs text-neutral-500">免赔额</p>
                      <p className="font-bold text-neutral-800">¥{plan.deductible}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">报销比例</p>
                      <p className="font-bold text-neutral-800">{plan.reimbursementPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">年度限额</p>
                      <p className="font-bold text-neutral-800">¥{plan.annualLimit.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" size="md" fullWidth icon={<Download className="w-4 h-4" />}>
                下载保单
              </Button>
              <Button variant="ghost" size="md" fullWidth icon={<Phone className="w-4 h-4" />}>
                联系客服
              </Button>
            </div>
          </div>
        )}
      </GlassModal>

      <div className="h-8" />
    </div>
  );
}