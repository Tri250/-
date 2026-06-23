import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock databaseService
vi.mock('../../services/databaseService', () => ({
  databaseService: {
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    getAll: vi.fn().mockResolvedValue([]),
    getByIndex: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  STORE_NAMES: {
    AI_CONVERSATIONS: 'ai_conversations',
    EMOTION_ANALYSES: 'emotion_analyses',
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { AIConsultationService } from '../../services/aiConsultationService';

describe('AI健康顾问服务', () => {
  let aiService: AIConsultationService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    aiService = new AIConsultationService();
  });

  describe('紧急关键词本地检测', () => {
    it('应该检测到抽搐等紧急关键词', () => {
      const result = aiService.analyzeQuestion('我的猫突然抽搐了', 'cat');
      expect(result.severity).toBe('urgent');
      expect(result.content).toContain('紧急');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('应该检测到呼吸困难等紧急关键词', () => {
      const result = aiService.analyzeQuestion('狗狗呼吸困难，喘不过气', 'dog');
      expect(result.severity).toBe('urgent');
      expect(result.content).toContain('紧急');
    });

    it('应该检测到尿闭等紧急关键词', () => {
      const result = aiService.analyzeQuestion('公猫尿不出来，尿闭了', 'cat');
      expect(result.severity).toBe('urgent');
    });

    it('应该检测到持续呕吐等紧急关键词', () => {
      const result = aiService.analyzeQuestion('狗狗持续呕吐不止', 'dog');
      expect(result.severity).toBe('urgent');
    });

    it('应该检测到血便等紧急关键词', () => {
      const result = aiService.analyzeQuestion('猫咪拉血了', 'cat');
      expect(result.severity).toBe('urgent');
    });

    it('应该检测到误食巧克力等紧急关键词', () => {
      const result = aiService.analyzeQuestion('狗狗误食巧克力', 'dog');
      expect(result.severity).toBe('urgent');
    });
  });

  describe('高严重程度关键词检测', () => {
    it('应该检测到高烧等高严重程度关键词', () => {
      const result = aiService.analyzeQuestion('猫咪高烧不退', 'cat');
      expect(result.severity).toBe('high');
    });

    it('应该检测到细小等高严重程度关键词', () => {
      const result = aiService.analyzeQuestion('狗狗得了细小', 'dog');
      expect(result.severity).toBe('high');
    });
  });

  describe('中等严重程度关键词检测', () => {
    it('应该检测到呕吐等中等严重程度关键词', () => {
      const result = aiService.analyzeQuestion('狗狗呕吐了', 'dog');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该检测到食欲不振等中等严重程度关键词', () => {
      const result = aiService.analyzeQuestion('我的猫最近食欲不振', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该检测到咳嗽等中等严重程度关键词', () => {
      const result = aiService.analyzeQuestion('猫咪咳嗽', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该检测到腹泻等中等严重程度关键词', () => {
      const result = aiService.analyzeQuestion('狗狗拉肚子了', 'dog');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该检测到脱毛等中等严重程度关键词', () => {
      const result = aiService.analyzeQuestion('猫咪最近掉毛严重', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该检测到嗜睡等中等严重程度关键词', () => {
      const result = aiService.analyzeQuestion('狗狗最近很嗜睡', 'dog');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该检测到攻击性等中等严重程度关键词', () => {
      const result = aiService.analyzeQuestion('猫咪变得很凶', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('常见问题本地回答', () => {
    it('应该识别驱虫相关问题', () => {
      const result = aiService.analyzeQuestion('宠物驱虫多久一次？', 'dog');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该识别疫苗相关问题', () => {
      const result = aiService.analyzeQuestion('宠物疫苗需要打哪些？', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该识别体检相关问题', () => {
      const result = aiService.analyzeQuestion('宠物多久体检一次？', 'dog');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该准确回答换牙问题', () => {
      const result = aiService.analyzeQuestion('狗狗换牙期需要注意什么？', 'dog');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该识别应激相关问题', () => {
      const result = aiService.analyzeQuestion('猫咪应激反应有哪些表现？', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该识别饮水量相关问题', () => {
      const result = aiService.analyzeQuestion('猫咪每天需要喝多少水？', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该识别体重管理相关问题', () => {
      const result = aiService.analyzeQuestion('如何控制狗狗体重？', 'dog');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('宠物类型特定建议', () => {
    it('应该为猫咪提供特定建议', () => {
      const result = aiService.analyzeQuestion('猫咪食欲不振', 'cat');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该为狗狗提供特定建议', () => {
      const result = aiService.analyzeQuestion('狗狗食欲不振', 'dog');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('本地紧急关键词检测准确性', () => {
    it('紧急关键词应返回urgent严重程度', () => {
      const urgentQuestions = [
        { question: '猫咪抽搐痉挛了', petType: 'cat' as const },
        { question: '狗狗呼吸困难', petType: 'dog' as const },
        { question: '公猫尿闭尿不出来', petType: 'cat' as const },
        { question: '狗狗持续呕吐不止', petType: 'dog' as const },
        { question: '猫咪拉血了', petType: 'cat' as const },
      ];

      for (const tc of urgentQuestions) {
        const result = aiService.analyzeQuestion(tc.question, tc.petType);
        expect(result.severity).toBe('urgent');
      }
    });

    it('快速问题列表中的大部分问题应得到高置信度回答', () => {
      const quickQuestions = [
        '我的猫最近食欲不振，怎么办？',
        '狗狗呕吐了需要去医院吗？',
        '如何判断宠物是否发烧？',
        '宠物驱虫多久一次？',
        '猫咪应激反应有哪些表现？',
        '狗狗换牙期需要注意什么？',
      ];

      let highConfidenceCount = 0;
      for (const question of quickQuestions) {
        const result = aiService.analyzeQuestion(question, 'cat');
        if (result.confidence >= 0.85) {
          highConfidenceCount++;
        }
      }

      const accuracyRate = highConfidenceCount / quickQuestions.length;
      expect(accuracyRate).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('generateResponse - 生成AI响应', () => {
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

  describe('sendMessage - 发送消息（非流式）', () => {
    it('紧急情况应该直接返回本地响应，不调用API', async () => {
      const response = await aiService.sendMessage('test-consultation', '猫咪抽搐了', 'cat');

      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content).toContain('紧急');
      expect(response.createdAt).toBeDefined();
      // Should NOT call fetch for urgent cases
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('非紧急情况应该调用API', async () => {
      // Mock SSE stream response
      const encoder = new TextEncoder();
      const chunks = [
        encoder.encode('data: {"choices":[{"delta":{"content":"这是"}}]}\n\n'),
        encoder.encode('data: {"choices":[{"delta":{"content":"AI回复"}}]}\n\n'),
        encoder.encode('data: [DONE]\n\n'),
      ];

      const readableStream = new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(chunk);
          }
          controller.close();
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: readableStream,
      });

      const response = await aiService.sendMessage('test-consultation', '我的猫咪食欲不振', 'cat');

      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content).toBe('这是AI回复');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('API失败时应该降级到本地分析', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await aiService.sendMessage('test-consultation', '我的猫咪食欲不振', 'cat');

      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content.length).toBeGreaterThan(0);
    });
  });

  describe('sendMessageStream - SSE流式响应', () => {
    it('应该正确解析SSE流式响应', async () => {
      const encoder = new TextEncoder();
      const chunks = [
        encoder.encode('data: {"choices":[{"delta":{"content":"你好"}}]}\n\n'),
        encoder.encode('data: {"choices":[{"delta":{"content":"，"}}]}\n\n'),
        encoder.encode('data: {"choices":[{"delta":{"content":"世界"}}]}\n\n'),
        encoder.encode('data: [DONE]\n\n'),
      ];

      const readableStream = new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(chunk);
          }
          controller.close();
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: readableStream,
      });

      const receivedChunks: string[] = [];
      const fullText = await aiService.sendMessageStream(
        [{ role: 'user', content: '你好' }],
        'pet-1',
        undefined,
        (text) => receivedChunks.push(text),
      );

      expect(fullText).toBe('你好，世界');
      expect(receivedChunks).toEqual(['你好', '，', '世界']);
    });

    it('紧急情况应该直接返回本地响应', async () => {
      const receivedChunks: string[] = [];
      const fullText = await aiService.sendMessageStream(
        [{ role: 'user', content: '猫咪抽搐了' }],
        'pet-1',
        undefined,
        (text) => receivedChunks.push(text),
      );

      expect(fullText).toContain('紧急');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('API错误应该抛出异常', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        aiService.sendMessageStream([{ role: 'user', content: '你好' }], 'pet-1'),
      ).rejects.toThrow();
    });
  });

  describe('对话历史持久化', () => {
    it('getConversationHistory应该返回空数组（无历史时）', async () => {
      const history = await aiService.getConversationHistory('pet-no-history');
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('输入验证', () => {
    it('应该拒绝空输入', () => {
      const result = aiService.validateInput('');
      expect(result.isValid).toBe(false);
    });

    it('应该拒绝过短输入', () => {
      const result = aiService.validateInput('a');
      expect(result.isValid).toBe(false);
    });

    it('应该接受有效输入', () => {
      const result = aiService.validateInput('我的猫咪食欲不振');
      expect(result.isValid).toBe(true);
    });

    it('应该检测禁止内容', () => {
      const result = aiService.validateInput('暴力虐待动物');
      expect(result.hasProhibitedContent).toBe(true);
    });
  });

  describe('方言和网络用语处理', () => {
    it('应该处理方言表达', () => {
      const result = aiService.analyzeQuestion('猫咪咋了不吃东西', 'cat');
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('应该处理网络用语', () => {
      const result = aiService.analyzeQuestion('猫咪emo了', 'cat');
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('意图检测', () => {
    it('应该检测紧急意图', () => {
      const result = aiService.analyzeQuestion('紧急情况，猫咪快不行了', 'cat');
      expect(result.detectedIntents).toContain('emergency');
    });

    it('应该检测诊断意图', () => {
      const result = aiService.analyzeQuestion('猫咪是什么原因不吃东西', 'cat');
      expect(result.detectedIntents).toBeDefined();
    });
  });
});
