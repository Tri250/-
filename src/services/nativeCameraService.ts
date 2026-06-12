/**
 * Native Camera Service - 原生相机服务
 *
 * 统一管理 Web 和 Android/iOS 平台的相机拍照功能
 * 集成 Capacitor Camera API，确保跨平台一致性
 */

import { Capacitor } from '@capacitor/core';
import type { CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * 检查是否为原生平台
 */
const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * 获取当前平台
 */
const getCurrentPlatform = (): 'web' | 'android' | 'ios' => {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() as 'android' | 'ios';
  }
  return 'web';
};

/**
 * 照片选项
 */
export interface PhotoOptions {
  quality?: number; // 0-100
  allowEditing?: boolean;
  resultType?: 'base64' | 'dataUrl' | 'uri';
  source?: 'camera' | 'photos' | 'prompt';
  saveToGallery?: boolean;
  correctOrientation?: boolean;
  width?: number;
  height?: number;
}

/**
 * 照片结果
 */
export interface PhotoResult {
  base64String?: string;
  dataUrl?: string;
  webPath?: string;
  format: string;
  saved?: boolean;
}

/**
 * 相机权限状态
 */
export type CameraPermissionState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';

class NativeCameraService {
  private lastPhoto: PhotoResult | null = null;
  private permissionChecked: boolean = false;

