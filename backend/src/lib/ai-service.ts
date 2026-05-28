import axios, { AxiosInstance } from 'axios';
import CircuitBreaker from 'opossum';
import { MEDICAL_DISCLAIMER, HEALTH_REPORT_DISCLAIMER } from './prompts/system.prompt';
import { buildHealthChatMessages, buildHealthReportMessages } from './prompts';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_MODEL = 'deepseek-chat';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GOOGLE_AI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GOOGLE_AI_MODEL = 'gemini-2.0-flash';

const AI_TIMEOUT = parseInt(process.env.AI_TIMEOUT || '15000');
const MAX_TOKEN_LIMIT = 3500;
const MAX_RETRY = 2;
const RETRY_DELAY = 1000;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  reply: string;
  messageId: string;
  timestamp: string;
  source: 'deepseek' | 'gemini' | 'fallback' | 'rule_engine';
}

export class TokenCounter {
  encode(text: string): number[] {
    const tokens: number[] = [];
    const chars = Array.from(text);
    let i = 0;
    
    while (i < chars.length) {
      let matched = false;
      for (let len = Math.min(3, chars.length - i); len >= 1; len--) {
        const substr = chars.slice(i, i + len).join('');
        const tokenId = this.getTokenId(substr);
        if (tokenId !== -1) {
          tokens.push(tokenId);
          i += len;
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        tokens.push(chars[i].charCodeAt(0) % 1000);
        i++;
      }
    }
    
    return tokens;
  }
  
  private tokenMap = new Map<string, number>();
  
  constructor() {
    this.initializeTokens();
  }
  
  private initializeTokens() {
    const basicTokens = [
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
      'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      ' ', '\n', '.', ',', '!', '?', "'", '"', '-', ':', ';',
      '中', '文', '宠', '物', '健', '康', '猫', '狗', '的', '是', '在',
    ];
    basicTokens.forEach((token, idx) => {
      this.tokenMap.set(token, idx);
    });
  }
  
  private getTokenId(token: string): number {
    return this.tokenMap.get(token) ?? -1;
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
  private dangerousPatterns = [
    /ignore.*instruction/i,
    /forget.*previous/i,
    /disregard.*rules/i,
    /password|secret|api.*key/i,
    /hack|attack|exploit/i,
  ];
  
  private medicalViolationPatterns = [
    /确诊.*病/i,
    /处方.*药/i,
    /开.*药.*治疗/i,
  ];
  
  checkInput(content: string): { safe: boolean; reason?: string } {
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(content)) {
        return { safe: false, reason: '输入包含不安全内容' };
      }
    }
    return { safe: true };
  }
  
  checkOutput(content: string): boolean {
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(content)) return false;
    }
    return true;
  }
  
  sanitizeOutput(content: string, type: 'chat' | 'report' = 'chat'): string {
    const disclaimer = type === 'report' ? HEALTH_REPORT_DISCLAIMER : MEDICAL_DISCLAIMER;
    if (!content.includes(disclaimer.trim())) {
      content = content.trim() + '\n\n' + disclaimer;
    }
    return content;
  }
}

class PetHealthRuleEngine {
  private rules = new Map<string, { keywords: string[]; response: string; urgent: boolean }>();
  
  constructor() {
    this.initializeRules();
  }
  
