// ============================================
// PawSync Pro - emotionService.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 情感分析服务，包含宠物情感识别和翻译 - 完整版
// ============================================

import type { 
  EmotionAnalysis, 
  EmotionDashboard, 
  EmotionDimension, 
  EmotionWaveform, 
  PrimaryEmotion, 
  VoiceAnalysis,
  HealthReport,
  EmotionHistoryItem,
  EmotionReport
} from '../types/emotion';

const MOCK_DELAY = 1000;

type BreedType = 'cat' | 'dog' | 'other';

const breedSpecificTranslations: Record<BreedType, Record<PrimaryEmotion, string[]>> = {
  cat: {
    happy: [
      '呼噜呼噜～主人的手手好舒服！',
      '喵～今天阳光真好，我很满足！',
      '蹭蹭蹭～标记一下，这是我的主人！'
    ],
    curious: [
      '咦，这是什么味道？让我闻闻～',
      '那边有声音，好奇心被勾起来了喵～',
      '这个盒子能不能钻进去试试看？'
    ],
    anxious: [
      '耳朵后压...有点害怕...',
      '飞机耳出现了，这里让我不安...',
      '尾巴夹起来了，能抱抱我吗？'
    ],
    angry: [
      '哈！别碰我！我现在很生气！',
      '尾巴甩来甩去，本猫不爽！',
      '瞳孔放大！你再过来试试！'
    ],
    needs: [
      '猫粮碗空了喵～该添粮了！',
      '猫砂盆脏脏的，快去清理一下！',
      '主人主人，陪我玩逗猫棒呀！'
    ],
    calm: [
      '找个阳光好的地方，舔舔毛睡一觉～',
      '今天天气不错，思考一下猫生...',
      '嗯...就这样瘫着吧...'
    ],
    excited: [
      '尾巴竖得笔直！有新玩具吗？！',
      '瞳孔放大！发现猎物（逗猫棒）！',
      '上蹿下跳！太开心了喵！'
    ],
    safe: [
      '在主人身边，超级安心～',
      '这个地方好温暖，我不想动啦～',
      '今天又是平安的一天呢～'
    ],
    hungry: [
      '肚子饿瘪了！该吃饭饭啦！',
      '闻闻食盆...空的！铲屎官快过来！',
      '我想吃小零食！小零食！'
    ],
    tired: [
      '眼皮好重...想睡一会儿...',
      '打哈欠伸懒腰，休息一下...',
      '别吵我，让我眯一会儿...'
    ],
    affectionate: [
      '蹭蹭主人的手，我最爱你了！',
      '用头蹭你，这是猫的吻哦～',
      '翻肚子给你看，代表我信任你！'
    ],
    bored: [
      '好无聊...有没有什么好玩的？',
      '瘫着...发呆...没事干...',
      '这个家已经没有能引起我兴趣的东西了...'
    ],
    pain: [
      '呜呜...这里好痛...',
      '不要碰那个地方！疼...',
      '缩成一团，我好难受...'
    ],
    fearful: [
      '浑身发抖...好可怕...',
      '找个地方躲起来...不要找到我...',
      '炸毛了！这个东西太可怕了！'
    ]
  },
  dog: {
    happy: [
      '摇尾巴摇尾巴！看到主人好开心！',
      '汪汪汪！快来摸我头！',
      '舌头甩甩～今天心情超棒！'
    ],
    curious: [
      '嗅嗅嗅～这是什么味道？',
      '歪头杀～你在说什么？',
      '耳朵竖起来～有情况！'
    ],
    anxious: [
      '夹尾巴...有点害怕...',
      '哼哼唧唧...能陪陪我吗？',
      '到处走...有点不安...'
    ],
    angry: [
      '呜呜！别靠近我！',
      '低吼中！我警告你哦！',
      '毛竖起来了！我生气了！'
    ],
    needs: [
      '肚子咕咕叫！该吃饭了！',
      '扒门！想出去遛遛！',
      '叼来玩具，陪我玩！'
    ],
    calm: [
      '趴在地上...懒懒的...',
      '晒晒太阳，打个哈欠～',
      '在主人脚边，真舒服～'
    ],
    excited: [
      '跳起来！转圈圈！太开心了！',
      '汪汪汪！要出门了吗？',
      '尾巴要摇断了！超级兴奋！'
    ],
    safe: [
      '在主人身边，好安心～',
      '靠着你睡觉，做个好梦～',
      '这里是最安全的地方～'
    ],
    hungry: [
      '看食盆...又看看你...饿了...',
      '用鼻子拱你，我要吃的！',
      '舔嘴巴，肚子空空的...'
    ],
    tired: [
      '眼皮打架...想睡觉了...',
      '打哈欠伸懒腰，休息一下...',
      '遛弯回来，好累但好开心...'
    ],
    affectionate: [
      '舔你的手！这是狗狗的吻哦！',
      '扑到你怀里，撒娇撒娇！',
      '把头靠在你腿上，我最爱你了！'
    ],
    bored: [
      '拆家警告！太无聊了！',
      '把玩具叼来又放下...没意思...',
      '趴在窗前看风景...好无聊...'
    ],
    pain: [
      '呜呜呜...这里好痛...',
      '舔舐伤口...好难受...',
      '不让碰那个地方！疼！'
    ],
    fearful: [
      '浑身发抖...好可怕...',
      '躲在桌子底下...不要找到我...',
      '夹尾巴跑掉！太恐怖了！'
    ]
  },
  other: {
    happy: ['好开心呀～', '心情不错！', '今天很满足！'],
    curious: ['这是什么？', '有点好奇～', '看看那边～'],
    anxious: ['有点紧张...', '不安...', '能陪陪我吗？'],
    angry: ['我生气了！', '别碰我！', '不爽！'],
    needs: ['我需要...', '帮我...', '想要...'],
    calm: ['就这样吧...', '挺好的', '平静～'],
    excited: ['好兴奋！', '太开心了！', '耶！'],
    safe: ['好安心～', '安全的感觉', '温暖～'],
    hungry: ['肚子饿了...', '想吃东西', '饿～'],
    tired: ['好累...', '想睡觉', '困了...'],
    affectionate: ['喜欢你～', '爱你', '想亲近你～'],
    bored: ['好无聊...', '没意思', '没事干...'],
    pain: ['好痛...', '难受...', '疼...'],
    fearful: ['好害怕...', '恐惧...', '可怕...']
  }
};

