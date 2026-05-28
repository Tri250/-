import axios, { AxiosInstance } from 'axios';
import CircuitBreaker from 'opossum';
import { buildHealthChatMessages } from './prompts/health-chat.prompt';
import { buildHealthReportMessages } from './prompts/health-report.prompt';
import { MEDICAL_DISCLAIMER, HEALTH_REPORT_DISCLAIMER } from './prompts/system.prompt';

const AI_API_KEY = process.env.AI_API_KEY;
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
const AI_MODEL = process.env.AI_MODEL || 'gpt-3.5-turbo';
const AI_TIMEOUT = parseInt(process.env.AI_TIMEOUT || '15000');
const MAX_TOKEN_LIMIT = 3500;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  reply: string;
  messageId: string;
  timestamp: string;
}

class TiktokenSimulator {
  private encoding: Map<string, number> = new Map();

  constructor() {
    this.initializeBasicTokens();
  }

  private initializeBasicTokens() {
    const basicTokens = [
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
      'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      ' ', '\n', '.', ',', '!', '?', "'", '"', '-', ':', ';',
      '中', '文', '宠', '物', '健', '康', '猫', '狗', '的', '是',
    ];
    basicTokens.forEach((token, idx) => {
      this.encoding.set(token, idx);
    });
  }

  encode(text: string): number[] {
    const tokens: number[] = [];
    const chars = Array.from(text);
    let i = 0;
    
    while (i < chars.length) {
      let matchLength = 1;
      
      for (let len = Math.min(3, chars.length - i); len > 0; len--) {
        const substr = chars.slice(i, i + len).join('');
        if (this.encoding.has(substr)) {
          tokens.push(this.encoding.get(substr)!);
          matchLength = len;
          break;
        }
      }
      
      if (matchLength === 1 && !this.encoding.has(chars[i])) {
        tokens.push(chars[i].charCodeAt(0) % 1000);
      }
      
      i += matchLength;
    }
    
    return tokens;
  }

  countTokens(text: string): number {
    return Math.ceil(this.encode(text).length * 1.2);
  }

  countMessagesTokens(messages: Message[]): number {
    return messages.reduce((total, msg) => {
      return total + this.countTokens(msg.content) + 4;
    }, 3);
  }
}

class ContentAuditor {
  private dangerousPatterns: RegExp[] = [
    /ignore.*instruction/i,
    /forget.*previous/i,
    /disregard.*rules/i,
    /password/i,
    /secret/i,
    /api.*key/i,
    /harmful|illegal|dangerous/i,
    /hack|attack|exploit/i,
    /system.*prompt/i,
  ];

  private medicalViolationPatterns: RegExp[] = [
    /确诊.*病/i,
    /处方.*药/i,
    /开.*药/i,
    /治疗.*方案/i,
  ];

  checkInput(content: string): { safe: boolean; reason?: string } {
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(content)) {
        return { safe: false, reason: '输入包含不安全内容' };
      }
    }
    return { safe: true };
  }

  checkOutput(content: string): { safe: boolean; reason?: string } {
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(content)) {
        return { safe: false, reason: '输出包含不安全内容' };
      }
    }
    
    for (const pattern of this.medicalViolationPatterns) {
      if (pattern.test(content)) {
        return { 
          safe: false, 
          reason: '输出包含违规医疗内容，已自动添加免责声明' 
        };
      }
    }
    
    return { safe: true };
  }

  sanitizeOutput(content: string): string {
    if (!content.includes(MEDICAL_DISCLAIMER.trim())) {
      content = content.trim() + '\n\n' + MEDICAL_DISCLAIMER;
    }
    return content;
  }

  sanitizeReport(content: string): string {
    if (!content.includes(HEALTH_REPORT_DISCLAIMER.trim())) {
      content = content.trim() + '\n\n' + HEALTH_REPORT_DISCLAIMER;
    }
    return content;
  }
}

class AiService {
  private axios: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private tokenizer: TiktokenSimulator;
  private auditor: ContentAuditor;
  private retryCount: number = 2;
  private retryDelay: number = 1000;

  constructor() {
    this.axios = axios.create({
      baseURL: AI_BASE_URL,
      timeout: AI_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
    });

    this.tokenizer = new TiktokenSimulator();
    this.auditor = new ContentAuditor();

    const breakerOptions = {
      timeout: AI_TIMEOUT + 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    };

    this.circuitBreaker = new CircuitBreaker(this.createRequest.bind(this), breakerOptions);

    this.circuitBreaker.on('open', () => {
      console.log('Circuit breaker opened - AI service degraded');
    });

    this.circuitBreaker.on('halfOpen', () => {
      console.log('Circuit breaker half-open - testing AI service');
    });

    this.circuitBreaker.on('close', () => {
      console.log('Circuit breaker closed - AI service recovered');
    });
  }

