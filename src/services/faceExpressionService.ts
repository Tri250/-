// ============================================
// PawSync Pro 3.0 - Face Expression Service
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 面部表情分析模块 - MediaPipe Face Mesh集成
// ============================================

import type { FaceExpression, FaceAnalysis, FacialLandmark, ExpressionConfig } from '../types/face';

const MOCK_DELAY = 800;

// 表情配置
const expressionConfig: Record<FaceExpression, ExpressionConfig> = {
  relaxed: {
    label: '放松',
    emoji: '😌',
    color: '#22C55E',
    description: '面部肌肉放松，表情自然，宠物处于舒适状态',
    features: ['眼睛自然张开', '嘴巴放松闭合', '耳朵自然下垂']
  },
  tense: {
    label: '紧张',
    emoji: '😰',
    color: '#F97316',
    description: '面部肌肉紧绷，可能感到紧张或不安',
    features: ['瞳孔收缩', '耳朵向后贴', '身体僵硬']
  },
  pain: {
    label: '痛苦',
    emoji: '😣',
    color: '#EF4444',
    description: '表情痛苦，可能身体不适或受伤',
    features: ['眯眼', '嘴巴微张', '耳朵下垂']
  },
  happy: {
    label: '开心',
    emoji: '😸',
    color: '#10B981',
    description: '表情愉悦，宠物感到开心满足',
    features: ['眼睛明亮', '嘴巴张开', '耳朵竖起']
  },
  curious: {
    label: '好奇',
    emoji: '🤔',
    color: '#8B5CF6',
    description: '表情好奇，对周围环境感兴趣',
    features: ['耳朵向前', '眼睛睁大', '头部抬起']
  },
  aggressive: {
    label: '攻击性',
    emoji: '😾',
    color: '#DC2626',
    description: '表情具有攻击性，可能正在发出警告',
    features: ['耳朵向后贴', '露出牙齿', '瞳孔放大']
  }
};

// 动物面部关键点索引映射（简化版，针对猫狗面部特征）
const PET_FACE_LANDMARKS = {
  cat: {
    leftEye: [33, 133],
    rightEye: [362, 263],
    nose: [4],
    mouth: [61, 291],
    leftEar: [137, 152],
    rightEar: [366, 381],
    whiskerLeft: [123, 147, 162],
    whiskerRight: [352, 376, 391],
    jawline: [175, 152, 136, 149]
  },
  dog: {
    leftEye: [33, 133],
    rightEye: [362, 263],
    nose: [4],
    mouth: [61, 291, 0, 17],
    leftEar: [137, 152],
    rightEar: [366, 381],
    snout: [195, 409, 2, 5],
    eyebrows: [70, 63, 105, 66, 107]
  }
};

class FaceExpressionService {
  private faceAnalyses: FaceAnalysis[] = [];
  private isAnalyzing = false;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const expressions: FaceExpression[] = ['relaxed', 'happy', 'curious', 'relaxed', 'tense'];
    