  private initializeRules() {
    this.rules.set('diarrhea', {
      keywords: ['拉稀', '腹泻', '拉肚子', '软便', '大便稀'],
      response: `根据您描述的腹泻症状，建议：

1. **观察记录**
   - 记录腹泻频率和粪便性状
   - 注意是否带血、黏液

2. **饮食调整**
   - 禁食 12-24 小时（仅提供清水）
   - 之后逐渐恢复清淡饮食

3. **补充水分**
   - 确保宠物有充足的清洁饮用水
   - 可口服补液盐

4. **🚨 立即就医情况**
   - 持续腹泻超过 24 小时
   - 伴随呕吐、发热、精神萎靡
   - 出现血便或黑色粪便
   - 幼年或老年宠物

5. **后续观察**
   - 症状缓解后，少量多餐喂食
   - 避免油腻、生冷食物
   - 记录饮食以便排查过敏原`,
      urgent: true,
    });
    
    this.rules.set('vomit', {
      keywords: ['呕吐', '吐了', '反胃', '呕'],
      response: `根据您描述的呕吐症状，建议：

1. **短暂禁食**
   - 禁食 6-12 小时，让胃肠道休息
   - 期间提供少量清水

2. **观察呕吐物**
   - 记录颜色、性状、频率
   - 是否吐毛球（猫）

3. **逐步恢复进食**
   - 从清淡易消化食物开始
   - 少量多次

4. **🚨 立即就医情况**
   - 频繁呕吐（超过 3 次）
   - 呕吐物带血
   - 伴随精神沉郁、腹泻
   - 疑似中毒

5. **家庭护理**
   - 毛球症可喂化毛膏或猫草
   - 避免剧烈运动后立即进食`,
      urgent: true,
    });
    
    this.rules.set('appetite', {
      keywords: ['不吃', '不吃饭', '没胃口', '食欲不振', '拒食'],
      response: `宠物食欲下降可能由多种原因引起：

1. **常见原因排查**
   - 环境变化（搬家、新宠物）
   - 食物问题（变质、换粮）
   - 口腔问题（牙龈红肿、牙齿问题）
   - 消化系统不适

2. **短期应对**
   - 尝试加热食物增加香味
   - 提供新鲜食物
   - 检查是否有异物阻塞

3. **🚨 立即就医情况**
   - 超过 24 小时不进食
   - 伴随呕吐、腹泻
   - 体重明显下降
   - 幼年宠物（易低血糖）

4. **建议观察**
   - 记录进食量和饮水量
   - 观察精神状态
   - 注意有无其他症状`,
      urgent: false,
    });
  }
  
  match(message: string): { response: string; urgent: boolean } | null {
    const lowerMessage = message.toLowerCase();
    
    for (const [key, rule] of this.rules) {
      for (const keyword of rule.keywords) {
        if (lowerMessage.includes(keyword)) {
          return {
            response: rule.response,
            urgent: rule.urgent,
          };
        }
      }
    }
    
    return null;
  }
}

class DeepSeekClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: DEEPSEEK_BASE_URL,
      timeout: AI_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
    });
  }
  
  async chat(messages: Message[]): Promise<string> {
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your_deepseek_key') {
      throw new Error('DEEPSEEK_API_KEY_NOT_CONFIGURED');
    }
    
    try {
      const response = await this.client.post('/chat/completions', {
        model: DEEPSEEK_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      });
      
      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format');
      }
      
      return response.data.choices[0].message.content;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('DEEPSEEK_AUTH_FAILED');
      }
      throw error;
    }
  }
}

class GoogleGeminiClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: GOOGLE_AI_BASE_URL,
      timeout: AI_TIMEOUT,
    });
  }
  
  async chat(messages: Message[]): Promise<string> {
    if (!GOOGLE_AI_API_KEY || GOOGLE_AI_API_KEY === 'your_google_key') {
      throw new Error('GOOGLE_AI_API_KEY_NOT_CONFIGURED');
    }
    
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    
    try {
      const response = await this.client.post(
        `/models/${GOOGLE_AI_MODEL}:generateContent`,
        {
          contents: [{
            parts: [{ text: `System: ${systemPrompt}\n\nUser: ${userMessage}` }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        },
        {
          params: { key: GOOGLE_AI_API_KEY },
        }
      );
      
      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid Gemini response format');
      }
      
      return response.data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('GOOGLE_AI_AUTH_FAILED');
      }
      throw error;
    }
  }
}

class PetHealthAIService {
  private deepseekClient: DeepSeekClient;
  private geminiClient: GoogleGeminiClient;
  private tokenizer: TokenCounter;
  private auditor: ContentAuditor;
  private ruleEngine: PetHealthRuleEngine;
  private circuitBreaker: CircuitBreaker;
  
  constructor() {
    this.deepseekClient = new DeepSeekClient();
    this.geminiClient = new GoogleGeminiClient();
    this.tokenizer = new TokenCounter();
    this.auditor = new ContentAuditor();
    this.ruleEngine = new PetHealthRuleEngine();
    
    this.circuitBreaker = new CircuitBreaker(
      this.executeWithFallback.bind(this),
      {
        timeout: AI_TIMEOUT + 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      }
    );
    
    this.setupCircuitBreakerEvents();
  }
  
