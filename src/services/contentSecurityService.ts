export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface SecurityCheckResult {
  safe: boolean;
  riskLevel: RiskLevel;
  threats: string[];
  sanitizedContent: string;
  blocked: boolean;
  blockReason?: string;
}

export interface HighRiskOperation {
  type: string;
  description: string;
  requiresConfirmation: boolean;
  blocked: boolean;
}

const PROMPT_INJECTION_PATTERNS = [
  { pattern: /ignore\s+(previous|all|above|below|prior)\s+(instructions|rules|guidelines)/gi, threat: '忽略指令注入', risk: 'critical' },
  { pattern: /system\s*[:：]\s*["']?/gi, threat: '系统角色伪装', risk: 'critical' },
  { pattern: /assistant\s*[:：]\s*["']?/gi, threat: '助手角色伪装', risk: 'critical' },
  { pattern: /you\s+are\s+(now|a|an)\s+/gi, threat: '角色重定义', risk: 'high' },
  { pattern: /forget\s+(everything|all|previous)/gi, threat: '遗忘指令注入', risk: 'critical' },
  { pattern: /disregard\s+(all|any|previous)/gi, threat: '忽略指令注入', risk: 'high' },
  { pattern: /override\s+(settings|rules|instructions)/gi, threat: '覆盖指令注入', risk: 'critical' },
  { pattern: /bypass\s+(security|filter|rules)/gi, threat: '绕过安全检测', risk: 'critical' },
  { pattern: /reveal\s+(password|secret|token|key)/gi, threat: '敏感信息泄露请求', risk: 'critical' },
  { pattern: /show\s+(me\s+)?(the\s+)?(password|secret|token|key|code)/gi, threat: '敏感信息泄露请求', risk: 'critical' },
  { pattern: /execute\s+(command|code|script)/gi, threat: '代码执行请求', risk: 'critical' },
  { pattern: /run\s+(command|code|script)/gi, threat: '代码执行请求', risk: 'high' },
  { pattern: /\$\{[^}]*\}/gi, threat: '模板注入', risk: 'high' },
  { pattern: /<%[^%]*%>/gi, threat: '服务器端模板注入', risk: 'critical' },
  { pattern: /javascript\s*:/gi, threat: 'JavaScript协议注入', risk: 'critical' },
  { pattern: /data\s*:\s*text\/html/gi, threat: '数据URI注入', risk: 'high' },
  { pattern: /eval\s*\(/gi, threat: '动态代码执行', risk: 'critical' },
  { pattern: /Function\s*\(/gi, threat: '动态函数创建', risk: 'critical' },
  { pattern: /document\.(write|cookie|location)/gi, threat: 'DOM操作注入', risk: 'high' },
  { pattern: /window\.(location|eval|open)/gi, threat: '窗口操作注入', risk: 'high' },
  { pattern: /fetch\s*\(/gi, threat: '网络请求注入', risk: 'medium' },
  { pattern: /axios\s*\(/gi, threat: '网络请求注入', risk: 'medium' },
  { pattern: /http\s*:/gi, threat: 'HTTP协议注入', risk: 'medium' },
  { pattern: /https\s*:/gi, threat: 'HTTPS协议注入', risk: 'medium' },
  { pattern: /file\s*:/gi, threat: '文件协议注入', risk: 'high' },
  { pattern: /about:blank/gi, threat: '空白页面注入', risk: 'low' },
];

const VIOLATION_CONTENT_PATTERNS = [
  { pattern: /暴力|血腥|杀戮|屠杀|虐待/gi, threat: '暴力内容', risk: 'critical', category: 'violence' },
  { pattern: /色情|裸体|性交|淫秽/gi, threat: '色情内容', risk: 'critical', category: 'adult' },
  { pattern: /赌博|赌钱|博彩|彩票/gi, threat: '赌博内容', risk: 'high', category: 'gambling' },
  { pattern: /毒品|吸毒|贩毒|鸦片|海洛因|冰毒/gi, threat: '毒品相关', risk: 'critical', category: 'drugs' },
  { pattern: /诈骗|骗钱|欺诈|传销/gi, threat: '诈骗内容', risk: 'high', category: 'fraud' },
  { pattern: /恐怖|恐怖主义|炸弹|爆炸|袭击/gi, threat: '恐怖主义内容', risk: 'critical', category: 'terrorism' },
  { pattern: /自杀|自残|结束生命/gi, threat: '自杀相关内容', risk: 'critical', category: 'self-harm' },
  { pattern: /仇恨|歧视|种族主义|性别歧视/gi, threat: '仇恨言论', risk: 'high', category: 'hate-speech' },
  { pattern: /政治敏感|反政府|颠覆/gi, threat: '政治敏感内容', risk: 'high', category: 'political' },
  { pattern: /假新闻|谣言|虚假信息/gi, threat: '虚假信息', risk: 'medium', category: 'fake-news' },
];

const HIGH_RISK_OPERATIONS: HighRiskOperation[] = [
  { type: 'delete_all_data', description: '删除所有数据', requiresConfirmation: true, blocked: false },
  { type: 'delete_account', description: '注销账号', requiresConfirmation: true, blocked: false },
  { type: 'export_sensitive_data', description: '导出敏感数据', requiresConfirmation: true, blocked: false },
  { type: 'change_security_settings', description: '修改安全设置', requiresConfirmation: true, blocked: false },
  { type: 'execute_code', description: '执行代码', requiresConfirmation: false, blocked: true },
  { type: 'access_system_files', description: '访问系统文件', requiresConfirmation: false, blocked: true },
  { type: 'modify_permissions', description: '修改权限设置', requiresConfirmation: true, blocked: false },
  { type: 'send_network_request', description: '发送网络请求', requiresConfirmation: false, blocked: false },
];

class ContentSecurityManager {
  private readonly MAX_INPUT_LENGTH = 5000;
  private readonly MAX_THREATS_REPORTED = 10;
  private blockedOperationsLog: Array<{ operation: string; timestamp: Date; reason: string }> = [];

  checkPromptInjection(input: string): SecurityCheckResult {
    const threats: string[] = [];
    let maxRisk: RiskLevel = 'safe';
    let sanitizedContent = input;

    if (input.length > this.MAX_INPUT_LENGTH) {
      threats.push(`输入长度超过限制 (${input.length}/${this.MAX_INPUT_LENGTH})`);
      maxRisk = 'medium';
      sanitizedContent = input.substring(0, this.MAX_INPUT_LENGTH);
    }

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      const matches = input.match(pattern.pattern);
      if (matches) {
        threats.push(`${pattern.threat}: 发现 ${matches.length} 处`);
        if (this.isHigherRisk(pattern.risk as RiskLevel, maxRisk)) {
          maxRisk = pattern.risk as RiskLevel;
        }
        sanitizedContent = sanitizedContent.replace(pattern.pattern, '[已过滤]');
      }
    }

    const blocked = maxRisk === 'critical';
    const blockReason = blocked ? '检测到严重的提示注入攻击，已自动拦截' : undefined;

    if (blocked) {
      this.logBlockedOperation('prompt_injection', `检测到 ${threats.length} 个威胁`);
    }

    return {
      safe: maxRisk === 'safe' || maxRisk === 'low',
      riskLevel: maxRisk,
      threats: threats.slice(0, this.MAX_THREATS_REPORTED),
      sanitizedContent,
      blocked,
      blockReason,
    };
  }

  checkViolationContent(input: string): SecurityCheckResult {
    const threats: string[] = [];
    let maxRisk: RiskLevel = 'safe';
    let sanitizedContent = input;

    for (const pattern of VIOLATION_CONTENT_PATTERNS) {
      const matches = input.match(pattern.pattern);
      if (matches) {
        threats.push(`${pattern.threat}: 发现 ${matches.length} 处`);
        if (this.isHigherRisk(pattern.risk as RiskLevel, maxRisk)) {
          maxRisk = pattern.risk as RiskLevel;
        }
        sanitizedContent = sanitizedContent.replace(pattern.pattern, '[内容已过滤]');
      }
    }

    const blocked = maxRisk === 'critical' || maxRisk === 'high';
    const blockReason = blocked ? '检测到违规内容，已自动拦截' : undefined;

    if (blocked) {
      this.logBlockedOperation('violation_content', `检测到违规内容: ${threats.join(', ')}`);
    }

    return {
      safe: maxRisk === 'safe',
      riskLevel: maxRisk,
      threats: threats.slice(0, this.MAX_THREATS_REPORTED),
      sanitizedContent,
      blocked,
      blockReason,
    };
  }

  comprehensiveCheck(input: string): SecurityCheckResult {
    const injectionResult = this.checkPromptInjection(input);
    const violationResult = this.checkViolationContent(input);

    const allThreats = [...injectionResult.threats, ...violationResult.threats];
    const maxRisk = this.getHigherRisk(injectionResult.riskLevel, violationResult.riskLevel);
    const blocked = injectionResult.blocked || violationResult.blocked;

    let sanitizedContent = input;
    if (injectionResult.sanitizedContent !== input) {
      sanitizedContent = injectionResult.sanitizedContent;
    }
    if (violationResult.sanitizedContent !== sanitizedContent) {
      sanitizedContent = violationResult.sanitizedContent;
    }

    const blockReason = blocked 
      ? (injectionResult.blockReason || violationResult.blockReason || '内容不安全，已拦截')
      : undefined;

    return {
      safe: maxRisk === 'safe' || maxRisk === 'low',
      riskLevel: maxRisk,
      threats: allThreats.slice(0, this.MAX_THREATS_REPORTED),
      sanitizedContent,
      blocked,
      blockReason,
    };
  }

  checkHighRiskOperation(operationType: string): HighRiskOperation | null {
    const operation = HIGH_RISK_OPERATIONS.find(op => op.type === operationType);
    
    if (operation) {
      if (operation.blocked) {
        this.logBlockedOperation(operationType, `高危操作已被禁止: ${operation.description}`);
      }
      return operation;
    }

    return null;
  }

  isOperationAllowed(operationType: string): boolean {
    const operation = this.checkHighRiskOperation(operationType);
    if (!operation) return true;
    return !operation.blocked;
  }

  requiresConfirmation(operationType: string): boolean {
    const operation = this.checkHighRiskOperation(operationType);
    if (!operation) return false;
    return operation.requiresConfirmation;
  }

  private isHigherRisk(newRisk: RiskLevel, currentRisk: RiskLevel): boolean {
    const riskOrder: RiskLevel[] = ['safe', 'low', 'medium', 'high', 'critical'];
    return riskOrder.indexOf(newRisk) > riskOrder.indexOf(currentRisk);
  }

  private getHigherRisk(risk1: RiskLevel, risk2: RiskLevel): RiskLevel {
    return this.isHigherRisk(risk1, risk2) ? risk1 : risk2;
  }

  private logBlockedOperation(operation: string, reason: string): void {
    this.blockedOperationsLog.push({
      operation,
      timestamp: new Date(),
      reason,
    });

    if (this.blockedOperationsLog.length > 100) {
      this.blockedOperationsLog.shift();
    }
  }

  getBlockedOperationsLog(): Array<{ operation: string; timestamp: Date; reason: string }> {
    return [...this.blockedOperationsLog];
  }

  getSecurityStats(): { totalBlocked: number; promptInjectionBlocked: number; violationContentBlocked: number } {
    const log = this.blockedOperationsLog;
    return {
      totalBlocked: log.length,
      promptInjectionBlocked: log.filter(l => l.operation === 'prompt_injection').length,
      violationContentBlocked: log.filter(l => l.operation === 'violation_content').length,
    };
  }

  sanitizeForDisplay(content: string): string {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, 'data-blocked=')
      .replace(/<iframe/gi, '&lt;iframe')
      .replace(/<object/gi, '&lt;object')
      .replace(/<embed/gi, '&lt;embed')
      .replace(/<link/gi, '&lt;link')
      .replace(/\$\{[^}]*\}/gi, '[已过滤]')
      .replace(/<%[^%]*%>/gi, '[已过滤]');
  }

  validatePetInput(input: string): SecurityCheckResult {
    const result = this.comprehensiveCheck(input);
    
    const petSpecificPatterns = [
      { pattern: /注射|疫苗|药物/gi, threat: '医疗相关词汇', risk: 'low' },
    ];

    for (const pattern of petSpecificPatterns) {
      if (pattern.pattern.test(input)) {
        result.threats.push(`${pattern.threat}: 建议咨询专业兽医`);
      }
    }

    return result;
  }

  validateAIQuery(query: string): SecurityCheckResult {
    const result = this.comprehensiveCheck(query);

    if (query.toLowerCase().includes('如何') && 
        (query.toLowerCase().includes('伤害') || query.toLowerCase().includes('杀死'))) {
      result.threats.push('潜在有害行为查询');
      result.riskLevel = 'high';
      result.blocked = true;
      result.blockReason = '检测到潜在有害行为查询，已拦截';
    }

    return result;
  }
}

export const contentSecurityManager = new ContentSecurityManager();

export function useContentSecurity() {
  const checkInput = (input: string): SecurityCheckResult => {
    return contentSecurityManager.comprehensiveCheck(input);
  };

  const checkPrompt = (prompt: string): SecurityCheckResult => {
    return contentSecurityManager.checkPromptInjection(prompt);
  };

  const checkViolation = (content: string): SecurityCheckResult => {
    return contentSecurityManager.checkViolationContent(content);
  };

  const checkOperation = (operationType: string): boolean => {
    return contentSecurityManager.isOperationAllowed(operationType);
  };

  const needsConfirmation = (operationType: string): boolean => {
    return contentSecurityManager.requiresConfirmation(operationType);
  };

  const sanitize = (content: string): string => {
    return contentSecurityManager.sanitizeForDisplay(content);
  };

  const validatePetQuery = (query: string): SecurityCheckResult => {
    return contentSecurityManager.validatePetInput(query);
  };

  const validateAIQuery = (query: string): SecurityCheckResult => {
    return contentSecurityManager.validateAIQuery(query);
  };

  return {
    checkInput,
    checkPrompt,
    checkViolation,
    checkOperation,
    needsConfirmation,
    sanitize,
    validatePetQuery,
    validateAIQuery,
    getStats: contentSecurityManager.getSecurityStats,
  };
}