    for (let i = 0; i < 8; i++) {
      const expression = expressions[i % expressions.length];
      const config = expressionConfig[expression];
      
      this.faceAnalyses.push({
        id: `face-analysis-${i}`,
        petId: '1',
        timestamp: new Date(Date.now() - i * 7200000).toISOString(),
        expression,
        confidence: 0.75 + Math.random() * 0.24,
        petType: i % 2 === 0 ? 'cat' : 'dog',
        landmarks: this.generateMockLandmarks(),
        features: config.features.slice(0, 2),
        description: config.description,
        imageUrl: `https://picsum.photos/seed/face${i}/400/300`
      });
    }
  }

  private generateMockLandmarks(): FacialLandmark[] {
    const landmarks: FacialLandmark[] = [];
    
    // 眼睛关键点
    landmarks.push(
      { x: 0.35, y: 0.42, z: -0.05, name: 'leftEyeInner' },
      { x: 0.38, y: 0.41, z: -0.06, name: 'leftEyeTop' },
      { x: 0.41, y: 0.42, z: -0.05, name: 'leftEyeOuter' },
      { x: 0.38, y: 0.44, z: -0.04, name: 'leftEyeBottom' },
      { x: 0.62, y: 0.42, z: -0.05, name: 'rightEyeInner' },
      { x: 0.65, y: 0.41, z: -0.06, name: 'rightEyeTop' },
      { x: 0.68, y: 0.42, z: -0.05, name: 'rightEyeOuter' },
      { x: 0.65, y: 0.44, z: -0.04, name: 'rightEyeBottom' }
    );

    // 鼻子关键点
    landmarks.push(
      { x: 0.5, y: 0.52, z: -0.08, name: 'noseTip' },
      { x: 0.48, y: 0.5, z: -0.06, name: 'noseLeft' },
      { x: 0.52, y: 0.5, z: -0.06, name: 'noseRight' }
    );

    // 嘴巴关键点
    landmarks.push(
      { x: 0.42, y: 0.62, z: -0.05, name: 'mouthLeft' },
      { x: 0.5, y: 0.64, z: -0.06, name: 'mouthTop' },
      { x: 0.58, y: 0.62, z: -0.05, name: 'mouthRight' },
      { x: 0.5, y: 0.68, z: -0.04, name: 'mouthBottom' }
    );

    // 耳朵关键点
    landmarks.push(
      { x: 0.22, y: 0.35, z: -0.15, name: 'leftEarTop' },
      { x: 0.78, y: 0.35, z: -0.15, name: 'rightEarTop' },
      { x: 0.25, y: 0.45, z: -0.1, name: 'leftEarBottom' },
      { x: 0.75, y: 0.45, z: -0.1, name: 'rightEarBottom' }
    );

    return landmarks;
  }

  // 初始化面部分析
  async initialize(): Promise<void> {
    await this.simulateDelay(MOCK_DELAY);
    console.log('Face expression service initialized');
  }

  // 分析面部图像
  async analyzeFace(imageData: ImageData, petType: 'cat' | 'dog'): Promise<FaceAnalysis> {
    await this.simulateDelay(MOCK_DELAY);

    const expressions: FaceExpression[] = ['relaxed', 'happy', 'curious', 'tense', 'pain', 'aggressive'];
    const expression = expressions[Math.floor(Math.random() * expressions.length)];
    const config = expressionConfig[expression];

    const analysis: FaceAnalysis = {
      id: `face-analysis-${Date.now()}`,
      petId: '1',
      timestamp: new Date().toISOString(),
      expression,
      confidence: 0.7 + Math.random() * 0.29,
      petType,
      landmarks: this.generateMockLandmarks(),
      features: config.features.slice(0, Math.floor(Math.random() * 2) + 1),
      description: config.description,
      imageUrl: `https://picsum.photos/seed/${Date.now()}/400/300`
    };

    this.faceAnalyses.unshift(analysis);
    if (this.faceAnalyses.length > 50) {
      this.faceAnalyses.pop();
    }

    return analysis;
  }

  // 检测眼睛状态
  private detectEyeState(landmarks: FacialLandmark[]): { leftEyeOpen: number; rightEyeOpen: number } {
    const leftEyeTop = landmarks.find(l => l.name === 'leftEyeTop');
    const leftEyeBottom = landmarks.find(l => l.name === 'leftEyeBottom');
    const rightEyeTop = landmarks.find(l => l.name === 'rightEyeTop');
    const rightEyeBottom = landmarks.find(l => l.name === 'rightEyeBottom');

    const leftOpen = leftEyeTop && leftEyeBottom 
      ? Math.abs(leftEyeBottom.y - leftEyeTop.y) * 10 
      : 0.5;
    const rightOpen = rightEyeTop && rightEyeBottom 
      ? Math.abs(rightEyeBottom.y - rightEyeTop.y) * 10 
      : 0.5;

    return {
      leftEyeOpen: Math.min(Math.max(leftOpen, 0), 1),
      rightEyeOpen: Math.min(Math.max(rightOpen, 0), 1)
    };
  }

  // 检测嘴巴状态
  private detectMouthState(landmarks: FacialLandmark[]): { mouthOpen: number; smiling: number } {
    const mouthTop = landmarks.find(l => l.name === 'mouthTop');
    const mouthBottom = landmarks.find(l => l.name === 'mouthBottom');
    const mouthLeft = landmarks.find(l => l.name === 'mouthLeft');
    const mouthRight = landmarks.find(l => l.name === 'mouthRight');

    const mouthOpen = mouthTop && mouthBottom 
      ? Math.abs(mouthBottom.y - mouthTop.y) * 8 
      : 0.3;
    const width = mouthLeft && mouthRight 
      ? Math.abs(mouthRight.x - mouthLeft.x) * 5 
      : 0.4;

    return {
      mouthOpen: Math.min(Math.max(mouthOpen, 0), 1),
      smiling: width > 0.5 ? 0.7 + Math.random() * 0.3 : Math.random() * 0.5
    };
  }

  // 检测耳朵状态
  private detectEarState(landmarks: FacialLandmark[], petType: 'cat' | 'dog'): { 
    leftEarPosition: 'forward' | 'neutral' | 'backward';
    rightEarPosition: 'forward' | 'neutral' | 'backward';
  } {
    const leftEarTop = landmarks.find(l => l.name === 'leftEarTop');
    const rightEarTop = landmarks.find(l => l.name === 'rightEarTop');
    const noseTip = landmarks.find(l => l.name === 'noseTip');

    if (!leftEarTop || !rightEarTop || !noseTip) {
      return { leftEarPosition: 'neutral', rightEarPosition: 'neutral' };
    }

    const positions: Array<'forward' | 'neutral' | 'backward'> = ['forward', 'neutral', 'backward'];
    
    return {
      leftEarPosition: positions[Math.floor(Math.random() * positions.length)],
      rightEarPosition: positions[Math.floor(Math.random() * positions.length)]
    };
  }

  // 获取面部分析历史
  async getFaceAnalysisHistory(petId: string, limit: number = 20): Promise<FaceAnalysis[]> {
    await this.simulateDelay(300);
    return this.faceAnalyses.filter(a => a.petId === petId).slice(0, limit);
  }

  // 获取表情统计
  async getExpressionStatistics(petId: string, hours: number = 24): Promise<Record<FaceExpression, number>> {
    await this.simulateDelay(300);

    const result: Record<FaceExpression, number> = {
      relaxed: 0,
      tense: 0,
      pain: 0,
      happy: 0,
      curious: 0,
      aggressive: 0
    };

    const cutoffTime = Date.now() - hours * 3600000;
    const recentAnalyses = this.faceAnalyses.filter(
      a => a.petId === petId && new Date(a.timestamp).getTime() > cutoffTime
    );

    recentAnalyses.forEach(analysis => {
      result[analysis.expression]++;
    });

    return result;
  }

  // 获取表情配置
  getExpressionConfig(expression: FaceExpression): ExpressionConfig {
    return expressionConfig[expression];
  }

  // 获取所有表情类型
  getExpressionTypes(): FaceExpression[] {
    return Object.keys(expressionConfig) as FaceExpression[];
  }

  // 根据特征推断表情
  private inferExpression(
    eyeState: { leftEyeOpen: number; rightEyeOpen: number },
    mouthState: { mouthOpen: number; smiling: number },
    earState: { leftEarPosition: string; rightEarPosition: string }
  ): FaceExpression {
    if (mouthState.smiling > 0.6 && eyeState.leftEyeOpen > 0.6) {
      return 'happy';
    }
    if (mouthState.mouthOpen > 0.7 || (earState.leftEarPosition === 'backward' && earState.rightEarPosition === 'backward')) {
      return 'aggressive';
    }
    if (eyeState.leftEyeOpen < 0.3 || eyeState.rightEyeOpen < 0.3) {
      return 'pain';
    }
    if (earState.leftEarPosition === 'forward' || earState.rightEarPosition === 'forward') {
      return 'curious';
    }
    if (earState.leftEarPosition === 'backward' || earState.rightEarPosition === 'backward') {
      return 'tense';
    }
    return 'relaxed';
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const faceExpressionService = new FaceExpressionService();