  private async createRequest(messages: Message[]): Promise<string> {
    if (!AI_API_KEY || AI_API_KEY === 'your_model_api_key') {
      console.log('AI API key not configured, returning fallback response');
      return this.getFallbackResponse(messages);
    }

    try {
      const response = await this.axios.post('/chat/completions', {
        model: AI_MODEL,
        messages: messages,
        temperature: 0.7,
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid AI response format');
      }

      return response.data.choices[0].message.content;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('AI API authentication failed:', error.response.status);
        throw new Error('AI_SERVICE_AUTH_FAILED');
      }
      
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        console.error('AI API request timeout');
        throw new Error('AI_SERVICE_TIMEOUT');
      }

      console.error('AI API request failed:', error.message);
      throw error;
    }
  }

  private getFallbackResponse(messages: Message[]): string {
    const fallbackResponses = [
      '感谢您的咨询！建议您咨询专业兽医以获得更准确的建议。',
      'AI 服务暂时不可用，请稍后再试。如情况紧急，请及时就医。',
      '我们的 AI 助手正在升级中，请稍后再次尝试。',
    ];

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const question = lastUserMessage?.content || '';

    if (question.includes('拉稀') || question.includes('呕吐') || question.includes('不吃')) {
      return `根据您描述的症状，建议：

1. 先观察宠物的精神状态和食欲
2. 记录呕吐/腹泻的频率和内容
3. 保持充足饮水，防止脱水
4. 如症状持续超过 24 小时或加重，请及时就医

${MEDICAL_DISCLAIMER}`;
    }

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)] + '\n\n' + MEDICAL_DISCLAIMER;
  }

  private async retryRequest(requestFn: () => Promise<string>): Promise<string> {
    let lastError: Error | null = null;

    for (let i = 0; i <= this.retryCount; i++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;
        
        if (error.message === 'AI_SERVICE_AUTH_FAILED') {
          throw error;
        }
        
        if (i < this.retryCount) {
          console.log(`AI request failed, retrying in ${this.retryDelay}ms (${i + 1}/${this.retryCount})`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    throw lastError || new Error('AI request failed after retries');
  }

  private truncateContext(
    messages: Message[],
    maxTokens: number = MAX_TOKEN_LIMIT
  ): Message[] {
    const currentTokens = this.tokenizer.countMessagesTokens(messages);
    
    if (currentTokens <= maxTokens) {
      return messages;
    }

    const systemMessage = messages.find(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');
    
    let truncatedMessages: Message[] = [];
    let tokenCount = 0;

    for (let i = otherMessages.length - 1; i >= 0; i--) {
      const msgTokens = this.tokenizer.countTokens(otherMessages[i].content) + 4;
      const systemTokens = systemMessage ? this.tokenizer.countTokens(systemMessage.content) + 4 : 0;
      
      if (tokenCount + msgTokens + systemTokens <= maxTokens - 100) {
        truncatedMessages.unshift(otherMessages[i]);
        tokenCount += msgTokens;
      } else {
        break;
      }
    }

    if (systemMessage) {
      const systemTokens = this.tokenizer.countTokens(systemMessage.content) + 4;
      if (tokenCount + systemTokens <= maxTokens) {
        truncatedMessages.unshift(systemMessage);
      } else {
        const truncatedSystem: Message = {
          role: 'system',
          content: systemMessage.content.substring(0, 2000),
        };
        truncatedMessages.unshift(truncatedSystem);
      }
    }

    return truncatedMessages;
  }

  async chat(
    userQuestion: string,
    petInfo: string,
    conversationHistory: { role: string; content: string }[] = []
  ): Promise<AIResponse> {
    const inputCheck = this.auditor.checkInput(userQuestion);
    if (!inputCheck.safe) {
      return {
        reply: `很抱歉，${inputCheck.reason}，无法为您提供相关建议。如果您有宠物健康方面的问题，欢迎重新提问。`,
        messageId: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
    }

    const messages = buildHealthChatMessages(petInfo, userQuestion, conversationHistory);
    const truncatedMessages = this.truncateContext(messages);

    const tokenCount = this.tokenizer.countMessagesTokens(truncatedMessages);
    if (tokenCount > MAX_TOKEN_LIMIT) {
      return {
        reply: '对话内容过长，请精简问题或开始新的对话。',
        messageId: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
    }

    try {
      let reply = await this.retryRequest(async () => {
        return await this.circuitBreaker.fire(truncatedMessages);
      });

      const outputCheck = this.auditor.checkOutput(reply);
      reply = this.auditor.sanitizeOutput(reply);

      return {
        reply,
        messageId: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('AI chat error:', error);

      if (error.message === 'AI_SERVICE_AUTH_FAILED') {
        return {
          reply: 'AI 服务配置异常，请联系管理员。' + MEDICAL_DISCLAIMER,
          messageId: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };
      }

      return {
        reply: this.getFallbackResponse(truncatedMessages),
        messageId: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  async generateReport(
    petInfo: string,
    data: {
      healthRecords: any[];
      vaccines: any[];
      checkups: any[];
      growthRecords: any[];
    }
  ): Promise<string> {
    const messages = buildHealthReportMessages(petInfo, data);
    const truncatedMessages = this.truncateContext(messages, 4000);

    try {
      let report = await this.retryRequest(async () => {
        return await this.circuitBreaker.fire(truncatedMessages);
      });

      report = this.auditor.sanitizeReport(report);

      return report;
    } catch (error: any) {
      console.error('AI report generation error:', error);
      return this.getFallbackReport(petInfo);
    }
  }

  private getFallbackReport(petInfo: string): string {
    return `# 健康报告

## 基础信息
${petInfo}

## 健康总评
由于 AI 服务暂时不可用，无法生成详细报告。

## 建议
1. 定期带宠物进行体检
2. 保持良好的喂养习惯
3. 记录宠物的健康状况

${HEALTH_REPORT_DISCLAIMER}`;
  }

  checkContentSafety(content: string): boolean {
    return this.auditor.checkInput(content).safe;
  }
}

export const aiService = new AiService();
export default aiService;
