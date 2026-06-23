import { databaseService, STORE_NAMES } from './databaseService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pawsync.com/v1';

// ─── 融合引擎类型定义 ────────────────────────────────────────

export interface ModalityInput {
  type: 'voice' | 'image' | 'behavior' | 'health' | 'environment';
  timestamp: string;
  data: Record<string, unknown>;
  confidence: number;
  source: string;
}

export interface FusionResult {
  id: string;
  petId: string;
  inputs: ModalityInput[];
  strategy: FusionStrategy;
  fusedAssessment: FusedAssessment;
  temporalAlignment: TemporalAlignmentResult;
  conflictResolution: ConflictResolutionResult;
  confidence: number;
  fusedAt: string;
}

export interface FusedAssessment {
  overallStatus: 'normal' | 'attention' | 'warning' | 'critical' | 'emergency';
  emotion: string;
  emotionConfidence: number;
  healthRisk: number;
  behaviorRisk: number;
  environmentalRisk: number;
  keyFindings: string[];
  recommendations: string[];
}

export interface TemporalAlignmentResult {
  alignedInputs: Array<{
    type: string;
    timestamp: string;
    alignedTimestamp: string;
    offset: number;
  }>;
  maxTimeOffset: number;
  isTimeAligned: boolean;
}

export interface ConflictResolutionResult {
  hasConflict: boolean;
  conflicts: Array<{
    modalities: string[];
    description: string;
    resolution: string;
    method: string;
  }>;
}

export type FusionStrategy = 'weighted_average' | 'bayesian' | 'dempster_shafer';

// ─── 模态权重配置 ────────────────────────────────────────────

const MODALITY_WEIGHTS: Record<string, number> = {
  health: 0.35,
  behavior: 0.25,
  voice: 0.15,
  image: 0.15,
  environment: 0.10,
};

// ─── Dempster-Shafer 证据理论实现 ─────────────────────────────

interface MassFunction {
  [hypothesis: string]: number;
}

function combineMassFunctions(m1: MassFunction, m2: MassFunction): MassFunction {
  const result: MassFunction = {};
  const allHypotheses = new Set([...Object.keys(m1), ...Object.keys(m2)]);

  // 计算冲突系数 K
  let K = 0;
  for (const h1 of Object.keys(m1)) {
    for (const h2 of Object.keys(m2)) {
      if (h1 !== h2 && h1 !== 'omega' && h2 !== 'omega') {
        K += m1[h1] * m2[h2];
      }
    }
  }

  const normalizer = 1 - K;

  // 组合
  for (const h of allHypotheses) {
    let mass = 0;

    if (h === 'omega') {
      // 不确定性
      mass = (m1['omega'] || 0) * (m2['omega'] || 0);
    } else {
      // 同一假设的自组合
      mass = (m1[h] || 0) * (m2[h] || 0);
      // 加上与不确定性的组合
      mass += (m1[h] || 0) * (m2['omega'] || 0);
      mass += (m1['omega'] || 0) * (m2[h] || 0);
    }

    result[h] = normalizer > 0 ? mass / normalizer : 0;
  }

  return result;
}

