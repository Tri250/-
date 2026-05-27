// ============================================
// PawSync Pro 3.0 - Fusion Engine Types
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 三模融合引擎类型定义
// ============================================

// 严重程度类型
export type Severity = 'info' | 'warning' | 'critical';

// 事件类型
export type EventType = 
  | 'vomit_warning'
  | 'separation_anxiety'
  | 'skin_abnormality'
  | 'respiratory_issue'
  | 'digestive_issue'
  | 'hunger_signal'
  | 'dehydration_risk'
  | 'pain_indicator';

// 视觉条件
export interface VisualCondition {
  behavior: string;
  operator: '==' | '>' | '<' | '>=' | '<=' | 'in';
  threshold?: number;
  values?: string[];
}

// 音频条件
export interface AudioCondition {
  emotion: string;
  operator: '==' | '>' | '<' | '>=' | '<=' | 'in';
  threshold?: number;
  values?: string[];
}

// 面部条件
export interface FaceCondition {
  expression: string;
  operator: '==' | '>' | '<' | '>=' | '<=' | 'in';
  threshold?: number;
  values?: string[];
}

// 融合规则
export interface FusionRule {
  id: string;
  name: string;
  description: string;
  visualConditions: VisualCondition[];
  audioConditions: AudioCondition[];
  faceConditions: FaceCondition[];
  outputEvent: EventType;
  severity: Severity;
  minModalities: number;
  priority: number;
}

// 融合事件
export interface FusionEvent {
  id: string;
  petId: string;
  type: EventType;
  severity: Severity;
  confidence: number;
  timestamp: string;
  modalities: string[];
  description: string;
  recommendation: string;
  sourceRule: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

// 融合结果
export interface FusionResult {
  events: FusionEvent[];
  evaluatedRules: number;
  matchedRules: number;
  timestamp: string;
}

// 模态数据输入
export interface ModalityInput {
  visual?: any;
  audio?: any;
  face?: any;
}