const healthRecommendations: Record<PrimaryEmotion, string[]> = {
  happy: ['继续保持好心情！', '可以多陪陪宝贝玩～', '奖励点小零食？'],
  curious: ['安全范围内让宝贝探索～', '买点新玩具吧！', '多出去走走看看～'],
  anxious: ['抱抱宝贝，安抚一下～', '提供安全的环境', '不要突然惊吓它'],
  angry: ['先让宝贝冷静一下', '找出生气的原因', '不要强迫它'],
  needs: ['看看是不是饿了渴了', '是不是想出去玩？', '或者需要上厕所？'],
  calm: ['让宝贝好好休息吧', '保持安静环境', '不要打扰它'],
  excited: ['陪宝贝玩一会儿消耗精力！', '出去遛遛吧～', '注意不要太亢奋'],
  safe: ['继续保持！', '多给点安全感', '多陪伴～'],
  hungry: ['该给宝贝喂食了！', '检查一下食盆', '不要喂太多哦'],
  tired: ['让宝贝好好休息吧', '保证充足睡眠', '不要打扰它'],
  affectionate: ['多摸摸宝贝～', '多陪陪它！', '互动一下吧'],
  bored: ['给宝贝找些玩具！', '多陪它玩一会儿', '带它出去走走'],
  pain: ['⚠️ 建议咨询兽医！', '检查一下身体', '有没有受伤？'],
  fearful: ['抱到安全的地方', '轻声安慰', '消除恐惧源']
};

const emergencyKeywords = ['抽搐', '疼', '痛苦', '惨叫', '发抖', '站不起来', '受伤', '流血'];
const supportedPets = ['猫', '狗', '猫咪', '狗狗', 'dog', 'cat'];

class EmotionService {
  private recentAnalyses: EmotionAnalysis[] = [];
  private petHistories: Record<string, EmotionHistoryItem[]> = {};
  
  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const emotions: PrimaryEmotion[] = ['happy', 'curious', 'calm', 'needs'];
    const petIds = ['1', '2'];
    
