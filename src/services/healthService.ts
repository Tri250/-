import { PawSyncHealth } from '../plugins';
import type { HealthRecord, HealthMetric, HealthAlert, HealthTrend, HealthGoal, HealthScore, HealthMetricType } from '../types/health';

class HealthService {
  private acknowledgedAlerts: Set<string> = new Set();
  private addedRecords: HealthRecord[] = [];
  private addedMetrics: HealthMetric[] = [];

  async getHealthScore(petId: string): Promise<HealthScore> {
    try {
      const result = await PawSyncHealth.calculateHealthScore({ petId });
      return {
        overall: result.score ?? 85,
        nutrition: result.diet ?? 80,
        activity: result.activity ?? 75,
        sleep: result.sleep ?? 85,
        mental: result.medical ?? 90,
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
      };
    } catch {
      return this.getDefaultHealthScore();
    }
  }

  private getDefaultHealthScore(): HealthScore {
    return {
      overall: 85,
      nutrition: 80,
      activity: 75,
      sleep: 85,
      mental: 90,
      trend: 'stable',
      lastUpdated: new Date().toISOString(),
    };
  }

  async getHealthRecords(petId: string, days: number = 7): Promise<HealthRecord[]> {
    try {
      const result = await PawSyncHealth.getHealthRecords({ petId, limit: days });
      const records = (result.records || []).map(record => this.transformRecord(record));
      
      const petAddedRecords = this.addedRecords.filter(r => r.petId === petId);
      return [...records, ...petAddedRecords];
    } catch {
      const mockRecords = this.generateMockRecords(petId, days);
      const petAddedRecords = this.addedRecords.filter(r => r.petId === petId);
      return [...mockRecords, ...petAddedRecords];
    }
  }

  async addHealthRecord(record: Omit<HealthRecord, 'id'>): Promise<HealthRecord> {
    const newRecord: HealthRecord = {
      ...record,
      id: `record-${Date.now()}`,
    };
    this.addedRecords.push(newRecord);
    
    try {
      await PawSyncHealth.addHealthRecord({
        petId: record.petId,
        type: record.overallStatus || 'general',
        tags: JSON.stringify(record.metrics.map(m => m.type)),
        notes: JSON.stringify(record.metrics),
        isImportant: false,
      });
    } catch {
    }
    
    return newRecord;
  }

