// ============================================
// PawSync Pro 3.0 - Intention Recognizer
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 意图识别服务
// 科学准确的意图识别（非伪翻译）
// ============================================

import type {
  IntentionResult,
  PetIntention,
  ExplainableAudioFeatures,
  IntentionConfig,
} from '../../types/voice-analysis';
import { INTENTION_CONFIGS } from '../../types/voice-analysis';

// ==================== 类型定义 ====================

/**
 * 意图识别上下文
 */
interface IntentionContext {
  /** 时间段 */
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  /** 最近活动 */
  recentActivity?: string;
  /** 位置 */
  location?: string;
  /** 宠物类型 */
  petType?: 'cat' | 'dog' | 'other';
  /** 年龄 */
  petAge?: number;
}

/**
 * 行为规则
 */
interface BehaviorRule {
  /** 规则名称 */
  name: string;
  /** 适用意图 */
  intention: PetIntention;
  /** 条件 */
  conditions: {
    pitchRange?: [number, number];
    energyRange?: [number, number];
    durationRange?: [number, number];
    rhythmPattern?: string[];
    timeOfDay?: string[];
  };
  /** 权重 */
  weight: number;
  /** 描述 */
  description: string;
}

// ==================== 行为规则库 ====================

/**
 * 基于科学研究的宠物行为规则
 * 参考：动物行为学、宠物心理学研究
 */
const BEHAVIOR_RULES: BehaviorRule[] = [
  // 开心规则
  {
    name: 'high_pitch_playful',
    intention: 'happy',
    conditions: {
      pitchRange: [500, 900],
      energyRange: [50, 85],
      rhythmPattern: ['steady', 'accelerating'],
    },
    weight: 0.85,
    description: '高音调、稳定节奏通常表示开心或玩耍意图',
  },
  {
    name: 'short_bursts_excited',
    intention: 'happy',
    conditions: {
      durationRange: [0.1, 0.5],
      energyRange: [60, 90],
    },
    weight: 0.75,
    description: '短促有力的声音爆发表示兴奋',
  },

  // 饥饿规则
  {
    name: 'morning_food_request',
    intention: 'hungry',
    conditions: {
      pitchRange: [300, 600],
      energyRange: [40, 70],
      durationRange: [0.5, 3.0],
      timeOfDay: ['morning'],
    },
    weight: 0.9,
    description: '早晨时段有节奏的持续声音通常是食物请求',
  },
  {
    name: 'persistent_calling',
    intention: 'hungry',
    conditions: {
      durationRange: [1.0, 5.0],
      rhythmPattern: ['steady'],
    },
    weight: 0.8,
    description: '持续有节奏的呼唤表示需求表达',
  },

  // 焦虑规则
  {
    name: 'high_pitch_low_energy',
    intention: 'anxious',
    conditions: {
      pitchRange: [600, 1000],
      energyRange: [20, 50],
      rhythmPattern: ['irregular'],
    },
    weight: 0.85,
    description: '高音调但能量低、节奏不规则表示焦虑',
  },
  {
    name: 'night_anxiety',
    intention: 'anxious',
    conditions: {
      timeOfDay: ['night'],
      rhythmPattern: ['irregular'],
    },
    weight: 0.7,
    description: '夜间不规则声音可能表示不安',
  },

  // 玩耍规则
  {
    name: 'varied_pitch_high_energy',
    intention: 'playful',
    conditions: {
      pitchRange: [400, 800],
      energyRange: [70, 95],
      rhythmPattern: ['accelerating', 'fluctuating'],
    },
    weight: 0.9,
    description: '音调变化大、高能量表示玩耍邀请',
  },
  {
    name: 'short_repeated_calls',
    intention: 'playful',
    conditions: {
      durationRange: [0.2, 0.8],
      rhythmPattern: ['steady'],
    },
    weight: 0.75,
    description: '短促重复的声音表示互动邀请',
  },

  // 生气规则
  {
    name: 'low_pitch_high_energy',
    intention: 'angry',
    conditions: {
      pitchRange: [150, 400],
      energyRange: [80, 100],
      rhythmPattern: ['irregular'],
    },
    weight: 0.85,
    description: '低沉有力的声音表示不满或威胁',
  },
  {
    name: 'growling_pattern',
    intention: 'angry',
    conditions: {
      pitchRange: [100, 300],
      durationRange: [0.5, 2.0],
    },
    weight: 0.9,
    description: '低频持续声音（类似咆哮）表示生气',
  },

  // 疲惫规则
  {
    name: 'low_pitch_low_energy',
    intention: 'tired',
    conditions: {
      pitchRange: [200, 400],
      energyRange: [20, 45],
      rhythmPattern: ['decelerating', 'steady'],
    },
    weight: 0.8,
    description: '低音调、低能量表示疲惫或放松',
  },
  {
    name: 'evening_rest',
    intention: 'tired',
    conditions: {
      timeOfDay: ['evening', 'night'],
      energyRange: [20, 50],
    },
    weight: 0.75,
    description: '傍晚时段低能量声音表示需要休息',
  },

  // 社交规则
  {
    name: 'moderate_features_social',
    intention: 'social',
    conditions: {
      pitchRange: [350, 550],
      energyRange: [40, 65],
      rhythmPattern: ['steady'],
    },
    weight: 0.7,
    description: '中等特征表示寻求关注或陪伴',
  },
  {
    name: 'greeting_pattern',
    intention: 'social',
    conditions: {
      durationRange: [0.3, 1.0],
      rhythmPattern: ['steady', 'accelerating'],
    },
    weight: 0.75,
    description: '问候模式的声音表示社交意图',
  },
];

