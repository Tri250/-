/**
 * PawSync Pro - 多模态图像识别服务
 * 支持品种识别、体态评分、异常检测
 * 作者: 带娃的小陈工
 */

export interface BreedInfo {
  breed: string;
  confidence: number;
  type: 'dog' | 'cat' | 'unknown';
  characteristics?: string[];
}

export interface BodyConditionScore {
  score: number; // 1-9
  status: 'underweight' | 'ideal' | 'overweight' | 'obese';
  description: string;
  recommendations: string[];
}

export interface AnomalyDetection {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  recommendation: string;
}

export interface ImageAnalysisResult {
  success: boolean;
  breed: BreedInfo;
  bodyCondition: BodyConditionScore;
  anomalies: AnomalyDetection[];
  overallHealth: {
    score: number;
    status: 'healthy' | 'attention_needed' | 'concerning';
    summary: string;
  };
  warnings: string[];
  suggestions: string[];
  referenceLinks: string[];
}

class MultimodalImageService {
  /**
   * 分析宠物图片
   */
  async analyzeImage(imageBase64: string, petType?: 'dog' | 'cat'): Promise<ImageAnalysisResult> {
    try {
      // 模拟多模态分析
      const breed = await this.identifyBreed(imageBase64, petType);
      const bodyCondition = await this.assessBodyCondition(imageBase64, breed);
      const anomalies = await this.detectAnomalies(imageBase64, breed);
      const overallHealth = this.calculateOverallHealth(breed, bodyCondition, anomalies);
      const warnings = this.generateWarnings(anomalies, bodyCondition);
      const suggestions = this.generateSuggestions(breed, bodyCondition, anomalies);

      return {
        success: true,
        breed,
        bodyCondition,
        anomalies,
        overallHealth,
        warnings,
        suggestions,
        referenceLinks: this.generateReferenceLinks(anomalies),
      };
    } catch (error: any) {
      console.error('图像分析失败:', error);
      return {
        success: false,
        breed: { breed: '未知', confidence: 0, type: 'unknown' },
        bodyCondition: {
          score: 5,
          status: 'ideal',
          description: '无法评估',
          recommendations: [],
        },
        anomalies: [],
        overallHealth: {
          score: 50,
          status: 'concerning',
          summary: '图像分析失败，请重试',
        },
        warnings: ['图像质量不佳，请确保照片清晰、光线充足'],
        suggestions: ['建议在光线充足的环境下重新拍摄'],
        referenceLinks: ['/health-manual?category=care'],
      };
    }
  }

  /**
   * 品种识别
   */
  private async identifyBreed(imageBase64: string, petType?: 'dog' | 'cat'): Promise<BreedInfo> {
    // 模拟API调用 - 实际应使用Qwen-VL API
    const dogBreeds = [
      { breed: '金毛寻回犬', characteristics: ['友善', '聪明', '适合家庭'] },
      { breed: '拉布拉多', characteristics: ['活泼', '友好', '导盲犬常选'] },
      { breed: '柯基', characteristics: ['腿短', '活泼', '独立'] },
      { breed: '柴犬', characteristics: ['忠诚', '独立', '爱干净'] },
      { breed: '边境牧羊犬', characteristics: ['聪明', '精力充沛', '服从性强'] },
      { breed: '泰迪', characteristics: ['小巧', '不掉毛', '粘人'] },
      { breed: '哈士奇', characteristics: ['精力旺盛', '友好', '爱嚎叫'] },
      { breed: '比熊', characteristics: ['白色毛发', '不掉毛', '活泼'] },
    ];

    const catBreeds = [
      { breed: '中华田园猫', characteristics: ['适应性强', '体质好', '性格独立'] },
      { breed: '英国短毛猫', characteristics: ['圆润', '安静', '易饲养'] },
      { breed: '美国短毛猫', characteristics: ['活泼', '聪明', '体质好'] },
      { breed: '波斯猫', characteristics: ['长毛', '安静', '需要护理'] },
      { breed: '暹罗猫', characteristics: ['聪明', '粘人', '爱叫'] },
      { breed: '布偶猫', characteristics: ['温柔', '亲人', '体型大'] },
      { breed: '缅因猫', characteristics: ['体型大', '毛发长', '友善'] },
      { breed: '苏格兰折耳猫', characteristics: ['耳朵折', '可爱', '需注意关节'] },
    ];

    // 模拟随机选择
    const breeds = petType === 'cat' ? catBreeds : petType === 'dog' ? dogBreeds : [...dogBreeds, ...catBreeds];
    const selectedBreed = breeds[Math.floor(Math.random() * breeds.length)];
    const confidence = 0.75 + Math.random() * 0.2; // 0.75-0.95

    return {
      breed: selectedBreed.breed,
      confidence: Math.round(confidence * 100) / 100,
      type: petType || (breeds === dogBreeds ? 'dog' : 'cat'),
      characteristics: selectedBreed.characteristics,
    };
  }

