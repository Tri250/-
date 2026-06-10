// ============================================
// PawSync Pro - Biometric Service
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 跨平台生物识别服务，支持指纹和面部识别
// ============================================

import { platformService } from './platformService';

/**
 * 生物识别类型
 */
export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

/**
 * 生物识别认证结果
 */
export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * 生物识别可用性
 */
export interface BiometricAvailability {
  available: boolean;
  enrolled: boolean;
  types: BiometricType[];
  error?: string;
}

/**
 * 认证选项
 */
export interface BiometricAuthOptions {
  title?: string;
  subtitle?: string;
  description?: string;
  cancelButtonText?: string;
  allowDeviceCredential?: boolean;
}

/**
 * 生物识别服务类
 */
class BiometricService {
  private isAvailable = false;
  private availableTypes: BiometricType[] = [];

  /**
   * 检查生物识别是否可用
   */
  async checkAvailability(): Promise<BiometricAvailability> {
    // Web 端目前支持 WebAuthn，但主要用于安全密钥，不是生物识别
    if (!platformService.isNative()) {
      // 检查 WebAuthn 支持
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          return {
            available: available,
            enrolled: available,
            types: available ? ['fingerprint', 'face'] : ['none'],
          };
        } catch {
          return {
            available: false,
            enrolled: false,
            types: ['none'],
            error: 'WebAuthn 检查失败',
          };
        }
      }
      return {
        available: false,
        enrolled: false,
        types: ['none'],
        error: '浏览器不支持生物识别',
      };
    }

    // 原生平台：这里应该调用原生插件
    // 由于 Capacitor 没有官方生物识别插件，这里返回模拟数据
    // 实际项目中可以使用 @capacitor-community/fingerprint-plugin
    return {
      available: true,
      enrolled: true,
      types: ['fingerprint', 'face'],
    };
  }

  /**
   * 进行生物识别认证
   */
  async authenticate(options: BiometricAuthOptions = {}): Promise<BiometricAuthResult> {
    const availability = await this.checkAvailability();
    
    if (!availability.available) {
      return {
        success: false,
        error: '生物识别不可用',
        errorCode: 'NOT_AVAILABLE',
      };
    }

    if (!availability.enrolled) {
      return {
        success: false,
        error: '未录入生物识别信息',
        errorCode: 'NOT_ENROLLED',
      };
    }

    // Web 端使用 WebAuthn
    if (!platformService.isNative()) {
      return this.webAuthenticate(options);
    }

    // 原生平台：调用原生插件（需要额外安装插件）
    // 这里返回模拟成功
    return {
      success: true,
    };
  }

  /**
   * Web 端认证
   */
  private async webAuthenticate(options: BiometricAuthOptions): Promise<BiometricAuthResult> {
    try {
      // WebAuthn 简单实现
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(32),
        rp: {
          name: 'PawSync Pro',
          id: window.location.hostname,
        },
        user: {
          id: new Uint8Array(16),
          name: 'user',
          displayName: 'User',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      };

      await navigator.credentials.create({ publicKey });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: '认证失败或用户取消',
        errorCode: 'AUTH_FAILED',
      };
    }
  }

  /**
   * 检查是否支持生物识别
   */
  async isSupported(): Promise<boolean> {
    const availability = await this.checkAvailability();
    return availability.available;
  }

  /**
   * 获取支持的生物识别类型
   */
  async getSupportedTypes(): Promise<BiometricType[]> {
    const availability = await this.checkAvailability();
    return availability.types;
  }
}

// 导出单例
export const biometricService = new BiometricService();
export default biometricService;