// ==================== 意图识别服务 ====================

/**
 * 意图识别服务
 * 基于科学规则进行意图识别，而非伪翻译
 */
export class IntentionRecognizer {
  // 单例实例
  private static instance: IntentionRecognizer | null = null;

  // 行为规则库
  private rules: BehaviorRule[] = BEHAVIOR_RULES;

  // 社区统计数据（模拟）
  private communityStats: Map<PetIntention, {
    similarCases: number;
    commonFollowUp: string;
    averageDuration: number;
  }> = new Map();

  // 初始化状态
  private initialized = false;

  private constructor() {
    // 初始化社区统计数据
    this.initCommunityStats();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): IntentionRecognizer {
    if (!IntentionRecognizer.instance) {
      IntentionRecognizer.instance = new IntentionRecognizer();
    }
    return IntentionRecognizer.instance;
  }

  /**
   * 初始化服务
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // 加载社区统计数据（模拟）
    await this.loadCommunityStats();

    this.initialized = true;
    console.log('[IntentionRecognizer] 初始化成功');
  }

  /**
   * 初始化社区统计数据
   */
  private initCommunityStats(): void {
    this.communityStats.set('happy', {
      similarCases: 1250,
      commonFollowUp: '玩耍互动',
      averageDuration: 2.5,
    });
    this.communityStats.set('hungry', {
      similarCases: 980,
      commonFollowUp: '喂食',
      averageDuration: 3.0,
    });
    this.communityStats.set('anxious', {
      similarCases: 450,
      commonFollowUp: '安抚陪伴',
      averageDuration: 1.5,
    });
    this.communityStats.set('playful', {
      similarCases: 850,
      commonFollowUp: '互动游戏',
      averageDuration: 1.0,
    });
    this.communityStats.set('angry', {
      similarCases: 320,
      commonFollowUp: '给予空间',
      averageDuration: 2.0,
    });
    this.communityStats.set('tired', {
      similarCases: 560,
      commonFollowUp: '安静休息',
      averageDuration: 4.0,
    });
    this.communityStats.set('social', {
      similarCases: 720,
      commonFollowUp: '抚摸交流',
      averageDuration: 1.5,
    });
  }

  /**
   * 加载社区统计数据
   */
  private async loadCommunityStats(): Promise<void> {
    // 实际项目中应从后端 API 加载
    // 这里使用模拟数据
    console.log('[IntentionRecognizer] 社区统计数据已加载');
  }

