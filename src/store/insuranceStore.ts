import { create } from 'zustand';
import { InsurancePlan, Policy, Claim, InsuranceStore } from '../types/insurance';

const mockPlans: InsurancePlan[] = [
  {
    id: '1',
    name: '基础保障计划',
    description: '为您的爱宠提供基础的医疗保障',
    price: 29,
    currency: 'CNY',
    coverage: {
      accidents: true,
      illnesses: true,
      wellness: false,
      dental: false,
      surgery: false,
      emergency: true
    },
    deductible: 200,
    reimbursementPercentage: 60,
    annualLimit: 5000,
    isPopular: false,
    features: ['意外保障', '疾病医疗', '24小时急诊']
  },
  {
    id: '2',
    name: '全面守护计划',
    description: '全方位的宠物医疗保障，为您的爱宠保驾护航',
    price: 59,
    currency: 'CNY',
    coverage: {
      accidents: true,
      illnesses: true,
      wellness: true,
      dental: true,
      surgery: true,
      emergency: true
    },
    deductible: 100,
    reimbursementPercentage: 80,
    annualLimit: 20000,
    isPopular: true,
    features: ['全面医疗保障', '健康体检', '牙科护理', '手术保障', 'VIP 通道']
  },
  {
    id: '3',
    name: '尊享无忧计划',
    description: '顶级宠物医疗保险，给您的爱宠最好的呵护',
    price: 99,
    currency: 'CNY',
    coverage: {
      accidents: true,
      illnesses: true,
      wellness: true,
      dental: true,
      surgery: true,
      emergency: true
    },
    deductible: 0,
    reimbursementPercentage: 90,
    annualLimit: 50000,
    isPopular: false,
    features: ['零免赔额', '90%报销', '无限额门诊', '专属医生', '高端体检', '全球救援']
  }
];

export const useInsuranceStore = create<InsuranceStore>((set, get) => ({
  plans: mockPlans,
  policies: [],
  claims: [],
  selectedPlan: null,

  setPlans: (plans) => set({ plans }),
  setPolicies: (policies) => set({ policies }),
  setClaims: (claims) => set({ claims }),
  selectPlan: (plan) => set({ selectedPlan: plan }),

  purchasePolicy: async (planId, petId) => {
    const { plans } = get();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return false;

    const policy: Policy = {
      id: Date.now().toString(),
      planId,
      planName: plan.name,
      petId,
      petName: '毛球',
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      status: 'active',
      premium: plan.price,
      nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    };

    set((state) => ({ policies: [policy, ...state.policies] }));
    return true;
  },

  submitClaim: async (claimData) => {
    const claim: Claim = {
      ...claimData,
      id: Date.now().toString(),
      status: 'submitted'
    };
    
    set((state) => ({ claims: [claim, ...state.claims] }));
    return true;
  }
}));
