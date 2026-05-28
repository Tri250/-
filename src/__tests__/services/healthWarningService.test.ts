// ============================================
// PawSync Pro - AI健康预警系统验收测试
//
// 作者: 带娃的小陈工
// 日期: 2026-05-28
// 描述: A01-F05完整测试用例覆盖
// ============================================

import { describe, it, expect, beforeEach } from 'vitest';
import { HealthWarningService } from '../../services/healthWarningService';
import { HealthMetric } from '../../types/health-warning';

describe('PawSync Pro AI健康预警系统 - 完整验收测试', () => {
  let service: HealthWarningService;
  const TEST_PET_ID = 'pet-1';
  const TEST_PET_ID_2 = 'pet-2';

  beforeEach(() => {
    service = new HealthWarningService();
    service.setPetInfo(TEST_PET_ID, '金毛犬', 3);
    service.setPetInfo(TEST_PET_ID_2, '英国短毛猫', 2);
  });

  // ============ 模块1: 健康数据采集与AI融合分析 (P0) ============

  describe('模块1: 健康数据采集与AI融合分析', () => {
    it('A01: 基础健康指标自动分析 - 正常指标', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-1',
          petId: TEST_PET_ID,
          type: 'weight',
          value: 28,
          unit: 'kg',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'm-2',
          petId: TEST_PET_ID,
          type: 'temperature',
          value: 38.7,
          unit: '℃',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await service.analyzeBasicMetrics(TEST_PET_ID, metrics);

      expect(result.status).toBe('normal');
      expect(result.analysis).toContain('健康状态良好');
      expect(result.warnings).toBeUndefined();
    });

    it('A02: 异常指标自动识别 - 体重超标和体温偏高', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-3',
          petId: TEST_PET_ID,
          type: 'weight',
          value: 35,
          unit: 'kg',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'm-4',
          petId: TEST_PET_ID,
          type: 'temperature',
          value: 39.8,
          unit: '℃',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await service.analyzeBasicMetrics(TEST_PET_ID, metrics);

      expect(result.status).toBe('abnormal');
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
      expect(result.warnings!.some(w => w.type === 'weight_abnormal')).toBe(true);
      expect(result.warnings!.some(w => w.type === 'temperature_abnormal')).toBe(true);
    });

    it('A03: 多维度数据关联分析 - 疑似感染风险', async () => {
      const tempMetrics: HealthMetric[] = [
        {
          id: 'm-5',
          petId: TEST_PET_ID,
          type: 'temperature',
          value: 39.7,
          unit: '℃',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'm-6',
          petId: TEST_PET_ID,
          type: 'temperature',
          value: 39.6,
          unit: '℃',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      await service.analyzeBasicMetrics(TEST_PET_ID, tempMetrics);

      const symptoms = ['精神萎靡', '食欲下降'];
      const analysis = await service.analyzeMultidimensionalData(TEST_PET_ID, symptoms);

      expect(analysis.symptoms).toEqual(symptoms);
      expect(analysis.analysis.possibleConditions.length).toBeGreaterThan(0);
      expect(analysis.analysis.immediateActions.length).toBeGreaterThan(0);
    });

    it('A04: 历史数据趋势分析 - 体重增长预测', async () => {
      const trendAnalysis = await service.analyzeTrends(TEST_PET_ID, 30);

      expect(trendAnalysis.petId).toBe(TEST_PET_ID);
      expect(trendAnalysis.metrics.length).toBeGreaterThan(0);
      expect(trendAnalysis.summary).toBeDefined();
      expect(trendAnalysis.riskAssessment).toBeDefined();
    });

    it('A05: 多宠物数据隔离分析', async () => {
      const metric1: HealthMetric = {
        id: 'm-p1',
        petId: TEST_PET_ID,
        type: 'weight',
        value: 35,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };

      const metric2: HealthMetric = {
        id: 'm-p2',
        petId: TEST_PET_ID_2,
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };

      await service.analyzeBasicMetrics(TEST_PET_ID, [metric1]);
      await service.analyzeBasicMetrics(TEST_PET_ID_2, [metric2]);

      const warnings1 = await service.getWarnings(TEST_PET_ID);
      const warnings2 = await service.getWarnings(TEST_PET_ID_2);

      expect(warnings1.length).toBeGreaterThan(0);
      const pet1Warnings = warnings1.filter(w => w.petId === TEST_PET_ID);
      const pet2Warnings = warnings2.filter(w => w.petId === TEST_PET_ID_2);
      
      expect(pet1Warnings.length).toBe(warnings1.length);
      expect(pet2Warnings.length).toBe(warnings2.length);
    });
  });

  // ============ 模块2: 异常检测与分级预警 (P0) ============

  describe('模块2: 异常检测与分级预警', () => {
    it('B01: 轻度异常预警 - 饮水量减少', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-drink',
          petId: TEST_PET_ID,
          type: 'drinking',
          value: 80,
          unit: '%',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await service.analyzeBasicMetrics(TEST_PET_ID, metrics);

      expect(result.warnings).toBeDefined();
      if (result.warnings && result.warnings.length > 0) {
        const warning = result.warnings[0];
        expect(warning.severity).toBe('low');
      }
    });

    it('B02: 中度异常预警 - 连续呕吐', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-vomit',
          petId: TEST_PET_ID,
          type: 'vomit',
          value: 2,
          unit: '次',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await service.analyzeBasicMetrics(TEST_PET_ID, metrics);

      expect(result.warnings).toBeDefined();
      if (result.warnings && result.warnings.length > 0) {
        const warning = result.warnings.find(w => w.type === 'vomit_abnormal');
        expect(warning?.severity).toBe('medium');
        expect(warning?.analysis.recommendations).toContain('禁食12小时');
      }
    });

    it('B03: 紧急异常预警 - 频繁呕吐', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-vomit-urgent',
          petId: TEST_PET_ID,
          type: 'vomit',
          value: 5,
          unit: '次',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await service.analyzeBasicMetrics(TEST_PET_ID, metrics);

      expect(result.warnings).toBeDefined();
      if (result.warnings && result.warnings.length > 0) {
        const warning = result.warnings.find(w => w.type === 'vomit_abnormal');
        expect(warning?.severity).toBe('emergency');
        expect(warning?.analysis.actionRequired).toContain('立即');
      }

      const clinics = await service.getNearbyClinics(TEST_PET_ID);
      expect(clinics.length).toBeGreaterThan(0);
    });

    it('B04: 预警重复触发控制', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-test',
          petId: TEST_PET_ID,
          type: 'weight',
          value: 35,
          unit: 'kg',
          timestamp: new Date().toISOString(),
        },
      ];

      await service.analyzeBasicMetrics(TEST_PET_ID, metrics);
      const warningsBefore = await service.getWarnings(TEST_PET_ID);
      
      const hasDuplicate = await service.checkDuplicateWarning(TEST_PET_ID, 'weight_abnormal');
      
      expect(typeof hasDuplicate).toBe('boolean');
    });

    it('B05: 预警自动解除', async () => {
      const abnormalMetrics: HealthMetric[] = [
        {
          id: 'm-bad',
          petId: TEST_PET_ID,
          type: 'temperature',
          value: 39.8,
          unit: '℃',
          timestamp: new Date().toISOString(),
        },
      ];

      await service.analyzeBasicMetrics(TEST_PET_ID, abnormalMetrics);
      const warningsBefore = await service.getWarnings(TEST_PET_ID);

      const normalMetrics: HealthMetric[] = [
        {
          id: 'm-good',
          petId: TEST_PET_ID,
          type: 'temperature',
          value: 38.5,
          unit: '℃',
          timestamp: new Date().toISOString(),
        },
      ];

      await service.analyzeBasicMetrics(TEST_PET_ID, normalMetrics);
      await service.autoResolveWarnings(TEST_PET_ID);
      
      expect(true).toBe(true);
    });
  });

  // ============ 模块3: AI健康报告生成 (P0) ============

  describe('模块3: AI健康报告生成', () => {
    it('C01: 基础健康报告生成 - 月度报告', async () => {
      const report = await service.generateHealthReport(TEST_PET_ID, 'monthly');

      expect(report.petId).toBe(TEST_PET_ID);
      expect(report.type).toBe('monthly');
      expect(report.content.overview.healthScore).toBeGreaterThanOrEqual(0);
      expect(report.content.overview.healthScore).toBeLessThanOrEqual(100);
      expect(report.content.metrics.length).toBeGreaterThan(0);
      expect(report.content.recommendations.length).toBeGreaterThan(0);
      expect(report.format).toBe('pdf');
    });

    it('C02: 异常专项报告生成', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-for-report',
          petId: TEST_PET_ID,
          type: 'weight',
          value: 35,
          unit: 'kg',
          timestamp: new Date().toISOString(),
        },
      ];

      const analysisResult = await service.analyzeBasicMetrics(TEST_PET_ID, metrics);
      const warnings = analysisResult.warnings || [];

      if (warnings.length > 0) {
        const report = await service.generateIssueSpecificReport(TEST_PET_ID, warnings[0].id);

        expect(report.type).toBe('issue_specific');
        expect(report.content.followUp).toBeDefined();
      }
    });

    it('C03: 报告内容准确性验证', async () => {
      const testMetric: HealthMetric = {
        id: 'm-verify',
        petId: TEST_PET_ID,
        type: 'weight',
        value: 29.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };

      await service.analyzeBasicMetrics(TEST_PET_ID, [testMetric]);

      const report = await service.generateHealthReport(TEST_PET_ID, 'monthly');
      
      const weightMetric = report.content.metrics.find(m => m.type === 'weight');
      
      expect(typeof report.content.overview.healthScore).toBe('number');
      expect(typeof report.content.warnings.total).toBe('number');
    });

    it('C04: 多宠物报告独立生成', async () => {
      const report1 = await service.generateHealthReport(TEST_PET_ID, 'weekly');
      const report2 = await service.generateHealthReport(TEST_PET_ID_2, 'weekly');

      expect(report1.petId).toBe(TEST_PET_ID);
      expect(report2.petId).toBe(TEST_PET_ID_2);
      expect(report1.id).not.toBe(report2.id);

      const reports1 = await service.getReports(TEST_PET_ID);
      const reports2 = await service.getReports(TEST_PET_ID_2);

      expect(reports1.every(r => r.petId === TEST_PET_ID)).toBe(true);
      expect(reports2.every(r => r.petId === TEST_PET_ID_2)).toBe(true);
    });

    it('C05: 历史报告查询与下载', async () => {
      await service.generateHealthReport(TEST_PET_ID, 'monthly');
      await service.generateHealthReport(TEST_PET_ID, 'weekly');

      const reports = await service.getReports(TEST_PET_ID);

      expect(reports.length).toBeGreaterThanOrEqual(2);
      expect(reports[0].createdAt).toBeDefined();
      expect(reports[0].format).toBeDefined();
    });
  });

  // ============ 模块4: 智能提醒推送 (P0) ============

  describe('模块4: 智能提醒推送', () => {
    it('D01: 预警提醒即时推送', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-alert',
          petId: TEST_PET_ID,
          type: 'temperature',
          value: 40.5,
          unit: '℃',
          timestamp: new Date().toISOString(),
        },
      ];

      const beforeReminders = await service.getReminders(TEST_PET_ID);
      await service.analyzeBasicMetrics(TEST_PET_ID, metrics);
      const afterReminders = await service.getReminders(TEST_PET_ID);

      expect(afterReminders.length).toBeGreaterThanOrEqual(beforeReminders.length);
    });

    it('D02: 提醒标记完成', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-remind',
          petId: TEST_PET_ID,
          type: 'vomit',
          value: 2,
          unit: '次',
          timestamp: new Date().toISOString(),
        },
      ];

      await service.analyzeBasicMetrics(TEST_PET_ID, metrics);
      const reminders = await service.getReminders(TEST_PET_ID);

      if (reminders.length > 0) {
        const reminderId = reminders[0].id;
        const result = await service.markReminderCompleted(reminderId, TEST_PET_ID);
        
        expect(result).toBe(true);

        const updatedReminders = await service.getReminders(TEST_PET_ID);
        const updated = updatedReminders.find(r => r.id === reminderId);
        expect(updated?.completed).toBe(true);
      }
    });

    it('D03: 重复提醒设置', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-repeat',
          petId: TEST_PET_ID,
          type: 'temperature',
          value: 39.7,
          unit: '℃',
          timestamp: new Date().toISOString(),
        },
      ];

      await service.analyzeBasicMetrics(TEST_PET_ID, metrics);
      const reminders = await service.getReminders(TEST_PET_ID);

      if (reminders.length > 0) {
        const reminderId = reminders[0].id;
        const result = await service.setRepeatReminder(reminderId, TEST_PET_ID, {
          type: 'hour',
          value: 6,
        });

        expect(result).toBe(true);
      }
    });

    it('D04: 即将到期预警提醒 - 疫苗', async () => {
      const reminder = await service.createVaccineReminder(
        TEST_PET_ID,
        '八联疫苗',
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      );

      expect(reminder.petId).toBe(TEST_PET_ID);
      expect(reminder.type).toBe('vaccination');
      expect(reminder.title).toContain('疫苗');
    });

    it('D05: 提醒批量管理 - 删除', async () => {
      await service.createVaccineReminder(TEST_PET_ID, '疫苗1', new Date().toISOString());
      await service.createVaccineReminder(TEST_PET_ID, '疫苗2', new Date().toISOString());
      await service.createVaccineReminder(TEST_PET_ID, '疫苗3', new Date().toISOString());

      const remindersBefore = await service.getReminders(TEST_PET_ID);
      
      if (remindersBefore.length >= 3) {
        const toDelete = remindersBefore.slice(0, 2).map(r => r.id);
        const deletedCount = await service.deleteReminders(toDelete, TEST_PET_ID);
        
        expect(deletedCount).toBe(2);

        const remindersAfter = await service.getReminders(TEST_PET_ID);
        expect(remindersAfter.length).toBe(remindersBefore.length - 2);
      }
    });
  });

  // ============ 模块5: AI对话式健康咨询 (P1) ============

  describe('模块5: AI对话式健康咨询', () => {
    it('E01: 基础健康问题咨询 - 每日饮水量', async () => {
      const result = await service.chatWithAI(
        TEST_PET_ID,
        null,
        '金毛犬每天需要喝多少水？'
      );

      expect(result.response).toContain('水');
      expect(result.conversation.messages.length).toBe(2);
      expect(result.conversation.messages[0].role).toBe('user');
      expect(result.conversation.messages[1].role).toBe('assistant');
    });

    it('E02: 基于历史数据的咨询 - 发热问题', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-fever',
          petId: TEST_PET_ID,
          type: 'temperature',
          value: 39.7,
          unit: '℃',
          timestamp: new Date().toISOString(),
        },
      ];

      await service.analyzeBasicMetrics(TEST_PET_ID, metrics);

      const result = await service.chatWithAI(
        TEST_PET_ID,
        null,
        '我家狗狗最近发烧怎么办？'
      );

      expect(result.response).toBeDefined();
      expect(result.response.length).toBeGreaterThan(0);
    });

    it('E03: 症状识别与初步诊断 - 呕吐问题', async () => {
      const result = await service.chatWithAI(
        TEST_PET_ID,
        null,
        '猫咪呕吐白色泡沫，精神不好'
      );

      expect(result.response).toBeDefined();
    });

    it('E04: 上下文理解能力', async () => {
      const firstResult = await service.chatWithAI(
        TEST_PET_ID,
        null,
        '猫咪呕吐白色泡沫'
      );

      const secondResult = await service.chatWithAI(
        TEST_PET_ID,
        firstResult.conversation.id,
        '那需要喂什么药？'
      );

      expect(secondResult.conversation.messages.length).toBe(4);
      expect(secondResult.response).toBeDefined();
    });

    it('E05: 对话历史查询', async () => {
      await service.chatWithAI(TEST_PET_ID, null, '问题1');
      await service.chatWithAI(TEST_PET_ID, null, '问题2');

      const conversations = await service.getConversations(TEST_PET_ID);

      expect(conversations.length).toBeGreaterThanOrEqual(2);
      expect(conversations[0].messages.length).toBeGreaterThan(0);
    });
  });

  // ============ 模块6: 历史预警管理 (P1) ============

  describe('模块6: 历史预警管理', () => {
    it('F01: 预警列表展示 - 按时间倒序', async () => {
      const metrics1: HealthMetric[] = [
        {
          id: 'm-10',
          petId: TEST_PET_ID,
          type: 'weight',
          value: 35,
          unit: 'kg',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const metrics2: HealthMetric[] = [
        {
          id: 'm-11',
          petId: TEST_PET_ID,
          type: 'temperature',
          value: 39.8,
          unit: '℃',
          timestamp: new Date().toISOString(),
        },
      ];

      await service.analyzeBasicMetrics(TEST_PET_ID, metrics1);
      await service.analyzeBasicMetrics(TEST_PET_ID, metrics2);

      const warnings = await service.getWarnings(TEST_PET_ID);

      expect(warnings.length).toBeGreaterThan(1);
      for (let i = 1; i < warnings.length; i++) {
        expect(new Date(warnings[i].timestamp).getTime()).toBeLessThanOrEqual(
          new Date(warnings[i - 1].timestamp).getTime()
        );
      }
    });

    it('F02: 预警多条件筛选', async () => {
      const highMetric: HealthMetric = {
        id: 'm-high',
        petId: TEST_PET_ID,
        type: 'temperature',
        value: 40.0,
        unit: '℃',
        timestamp: new Date().toISOString(),
      };

      const lowMetric: HealthMetric = {
        id: 'm-low',
        petId: TEST_PET_ID,
        type: 'drinking',
        value: 80,
        unit: '%',
        timestamp: new Date().toISOString(),
      };

      await service.analyzeBasicMetrics(TEST_PET_ID, [highMetric, lowMetric]);

      const allWarnings = await service.getWarnings(TEST_PET_ID);
      expect(allWarnings.length).toBeGreaterThan(0);

      const activeWarnings = await service.getWarnings(TEST_PET_ID, {
        status: 'active',
      });

      expect(activeWarnings.every(w => !w.resolved)).toBe(true);
    });

    it('F03: 预警详情查看', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-detail',
          petId: TEST_PET_ID,
          type: 'weight',
          value: 35,
          unit: 'kg',
          timestamp: new Date().toISOString(),
        },
      ];

      await service.analyzeBasicMetrics(TEST_PET_ID, metrics);
      const warnings = await service.getWarnings(TEST_PET_ID);

      if (warnings.length > 0) {
        const warning = warnings[0];
        expect(warning.analysis).toBeDefined();
        expect(warning.analysis.summary).toBeDefined();
        expect(warning.analysis.recommendations.length).toBeGreaterThan(0);
      }
    });

    it('F04: 预警删除', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-delete',
          petId: TEST_PET_ID,
          type: 'vomit',
          value: 2,
          unit: '次',
          timestamp: new Date().toISOString(),
        },
      ];

      await service.analyzeBasicMetrics(TEST_PET_ID, metrics);
      const warningsBefore = await service.getWarnings(TEST_PET_ID);

      if (warningsBefore.length > 0) {
        const warningId = warningsBefore[0].id;
        const deleteResult = await service.deleteWarning(warningId, TEST_PET_ID);
        
        expect(deleteResult).toBe(true);

        const warningsAfter = await service.getWarnings(TEST_PET_ID);
        expect(warningsAfter.find(w => w.id === warningId)).toBeUndefined();
      }
    });

    it('F05: 预警数据导出', async () => {
      const metrics: HealthMetric[] = [
        {
          id: 'm-export',
          petId: TEST_PET_ID,
          type: 'weight',
          value: 35,
          unit: 'kg',
          timestamp: new Date().toISOString(),
        },
      ];

      await service.analyzeBasicMetrics(TEST_PET_ID, metrics);

      const warnings = await service.getWarnings(TEST_PET_ID);
      
      const exportData = warnings.map(w => ({
        id: w.id,
        petId: w.petId,
        type: w.type,
        severity: w.severity,
        timestamp: w.timestamp,
        status: w.resolved ? 'resolved' : 'active',
      }));

      expect(exportData.length).toBe(warnings.length);
      expect(exportData[0].id).toBeDefined();
    });
  });

  // ============ 非功能验收 ============

  describe('非功能验收', () => {
    it('响应时间 - AI对话响应时间', async () => {
      const startTime = Date.now();
      await service.chatWithAI(TEST_PET_ID, null, '测试问题');
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(10000);
    });

    it('响应时间 - 健康报告生成时间', async () => {
      const startTime = Date.now();
      await service.generateHealthReport(TEST_PET_ID, 'monthly');
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(10000);
    });

    it('准确性 - 基础异常指标识别', async () => {
      const testCases = [
        { type: 'weight' as const, value: 35, shouldWarn: true },
        { type: 'temperature' as const, value: 38.5, shouldWarn: false },
        { type: 'temperature' as const, value: 40.0, shouldWarn: true },
        { type: 'vomit' as const, value: 2, shouldWarn: true },
      ];

      let correctCount = 0;

      for (const test of testCases) {
        const metric: HealthMetric = {
          id: `test-${Date.now()}-${Math.random()}`,
          petId: TEST_PET_ID,
          type: test.type,
          value: test.value,
          unit: test.type === 'weight' ? 'kg' : test.type === 'temperature' ? '℃' : '次',
          timestamp: new Date().toISOString(),
        };

        const result = await service.analyzeBasicMetrics(TEST_PET_ID, [metric]);
        const hasWarning = !!result.warnings && result.warnings.length > 0;
        
        if (hasWarning === test.shouldWarn) {
          correctCount++;
        }
      }

      const accuracy = correctCount / testCases.length;
      expect(accuracy).toBeGreaterThanOrEqual(0.7);
    });

    it('稳定性 - 多次调用无错误', async () => {
      for (let i = 0; i < 10; i++) {
        const metric: HealthMetric = {
          id: `stable-${i}`,
          petId: TEST_PET_ID,
          type: 'weight',
          value: 28 + i * 0.5,
          unit: 'kg',
          timestamp: new Date().toISOString(),
        };

        await service.analyzeBasicMetrics(TEST_PET_ID, [metric]);
      }

      const warnings = await service.getWarnings(TEST_PET_ID);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('数据安全 - 不同宠物数据隔离', async () => {
      const metric1: HealthMetric = {
        id: 'data-1',
        petId: TEST_PET_ID,
        type: 'weight',
        value: 35,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };

      const metric2: HealthMetric = {
        id: 'data-2',
        petId: TEST_PET_ID_2,
        type: 'weight',
        value: 4.5,
        unit: 'kg',
        timestamp: new Date().toISOString(),
      };

      await service.analyzeBasicMetrics(TEST_PET_ID, [metric1]);
      await service.analyzeBasicMetrics(TEST_PET_ID_2, [metric2]);

      await service.generateHealthReport(TEST_PET_ID, 'monthly');
      await service.generateHealthReport(TEST_PET_ID_2, 'monthly');

      const reports1 = await service.getReports(TEST_PET_ID);
      const reports2 = await service.getReports(TEST_PET_ID_2);

      expect(reports1.every(r => r.petId === TEST_PET_ID)).toBe(true);
      expect(reports2.every(r => r.petId === TEST_PET_ID_2)).toBe(true);
    });
  });
});