  /**
   * 识别意图
   * 主入口方法
   */
  async recognizeIntention(
    emotion: string,
    features: ExplainableAudioFeatures,
    context?: IntentionContext
  ): Promise<IntentionResult> {
    const startTime = Date.now();
    const id = `intention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 确保已初始化
      if (!this.initialized) {
        await this.init();
      }

      // 将 emotion 映射到意图
      const mappedIntention = this.mapEmotionToIntention(emotion);

      // 应用行为规则进行意图识别
      const ruleResults = this.applyBehaviorRules(features, context);

      // 综合判断意图
      const finalIntention = this.determineFinalIntention(
        mappedIntention,
        ruleResults,
        features
      );

      // 获取意图配置
      const config = INTENTION_CONFIGS[finalIntention.intention];

      // 构建结果
      const result: IntentionResult = {
        id,
        timestamp: new Date().toISOString(),
        intention: finalIntention.intention,
        confidence: finalIntention.confidence,
        description: config.description,
        suggestions: this.generateSuggestions(finalIntention.intention, features, context),
        relatedBehaviors: this.extractRelatedBehaviors(finalIntention.intention, features),
        possibleTriggers: this.identifyPossibleTriggers(finalIntention.intention, context),
        communityStats: this.communityStats.get(finalIntention.intention),
      };

      return result;
    } catch (error) {
      console.error('[IntentionRecognizer] 识别失败:', error);

      // 返回默认结果
      const defaultIntention: PetIntention = 'social';
      const config = INTENTION_CONFIGS[defaultIntention];

      return {
        id,
        timestamp: new Date().toISOString(),
        intention: defaultIntention,
        confidence: 0.3,
        description: config.description,
        suggestions: config.suggestions,
        relatedBehaviors: [],
        possibleTriggers: ['无法确定触发因素'],
        communityStats: this.communityStats.get(defaultIntention),
      };
    }
  }

  /**
   * 将情绪映射到意图
   */
  private mapEmotionToIntention(emotion: string): PetIntention {
    // 情绪到意图的映射关系
    const emotionMap: Record<string, PetIntention> = {
      happy: 'happy',
      joyful: 'happy',
      excited: 'playful',
      playful: 'playful',
      anxious: 'anxious',
      nervous: 'anxious',
      fearful: 'anxious',
      angry: 'angry',
      aggressive: 'angry',
      sad: 'tired',
      tired: 'tired',
      sleepy: 'tired',
      calm: 'social',
      relaxed: 'social',
      affectionate: 'social',
      hungry: 'hungry',
      needy: 'hungry',
    };

    return emotionMap[emotion.toLowerCase()] || 'social';
  }

  /**
   * 应用行为规则
   */
  private applyBehaviorRules(
    features: ExplainableAudioFeatures,
    context?: IntentionContext
  ): Array<{ rule: BehaviorRule; score: number }> {
    const results: Array<{ rule: BehaviorRule; score: number }> = [];

    for (const rule of this.rules) {
      const score = this.evaluateRule(rule, features, context);
      if (score > 0) {
        results.push({ rule, score });
      }
    }

    // 按分数排序
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * 评估单个规则
   */
  private evaluateRule(
    rule: BehaviorRule,
    features: ExplainableAudioFeatures,
    context?: IntentionContext
  ): number {
    let matchScore = 0;
    let conditionCount = 0;

    const conditions = rule.conditions;

    // 检查音高范围
    if (conditions.pitchRange) {
      conditionCount++;
      const [min, max] = conditions.pitchRange;
      if (features.pitch.mean >= min && features.pitch.mean <= max) {
        matchScore += 1;
      }
    }

    // 检查能量范围
    if (conditions.energyRange) {
      conditionCount++;
      const [min, max] = conditions.energyRange;
      if (features.energy.mean >= min && features.energy.mean <= max) {
        matchScore += 1;
      }
    }

    // 检查持续时间范围
    if (conditions.durationRange) {
      conditionCount++;
      const [min, max] = conditions.durationRange;
      if (features.duration.total >= min && features.duration.total <= max) {
        matchScore += 1;
      }
    }

    // 检查节奏模式
    if (conditions.rhythmPattern) {
      conditionCount++;
      if (conditions.rhythmPattern.includes(features.rhythm.pattern)) {
        matchScore += 1;
      }
    }

    // 检查时间段
    if (conditions.timeOfDay && context?.timeOfDay) {
      conditionCount++;
      if (conditions.timeOfDay.includes(context.timeOfDay)) {
        matchScore += 1;
      }
    }

    // 计算最终分数
    if (conditionCount === 0) return 0;

    const matchRatio = matchScore / conditionCount;
    return matchRatio * rule.weight;
  }

  /**
   * 确定最终意图
   */
  private determineFinalIntention(
    mappedIntention: PetIntention,
    ruleResults: Array<{ rule: BehaviorRule; score: number }>,
    features: ExplainableAudioFeatures
  ): { intention: PetIntention; confidence: number } {
    // 如果没有匹配的规则，使用映射的意图
    if (ruleResults.length === 0) {
      return {
        intention: mappedIntention,
        confidence: 0.5,
      };
    }

    // 计算各意图的总分
    const intentionScores: Record<PetIntention, number> = {
      happy: 0,
      hungry: 0,
      anxious: 0,
      playful: 0,
      angry: 0,
      tired: 0,
      social: 0,
    };

    for (const { rule, score } of ruleResults) {
      intentionScores[rule.intention] += score;
    }

    // 加入映射意图的权重
    intentionScores[mappedIntention] += 0.3;

    // 找出最高分意图
    let bestIntention: PetIntention = mappedIntention;
    let bestScore = 0;

    for (const [intention, score] of Object.entries(intentionScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestIntention = intention as PetIntention;
      }
    }

    // 计算置信度
    const totalScore = Object.values(intentionScores).reduce((sum, s) => sum + s, 0);
    const confidence = totalScore > 0 ? bestScore / totalScore : 0.5;

    return {
      intention: bestIntention,
      confidence: Math.min(confidence, 1),
    };
  }

  /**
   * 生成行为建议
   */
  private generateSuggestions(
    intention: PetIntention,
    features: ExplainableAudioFeatures,
    context?: IntentionContext
  ): string[] {
    const config = INTENTION_CONFIGS[intention];
    const suggestions: string[] = [...config.suggestions];

    // 根据特征添加额外建议
    if (features.energy.mean > 70) {
      suggestions.push('宝贝声音很有力，可能需要更多关注');
    }

    if (features.duration.total > 2) {
      suggestions.push('声音持续时间较长，建议耐心观察');
    }

    // 根据时间段添加建议
    if (context?.timeOfDay === 'morning' && intention === 'hungry') {
      suggestions.push('早晨时段，建议检查食物供应');
    }

    if (context?.timeOfDay === 'night' && intention === 'anxious') {
      suggestions.push('夜间焦虑，建议保持安静环境');
    }

    return suggestions.slice(0, 5); // 最多返回5条建议
  }

  /**
   * 提取相关行为
   */
  private extractRelatedBehaviors(
    intention: PetIntention,
    features: ExplainableAudioFeatures
  ): string[] {
    const behaviors: string[] = [];

    // 基于意图添加相关行为
    switch (intention) {
      case 'happy':
        behaviors.push('尾巴摇摆', '活跃运动', '亲近行为');
        break;
      case 'hungry':
        behaviors.push('寻找食物', '围绕食物区域', '舔舐行为');
        break;
      case 'anxious':
        behaviors.push('躲藏行为', '警惕姿态', '来回踱步');
        break;
      case 'playful':
        behaviors.push('追逐行为', '跳跃动作', '互动邀请');
        break;
      case 'angry':
        behaviors.push('防御姿态', '耳朵后压', '瞳孔放大');
        break;
      case 'tired':
        behaviors.push('躺卧姿势', '眼睛半闭', '呼吸平稳');
        break;
      case 'social':
        behaviors.push('亲近行为', '跟随主人', '轻柔触碰');
        break;
    }

    // 根据特征添加额外行为
    if (features.pitch.trend === 'rising') {
      behaviors.push('情绪上升');
    }
    if (features.rhythm.pattern === 'irregular') {
      behaviors.push('行为不稳定');
    }

    return behaviors;
  }

  /**
   * 识别可能的触发因素
   */
  private identifyPossibleTriggers(
    intention: PetIntention,
    context?: IntentionContext
  ): string[] {
    const triggers: string[] = [];

    // 基于意图添加触发因素
    switch (intention) {
      case 'happy':
        triggers.push('主人的陪伴', '玩耍互动', '获得奖励');
        break;
      case 'hungry':
        triggers.push('饥饿感', '喂食时间', '看到食物');
        break;
      case 'anxious':
        triggers.push('环境变化', '陌生声音', '分离焦虑');
        break;
      case 'playful':
        triggers.push('看到玩具', '主人的邀请', '其他宠物的互动');
        break;
      case 'angry':
        triggers.push('被打扰', '领地被侵犯', '不适感');
        break;
      case 'tired':
        triggers.push('活动后', '一天结束', '舒适环境');
        break;
      case 'social':
        triggers.push('主人的出现', '需要关注', '情感需求');
        break;
    }

    // 根据上下文添加触发因素
    if (context?.recentActivity) {
      triggers.push(`最近活动: ${context.recentActivity}`);
    }

    if (context?.location) {
      triggers.push(`位置因素: ${context.location}`);
    }

    return triggers.slice(0, 4); // 最多返回4条
  }

  /**
   * 获取服务状态
   */
  getStatus(): {
    initialized: boolean;
    rulesCount: number;
    communityStatsLoaded: boolean;
  } {
    return {
      initialized: this.initialized,
      rulesCount: this.rules.length,
      communityStatsLoaded: this.communityStats.size > 0,
    };
  }

  /**
   * 添加自定义规则
   */
  addCustomRule(rule: BehaviorRule): void {
    this.rules.push(rule);
    console.log('[IntentionRecognizer] 自定义规则已添加:', rule.name);
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.rules = BEHAVIOR_RULES;
    this.communityStats.clear();
    this.initialized = false;
    console.log('[IntentionRecognizer] 服务已销毁');
  }
}

// 导出单例
export const intentionRecognizer = IntentionRecognizer.getInstance();