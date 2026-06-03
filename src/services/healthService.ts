import type { HealthRecord, HealthMetric, HealthAlert, HealthTrend, HealthGoal, HealthScore, HealthMetricType } from '../types/health';

const MOCK_DELAY = 600;

class HealthService {
  private healthRecords: HealthRecord[] = [];
  private healthAlerts: HealthAlert[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      this.healthRecords.push({
        id: `record-${i}`,
        petId: '1',
        date: date.toISOString().split('T')[0],
        metrics: [
          { id: `m-${i}-1`, petId: '1', type: 'weight', value: 4.2 + Math.random() * 0.3, unit: 'kg', timestamp: date.toISOString() },
          { id: `m-${i}-2`, petId: '1', type: 'sleep', value: 12 + Math.random() * 4, unit: 'h', timestamp: date.toISOString() },
          { id: `m-${i}-3`, petId: '1', type: 'activity', value: Math.floor(30 + Math.random() * 40), unit: 'min', timestamp: date.toISOString() },
        ],
        overallStatus: 'good',
        vetVisit: false,
      });
    }

    this.healthAlerts = [
      {
        id: 'alert-1',
        petId: '1',
        type: 'abnormal',
        severity: 'low',
        message: '轻微活动异常，建议观察',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        acknowledged: false,
        recommendation: '多陪伴，观察是否有其他异常',
      },
      {
        id: 'alert-2',
        petId: '1',
        type: 'cough',
        severity: 'medium',
        message: '检测到偶尔咳嗽',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        acknowledged: true,
        recommendation: '如持续超过3天，建议就医',
      },
    ];
  }

  async getHealthScore(_petId: string): Promise<HealthScore> {
    await this.simulateDelay(MOCK_DELAY);
    
    return {
      overall: 92,
      nutrition: 88,
      activity: 85,
      sleep: 95,
      mental: 90,
      trend: 'stable',
      lastUpdated: new Date().toISOString(),
    };
  }

  async getHealthRecords(petId: string, days: number = 7): Promise<HealthRecord[]> {
    await this.simulateDelay(MOCK_DELAY);
    return this.healthRecords.slice(0, days);
  }

  async addHealthRecord(record: Omit<HealthRecord, 'id'>): Promise<HealthRecord> {
    await this.simulateDelay(MOCK_DELAY);
    
    const newRecord: HealthRecord = {
      ...record,
      id: `record-${Date.now()}`,
    };
    
    this.healthRecords.unshift(newRecord);
    return newRecord;
  }

  async addHealthMetric(metric: Omit<HealthMetric, 'id'>): Promise<HealthMetric> {
    await this.simulateDelay(300);
    
    const newMetric: HealthMetric = {
      ...metric,
      id: `metric-${Date.now()}`,
    };
    
    const todayRecord = this.healthRecords.find(r => r.date === new Date().toISOString().split('T')[0]);
    if (todayRecord) {
      todayRecord.metrics.push(newMetric);
    }
    
    return newMetric;
  }

  async getHealthAlerts(petId: string): Promise<HealthAlert[]> {
    await this.simulateDelay(300);
    return this.healthAlerts.filter(a => a.petId === petId);
  }

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    await this.simulateDelay(200);
    
    const alert = this.healthAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  async getHealthTrends(petId: string, metricType: HealthMetricType): Promise<HealthTrend> {
    await this.simulateDelay(400);
    
    const current = 75 + Math.floor(Math.random() * 20);
    const previous = 70 + Math.floor(Math.random() * 20);
    const change = current - previous;
    const percentageChange = (change / previous) * 100;
    
    return {
      metricType,
      current,
      previous,
      change,
      percentageChange,
      direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
      days: 7,
    };
  }

  async getHealthGoals(petId: string): Promise<HealthGoal[]> {
    await this.simulateDelay(300);
    
    return [
      {
        id: 'goal-1',
        petId,
        type: 'activity',
        target: 60,
        current: 45,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        status: 'active',
      },
      {
        id: 'goal-2',
        petId,
        type: 'weight',
        target: 4.5,
        current: 4.3,
        deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
        status: 'active',
      },
    ];
  }

  async createHealthGoal(goal: Omit<HealthGoal, 'id'>): Promise<HealthGoal> {
    await this.simulateDelay(300);
    
    return {
      ...goal,
      id: `goal-${Date.now()}`,
    };
  }

  async updateHealthGoal(goalId: string, updates: Partial<HealthGoal>): Promise<boolean> {
    await this.simulateDelay(300);
    console.log(`Updated goal ${goalId}:`, updates);
    return true;
  }

  async deleteHealthGoal(_goalId: string): Promise<boolean> {
    await this.simulateDelay(300);
    return true;
  }

  async checkSymptoms(symptoms: string[]): Promise<{ symptoms: string[]; possibleConditions: { condition: string; probability: number; severity: string; recommendation: string }[] }> {
    await this.simulateDelay(1000);
    
    return {
      symptoms,
      possibleConditions: [
        {
          condition: '轻微感冒',
          probability: 0.3,
          severity: 'fair',
          recommendation: '保持温暖，多饮水，观察1-2天',
        },
        {
          condition: '过敏反应',
          probability: 0.2,
          severity: 'fair',
          recommendation: '检查环境，避免接触过敏原',
        },
      ],
    };
  }

  async getMetricHistory(petId: string, metricType: HealthMetricType, days: number = 7): Promise<HealthMetric[]> {
    await this.simulateDelay(400);
    
    const metrics: HealthMetric[] = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      metrics.push({
        id: `hist-${metricType}-${i}`,
        petId,
        type: metricType,
        value: 50 + Math.random() * 50,
        unit: metricType === 'weight' ? 'kg' : metricType === 'sleep' ? 'h' : 'min',
        timestamp: date.toISOString(),
      });
    }
    
    return metrics;
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const healthService = new HealthService();
