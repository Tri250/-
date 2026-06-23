import { create } from 'zustand';
import { InsurancePlan, Policy, Claim, InsuranceStore } from '../types/insurance';
import { api } from '../lib/api';

export const useInsuranceStore = create<InsuranceStore>((set, get) => ({
  plans: [],
  policies: [],
  claims: [],
  selectedPlan: null,
  loading: false,
  error: null,

  fetchPlans: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ plans: InsurancePlan[] }>('/insurance/plans');
      set({ plans: data.plans, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取保险方案失败', loading: false });
    }
  },

  fetchPolicies: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ policies: Policy[] }>('/insurance/policies');
      set({ policies: data.policies.map(p => ({ ...p, startDate: new Date(p.startDate), endDate: new Date(p.endDate), nextBillingDate: new Date(p.nextBillingDate) })), loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取保单失败', loading: false });
    }
  },

  setPlans: (plans) => set({ plans }),
  setPolicies: (policies) => set({ policies }),
  setClaims: (claims) => set({ claims }),
  selectPlan: (plan) => set({ selectedPlan: plan }),

  purchasePolicy: async (planId, petId) => {
    try {
      const data = await api.post<{ policy: Policy }>('/insurance/policies', { planId, petId });
      const policy = { ...data.policy, startDate: new Date(data.policy.startDate), endDate: new Date(data.policy.endDate), nextBillingDate: new Date(data.policy.nextBillingDate) };
      set((state) => ({ policies: [policy, ...state.policies] }));
      return true;
    } catch {
      return false;
    }
  },

  submitClaim: async (claimData) => {
    try {
      const data = await api.post<{ claim: Claim }>('/insurance/claims', claimData);
      set((state) => ({ claims: [data.claim, ...state.claims] }));
      return true;
    } catch {
      return false;
    }
  },
}));