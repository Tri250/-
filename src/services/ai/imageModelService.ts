/**
 * 图像分析模型服务
 * 支持像素规则分析（当前）和 MobileNetV3/TF.js（未来）
 */

import type {
  ImageAnalysisOptions,
  ImageAnalysisResult,
  ImageColorAnalysis,
  ImageEdgeAnalysis,
  ImageTextureAnalysis,
  ImageFeatures,
  ImageClassificationResult,
  ImageObjectDetection,
  InferenceMode,
} from './types';
import { modelLoader } from './modelLoader';

// ==================== 类型定义 ====================

/**
 * Web Worker 消息类型
 */
interface WorkerMessage {
  id: string;
  type: 'init' | 'analyze' | 'terminate';
  data: unknown;
}

/**
 * Worker 分析请求
 */
interface WorkerAnalyzeRequest {
  imageData: ImageData;
  options: ImageAnalysisOptions;
}

/**
 * Worker 分析响应
 */
interface WorkerAnalyzeResponse {
  colorAnalysis?: ImageColorAnalysis;
  edgeAnalysis?: ImageEdgeAnalysis;
  textureAnalysis?: ImageTextureAnalysis;
  features?: ImageFeatures;
  classification?: ImageClassificationResult;
  objectDetection?: ImageObjectDetection;
  processingTime: number;
}

// ==================== 图像颜色分析器 ====================

/**
 * 图像颜色分析器
 * 提取主色调、亮度、对比度等颜色特征
 */
class ImageColorAnalyzer {
  /**
   * 分析图像颜色
   */
  analyze(imageData: ImageData): ImageColorAnalysis {
    const { data, width, height } = imageData;
    const pixelCount = width * height;

    // 颜色直方图
    const colorMap = new Map<string, { rgb: [number, number, number]; count: number }>();

    // 统计变量
    let totalBrightness = 0;
    let totalSaturation = 0;
    let minBrightness = 255;
    let maxBrightness = 0;

    // 遍历像素
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // 跳过透明像素
      if (a < 128) continue;

      // 计算亮度
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      totalBrightness += brightness;
      minBrightness = Math.min(minBrightness, brightness);
      maxBrightness = Math.max(maxBrightness, brightness);

      // 计算饱和度
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      totalSaturation += saturation;

      // 量化颜色（减少颜色数量）
      const quantizedR = Math.round(r / 32) * 32;
      const quantizedG = Math.round(g / 32) * 32;
      const quantizedB = Math.round(b / 32) * 32;
      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;

      const existing = colorMap.get(colorKey);
      if (existing) {
        existing.count++;
      } else {
        colorMap.set(colorKey, {
          rgb: [quantizedR, quantizedG, quantizedB],
          count: 1,
        });
      }
    }

    // 排序获取主色调
    const sortedColors = Array.from(colorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 计算主色调百分比
    const dominantColors = sortedColors.map((color) => ({
      hex: this.rgbToHex(color.rgb),
      rgb: color.rgb,
      percentage: color.count / pixelCount,
    }));

    // 计算平均亮度
    const averageBrightness = totalBrightness / pixelCount / 255;

    // 计算对比度
    const contrast = maxBrightness === minBrightness 
      ? 0 
      : (maxBrightness - minBrightness) / (maxBrightness + minBrightness);

    // 计算平均饱和度
    const saturation = totalSaturation / pixelCount;

    // 计算色温
    const colorTemperature = this.calculateColorTemperature(dominantColors);

    return {
      dominantColors,
      averageBrightness,
      contrast,
      saturation,
      colorTemperature,
    };
  }

