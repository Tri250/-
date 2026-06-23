import { cacheManager } from './cacheManager';

export interface ImageCacheOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
  ttl?: number;
  priority?: 'critical' | 'important' | 'normal' | 'cache';
  namespace?: string;
}

export interface CachedImage {
  url: string;
  originalUrl: string;
  width: number;
  height: number;
  format: string;
  size: number;
  createdAt: number;
  blob: Blob;
  objectUrl: string;
}

export interface ImageCompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

const IMAGE_CACHE_NAMESPACE = 'images';
const DEFAULT_IMAGE_QUALITY = 0.8;
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1920;
const DEFAULT_FORMAT = 'webp';

let webpSupport: boolean | null = null;

function checkWebPSupport(): boolean {
  if (typeof document === 'undefined') return false;
  if (webpSupport !== null) return webpSupport;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  return webpSupport;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function compressImage(
  source: string | Blob | HTMLImageElement,
  options: ImageCompressionOptions = {}
): Promise<{ blob: Blob; width: number; height: number; format: string }> {
  const {
    quality = DEFAULT_IMAGE_QUALITY,
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    format: formatOption,
  } = options;

  const format = formatOption || (checkWebPSupport() ? 'webp' : 'jpeg');
  const mimeType = `image/${format}`;

  let img: HTMLImageElement;
  
  if (source instanceof HTMLImageElement) {
    img = source;
  } else if (source instanceof Blob) {
    const url = URL.createObjectURL(source);
    try {
      img = await loadImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  } else {
    img = await loadImage(source);
  }

  let { width, height } = img;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');
  
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, width, height, format });
        } else {
          reject(new Error('Image compression failed'));
        }
      },
      mimeType,
      quality
    );
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(',');
  const mimeMatch = parts[0].match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

function generateImageKey(url: string, options: ImageCompressionOptions = {}): string {
  const { quality = DEFAULT_IMAGE_QUALITY, maxWidth = DEFAULT_MAX_WIDTH, maxHeight = DEFAULT_MAX_HEIGHT, format } = options;
  const formatStr = format || 'auto';
  return `${url}:${quality}:${maxWidth}x${maxHeight}:${formatStr}`;
}

class ImageCacheManager {
  private static instance: ImageCacheManager;
  private objectUrlCache: Map<string, string> = new Map();
  private preloadQueue: Set<string> = new Set();
  private prefetchQueue: string[] = [];
  private isProcessingPrefetch = false;
  private maxPrefetchConcurrent = 3;

  private constructor() {}

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  async init(): Promise<void> {
    await cacheManager.init();
  }

  async getImage(
    url: string,
    options: ImageCacheOptions = {}
  ): Promise<CachedImage> {
    const {
      quality,
      maxWidth,
      maxHeight,
      format,
      ttl = 7 * 24 * 60 * 60 * 1000,
      priority = 'cache',
      namespace = IMAGE_CACHE_NAMESPACE,
    } = options;

    const compressionOptions: ImageCompressionOptions = { quality, maxWidth, maxHeight, format };
    const cacheKey = generateImageKey(url, compressionOptions);

    const cachedBase64 = await cacheManager.get<string>(cacheKey, { namespace, priority });
    
    if (cachedBase64) {
      const blob = base64ToBlob(cachedBase64);
      const objectUrl = this.getOrCreateObjectUrl(cacheKey, blob);
      
      return {
        url: objectUrl,
        originalUrl: url,
        width: 0,
        height: 0,
        format: format || (checkWebPSupport() ? 'webp' : 'jpeg'),
        size: blob.size,
        createdAt: Date.now(),
        blob,
        objectUrl,
      };
    }

    const compressed = await compressImage(url, compressionOptions);
    const base64 = await blobToBase64(compressed.blob);
    const objectUrl = this.getOrCreateObjectUrl(cacheKey, compressed.blob);

    await cacheManager.set(cacheKey, base64, {
      namespace,
      priority,
      ttl,
    });

    return {
      url: objectUrl,
      originalUrl: url,
      width: compressed.width,
      height: compressed.height,
      format: compressed.format,
      size: compressed.blob.size,
      createdAt: Date.now(),
      blob: compressed.blob,
      objectUrl,
    };
  }

