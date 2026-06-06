// ============================================
// PawSync Pro 3.0 - Real Prediction Service
//
// 真实智能预测服务 - 基于历史数据分析
// 无需AI模型，使用统计学算法
// ============================================

import { healthRecordsApi, remindersApi } from '../lib/api';
import { emotionService } from './emotionService';

export interface Prediction {
  id: string;
  type: 'health' | 'behavior' | 'care' | 'seasonal';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  icon: 'alert' | 'calendar' | 'trend' | 'drop' | 'sun' | 'moon' | 'wind';
  action?: string;
  reason: string;
}

interface HealthData {
  records: Array<{
    type: string;
    createdAt: string;
    tags: string[];
    isImportant: boolean;
  }>;
  reminders: Array<{
    type: string;
    date: string;
    isCompleted: boolean;
  }>;
  emotionHistory: Array<{
    primaryEmotion: string;
    createdAt: string;
    confidence: number;
  }>;
}

class RealPredictionService {
  private predictions: Prediction[] = [];
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  // 获取真实预测
  async getPredictions(petId: string, forceRefresh = false): Promise<Prediction[]> {
    // 检查缓存
    if (!forceRefresh && Date.now() - this.lastUpdate < this.CACHE_DURATION && this.predictions.length > 0) {
      return this.predictions;
    }

    try {
      // 获取真实数据
      const healthData = await this.fetchHealthData(petId);
      
      // 基于真实数据生成预测
      const predictions: Prediction[] = [];
      
      // 1. 健康预警预测
      const healthPrediction = this.predictHealthIssues(healthData);
      if (healthPrediction) predictions.push(healthPrediction);
      
      // 2. 行为预测
      const behaviorPrediction = this.predictBehavior(healthData);
      if (behaviorPrediction) predictions.push(behaviorPrediction);
      
      // 3. 养护建议
      const carePrediction = this.predictCareNeeds(healthData);
      if (carePrediction) predictions.push(carePrediction);
      
      // 4. 季节提醒
      const seasonalPrediction = this.predictSeasonalNeeds(healthData);
      if (seasonalPrediction) predictions.push(seasonalPrediction);
      
      // 5. 基于情绪的趋势预测
      const emotionPrediction = this.predictEmotionTrend(healthData);
      if (emotionPrediction) predictions.push(emotionPrediction);

      this.predictions = predictions;
      this.lastUpdate = Date.now();
      
      return predictions;
    } catch (error) {
      console.error('Failed to generate predictions:', error);
      return this.predictions.length > 0 ? this.predictions : this.getDefaultPredictions();
    }
  }

  // 获取真实健康数据
  private async fetchHealthData(petId: string): Promise<HealthData> {
    const [recordsResponse, remindersResponse] = await Promise.all([
      healthRecordsApi.getAll({ petId }),
      remindersApi.getAll({ petId })
    ]);

    const emotionHistory = await emotionService.getRecentAnalyses(30);

    return {
      records: recordsResponse.records || [],
      reminders: remindersResponse.reminders || [],
      emotionHistory: emotionHistory.map(a => ({
        primaryEmotion: a.primaryEmotion,
        createdAt: a.createdAt,
        confidence: a.confidence
      }))
    };
  }

