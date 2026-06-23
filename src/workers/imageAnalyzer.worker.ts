export interface ColorFeatures {
  dominantColors: Array<{ r: number; g: number; b: number; percentage: number }>;
  brightness: number;
  contrast: number;
  saturation: number;
  colorTemperature: number;
  colorHistogram: {
    red: number[];
    green: number[];
    blue: number[];
  };
}

export interface TextureFeatures {
  edgeDensity: number;
  textureComplexity: number;
  smoothness: number;
  contrastRatio: number;
  entropy: number;
}

export interface FaceDetectionResult {
  hasFace: boolean;
  confidence: number;
  faceCount: number;
  eyeCount: number;
  symmetryScore: number;
  boundingBoxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }>;
}

export interface ImageAnalysisResult {
  colorFeatures: ColorFeatures;
  textureFeatures: TextureFeatures;
  faceDetectionResult: FaceDetectionResult;
}

interface AnalyzeMessage {
  type: 'analyze';
  imageData: ImageData;
  options?: {
    sampleStep?: number;
    detectFaces?: boolean;
  };
}

const FUR_COLORS = {
  BROWN: { r: [100, 200], g: [60, 150], b: [30, 100] },
  BLACK: { r: [0, 80], g: [0, 80], b: [0, 80] },
  WHITE: { r: [200, 255], g: [200, 255], b: [200, 255] },
  GRAY: { r: [80, 200], g: [80, 200], b: [80, 200] },
  ORANGE: { r: [180, 255], g: [100, 180], b: [0, 100] },
};

function isInRange(value: number, range: number[]): boolean {
  return value >= range[0] && value <= range[1];
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function analyzeColorFeatures(imageData: ImageData, sampleStep = 4): ColorFeatures {
  const { data, width, height } = imageData;
  const totalPixels = Math.floor((width * height) / (sampleStep * sampleStep));

  let totalBrightness = 0;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let minBrightness = 255;
  let maxBrightness = 0;
  let totalSaturation = 0;

  const histBins = 16;
  const redHist = new Array(histBins).fill(0);
  const greenHist = new Array(histBins).fill(0);
  const blueHist = new Array(histBins).fill(0);

  const colorBuckets: Map<string, number> = new Map();
  const bucketSize = 32;

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      totalR += r;
      totalG += g;
      totalB += b;

      if (brightness < minBrightness) minBrightness = brightness;
      if (brightness > maxBrightness) maxBrightness = brightness;

      const hsl = rgbToHsl(r, g, b);
      totalSaturation += hsl.s;

      const rBin = Math.min(histBins - 1, Math.floor((r / 255) * histBins));
      const gBin = Math.min(histBins - 1, Math.floor((g / 255) * histBins));
      const bBin = Math.min(histBins - 1, Math.floor((b / 255) * histBins));
      redHist[rBin]++;
      greenHist[gBin]++;
      blueHist[bBin]++;

      const bucketKey = `${Math.floor(r / bucketSize)}-${Math.floor(g / bucketSize)}-${Math.floor(b / bucketSize)}`;
      colorBuckets.set(bucketKey, (colorBuckets.get(bucketKey) || 0) + 1);
    }
  }

  const avgBrightness = totalBrightness / totalPixels;
  const avgR = totalR / totalPixels;
  const avgG = totalG / totalPixels;
  const avgB = totalB / totalPixels;
  const contrast = maxBrightness - minBrightness;
  const avgSaturation = totalSaturation / totalPixels;

  let colorTemperature = 5000;
  if (avgR > avgB) {
    colorTemperature = 5000 + (avgR - avgB) * 10;
  } else {
    colorTemperature = 5000 - (avgB - avgR) * 10;
  }

  const dominantColors = Array.from(colorBuckets.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [rb, gb, bb] = key.split('-').map(Number);
      return {
        r: Math.min(255, rb * bucketSize + bucketSize / 2),
        g: Math.min(255, gb * bucketSize + bucketSize / 2),
        b: Math.min(255, bb * bucketSize + bucketSize / 2),
        percentage: (count / totalPixels) * 100,
      };
    });

  return {
    dominantColors,
    brightness: avgBrightness,
    contrast,
    saturation: avgSaturation,
    colorTemperature,
    colorHistogram: {
      red: redHist.map((v) => v / totalPixels),
      green: greenHist.map((v) => v / totalPixels),
      blue: blueHist.map((v) => v / totalPixels),
    },
  };
}

