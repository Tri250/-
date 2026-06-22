import { PawSyncCamera } from '../plugins';
import type { FaceExpression, FaceAnalysis, FacialLandmark, ExpressionConfig } from '../types/face';

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
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private animationFrameId: number | null = null;

  async initialize(): Promise<void> {
    console.log('Face expression service initialized');
  }

  async analyzeFace(imageData: ImageData, petType: 'cat' | 'dog'): Promise<FaceAnalysis> {
    const landmarks = this.extractLandmarks(imageData, petType);
    const eyeState = this.detectEyeState(landmarks);
    const mouthState = this.detectMouthState(landmarks);
    const earState = this.detectEarState(landmarks, petType);
    
    const expression = this.inferExpression(eyeState, mouthState, earState);
    const confidence = this.calculateConfidence(eyeState, mouthState, earState, expression);
    const config = expressionConfig[expression];
    
    const features = this.extractKeyFeatures(expression, eyeState, mouthState, earState);

    const analysis: FaceAnalysis = {
      id: `face-analysis-${Date.now()}`,
      petId: '1',
      timestamp: new Date().toISOString(),
      expression,
      confidence,
      petType,
      landmarks,
      features,
      description: config.description,
      imageUrl: this.generateImageUrl(imageData),
    };

    this.faceAnalyses.unshift(analysis);
    if (this.faceAnalyses.length > 50) {
      this.faceAnalyses.pop();
    }

    return analysis;
  }

  private extractLandmarks(imageData: ImageData, petType: 'cat' | 'dog'): FacialLandmark[] {
    const landmarks: FacialLandmark[] = [];
    const width = imageData.width;
    const height = imageData.height;
    
    const faceCenterX = width * 0.5;
    const faceCenterY = height * 0.45;
    
    const eyeOffsetX = width * 0.15;
    const eyeOffsetY = height * 0.12;
    
    const eyeOpenness = this.calculateEyeOpenness(imageData);
    const mouthOpenness = this.calculateMouthOpenness(imageData);
    const earPosition = this.detectEarPosition(imageData, petType);

    landmarks.push(
      { x: faceCenterX - eyeOffsetX, y: faceCenterY - eyeOffsetY, z: -0.05, name: 'leftEyeInner' },
      { x: faceCenterX - eyeOffsetX, y: faceCenterY - eyeOffsetY - eyeOpenness * 15, z: -0.06, name: 'leftEyeTop' },
      { x: faceCenterX - eyeOffsetX, y: faceCenterY - eyeOffsetY + eyeOpenness * 15, z: -0.05, name: 'leftEyeOuter' },
      { x: faceCenterX - eyeOffsetX, y: faceCenterY - eyeOffsetY + eyeOpenness * 10, z: -0.04, name: 'leftEyeBottom' },
      { x: faceCenterX + eyeOffsetX, y: faceCenterY - eyeOffsetY, z: -0.05, name: 'rightEyeInner' },
      { x: faceCenterX + eyeOffsetX, y: faceCenterY - eyeOffsetY - eyeOpenness * 15, z: -0.06, name: 'rightEyeTop' },
      { x: faceCenterX + eyeOffsetX, y: faceCenterY - eyeOffsetY + eyeOpenness * 15, z: -0.05, name: 'rightEyeOuter' },
      { x: faceCenterX + eyeOffsetX, y: faceCenterY - eyeOffsetY + eyeOpenness * 10, z: -0.04, name: 'rightEyeBottom' }
    );

    landmarks.push(
      { x: faceCenterX, y: faceCenterY + height * 0.08, z: -0.08, name: 'noseTip' },
      { x: faceCenterX - width * 0.03, y: faceCenterY + height * 0.05, z: -0.06, name: 'noseLeft' },
      { x: faceCenterX + width * 0.03, y: faceCenterY + height * 0.05, z: -0.06, name: 'noseRight' }
    );

    const mouthY = faceCenterY + height * 0.22;
    landmarks.push(
      { x: faceCenterX - width * 0.08, y: mouthY, z: -0.05, name: 'mouthLeft' },
      { x: faceCenterX, y: mouthY - mouthOpenness * 20, z: -0.06, name: 'mouthTop' },
      { x: faceCenterX + width * 0.08, y: mouthY, z: -0.05, name: 'mouthRight' },
      { x: faceCenterX, y: mouthY + mouthOpenness * 25, z: -0.04, name: 'mouthBottom' }
    );

    const earOffsetY = earPosition === 'forward' ? -height * 0.18 : earPosition === 'backward' ? height * 0.05 : -height * 0.12;
    landmarks.push(
      { x: width * 0.22, y: height * 0.25 + earOffsetY, z: -0.15, name: 'leftEarTop' },
      { x: width * 0.78, y: height * 0.25 + earOffsetY, z: -0.15, name: 'rightEarTop' },
      { x: width * 0.25, y: height * 0.4 + earOffsetY * 0.5, z: -0.1, name: 'leftEarBottom' },
      { x: width * 0.75, y: height * 0.4 + earOffsetY * 0.5, z: -0.1, name: 'rightEarBottom' }
    );

    return landmarks;
  }

  private calculateEyeOpenness(imageData: ImageData): number {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    const leftEyeRegion = {
      x: Math.floor(width * 0.3),
      y: Math.floor(height * 0.35),
      w: Math.floor(width * 0.12),
      h: Math.floor(height * 0.08)
    };
    
    const rightEyeRegion = {
      x: Math.floor(width * 0.58),
      y: Math.floor(height * 0.35),
      w: Math.floor(width * 0.12),
      h: Math.floor(height * 0.08)
    };
    
    const leftBrightness = this.calculateRegionBrightness(data, width, leftEyeRegion);
    const rightBrightness = this.calculateRegionBrightness(data, width, rightEyeRegion);
    
    const avgBrightness = (leftBrightness + rightBrightness) / 2;
    
    return Math.min(1, Math.max(0, (avgBrightness - 30) / 70));
  }

  private calculateMouthOpenness(imageData: ImageData): number {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    const mouthRegion = {
      x: Math.floor(width * 0.4),
      y: Math.floor(height * 0.55),
      w: Math.floor(width * 0.2),
      h: Math.floor(height * 0.15)
    };
    
    const mouthBrightness = this.calculateRegionBrightness(data, width, mouthRegion);
    const surroundingRegion = {
      x: Math.floor(width * 0.4),
      y: Math.floor(height * 0.45),
      w: Math.floor(width * 0.2),
      h: Math.floor(height * 0.08)
    };
    
    const surroundingBrightness = this.calculateRegionBrightness(data, width, surroundingRegion);
    
    const brightnessDiff = surroundingBrightness - mouthBrightness;
    
    return Math.min(1, Math.max(0, brightnessDiff / 50));
  }

  private detectEarPosition(imageData: ImageData, petType: 'cat' | 'dog'): 'forward' | 'neutral' | 'backward' {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    const leftEarRegion = {
      x: Math.floor(width * 0.15),
      y: Math.floor(height * 0.15),
      w: Math.floor(width * 0.12),
      h: Math.floor(height * 0.2)
    };
    
    const rightEarRegion = {
      x: Math.floor(width * 0.73),
      y: Math.floor(height * 0.15),
      w: Math.floor(width * 0.12),
      h: Math.floor(height * 0.2)
    };
    
    const leftEarBrightness = this.calculateRegionBrightness(data, width, leftEarRegion);
    const rightEarBrightness = this.calculateRegionBrightness(data, width, rightEarRegion);
    
    const avgEarBrightness = (leftEarBrightness + rightEarBrightness) / 2;
    
    if (avgEarBrightness > 120) return 'forward';
    if (avgEarBrightness < 70) return 'backward';
    return 'neutral';
  }

  private calculateRegionBrightness(data: Uint8ClampedArray, width: number, region: { x: number; y: number; w: number; h: number }): number {
    let totalBrightness = 0;
    let count = 0;
    
    for (let y = region.y; y < region.y + region.h; y++) {
      for (let x = region.x; x < region.x + region.w; x++) {
        if (y < 0 || y >= data.length / (width * 4) || x < 0 || x >= width) continue;
        
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        totalBrightness += (r + g + b) / 3;
        count++;
      }
    }
    
    return count > 0 ? totalBrightness / count : 0;
  }

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

    const leftEarY = leftEarTop.y;
    const rightEarY = rightEarTop.y;
    const noseY = noseTip.y;
    
    const earNoseDiff = (leftEarY + rightEarY) / 2 - noseY;
    
    if (earNoseDiff < -0.1) return { leftEarPosition: 'forward', rightEarPosition: 'forward' };
    if (earNoseDiff > 0.05) return { leftEarPosition: 'backward', rightEarPosition: 'backward' };
    
    return { leftEarPosition: 'neutral', rightEarPosition: 'neutral' };
  }

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

  private calculateConfidence(
    eyeState: { leftEyeOpen: number; rightEyeOpen: number },
    mouthState: { mouthOpen: number; smiling: number },
    earState: { leftEarPosition: string; rightEarPosition: string },
    expression: FaceExpression
  ): number {
    let confidence = 0.7;
    
    switch (expression) {
      case 'happy':
        if (mouthState.smiling > 0.7) confidence += 0.15;
        if (eyeState.leftEyeOpen > 0.7) confidence += 0.1;
        break;
      case 'aggressive':
        if (mouthState.mouthOpen > 0.8) confidence += 0.15;
        if (earState.leftEarPosition === 'backward' && earState.rightEarPosition === 'backward') confidence += 0.1;
        break;
      case 'pain':
        if (eyeState.leftEyeOpen < 0.2) confidence += 0.15;
        if (eyeState.rightEyeOpen < 0.2) confidence += 0.1;
        break;
      case 'curious':
        if (earState.leftEarPosition === 'forward' && earState.rightEarPosition === 'forward') confidence += 0.15;
        if (eyeState.leftEyeOpen > 0.8) confidence += 0.1;
        break;
      case 'tense':
        if (earState.leftEarPosition === 'backward') confidence += 0.08;
        if (earState.rightEarPosition === 'backward') confidence += 0.08;
        break;
      case 'relaxed':
        if (eyeState.leftEyeOpen > 0.4 && eyeState.leftEyeOpen < 0.7) confidence += 0.1;
        if (mouthState.mouthOpen < 0.3) confidence += 0.1;
        break;
    }
    
    return Math.min(0.99, confidence + Math.random() * 0.05);
  }

  private extractKeyFeatures(
    expression: FaceExpression,
    eyeState: { leftEyeOpen: number; rightEyeOpen: number },
    mouthState: { mouthOpen: number; smiling: number },
    earState: { leftEarPosition: string; rightEarPosition: string }
  ): string[] {
    const features: string[] = [];
    
    if (eyeState.leftEyeOpen > 0.7) features.push('眼睛睁大');
    else if (eyeState.leftEyeOpen < 0.3) features.push('眯眼');
    else features.push('眼睛自然张开');
    
    if (mouthState.mouthOpen > 0.6) features.push('嘴巴张开');
    else if (mouthState.mouthOpen < 0.2) features.push('嘴巴紧闭');
    else features.push('嘴巴放松闭合');
    
    if (earState.leftEarPosition === 'forward') features.push('耳朵向前');
    else if (earState.leftEarPosition === 'backward') features.push('耳朵向后贴');
    else features.push('耳朵自然下垂');
    
    return features.slice(0, 2);
  }

  private generateImageUrl(imageData: ImageData): string {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return '';
  }

  async startRealTimeAnalysis(videoElement: HTMLVideoElement, petType: 'cat' | 'dog', callback: (analysis: FaceAnalysis) => void): Promise<void> {
    this.isAnalyzing = true;
    this.videoElement = videoElement;
    
    const canvas = document.createElement('canvas');
    this.canvasElement = canvas;
    const ctx = canvas.getContext('2d');
    
    const analyze = async () => {
      if (!this.isAnalyzing || !this.videoElement || !ctx) return;
      
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;
      
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const analysis = await this.analyzeFace(imageData, petType);
        callback(analysis);
      } catch (error) {
        console.warn('Real-time analysis error:', error);
      }
      
      this.animationFrameId = requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  async stopRealTimeAnalysis(): Promise<void> {
    this.isAnalyzing = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.videoElement = null;
    this.canvasElement = null;
  }

  async getFaceAnalysisHistory(petId: string, limit: number = 20): Promise<FaceAnalysis[]> {
    return this.faceAnalyses.filter(a => a.petId === petId).slice(0, limit);
  }

  async getExpressionStatistics(petId: string, hours: number = 24): Promise<Record<FaceExpression, number>> {
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

  getExpressionConfig(expression: FaceExpression): ExpressionConfig {
    return expressionConfig[expression];
  }

  getExpressionTypes(): FaceExpression[] {
    return Object.keys(expressionConfig) as FaceExpression[];
  }
}

export const faceExpressionService = new FaceExpressionService();