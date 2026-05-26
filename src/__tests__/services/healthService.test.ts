import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { healthService } from '../../services/healthService';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthScore - 获取健康评分', () => {
    it('应该返回有效的健康评分对象', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('nutrition');
      expect(score).toHaveProperty('activity');
      expect(score).toHaveProperty('sleep');
      expect(score).toHaveProperty('mental');
      expect(score).toHaveProperty('trend');
      expect(score).toHaveProperty('lastUpdated');
    });

    it('评分应该在0-100之间', async () => {
      const score = await healthService.getHealthScore('pet-1');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.nutrition).toBeGreaterThanOrEqual(0);
      expect(score.nutrition).toBeLessThanOrEqual(100);
      expect(score.activity).toBeGreaterThanOrEqual(0);
      expect(score.activity).toBeLessThanOrEqual(100);
      expect(score.sleep).toBeGreaterThanOrEqual(0);
      expect(score.sleep).toBeLessThanOrEqual(100);
      expect(score.mental).toBeGreaterThanOrEqual(0);
      expect(score.mental).toBeLessThanOrEqual(100);
    });

    it('趋势应该是有效的值', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(['improving', 'declining', 'stable']).toContain(score.trend);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回健康记录列表', async () => {
      const records = await healthService.getHealthRecords('pet-1');
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(0);
    });

    it('健康记录应该包含正确的属性', async () => {
      const records = await healthService.getHealthRecords('pet-1');
      const record = records[0];
      
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('应该支持限制返回数量', async () => {
      const records = await healthService.getHealthRecords('pet-1', 3);
      
      expect(records.length).toBe(3);
    });

    it('指标应该包含正确的属性', async () => {
      const records = await healthService.getHealthRecords('pet-1');
      const metrics = records[0].metrics;
      
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      
      const metric = metrics[0];
      expect(metric).toHaveProperty('id');
      expect(metric).toHaveProperty('petId');
      expect(metric).toHaveProperty('type');
      expect(metric).toHaveProperty('value');
      expect(metric).toHaveProperty('unit');
      expect(metric).toHaveProperty('timestamp');
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const newRecord = await healthService.addHealthRecord({
        petId: 'pet-1',
        date: '2024-01-16',
        metrics: [
          { id: 'test-m-1', petId: 'pet-1', type: 'weight', value: 4.5, unit: 'kg', timestamp: '2024-01-16T10:00:00Z' },
        ],
        overallStatus: 'good',
        vetVisit: false,
      });
      
      expect(newRecord).toHaveProperty('id');
      expect(newRecord.petId).toBe('pet-1');
      expect(newRecord.date).toBe('2024-01-16');
    });
  });

  describe('addHealthMetric - 添加健康指标', () => {
    it('应该成功添加健康指标', async () => {
      const newMetric = await healthService.addHealthMetric({
        petId: 'pet-1',
        type: 'activity',
        value: 45,
        unit: 'min',
        timestamp: new Date().toISOString(),
      });
      
      expect(newMetric).toHaveProperty('id');
      expect(newMetric.petId).toBe('pet-1');
      expect(newMetric.type).toBe('activity');
    });
  });

  describe('getHealthAlerts - 获取健康提醒', () => {
    it('应该返回健康提醒列表', async () => {
      const alerts = await healthService.getHealthAlerts('1');
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('提醒应该包含正确的属性', async () => {
      const alerts = await healthService.getHealthAlerts('1');
      const alert = alerts[0];
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('petId');
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('acknowledged');
      expect(alert).toHaveProperty('recommendation');
    });

    it('严重程度应该是有效的值', async () => {
      const alerts = await healthService.getHealthAlerts('1');
      alerts.forEach(alert => {
        expect(['low', 'medium', 'high']).toContain(alert.severity);
      });
    });
  });

  describe('acknowledgeAlert - 确认提醒', () => {
    it('应该成功确认提醒', async () => {
      const alerts = await healthService.getHealthAlerts('1');
      const unacknowledgedAlert = alerts.find(a => !a.acknowledged);
      
      if (unacknowledgedAlert) {
        const result = await healthService.acknowledgeAlert(unacknowledgedAlert.id);
        expect(result).toBe(true);
        
        const updatedAlerts = await healthService.getHealthAlerts('1');
        const updatedAlert = updatedAlerts.find(a => a.id === unacknowledgedAlert.id);
        expect(updatedAlert?.acknowledged).toBe(true);
      }
    });

    it('确认不存在的提醒应该返回false', async () => {
      const result = await healthService.acknowledgeAlert('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getHealthTrends - 获取健康趋势', () => {
    it('应该返回有效的趋势数据', async () => {
      const trend = await healthService.getHealthTrends('pet-1', 'activity');
      
      expect(trend).toHaveProperty('metricType');
      expect(trend).toHaveProperty('current');
      expect(trend).toHaveProperty('previous');
      expect(trend).toHaveProperty('change');
      expect(trend).toHaveProperty('percentageChange');
      expect(trend).toHaveProperty('direction');
      expect(trend).toHaveProperty('days');
    });

    it('方向应该是有效的值', async () => {
      const trend = await healthService.getHealthTrends('pet-1', 'weight');
      expect(['improving', 'declining', 'stable']).toContain(trend.direction);
    });
  });

  describe('getHealthGoals - 获取健康目标', () => {
    it('应该返回健康目标列表', async () => {
      const goals = await healthService.getHealthGoals('pet-1');
      
      expect(Array.isArray(goals)).toBe(true);
      expect(goals.length).toBeGreaterThan(0);
    });

    it('目标应该包含正确的属性', async () => {
      const goals = await healthService.getHealthGoals('pet-1');
      const goal = goals[0];
      
      expect(goal).toHaveProperty('id');
      expect(goal).toHaveProperty('petId');
      expect(goal).toHaveProperty('type');
      expect(goal).toHaveProperty('target');
      expect(goal).toHaveProperty('current');
      expect(goal).toHaveProperty('deadline');
      expect(goal).toHaveProperty('status');
    });
  });

  describe('createHealthGoal - 创建健康目标', () => {
    it('应该成功创建健康目标', async () => {
      const newGoal = await healthService.createHealthGoal({
        petId: 'pet-1',
        type: 'activity',
        target: 60,
        current: 45,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        status: 'active',
      });
      
      expect(newGoal).toHaveProperty('id');
      expect(newGoal.petId).toBe('pet-1');
      expect(newGoal.type).toBe('activity');
    });
  });

  describe('updateHealthGoal - 更新健康目标', () => {
    it('应该成功更新健康目标', async () => {
      const result = await healthService.updateHealthGoal('goal-1', { target: 70 });
      expect(result).toBe(true);
    });
  });

  describe('deleteHealthGoal - 删除健康目标', () => {
    it('应该成功删除健康目标', async () => {
      const result = await healthService.deleteHealthGoal('goal-1');
      expect(result).toBe(true);
    });
  });

  describe('checkSymptoms - 症状检查', () => {
    it('应该返回症状分析结果', async () => {
      const result = await healthService.checkSymptoms(['咳嗽', '打喷嚏']);
      
      expect(result).toHaveProperty('symptoms');
      expect(result).toHaveProperty('possibleConditions');
      expect(Array.isArray(result.possibleConditions)).toBe(true);
    });

    it('可能的病症应该包含正确的属性', async () => {
      const result = await healthService.checkSymptoms(['食欲不振']);
      const condition = result.possibleConditions[0];
      
      expect(condition).toHaveProperty('condition');
      expect(condition).toHaveProperty('probability');
      expect(condition).toHaveProperty('severity');
      expect(condition).toHaveProperty('recommendation');
    });
  });

  describe('getMetricHistory - 获取指标历史', () => {
    it('应该返回指标历史列表', async () => {
      const history = await healthService.getMetricHistory('pet-1', 'activity', 7);
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(7);
    });

    it('历史记录应该按时间排序', async () => {
      const history = await healthService.getMetricHistory('pet-1', 'sleep', 5);
      
      for (let i = 0; i < history.length - 1; i++) {
        const currentTime = new Date(history[i].timestamp).getTime();
        const nextTime = new Date(history[i + 1].timestamp).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
      }
    });
  });
});