import type { PawSyncHealthPlugin } from '../index';

export const PawSyncHealthWeb: PawSyncHealthPlugin = {
  async addHealthRecord(options) {
    return { id: Date.now() };
  },

  async getHealthRecords(options) {
    const records = [];
    const statuses = ['good', 'fair', 'good', 'good', 'fair', 'good', 'poor'];
    for (let i = 0; i < (options.limit || 7); i++) {
      records.push({
        id: `record-${i}`,
        petId: options.petId,
        type: statuses[i % statuses.length],
        tags: JSON.stringify(['weight', 'sleep', 'activity']),
        notes: JSON.stringify([
          { type: 'weight', value: 4 + Math.random(), unit: 'kg' },
          { type: 'sleep', value: 10 + Math.random() * 4, unit: 'h' },
          { type: 'activity', value: 30 + Math.random() * 40, unit: 'min' },
        ]),
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      });
    }
    return { records };
  },

  async addHealthMetric(options) {
    return { id: Date.now() };
  },

  async getHealthMetrics(options) {
    const metrics = [];
    for (let i = 0; i < (options.days || 7); i++) {
      metrics.push({
        id: i,
        petId: options.petId,
        type: options.type || 'weight',
        value: 4 + Math.random(),
        unit: options.type === 'weight' ? 'kg' : options.type === 'sleep' ? 'h' : 'min',
        recordedAt: new Date(Date.now() - i * 86400000).toISOString(),
      });
    }
    return { metrics };
  },

  async addHealthAlert(options) {
    return { id: Date.now() };
  },

  async getHealthAlerts(options) {
    return {
      alerts: [
        {
          id: 1,
          petId: options.petId,
          type: 'abnormal',
          severity: 'low',
          message: '轻微活动异常',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          acknowledged: false,
          recommendation: '多陪伴观察',
        },
      ],
    };
  },

  async acknowledgeAlert() {
    return { success: true };
  },

  async calculateHealthScore(options) {
    return {
      score: 75 + Math.floor(Math.random() * 20),
      diet: 70 + Math.floor(Math.random() * 25),
      activity: 65 + Math.floor(Math.random() * 30),
      sleep: 80 + Math.floor(Math.random() * 15),
      medical: 85 + Math.floor(Math.random() * 10),
    };
  },
};