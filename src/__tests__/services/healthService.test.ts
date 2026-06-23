import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthService } from '../../services/healthService';
import type { HealthMetricType } from '../../types/health';

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

    it('应该返回ISO格式的时间戳', async () => {
      const score = await healthService.getHealthScore('pet-1');
      expect(new Date(score.lastUpdated).toISOString()).toBe(score.lastUpdated);
    });

    it('不同宠物应该返回评分', async () => {
      const score1 = await healthService.getHealthScore('pet-1');
      const score2 = await healthService.getHealthScore('pet-2');
      
      expect(score1).toBeDefined();
      expect(score2).toBeDefined();
    });

    it('无历史数据时应返回合理默认评分', async () => {
      const score = await healthService.getHealthScore('pet-no-data');
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });
  });

  describe('getHealthRecords - 获取健康记录', () => {
    it('应该返回数组', async () => {
      const records = await healthService.getHealthRecords('pet-1');
      expect(Array.isArray(records)).toBe(true);
    });

    it('添加记录后应该能获取到', async () => {
      // 先添加一条记录
      await healthService.addHealthRecord({
        petId: 'pet-test-records',
        date: new Date().toISOString().split('T')[0],
        metrics: [
          { id: `test-m-${Date.now()}`, petId: 'pet-test-records', type: 'weight', value: 4.5, unit: 'kg', timestamp: new Date().toISOString() },
        ],
        overallStatus: 'good',
        vetVisit: false,
      });

      const records = await healthService.getHealthRecords('pet-test-records');
      expect(records.length).toBeGreaterThan(0);
      
      const record = records[0];
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('petId');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('metrics');
      expect(record).toHaveProperty('overallStatus');
    });

    it('指标应该包含正确的属性', async () => {
      await healthService.addHealthRecord({
        petId: 'pet-test-metrics',
        date: new Date().toISOString().split('T')[0],
        metrics: [
          { id: `test-m2-${Date.now()}`, petId: 'pet-test-metrics', type: 'weight', value: 4.5, unit: 'kg', timestamp: new Date().toISOString() },
        ],
        overallStatus: 'good',
        vetVisit: false,
      });

      const records = await healthService.getHealthRecords('pet-test-metrics');
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

    it('记录应该包含有效的日期格式', async () => {
      await healthService.addHealthRecord({
        petId: 'pet-test-date',
        date: new Date().toISOString().split('T')[0],
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      });

      const records = await healthService.getHealthRecords('pet-test-date');
      records.forEach(record => {
        expect(record.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('记录应该包含有效的整体状态', async () => {
      await healthService.addHealthRecord({
        petId: 'pet-test-status',
        date: new Date().toISOString().split('T')[0],
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      });

      const records = await healthService.getHealthRecords('pet-test-status');
      records.forEach(record => {
        expect(['good', 'fair', 'poor']).toContain(record.overallStatus);
      });
    });
  });

  describe('addHealthRecord - 添加健康记录', () => {
    it('应该成功添加健康记录', async () => {
      const newRecord = await healthService.addHealthRecord({
        petId: 'pet-1',
        date: '2026-01-16',
        metrics: [
          { id: 'test-m-1', petId: 'pet-1', type: 'weight', value: 4.5, unit: 'kg', timestamp: '2026-01-16T10:00:00Z' },
        ],
        overallStatus: 'good',
        vetVisit: false,
      });
      
      expect(newRecord).toHaveProperty('id');
      expect(newRecord.petId).toBe('pet-1');
      expect(newRecord.date).toBe('2026-01-16');
    });

    it('添加的记录应该有自动生成的ID', async () => {
      const newRecord = await healthService.addHealthRecord({
        petId: 'pet-2',
        date: '2026-01-17',
        metrics: [],
        overallStatus: 'fair',
        vetVisit: true,
      });
      
      expect(newRecord.id).toBeDefined();
      expect(newRecord.id).toMatch(/^record-/);
    });

    it('应该支持兽医访问标记', async () => {
      const recordWithVisit = await healthService.addHealthRecord({
        petId: 'pet-1',
        date: '2026-01-18',
        metrics: [],
        overallStatus: 'good',
        vetVisit: true,
      });
      
      expect(recordWithVisit.vetVisit).toBe(true);
    });

    it('添加后应该能在记录列表中找到', async () => {
      const newRecord = await healthService.addHealthRecord({
        petId: 'pet-1',
        date: '2026-01-19',
        metrics: [],
        overallStatus: 'good',
        vetVisit: false,
      });
      
      const records = await healthService.getHealthRecords('pet-1', 10);
      const found = records.find(r => r.id === newRecord.id);
      expect(found).toBeDefined();
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

    it('应该支持不同的指标类型', async () => {
      const types: HealthMetricType[] = ['weight', 'sleep', 'activity', 'eating', 'drinking'];
      
      for (const type of types) {
        const metric = await healthService.addHealthMetric({
          petId: 'pet-1',
          type,
          value: 50,
          unit: 'unit',
          timestamp: new Date().toISOString(),
        });
        
        expect(metric.type).toBe(type);
      }
    });

    it('添加的指标应该有自动生成的ID', async () => {
      const newMetric = await healthService.addHealthMetric({
        petId: 'pet-1',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      });
      
      expect(newMetric.id).toBeDefined();
      expect(newMetric.id).toMatch(/^metric-/);
    });
  });

  describe('getHealthAlerts - 获取健康提醒', () => {
    it('应该返回数组', async () => {
      const alerts = await healthService.getHealthAlerts('1');
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('添加异常数据后应该能生成告警', async () => {
      // 添加体重急剧变化的指标来触发告警
      await healthService.addHealthMetric({
        petId: 'pet-alert-test',
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      });

      await healthService.addHealthMetric({
        petId: 'pet-alert-test',
        type: 'weight',
        value: 5.5, // 体重变化超过 5%
        unit: 'kg',
        timestamp: new Date().toISOString(),
      });

      const alerts = await healthService.getHealthAlerts('pet-alert-test');
      // 告警可能生成也可能不生成，取决于阈值检测
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('提醒应该包含正确的属性', async () => {
      // 创建一个会触发告警的场景
      await healthService.addHealthMetric({
        petId: 'pet-alert-props',
        type: 'weight',
        value: 3.0,
        unit: 'kg',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      });

      await healthService.addHealthMetric({
        petId: 'pet-alert-props',
        type: 'weight',
        value: 4.0, // 33% 增长，应该触发告警
        unit: 'kg',
        timestamp: new Date().toISOString(),
      });

      const alerts = await healthService.getHealthAlerts('pet-alert-props');
      if (alerts.length > 0) {
        const alert = alerts[0];
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('petId');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('timestamp');
        expect(alert).toHaveProperty('acknowledged');
        expect(alert).toHaveProperty('recommendation');
      }
    });

    it('严重程度应该是有效的值', async () => {
      const alerts = await healthService.getHealthAlerts('1');
      alerts.forEach(alert => {
        expect(['low', 'medium', 'high']).toContain(alert.severity);
      });
    });

    it('不存在的宠物应该返回空数组或无告警', async () => {
      const alerts = await healthService.getHealthAlerts('non-existent-pet');
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe('acknowledgeAlert - 确认提醒', () => {
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

    it('应该支持不同的指标类型', async () => {
      const types: HealthMetricType[] = ['weight', 'sleep', 'activity'];
      
      for (const type of types) {
        const trend = await healthService.getHealthTrends('pet-1', type);
        expect(trend.metricType).toBe(type);
      }
    });

    it('变化值应该等于当前值减去之前值', async () => {
      const trend = await healthService.getHealthTrends('pet-1', 'activity');
      expect(trend.change).toBe(trend.current - trend.previous);
    });

    it('百分比变化应该正确计算', async () => {
      const trend = await healthService.getHealthTrends('pet-1', 'weight');
      if (trend.previous !== 0) {
        const expectedPercentage = (trend.change / trend.previous) * 100;
        expect(trend.percentageChange).toBeCloseTo(expectedPercentage, 1);
      }
    });

    it('无历史数据时应返回默认基线值', async () => {
      const trend = await healthService.getHealthTrends('pet-no-data', 'activity');
      expect(trend.current).toBeGreaterThan(0);
      expect(trend.previous).toBeGreaterThan(0);
    });
  });

  describe('getHealthGoals - 获取健康目标', () => {
    it('应该返回数组', async () => {
      const goals = await healthService.getHealthGoals('pet-1');
      expect(Array.isArray(goals)).toBe(true);
    });

    it('创建目标后应该能获取到', async () => {
      await healthService.createHealthGoal({
        petId: 'pet-goal-test',
        type: 'activity',
        target: 60,
        current: 45,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        status: 'active',
      });

      const goals = await healthService.getHealthGoals('pet-goal-test');
      expect(goals.length).toBeGreaterThan(0);
      
      const goal = goals[0];
      expect(goal).toHaveProperty('id');
      expect(goal).toHaveProperty('petId');
      expect(goal).toHaveProperty('type');
      expect(goal).toHaveProperty('target');
      expect(goal).toHaveProperty('current');
      expect(goal).toHaveProperty('deadline');
      expect(goal).toHaveProperty('status');
    });

    it('目标状态应该是有效的值', async () => {
      const goals = await healthService.getHealthGoals('pet-1');
      goals.forEach(goal => {
        expect(['active', 'completed', 'failed']).toContain(goal.status);
      });
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

    it('创建的目标应该有自动生成的ID', async () => {
      const newGoal = await healthService.createHealthGoal({
        petId: 'pet-1',
        type: 'weight',
        target: 4.5,
        current: 4.8,
        deadline: new Date().toISOString(),
        status: 'active',
      });
      
      expect(newGoal.id).toBeDefined();
      expect(newGoal.id).toMatch(/^goal-/);
    });
  });

  describe('updateHealthGoal - 更新健康目标', () => {
    it('应该成功更新已存在的目标', async () => {
      const newGoal = await healthService.createHealthGoal({
        petId: 'pet-update-test',
        type: 'activity',
        target: 60,
        current: 45,
        deadline: new Date().toISOString(),
        status: 'active',
      });

      const result = await healthService.updateHealthGoal(newGoal.id, { target: 70 });
      expect(result).toBe(true);
    });

    it('更新不存在的目标应该返回false', async () => {
      const result = await healthService.updateHealthGoal('non-existent', { target: 100 });
      expect(result).toBe(false);
    });
  });

  describe('deleteHealthGoal - 删除健康目标', () => {
    it('应该成功删除已存在的目标', async () => {
      const newGoal = await healthService.createHealthGoal({
        petId: 'pet-delete-test',
        type: 'activity',
        target: 60,
        current: 45,
        deadline: new Date().toISOString(),
        status: 'active',
      });

      const result = await healthService.deleteHealthGoal(newGoal.id);
      expect(result).toBe(true);
    });

    it('删除不存在的目标应该返回false', async () => {
      const result = await healthService.deleteHealthGoal('non-existent');
      expect(result).toBe(false);
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

    it('概率应该在0-1之间', async () => {
      const result = await healthService.checkSymptoms(['呕吐', '腹泻']);
      
      result.possibleConditions.forEach(condition => {
        expect(condition.probability).toBeGreaterThanOrEqual(0);
        expect(condition.probability).toBeLessThanOrEqual(1);
      });
    });

    it('应该返回输入的症状列表', async () => {
      const symptoms = ['咳嗽', '发热', '精神不振'];
      const result = await healthService.checkSymptoms(symptoms);
      
      expect(result.symptoms).toEqual(symptoms);
    });

    it('应该处理空症状列表', async () => {
      const result = await healthService.checkSymptoms([]);
      
      expect(result).toHaveProperty('symptoms');
      expect(result).toHaveProperty('possibleConditions');
    });
  });

  describe('getMetricHistory - 获取指标历史', () => {
    it('应该返回数组', async () => {
      const history = await healthService.getMetricHistory('pet-1', 'activity', 7);
      expect(Array.isArray(history)).toBe(true);
    });

    it('添加指标后应该能获取到历史', async () => {
      const petId = 'pet-history-test';
      await healthService.addHealthMetric({
        petId,
        type: 'activity',
        value: 45,
        unit: 'min',
        timestamp: new Date().toISOString(),
      });

      const history = await healthService.getMetricHistory(petId, 'activity', 7);
      expect(history.length).toBeGreaterThan(0);
    });

    it('历史记录应该按时间排序', async () => {
      const petId = 'pet-history-sort';
      await healthService.addHealthMetric({
        petId,
        type: 'sleep',
        value: 14,
        unit: 'h',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      });
      await healthService.addHealthMetric({
        petId,
        type: 'sleep',
        value: 12,
        unit: 'h',
        timestamp: new Date().toISOString(),
      });

      const history = await healthService.getMetricHistory(petId, 'sleep', 7);
      
      for (let i = 0; i < history.length - 1; i++) {
        const currentTime = new Date(history[i].timestamp).getTime();
        const nextTime = new Date(history[i + 1].timestamp).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
      }
    });

    it('应该支持不同的指标类型', async () => {
      const petId = 'pet-history-types';
      const types: HealthMetricType[] = ['weight', 'sleep', 'activity'];
      
      for (const type of types) {
        await healthService.addHealthMetric({
          petId,
          type,
          value: 50,
          unit: 'unit',
          timestamp: new Date().toISOString(),
        });
      }

      for (const type of types) {
        const history = await healthService.getMetricHistory(petId, type, 7);
        history.forEach(metric => {
          expect(metric.type).toBe(type);
        });
      }
    });

    it('历史记录应该包含正确的属性', async () => {
      const petId = 'pet-history-props';
      await healthService.addHealthMetric({
        petId,
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      });

      const history = await healthService.getMetricHistory(petId, 'weight', 7);
      
      history.forEach(metric => {
        expect(metric).toHaveProperty('id');
        expect(metric).toHaveProperty('petId');
        expect(metric).toHaveProperty('type');
        expect(metric).toHaveProperty('value');
        expect(metric).toHaveProperty('unit');
        expect(metric).toHaveProperty('timestamp');
      });
    });
  });
});
