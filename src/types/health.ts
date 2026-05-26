export type HealthMetricType = 'weight' | 'sleep' | 'activity' | 'eating' | 'drinking';

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export interface HealthMetric {
  id: string;
  petId: string;
  type: HealthMetricType;
  value: number;
  unit: string;
  timestamp: string;
  notes?: string;
}

export interface HealthRecord {
  id: string;
  petId: string;
  date: string;
  metrics: HealthMetric[];
  overallStatus: HealthStatus;
  vetVisit?: boolean;
  notes?: string;
}

export interface HealthAlert {
  id: string;
  petId: string;
  type: 'cough' | 'vomit' | 'pain' | 'abnormal' | 'fever' | 'lethargy';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  recommendation?: string;
}

export interface HealthTrend {
  metricType: HealthMetricType;
  current: number;
  previous: number;
  change: number;
  percentageChange: number;
  direction: 'improving' | 'declining' | 'stable';
  days: number;
}

export interface HealthGoal {
  id: string;
  petId: string;
  type: HealthMetricType;
  target: number;
  current: number;
  deadline: string;
  status: 'active' | 'completed' | 'paused';
}

export interface SymptomChecker {
  symptoms: string[];
  possibleConditions: Array<{
    condition: string;
    probability: number;
    severity: HealthStatus;
    recommendation: string;
  }>;
}

export interface VaccinationRecord {
  id: string;
  petId: string;
  vaccineName: string;
  dateAdministered: string;
  nextDueDate: string;
  veterinarian: string;
  batchNumber?: string;
  notes?: string;
}

export interface MedicationRecord {
  id: string;
  petId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy?: string;
  notes?: string;
  active: boolean;
}

export interface HealthScore {
  overall: number;
  nutrition: number;
  activity: number;
  sleep: number;
  mental: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}