function inputToMassFunction(input: ModalityInput): MassFunction {
  const mf: MassFunction = {};
  const data = input.data;
  const confidence = input.confidence;

  // 根据输入类型构建质量函数
  switch (input.type) {
    case 'health': {
      const risk = (data.healthRisk as number) || 0;
      if (risk > 0.7) { mf['critical'] = confidence * 0.6; mf['warning'] = confidence * 0.2; }
      else if (risk > 0.4) { mf['warning'] = confidence * 0.5; mf['attention'] = confidence * 0.2; }
      else { mf['normal'] = confidence * 0.6; mf['attention'] = confidence * 0.1; }
      break;
    }
    case 'behavior': {
      const stress = (data.stress as number) || 0;
      const aggression = (data.aggression as number) || 0;
      if (aggression > 0.7) { mf['critical'] = confidence * 0.5; mf['warning'] = confidence * 0.3; }
      else if (stress > 0.7) { mf['warning'] = confidence * 0.5; mf['attention'] = confidence * 0.2; }
      else { mf['normal'] = confidence * 0.5; mf['attention'] = confidence * 0.15; }
      break;
    }
    case 'voice': {
      const emotion = (data.emotion as string) || 'calm';
      if (emotion === 'fearful' || emotion === 'angry') { mf['warning'] = confidence * 0.5; mf['attention'] = confidence * 0.3; }
      else if (emotion === 'anxious') { mf['attention'] = confidence * 0.5; mf['warning'] = confidence * 0.15; }
      else { mf['normal'] = confidence * 0.5; mf['attention'] = confidence * 0.1; }
      break;
    }
    case 'image': {
      const expression = (data.expression as string) || 'relaxed';
      if (expression === 'pain' || expression === 'fearful') { mf['warning'] = confidence * 0.5; mf['critical'] = confidence * 0.2; }
      else if (expression === 'anxious') { mf['attention'] = confidence * 0.5; mf['warning'] = confidence * 0.15; }
      else { mf['normal'] = confidence * 0.5; mf['attention'] = confidence * 0.1; }
      break;
    }
    case 'environment': {
      const temp = (data.temperature as number) || 22;
      if (temp > 35 || temp < 5) { mf['warning'] = confidence * 0.4; mf['attention'] = confidence * 0.3; }
      else { mf['normal'] = confidence * 0.5; mf['attention'] = confidence * 0.1; }
      break;
    }
  }

  // 不确定性质量
  const assignedMass = Object.values(mf).reduce((s, v) => s + v, 0);
  mf['omega'] = Math.max(0, 1 - assignedMass);

  return mf;
}

// ─── 贝叶斯推理实现 ──────────────────────────────────────────

interface BayesianPrior {
  [hypothesis: string]: number;
}

const DEFAULT_PRIOR: BayesianPrior = {
  normal: 0.6,
  attention: 0.2,
  warning: 0.12,
  critical: 0.06,
  emergency: 0.02,
};

// 似然函数：给定假设下观察到某输入的概率
function computeLikelihood(input: ModalityInput, hypothesis: string): number {
  const data = input.data;
  const confidence = input.confidence;

  switch (input.type) {
    case 'health': {
      const risk = (data.healthRisk as number) || 0;
      const likelihoods: Record<string, number> = {
        normal: Math.exp(-risk * 3),
        attention: Math.exp(-Math.abs(risk - 0.3) * 5),
        warning: Math.exp(-Math.abs(risk - 0.5) * 5),
        critical: Math.exp(-Math.abs(risk - 0.7) * 5),
        emergency: Math.exp(-Math.abs(risk - 0.9) * 5),
      };
      return (likelihoods[hypothesis] || 0.01) * confidence;
    }
    case 'behavior': {
      const stress = (data.stress as number) || 0;
      const likelihoods: Record<string, number> = {
        normal: Math.exp(-stress * 3),
        attention: Math.exp(-Math.abs(stress - 0.3) * 4),
        warning: Math.exp(-Math.abs(stress - 0.5) * 4),
        critical: Math.exp(-Math.abs(stress - 0.7) * 4),
        emergency: Math.exp(-Math.abs(stress - 0.9) * 4),
      };
      return (likelihoods[hypothesis] || 0.01) * confidence;
    }
    default: {
      // 简单似然：基于置信度
      const baseLikelihood = confidence * 0.5;
      return hypothesis === 'normal' ? baseLikelihood : baseLikelihood * 0.3;
    }
  }
}

