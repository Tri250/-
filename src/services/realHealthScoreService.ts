// ============================================
// PawSync Pro 3.0 - Real Health Score Service
//
// 真实健康评分服务 - 基于真实健康数据计算
// 5维健康评分体系
// ============================================

import { healthRecordsApi, petsApi } from '../lib/api';
import { emotionService } from './emotionService';

export interface HealthMetrics {
  activity: number;
  diet: number;
  sleep: number;
  mental: number;
  medical: number;
}

export interface HealthScoreResult {
  score: number;
  metrics: HealthMetrics;
  lastCheckDate: string;
  trend: 'up' | 'down' | 'stable';
  suggestions: string[];
  details: {
    activityDetails: string;
    dietDetails: string;
    sleepDetails: string;
    mentalDetails: string;
    medicalDetails: string;
  };
}

class RealHealthScoreService {
  private cache: Map<string, { result: HealthScoreResult; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存

  // 获取真实健康评分
  async getHealthScore(petId: string, forceRefresh = false): Promise<HealthScoreResult> {
    // 检查缓存
    const cached = this.cache.get(petId);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }

    try {
      // 获取真实数据
      const [recordsResponse, petResponse, emotionAnalyses] = await Promise.all([
        healthRecordsApi.getAll({ petId }),
        petsApi.getById(petId),
        emotionService.getRecentAnalyses(30)
      ]);

      const records = recordsResponse.records || [];
      const pet = petResponse.pet;

      // 计算各项指标
      const metrics = await this.calculateMetrics(records, emotionAnalyses, pet);
      
      // 计算总分
      const score = this.calculateOverallScore(metrics);
      
      // 计算趋势
      const trend = this.calculateTrend(records);
      
      // 生成建议
      const suggestions = this.generateSuggestions(metrics, records);
      
      // 生成详细说明
      const details = this.generateDetails(metrics);

      const result: HealthScoreResult = {
        score,
        metrics,
        lastCheckDate: records[0]?.createdAt || new Date().toISOString(),
        trend,
        suggestions,
        details
      };

      // 更新缓存
      this.cache.set(petId, { result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error('Failed to calculate health score:', error);
      return this.getDefaultScore();
    }
  }

  // 计算各项健康指标
  private async calculateMetrics(
    records: Array<{
      type: string;
      tags: string[];
      createdAt: string;
      isImportant: boolean;
    }>,
    emotionAnalyses: Array<{
      primaryEmotion: string;
      confidence: number;
      createdAt: string;
    }>,
    pet: { weight?: number; birthday?: string }
  ): Promise<HealthMetrics> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 过滤近期记录
    const recentRecords = records.filter(r => new Date(r.createdAt) > thirtyDaysAgo);
    const weeklyRecords = records.filter(r => new Date(r.createdAt) > sevenDaysAgo);

    // 1. 运动指标 (activity)
    const activityScore = this.calculateActivityScore(recentRecords, weeklyRecords);

    // 2. 饮食指标 (diet)
    const dietScore = this.calculateDietScore(recentRecords);

    // 3. 睡眠指标 (sleep)
    const sleepScore = this.calculateSleepScore(recentRecords);

    // 4. 心理指标 (mental) - 基于情绪分析
    const mentalScore = this.calculateMentalScore(emotionAnalyses);

    // 5. 医疗指标 (medical)
    const medicalScore = this.calculateMedicalScore(records, pet);

    return {
      activity: activityScore,
      diet: dietScore,
      sleep: sleepScore,
      mental: mentalScore,
      medical: medicalScore
    };
  }

  // 计算运动指标
  private calculateActivityScore(
    recentRecords: Array<{ tags: string[]; createdAt: string }>,
    weeklyRecords: Array<{ tags: string[]; createdAt: string }>
  ): number {
    let score = 70; // 基础分

    // 统计运动相关记录
    const activityRecords = recentRecords.filter(r => 
      r.tags.some(tag => ['运动', '散步', '玩耍', '跑步', '活跃'].includes(tag))
    );

    // 基于记录频率评分
    if (activityRecords.length >= 20) {
      score += 20;
    } else if (activityRecords.length >= 10) {
      score += 15;
    } else if (activityRecords.length >= 5) {
      score += 10;
    } else if (activityRecords.length === 0) {
      score -= 10;
    }

    // 本周活跃度
    const weeklyActivity = weeklyRecords.filter(r => 
      r.tags.some(tag => ['运动', '散步', '玩耍'].includes(tag))
    ).length;

    if (weeklyActivity >= 5) {
      score += 5;
    }

    return Math.min(100, Math.max(40, score));
  }

  // 计算饮食指标
  private calculateDietScore(recentRecords: Array<{ tags: string[]; isImportant: boolean }>): number {
    let score = 75; // 基础分

    // 饮食相关记录
    const dietRecords = recentRecords.filter(r => 
      r.tags.some(tag => ['饮食', '进食', '食欲', '食物', '营养'].includes(tag))
    );

    // 食欲问题记录
    const appetiteIssues = recentRecords.filter(r => 
      r.tags.some(tag => ['食欲不振', '拒食', '呕吐', '腹泻'].includes(tag))
    );

    // 正常饮食加分
    if (dietRecords.length >= 10) {
      score += 15;
    } else if (dietRecords.length >= 5) {
      score += 10;
    }

    // 食欲问题减分
    if (appetiteIssues.length >= 3) {
      score -= 20;
    } else if (appetiteIssues.length >= 1) {
      score -= 10;
    }

    return Math.min(100, Math.max(40, score));
  }

  // 计算睡眠指标
  private calculateSleepScore(recentRecords: Array<{ tags: string[] }>): number {
    let score = 75; // 基础分

    // 睡眠相关记录
    const sleepRecords = recentRecords.filter(r => 
      r.tags.some(tag => ['睡眠', '休息', '睡觉', '困倦'].includes(tag))
    );

    // 睡眠问题
    const sleepIssues = recentRecords.filter(r => 
      r.tags.some(tag => ['失眠', '睡眠不安', '夜醒', '嗜睡'].includes(tag))
    );

    // 正常睡眠加分
    if (sleepRecords.length >= 5) {
      score += 10;
    }

    // 睡眠问题减分
    if (sleepIssues.length >= 3) {
      score -= 20;
    } else if (sleepIssues.length >= 1) {
      score -= 10;
    }

    return Math.min(100, Math.max(40, score));
  }

  // 计算心理指标（基于情绪分析）
  private calculateMentalScore(emotionAnalyses: Array<{ primaryEmotion: string; confidence: number }>): number {
    if (emotionAnalyses.length === 0) {
      return 70; // 默认分数
    }

    let score = 70; // 基础分

    // 统计情绪分布
    const positiveEmotions = emotionAnalyses.filter(e => 
      ['happy', 'excited', 'calm', 'safe'].includes(e.primaryEmotion)
    );

    const negativeEmotions = emotionAnalyses.filter(e => 
      ['anxious', 'angry'].includes(e.primaryEmotion)
    );

    const positiveRatio = positiveEmotions.length / emotionAnalyses.length;
    const negativeRatio = negativeEmotions.length / emotionAnalyses.length;

    // 积极情绪加分
    if (positiveRatio > 0.7) {
      score += 25;
    } else if (positiveRatio > 0.5) {
      score += 15;
    } else if (positiveRatio > 0.3) {
      score += 5;
    }

    // 消极情绪减分
    if (negativeRatio > 0.3) {
      score -= 20;
    } else if (negativeRatio > 0.15) {
      score -= 10;
    }

    return Math.min(100, Math.max(40, score));
  }

  // 计算医疗指标
  private calculateMedicalScore(
    records: Array<{ tags: string[]; isImportant: boolean; createdAt: string }>,
    pet: { weight?: number; birthday?: string }
  ): number {
    let score = 80; // 基础分

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 近期医疗记录
    const recentMedicalRecords = records.filter(r => 
      new Date(r.createdAt) > ninetyDaysAgo &&
      (r.isImportant || r.tags.some(tag => 
        ['疫苗', '体检', '就医', '治疗', '症状'].includes(tag)
      ))
    );

    // 疫苗记录
    const vaccineRecords = records.filter(r => 
      r.tags.some(tag => tag.includes('疫苗'))
    );

    // 症状/疾病记录
    const symptomRecords = records.filter(r => 
      r.tags.some(tag => ['症状', '异常', '呕吐', '腹泻', '发烧', '咳嗽'].includes(tag))
    );

    // 有疫苗记录加分
    if (vaccineRecords.length > 0) {
      score += 10;
    }

    // 有定期体检记录加分
    const checkupRecords = records.filter(r => 
      r.tags.some(tag => tag.includes('体检'))
    );
    if (checkupRecords.length >= 2) {
      score += 10;
    }

    // 症状记录减分
    if (symptomRecords.length >= 3) {
      score -= 25;
    } else if (symptomRecords.length >= 1) {
      score -= 10;
    }

    // 重要记录（标记为重要的）减分
    const importantRecords = recentMedicalRecords.filter(r => r.isImportant);
    if (importantRecords.length >= 2) {
      score -= 15;
    }

    return Math.min(100, Math.max(40, score));
  }

  // 计算总分
  private calculateOverallScore(metrics: HealthMetrics): number {
    const weights = {
      activity: 0.2,
      diet: 0.25,
      sleep: 0.15,
      mental: 0.2,
      medical: 0.2
    };

    const weightedScore = 
      metrics.activity * weights.activity +
      metrics.diet * weights.diet +
      metrics.sleep * weights.sleep +
      metrics.mental * weights.mental +
      metrics.medical * weights.medical;

    return Math.round(weightedScore);
  }

  // 计算趋势
  private calculateTrend(records: Array<{ createdAt: string; tags: string[] }>): 'up' | 'down' | 'stable' {
    if (records.length < 6) return 'stable';

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentRecords = records.filter(r => 
      new Date(r.createdAt) > thirtyDaysAgo && new Date(r.createdAt) <= now
    );

    const olderRecords = records.filter(r => 
      new Date(r.createdAt) > sixtyDaysAgo && new Date(r.createdAt) <= thirtyDaysAgo
    );

    if (olderRecords.length === 0) return 'stable';

    // 统计问题记录
    const recentIssues = recentRecords.filter(r => 
      r.tags.some(tag => ['症状', '异常', '食欲不振', '呕吐', '腹泻'].includes(tag))
    ).length;

    const olderIssues = olderRecords.filter(r => 
      r.tags.some(tag => ['症状', '异常', '食欲不振', '呕吐', '腹泻'].includes(tag))
    ).length;

    const recentRatio = recentIssues / recentRecords.length || 0;
    const olderRatio = olderIssues / olderRecords.length || 0;

    if (recentRatio < olderRatio - 0.1) return 'up';
    if (recentRatio > olderRatio + 0.1) return 'down';
    return 'stable';
  }

  // 生成建议
  private generateSuggestions(
    metrics: HealthMetrics,
    records: Array<{ tags: string[] }>
  ): string[] {
    const suggestions: string[] = [];

    // 找出最低分项
    const entries = Object.entries(metrics) as [keyof HealthMetrics, number][];
    const sorted = entries.sort((a, b) => a[1] - b[1]);

    // 针对最低分项给出建议
    const [weakestMetric, weakestScore] = sorted[0];

    if (weakestScore < 60) {
      switch (weakestMetric) {
        case 'activity':
          suggestions.push('增加日常运动量，建议每天散步或玩耍30分钟');
          break;
        case 'diet':
          suggestions.push('关注饮食状况，记录进食情况，如有异常请咨询兽医');
          break;
        case 'sleep':
          suggestions.push('注意睡眠质量，保持安静的休息环境');
          break;
        case 'mental':
          suggestions.push('多陪伴互动，提供玩具和刺激，关注情绪变化');
          break;
        case 'medical':
          suggestions.push('建议进行健康检查，及时接种疫苗和体检');
          break;
      }
    }

    // 基于记录给出具体建议
    const symptomRecords = records.filter(r => 
      r.tags.some(tag => ['症状', '异常'].includes(tag))
    );

    if (symptomRecords.length >= 2) {
      suggestions.push('近期有多次症状记录，建议咨询兽医进行详细检查');
    }

    // 通用建议
    if (suggestions.length === 0) {
      if (metrics.activity < 80) {
        suggestions.push('可以适当增加运动量，保持活力');
      }
      if (metrics.mental < 80) {
        suggestions.push('多陪伴毛孩子，增进感情');
      }
    }

    return suggestions.slice(0, 2);
  }

  // 生成详细说明
  private generateDetails(metrics: HealthMetrics): HealthScoreResult['details'] {
    return {
      activityDetails: this.getActivityDescription(metrics.activity),
      dietDetails: this.getDietDescription(metrics.diet),
      sleepDetails: this.getSleepDescription(metrics.sleep),
      mentalDetails: this.getMentalDescription(metrics.mental),
      medicalDetails: this.getMedicalDescription(metrics.medical)
    };
  }

  private getActivityDescription(score: number): string {
    if (score >= 90) return '运动量充足，活力充沛';
    if (score >= 75) return '运动量良好，保持活跃';
    if (score >= 60) return '运动量一般，可适当增加';
    return '运动量不足，建议增加日常活动';
  }

  private getDietDescription(score: number): string {
    if (score >= 90) return '饮食规律，营养均衡';
    if (score >= 75) return '饮食状况良好';
    if (score >= 60) return '饮食基本正常';
    return '饮食需要关注，注意食欲变化';
  }

  private getSleepDescription(score: number): string {
    if (score >= 90) return '睡眠质量优秀';
    if (score >= 75) return '睡眠状况良好';
    if (score >= 60) return '睡眠基本正常';
    return '睡眠质量需要改善';
  }

  private getMentalDescription(score: number): string {
    if (score >= 90) return '情绪状态极佳，心情愉快';
    if (score >= 75) return '情绪状态良好';
    if (score >= 60) return '情绪基本稳定';
    return '情绪需要关注，多陪伴安抚';
  }

  private getMedicalDescription(score: number): string {
    if (score >= 90) return '健康状况优秀，定期体检';
    if (score >= 75) return '健康状况良好';
    if (score >= 60) return '健康状况一般';
    return '建议进行健康检查';
  }

  // 默认评分
  private getDefaultScore(): HealthScoreResult {
    return {
      score: 70,
      metrics: {
        activity: 70,
        diet: 75,
        sleep: 70,
        mental: 70,
        medical: 75
      },
      lastCheckDate: new Date().toISOString(),
      trend: 'stable',
      suggestions: ['开始记录健康数据，获取更准确的评分'],
      details: {
        activityDetails: '暂无足够数据',
        dietDetails: '暂无足够数据',
        sleepDetails: '暂无足够数据',
        mentalDetails: '暂无足够数据',
        medicalDetails: '暂无足够数据'
      }
    };
  }
}

export const realHealthScoreService = new RealHealthScoreService();
