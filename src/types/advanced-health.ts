// ============================================
// PawSync Pro 3.0 - Advanced Health Types
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: AI健康预警系统完整类型定义
// ============================================

// 健康评分维度
export interface HealthDimension {
  id: string;
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  icon: string;
  color: string;
  metrics: string[];
}

// 整体健康评分
export interface ComprehensiveHealthScore {
  overall: number;
  dimensions: HealthDimension[];
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  prediction?: {
    riskLevel: 'low' | 'medium' | 'high';
    predictedIssues: string[];
  };
}

// AI多模态预警类型
export type AlertLevel = 'green' | 'yellow' | 'orange' | 'red';

export type BehaviorType = 
  | 'vomiting'      // 呕吐
  | 'diarrhea'      // 腹泻
  | 'limping'       // 跛行
  | 'excessive_licking'  // 过度舔毛
  | 'lethargy'      // 嗜睡
  | 'coughing'      // 咳嗽
  | 'sneezing'      // 打喷嚏
  | 'scratching'    // 过度抓挠
  | 'loss_of_appetite'  // 食欲减退
  | 'increased_thirst' // 饮水量增加
  | 'urination_change'  // 排尿异常
  | 'breathing_change'; // 呼吸异常

export interface AIBehaviorAlert {
  id: string;
  petId: string;
  behaviorType: BehaviorType;
  alertLevel: AlertLevel;
  confidence: number;
  timestamp: string;
  duration?: string;
  frequency?: number;
  videoEvidence?: string;
  description: string;
  recommendation: string;
  vetRequired: boolean;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

// 智能喂食器/饮水机数据
export interface SmartFeederData {
  id: string;
  petId: string;
  deviceId: string;
  deviceType: 'feeder' | 'waterer';
  timestamp: string;
  portionSize: number;
  portionUnit: string;
  mealsPlanned: number;
  mealsCompleted: number;
  waterIntake: number;
  waterIntakeUnit: string;
  anomaly: boolean;
  anomalyReason?: string;
}

// 健康仪表盘数据
export interface HealthDashboard {
  healthScore: ComprehensiveHealthScore;
  activity: {
    daily: number;
    weekly: number;
    monthly: number;
    target: number;
    intensityBreakdown: {
      low: number;
      medium: number;
      high: number;
    };
  };
  sleep: {
    duration: number;
    quality: number;
    interruptions: number;
    deepestSleepTime: string;
    schedule: {
      bedtime: string;
      wakeTime: string;
    };
  };
  nutrition: {
    calories: number;
    targetCalories: number;
    protein: number;
    fat: number;
    fiber: number;
    waterIntake: number;
    targetWaterIntake: number;
  };
  vaccination: {
    status: 'up_to_date' | 'due_soon' | 'overdue';
    nextDue?: string;
    vaccines: VaccinationStatus[];
  };
  weight: {
    current: number;
    target: number;
    history: WeightRecord[];
    breedAverage?: number;
  };
}

// 体重记录
export interface WeightRecord {
  date: string;
  weight: number;
  unit: string;
  trend: 'gaining' | 'losing' | 'stable';
}

// 疫苗状态
export interface VaccinationStatus {
  name: string;
  lastDate: string;
  nextDate: string;
  status: 'completed' | 'due_soon' | 'overdue';
  batchNumber?: string;
}

// 动态图表数据点
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  highlight?: boolean;
}

export interface ActivityChartData {
  date: string;
  totalMinutes: number;
  intensity: {
    low: number;
    medium: number;
    high: number;
  };
  activities: {
    walking: number;
    running: number;
    playing: number;
    resting: number;
  };
}

export interface SleepChartData {
  date: string;
  duration: number;
  quality: number;
  phases: {
    deep: number;
    light: number;
    rem: number;
    awake: number;
  };
  startTime: string;
  endTime: string;
}

// 成长曲线数据
export interface GrowthCurveData {
  petId: string;
  petBreed: string;
  petAge: number;
  petWeight: number;
  breedStandard: BreedStandard;
  percentile: number;
  trajectory: 'above' | 'normal' | 'below';
  history: Array<{
    date: string;
    weight: number;
    trend: 'gaining' | 'losing' | 'stable';
  }>;
}

export interface BreedStandard {
  breed: string;
  age: number;
  weightMin: number;
  weightMax: number;
  weightAvg: number;
  heightMin: number;
  heightMax: number;
}

// 电子病历OCR
export interface MedicalRecord {
  id: string;
  petId: string;
  type: 'checkup' | 'lab_report' | 'prescription' | 'vaccination' | 'surgery' | 'other';
  date: string;
  hospital: string;
  veterinarian: string;
  diagnosis?: string;
  treatment?: string;
  medications?: MedicationInfo[];
  labResults?: LabResult[];
  attachments?: string[];
  notes?: string;
  ocrConfidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationInfo {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface LabResult {
  testName: string;
  result: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal' | 'critical';
}

// 兽医医院信息
export interface VetHospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  is24Hours: boolean;
  distance?: number;
  rating?: number;
  emergencyServices: boolean;
}

// 预警通知
export interface HealthNotification {
  id: string;
  petId: string;
  type: 'behavior' | 'feeding' | 'vaccination' | 'medication' | 'general';
  alertLevel: AlertLevel;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// 健康报告
export interface HealthReport {
  id: string;
  petId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  summary: {
    overallHealth: number;
    activityLevel: number;
    sleepQuality: number;
    nutritionBalance: number;
    comparedToLast: number;
  };
  highlights: {
    positive: string[];
    concerns: string[];
    recommendations: string[];
  };
  charts: {
    activity: ActivityChartData[];
    sleep: SleepChartData[];
  };
  alerts: AIBehaviorAlert[];
  generatedAt: string;
}

// 品种健康基准
export interface BreedHealthBenchmark {
  breed: string;
  species: 'dog' | 'cat';
  lifeStage: 'puppy' | 'adult' | 'senior';
  normalWeightRange: { min: number; max: number };
  normalHeartRate: { min: number; max: number };
  normalTemperature: { min: number; max: number };
  commonHealthIssues: Array<{
    condition: string;
    prevalence: number;
    symptoms: string[];
  }>;
  recommendedCheckups: Array<{
    age: number;
    tests: string[];
  }>;
}