function bayesianUpdate(prior: BayesianPrior, inputs: ModalityInput[]): BayesianPrior {
  let posterior = { ...prior };

  for (const input of inputs) {
    const newPosterior: BayesianPrior = {};
    let evidence = 0;

    // 计算证据（归一化因子）
    for (const [hypothesis, priorProb] of Object.entries(posterior)) {
      evidence += priorProb * computeLikelihood(input, hypothesis);
    }

    // 更新后验概率
    for (const [hypothesis, priorProb] of Object.entries(posterior)) {
      const likelihood = computeLikelihood(input, hypothesis);
      newPosterior[hypothesis] = evidence > 0 ? (priorProb * likelihood) / evidence : 0;
    }

    posterior = newPosterior;
  }

  return posterior;
}

// ─── 融合引擎服务 ────────────────────────────────────────────

export class FusionEngineService {
  // ─── 时序对齐 ──────────────────────────────────────────────

  alignTemporal(inputs: ModalityInput[], windowMs: number = 5000): TemporalAlignmentResult {
    if (inputs.length === 0) {
      return { alignedInputs: [], maxTimeOffset: 0, isTimeAligned: true };
    }

    // 找到时间中位数作为对齐基准
    const timestamps = inputs.map(i => new Date(i.timestamp).getTime());
    timestamps.sort((a, b) => a - b);
    const medianTime = timestamps[Math.floor(timestamps.length / 2)];

    const alignedInputs = inputs.map(input => {
      const inputTime = new Date(input.timestamp).getTime();
      const offset = inputTime - medianTime;
      return {
        type: input.type,
        timestamp: input.timestamp,
        alignedTimestamp: new Date(medianTime).toISOString(),
        offset,
      };
    });

    const maxOffset = Math.max(...alignedInputs.map(a => Math.abs(a.offset)));
    return {
      alignedInputs,
      maxTimeOffset: maxOffset,
      isTimeAligned: maxOffset <= windowMs,
    };
  }

  // ─── 加权平均融合 ──────────────────────────────────────────

  private fuseWeightedAverage(inputs: ModalityInput[]): {
    assessment: FusedAssessment;
    confidence: number;
  } {
    let totalWeight = 0;
    let healthRisk = 0;
    let behaviorRisk = 0;
    let environmentalRisk = 0;
    let emotionConfidence = 0;
    const emotionCounts: Record<string, number> = {};
    const keyFindings: string[] = [];

    for (const input of inputs) {
      const weight = MODALITY_WEIGHTS[input.type] || 0.1;
      const effectiveWeight = weight * input.confidence;
      totalWeight += effectiveWeight;

      const data = input.data;

      // 累积风险分数
      healthRisk += (typeof data.healthRisk === 'number' ? data.healthRisk : 0) * effectiveWeight;
      behaviorRisk += (typeof data.behaviorRisk === 'number' ? data.behaviorRisk : 0) * effectiveWeight;
      environmentalRisk += (typeof data.environmentalRisk === 'number' ? data.environmentalRisk : 0) * effectiveWeight;

      // 情绪统计
      const emotion = (data.emotion as string) || 'unknown';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + effectiveWeight;

      // 关键发现
      if (data.findings && Array.isArray(data.findings)) {
        keyFindings.push(...(data.findings as string[]));
      }
    }

    if (totalWeight > 0) {
      healthRisk /= totalWeight;
      behaviorRisk /= totalWeight;
      environmentalRisk /= totalWeight;
    }

    // 确定主导情绪
    const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
    emotionConfidence = (emotionCounts[dominantEmotion] || 0) / (totalWeight || 1);

    // 确定整体状态
    const maxRisk = Math.max(healthRisk, behaviorRisk, environmentalRisk);
    let overallStatus: FusedAssessment['overallStatus'];
    if (maxRisk >= 0.8) overallStatus = 'emergency';
    else if (maxRisk >= 0.6) overallStatus = 'critical';
    else if (maxRisk >= 0.4) overallStatus = 'warning';
    else if (maxRisk >= 0.2) overallStatus = 'attention';
    else overallStatus = 'normal';

    const recommendations = this.generateRecommendations(overallStatus, healthRisk, behaviorRisk, environmentalRisk);

    return {
      assessment: {
        overallStatus,
        emotion: dominantEmotion,
        emotionConfidence,
        healthRisk,
        behaviorRisk,
        environmentalRisk,
        keyFindings: [...new Set(keyFindings)],
        recommendations,
      },
      confidence: totalWeight > 0 ? Math.min(totalWeight, 1) : 0,
    };
  }