  /**
   * RGB 转 Hex
   */
  private rgbToHex(rgb: [number, number, number]): string {
    return '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 计算色温
   */
  private calculateColorTemperature(colors: Array<{ rgb: [number, number, number]; percentage: number }>): number {
    if (colors.length === 0) return 6500; // 默认中性色温

    let weightedR = 0;
    let weightedG = 0;
    let weightedB = 0;
    let totalWeight = 0;

    colors.forEach((color) => {
      weightedR += color.rgb[0] * color.percentage;
      weightedG += color.rgb[1] * color.percentage;
      weightedB += color.rgb[2] * color.percentage;
      totalWeight += color.percentage;
    });

    if (totalWeight === 0) return 6500;

    const avgR = weightedR / totalWeight;
    const avgB = weightedB / totalWeight;

    // 基于红蓝比例估算色温
    // 简化算法，实际应使用更精确的色温计算
    if (avgB === 0) return 2000;
    const ratio = avgR / avgB;
    
    // 映射到色温范围 (2000K - 10000K)
    const temperature = 2000 + (1 - Math.min(ratio / 2, 1)) * 8000;
    return Math.round(temperature);
  }
}

// ==================== 图像边缘检测器 ====================

/**
 * 图像边缘检测器
 * 使用 Sobel 算子进行边缘检测
 */
class ImageEdgeDetector {
  /**
   * 分析图像边缘
   */
  analyze(imageData: ImageData): ImageEdgeAnalysis {
    const { data, width, height } = imageData;

    // 转换为灰度图
    const gray = new Float32Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      gray[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // Sobel 算子
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    // 边缘强度图
    const edges = new Float32Array(width * height);
    let totalEdgeStrength = 0;
    let edgePixelCount = 0;

    // 边缘方向直方图（8 个方向）
    const directionHistogram = new Array(8).fill(0);

    // 应用 Sobel 算子
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;

        // 3x3 卷积
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            gx += gray[idx] * sobelX[kernelIdx];
            gy += gray[idx] * sobelY[kernelIdx];
          }
        }

        // 计算边缘强度
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = magnitude;
        totalEdgeStrength += magnitude;

        // 阈值检测边缘像素
        if (magnitude > 50) {
          edgePixelCount++;
          
          // 计算边缘方向
          const angle = Math.atan2(gy, gx);
          const normalizedAngle = (angle + Math.PI) / (2 * Math.PI); // 0-1
          const directionIdx = Math.floor(normalizedAngle * 8) % 8;
          directionHistogram[directionIdx]++;
        }
      }
    }

    // 计算边缘密度
    const edgeDensity = edgePixelCount / (width * height);

    // 归一化方向直方图
    const totalDirections = directionHistogram.reduce((a, b) => a + b, 0);
    const normalizedHistogram = totalDirections > 0
      ? directionHistogram.map((v) => v / totalDirections)
      : directionHistogram;

    // 平均边缘强度
    const edgeStrength = totalEdgeStrength / (width * height);

    return {
      edgeDensity,
      edgeDirectionHistogram: normalizedHistogram,
      edgeStrength,
    };
  }
}

// ==================== 图像纹理分析器 ====================

/**
 * 图像纹理分析器
 * 使用灰度共生矩阵（GLCM）分析纹理特征
 */
class ImageTextureAnalyzer {
  /**
   * 分析图像纹理
   */
  analyze(imageData: ImageData): ImageTextureAnalysis {
    const { data, width, height } = imageData;

    // 转换为灰度图并量化
    const gray = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      const grayValue = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      gray[idx] = Math.floor(grayValue / 16); // 量化到 16 级
    }

    // 计算灰度共生矩阵（简化版本）
    const glcm = this.computeGLCM(gray, width, height, 1, 0);

    // 计算纹理特征
    const contrast = this.computeContrast(glcm);
    const homogeneity = this.computeHomogeneity(glcm);
    const energy = this.computeEnergy(glcm);
    const entropy = this.computeEntropy(glcm);

    // 计算复杂度（基于边缘变化）
    const complexity = this.computeComplexity(gray, width, height);

    // 计算方向性
    const directionality = this.computeDirectionality(glcm);

    // 计算粗糙度
    const coarseness = this.computeCoarseness(gray, width, height);