  private getOrCreateObjectUrl(key: string, blob: Blob): string {
    const existing = this.objectUrlCache.get(key);
    if (existing) return existing;

    const objectUrl = URL.createObjectURL(blob);
    this.objectUrlCache.set(key, objectUrl);
    return objectUrl;
  }

  async preload(urls: string[], options: ImageCacheOptions = {}): Promise<void> {
    const promises = urls.map((url) => {
      if (this.preloadQueue.has(url)) return Promise.resolve();
      this.preloadQueue.add(url);
      return this.getImage(url, options).catch(() => {
        this.preloadQueue.delete(url);
      });
    });

    await Promise.allSettled(promises);
  }

  async prefetch(urls: string[], options: ImageCacheOptions = {}): Promise<void> {
    this.prefetchQueue.push(...urls.filter((url) => !this.prefetchQueue.includes(url)));
    this.processPrefetchQueue(options);
  }

  private async processPrefetchQueue(options: ImageCacheOptions): Promise<void> {
    if (this.isProcessingPrefetch) return;
    this.isProcessingPrefetch = true;

    while (this.prefetchQueue.length > 0) {
      const batch = this.prefetchQueue.splice(0, this.maxPrefetchConcurrent);
      
      const promises = batch.map((url) =>
        this.getImage(url, options).catch(() => {})
      );
      
      await Promise.allSettled(promises);
    }

    this.isProcessingPrefetch = false;
  }

  async clearCache(url?: string, options: ImageCacheOptions = {}): Promise<void> {
    const { namespace = IMAGE_CACHE_NAMESPACE } = options;
    
    if (url) {
      const compressionOptions: ImageCompressionOptions = {
        quality: options.quality,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
        format: options.format,
      };
      const cacheKey = generateImageKey(url, compressionOptions);
      
      await cacheManager.delete(cacheKey, { namespace });
      this.revokeObjectUrl(cacheKey);
    } else {
      await cacheManager.clearByNamespace(namespace);
      this.clearAllObjectUrls();
    }
  }

  private revokeObjectUrl(key: string): void {
    const url = this.objectUrlCache.get(key);
    if (url) {
      URL.revokeObjectURL(url);
      this.objectUrlCache.delete(key);
    }
  }

  private clearAllObjectUrls(): void {
    for (const url of this.objectUrlCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.objectUrlCache.clear();
  }

  getPlaceholder(
    width: number,
    height: number,
    color: string = '#e5e7eb',
    textColor: string = '#9ca3af'
  ): string {
    if (typeof document === 'undefined') {
      return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='${encodeURIComponent(color)}' width='${width}' height='${height}'/%3E%3C/svg%3E`;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = textColor;
      ctx.font = `${Math.min(width, height) / 8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('加载中...', width / 2, height / 2);
    }
    
    return canvas.toDataURL();
  }

  getBlurPlaceholder(
    width: number,
    height: number,
    color: string = '#e5e7eb'
  ): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <filter id="blur">
          <feGaussianBlur stdDeviation="20"/>
        </filter>
      </defs>
      <rect fill="${color}" width="${width}" height="${height}" filter="url(#blur)"/>
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  async compress(
    source: string | Blob,
    options: ImageCompressionOptions = {}
  ): Promise<Blob> {
    return compressImage(source, options);
  }

  dispose(): void {
    this.clearAllObjectUrls();
    this.preloadQueue.clear();
    this.prefetchQueue = [];
    this.isProcessingPrefetch = false;
  }
}

export const imageCache = ImageCacheManager.getInstance();

export default imageCache;