function analyzeTextureFeatures(imageData: ImageData, sampleStep = 4): TextureFeatures {
  const { data, width, height } = imageData;

  let edgeCount = 0;
  let totalSamples = 0;
  let totalLocalVariance = 0;
  const grayLevels = new Array(256).fill(0);

  for (let y = sampleStep; y < height - sampleStep; y += sampleStep) {
    for (let x = sampleStep; x < width - sampleStep; x += sampleStep) {
      const idx = (y * width + x) * 4;
      const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      const topIdx = ((y - sampleStep) * width + x) * 4;
      const bottomIdx = ((y + sampleStep) * width + x) * 4;
      const leftIdx = (y * width + (x - sampleStep)) * 4;
      const rightIdx = (y * width + (x + sampleStep)) * 4;

      const top = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
      const bottom = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
      const left = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
      const right = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;

      const gx = right - left;
      const gy = bottom - top;
      const gradient = Math.sqrt(gx * gx + gy * gy);

      if (gradient > 30) {
        edgeCount++;
      }

      let localVariance = 0;
      let neighborCount = 0;
      for (let dy = -sampleStep; dy <= sampleStep; dy += sampleStep) {
        for (let dx = -sampleStep; dx <= sampleStep; dx += sampleStep) {
          if (dx === 0 && dy === 0) continue;
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          const neighbor = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
          localVariance += Math.abs(center - neighbor);
          neighborCount++;
        }
      }
      totalLocalVariance += localVariance / neighborCount;

      const grayLevel = Math.floor(center);
      grayLevels[grayLevel]++;

      totalSamples++;
    }
  }

  const edgeDensity = totalSamples > 0 ? edgeCount / totalSamples : 0;
  const textureComplexity = totalSamples > 0 ? totalLocalVariance / totalSamples / 255 : 0;
  const smoothness = 1 - textureComplexity;

  const contrastRatio = edgeDensity * 100;

  let entropy = 0;
  const totalGray = grayLevels.reduce((a, b) => a + b, 0);
  if (totalGray > 0) {
    for (let i = 0; i < 256; i++) {
      const p = grayLevels[i] / totalGray;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
  }
  entropy = entropy / 8;

  return {
    edgeDensity,
    textureComplexity,
    smoothness,
    contrastRatio,
    entropy,
  };
}

function detectFaces(imageData: ImageData): FaceDetectionResult {
  const { data, width, height } = imageData;

  const eyeRegions: Array<{ x: number; y: number; contrast: number }> = [];
  const startY = Math.floor(height * 0.1);
  const endY = Math.floor(height * 0.5);
  const sampleStep = 5;

  for (let y = startY; y < endY; y += sampleStep) {
    for (let x = Math.floor(width * 0.1); x < width * 0.9; x += sampleStep) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      if (brightness < 100) {
        let surroundingBrightness = 0;
        let count = 0;

        for (let dy = -10; dy <= 10; dy += 5) {
          for (let dx = -10; dx <= 10; dx += 5) {
            if (dx === 0 && dy === 0) continue;
            const sIdx = ((y + dy) * width + (x + dx)) * 4;
            if (sIdx >= 0 && sIdx < data.length) {
              surroundingBrightness += (data[sIdx] + data[sIdx + 1] + data[sIdx + 2]) / 3;
              count++;
            }
          }
        }

        if (count > 0) {
          surroundingBrightness /= count;
          const contrast = surroundingBrightness - brightness;

          if (contrast > 30) {
            eyeRegions.push({ x, y, contrast });
          }
        }
      }
    }
  }

  const eyeCount = Math.min(2, Math.floor(eyeRegions.length / 4));

  const centerX = Math.floor(width / 2);
  let symmetryScore = 0;
  let symmetryPoints = 0;

  for (let y = Math.floor(height * 0.1); y < height * 0.6; y += 10) {
    for (let x = 0; x < centerX; x += 10) {
      const leftIdx = (y * width + x) * 4;
      const rightIdx = (y * width + (width - 1 - x)) * 4;

      if (leftIdx < data.length && rightIdx < data.length) {
        const leftBrightness = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
        const rightBrightness = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;

        symmetryScore += 1 - Math.abs(leftBrightness - rightBrightness) / 255;
        symmetryPoints++;
      }
    }
  }

  symmetryScore = symmetryPoints > 0 ? symmetryScore / symmetryPoints : 0;

  const furColorScore = analyzeFurColorScore(data);
  const hasFace = eyeCount >= 1 && symmetryScore > 0.5;
  const confidence = Math.min(1, (eyeCount * 0.3 + symmetryScore * 0.4 + furColorScore * 0.3));

  const boundingBoxes: Array<{ x: number; y: number; width: number; height: number; confidence: number }> = [];
  if (hasFace) {
    const faceWidth = Math.floor(width * 0.6);
    const faceHeight = Math.floor(height * 0.5);
    const faceX = Math.floor((width - faceWidth) / 2);
    const faceY = Math.floor(height * 0.1);
    boundingBoxes.push({
      x: faceX,
      y: faceY,
      width: faceWidth,
      height: faceHeight,
      confidence,
    });
  }

  return {
    hasFace,
    confidence,
    faceCount: hasFace ? 1 : 0,
    eyeCount,
    symmetryScore,
    boundingBoxes,
  };
}

