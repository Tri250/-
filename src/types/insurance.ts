export interface InsurancePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  coverage: {
    accidents: boolean;
    illnesses: boolean;
    wellness: boolean;
    dental: boolean;
    surgery: boolean;
    emergency: boolean;
  };
  deductible: number;
  reimbursementPercentage: number;
  annualLimit: number;
  isPopular: boolean;
  features: string[];
}

export interface Policy {
  id: string;
  planId: string;
  planName: string;
  petId: string;
  petName: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  premium: number;
  nextBillingDate: Date;
}

export interface Claim {
  id: string;
  policyId: string;
  date: Date;
  type: string;
  amount: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  description: string;
  documents?: string[];
}

export interface InsuranceStore {
  plans: InsurancePlan[];
  policies: Policy[];
  claims: Claim[];
  selectedPlan: InsurancePlan | null;
  
  setPlans: (plans: InsurancePlan[]) => void;
  setPolicies: (policies: Policy[]) => void;
  setClaims: (claims: Claim[]) => void;
  selectPlan: (plan: InsurancePlan) => void;
  purchasePolicy: (planId: string, petId: string) => Promise<boolean>;
  submitClaim: (claim: Omit<Claim, 'id' | 'status'>) => Promise<boolean>;
}
