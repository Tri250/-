// ============================================
// PawSync Pro - imageProcessor.ts
// 
// 描述: 图像预处理服务
// ============================================

/**
 * 图像特征提取结果
 */
export interface ImageFeatures {
  brightness: number;
  contrast: number;
  colorTone: 'warm' | 'cool' | 'natural' | 'neutral';
  quality: number;
  isValid: boolean;
  invalidReason?: string;
}

/**
 * 图像尺寸限制配置
 */
const IMAGE_SIZE_LIMITS = {
  minWidth: 50,
  minHeight: 50,
  maxWidth: 4096,
  maxHeight: 4096,
  processingMaxSize: 512, // 处理时的最大尺寸（用于性能优化）
};

/**
 * 从File对象加载图像
 * @param file 图像文件
 * @returns Promise包含图像元素和URL
 */
export async function loadImageFromFile(file: File): Promise<{
  image: HTMLImageElement;
  url: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      resolve({ image: img, url });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };
    
    img.src = url;
  });
}

/**
 * 验证图像尺寸
 * @param width 图像宽度
 * @param height 图像高度
 * @returns 验证结果
 */
export function validateImageSize(width: number, height: number): {
  isValid: boolean;
  reason?: string;
} {
  if (width < IMAGE_SIZE_LIMITS.minWidth || height < IMAGE_SIZE_LIMITS.minHeight) {
    return {
      isValid: false,
      reason: '图片尺寸过小，请上传更清晰的图片',
    };
  }
  
  if (width > IMAGE_SIZE_LIMITS.maxWidth || height > IMAGE_SIZE_LIMITS.maxHeight) {
    return {
      isValid: false,
      reason: '图片尺寸过大，请压缩后上传',
    };
  }
  
  return { isValid: true };
}

/**
 * 计算缩放后的图像尺寸
 * @param originalWidth 原始宽度
 * @param originalHeight 原始高度
 * @param maxSize 最大尺寸
 * @returns 缩放后的尺寸
 */
export function calculateScaledSize(
  originalWidth: number,
  originalHeight: number,
  maxSize: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;
  
  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = Math.floor(height * (maxSize / width));
      width = maxSize;
    } else {
      width = Math.floor(width * (maxSize / height));
      height = maxSize;
    }
  }
  
  return { width, height };
}

/**
 * 从图像创建ImageData
 * @param image 图像元素
 * @param width 目标宽度
 * @param height 目标高度
 * @returns ImageData对象
 */
export function createImageDataFromImage(
  image: HTMLImageElement,
  width: number,
  height: number
): ImageData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = width;
  canvas.height = height;
  
  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }
  
  ctx.drawImage(image, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/**
 * 提取图像特征
 * @param file 图像文件
 * @returns 图像特征
 */
export async function extractImageFeatures(file: File): Promise<ImageFeatures> {
  try {
    const { image, url } = await loadImageFromFile(file);
    
    // 验证尺寸
    const sizeValidation = validateImageSize(image.width, image.height);
    if (!sizeValidation.isValid) {
      URL.revokeObjectURL(url);
      return {
        brightness: 0,
        contrast: 0,
        colorTone: 'neutral',
        quality: 0,
        isValid: false,
        invalidReason: sizeValidation.reason,
      };
    }
    
    // 提取ImageData
    const imageData = createImageDataFromImage(image, image.width, image.height);
    const features = analyzeImageData(imageData.data, imageData.width, imageData.height);
    
    URL.revokeObjectURL(url);
    
    return {
      ...features,
      isValid: true,
    };
  } catch (error) {
    return {
      brightness: 128,
      contrast: 50,
      colorTone: 'neutral',
      quality: 0,
      isValid: false,
      invalidReason: error instanceof Error ? error.message : '图片处理失败',
    };
  }
}

/**
 * 分析ImageData特征
 * @param data Uint8ClampedArray数据
 * @param width 图像宽度
 * @param height 图像高度
 * @returns 分析结果
 */
function analyzeImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number
): {
  brightness: number;
  contrast: number;
  colorTone: 'warm' | 'cool' | 'natural' | 'neutral';
  quality: number;
} {
  let totalBrightness = 0;
  let totalR = 0, totalG = 0, totalB = 0;
  let minBrightness = 255, maxBrightness = 0;
  const pixelCount = data.length / 4;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
    totalR += r;
    totalG += g;
    totalB += b;
  }
  
  const avgBrightness = Math.round(totalBrightness / pixelCount);
  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;
  
  // 计算对比度
  const dynamicRange = maxBrightness - minBrightness;
  const contrast = Math.round((dynamicRange / 255) * 100);
  
  // 计算图片质量分数
  let quality = 70;
  
  // 亮度适中性
  if (avgBrightness > 50 && avgBrightness < 200) {
    quality += 10;
  } else if (avgBrightness < 30 || avgBrightness > 225) {
    quality -= 15;
  }
  
  // 对比度
  if (contrast > 30 && contrast < 80) {
    quality += 10;
  } else if (contrast < 15) {
    quality -= 20;
  }
  
  // 颜色丰富度
  const colorVariance = Math.sqrt(
    Math.pow(avgR - avgBrightness, 2) +
    Math.pow(avgG - avgBrightness, 2) +
    Math.pow(avgB - avgBrightness, 2)
  );
  if (colorVariance > 20) {
    quality += 5;
  }
  
  // 判断色调
  let colorTone: 'warm' | 'cool' | 'natural' | 'neutral' = 'neutral';
  if (avgR > avgG && avgR > avgB) colorTone = 'warm';
  else if (avgB > avgR && avgB > avgG) colorTone = 'cool';
  else if (avgG > avgR && avgG > avgB) colorTone = 'natural';
  
  return {
    brightness: avgBrightness,
    contrast,
    colorTone,
    quality: Math.min(100, Math.max(0, quality)),
  };
}

/**
 * 读取文件为DataURL
 * @param file 文件对象
 * @returns Promise包含DataURL字符串
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsDataURL(file);
  });
}