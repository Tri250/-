import { secureStorage, cryptoUtils } from '../utils/security';
import { useAppStore } from '../store/appStore';

export interface ExportData {
  user: {
    id: string;
    email: string;
    username: string;
    createdAt: string;
  } | null;
  pets: Array<{
    id: string;
    name: string;
    breed: string;
    age: number;
    type: string;
  }>;
  analyses: Array<{
    id: string;
    petId: string;
    type: string;
    result: {
      emotion: string;
      translation: string;
      confidence: number;
    };
    createdAt: string;
  }>;
  healthAlerts: Array<{
    id: string;
    petId: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
  }>;
  settings: {
    notifications: boolean;
    soundEnabled: boolean;
    darkMode: boolean;
    fontSize: string;
    autoPlay: boolean;
    language: string;
  };
  exportMetadata: {
    exportDate: string;
    appVersion: string;
    dataVersion: string;
    checksum: string;
  };
}

export interface DeletionResult {
  success: boolean;
  deletedItems: string[];
  timestamp: string;
  confirmationCode: string;
}

class DataExportManager {
  private readonly APP_VERSION = '1.0.0';
  private readonly DATA_VERSION = '1.0';

  async exportAllData(): Promise<ExportData> {
    const store = useAppStore.getState();
    
    const data: ExportData = {
      user: store.user ? {
        id: store.user.id,
        email: store.user.email,
        username: store.user.username,
        createdAt: store.user.createdAt,
      } : null,
      pets: store.pets.map(p => ({
        id: p.id,
        name: p.name,
        breed: p.breed,
        age: p.age,
        type: p.type,
      })),
      analyses: store.analyses.map(a => ({
        id: a.id,
        petId: a.petId,
        type: a.type,
        result: a.result,
        createdAt: a.createdAt,
      })),
      healthAlerts: store.healthAlerts.map(h => ({
        id: h.id,
        petId: h.petId,
        type: h.type,
        severity: h.severity,
        message: h.message,
        timestamp: h.timestamp,
      })),
      settings: store.settings,
      exportMetadata: {
        exportDate: new Date().toISOString(),
        appVersion: this.APP_VERSION,
        dataVersion: this.DATA_VERSION,
        checksum: '',
      },
    };

    data.exportMetadata.checksum = await this.generateChecksum(data);
    
    return data;
  }

  private async generateChecksum(data: Omit<ExportData, 'exportMetadata'>): Promise<string> {
    const dataString = JSON.stringify(data);
    return cryptoUtils.sha256(dataString);
  }

  async downloadExportFile(format: 'json' | 'csv' = 'json'): Promise<void> {
    const data = await this.exportAllData();
    
    if (format === 'json') {
      this.downloadJSON(data);
    } else {
      this.downloadCSV(data);
    }
  }

  private downloadJSON(data: ExportData): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `PawSync_DataExport_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private downloadCSV(data: ExportData): void {
    const csvSections: string[] = [];

    if (data.pets.length > 0) {
      csvSections.push('\n=== 宠物信息 ===\n');
      csvSections.push('ID,名称,品种,年龄,类型\n');
      data.pets.forEach(p => {
        csvSections.push(`${p.id},${p.name},${p.breed},${p.age},${p.type}\n`);
      });
    }

    if (data.analyses.length > 0) {
      csvSections.push('\n=== 分析记录 ===\n');
      csvSections.push('ID,宠物ID,类型,情绪,翻译,置信度,创建时间\n');
      data.analyses.forEach(a => {
        csvSections.push(`${a.id},${a.petId},${a.type},${a.result.emotion},${a.result.translation},${a.result.confidence},${a.createdAt}\n`);
      });
    }

    if (data.healthAlerts.length > 0) {
      csvSections.push('\n=== 健康提醒 ===\n');
      csvSections.push('ID,宠物ID,类型,严重程度,消息,时间\n');
      data.healthAlerts.forEach(h => {
        csvSections.push(`${h.id},${h.petId},${h.type},${h.severity},${h.message},${h.timestamp}\n`);
      });
    }

    csvSections.push('\n=== 导出元数据 ===\n');
    csvSections.push(`导出日期: ${data.exportMetadata.exportDate}\n`);
    csvSections.push(`应用版本: ${data.exportMetadata.appVersion}\n`);
    csvSections.push(`数据版本: ${data.exportMetadata.dataVersion}\n`);
    csvSections.push(`校验码: ${data.exportMetadata.checksum}\n`);

    const blob = new Blob([csvSections.join('')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `PawSync_DataExport_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async deleteAccount(): Promise<DeletionResult> {
    const deletedItems: string[] = [];
    const confirmationCode = cryptoUtils.generateRandomString(16);

    try {
      const store = useAppStore.getState();

      if (store.pets.length > 0) {
        deletedItems.push(`宠物数据: ${store.pets.length} 条`);
      }

      if (store.analyses.length > 0) {
        deletedItems.push(`分析记录: ${store.analyses.length} 条`);
      }

      if (store.healthAlerts.length > 0) {
        deletedItems.push(`健康提醒: ${store.healthAlerts.length} 条`);
      }

      secureStorage.clear();
      sessionStorage.clear();
      
      localStorage.removeItem('pawsync_user');
      localStorage.removeItem('pawsync_pets');
      localStorage.removeItem('pawsync_analyses');
      localStorage.removeItem('pawsync_settings');
      localStorage.removeItem('pawsync_health_alerts');
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('PS_') || key.startsWith('pawsync_')) {
          localStorage.removeItem(key);
          deletedItems.push(`本地存储: ${key}`);
        }
      });

      store.clearAllData();
      store.logout();

      deletedItems.push('用户会话');
      deletedItems.push('应用设置');

      return {
        success: true,
        deletedItems,
        timestamp: new Date().toISOString(),
        confirmationCode,
      };
    } catch (error) {
      console.error('Account deletion failed:', error);
      return {
        success: false,
        deletedItems,
        timestamp: new Date().toISOString(),
        confirmationCode: '',
      };
    }
  }

  async verifyDataIntegrity(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    const data = await this.exportAllData();

    if (!data.exportMetadata.checksum) {
      issues.push('缺少数据校验码');
    }

    if (data.pets.length === 0 && data.analyses.length > 0) {
      issues.push('存在分析记录但缺少宠物信息');
    }

    for (const analysis of data.analyses) {
      if (!data.pets.find(p => p.id === analysis.petId)) {
        issues.push(`分析记录 ${analysis.id} 引用了不存在的宠物`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  getExportSummary(): string {
    const store = useAppStore.getState();
    const summary = [
      `数据导出摘要`,
      `- 宠物数量: ${store.pets.length}`,
      `- 分析记录: ${store.analyses.length}`,
      `- 健康提醒: ${store.healthAlerts.length}`,
      `- 导出时间: ${new Date().toLocaleString('zh-CN')}`,
    ];
    return summary.join('\n');
  }
}

export const dataExportManager = new DataExportManager();