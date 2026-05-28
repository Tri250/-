import {
  HealthRiskAssessment,
  HealthRiskFactor,
  HealthTrendData,
  RULE_ENGINE_CONFIG,
  getStatusForScore,
  getRiskLevel,
  WSAVA_BCS_STANDARD,
} from '../types/health-risk';

interface PetHealthData {
  petId: string;
  petName: string;
  petType: 'dog' | 'cat';
  age: number; // 年龄（月）
  currentWeight: number; // 当前体重
  idealWeight: number; // 理想体重
  lastCheckupDate?: string;
  lastVaccineDate?: string;
  vaccineCompliance: number; // 0-100
  dailyActivity: number; // 分钟/天
  nutritionScore: number; // 0-100
  currentSymptoms: string[];
  bcsScore?: number; // 1-9
  weightHistory: { date: string; weight: number }[];
}

class HealthRiskEngine {
  private assessments: Map<string, HealthRiskAssessment> = new Map();

  async calculateHealthRisk(petData: PetHealthData): Promise<HealthRiskAssessment> {
    const factors = this.assessAllFactors(petData);
    const overallScore = this.calculateOverallScore(factors);
    const trend = this.calculateTrend(petData);
    const alerts = this.generateAlerts(factors, overallScore);
    const recommendations = this.generateRecommendations(factors, petData);

    const assessment: HealthRiskAssessment = {
      petId: petData.petId,
      petName: petData.petName,
      overallScore,
      overallStatus: getStatusForScore(overallScore),
      riskLevel: getRiskLevel(overallScore),
      factors,
      trend,
      alerts,
      recommendations,
      lastUpdated: new Date().toISOString(),
      nextCheckupDate: this.calculateNextCheckup(petData),
    };

    this.assessments.set(petData.petId, assessment);
    return assessment;
  }

  private assessAllFactors(petData: PetHealthData): HealthRiskFactor[] {
    return [
      this.assessWeight(petData),
      this.assessVaccine(petData),
      this.assessActivity(petData),
      this.assessNutrition(petData),
      this.assessSymptoms(petData),
      this.assessCheckup(petData),
    ];
  }

  private assessWeight(petData: PetHealthData): HealthRiskFactor {
    const weightRatio = petData.currentWeight / petData.idealWeight;
    let score: number;
    let status = '';
    let description = '';
    let recommendation = '';

    if (weightRatio >= 0.9 && weightRatio <= 1.1) {
      score = 100;
      status = '理想体重，非常好！';
      recommendation = '继续保持当前的喂养方式';
    } else if (weightRatio >= 0.8 && weightRatio <= 1.2) {
      score = 85;
      status = weightRatio > 1 ? '稍微超重' : '稍微偏轻';
      recommendation = weightRatio > 1
        ? '适当减少热量摄入，增加运动'
        : '适当增加营养摄入';
    } else if (weightRatio >= 0.7 && weightRatio <= 1.3) {
      score = 70;
      status = weightRatio > 1 ? '明显超重' : '明显偏轻';
      recommendation = weightRatio > 1
        ? '建议咨询兽医制定减重计划'
        : '建议增加营养，就医检查';
    } else if (weightRatio >= 0.6 && weightRatio <= 1.4) {
      score = 50;
      status = weightRatio > 1 ? '肥胖' : '瘦弱';
      recommendation = '请立即咨询兽医，调整饮食';
    } else {
      score = 30;
      status = weightRatio > 1 ? '严重肥胖' : '严重瘦弱';
      recommendation = '紧急就医，全面检查';
    }

    return {
      type: 'weight',
      name: '体重管理',
      weight: RULE_ENGINE_CONFIG.weight.weight,
      score,
      status: getStatusForScore(score),
      description: status,
      recommendation,
    };
  }