  // 预测健康问题
  private predictHealthIssues(data: HealthData): Prediction | null {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // 分析近期健康记录
    const recentRecords = data.records.filter(r => 
      new Date(r.createdAt) > thirtyDaysAgo
    );

    // 检查是否有异常模式
    const importantRecords = recentRecords.filter(r => r.isImportant);
    const symptomRecords = recentRecords.filter(r => 
      r.tags.some(tag => 
        ['症状', '异常', '呕吐', '腹泻', '咳嗽', '发烧'].includes(tag)
      )
    );

    // 如果有多个重要记录或症状记录，预测健康问题
    if (importantRecords.length >= 2 || symptomRecords.length >= 2) {
      const lastSymptom = symptomRecords[0];
      const daysSinceLastSymptom = lastSymptom 
        ? Math.floor((now.getTime() - new Date(lastSymptom.createdAt).getTime()) / (24 * 60 * 60 * 1000))
        : 0;

      return {
        id: `health-${Date.now()}`,
        type: 'health',
        title: '健康状况需关注',
        description: `近期有${symptomRecords.length}次症状记录，建议密切关注毛孩子的健康状况`,
        confidence: Math.min(90, 60 + symptomRecords.length * 10),
        timeframe: daysSinceLastSymptom <= 3 ? '近期' : '本周内',
        icon: 'alert',
        action: '查看健康记录',
        reason: `基于${symptomRecords.length}次症状记录分析`
      };
    }

    // 检查疫苗提醒
    const vaccineReminders = data.reminders.filter(r => 
      r.type === 'VACCINE' && !r.isCompleted
    );
    
    if (vaccumeReminders.length > 0) {
      const upcoming = vaccineReminders[0];
      const daysUntil = Math.floor(
        (new Date(upcoming.date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysUntil <= 7 && daysUntil >= 0) {
        return {
          id: `vaccine-${Date.now()}`,
          type: 'health',
          title: '疫苗接种提醒',
          description: `${daysUntil === 0 ? '今天' : daysUntil + '天后'}需要接种疫苗，请提前安排`,
          confidence: 95,
          timeframe: daysUntil === 0 ? '今天' : `${daysUntil}天后`,
          icon: 'alert',
          action: '查看疫苗详情',
          reason: '基于疫苗接种计划'
        };
      }
    }

    return null;
  }

  // 预测行为变化
  private predictBehavior(data: HealthData): Prediction | null {
    const now = new Date();
    
    // 分析情绪历史
    if (data.emotionHistory.length >= 5) {
      const recentEmotions = data.emotionHistory.slice(0, 7);
      const anxiousCount = recentEmotions.filter(e => 
        e.primaryEmotion === 'anxious' || e.primaryEmotion === 'angry'
      ).length;
      
      const happyCount = recentEmotions.filter(e => 
        e.primaryEmotion === 'happy' || e.primaryEmotion === 'excited'
      ).length;

      if (anxiousCount >= 3) {
        return {
          id: `behavior-${Date.now()}`,
          type: 'behavior',
          title: '情绪焦虑预警',
          description: '近期情绪记录显示焦虑倾向增加，建议多陪伴和安抚',
          confidence: 70 + anxiousCount * 5,
          timeframe: '本周内',
          icon: 'trend',
          action: '查看情绪分析',
          reason: `基于${anxiousCount}次焦虑情绪记录`
        };
      }

      if (happyCount >= 5) {
        return {
          id: `behavior-${Date.now()}`,
          type: 'behavior',
          title: '情绪状态良好',
          description: '近期情绪记录显示毛孩子心情不错，继续保持良好的互动',
          confidence: 75,
          timeframe: '本周内',
          icon: 'trend',
          action: '查看情绪趋势',
          reason: `基于${happyCount}次积极情绪记录`
        };
      }
    }

    // 基于时间的行为预测
    const hour = now.getHours();
    if (hour >= 18 && hour <= 20) {
      return {
        id: `behavior-${Date.now()}`,
        type: 'behavior',
        title: '晚间活跃期',
        description: '现在是毛孩子通常比较活跃的时间段，适合互动玩耍',
        confidence: 80,
        timeframe: '今晚',
        icon: 'moon',
        action: '开始互动',
        reason: '基于时间模式分析'
      };
    }

    return null;
  }

  // 预测养护需求
  private predictCareNeeds(data: HealthData): Prediction | null {
    const now = new Date();
    
    // 检查洗澡提醒
    const bathReminders = data.reminders.filter(r => 
      r.type === 'BATH' && !r.isCompleted
    );
    
    if (bathReminders.length > 0) {
      const upcoming = bathReminders[0];
      const daysUntil = Math.floor(
        (new Date(upcoming.date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysUntil <= 3 && daysUntil >= 0) {
        return {
          id: `care-${Date.now()}`,
          type: 'care',
          title: '洗澡护理提醒',
          description: `${daysUntil === 0 ? '今天' : daysUntil + '天后'}需要洗澡护理`,
          confidence: 90,
          timeframe: daysUntil === 0 ? '今天' : `${daysUntil}天后`,
          icon: 'drop',
          action: '查看护理计划',
          reason: '基于护理日程安排'
        };
      }
    }

    // 检查驱虫提醒
    const dewormingReminders = data.reminders.filter(r => 
      r.type === 'DEWORMING' && !r.isCompleted
    );
    
    if (dewormingReminders.length > 0) {
      const upcoming = dewormingReminders[0];
      const daysUntil = Math.floor(
        (new Date(upcoming.date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysUntil <= 7 && daysUntil >= 0) {
        return {
          id: `care-${Date.now()}`,
          type: 'care',
          title: '驱虫提醒',
          description: `${daysUntil === 0 ? '今天' : daysUntil + '天后'}需要进行驱虫`,
          confidence: 95,
          timeframe: daysUntil === 0 ? '今天' : `${daysUntil}天后`,
          icon: 'alert',
          action: '查看驱虫计划',
          reason: '基于定期驱虫计划'
        };
      }
    }

    // 基于记录类型的建议
    const groomingRecords = data.records.filter(r => 
      r.tags.some(tag => ['梳毛', '剪指甲', '清洁'].includes(tag))
    );
    
    const lastGrooming = groomingRecords[0];
    if (lastGrooming) {
      const daysSince = Math.floor(
        (now.getTime() - new Date(lastGrooming.createdAt).getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysSince >= 7) {
        return {
          id: `care-${Date.now()}`,
          type: 'care',
          title: '建议进行梳毛护理',
          description: `距离上次梳毛护理已${daysSince}天，建议定期梳理毛发`,
          confidence: Math.min(85, 60 + daysSince),
          timeframe: '本周内',
          icon: 'calendar',
          action: '添加护理提醒',
          reason: `基于上次护理记录（${daysSince}天前）`
        };
      }
    }

    return null;
  }

  // 预测季节需求
  private predictSeasonalNeeds(_data: HealthData): Prediction | null {
    const now = new Date();
    const month = now.getMonth() + 1;
    
    // 夏季防暑（6-8月）
    if (month >= 6 && month <= 8) {
      return {
        id: `seasonal-${Date.now()}`,
        type: 'seasonal',
        title: '夏季防暑提醒',
        description: '天气炎热，注意给毛孩子提供充足饮水和阴凉的休息环境',
        confidence: 95,
        timeframe: '本夏季',
        icon: 'sun',
        action: '查看防暑指南',
        reason: '基于当前季节（夏季）'
      };
    }
    
    // 冬季保暖（12-2月）
    if (month === 12 || month <= 2) {
      return {
        id: `seasonal-${Date.now()}`,
        type: 'seasonal',
        title: '冬季保暖提醒',
        description: '天气寒冷，注意给毛孩子保暖，避免着凉',
        confidence: 95,
        timeframe: '本冬季',
        icon: 'moon',
        action: '查看保暖指南',
        reason: '基于当前季节（冬季）'
      };
    }
    
    // 换毛季（3-5月，9-11月）
    if ((month >= 3 && month <= 5) || (month >= 9 && month <= 11)) {
      return {
        id: `seasonal-${Date.now()}`,
        type: 'seasonal',
        title: '换毛期护理',
        description: '现在是换毛季节，建议增加梳毛频率，帮助毛孩子顺利换毛',
        confidence: 90,
        timeframe: '本月',
        icon: 'wind',
        action: '查看换毛护理',
        reason: '基于当前季节（换毛期）'
      };
    }

    return null;
  }

  // 预测情绪趋势
  private predictEmotionTrend(data: HealthData): Prediction | null {
    if (data.emotionHistory.length < 3) return null;

    const recent = data.emotionHistory.slice(0, 5);
    const older = data.emotionHistory.slice(5, 10);

    if (older.length === 0) return null;

    // 计算情绪变化趋势
    const recentPositive = recent.filter(e => 
      ['happy', 'excited', 'calm', 'safe'].includes(e.primaryEmotion)
    ).length;
    
    const olderPositive = older.filter(e => 
      ['happy', 'excited', 'calm', 'safe'].includes(e.primaryEmotion)
    ).length;

    const recentRatio = recentPositive / recent.length;
    const olderRatio = olderPositive / older.length;
    const trend = recentRatio - olderRatio;

    if (trend > 0.2) {
      return {
        id: `emotion-${Date.now()}`,
        type: 'behavior',
        title: '情绪趋势向好',
        description: '近期情绪记录显示毛孩子的心情正在改善',
        confidence: Math.min(85, 70 + trend * 50),
        timeframe: '近期',
        icon: 'trend',
        action: '查看详细分析',
        reason: `积极情绪比例从${Math.round(olderRatio * 100)}%上升到${Math.round(recentRatio * 100)}%`
      };
    } else if (trend < -0.2) {
      return {
        id: `emotion-${Date.now()}`,
        type: 'behavior',
        title: '情绪趋势下降',
        description: '近期情绪记录显示毛孩子的心情有所下降，建议多关注',
        confidence: Math.min(85, 70 + Math.abs(trend) * 50),
        timeframe: '近期',
        icon: 'alert',
        action: '查看详细分析',
        reason: `积极情绪比例从${Math.round(olderRatio * 100)}%下降到${Math.round(recentRatio * 100)}%`
      };
    }

    return null;
  }

  // 默认预测（当无法获取数据时使用）
  private getDefaultPredictions(): Prediction[] {
    const now = new Date();
    const month = now.getMonth() + 1;
    
    const defaults: Prediction[] = [
      {
        id: 'default-1',
        type: 'care',
        title: '定期健康检查',
        description: '建议定期记录毛孩子的健康状况，建立健康档案',
        confidence: 80,
        timeframe: '建议',
        icon: 'calendar',
        action: '添加健康记录',
        reason: '基于健康管理最佳实践'
      }
    ];

    // 根据季节添加默认提醒
    if (month >= 6 && month <= 8) {
      defaults.push({
        id: 'default-2',
        type: 'seasonal',
        title: '夏季注意事项',
        description: '夏季高温，注意防暑降温，避免中暑',
        confidence: 90,
        timeframe: '本夏季',
        icon: 'sun',
        action: '了解更多',
        reason: '基于当前季节'
      });
    }

    return defaults;
  }
}

export const realPredictionService = new RealPredictionService();
