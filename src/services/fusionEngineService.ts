// ============================================
// PawSync Pro 3.0 - Fusion Engine Service
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 三模融合决策层 - 规则引擎+轻量MLP
// ============================================

import type { 
  FusionEvent, 
  FusionRule, 
  _VisualCondition, 
  _AudioCondition, 
  _FaceCondition, 
  EventType, 
  Severity 
} from '../types/fusion';

import { aiHealthAlertService } from './aiHealthAlertService';
import { audioRecognitionService } from './audioRecognitionService';
import { faceExpressionService } from './faceExpressionService';

const MOCK_DELAY = 500;

// 融合规则定义
const fusionRules: FusionRule[] = [
  {
    id: 'rule-vomit-warning',
    name: '呕吐预警',
    description: '多模态检测呕吐行为',
    visualConditions: [{ behavior: 'vomiting', operator: '==', threshold: 0.8 }],
    audioConditions: [{ emotion: 'pain', operator: '==', threshold: 0.7 }],
    faceConditions: [{ expression: 'pain', operator: 'in', values: ['pain', 'tense'] }],
    outputEvent: 'vomit_warning',
    severity: 'critical',
    minModalities: 2,
    priority: 1
  },
  {
    id: 'rule-separation-anxiety',
    name: '分离焦虑',
    description: '检测分离焦虑行为',
    visualConditions: [{ behavior: 'pacing', operator: 'in', values: ['pacing', 'scratching_door', 'excessive_licking'] }],
    audioConditions: [{ emotion: 'anxiety', operator: 'in', values: ['anxious', 'fear'] }],
    faceConditions: [],
    outputEvent: 'separation_anxiety',
    severity: 'warning',
    minModalities: 1,
    priority: 2
  },
  {
    id: 'rule-skin-issue',
    name: '皮肤异常',
    description: '检测过度舔舐行为',
    visualConditions: [{ behavior: 'excessive_licking', operator: '==', threshold: 0.75 }],
    audioConditions: [{ emotion: 'pain', operator: '==', threshold: 0.6 }],
    faceConditions: [{ expression: 'pain', operator: '==', threshold: 0.6 }],
    outputEvent: 'skin_abnormality',
    severity: 'warning',
    minModalities: 2,
    priority: 3
  },
  {
    id: 'rule-respiratory-issue',
    name: '呼吸异常',
    description: '检测呼吸异常行为',
    visualConditions: [{ behavior: 'coughing', operator: 'in', values: ['coughing', 'breathing_change'] }],
    audioConditions: [{ emotion: 'pain', operator: 'in', values: ['pain', 'anxious'] }],
    faceConditions: [{ expression: 'tense', operator: '==', threshold: 0.7 }],
    outputEvent: 'respiratory_issue',
    severity: 'warning',
    minModalities: 2,
    priority: 2
  },
  {
    id: 'rule-digestive-issue',
    name: '消化异常',
    description: '检测消化相关问题',
    visualConditions: [{ behavior: 'diarrhea', operator: '==', threshold: 0.8 }],
    audioConditions: [{ emotion: 'pain', operator: '==', threshold: 0.65 }],
    faceConditions: [{ expression: 'pain', operator: '==', threshold: 0.6 }],
    outputEvent: 'digestive_issue',
    severity: 'critical',
    minModalities: 2,
    priority: 1
  },
  {
    id: 'rule-hunger-signal',
    name: '饥饿信号',
    description: '检测饥饿相关行为',
    visualConditions: [{ behavior: 'loss_of_appetite', operator: '==', threshold: 0.6 }],
    audioConditions: [{ emotion: 'anxious', operator: '==', threshold: 0.7 }],
    faceConditions: [{ expression: 'curious', operator: '==', threshold: 0.6 }],
    outputEvent: 'hunger_signal',
    severity: 'info',
    minModalities: 1,
    priority: 4
  },
  {
    id: 'rule-dehydration-risk',
    name: '脱水风险',
    description: '检测饮水异常',
    visualConditions: [{ behavior: 'increased_thirst', operator: '==', threshold: 0.7 }],
    audioConditions: [{ emotion: 'anxious', operator: '==', threshold: 0.6 }],
    faceConditions: [],
    outputEvent: 'dehydration_risk',
    severity: 'warning',
    minModalities: 2,
    priority: 3
  },
  {
    id: 'rule-pain-indicator',
    name: '疼痛指示',
    description: '多模态检测疼痛',
    visualConditions: [{ behavior: 'limping', operator: '==', threshold: 0.75 }],
    audioConditions: [{ emotion: 'pain', operator: '==', threshold: 0.75 }],
    faceConditions: [{ expression: 'pain', operator: '==', threshold: 0.7 }],
    outputEvent: 'pain_indicator',
    severity: 'critical',
    minModalities: 2,
    priority: 1
  }
];