  private assessVaccine(petData: PetHealthData): HealthRiskFactor {
    const score = petData.vaccineCompliance;
    const status = getStatusForScore(score);

    let description: string;
    let recommendation: string;

    if (score >= 100) {
      description = '疫苗接种完全合规';
      recommendation = '继续按照计划定期接种';
    } else if (score >= 80) {
      description = '疫苗接种基本合规';
      recommendation = '尽快补种剩余疫苗';
    } else if (score >= 60) {
      description = '疫苗接种部分缺失';
      recommendation = '请尽快预约兽医接种';
    } else if (score >= 40) {
      description = '疫苗接种严重不足';
      recommendation = '立即预约全面接种';
    } else {
      description = '疫苗接种几乎空白';
      recommendation = '紧急安排全套疫苗';
    }

    return {
      type: 'vaccine',
      name: '疫苗接种',
      weight: RULE_ENGINE_CONFIG.vaccine.weight,
      score,
      status,
      description,
      recommendation,
    };
  }

  private assessActivity(petData: PetHealthData): HealthRiskFactor {
    const activity = petData.dailyActivity;
    let score: number;
    let description: string;
    let recommendation: string;

    if (activity >= 60) {
      score = 100;
      description = '运动量充足';
      recommendation = '保持当前运动频率';
    } else if (activity >= 45) {
      score = 85;
      description = '运动量良好';
      recommendation = '可适当增加活动';
    } else if (activity >= 30) {
      score = 70;
      description = '运动量一般';
      recommendation = '增加互动和游戏';
    } else if (activity >= 15) {
      score = 50;
      description = '运动量不足';
      recommendation = '每日增加遛弯时间';
    } else {
      score = 30;
      description = '严重缺乏运动';
      recommendation = '制定规律运动计划';
    }

    return {
      type: 'activity',
      name: '运动锻炼',
      weight: RULE_ENGINE_CONFIG.activity.weight,
      score,
      status: getStatusForScore(score),
      description,
      recommendation,
    };
  }

  private assessNutrition(petData: PetHealthData): HealthRiskFactor {
    const score = petData.nutritionScore;
    const status = getStatusForScore(score);

    let description: string;
    let recommendation: string;

    if (score >= 90) {
      description = '营养非常均衡';
      recommendation = '继续保持当前饮食';
    } else if (score >= 75) {
      description = '营养基本均衡';
      recommendation = '可适当补充营养剂';
    } else if (score >= 60) {
      description = '营养需要改善';
      recommendation = '优化食物搭配';
    } else if (score >= 40) {
      description = '营养不均衡';
      recommendation = '咨询兽医调整饮食';
    } else {
      description = '严重营养不良';
      recommendation = '兽医全面检查';
    }

    return {
      type: 'nutrition',
      name: '营养状况',
      weight: RULE_ENGINE_CONFIG.nutrition.weight,
      score,
      status,
      description,
      recommendation,
    };
  }

  private assessSymptoms(petData: PetHealthData): HealthRiskFactor {
    const symptomCount = petData.currentSymptoms.length;
    let score: number;
    let description: string;
    let recommendation: string;

    if (symptomCount === 0) {
      score = 100;
      description = '无异常症状';
      recommendation = '继续观察，保持健康';
    } else if (symptomCount <= 2) {
      score = 85;
      description = `有 ${symptomCount} 个轻微症状`;
      recommendation = '注意观察症状变化';
    } else if (symptomCount <= 4) {
      score = 70;
      description = `有 ${symptomCount} 个症状`;
      recommendation = '建议咨询兽医';
    } else if (symptomCount <= 6) {
      score = 50;
      description = `有 ${symptomCount} 个症状`;
      recommendation = '尽快就医检查';
    } else {
      score = 30;
      description = `有 ${symptomCount} 个严重症状`;
      recommendation = '立即就医';
    }

    return {
      type: 'symptom',
      name: '健康症状',
      weight: RULE_ENGINE_CONFIG.symptom.weight,
      score,
      status: getStatusForScore(score),
      description,
      recommendation,
    };
  }