function analyzeFurColorScore(data: Uint8ClampedArray): number {
  let petColorPixels = 0;
  const totalPixels = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const isBrown = isInRange(r, FUR_COLORS.BROWN.r) && isInRange(g, FUR_COLORS.BROWN.g) && isInRange(b, FUR_COLORS.BROWN.b);
    const isBlack = isInRange(r, FUR_COLORS.BLACK.r) && isInRange(g, FUR_COLORS.BLACK.g) && isInRange(b, FUR_COLORS.BLACK.b);
    const isWhite = isInRange(r, FUR_COLORS.WHITE.r) && isInRange(g, FUR_COLORS.WHITE.g) && isInRange(b, FUR_COLORS.WHITE.b);
    const isGray = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && isInRange(r, FUR_COLORS.GRAY.r);
    const isOrange = isInRange(r, FUR_COLORS.ORANGE.r) && isInRange(g, FUR_COLORS.ORANGE.g) && isInRange(b, FUR_COLORS.ORANGE.b);

    if (isBrown || isBlack || isWhite || isGray || isOrange) {
      petColorPixels++;
    }
  }

  return petColorPixels / totalPixels;
}

function analyzeImage(
  imageData: ImageData,
  options: { sampleStep?: number; detectFaces?: boolean } = {}
): ImageAnalysisResult {
  try {
    if (!imageData || !imageData.data || imageData.width === 0 || imageData.height === 0) {
      throw new Error('Invalid image data');
    }

    const { sampleStep = 4, detectFaces = true } = options;

    const colorFeatures = analyzeColorFeatures(imageData, sampleStep);
    const textureFeatures = analyzeTextureFeatures(imageData, sampleStep);
    const faceDetectionResult = detectFaces ? detectFaces(imageData) : {
      hasFace: false,
      confidence: 0,
      faceCount: 0,
      eyeCount: 0,
      symmetryScore: 0,
      boundingBoxes: [],
    };

    return {
      colorFeatures,
      textureFeatures,
      faceDetectionResult,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Image analysis failed: ${message}`);
  }
}

self.onmessage = function (e: MessageEvent<AnalyzeMessage>) {
  const { type, imageData, options } = e.data;

  if (type === 'analyze') {
    try {
      const result = analyzeImage(imageData, options);
      self.postMessage({
        type: 'result',
        result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      self.postMessage({
        type: 'error',
        error: message,
      });
    }
  }
};

export {};