  /**
   * 检查相机权限
   */
  async checkPermission(): Promise<CameraPermissionState> {
    const platform = getCurrentPlatform();
    console.log(`[NativeCamera] Checking permission for platform: ${platform}`);

    try {
      if (isNativePlatform()) {
        const { Camera } = await import('@capacitor/camera');
        const status = await Camera.checkPermissions();
        const cameraState = status.camera as CameraPermissionState;
        console.log(`[NativeCamera] Native permission status: ${cameraState}`);
        return cameraState;
      }

      // Web 平台
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' });
        console.log(`[NativeCamera] Web permission status: ${result.state}`);
        return result.state as CameraPermissionState;
      }

      return 'prompt';
    } catch (error) {
      console.warn('[NativeCamera] Permission check failed:', error);
      return 'prompt';
    }
  }

  /**
   * 请求相机权限
   */
  async requestPermission(): Promise<boolean> {
    const platform = getCurrentPlatform();
    console.log(`[NativeCamera] Requesting permission for platform: ${platform}`);

    try {
      if (isNativePlatform()) {
        const { Camera } = await import('@capacitor/camera');
        const status = await Camera.requestPermissions();
        const granted = status.camera === 'granted';
        console.log(`[NativeCamera] Native permission result: ${granted}`);
        this.permissionChecked = true;
        return granted;
      }

      // Web 平台 - 通过 getUserMedia 请求权限
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('[NativeCamera] Web permission granted via getUserMedia');
        this.permissionChecked = true;
        return true;
      } catch (webError) {
        console.warn('[NativeCamera] Web permission denied:', webError);
        return false;
      }
    } catch (error) {
      console.error('[NativeCamera] Permission request failed:', error);
      return false;
    }
  }

  /**
   * 获取照片（支持原生平台）
   */
  async getPhoto(options: PhotoOptions = {}): Promise<PhotoResult | null> {
    const platform = getCurrentPlatform();
    console.log(`[NativeCamera] Getting photo for platform: ${platform}`, options);

    // 默认选项
    const defaultOptions: PhotoOptions = {
      quality: 80,
      allowEditing: false,
      resultType: 'base64',
      source: 'prompt',
      saveToGallery: false,
      correctOrientation: true,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      // 检查权限
      if (!this.permissionChecked) {
        const permission = await this.checkPermission();
        if (permission !== 'granted') {
          const granted = await this.requestPermission();
          if (!granted) {
            console.warn('[NativeCamera] Permission not granted, cannot take photo');
            return null;
          }
        }
      }

      // 原生平台使用 Capacitor Camera
      if (isNativePlatform()) {
        return await this.getNativePhoto(mergedOptions);
      }

      // Web 平台使用文件输入
      return await this.getWebPhoto(mergedOptions);
    } catch (error) {
      console.error('[NativeCamera] Failed to get photo:', error);
      return null;
    }
  }

  /**
   * 使用原生相机获取照片
   */
  private async getNativePhoto(options: PhotoOptions): Promise<PhotoResult | null> {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

      // 映射 source
      const sourceMap: Record<string, CameraSource> = {
        'camera': CameraSource.Camera,
        'photos': CameraSource.Photos,
        'prompt': CameraSource.Prompt,
      };

      // 映射 resultType
      const resultTypeMap: Record<string, CameraResultType> = {
        'base64': CameraResultType.Base64,
        'dataUrl': CameraResultType.DataUrl,
        'uri': CameraResultType.Uri,
      };

      const photo = await Camera.getPhoto({
        quality: options.quality ?? 80,
        allowEditing: options.allowEditing ?? false,
        resultType: resultTypeMap[options.resultType ?? 'base64'],
        source: sourceMap[options.source ?? 'prompt'],
        saveToGallery: options.saveToGallery ?? false,
        correctOrientation: options.correctOrientation ?? true,
        width: options.width,
        height: options.height,
      });

      console.log('[NativeCamera] Native photo captured successfully');

      const result: PhotoResult = {
        base64String: photo.base64String,
        dataUrl: photo.dataUrl,
        webPath: photo.webPath,
        format: photo.format,
        saved: photo.saved,
      };

      this.lastPhoto = result;
      return result;
    } catch (error) {
      console.error('[NativeCamera] Native photo capture failed:', error);
      return null;
    }
  }

  /**
   * 使用 Web 文件输入获取照片
   */
  private async getWebPhoto(options: PhotoOptions): Promise<PhotoResult | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      // 根据 source 设置 capture
      if (options.source === 'camera') {
        input.capture = 'environment';
      }

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          console.warn('[NativeCamera] No file selected');
          resolve(null);
          return;
        }

        console.log('[NativeCamera] Web photo selected:', file.name);

        try {
          if (options.resultType === 'uri') {
            // 返回 blob URL
            const blobUrl = URL.createObjectURL(file);
            const result: PhotoResult = {
              webPath: blobUrl,
              format: file.type.split('/')[1] || 'jpeg',
            };
            this.lastPhoto = result;
            resolve(result);
          } else {
            // 返回 base64 或 dataUrl
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              const result: PhotoResult = {
                base64String: options.resultType === 'base64' ? dataUrl.split(',')[1] : undefined,
                dataUrl: options.resultType === 'dataUrl' ? dataUrl : undefined,
                webPath: dataUrl,
                format: file.type.split('/')[1] || 'jpeg',
              };
              this.lastPhoto = result;
              resolve(result);
            };
            reader.onerror = () => {
              console.error('[NativeCamera] FileReader error');
              resolve(null);
            };
            reader.readAsDataURL(file);
          }
        } catch (error) {
          console.error('[NativeCamera] Web photo processing failed:', error);
          resolve(null);
        }
      };

      // 触发文件选择
      input.click();
    });
  }

  /**
   * 从相机直接拍照
   */
  async takePhoto(options: PhotoOptions = {}): Promise<PhotoResult | null> {
    return this.getPhoto({ ...options, source: 'camera' });
  }

  /**
   * 从相册选择照片
   */
  async selectPhoto(options: PhotoOptions = {}): Promise<PhotoResult | null> {
    return this.getPhoto({ ...options, source: 'photos' });
  }

  /**
   * 获取最后拍摄的照片
   */
  getLastPhoto(): PhotoResult | null {
    return this.lastPhoto;
  }

  /**
   * 清除最后拍摄的照片
   */
  clearLastPhoto(): void {
    if (this.lastPhoto?.webPath?.startsWith('blob:')) {
      URL.revokeObjectURL(this.lastPhoto.webPath);
    }
    this.lastPhoto = null;
  }

  /**
   * 检查是否支持相机
   */
  async isCameraAvailable(): Promise<boolean> {
    try {
      if (isNativePlatform()) {
        // 原生平台通常都有相机
        return true;
      }

      // Web 平台检查
      if ('mediaDevices' in navigator) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.some(device => device.kind === 'videoinput');
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 获取平台信息
   */
  getPlatformInfo(): { platform: string; isNative: boolean; hasPermission: boolean } {
    return {
      platform: getCurrentPlatform(),
      isNative: isNativePlatform(),
      hasPermission: this.permissionChecked,
    };
  }
}

export const nativeCameraService = new NativeCameraService();

/**
 * 相机服务 Hook
 */
export function useNativeCamera() {
  const checkPermission = async (): Promise<CameraPermissionState> => {
    return nativeCameraService.checkPermission();
  };

  const requestPermission = async (): Promise<boolean> => {
    return nativeCameraService.requestPermission();
  };

  const getPhoto = async (options?: PhotoOptions): Promise<PhotoResult | null> => {
    return nativeCameraService.getPhoto(options);
  };

  const takePhoto = async (options?: PhotoOptions): Promise<PhotoResult | null> => {
    return nativeCameraService.takePhoto(options);
  };

  const selectPhoto = async (options?: PhotoOptions): Promise<PhotoResult | null> => {
    return nativeCameraService.selectPhoto(options);
  };

  const isAvailable = async (): Promise<boolean> => {
    return nativeCameraService.isCameraAvailable();
  };

  return {
    checkPermission,
    requestPermission,
    getPhoto,
    takePhoto,
    selectPhoto,
    isAvailable,
    getLastPhoto: nativeCameraService.getLastPhoto(),
    clearLastPhoto: nativeCameraService.clearLastPhoto,
    platformInfo: nativeCameraService.getPlatformInfo(),
  };
}