// 事件类型配置
const eventTypeConfig: Record<EventType, {
  label: string;
  emoji: string;
  description: string;
  recommendation: string;
}> = {
  vomit_warning: {
    label: '呕吐预警',
    emoji: '🤢',
    description: '检测到呕吐行为，可能涉及肠胃问题',
    recommendation: '立即就医，可能涉及肠胃炎、中毒或其他严重疾病'
  },
  separation_anxiety: {
    label: '分离焦虑',
    emoji: '😰',
    description: '宠物表现出分离焦虑行为',
    recommendation: '提供安抚玩具，考虑使用费洛蒙扩散器，严重时咨询行为专家'
  },
  skin_abnormality: {
    label: '皮肤异常',
    emoji: '🩹',
    description: '检测到过度舔舐，可能存在皮肤问题',
    recommendation: '检查皮肤是否有红肿或寄生虫，必要时就医'
  },
  respiratory_issue: {
    label: '呼吸异常',
    emoji: '🫁',
    description: '检测到呼吸异常行为',
    recommendation: '观察是否有咳嗽或呼吸困难，持续则就医'
  },
  digestive_issue: {
    label: '消化异常',
    emoji: '💩',
    description: '检测到腹泻或消化问题',
    recommendation: '补充电解质，持续则就医检查'
  },
  hunger_signal: {
    label: '饥饿信号',
    emoji: '🍽️',
    description: '宠物可能饥饿或食欲有变化',
    recommendation: '检查食物是否新鲜，尝试不同食物'
  },
  dehydration_risk: {
    label: '脱水风险',
    emoji: '💧',
    description: '饮水量异常，存在脱水风险',
    recommendation: '确保充足饮水，提供多个饮水点'
  },
  pain_indicator: {
    label: '疼痛指示',
    emoji: '😣',
    description: '宠物可能正经历疼痛',
    recommendation: '立即就医检查，确定疼痛原因'
  }
};

class FusionEngineService {
  private fusionEvents: FusionEvent[] = [];
  private eventCallbacks: Array<(event: FusionEvent) => void> = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const events: Array<{ type: EventType; severity: Severity }> = [
      { type: 'separation_anxiety', severity: 'warning' },
      { type: 'skin_abnormality', severity: 'warning' },
      { type: 'hunger_signal', severity: 'info' },
    ];