  /**
   * 体态评分（基于WSAVA标准）
   */
  private async assessBodyCondition(imageBase64: string, breed: BreedInfo): Promise<BodyConditionScore> {
    // 模拟BCS评分 - 实际应使用计算机视觉
    const bcsScore = 4 + Math.floor(Math.random() * 4); // 4-7

    const descriptions: Record<number, { status: BodyConditionScore['status']; desc: string; recs: string[] }> = {
      1: { status: 'underweight', desc: '非常瘦，肋骨、脊椎明显可见', recs: ['增加营养摄入', '检查是否有寄生虫', '咨询兽医'] },
      2: { status: 'underweight', desc: '偏瘦，需要增重', recs: ['调整饮食结构', '增加喂食次数', '补充营养剂'] },
      3: { status: 'underweight', desc: '较瘦，可以适当增重', recs: ['增加优质蛋白摄入', '适度运动促进食欲'] },
      4: { status: 'ideal', desc: '偏瘦但可接受', recs: ['保持当前饮食', '适度增加运动'] },
      5: { status: 'ideal', desc: '理想体重，身体匀称', recs: ['继续保持！', '定期监测体重'] },
      6: { status: 'overweight', desc: '稍微超重', recs: ['减少零食', '增加运动量', '控制食量'] },
      7: { status: 'overweight', desc: '明显超重，需要控制', recs: ['制定减重计划', '减少高热量食物', '增加运动'] },
      8: { status: 'obese', desc: '肥胖，影响健康', recs: ['立即减重', '咨询兽医制定计划', '严格控制饮食'] },
      9: { status: 'obese', desc: '严重肥胖，健康风险高', recs: ['紧急减重', '兽医全面检查', '制定专属方案'] },
    };

    const info = descriptions[bcsScore] || descriptions[5];

    return {
      score: bcsScore,
      status: info.status,
      description: info.desc,
      recommendations: info.recs,
    };
  }

  /**
   * 异常检测
   */
  private async detectAnomalies(imageBase64: string, breed: BreedInfo): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // 模拟随机检测 - 实际应使用计算机视觉
    const hasAnomaly = Math.random() > 0.7; // 30%概率有异常

    if (hasAnomaly) {
      const anomalyTypes = [
        {
          type: '泪痕',
          severity: 'medium' as const,
          location: '眼部',
          description: '眼角有明显的红褐色泪痕',
          recommendation: '检查饮食、使用专用清洁液、如有感染需就医',
        },
        {
          type: '皮肤红肿',
          severity: 'medium' as const,
          location: '背部/腹部',
          description: '皮肤局部发红、伴有脱毛',
          recommendation: '检查是否有寄生虫或过敏、保持皮肤清洁、就医检查',
        },
        {
          type: '耳朵问题',
          severity: 'low' as const,
          location: '耳朵',
          description: '耳朵有分泌物或异味',
          recommendation: '清洁耳道、检查是否有耳螨、持续异常需就医',
        },
        {
          type: '牙齿问题',
          severity: 'high' as const,
          location: '口腔',
          description: '牙龈红肿或牙齿有牙石',
          recommendation: '进行专业洁牙、调整饮食、日常刷牙护理',
        },
        {
          type: '外伤',
          severity: 'critical' as const,
          location: '四肢/身体',
          description: '有明显伤口或出血',
          recommendation: '立即就医！进行伤口处理，可能需要抗生素',
        },
      ];

      const selectedAnomaly = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
      anomalies.push({
        ...selectedAnomaly,
        location: selectedAnomaly.location,
      });
    }

    // 皮肤毛发检查
    const skinIssue = Math.random() > 0.85;
    if (skinIssue && !anomalies.find(a => a.type === '皮肤问题')) {
      anomalies.push({
        type: '皮肤毛发异常',
        severity: 'medium',
        location: '全身',
        description: '毛发暗淡或局部脱毛',
        recommendation: '检查营养状况、是否有寄生虫、过敏等',
      });
    }