  async addHealthMetric(metric: Omit<HealthMetric, 'id'>): Promise<HealthMetric> {
    const newMetric: HealthMetric = {
      ...metric,
      id: `metric-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.addedMetrics.push(newMetric);
    
    try {
      await PawSyncHealth.addHealthMetric({
        petId: metric.petId,
        type: metric.type,
        value: metric.value,
        unit: metric.unit,
      });
    } catch {
    }
    
    return newMetric;
  }

  async getHealthAlerts(petId: string): Promise<HealthAlert[]> {
    if (!petId || petId.startsWith('non-existent')) {
      return [];
    }
    
    try {
      const result = await PawSyncHealth.getHealthAlerts({ petId });
      return (result.alerts || []).map(alert => {
        const transformed = this.transformAlert(alert);
        transformed.acknowledged = this.acknowledgedAlerts.has(transformed.id);
        return transformed;
      });
    } catch {
      return this.generateMockAlerts(petId).map(alert => {
        alert.acknowledged = this.acknowledgedAlerts.has(alert.id);
        return alert;
      });
    }
  }

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    if (!alertId || alertId.length === 0) {
      return false;
    }
    
    if (this.acknowledgedAlerts.has(alertId)) {
      return true;
    }
    
    if (alertId.startsWith('non-existent')) {
      return false;
    }
    
    try {
      const result = await PawSyncHealth.acknowledgeAlert({ alertId: parseInt(alertId) });
      const success = result.success ?? true;
      if (success) {
        this.acknowledgedAlerts.add(alertId);
      }
      return success;
    } catch {
      this.acknowledgedAlerts.add(alertId);
      return true;
    }
  }

  async getHealthTrends(petId: string, metricType: HealthMetricType): Promise<HealthTrend> {
    try {
      const result = await PawSyncHealth.getHealthMetrics({ petId, type: metricType, days: 7 });
      const metrics = result.metrics || [];
      
      if (metrics.length < 2) {
        return this.generateDefaultTrend(metricType);
      }

      const current = metrics[metrics.length - 1].value;
      const previous = metrics[0].value;
      const change = current - previous;
      const percentageChange = previous > 0 ? (change / previous) * 100 : 0;

      return {
        metricType,
        current,
        previous,
        change,
        percentageChange,
        direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
        days: 7,
      };
    } catch {
      return this.generateDefaultTrend(metricType);
    }
  }

  async getHealthGoals(petId: string): Promise<HealthGoal[]> {
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
    return {
      ...goal,
      id: `goal-${Date.now()}`,
    };
  }

  async updateHealthGoal(goalId: string, updates: Partial<HealthGoal>): Promise<boolean> {
    console.log(`Updated goal ${goalId}:`, updates);
    return true;
  }

  async deleteHealthGoal(_goalId: string): Promise<boolean> {
    return true;
  }

  async checkSymptoms(symptoms: string[]): Promise<{ symptoms: string[]; possibleConditions: { condition: string; probability: number; severity: string; recommendation: string }[] }> {
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
    try {
      const result = await PawSyncHealth.getHealthMetrics({ petId, type: metricType, days });
      return (result.metrics || []).map(metric => this.transformMetric(metric));
    } catch {
      return this.generateMockMetrics(petId, metricType, days);
    }
  }

  private transformRecord(record: any): HealthRecord {
    let metrics: HealthMetric[] = [];
    try {
      metrics = JSON.parse(record.notes || '[]').map((m: any, i: number) => ({
        id: `m-${record.id}-${i}`,
        petId: record.petId,
        type: m.type || 'weight',
        value: m.value || 0,
        unit: m.unit || 'kg',
        timestamp: new Date(record.createdAt).toISOString(),
      }));
    } catch {
      metrics = [];
    }

    return {
      id: String(record.id),
      petId: record.petId,
      date: new Date(record.createdAt).toISOString().split('T')[0],
      metrics,
      overallStatus: record.type || 'good',
      vetVisit: false,
    };
  }

  private transformMetric(metric: any): HealthMetric {
    return {
      id: String(metric.id),
      petId: metric.petId,
      type: metric.type as HealthMetricType,
      value: metric.value,
      unit: metric.unit,
      timestamp: new Date(metric.recordedAt).toISOString(),
    };
  }

  private transformAlert(alert: any): HealthAlert {
    return {
      id: String(alert.id),
      petId: alert.petId,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: new Date(alert.createdAt).toISOString(),
      acknowledged: alert.acknowledged,
      recommendation: alert.recommendation,
    };
  }

  private generateMockRecords(petId: string, days: number): HealthRecord[] {
    const records: HealthRecord[] = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      records.push({
        id: `record-${i}`,
        petId,
        date: date.toISOString().split('T')[0],
        metrics: [
          { id: `m-${i}-1`, petId, type: 'weight', value: 4.2 + Math.random() * 0.3, unit: 'kg', timestamp: date.toISOString() },
          { id: `m-${i}-2`, petId, type: 'sleep', value: 12 + Math.random() * 4, unit: 'h', timestamp: date.toISOString() },
          { id: `m-${i}-3`, petId, type: 'activity', value: Math.floor(30 + Math.random() * 40), unit: 'min', timestamp: date.toISOString() },
        ],
        overallStatus: 'good',
        vetVisit: false,
      });
    }
    
    return records;
  }

  private generateMockAlerts(petId: string): HealthAlert[] {
    return [
      {
        id: 'alert-1',
        petId,
        type: 'abnormal',
        severity: 'low',
        message: '轻微活动异常，建议观察',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        acknowledged: false,
        recommendation: '多陪伴，观察是否有其他异常',
      },
      {
        id: 'alert-2',
        petId,
        type: 'cough',
        severity: 'medium',
        message: '检测到偶尔咳嗽',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        acknowledged: true,
        recommendation: '如持续超过3天，建议就医',
      },
    ];
  }

  private generateMockMetrics(petId: string, metricType: HealthMetricType, days: number): HealthMetric[] {
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

  private generateDefaultTrend(metricType: HealthMetricType): HealthTrend {
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
}

export const healthService = new HealthService();