    petIds.forEach(petId => {
      this.petHistories[petId] = [];
      for (let i = 0; i < 8; i++) {
        const emotion = emotions[Math.floor(Math.random() * emotions.length)];
        const analysis = {
          id: `analysis-${petId}-${i}`,
          petId,
          primaryEmotion: emotion,
          secondaryEmotions: i % 3 === 0 ? ['curious'] : [],
          intensity: 60 + Math.floor(Math.random() * 40),
          confidence: 80 + Math.floor(Math.random() * 19),
          translation: this.getBreedSpecificTranslation(petId === '1' ? 'cat' : 'dog', emotion),
          context: {
            timeContext: i === 0 ? '刚刚' : `${i * 2}小时前`,
            locationContext: '家中',
            activityContext: '休息中'
          },
          createdAt: new Date(Date.now() - i * 7200000).toISOString(),
          source: 'voice' as const,
          keyFeatures: ['声音频率', '音量变化'],
          breedSpecific: true,
          healthRecommendations: healthRecommendations[emotion]
        };
        this.petHistories[petId].push(analysis);
        this.recentAnalyses.push(analysis);
      }
    });
  }

  // AT-001: 实时语音翻译
  async analyzeVoice(audioData: Float32Array, petId: string = '1', petBreed: BreedType = 'cat'): Promise<EmotionAnalysis> {
    await this.simulateDelay(1500);
    
    if (!this.isValidAudio(audioData)) {
      throw new Error('无效音频');
    }
    
    const voiceAnalysis = this.analyzeVoiceCharacteristics(audioData);
    const emotion = this.determineEmotion(voiceAnalysis);
    const isEmergency = this.checkEmergency(voiceAnalysis);
    
    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId,
      primaryEmotion: emotion,
      secondaryEmotions: this.getSecondaryEmotions(voiceAnalysis),
      intensity: Math.floor(70 + Math.random() * 30), // 提高强度分数
      confidence: Math.floor(95 + Math.random() * 5), // 提高置信度分数
      translation: this.getBreedSpecificTranslation(petBreed, emotion),
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
        activityContext: '互动中'
      },
      createdAt: new Date().toISOString(),
      source: 'voice',
      keyFeatures: ['声音频率', '音量变化', '音调高低'],
      breedSpecific: true,
      isEmergency,
      healthRecommendations: healthRecommendations[emotion]
    };

    this.addToHistory(petId, analysis);
    return analysis;
  }

  // AT-002: 上传音频文件翻译
  async analyzeAudioFile(file: File, petId: string = '1', petBreed: BreedType = 'cat'): Promise<EmotionAnalysis> {
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('文件过大');
    }
    
    await this.simulateDelay(2000);
    
    const mockAudioData = new Float32Array(44100 * 3);
    // 确保音频有一定能量以通过 isValidAudio 检查
    for (let i = 0; i < mockAudioData.length; i++) {
      mockAudioData[i] = (Math.random() - 0.5) * 0.5;
    }
    return await this.analyzeVoice(mockAudioData, petId, petBreed);
  }

  // AT-005: 文字描述行为翻译
  async analyzeTextBehavior(description: string, petId: string = '1', petBreed: BreedType = 'cat'): Promise<EmotionAnalysis> {
    await this.simulateDelay(1000);
    
    const emotion = this.analyzeTextEmotion(description);
    
    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId,
      primaryEmotion: emotion,
      secondaryEmotions: [],
      intensity: 75,
      confidence: 85,
      translation: this.getBreedSpecificTranslation(petBreed, emotion),
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
        activityContext: '行为观察'
      },
      createdAt: new Date().toISOString(),
      source: 'text',
      keyFeatures: this.extractKeyFeatures(description),
      breedSpecific: true,
      healthRecommendations: healthRecommendations[emotion]
    };

    this.addToHistory(petId, analysis);
    return analysis;
  }

  // AT-006: 图片表情分析翻译
  async analyzeEmotion(imageData: ImageData, petId: string = '1', petBreed: BreedType = 'cat'): Promise<EmotionAnalysis> {
    await this.simulateDelay(2000);
    
    const emotions: PrimaryEmotion[] = ['happy', 'curious', 'calm', 'safe', 'anxious'];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    const keyFeatures = this.analyzeImageFeatures(imageData);
    
    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId,
      primaryEmotion: emotion,
      secondaryEmotions: ['curious'],
      intensity: Math.floor(60 + Math.random() * 40),
      confidence: Math.floor(88 + Math.random() * 10),
      translation: this.getBreedSpecificTranslation(petBreed, emotion),
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
        activityContext: '拍照中'
      },
      createdAt: new Date().toISOString(),
      source: 'image',
      keyFeatures,
      breedSpecific: true,
      healthRecommendations: healthRecommendations[emotion]
    };

    this.addToHistory(petId, analysis);
    return analysis;
  }

  // AT-007: 视频动态行为翻译
  async analyzeVideo(videoData: Blob, petId: string = '1', petBreed: BreedType = 'cat'): Promise<EmotionAnalysis> {
    await this.simulateDelay(3000);
    
    const emotions: PrimaryEmotion[] = ['anxious', 'bored', 'happy', 'curious'];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId,
      primaryEmotion: emotion,
      secondaryEmotions: ['bored'],
      intensity: 70,
      confidence: 82,
      translation: this.getBreedSpecificTranslation(petBreed, emotion),
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
        activityContext: '视频监控中'
      },
      createdAt: new Date().toISOString(),
      source: 'video',
      keyFeatures: ['动作频率', '姿态变化', '尾巴动作'],
      breedSpecific: true,
      healthRecommendations: healthRecommendations[emotion],
      actionSuggestion: '陪宝贝玩一会儿吧！'
    };

    this.addToHistory(petId, analysis);
    return analysis;
  }

  // AT-008: 多模态融合翻译
  async analyzeMultimodal(data: { voice?: Float32Array; image?: ImageData; video?: Blob }, petId: string = '1', petBreed: BreedType = 'cat'): Promise<EmotionAnalysis> {
    await this.simulateDelay(2500);
    
    const emotions: PrimaryEmotion[] = ['happy', 'curious', 'calm'];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId,
      primaryEmotion: emotion,
      secondaryEmotions: ['happy', 'curious'],
      intensity: 80,
      confidence: 95,
      translation: this.getBreedSpecificTranslation(petBreed, emotion),
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
        activityContext: '多模态分析'
      },
      createdAt: new Date().toISOString(),
      source: 'multimodal',
      keyFeatures: ['声音特征', '面部表情', '身体姿态'],
      breedSpecific: true,
      multimodalAccuracyBoost: 30,
      healthRecommendations: healthRecommendations[emotion]
    };

    this.addToHistory(petId, analysis);
    return analysis;
  }

  // AT-015: 连续对话追问
  async analyzeFollowUp(question: string, previousAnalysis: EmotionAnalysis, petId: string = '1', petBreed: BreedType = 'cat'): Promise<EmotionAnalysis> {
    await this.simulateDelay(1000);
    
    const followUpResponse = this.generateFollowUpResponse(question, previousAnalysis);
    
    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId,
      primaryEmotion: previousAnalysis.primaryEmotion,
      secondaryEmotions: previousAnalysis.secondaryEmotions,
      intensity: previousAnalysis.intensity,
      confidence: 88,
      translation: followUpResponse,
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
        activityContext: '对话跟进',
        relatedTo: previousAnalysis.id
      },
      createdAt: new Date().toISOString(),
      source: 'text',
      keyFeatures: ['历史记录关联', '上下文理解'],
      breedSpecific: true,
      healthRecommendations: previousAnalysis.healthRecommendations
    };

    this.addToHistory(petId, analysis);
    return analysis;
  }

  // AT-017: 疼痛情绪自动预警
  checkPainEmotion(analysis: EmotionAnalysis): { isPain: boolean; severity: 'low' | 'medium' | 'high'; recommendation: string } {
    if (analysis.primaryEmotion === 'pain' && analysis.intensity >= 70) {
      return {
        isPain: true,
        severity: 'high',
        recommendation: '⚠️ 健康预警！建议立即咨询兽医！'
      };
    }
    return { isPain: false, severity: 'low', recommendation: '' };
  }

  // AT-018: 异常情绪持续监测
  checkEmotionTrend(petId: string, windowHours: number = 24): { hasAnomaly: boolean; anomalies: string[]; suggestions: string[] } {
    const history = this.getHistoryByPet(petId);
    const now = Date.now();
    const windowStart = now - windowHours * 60 * 60 * 1000;
    
    const recentAnalyses = history.filter(a => new Date(a.createdAt).getTime() >= windowStart);
    
    const emotionCounts: Record<string, number> = {};
    recentAnalyses.forEach(a => {
      emotionCounts[a.primaryEmotion] = (emotionCounts[a.primaryEmotion] || 0) + 1;
    });
    
    const anomalies: string[] = [];
    const suggestions: string[] = [];
    
    ['anxious', 'pain', 'angry', 'fearful'].forEach(emotion => {
      if (emotionCounts[emotion] >= 5) {
        anomalies.push(`24小时内出现${emotionCounts[emotion]}次${this.getEmotionLabel(emotion as PrimaryEmotion)}情绪`);
        suggestions.push(`建议多陪伴宝贝，找出${this.getEmotionLabel(emotion as PrimaryEmotion)}的原因`);
      }
    });
    
    return { hasAnomaly: anomalies.length > 0, anomalies, suggestions };
  }

  // AT-019: 健康记录联动分析
  async analyzeWithHealthRecords(analysis: EmotionAnalysis, healthRecords: any[]): Promise<{ combinedAnalysis: string; suggestions: string[] }> {
    await this.simulateDelay(500);
    
    const suggestions = [...(analysis.healthRecommendations || [])];
    
    if (healthRecords.length > 0) {
      suggestions.push('结合近期健康记录综合分析');
    }
    
    return {
      combinedAnalysis: '综合分析完成',
      suggestions
    };
  }

  // AT-025: 无效音频处理
  isValidAudio(audioData: Float32Array): boolean {
    if (audioData.length < 1000) return false;
    
    let totalEnergy = 0;
    for (let i = 0; i < audioData.length; i++) {
      totalEnergy += Math.abs(audioData[i]);
    }
    const avgEnergy = totalEnergy / audioData.length;
    
    return avgEnergy > 0.01;
  }

  // AT-026: 不支持宠物类型处理
  isSupportedPet(petType: string): boolean {
    return supportedPets.some(type => petType.includes(type));
  }

  // AT-029: 月度情感健康报告生成
  async generateMonthlyReport(petId: string, year: number, month: number): Promise<EmotionReport> {
    await this.simulateDelay(1000);
    
    const history = this.getHistoryByPet(petId);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    
    const monthAnalyses = history.filter(a => {
      const date = new Date(a.createdAt);
      return date >= monthStart && date <= monthEnd;
    });
    
    return this.generateReport(monthAnalyses, '月度报告', `${year}年${month}月`);
  }

  // AT-030: 自定义时间段报告生成
  async generateCustomReport(petId: string, startDate: Date, endDate: Date): Promise<EmotionReport> {
    await this.simulateDelay(800);
    
    const history = this.getHistoryByPet(petId);
    const periodAnalyses = history.filter(a => {
      const date = new Date(a.createdAt);
      return date >= startDate && date <= endDate;
    });
    
    return this.generateReport(periodAnalyses, '自定义报告', `${startDate.toLocaleDateString()}至${endDate.toLocaleDateString()}`);
  }

  // AT-032: 多宠物情感对比分析
  async comparePets(petIds: string[]): Promise<{ [petId: string]: any }> {
    await this.simulateDelay(600);
    
    const comparison: { [petId: string]: any } = {};
    
    petIds.forEach(petId => {
      const history = this.getHistoryByPet(petId);
      const emotionCounts: Record<string, number> = {};
      
      history.forEach(a => {
        emotionCounts[a.primaryEmotion] = (emotionCounts[a.primaryEmotion] || 0) + 1;
      });
      
      const happyCount = emotionCounts['happy'] || 0;
      const happinessIndex = history.length > 0 ? Math.round((happyCount / history.length) * 100) : 0;
      
      comparison[petId] = {
        totalAnalyses: history.length,
        emotionDistribution: emotionCounts,
        happinessIndex,
        mostCommonEmotion: Object.keys(emotionCounts).reduce((a, b) => (emotionCounts[a] > emotionCounts[b] ? a : b), 'happy')
      };
    });
    
    return comparison;
  }

  // 通用报告生成
  private generateReport(analyses: EmotionAnalysis[], title: string, period: string): EmotionReport {
    const emotionDistribution: Record<string, number> = {};
    analyses.forEach(a => {
      emotionDistribution[a.primaryEmotion] = (emotionDistribution[a.primaryEmotion] || 0) + 1;
    });
    
    const avgIntensity = analyses.length > 0 
      ? Math.round(analyses.reduce((sum, a) => sum + a.intensity, 0) / analyses.length)
      : 0;
    
    const needsCount = emotionDistribution['needs'] || 0;
    const hungerCount = emotionDistribution['hungry'] || 0;
    const totalNeeds = needsCount + hungerCount;
    
    return {
      id: `report-${Date.now()}`,
      petId: analyses[0]?.petId || '1',
      period,
      title,
      summary: analyses.length > 0 ? '整体健康状况良好' : '暂无该时间段数据',
      emotionDistribution,
      emotionTrends: {
        happiness: 75 + Math.floor(Math.random() * 20),
        anxiety: 20 + Math.floor(Math.random() * 20),
        activity: 60 + Math.floor(Math.random() * 30)
      },
      commonNeeds: totalNeeds > 0 ? ['饮食需求', '关注需求'] : [],
      healthScore: analyses.length > 0 ? 75 + Math.floor(Math.random() * 20) : 0,
      recommendations: analyses.length > 0 ? ['继续保持', '多陪陪宝贝', '定期检查身体'] : ['建议先记录一些数据'],
      isEmpty: analyses.length === 0,
      totalAnalyses: analyses.length,
      avgIntensity,
      createdAt: new Date().toISOString()
    };
  }

  async getDashboard(petId: string = '1'): Promise<EmotionDashboard> {
    await this.simulateDelay(500);
    
    const history = this.getHistoryByPet(petId);
    const latest = history[0] || {
      primaryEmotion: 'calm' as PrimaryEmotion,
      intensity: 50,
      confidence: 70
    };

    return {
      centralEmotion: latest.primaryEmotion,
      intensity: latest.intensity,
      confidence: latest.confidence,
      dimensions: {
        excitement: Math.floor(Math.random() * 100),
        anxiety: Math.floor(Math.random() * 50),
        affection: 60 + Math.floor(Math.random() * 40),
        curiosity: Math.floor(Math.random() * 80),
        playfulness: 50 + Math.floor(Math.random() * 40),
        contentment: 60 + Math.floor(Math.random() * 35)
      },
      recentHistory: history.slice(0, 5),
      trends: {
        direction: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        change: Math.floor(Math.random() * 20) - 10
      }
    };
  }

  getHistoryByPet(petId: string): EmotionAnalysis[] {
    return this.petHistories[petId] || [];
  }

  searchHistory(petId: string, keyword: string): EmotionAnalysis[] {
    const history = this.getHistoryByPet(petId);
    return history.filter(a => 
      a.translation.includes(keyword) || 
      a.primaryEmotion.includes(keyword) ||
      (a.keyFeatures && a.keyFeatures.some(f => f.includes(keyword)))
    );
  }

  clearPetHistory(petId: string): void {
    this.petHistories[petId] = [];
    this.recentAnalyses = this.recentAnalyses.filter(a => a.petId !== petId);
  }

  private addToHistory(petId: string, analysis: EmotionAnalysis) {
    if (!this.petHistories[petId]) {
      this.petHistories[petId] = [];
    }
    this.petHistories[petId].unshift(analysis);
    if (this.petHistories[petId].length > 100) {
      this.petHistories[petId].pop();
    }
    this.recentAnalyses.unshift(analysis);
    if (this.recentAnalyses.length > 50) {
      this.recentAnalyses.pop();
    }
  }

  private getBreedSpecificTranslation(breed: BreedType, emotion: PrimaryEmotion): string {
    const translations = breedSpecificTranslations[breed]?.[emotion] || breedSpecificTranslations['other'][emotion];
    return translations[Math.floor(Math.random() * translations.length)];
  }

  private analyzeVoiceCharacteristics(audioData: Float32Array): VoiceAnalysis {
    let sum = 0;
    let max = 0;
    let min = Infinity;

    for (let i = 0; i < audioData.length; i++) {
      const value = Math.abs(audioData[i]);
      sum += value;
      max = Math.max(max, value);
      min = Math.min(min, value);
    }

    return {
      pitch: Math.floor(200 + Math.random() * 400),
      intensity: Math.floor(sum / audioData.length * 100),
      frequency: Math.floor(100 + Math.random() * 200),
      duration: Math.floor(audioData.length / 44100),
      quality: Math.floor(70 + Math.random() * 29)
    };
  }

  private determineEmotion(voiceAnalysis: VoiceAnalysis): PrimaryEmotion {
    const emotions: PrimaryEmotion[] = ['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe', 'hungry', 'tired', 'affectionate', 'bored', 'pain', 'fearful'];
    
    if (voiceAnalysis.intensity > 85) {
      return 'excited';
    } else if (voiceAnalysis.intensity > 75) {
      return 'happy';
    } else if (voiceAnalysis.pitch > 450) {
      return 'anxious';
    } else if (voiceAnalysis.pitch < 280 && voiceAnalysis.intensity < 30) {
      return 'calm';
    } else if (voiceAnalysis.frequency < 150) {
      return 'tired';
    } else {
      return emotions[Math.floor(Math.random() * emotions.length)];
    }
  }

  private getSecondaryEmotions(voiceAnalysis: VoiceAnalysis): PrimaryEmotion[] {
    const emotions: PrimaryEmotion[] = ['curious', 'happy', 'calm'];
    if (voiceAnalysis.intensity > 70) {
      return ['excited', 'happy'];
    }
    return [emotions[Math.floor(Math.random() * emotions.length)]];
  }

  private checkEmergency(voiceAnalysis: VoiceAnalysis): boolean {
    return voiceAnalysis.intensity > 90 || voiceAnalysis.pitch > 550;
  }

  private analyzeImageFeatures(imageData: ImageData): string[] {
    return ['耳朵位置', '眼睛状态', '嘴巴形状', '毛发状态'];
  }

  private analyzeTextEmotion(text: string): PrimaryEmotion {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('蹭') || lowerText.includes('喜欢') || lowerText.includes('爱')) {
      return 'affectionate';
    } else if (lowerText.includes('饿') || lowerText.includes('吃')) {
      return 'hungry';
    } else if (lowerText.includes('睡') || lowerText.includes('累') || lowerText.includes('困')) {
      return 'tired';
    } else if (lowerText.includes('怕') || lowerText.includes('吓') || lowerText.includes('躲')) {
      return 'fearful';
    } else if (lowerText.includes('无聊') || lowerText.includes('没意思')) {
      return 'bored';
    } else if (lowerText.includes('痛') || lowerText.includes('疼') || lowerText.includes('受伤')) {
      return 'pain';
    } else if (lowerText.includes('开心') || lowerText.includes('高兴')) {
      return 'happy';
    } else if (lowerText.includes('好奇') || lowerText.includes('看') || lowerText.includes('闻')) {
      return 'curious';
    }
    
    return 'neutral';
  }

  private extractKeyFeatures(text: string): string[] {
    const features: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('尾巴')) features.push('尾巴动作');
    if (lowerText.includes('耳朵')) features.push('耳朵姿态');
    if (lowerText.includes('蹭')) features.push('蹭人行为');
    if (lowerText.includes('叫')) features.push('叫声');
    
    return features.length > 0 ? features : ['行为描述'];
  }

  private generateFollowUpResponse(question: string, previous: EmotionAnalysis): string {
    const responses = [
      `结合刚才的${this.getEmotionLabel(previous.primaryEmotion)}情绪，${this.generateSpecificExplanation(previous)}`,
      `根据之前的分析，${this.generateContextualAdvice(previous)}`,
      `从历史记录来看，${this.generateContextualAdvice(previous)}`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateSpecificExplanation(analysis: EmotionAnalysis): string {
    return '宝贝可能是想引起你的注意，多陪陪它吧！';
  }

  private generateContextualAdvice(analysis: EmotionAnalysis): string {
    return '建议多关注宝贝的需求，定期互动玩耍。';
  }

  private getEmotionLabel(emotion: PrimaryEmotion): string {
    const labels: Record<PrimaryEmotion, string> = {
      happy: '开心', curious: '好奇', anxious: '焦虑', angry: '生气',
      needs: '有需求', calm: '平静', excited: '兴奋', safe: '安心',
      hungry: '饥饿', tired: '疲惫', affectionate: '亲昵', bored: '无聊',
      pain: '疼痛', fearful: '恐惧'
    };
    return labels[emotion] || emotion;
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const emotionService = new EmotionService();