    events.forEach((event, index) => {
      const config = eventTypeConfig[event.type];
      this.fusionEvents.push({
        id: `fusion-event-${index}`,
        petId: '1',
        type: event.type,
        severity: event.severity,
        confidence: 0.75 + Math.random() * 0.24,
        timestamp: new Date(Date.now() - index * 3600000).toISOString(),
        modalities: ['visual', 'audio'],
        description: config.description,
        recommendation: config.recommendation,
        sourceRule: fusionRules.find(r => r.outputEvent === event.type)?.id || '',
        acknowledged: index > 0
      });
    });
  }

  // 评估单个条件
  private evaluateCondition(
    value: string | number | undefined,
    operator: string,
    threshold?: number,
    values?: string[]
  ): boolean {
    if (value === undefined) return false;

    switch (operator) {
      case '==':
        return value === threshold || value === values?.[0];
      case '>':
        return typeof value === 'number' && threshold !== undefined && value > threshold;
      case '<':
        return typeof value === 'number' && threshold !== undefined && value < threshold;
      case '>=':
        return typeof value === 'number' && threshold !== undefined && value >= threshold;
      case '<=':
        return typeof value === 'number' && threshold !== undefined && value <= threshold;
      case 'in':
        return values !== undefined && values.includes(String(value));
      default:
        return false;
    }
  }

  // 评估规则
  private evaluateRule(
    rule: FusionRule,
    visualData: Record<string, unknown>,
    audioData: Record<string, unknown>,
    faceData: Record<string, unknown>
  ): { matched: boolean; matchedModalities: number; confidence: number } {
    let matchedModalities = 0;
    let totalConfidence = 0;
    let conditionCount = 0;

    // 评估视觉条件
    if (rule.visualConditions.length > 0) {
      conditionCount++;
      const visualMatch = rule.visualConditions.every(cond => {
        const value = visualData?.[cond.behavior];
        return this.evaluateCondition(value, cond.operator, cond.threshold, cond.values);
      });
      if (visualMatch) {
        matchedModalities++;
        totalConfidence += visualData?.confidence || 0.5;
      }
    }

    // 评估音频条件
    if (rule.audioConditions.length > 0) {
      conditionCount++;
      const audioMatch = rule.audioConditions.every(cond => {
        const value = audioData?.[cond.emotion];
        return this.evaluateCondition(value, cond.operator, cond.threshold, cond.values);
      });
      if (audioMatch) {
        matchedModalities++;
        totalConfidence += audioData?.confidence || 0.5;
      }
    }

    // 评估面部条件
    if (rule.faceConditions.length > 0) {
      conditionCount++;
      const faceMatch = rule.faceConditions.every(cond => {
        const value = faceData?.[cond.expression];
        return this.evaluateCondition(value, cond.operator, cond.threshold, cond.values);
      });
      if (faceMatch) {
        matchedModalities++;
        totalConfidence += faceData?.confidence || 0.5;
      }
    }

    const averageConfidence = conditionCount > 0 ? totalConfidence / conditionCount : 0;

    return {
      matched: matchedModalities >= rule.minModalities,
      matchedModalities,
      confidence: averageConfidence
    };
  }

  // 执行三模融合
  async fuseModalities(
    petId: string,
    visualData?: Record<string, unknown>,
    audioData?: Record<string, unknown>,
    faceData?: Record<string, unknown>
  ): Promise<FusionEvent[]> {
    await this.simulateDelay(MOCK_DELAY);

    const events: FusionEvent[] = [];

    // 如果没有提供数据，从各服务获取最新数据
    if (!visualData) {
      const visualAlerts = await aiHealthAlertService.getAIBehaviorAlerts(petId);
      visualData = visualAlerts.length > 0 ? visualAlerts[0] : null;
    }

    if (!audioData) {
      const audioEvents = await audioRecognitionService.getAudioEvents(petId, 1);
      audioData = audioEvents.length > 0 ? audioEvents[0] : null;
    }

    if (!faceData) {
      const faceAnalyses = await faceExpressionService.getFaceAnalysisHistory(petId, 1);
      faceData = faceAnalyses.length > 0 ? faceAnalyses[0] : null;
    }

    // 按优先级排序规则
    const sortedRules = [...fusionRules].sort((a, b) => a.priority - b.priority);

    // 评估每条规则
    for (const rule of sortedRules) {
      const { matched, matchedModalities, confidence } = this.evaluateRule(
        rule, visualData, audioData, faceData
      );

      if (matched && confidence > 0.5) {
        const eventConfig = eventTypeConfig[rule.outputEvent];
        const event: FusionEvent = {
          id: `fusion-event-${Date.now()}-${rule.id}`,
          petId,
          type: rule.outputEvent,
          severity: rule.severity,
          confidence: Math.min(confidence, 0.99),
          timestamp: new Date().toISOString(),
          modalities: this.getModalityNames(matchedModalities),
          description: eventConfig.description,
          recommendation: eventConfig.recommendation,
          sourceRule: rule.id,
          acknowledged: false
        };

        events.push(event);
        this.fusionEvents.unshift(event);
        
        if (this.fusionEvents.length > 50) {
          this.fusionEvents.pop();
        }

        this.notifyEvent(event);
      }
    }

    return events;
  }

  // 获取模态名称
  private getModalityNames(count: number): string[] {
    const modalities = ['visual', 'audio', 'face'];
    return modalities.slice(0, count);
  }

  // 获取融合事件列表
  async getFusionEvents(petId: string, limit: number = 20): Promise<FusionEvent[]> {
    await this.simulateDelay(300);
    return this.fusionEvents.filter(e => e.petId === petId).slice(0, limit);
  }

  // 确认融合事件
  async acknowledgeEvent(eventId: string): Promise<boolean> {
    await this.simulateDelay(200);
    const event = this.fusionEvents.find(e => e.id === eventId);
    if (event) {
      event.acknowledged = true;
      event.acknowledgedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // 获取所有规则
  getFusionRules(): FusionRule[] {
    return [...fusionRules];
  }

  // 获取事件类型配置
  getEventTypeConfig(type: EventType) {
    return eventTypeConfig[type];
  }

  // 获取所有事件类型
  getEventTypes(): EventType[] {
    return Object.keys(eventTypeConfig) as EventType[];
  }

  // 获取严重程度配置
  getSeverityConfig() {
    return {
      info: { label: '信息', color: '#3B82F6', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
      warning: { label: '警告', color: '#F59E0B', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
      critical: { label: '紧急', color: '#EF4444', bgColor: 'bg-red-100', textColor: 'text-red-700' }
    };
  }

  // 事件订阅
  onFusionEvent(callback: (event: FusionEvent) => void) {
    this.eventCallbacks.push(callback);
  }

  private notifyEvent(event: FusionEvent) {
    this.eventCallbacks.forEach(cb => cb(event));
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const fusionEngineService = new FusionEngineService();