    return {
      complexity,
      directionality,
      coarseness,
      contrast,
    };
  }

  /**
   * 计算灰度共生矩阵
   */
  private computeGLCM(
    gray: Uint8Array,
    width: number,
    height: number,
    distance: number,
    angle: number
  ): number[][] {
    const levels = 16;
    const glcm: number[][] = Array(levels).fill(null).map(() => Array(levels).fill(0));

    const dx = Math.round(distance * Math.cos(angle));
    const dy = Math.round(distance * Math.sin(angle));

    let count = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const i = gray[y * width + x];
          const j = gray[ny * width + nx];
          glcm[i][j]++;
          count++;
        }
      }
    }

    // 归一化
    if (count > 0) {
      for (let i = 0; i < levels; i++) {
        for (let j = 0; j < levels; j++) {
          glcm[i][j] /= count;
        }
      }
    }

    return glcm;
  }

  /**
   * 计算对比度
   */
  private computeContrast(glcm: number[][]): number {
    let contrast = 0;
    const levels = glcm.length;
    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        contrast += glcm[i][j] * (i - j) * (i - j);
      }
    }
    return contrast;
  }

  /**
   * 计算同质性
   */
  private computeHomogeneity(glcm: number[][]): number {
    let homogeneity = 0;
    const levels = glcm.length;
    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        homogeneity += glcm[i][j] / (1 + Math.abs(i - j));
      }
    }
    return homogeneity;
  }

  /**
   * 计算能量
   */
  private computeEnergy(glcm: number[][]): number {
    let energy = 0;
    const levels = glcm.length;
    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        energy += glcm[i][j] * glcm[i][j];
      }
    }
    return energy;
  }

  /**
   * 计算熵
   */
  private computeEntropy(glcm: number[][]): number {
    let entropy = 0;
    const levels = glcm.length;
    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        if (glcm[i][j] > 0) {
          entropy -= glcm[i][j] * Math.log2(glcm[i][j]);
        }
      }
    }
    return entropy;
  }

  /**
   * 计算复杂度
   */
  private computeComplexity(gray: Uint8Array, width: number, height: number): number {
    let complexity = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const center = gray[idx];

        // 计算与邻域的差异
        const neighbors = [
          gray[idx - width - 1],
          gray[idx - width],
          gray[idx - width + 1],
          gray[idx - 1],
          gray[idx + 1],
          gray[idx + width - 1],
          gray[idx + width],
          gray[idx + width + 1],
        ];

        const avgDiff = neighbors.reduce((sum, n) => sum + Math.abs(n - center), 0) / 8;
        complexity += avgDiff;
        count++;
      }
    }

    return count > 0 ? complexity / count / 15 : 0; // 归一化到 0-1
  }

  /**
   * 计算方向性
   */
  private computeDirectionality(glcm: number[][]): number {
    // 基于对角线元素的比例
    const levels = glcm.length;
    let diagonalSum = 0;
    let totalSum = 0;

    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        totalSum += glcm[i][j];
        if (Math.abs(i - j) <= 1) {
          diagonalSum += glcm[i][j];
        }
      }
    }

    return totalSum > 0 ? diagonalSum / totalSum : 0;
  }

  /**
   * 计算粗糙度
   */
  private computeCoarseness(gray: Uint8Array, width: number, height: number): number {
    // 使用平均绝对差分估算粗糙度
    let totalDiff = 0;
    let count = 0;

    const windowSize = 3;
    for (let y = windowSize; y < height - windowSize; y += windowSize) {
      for (let x = windowSize; x < width - windowSize; x += windowSize) {
        const idx = y * width + x;
        const center = gray[idx];

        // 计算窗口内的平均差异
        for (let dy = -windowSize; dy <= windowSize; dy++) {
          for (let dx = -windowSize; dx <= windowSize; dx++) {
            if (dx === 0 && dy === 0) continue;
            const neighborIdx = (y + dy) * width + (x + dx);
            totalDiff += Math.abs(gray[neighborIdx] - center);
            count++;
          }
        }
      }
    }

    return count > 0 ? 1 - totalDiff / count / 15 : 0; // 归一化到 0-1，越高越细腻
  }
}

// ==================== 图像模型服务 ====================

/**
 * 图像模型服务
 * 提供图像分析功能，支持像素规则分析和 MobileNetV3
 */
export class ImageModelService {
  // 单例实例
  private static instance: ImageModelService | null = null;

  // 分析器
  private colorAnalyzer: ImageColorAnalyzer;
  private edgeDetector: ImageEdgeDetector;
  private textureAnalyzer: ImageTextureAnalyzer;