  // ─── 贝叶斯推理融合 ────────────────────────────────────────

  private fuseBayesian(inputs: ModalityInput[]): {
    assessment: FusedAssessment;
    confidence: number;
  } {
    const posterior = bayesianUpdate(DEFAULT_PRIOR, inputs);

    // 找到最大后验概率假设
    const maxPosterior = Object.entries(posterior).sort((a, b) => b[1] - a[1])[0];
    const overallStatus = maxPosterior ? maxPosterior[0] as FusedAssessment['overallStatus'] : 'normal';
    const confidence = maxPosterior ? maxPosterior[1] : 0;

    // 从各输入提取信息
    let healthRisk = 0;
    let behaviorRisk = 0;
    let environmentalRisk = 0;
    const emotionCounts: Record<string, number> = {};
    const keyFindings: string[] = [];

    for (const input of inputs) {
      const data = input.data;
      healthRisk += (typeof data.healthRisk === 'number' ? data.healthRisk : 0) * input.confidence;
      behaviorRisk += (typeof data.behaviorRisk === 'number' ? data.behaviorRisk : 0) * input.confidence;
      environmentalRisk += (typeof data.environmentalRisk === 'number' ? data.environmentalRisk : 0) * input.confidence;
      const emotion = (data.emotion as string) || 'unknown';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + input.confidence;
      if (data.findings && Array.isArray(data.findings)) keyFindings.push(...(data.findings as string[]));
    }

    const n = inputs.length || 1;
    healthRisk /= n;
    behaviorRisk /= n;
    environmentalRisk /= n;

    const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    const recommendations = this.generateRecommendations(overallStatus, healthRisk, behaviorRisk, environmentalRisk);

    return {
      assessment: {
        overallStatus,
        emotion: dominantEmotion,
        emotionConfidence: confidence,
        healthRisk,
        behaviorRisk,
        environmentalRisk,
        keyFindings: [...new Set(keyFindings)],
        recommendations,
      },
      confidence,
    };
  }

  // ─── Dempster-Shafer 证据理论融合 ──────────────────────────

  private fuseDempsterShafer(inputs: ModalityInput[]): {
    assessment: FusedAssessment;
    confidence: number;
  } {
    if (inputs.length === 0) {
      return {
        assessment: {
          overallStatus: 'normal', emotion: 'unknown', emotionConfidence: 0,
          healthRisk: 0, behaviorRisk: 0, environmentalRisk: 0,
          keyFindings: [], recommendations: [],
        },
        confidence: 0,
      };
    }

    // 将每个输入转换为质量函数
    const massFunctions = inputs.map(inputToMassFunction);

    // 逐步组合所有质量函数
    let combined = massFunctions[0];
    for (let i = 1; i < massFunctions.length; i++) {
      combined = combineMassFunctions(combined, massFunctions[i]);
    }

    // 找到最大质量假设
    const hypotheses = Object.entries(combined).filter(([h]) => h !== 'omega');
    hypotheses.sort((a, b) => b[1] - a[1]);

    const bestHypothesis = hypotheses[0]?.[0] || 'normal';
    const bestMass = hypotheses[0]?.[1] || 0;
    const uncertainty = combined['omega'] || 0;

    // 映射到状态
    const statusMap: Record<string, FusedAssessment['overallStatus']> = {
      normal: 'normal',
      attention: 'attention',
      warning: 'warning',
      critical: 'critical',
      emergency: 'emergency',
    };

    const overallStatus = statusMap[bestHypothesis] || 'normal';
    const confidence = bestMass * (1 - uncertainty);

    // 从输入提取其他信息
    let healthRisk = 0;
    let behaviorRisk = 0;
    let environmentalRisk = 0;
    const emotionCounts: Record<string, number> = {};
    const keyFindings: string[] = [];

    for (const input of inputs) {
      const data = input.data;
      healthRisk += (typeof data.healthRisk === 'number' ? data.healthRisk : 0) * input.confidence;
      behaviorRisk += (typeof data.behaviorRisk === 'number' ? data.behaviorRisk : 0) * input.confidence;
      environmentalRisk += (typeof data.environmentalRisk === 'number' ? data.environmentalRisk : 0) * input.confidence;
      const emotion = (data.emotion as string) || 'unknown';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + input.confidence;
      if (data.findings && Array.isArray(data.findings)) keyFindings.push(...(data.findings as string[]));
    }

    const n = inputs.length || 1;
    healthRisk /= n;
    behaviorRisk /= n;
    environmentalRisk /= n;

    const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    const recommendations = this.generateRecommendations(overallStatus, healthRisk, behaviorRisk, environmentalRisk);

    return {
      assessment: {
        overallStatus,
        emotion: dominantEmotion,
        emotionConfidence: confidence,
        healthRisk,
        behaviorRisk,
        environmentalRisk,
        keyFindings: [...new Set(keyFindings)],
        recommendations,
      },
      confidence,
    };
  }