    return anomalies;
  }

  /**
   * 计算整体健康评分
   */
  private calculateOverallHealth(
    breed: BreedInfo,
    bodyCondition: BodyConditionScore,
    anomalies: AnomalyDetection[]
  ): ImageAnalysisResult['overallHealth'] {
    let score = 100;

    // 体态影响 (-10到-30分)
    if (bodyCondition.status === 'obese') score -= 30;
    else if (bodyCondition.status === 'overweight') score -= 15;
    else if (bodyCondition.status === 'underweight') score -= 10;

    // 异常影响
    anomalies.forEach(anomaly => {
      switch (anomaly.severity) {
        case 'critical': score -= 40; break;
        case 'high': score -= 25; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    score = Math.max(0, Math.min(100, score));

    let status: ImageAnalysisResult['overallHealth']['status'];
    if (score >= 80) status = 'healthy';
    else if (score >= 50) status = 'attention_needed';
    else status = 'concerning';

    let summary = '';
    if (status === 'healthy') {
      summary = `您的${breed.type === 'dog' ? '狗狗' : '猫咪'}整体健康状况良好！继续保持良好的饲养方式。`;
    } else if (status === 'attention_needed') {
      summary = `发现一些小问题需要关注，请根据建议进行调整或就医检查。`;
    } else {
      summary = `发现健康问题，建议尽快带宠物就医进行详细检查。`;
    }

    return { score, status, summary };
  }

  /**
   * 生成警告信息
   */
  private generateWarnings(anomalies: AnomalyDetection[], bodyCondition: BodyConditionScore): string[] {
    const warnings: string[] = [];

    if (bodyCondition.status === 'obese') {
      warnings.push('⚠️ 体重严重超标，可能导致关节、心脏等问题');
    } else if (bodyCondition.status === 'overweight') {
      warnings.push('⚠️ 体重偏重，建议调整饮食增加运动');
    }

    anomalies.forEach(anomaly => {
      if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        warnings.push(`🚨 ${anomaly.type}（${anomaly.location}）- ${anomaly.description}`);
      }
    });

    return warnings;
  }

  /**
   * 生成建议
   */
  private generateSuggestions(
    breed: BreedInfo,
    bodyCondition: BodyConditionScore,
    anomalies: AnomalyDetection[]
  ): string[] {
    const suggestions: string[] = [];

    suggestions.push(...bodyCondition.recommendations);

    anomalies.forEach(anomaly => {
      suggestions.push(anomaly.recommendation);
    });

    if (breed.characteristics) {
      suggestions.push(`💡 ${breed.breed}特点：${breed.characteristics.join('、')}`);
    }

    suggestions.push('📋 建议定期进行体检，关注宠物健康变化');

    return suggestions;
  }

  /**
   * 生成参考链接
   */
  private generateReferenceLinks(anomalies: AnomalyDetection[]): string[] {
    const links: string[] = ['/health-manual?category=care'];

    anomalies.forEach(anomaly => {
      switch (anomaly.type) {
        case '泪痕':
        case '皮肤红肿':
        case '皮肤毛发异常':
          links.push('/health-manual?category=care&tag=皮肤');
          break;
        case '耳朵问题':
          links.push('/health-manual?id=8');
          break;
        case '牙齿问题':
          links.push('/health-manual?id=4');
          break;
        case '外伤':
          links.push('/health-manual?category=emergency');
          break;
      }
    });

    if (anomalies.some(a => a.type.includes('体重') || a.type.includes('胖'))) {
      links.push('/health-manual?id=18');
    }

    return [...new Set(links)];
  }

  /**
   * 批量分析（多张图片）
   */
  async analyzeMultipleImages(images: string[]): Promise<ImageAnalysisResult[]> {
    const results: ImageAnalysisResult[] = [];

    for (const image of images) {
      const result = await this.analyzeImage(image);
      results.push(result);
    }

    return results;
  }

  /**
   * 获取分析历史
   */
  getAnalysisHistory(petId: string): any[] {
    // 模拟历史记录
    return [
      {
        id: 'analysis_1',
        petId,
        date: '2026-05-20',
        breed: { breed: '金毛寻回犬', confidence: 0.92, type: 'dog' },
        overallHealth: { score: 85, status: 'healthy' },
      },
      {
        id: 'analysis_2',
        petId,
        date: '2026-05-15',
        breed: { breed: '金毛寻回犬', confidence: 0.89, type: 'dog' },
        overallHealth: { score: 78, status: 'attention_needed' },
      },
    ];
  }
}

export const multimodalImageService = new MultimodalImageService();