  // Web Worker
  private worker: Worker | null = null;
  private workerReady = false;
  private pendingRequests: Map<string, {
    resolve: (value: WorkerAnalyzeResponse) => void;
    reject: (error: Error) => void;
  }> = new Map();

  // 配置
  private initialized = false;

  private constructor() {
    this.colorAnalyzer = new ImageColorAnalyzer();
    this.edgeDetector = new ImageEdgeDetector();
    this.textureAnalyzer = new ImageTextureAnalyzer();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ImageModelService {
    if (!ImageModelService.instance) {
      ImageModelService.instance = new ImageModelService();
    }
    return ImageModelService.instance;
  }

  /**
   * 初始化服务
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // 尝试初始化 Web Worker
      await this.initWorker();

      this.initialized = true;
      console.log('[ImageModelService] 初始化成功');
    } catch (error) {
      console.error('[ImageModelService] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化 Web Worker
   */
  private async initWorker(): Promise<void> {
    try {
      // 创建 Worker（实际项目中使用单独的 worker 文件）
      const workerCode = `
        self.onmessage = function(e) {
          const { id, type, data } = e.data;
          if (type === 'init') {
            self.postMessage({ id, success: true });
          } else if (type === 'analyze') {
            // 模拟分析处理
            const result = { processingTime: 100 };
            self.postMessage({ id, success: true, data: result });
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e) => {
        const { id, success, data, error } = e.data;
        const pending = this.pendingRequests.get(id);
        if (pending) {
          if (success) {
            pending.resolve(data);
          } else {
            pending.reject(new Error(error));
          }
          this.pendingRequests.delete(id);
        }
      };

      this.worker.onerror = (e) => {
        console.error('[ImageModelService] Worker 错误:', e);
      };

      // 发送初始化消息
      await this.sendWorkerMessage('init', {});
      this.workerReady = true;
      console.log('[ImageModelService] Worker 初始化成功');
    } catch (error) {
      console.warn('[ImageModelService] Worker 初始化失败，将使用主线程:', error);
      this.workerReady = false;
    }
  }

  /**
   * 发送消息到 Worker
   */
  private sendWorkerMessage(type: string, data: unknown): Promise<WorkerAnalyzeResponse> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker 未初始化'));
        return;
      }

      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.pendingRequests.set(id, { resolve, reject });
      
      this.worker.postMessage({ id, type, data } as WorkerMessage);

      // 超时处理
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Worker 请求超时'));
        }
      }, 30000);
    });
  }

  /**
   * 分析图像
   * 主入口方法
   */
  async analyzeImage(
    imageData: ImageData,
    options: ImageAnalysisOptions = {}
  ): Promise<ImageAnalysisResult> {
    const startTime = Date.now();
    const id = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 合并默认选项
    const opts: ImageAnalysisOptions = {
      targetWidth: 224,
      targetHeight: 224,
      useMobileNet: false,
      inferenceMode: 'frontend',
      returnFeatures: false,
      timeout: 30000,
      ...options,
    };

    try {
      // 确保已初始化
      if (!this.initialized) {
        await this.init();
      }

      // 预处理图像（调整大小）
      const processedImage = this.preprocessImage(imageData, opts.targetWidth, opts.targetHeight);

      // 颜色分析
      const colorAnalysis = this.colorAnalyzer.analyze(processedImage);

      // 边缘检测
      const edgeAnalysis = this.edgeDetector.analyze(processedImage);

      // 纹理分析
      const textureAnalysis = this.textureAnalyzer.analyze(processedImage);

      // 特征提取
      let features: ImageFeatures | undefined;
      if (opts.returnFeatures) {
        features = this.extractFeatures(colorAnalysis, edgeAnalysis, textureAnalysis);
      }

      // MobileNet 分类（未来实现）
      let classification: ImageClassificationResult | undefined;
      if (opts.useMobileNet) {
        const mobileNetResult = await this.runMobileNet(processedImage, opts);
        features = { ...features, mobilenetEmbedding: mobileNetResult.embedding };
        classification = mobileNetResult.classification;
      }

      // 基于规则的目标检测（简化版本）
      const objectDetection = this.detectObjects(colorAnalysis, edgeAnalysis, textureAnalysis);

      const processingTime = Date.now() - startTime;

      // 计算置信度
      const confidence = classification 
        ? Math.max(...Object.values(classification.probabilities))
        : this.calculateConfidence(colorAnalysis, edgeAnalysis, textureAnalysis);

      return {
        id,
        timestamp: Date.now(),
        processingTime,
        inferenceMode: opts.inferenceMode || 'frontend',
        colorAnalysis,
        edgeAnalysis,
        textureAnalysis,
        features,
        classification,
        objectDetection,
        confidence,
        success: true,
      };
    } catch (error) {
      return {
        id,
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
        inferenceMode: opts.inferenceMode || 'frontend',
        confidence: 0,
        success: false,
        error: error instanceof Error ? error.message : '图像分析失败',
      };
    }
  }

  /**
   * 预处理图像
   * 调整大小到目标尺寸
   */
  private preprocessImage(
    imageData: ImageData,
    targetWidth: number = 224,
    targetHeight: number = 224
  ): ImageData {
    const { data, width, height } = imageData;

    // 如果尺寸已经匹配，直接返回
    if (width === targetWidth && height === targetHeight) {
      return imageData;
    }

    // 创建 Canvas 进行缩放
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('无法创建 Canvas 上下文');
    }

    // 绘制原始图像
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      throw new Error('无法创建临时 Canvas 上下文');
    }

    tempCtx.putImageData(imageData, 0, 0);

    // 缩放到目标尺寸
    ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);

    return ctx.getImageData(0, 0, targetWidth, targetHeight);
  }

  /**
   * 提取图像特征
   */
  private extractFeatures(
    colorAnalysis: ImageColorAnalysis,
    edgeAnalysis: ImageEdgeAnalysis,
    textureAnalysis: ImageTextureAnalysis
  ): ImageFeatures {
    // 构建颜色直方图特征
    const colorHistogram = new Float32Array(64); // 4x4x4 颜色立方体
    colorAnalysis.dominantColors.forEach((color) => {
      const r = Math.floor(color.rgb[0] / 64);
      const g = Math.floor(color.rgb[1] / 64);
      const b = Math.floor(color.rgb[2] / 64);
      const idx = r * 16 + g * 4 + b;
      colorHistogram[idx] = color.percentage;
    });

    // 构建边缘方向直方图特征
    const edgeHistogram = new Float32Array(edgeAnalysis.edgeDirectionHistogram);

    // 组合特征向量
    const featureLength = 64 + 8 + 4; // 颜色 + 边缘 + 纹理
    const combinedFeatures = new Float32Array(featureLength);
    
    let offset = 0;
    colorHistogram.forEach((v, i) => { combinedFeatures[offset + i] = v; });
    offset += 64;
    edgeHistogram.forEach((v, i) => { combinedFeatures[offset + i] = v; });
    offset += 8;
    combinedFeatures[offset] = textureAnalysis.complexity;
    combinedFeatures[offset + 1] = textureAnalysis.directionality;
    combinedFeatures[offset + 2] = textureAnalysis.coarseness;
    combinedFeatures[offset + 3] = textureAnalysis.contrast;

    return {
      colorHistogram,
      hogFeatures: edgeHistogram,
    };
  }

  /**
   * 运行 MobileNet 模型
   * 未来实现，当前返回模拟数据
   */
  private async runMobileNet(
    _imageData: ImageData,
    _options: ImageAnalysisOptions
  ): Promise<{
    embedding: Float32Array;
    classification: ImageClassificationResult;
  }> {
    // 检查模型是否已加载
    const modelLoaded = modelLoader.isModelLoaded('mobilenetv3');
    
    if (!modelLoaded) {
      // 尝试加载模型
      const result = await modelLoader.loadModel('mobilenetv3');
      if (!result.success) {
        console.warn('[ImageModelService] MobileNetV3 模型加载失败，使用模拟数据');
      }
    }

    // 返回模拟数据（实际项目中使用真实推理）
    const embedding = new Float32Array(1280).fill(0).map(() => Math.random() * 0.1);
    
    const classification: ImageClassificationResult = {
      predictedClass: 'dog',
      probabilities: {
        dog: 0.85,
        cat: 0.1,
        bird: 0.03,
        other: 0.02,
      },
      topPredictions: [
        { label: 'dog', probability: 0.85 },
        { label: 'cat', probability: 0.1 },
        { label: 'bird', probability: 0.03 },
      ],
    };

    return { embedding, classification };
  }

  /**
   * 基于规则的目标检测
   * 简化版本，基于颜色和边缘特征
   */
  private detectObjects(
    colorAnalysis: ImageColorAnalysis,
    edgeAnalysis: ImageEdgeAnalysis,
    textureAnalysis: ImageTextureAnalysis
  ): ImageObjectDetection {
    const objects: ImageObjectDetection['objects'] = [];

    // 基于边缘密度检测物体区域
    if (edgeAnalysis.edgeDensity > 0.1) {
      // 简化：假设整个图像是一个物体
      objects.push({
        label: 'object',
        confidence: Math.min(edgeAnalysis.edgeDensity * 2, 1),
        boundingBox: {
          x: 0.1,
          y: 0.1,
          width: 0.8,
          height: 0.8,
        },
      });
    }

    // 基于颜色分布检测多个区域
    if (colorAnalysis.dominantColors.length > 2) {
      const highContrast = colorAnalysis.contrast > 0.5;
      if (highContrast) {
        objects.push({
          label: 'region',
          confidence: colorAnalysis.contrast,
          boundingBox: {
            x: 0.2,
            y: 0.2,
            width: 0.6,
            height: 0.6,
          },
        });
      }
    }

    // 基于纹理复杂度检测
    if (textureAnalysis.complexity > 0.5) {
      objects.push({
        label: 'complex_region',
        confidence: textureAnalysis.complexity,
        boundingBox: {
          x: 0.15,
          y: 0.15,
          width: 0.7,
          height: 0.7,
        },
      });
    }

    return {
      objects,
      count: objects.length,
    };
  }

  /**
   * 计算分析置信度
   */
  private calculateConfidence(
    colorAnalysis: ImageColorAnalysis,
    edgeAnalysis: ImageEdgeAnalysis,
    textureAnalysis: ImageTextureAnalysis
  ): number {
    // 基于多个因素计算置信度
    const colorConfidence = Math.min(colorAnalysis.dominantColors.length / 5, 1);
    const edgeConfidence = Math.min(edgeAnalysis.edgeDensity * 5, 1);
    const textureConfidence = Math.min(textureAnalysis.complexity * 2, 1);

    return (colorConfidence + edgeConfidence + textureConfidence) / 3;
  }

  /**
   * 使用 Web Worker 分析图像
   */
  async analyzeImageWithWorker(
    imageData: ImageData,
    options: ImageAnalysisOptions = {}
  ): Promise<ImageAnalysisResult> {
    if (!this.workerReady || !this.worker) {
      // 回退到主线程分析
      return this.analyzeImage(imageData, options);
    }

    const startTime = Date.now();
    const id = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await this.sendWorkerMessage('analyze', {
        imageData,
        options,
      } as WorkerAnalyzeRequest);

      return {
        id,
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
        inferenceMode: options.inferenceMode || 'frontend',
        colorAnalysis: response.colorAnalysis,
        edgeAnalysis: response.edgeAnalysis,
        textureAnalysis: response.textureAnalysis,
        features: response.features,
        classification: response.classification,
        objectDetection: response.objectDetection,
        confidence: response.classification
          ? Math.max(...Object.values(response.classification.probabilities))
          : 0.5,
        success: true,
      };
    } catch (error) {
      // 回退到主线程分析
      console.warn('[ImageModelService] Worker 分析失败，回退到主线程:', error);
      return this.analyzeImage(imageData, options);
    }
  }

  /**
   * 检查服务状态
   */
  getStatus(): {
    initialized: boolean;
    workerReady: boolean;
    modelLoaded: boolean;
  } {
    return {
      initialized: this.initialized,
      workerReady: this.workerReady,
      modelLoaded: modelLoader.isModelLoaded('mobilenetv3'),
    };
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = false;
    }

    this.pendingRequests.clear();
    this.initialized = false;
    console.log('[ImageModelService] 服务已销毁');
  }
}

// 导出单例
export const imageModelService = ImageModelService.getInstance();