import { describe, it, expect } from 'vitest';
import { AIConsultationService } from '../../services/aiConsultationService';

describe('AI健康顾问服务 - 准确性测试', () => {
  const aiService = new AIConsultationService();

  describe('症状分析准确性', () => {
    it('应该准确分析食欲不振症状', () => {
      const result = aiService.analyzeQuestion('我的猫最近食欲不振，怎么办？', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content).toContain('食欲不振');
      expect(result.content).toContain('建议');
    });

    it('应该准确分析呕吐症状', () => {
      const result = aiService.analyzeQuestion('狗狗呕吐了需要去医院吗？', 'dog');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content).toContain('呕吐');
      expect(result.content).toContain('医院');
    });

    it('应该准确分析咳嗽症状', () => {
      const result = aiService.analyzeQuestion('猫咪一直咳嗽，怎么办？', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content).toContain('咳嗽');
    });

    it('应该准确分析腹泻症状', () => {
      const result = aiService.analyzeQuestion('狗狗拉肚子了', 'dog');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content).toContain('腹泻');
    });

    it('应该准确分析发烧症状', () => {
      const result = aiService.analyzeQuestion('如何判断宠物是否发烧？', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.94);
      expect(result.content).toContain('体温');
    });

    it('应该准确分析脱毛症状', () => {
      const result = aiService.analyzeQuestion('猫咪最近掉毛严重', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content).toContain('脱毛');
    });

    it('应该准确分析嗜睡症状', () => {
      const result = aiService.analyzeQuestion('狗狗最近很嗜睡', 'dog');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content).toContain('嗜睡');
    });

    it('应该准确分析攻击性症状', () => {
      const result = aiService.analyzeQuestion('猫咪变得很凶', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content).toContain('攻击性');
    });
  });

  describe('常见问题回答准确性', () => {
    it('应该准确回答驱虫问题', () => {
      const result = aiService.analyzeQuestion('宠物驱虫多久一次？', 'dog');
      expect(result.confidence).toBe(0.98);
      expect(result.content).toContain('驱虫');
      expect(result.content).toContain('月');
    });

    it('应该准确回答疫苗问题', () => {
      const result = aiService.analyzeQuestion('宠物疫苗需要打哪些？', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.95);
      expect(result.content).toContain('疫苗');
    });

    it('应该准确回答体检问题', () => {
      const result = aiService.analyzeQuestion('宠物多久体检一次？', 'dog');
      expect(result.confidence).toBe(0.96);
      expect(result.content).toContain('体检');
      expect(result.content).toContain('年');
    });

    it('应该准确回答换牙问题', () => {
      const result = aiService.analyzeQuestion('狗狗换牙期需要注意什么？', 'dog');
      expect(result.confidence).toBe(0.95);
      expect(result.content).toContain('换牙');
    });

    it('应该准确回答应激问题', () => {
      const result = aiService.analyzeQuestion('猫咪应激反应有哪些表现？', 'cat');
      expect(result.confidence).toBe(0.94);
      expect(result.content).toContain('应激');
    });

    it('应该准确回答饮水量问题', () => {
      const result = aiService.analyzeQuestion('猫咪每天需要喝多少水？', 'cat');
      expect(result.confidence).toBe(0.95);
      expect(result.content).toContain('饮水');
    });

    it('应该准确回答体重管理问题', () => {
      const result = aiService.analyzeQuestion('如何控制狗狗体重？', 'dog');
      expect(result.confidence).toBe(0.97);
      expect(result.content).toContain('体重');
    });
  });

  describe('宠物类型特定建议', () => {
    it('应该为猫咪提供特定建议', () => {
      const result = aiService.analyzeQuestion('猫咪食欲不振', 'cat');
      expect(result.content).toContain('猫咪');
      expect(result.content).toContain('猫砂盆');
    });

    it('应该为狗狗提供特定建议', () => {
      const result = aiService.analyzeQuestion('狗狗食欲不振', 'dog');
      expect(result.content).toContain('狗狗');
      expect(result.content).toContain('散步');
    });
  });

  describe('综合准确性评估', () => {
    it('所有已知问题的平均准确率应高于90%', () => {
      const testCases = [
        { question: '我的猫食欲不振', petType: 'cat' as const, expectedMin: 0.9 },
        { question: '狗狗呕吐', petType: 'dog' as const, expectedMin: 0.9 },
        { question: '猫咪咳嗽', petType: 'cat' as const, expectedMin: 0.9 },
        { question: '驱虫多久一次', petType: 'dog' as const, expectedMin: 0.98 },
        { question: '疫苗接种', petType: 'cat' as const, expectedMin: 0.97 },
        { question: '宠物体检', petType: 'dog' as const, expectedMin: 0.96 },
        { question: '发烧判断', petType: 'cat' as const, expectedMin: 0.96 },
        { question: '体重管理', petType: 'dog' as const, expectedMin: 0.97 },
      ];

      const totalConfidence = testCases.reduce((sum, tc) => {
        const result = aiService.analyzeQuestion(tc.question, tc.petType);
        expect(result.confidence).toBeGreaterThanOrEqual(tc.expectedMin);
        return sum + result.confidence;
      }, 0);

      const averageConfidence = totalConfidence / testCases.length;
      expect(averageConfidence).toBeGreaterThan(0.9);
    });

    it('快速问题列表中的问题应全部得到高准确率回答', () => {
      const quickQuestions = [
        '我的猫最近食欲不振，怎么办？',
        '狗狗呕吐了需要去医院吗？',
        '如何判断宠物是否发烧？',
        '宠物驱虫多久一次？',
        '猫咪应激反应有哪些表现？',
        '狗狗换牙期需要注意什么？',
      ];

      let highConfidenceCount = 0;
      quickQuestions.forEach((question) => {
        const result = aiService.analyzeQuestion(question, 'cat');
        if (result.confidence >= 0.9) {
          highConfidenceCount++;
        }
      });

      const accuracyRate = highConfidenceCount / quickQuestions.length;
      expect(accuracyRate).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('AI响应生成', () => {
    it('应该生成有效的AI消息', () => {
      const userMessage = {
        id: '1',
        role: 'user' as const,
        content: '我的猫咪食欲不振',
        messageType: 'text' as const,
        createdAt: new Date().toISOString(),
      };

      const response = aiService.generateResponse(userMessage, 'cat');
      
      expect(response.id).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content).toBeDefined();
      expect(response.createdAt).toBeDefined();
      expect(response.content.length).toBeGreaterThan(10);
    });

    it('应该包含专业建议', () => {
      const userMessage = {
        id: '1',
        role: 'user' as const,
        content: '狗狗呕吐了',
        messageType: 'text' as const,
        createdAt: new Date().toISOString(),
      };

      const response = aiService.generateResponse(userMessage, 'dog');
      
      expect(response.content).toContain('建议');
    });
  });

  describe('消息发送功能', () => {
    it('应该返回有效的AI响应', async () => {
      const response = await aiService.sendMessage('test-consultation', '我的猫咪食欲不振', 'cat');
      
      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content).toBeDefined();
      expect(response.createdAt).toBeDefined();
    });
  });
});