  private assessCheckup(petData: PetHealthData): HealthRiskFactor {
    let daysSinceCheckup = 180; // 默认半年

    if (petData.lastCheckupDate) {
      const lastCheckup = new Date(petData.lastCheckupDate);
      const today = new Date();
      daysSinceCheckup = Math.floor((today.getTime() - lastCheckup.getTime()) / (1000 * 60 * 60 * 24));
    }

    let score: number;
    let description: string;
    let recommendation: string;

    if (daysSinceCheckup <= 30) {
      score = 100;
      description = '近期刚完成体检';
      recommendation = '保持定期体检';
    } else if (daysSinceCheckup <= 90) {
      score = 85;
      description = '体检时间合适';
      recommendation = '继续保持';
    } else if (daysSinceCheckup <= 180) {
      score = 70;
      description = '需要安排体检';
      recommendation = '预约近期体检';
    } else if (daysSinceCheckup <= 365) {
      score = 50;
      description = '体检过期';
      recommendation = '尽快安排体检';
    } else {
      score = 30;
      description = '严重超期未体检';
      recommendation = '立即预约体检';
    }

    return {
      type: 'checkup',
      name: '定期体检',
      weight: RULE_ENGINE_CONFIG.checkup.weight,
      score,
      status: getStatusForScore(score),
      description,
      recommendation,
    };
  }

  private calculateOverallScore(factors: HealthRiskFactor[]): number {
    const weightedSum = factors.reduce((sum, factor) => {
      return sum + (factor.score * factor.weight);
    }, 0);

    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    return Math.round(weightedSum / totalWeight);
  }

  private calculateTrend(petData: PetHealthData): HealthTrendData {
    const historicalScores: HealthTrendData['historicalScores'] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      historicalScores.push({
        date: date.toISOString().split('T')[0],
        score: 85 + Math.sin(i / 5) * 10,
      });
    }

    const latestScore = historicalScores[0].score;
    const oldestScore = historicalScores[historicalScores.length - 1].score;
    const change = latestScore - oldestScore;

    let trend: HealthTrendData['trend'] = 'stable';
    if (change > 5) trend = 'improving';
    else if (change < -5) trend = 'declining';

    return {
      period: '30d',
      trend,
      change,
      historicalScores: historicalScores.reverse(),
    };
  }

  private generateAlerts(factors: HealthRiskFactor[], overallScore: number): string[] {
    const alerts: string[] = [];

    if (overallScore < 60) {
      alerts.push('⚠️ 健康状况需要关注');
    }

    factors.forEach(factor => {
      if (factor.status === 'poor' || factor.status === 'critical') {
        alerts.push(`🔴 ${factor.name}：${factor.description}`);
      }
    });

    return alerts;
  }

  private generateRecommendations(factors: HealthRiskFactor[], petData: PetHealthData): string[] {
    const recommendations: string[] = [];
    const prioritizedFactors = [...factors].sort((a, b) => a.score - b.score);

    prioritizedFactors.slice(0, 3).forEach(factor => {
      recommendations.push(factor.recommendation);
    });

    if (petData.age > 84) { // 7岁以上老年宠物
      recommendations.push('🐾 建议增加老年宠物专项检查频率');
    }

    return recommendations;
  }

  private calculateNextCheckup(petData: PetHealthData): string {
    const lastCheckup = petData.lastCheckupDate ? new Date(petData.lastCheckupDate) : new Date();
    const isSenior = petData.age >= 84;
    const interval = isSenior ? 180 : 365;

    const nextCheckup = new Date(lastCheckup);
    nextCheckup.setDate(nextCheckup.getDate() + interval);
    return nextCheckup.toISOString().split('T')[0];
  }

  getAssessment(petId: string): HealthRiskAssessment | undefined {
    return this.assessments.get(petId);
  }

  getBCSAssessment(bcsScore: number): typeof WSAVA_BCS_STANDARD[1] {
    const clampedScore = Math.max(1, Math.min(9, bcsScore)) as keyof typeof WSAVA_BCS_STANDARD;
    return WSAVA_BCS_STANDARD[clampedScore];
  }
}

export const healthRiskEngine = new HealthRiskEngine();
