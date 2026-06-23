/**
 * FeatureMode - 功能真实性框架
 *
 * 为 PawSync Pro 提供三种运行模式：
 * - demo: 演示/模拟模式，全部使用模拟数据
 * - hybrid: 混合模式，部分服务使用真实实现，部分使用模拟
 * - real: 真实模式，全部使用真实实现
 *
 * 支持服务注册、模式切换、持久化存储和诊断功能
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================
// 类型定义
// ============================================

export type FeatureModeType = 'demo' | 'hybrid' | 'real';

export type ServiceImplementationType = 'real' | 'mock';

export interface ServiceRegistration<T = unknown> {
  name: string;
  real?: T;
  mock?: T;
  defaultMode?: ServiceImplementationType;
  description?: string;
  category?: string;
}

export interface ServiceStatus {
  name: string;
  activeImplementation: ServiceImplementationType;
  hasReal: boolean;
  hasMock: boolean;
  defaultMode: ServiceImplementationType;
  description?: string;
  category?: string;
}

export interface FeatureModeDiagnostics {
  currentMode: FeatureModeType;
  totalServices: number;
  realServices: number;
  mockServices: number;
  services: ServiceStatus[];
  storageKey: string;
  isPersisted: boolean;
  lastUpdated: string;
}

export interface ModeBadgeConfig {
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple';
  label: string;
  icon?: string;
  description: string;
}

export interface ModeValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

type ModeChangeListener = (mode: FeatureModeType) => void;
type ServiceRegistryMap = Map<string, ServiceRegistration>;

// ============================================
// 常量配置
// ============================================

const STORAGE_KEY = 'pawsync-feature-mode';
const DEFAULT_MODE: FeatureModeType = 'demo';

export const MODE_BADGE_CONFIGS: Record<FeatureModeType, ModeBadgeConfig> = {
  demo: {
    variant: 'warning',
    label: '演示模式',
    description: '所有服务使用模拟数据，适合演示和测试',
  },
  hybrid: {
    variant: 'primary',
    label: '混合模式',
    description: '部分服务使用真实实现，部分使用模拟',
  },
  real: {
    variant: 'success',
    label: '真实模式',
    description: '所有服务使用真实后端连接',
  },
};

// ============================================
// FeatureModeManager 类
// ============================================

class FeatureModeManager {
  private mode: FeatureModeType;
  private services: ServiceRegistryMap;
  private listeners: Set<ModeChangeListener>;
  private hybridOverrides: Map<string, ServiceImplementationType>;

  constructor() {
    this.mode = this.loadMode();
    this.services = new Map();
    this.listeners = new Set();
    this.hybridOverrides = new Map();
  }

  private loadMode(): FeatureModeType {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'demo' || saved === 'hybrid' || saved === 'real')) {
        return saved;
      }
    } catch {
      // ignore
    }
    return DEFAULT_MODE;
  }

  private saveMode(): void {
    try {
      localStorage.setItem(STORAGE_KEY, this.mode);
    } catch {
      // ignore
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.mode));
  }

  getMode(): FeatureModeType {
    return this.mode;
  }

  async setMode(mode: FeatureModeType): Promise<ModeValidationResult> {
    const validation = await this.validateModeChange(mode);
    if (!validation.valid) {
      return validation;
    }

    this.mode = mode;
    this.saveMode();
    this.notifyListeners();

    return { valid: true };
  }

  async validateModeChange(targetMode: FeatureModeType): Promise<ModeValidationResult> {
    const warnings: string[] = [];

    if (targetMode === this.mode) {
      return { valid: true };
    }

    if (targetMode === 'real') {
      const realServices = Array.from(this.services.values()).filter((s) => s.real);
      if (realServices.length === 0 && this.services.size > 0) {
        return {
          valid: false,
          error: '没有注册任何真实服务实现，无法切换到真实模式',
        };
      }

      const backendCheck = await this.checkBackendConnectivity();
      if (!backendCheck.ok) {
        return {
          valid: false,
          error: `无法连接到后端服务: ${backendCheck.error}`,
        };
      }

      if (backendCheck.warning) {
        warnings.push(backendCheck.warning);
      }
    }

    if (targetMode === 'demo') {
      const mockServices = Array.from(this.services.values()).filter((s) => s.mock);
      if (mockServices.length === 0 && this.services.size > 0) {
        warnings.push('当前没有注册任何模拟服务实现');
      }
    }

    return { valid: true, warnings };
  }

  private async checkBackendConnectivity(): Promise<{ ok: boolean; error?: string; warning?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (!response) {
        return { ok: false, error: '网络连接失败' };
      }

      if (!response.ok) {
        return { ok: false, error: `健康检查返回 ${response.status}` };
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  registerService<T = unknown>(registration: ServiceRegistration<T>): void {
    if (this.services.has(registration.name)) {
      console.warn(`[FeatureMode] Service "${registration.name}" is already registered, overwriting`);
    }

    this.services.set(registration.name, {
      ...registration,
      defaultMode: registration.defaultMode ?? 'mock',
    } as ServiceRegistration);
  }

  unregisterService(name: string): boolean {
    return this.services.delete(name);
  }

  getService<T = unknown>(name: string): T | undefined {
    const service = this.services.get(name);
    if (!service) {
      console.warn(`[FeatureMode] Service "${name}" not found`);
      return undefined;
    }

    const implType = this.getServiceImplementationType(name);

    if (implType === 'real' && service.real) {
      return service.real as T;
    }

    if (service.mock) {
      return service.mock as T;
    }

    if (service.real) {
      return service.real as T;
    }

    console.warn(`[FeatureMode] Service "${name}" has no implementation available`);
    return undefined;
  }

  getServiceImplementationType(name: string): ServiceImplementationType {
    const service = this.services.get(name);
    if (!service) {
      return 'mock';
    }

    if (this.mode === 'demo') {
      return 'mock';
    }

    if (this.mode === 'real') {
      return service.real ? 'real' : 'mock';
    }

    if (this.mode === 'hybrid') {
      const override = this.hybridOverrides.get(name);
      if (override) {
        return override;
      }
      return service.defaultMode ?? 'mock';
    }

    return 'mock';
  }

  setHybridServiceMode(serviceName: string, implType: ServiceImplementationType): boolean {
    const service = this.services.get(serviceName);
    if (!service) {
      return false;
    }

    if (implType === 'real' && !service.real) {
      console.warn(`[FeatureMode] Service "${serviceName}" has no real implementation`);
      return false;
    }

    if (implType === 'mock' && !service.mock) {
      console.warn(`[FeatureMode] Service "${serviceName}" has no mock implementation`);
      return false;
    }

    this.hybridOverrides.set(serviceName, implType);
    this.notifyListeners();
    return true;
  }

  resetHybridServiceMode(serviceName: string): void {
    this.hybridOverrides.delete(serviceName);
    this.notifyListeners();
  }

  resetAllHybridOverrides(): void {
    this.hybridOverrides.clear();
    this.notifyListeners();
  }

  getServiceStatus(name: string): ServiceStatus | undefined {
    const service = this.services.get(name);
    if (!service) {
      return undefined;
    }

    return {
      name: service.name,
      activeImplementation: this.getServiceImplementationType(name),
      hasReal: !!service.real,
      hasMock: !!service.mock,
      defaultMode: service.defaultMode ?? 'mock',
      description: service.description,
      category: service.category,
    };
  }

  getAllServiceStatuses(): ServiceStatus[] {
    return Array.from(this.services.keys())
      .map((name) => this.getServiceStatus(name))
      .filter((s): s is ServiceStatus => s !== undefined);
  }

  getDiagnostics(): FeatureModeDiagnostics {
    const statuses = this.getAllServiceStatuses();
    const realServices = statuses.filter((s) => s.activeImplementation === 'real').length;

    return {
      currentMode: this.mode,
      totalServices: statuses.length,
      realServices,
      mockServices: statuses.length - realServices,
      services: statuses,
      storageKey: STORAGE_KEY,
      isPersisted: this.isModePersisted(),
      lastUpdated: new Date().toISOString(),
    };
  }

  isModePersisted(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }

  resetToDefault(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    this.mode = DEFAULT_MODE;
    this.hybridOverrides.clear();
    this.notifyListeners();
  }

  subscribe(listener: ModeChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getRegisteredServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
}

// ============================================
// 单例实例
// ============================================

const featureModeManager = new FeatureModeManager();

export const getFeatureModeManager = (): FeatureModeManager => {
  return featureModeManager;
};

// ============================================
// 便捷函数
// ============================================

export const getCurrentMode = (): FeatureModeType => {
  return featureModeManager.getMode();
};

export const setFeatureMode = async (mode: FeatureModeType): Promise<ModeValidationResult> => {
  return featureModeManager.setMode(mode);
};

export const getService = <T = unknown>(name: string): T | undefined => {
  return featureModeManager.getService<T>(name);
};

export const registerService = <T = unknown>(registration: ServiceRegistration<T>): void => {
  featureModeManager.registerService(registration);
};

export const getModeBadgeConfig = (mode?: FeatureModeType): ModeBadgeConfig => {
  const currentMode = mode ?? featureModeManager.getMode();
  return MODE_BADGE_CONFIGS[currentMode];
};

export const getFeatureModeDiagnostics = (): FeatureModeDiagnostics => {
  return featureModeManager.getDiagnostics();
};

// ============================================
// React Hook: useFeatureMode
// ============================================

export function useFeatureMode() {
  const [mode, setModeState] = useState<FeatureModeType>(() => featureModeManager.getMode());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = featureModeManager.subscribe((newMode) => {
      setModeState(newMode);
    });
    return unsubscribe;
  }, []);

  const setMode = useCallback(async (newMode: FeatureModeType): Promise<ModeValidationResult> => {
    setIsTransitioning(true);
    setError(null);

    try {
      const result = await featureModeManager.setMode(newMode);
      if (!result.valid && result.error) {
        setError(result.error);
      }
      return result;
    } finally {
      setIsTransitioning(false);
    }
  }, []);

  const validateModeChange = useCallback(async (targetMode: FeatureModeType): Promise<ModeValidationResult> => {
    return featureModeManager.validateModeChange(targetMode);
  }, []);

  const getServiceImpl = useCallback(<T = unknown>(name: string): T | undefined => {
    return featureModeManager.getService<T>(name);
  }, []);

  const getServiceStatus = useCallback((name: string): ServiceStatus | undefined => {
    return featureModeManager.getServiceStatus(name);
  }, []);

  const getAllServices = useCallback((): ServiceStatus[] => {
    return featureModeManager.getAllServiceStatuses();
  }, []);

  const setHybridServiceMode = useCallback((serviceName: string, implType: ServiceImplementationType): boolean => {
    return featureModeManager.setHybridServiceMode(serviceName, implType);
  }, []);

  const resetHybridServiceMode = useCallback((serviceName: string): void => {
    featureModeManager.resetHybridServiceMode(serviceName);
  }, []);

  const resetAllHybridOverrides = useCallback((): void => {
    featureModeManager.resetAllHybridOverrides();
  }, []);

  const getDiagnostics = useCallback((): FeatureModeDiagnostics => {
    return featureModeManager.getDiagnostics();
  }, []);

  const resetToDefault = useCallback((): void => {
    featureModeManager.resetToDefault();
    setError(null);
  }, []);

  const badgeConfig = useMemo(() => MODE_BADGE_CONFIGS[mode], [mode]);

  return {
    mode,
    setMode,
    isTransitioning,
    error,
    clearError: () => setError(null),
    validateModeChange,
    getServiceImpl,
    getServiceStatus,
    getAllServices,
    setHybridServiceMode,
    resetHybridServiceMode,
    resetAllHybridOverrides,
    getDiagnostics,
    resetToDefault,
    badgeConfig,
    isDemo: mode === 'demo',
    isHybrid: mode === 'hybrid',
    isReal: mode === 'real',
  };
}

// ============================================
// React Hook: useFeatureModeService
// ============================================

export function useFeatureModeService<T = unknown>(serviceName: string): {
  service: T | undefined;
  implType: ServiceImplementationType;
  status: ServiceStatus | undefined;
} {
  const [implType, setImplType] = useState<ServiceImplementationType>(() =>
    featureModeManager.getServiceImplementationType(serviceName)
  );

  useEffect(() => {
    const updateImpl = () => {
      setImplType(featureModeManager.getServiceImplementationType(serviceName));
    };

    const unsubscribe = featureModeManager.subscribe(updateImpl);
    return unsubscribe;
  }, [serviceName]);

  const service = useMemo(() => {
    return featureModeManager.getService<T>(serviceName);
  }, [serviceName, implType]);

  const status = useMemo(() => {
    return featureModeManager.getServiceStatus(serviceName);
  }, [serviceName, implType]);

  return { service, implType, status };
}