  private setupCircuitBreakerEvents() {
    this.circuitBreaker.on('open', () => {
      console.log('🔴 Circuit breaker opened - AI service degraded');
    });
    
    this.circuitBreaker.on('halfOpen', () => {
      console.log('🟡 Circuit breaker half-open - testing AI service');
    });
    
    this.circuitBreaker.on('close', () => {
      console.log('🟢 Circuit breaker closed - AI service recovered');
    });
  }
  
  private async executeWithFallback(messages: Message[]): Promise<string> {
    try {
      if (DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== 'your_deepseek_key') {
        return await this.deepseekClient.chat(messages);
      }
    } catch (error: any) {
      console.error('DeepSeek failed:', error.message);
      
      if (GOOGLE_AI_API_KEY && GOOGLE_AI_API_KEY !== 'your_google_key') {
        console.log('Falling back to Google Gemini...');
        return await this.geminiClient.chat(messages);
      }
    }
    
    throw new Error('ALL_AI_SERVICES_UNAVAILABLE');
  }
  
  private truncateContext(messages: Message[], maxTokens: number = MAX_TOKEN_LIMIT): Message[] {
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
        truncatedMessages.unshift({
          role: 'system',
          content: systemMessage.content.substring(0, 2000),
        });
      }
    }
    
    return truncatedMessages;
  }
  
  private async retryRequest<T>(
    requestFn: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i <= MAX_RETRY; i++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;
        
        if (error.message.includes('AUTH_FAILED')) {
          throw error;
        }
        
        if (i < MAX_RETRY) {
          console.log(`AI request failed, retrying in ${RETRY_DELAY}ms (${i + 1}/${MAX_RETRY})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }
    
    throw lastError || new Error('AI request failed after retries');
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
        source: 'rule_engine',
      };
    }
    
    const ruleMatch = this.ruleEngine.match(userQuestion);
    if (ruleMatch) {
      const urgentPrefix = ruleMatch.urgent ? '🚨 **紧急提示**\n\n' : '';
      return {
        reply: this.auditor.sanitizeOutput(urgentPrefix + ruleMatch.response),
        messageId: Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: 'rule_engine',
      };
    }
    
    const messages = buildHealthChatMessages(petInfo, userQuestion, conversationHistory);
    const truncatedMessages = this.truncateContext(messages);
    
    const tokenCount = this.tokenizer.countMessagesTokens(truncatedMessages);
    if (tokenCount > MAX_TOKEN_LIMIT) {
      return {
        reply: '对话内容过长，请精简问题或开始新的对话。' + MEDICAL_DISCLAIMER,
        messageId: Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: 'rule_engine',
      };
    }
    
    try {
      let reply: string = await this.retryRequest(async () => {
        return await this.circuitBreaker.fire(truncatedMessages);
      }) as string;
      
      if (!this.auditor.checkOutput(reply)) {
        reply = '抱歉，我无法完成此请求，请换个问题。' + MEDICAL_DISCLAIMER;
      } else {
        reply = this.auditor.sanitizeOutput(reply, 'chat');
      }
      
      return {
        reply,
        messageId: Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: DEEPSEEK_API_KEY ? 'deepseek' : 'gemini',
      };
    } catch (error: any) {
      console.error('AI chat error:', error);
      return this.getFallbackResponse(userQuestion);
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
      let report: string = await this.retryRequest(async () => {
        return await this.circuitBreaker.fire(truncatedMessages);
      }) as string;
      
      report = this.auditor.sanitizeOutput(report, 'report');
      return report;
    } catch (error: any) {
      console.error('AI report generation error:', error);
      return this.getFallbackReport(petInfo);
    }
  }
  
  private getFallbackResponse(question: string): AIResponse {
    const fallbackResponses = [
      '感谢您的咨询！建议您咨询专业兽医以获得更准确的建议。',
      'AI 服务暂时不可用，请稍后再试。如情况紧急，请及时就医。',
      '我们的 AI 助手正在升级中，请稍后再次尝试。',
    ];
    
    const ruleMatch = this.ruleEngine.match(question);
    if (ruleMatch) {
      return {
        reply: this.auditor.sanitizeOutput(ruleMatch.response),
        messageId: Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: 'rule_engine',
      };
    }
    
    return {
      reply: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)] + '\n\n' + MEDICAL_DISCLAIMER,
      messageId: Date.now().toString(),
      timestamp: new Date().toISOString(),
      source: 'fallback',
    };
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
}

export const petHealthAI = new PetHealthAIService();
export default petHealthAI;