  // ─── 冲突检测与解决 ────────────────────────────────────────

  private detectAndResolveConflicts(inputs: ModalityInput[]): ConflictResolutionResult {
    const conflicts: ConflictResolutionResult['conflicts'] = [];

    // 检查不同模态间的矛盾
    for (let i = 0; i < inputs.length; i++) {
      for (let j = i + 1; j < inputs.length; j++) {
        const a = inputs[i];
        const b = inputs[j];

        // 情绪冲突检测
        const emotionA = (a.data.emotion as string) || '';
        const emotionB = (b.data.emotion as string) || '';

        const conflictPairs: Array<[string, string, string]> = [
          ['happy', 'fearful', '情绪判断矛盾：开心 vs 恐惧'],
          ['happy', 'angry', '情绪判断矛盾：开心 vs 愤怒'],
          ['calm', 'anxious', '情绪判断矛盾：平静 vs 焦虑'],
          ['relaxed', 'aggressive', '情绪判断矛盾：放松 vs 攻击性'],
        ];

        for (const [e1, e2, desc] of conflictPairs) {
          if ((emotionA === e1 && emotionB === e2) || (emotionA === e2 && emotionB === e1)) {
            // 解决策略：选择置信度更高的
            const resolution = a.confidence >= b.confidence
              ? `采用${a.type}模态结果（置信度${(a.confidence * 100).toFixed(0)}% > ${(b.confidence * 100).toFixed(0)}%）`
              : `采用${b.type}模态结果（置信度${(b.confidence * 100).toFixed(0)}% > ${(a.confidence * 100).toFixed(0)}%）`;

            conflicts.push({
              modalities: [a.type, b.type],
              description: desc,
              resolution,
              method: 'confidence_comparison',
            });
          }
        }

        // 风险评估冲突
        const riskA = (a.data.healthRisk as number) || 0;
        const riskB = (b.data.healthRisk as number) || 0;
        if (Math.abs(riskA - riskB) > 0.5) {
          conflicts.push({
            modalities: [a.type, b.type],
            description: `健康风险评估差异大：${a.type}=${(riskA * 100).toFixed(0)}% vs ${b.type}=${(riskB * 100).toFixed(0)}%`,
            resolution: '采用加权平均，高置信度模态权重更大',
            method: 'weighted_average',
          });
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  // ─── 推荐生成 ──────────────────────────────────────────────

  private generateRecommendations(
    status: FusedAssessment['overallStatus'],
    healthRisk: number,
    behaviorRisk: number,
    environmentalRisk: number,
  ): string[] {
    const recommendations: string[] = [];

    if (status === 'emergency') {
      recommendations.push('🆘 紧急情况！请立即联系宠物医院');
      recommendations.push('保持宠物安静，尽快送医');
    } else if (status === 'critical') {
      recommendations.push('🚨 严重状况，建议2小时内就医');
      recommendations.push('密切观察症状变化');
    } else if (status === 'warning') {
      recommendations.push('⚠️ 需要关注，建议6小时内检查');
    } else if (status === 'attention') {
      recommendations.push('💡 建议持续观察，如有加重及时就医');
    }

    if (healthRisk > 0.5) recommendations.push('健康风险较高，建议进行体检');
    if (behaviorRisk > 0.5) recommendations.push('行为异常明显，建议咨询行为专家');
    if (environmentalRisk > 0.5) recommendations.push('环境因素可能影响宠物状态，建议改善环境');

    return recommendations;
  }

  // ─── 主融合方法 ────────────────────────────────────────────

  async fuse(
    inputs: ModalityInput[],
    petId: string,
    strategy: FusionStrategy = 'dempster_shafer',
  ): Promise<FusionResult> {
    const id = `fusion-${Date.now()}`;

    // 1. 时序对齐
    const temporalAlignment = this.alignTemporal(inputs);

    // 2. 冲突检测
    const conflictResolution = this.detectAndResolveConflicts(inputs);

    // 3. 选择融合策略
    let fusedResult: { assessment: FusedAssessment; confidence: number };

    switch (strategy) {
      case 'weighted_average':
        fusedResult = this.fuseWeightedAverage(inputs);
        break;
      case 'bayesian':
        fusedResult = this.fuseBayesian(inputs);
        break;
      case 'dempster_shafer':
      default:
        fusedResult = this.fuseDempsterShafer(inputs);
        break;
    }

    const result: FusionResult = {
      id,
      petId,
      inputs,
      strategy,
      fusedAssessment: fusedResult.assessment,
      temporalAlignment,
      conflictResolution,
      confidence: fusedResult.confidence,
      fusedAt: new Date().toISOString(),
    };

    // 持久化到 databaseService
    await databaseService.put(STORE_NAMES.FUSION_RESULTS, {
      ...result,
      source: 'fusion_engine',
    });

    return result;
  }

  // ─── 自动选择最佳融合策略 ──────────────────────────────────

  async autoFuse(inputs: ModalityInput[], petId: string): Promise<FusionResult> {
    // 根据输入特征自动选择策略
    let strategy: FusionStrategy;

    if (inputs.length <= 2) {
      // 输入少时用加权平均
      strategy = 'weighted_average';
    } else if (inputs.some(i => i.confidence < 0.5)) {
      // 有低置信度输入时用贝叶斯（可以更好地处理不确定性）
      strategy = 'bayesian';
    } else {
      // 默认用 Dempster-Shafer（处理多源证据融合最佳）
      strategy = 'dempster_shafer';
    }

    return this.fuse(inputs, petId, strategy);
  }

  // ─── 历史记录 ──────────────────────────────────────────────

  async getFusionHistory(petId: string, limit: number = 20): Promise<FusionResult[]> {
    try {
      const records = await databaseService.getByIndex<FusionResult & { source: string }>(
        STORE_NAMES.FUSION_RESULTS,
        'petId',
        petId,
      );
      return records
        .filter(r => r.source === 'fusion_engine')
        .sort((a, b) => new Date(b.fusedAt).getTime() - new Date(a.fusedAt).getTime())
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  // ─── 获取可用策略 ──────────────────────────────────────────

  getAvailableStrategies(): Array<{ id: FusionStrategy; name: string; description: string }> {
    return [
      { id: 'weighted_average', name: '加权平均', description: '根据各模态权重和置信度进行加权平均，适合输入较少的场景' },
      { id: 'bayesian', name: '贝叶斯推理', description: '基于贝叶斯定理进行概率更新，适合处理不确定性和先验知识' },
      { id: 'dempster_shafer', name: 'Dempster-Shafer证据理论', description: '处理多源证据融合的最佳方法，能有效处理冲突和不确定性' },
    ];
  }
}

export const fusionEngineService = new FusionEngineService();
