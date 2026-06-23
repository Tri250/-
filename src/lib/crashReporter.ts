interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  connectionType?: string;
  online: boolean;
}

interface MemoryInfo {
  usedJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedMB?: number;
  totalMB?: number;
  percentage?: number;
}

interface CrashReport {
  id: string;
  timestamp: string;
  type: 'error' | 'crash' | 'anr' | 'white_screen' | 'unhandled_rejection';
  message: string;
  stack?: string;
  deviceInfo: DeviceInfo;
  memoryInfo: MemoryInfo | null;
  recentActions: string[];
  url: string;
  appState?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

const MAX_REPORTS = 10;
const STORAGE_KEY = 'crash_reports';
const MAX_RECENT_ACTIONS = 20;

class CrashReporter {
  private static instance: CrashReporter;
  private reports: CrashReport[] = [];
  private recentActions: string[] = [];
  private contextData: Record<string, unknown> = {};
  private uploadEndpoint: string | null = null;
  private isEnabled = true;

  static getInstance(): CrashReporter {
    if (!CrashReporter.instance) {
      CrashReporter.instance = new CrashReporter();
    }
    return CrashReporter.instance;
  }

  constructor() {
    this.loadReports();
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  setUploadEndpoint(endpoint: string): void {
    this.uploadEndpoint = endpoint;
  }

  addContext(key: string, value: unknown): void {
    this.contextData[key] = value;
  }

  removeContext(key: string): void {
    delete this.contextData[key];
  }

  clearContext(): void {
    this.contextData = {};
  }

  recordAction(action: string): void {
    const timestampedAction = `${new Date().toISOString()}: ${action}`;
    this.recentActions.push(timestampedAction);
    if (this.recentActions.length > MAX_RECENT_ACTIONS) {
      this.recentActions.shift();
    }
  }

  reportError(error: Error, context?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const report = this.createReport('error', error.message, error.stack, context);
    this.addReport(report);
  }

  reportCrash(error: Error, context?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const report = this.createReport('crash', error.message, error.stack, context);
    this.addReport(report);
    this.uploadReport(report).catch(() => {
      // upload failure is silent
    });
  }

  reportANR(anrData: { duration: number; lastAction: string; stack?: string }): void {
    if (!this.isEnabled) return;

    const report = this.createReport(
      'anr',
      `ANR detected: ${anrData.duration}ms, last action: ${anrData.lastAction}`,
      anrData.stack,
      { anrDuration: anrData.duration, lastAction: anrData.lastAction }
    );
    this.addReport(report);
  }

  reportWhiteScreen(duration: number): void {
    if (!this.isEnabled) return;

    const report = this.createReport(
      'white_screen',
      `White screen detected: ${duration}ms`,
      undefined,
      { whiteScreenDuration: duration }
    );
    this.addReport(report);
  }

  reportUnhandledRejection(reason: unknown, context?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;

    const report = this.createReport('unhandled_rejection', message, stack, context);
    this.addReport(report);
  }

  private createReport(
    type: CrashReport['type'],
    message: string,
    stack?: string,
    context?: Record<string, unknown>
  ): CrashReport {
    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type,
      message,
      stack,
      deviceInfo: this.getDeviceInfo(),
      memoryInfo: this.getMemoryInfo(),
      recentActions: [...this.recentActions],
      url: typeof window !== 'undefined' ? window.location.href : '',
      appState: { ...this.contextData },
      context,
    };
  }

  private addReport(report: CrashReport): void {
    this.reports.unshift(report);
    if (this.reports.length > MAX_REPORTS) {
      this.reports.pop();
    }
    this.saveReports();
  }

  private getDeviceInfo(): DeviceInfo {
    if (typeof navigator === 'undefined') {
      return {
        userAgent: '',
        platform: '',
        language: '',
        screenWidth: 0,
        screenHeight: 0,
        pixelRatio: 1,
        online: true,
      };
    }

    const info: DeviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: typeof screen !== 'undefined' ? screen.width : 0,
      screenHeight: typeof screen !== 'undefined' ? screen.height : 0,
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      online: navigator.onLine,
    };

    const connection = (navigator as Navigator & { connection?: { effectiveType: string } }).connection;
    if (connection) {
      info.connectionType = connection.effectiveType;
    }

    return info;
  }

  private getMemoryInfo(): MemoryInfo | null {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; totalJSHeapSize?: number } }).memory;
    if (!memory) return null;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      usedMB: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
      totalMB: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)),
      percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
    };
  }

  private generateId(): string {
    return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadReports(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.reports = JSON.parse(data);
      }
    } catch {
      this.reports = [];
    }
  }

  private saveReports(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.reports));
    } catch {
      console.warn('Failed to save crash reports to localStorage');
    }
  }

  getReports(): CrashReport[] {
    return [...this.reports];
  }

  getReportById(id: string): CrashReport | undefined {
    return this.reports.find(r => r.id === id);
  }

  clearReports(): void {
    this.reports = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  exportToJSON(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      reportCount: this.reports.length,
      reports: this.reports,
    }, null, 2);
  }

  downloadAsJSON(filename = 'crash-reports.json'): void {
    if (typeof document === 'undefined') return;

    const json = this.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async uploadReport(report: CrashReport): Promise<boolean> {
    if (!this.uploadEndpoint) return false;

    try {
      const response = await fetch(this.uploadEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async uploadAllReports(): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const report of this.reports) {
      const uploaded = await this.uploadReport(report);
      if (uploaded) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  getStats(): {
    totalReports: number;
    byType: Record<CrashReport['type'], number>;
  } {
    const byType: Record<CrashReport['type'], number> = {
      error: 0,
      crash: 0,
      anr: 0,
      white_screen: 0,
      unhandled_rejection: 0,
    };

    this.reports.forEach(report => {
      byType[report.type]++;
    });

    return {
      totalReports: this.reports.length,
      byType,
    };
  }
}

export const crashReporter = CrashReporter.getInstance();

export type { CrashReport, DeviceInfo, MemoryInfo };
