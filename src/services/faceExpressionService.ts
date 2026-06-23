import { databaseService, STORE_NAMES } from './databaseService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pawsync.com/v1';

// ─── 表情分析类型定义 ────────────────────────────────────────

export interface ExpressionAnalysisResult {
  id: string;
  petId: string;
  imageUrl?: string;
  localAnalysis: LocalExpressionResult;
  remoteAnalysis?: RemoteExpressionResult;
  combinedResult: CombinedExpressionResult;
  analyzedAt: string;
}

export interface LocalExpressionResult {
  available: boolean;
  confidence: number;
  dominantColor: { r: number; g: number; b: number };
  brightness: number;
  contrast: number;
  symmetry: number;
  edgeDensity: number;
  colorDistribution: number[];
  estimatedExpression: string;
  estimatedEmotion: string;
  processingTimeMs: number;
}

export interface RemoteExpressionResult {
  expression: string;
  emotion: string;
  confidence: number;
  landmarks?: Array<{ x: number; y: number; label: string }>;
  regions?: Array<{ label: string; bbox: [number, number, number, number]; confidence: number }>;
  detailedEmotions: Record<string, number>;
}

export interface CombinedExpressionResult {
  expression: string;
  emotion: string;
  confidence: number;
  source: 'local' | 'remote' | 'fusion';
  localConfidence: number;
  remoteConfidence: number;
  agreement: boolean;
}

// ─── 宠物表情映射 ────────────────────────────────────────────

const PET_EXPRESSION_MAP: Record<string, { expression: string; emotion: string; description: string }> = {
  relaxed: { expression: '放松', emotion: 'calm', description: '面部肌肉放松，眼神平和' },
  alert: { expression: '警觉', emotion: 'attentive', description: '耳朵竖起，眼神专注' },
  happy: { expression: '开心', emotion: 'happy', description: '眼睛微眯，嘴角上扬' },
  anxious: { expression: '焦虑', emotion: 'anxious', description: '耳朵后压，眼神不安' },
  fearful: { expression: '恐惧', emotion: 'fearful', description: '瞳孔放大，身体紧缩' },
  aggressive: { expression: '攻击性', emotion: 'angry', description: '呲牙，眼神凶狠' },
  playful: { expression: '玩耍', emotion: 'excited', description: '眼神明亮，姿态活跃' },
  pain: { expression: '疼痛', emotion: 'painful', description: '眯眼，面部紧绷' },
  curious: { expression: '好奇', emotion: 'curious', description: '头部倾斜，眼神探索' },
  sleepy: { expression: '困倦', emotion: 'tired', description: '眼睛半闭，姿态放松' },
};

export class FaceExpressionService {
  // ─── 本地图像分析（Canvas + 简单算法） ────────────────────

