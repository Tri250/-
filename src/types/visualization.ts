// 数据可视化相关类型

export interface WeightData {
  date: string;
  weight: number;
}

export interface ActivityData {
  date: string;
  activity: 'low' | 'medium' | 'high';
}

export interface RecordsDistribution {
  [key: string]: number;
}

export interface HealthTrendData {
  period: '7d' | '30d' | '90d';
  weight: WeightData[];
  activity: ActivityData[];
  recordsByTag: RecordsDistribution;
  totalRecords: number;
  healthScore: number;
}

export interface HeatmapData {
  [date: string]: number;
}
