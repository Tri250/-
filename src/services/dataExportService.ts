import { secureStorage, cryptoUtils } from '../utils/security';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';

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

  async generatePDFReport(): Promise<Blob> {
    const data = await this.exportAllData();
    const dateStr = new Date().toLocaleString('zh-CN');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PawSync Pro 宠物健康报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif; color: #333; padding: 40px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header .subtitle { font-size: 14px; opacity: 0.9; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 18px; font-weight: 700; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 8px; margin-bottom: 16px; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat-card { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 700; color: #667eea; }
    .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e0e0e0; font-size: 13px; }
    th { background: #f8f9fa; font-weight: 600; color: #555; }
    .alert-critical { color: #e74c3c; font-weight: 600; }
    .alert-warning { color: #f39c12; font-weight: 600; }
    .alert-info { color: #3498db; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; text-align: center; }
    .checksum { font-family: monospace; font-size: 10px; word-break: break-all; color: #aaa; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PawSync Pro 宠物健康报告</h1>
    <div class="subtitle">生成时间: ${dateStr} | 应用版本: ${this.APP_VERSION}</div>
  </div>

  <div class="section">
    <div class="section-title">数据概览</div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">${data.pets.length}</div>
        <div class="stat-label">宠物数量</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.analyses.length}</div>
        <div class="stat-label">分析记录</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.healthAlerts.length}</div>
        <div class="stat-label">健康提醒</div>
      </div>
    </div>
  </div>

  ${data.pets.length > 0 ? `
  <div class="section">
    <div class="section-title">宠物信息</div>
    <table>
      <thead><tr><th>名称</th><th>品种</th><th>年龄</th><th>类型</th></tr></thead>
      <tbody>
        ${data.pets.map(p => `<tr><td>${p.name}</td><td>${p.breed}</td><td>${p.age}岁</td><td>${p.type}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${data.analyses.length > 0 ? `
  <div class="section">
    <div class="section-title">分析记录</div>
    <table>
      <thead><tr><th>类型</th><th>情绪</th><th>翻译</th><th>置信度</th><th>时间</th></tr></thead>
      <tbody>
        ${data.analyses.slice(0, 20).map(a => `<tr><td>${a.type}</td><td>${a.result.emotion}</td><td>${a.result.translation.length > 30 ? a.result.translation.slice(0, 30) + '...' : a.result.translation}</td><td>${a.result.confidence}%</td><td>${new Date(a.createdAt).toLocaleString('zh-CN')}</td></tr>`).join('')}
      </tbody>
    </table>
    ${data.analyses.length > 20 ? `<p style="margin-top:8px;font-size:12px;color:#999;">... 共 ${data.analyses.length} 条记录，仅显示最近 20 条</p>` : ''}
  </div>` : ''}

  ${data.healthAlerts.length > 0 ? `
  <div class="section">
    <div class="section-title">健康提醒</div>
    <table>
      <thead><tr><th>类型</th><th>严重程度</th><th>消息</th><th>时间</th></tr></thead>
      <tbody>
        ${data.healthAlerts.map(h => `<tr><td>${h.type}</td><td class="alert-${h.severity}">${h.severity}</td><td>${h.message}</td><td>${new Date(h.timestamp).toLocaleString('zh-CN')}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <div class="footer">
    <p>本报告由 PawSync Pro 自动生成</p>
    <p>数据校验码: <span class="checksum">${data.exportMetadata.checksum}</span></p>
    <p>版权 &copy; ${new Date().getFullYear()} PawSync. 保留所有权利。</p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    return blob;
  }

  async downloadPDFReport(): Promise<void> {
    try {
      // 尝试通过后端生成 PDF
      const data = await this.exportAllData();
      const response = await fetch(`${api.getBaseUrl()}/reports/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await api.getToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const pdfBlob = await response.blob();
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `PawSync_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
    } catch (error) {
      console.warn('[DataExportService] Backend PDF generation unavailable, falling back to HTML report:', error);
    }

    // 降级：下载 HTML 格式报告
    const htmlBlob = await this.generatePDFReport();
    const url = URL.createObjectURL(htmlBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PawSync_Report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const dataExportManager = new DataExportManager();