  private async analyzeImageLocally(imageData: string): Promise<LocalExpressionResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(this.createUnavailableLocalResult(startTime));
            return;
          }

          // 缩放到合理大小进行分析
          const maxSize = 256;
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          canvas.width = Math.floor(img.width * scale);
          canvas.height = Math.floor(img.height * scale);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageDataObj.data;
          const pixelCount = canvas.width * canvas.height;

          // 1. 颜色分布分析
          const colorDistribution = this.analyzeColorDistribution(data, pixelCount);

          // 2. 主色调
          const dominantColor = this.getDominantColor(data, pixelCount);

          // 3. 亮度分析
          const brightness = this.calculateBrightness(data, pixelCount);

          // 4. 对比度分析
          const contrast = this.calculateContrast(data, pixelCount);

          // 5. 对称性分析
          const symmetry = this.calculateSymmetry(imageDataObj, canvas.width, canvas.height);

          // 6. 边缘密度分析
          const edgeDensity = this.calculateEdgeDensity(imageDataObj, canvas.width, canvas.height);

          // 7. 基于以上特征推断表情
          const { expression, emotion, confidence } = this.inferExpressionFromFeatures({
            dominantColor,
            brightness,
            contrast,
            symmetry,
            edgeDensity,
            colorDistribution,
          });

          resolve({
            available: true,
            confidence,
            dominantColor,
            brightness,
            contrast,
            symmetry,
            edgeDensity,
            colorDistribution,
            estimatedExpression: expression,
            estimatedEmotion: emotion,
            processingTimeMs: Date.now() - startTime,
          });
        } catch {
          resolve(this.createUnavailableLocalResult(startTime));
        }
      };
      img.onerror = () => resolve(this.createUnavailableLocalResult(startTime));
      img.src = imageData;
    });
  }

  private createUnavailableLocalResult(startTime: number): LocalExpressionResult {
    return {
      available: false,
      confidence: 0,
      dominantColor: { r: 0, g: 0, b: 0 },
      brightness: 0,
      contrast: 0,
      symmetry: 0,
      edgeDensity: 0,
      colorDistribution: [],
      estimatedExpression: 'unknown',
      estimatedEmotion: 'unknown',
      processingTimeMs: Date.now() - startTime,
    };
  }

  // ─── 颜色分布分析 ──────────────────────────────────────────

  private analyzeColorDistribution(data: Uint8ClampedArray, pixelCount: number): number[] {
    // 将颜色空间分为8个区间
    const bins = new Array(8).fill(0);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // 简单量化到8个颜色区间
      const bucket = ((r > 128 ? 4 : 0) | (g > 128 ? 2 : 0) | (b > 128 ? 1 : 0));
      bins[bucket]++;
    }

    return bins.map(count => count / pixelCount);
  }

  private getDominantColor(data: Uint8ClampedArray, pixelCount: number): { r: number; g: number; b: number } {
    let totalR = 0, totalG = 0, totalB = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
    }
    return {
      r: Math.round(totalR / pixelCount),
      g: Math.round(totalG / pixelCount),
      b: Math.round(totalB / pixelCount),
    };
  }

  private calculateBrightness(data: Uint8ClampedArray, pixelCount: number): number {
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    }
    return totalBrightness / pixelCount / 255;
  }

  private calculateContrast(data: Uint8ClampedArray, pixelCount: number): number {
    const brightnessValues: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      brightnessValues.push(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    }
    const mean = brightnessValues.reduce((s, v) => s + v, 0) / brightnessValues.length;
    const variance = brightnessValues.reduce((s, v) => s + (v - mean) ** 2, 0) / brightnessValues.length;
    return Math.sqrt(variance) / 255;
  }

  // ─── 对称性分析 ────────────────────────────────────────────

  private calculateSymmetry(imageData: ImageData, width: number, height: number): number {
    const data = imageData.data;
    const halfWidth = Math.floor(width / 2);
    let totalDiff = 0;
    let sampleCount = 0;

    // 采样比较左右对称性
    const step = Math.max(1, Math.floor(height / 50));
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < halfWidth; x += step) {
        const leftIdx = (y * width + x) * 4;
        const rightIdx = (y * width + (width - 1 - x)) * 4;

        const diff = Math.abs(data[leftIdx] - data[rightIdx]) +
                     Math.abs(data[leftIdx + 1] - data[rightIdx + 1]) +
                     Math.abs(data[leftIdx + 2] - data[rightIdx + 2]);

        totalDiff += diff / (3 * 255);
        sampleCount++;
      }
    }

    return sampleCount > 0 ? 1 - totalDiff / sampleCount : 0;
  }

  // ─── 边缘密度分析 ──────────────────────────────────────────

  private calculateEdgeDensity(imageData: ImageData, width: number, height: number): number {
    const data = imageData.data;
    let edgeCount = 0;
    let totalPixels = 0;

    // Sobel 简化版：只检测水平梯度
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = (y * width + x) * 4;
        const leftIdx = (y * width + (x - 1)) * 4;
        const rightIdx = (y * width + (x + 1)) * 4;

        const gx = Math.abs(
          (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) -
          (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2])
        ) / (3 * 255);

        if (gx > 0.1) edgeCount++;
        totalPixels++;
      }
    }

    return totalPixels > 0 ? edgeCount / totalPixels : 0;
  }

  // ─── 基于图像特征推断表情 ──────────────────────────────────

  private inferExpressionFromFeatures(features: {
    dominantColor: { r: number; g: number; b: number };
    brightness: number;
    contrast: number;
    symmetry: number;
    edgeDensity: number;
    colorDistribution: number[];
  }): { expression: string; emotion: string; confidence: number } {
    const { brightness, contrast, symmetry, edgeDensity } = features;

    // 基于简单规则的推断
    // 高对称性 + 低边缘密度 → 放松
    // 高对称性 + 高边缘密度 → 警觉
    // 低对称性 + 高对比度 → 焦虑/恐惧
    // 高亮度 + 高对称性 → 开心
    // 低亮度 + 低对称性 → 疼痛/不适

    let expression = 'relaxed';
    let emotion = 'calm';
    let confidence = 0.4;

    if (symmetry > 0.85 && edgeDensity < 0.15) {
      if (brightness > 0.5) {
        expression = 'relaxed';
        emotion = 'calm';
        confidence = 0.55;
      } else {
        expression = 'sleepy';
        emotion = 'tired';
        confidence = 0.5;
      }
    } else if (symmetry > 0.8 && edgeDensity > 0.2) {
      expression = 'alert';
      emotion = 'attentive';
      confidence = 0.5;
    } else if (symmetry < 0.7 && contrast > 0.3) {
      if (brightness < 0.3) {
        expression = 'fearful';
        emotion = 'fearful';
        confidence = 0.45;
      } else {
        expression = 'anxious';
        emotion = 'anxious';
        confidence = 0.45;
      }
    } else if (brightness > 0.6 && symmetry > 0.75) {
      expression = 'happy';
      emotion = 'happy';
      confidence = 0.5;
    } else if (edgeDensity > 0.3 && contrast > 0.25) {
      expression = 'playful';
      emotion = 'excited';
      confidence = 0.45;
    } else if (symmetry < 0.65) {
      expression = 'pain';
      emotion = 'painful';
      confidence = 0.4;
    }

    return { expression, emotion, confidence };
  }

  // ─── 远程精确分析 API ─────────────────────────────────────

  private async analyzeImageRemotely(
    imageData: string,
    petId: string,
    localResult: LocalExpressionResult,
  ): Promise<RemoteExpressionResult> {
    const response = await fetch(`${API_BASE_URL}/ai/analyze-expression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageData,
        petId,
        localHint: {
          estimatedExpression: localResult.estimatedExpression,
          estimatedEmotion: localResult.estimatedEmotion,
          localConfidence: localResult.confidence,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Expression analysis API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ─── 双层分析：本地快速预筛 + 远程精确分析 ────────────────

  async analyzeExpression(
    imageData: string,
    petId: string,
  ): Promise<ExpressionAnalysisResult> {
    const id = `expr-${Date.now()}`;

    // 第一层：本地快速分析
    const localAnalysis = await this.analyzeImageLocally(imageData);

    // 第二层：远程精确分析
    let remoteAnalysis: RemoteExpressionResult | undefined;
    try {
      remoteAnalysis = await this.analyzeImageRemotely(imageData, petId, localAnalysis);
    } catch {
      // 远程分析失败，仅使用本地结果
    }

    // 融合结果
    const combinedResult = this.combineResults(localAnalysis, remoteAnalysis);

    const result: ExpressionAnalysisResult = {
      id,
      petId,
      imageUrl: imageData.startsWith('data:') ? undefined : imageData,
      localAnalysis,
      remoteAnalysis,
      combinedResult,
      analyzedAt: new Date().toISOString(),
    };

    // 持久化到 databaseService
    await databaseService.put(STORE_NAMES.EMOTION_ANALYSES, {
      ...result,
      source: 'expression_analysis',
    });

    return result;
  }

  // ─── 结果融合 ──────────────────────────────────────────────

  private combineResults(
    local: LocalExpressionResult,
    remote?: RemoteExpressionResult,
  ): CombinedExpressionResult {
    if (!remote) {
      return {
        expression: local.estimatedExpression,
        emotion: local.estimatedEmotion,
        confidence: local.confidence,
        source: 'local',
        localConfidence: local.confidence,
        remoteConfidence: 0,
        agreement: true,
      };
    }

    const localConfidence = local.confidence;
    const remoteConfidence = remote.confidence;

    // 检查本地和远程结果是否一致
    const agreement = local.estimatedEmotion === remote.emotion ||
                     local.estimatedExpression === remote.expression;

    if (agreement) {
      // 一致时：加权融合，远程权重更高
      const fusedConfidence = localConfidence * 0.3 + remoteConfidence * 0.7;
      return {
        expression: remote.expression,
        emotion: remote.emotion,
        confidence: fusedConfidence,
        source: 'fusion',
        localConfidence,
        remoteConfidence,
        agreement: true,
      };
    }

    // 不一致时：以远程结果为主，但降低置信度
    const penaltyFactor = 0.8;
    const fusedConfidence = remoteConfidence * penaltyFactor;
    return {
      expression: remote.expression,
      emotion: remote.emotion,
      confidence: fusedConfidence,
      source: 'fusion',
      localConfidence,
      remoteConfidence,
      agreement: false,
    };
  }

  // ─── 批量分析 ──────────────────────────────────────────────

  async analyzeMultipleExpressions(
    images: Array<{ data: string; petId: string }>,
  ): Promise<ExpressionAnalysisResult[]> {
    const results: ExpressionAnalysisResult[] = [];
    for (const { data, petId } of images) {
      const result = await this.analyzeExpression(data, petId);
      results.push(result);
    }
    return results;
  }

  // ─── 历史记录 ──────────────────────────────────────────────

  async getAnalysisHistory(petId: string, limit: number = 20): Promise<ExpressionAnalysisResult[]> {
    try {
      const records = await databaseService.getByIndex<ExpressionAnalysisResult & { source: string }>(
        STORE_NAMES.EMOTION_ANALYSES,
        'petId',
        petId,
      );
      return records
        .filter(r => r.source === 'expression_analysis')
        .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  // ─── 表情映射 ──────────────────────────────────────────────

  getExpressionMap(): Record<string, { expression: string; emotion: string; description: string }> {
    return PET_EXPRESSION_MAP;
  }
}

export const faceExpressionService = new FaceExpressionService();
