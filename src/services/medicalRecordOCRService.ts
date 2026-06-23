import type { MedicalRecordOCRResult, OCRField, OCRProgress, OCRDocumentType } from '../types/advanced-health';
import { databaseService, STORE_NAMES } from './databaseService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pawsync.com/v1';

// 图片预处理选项
interface PreprocessOptions {
  crop?: { x: number; y: number; width: number; height: number };
  enhanceContrast?: boolean;
  denoise?: boolean;
  rotate?: number;
  brightness?: number;
  sharpen?: boolean;
}

// OCR 识别模板
interface OCRTemplate {
  type: OCRDocumentType;
  name: string;
  fields: OCRField[];
  keywords: string[];
}

const ocrTemplates: OCRTemplate[] = [
  {
    type: 'blood_test',
    name: '血常规检查',
    keywords: ['血常规', '全血细胞计数', 'CBC', '白细胞', '红细胞', '血红蛋白', '血小板'],
    fields: [
      { name: '白细胞(WBC)', key: 'wbc', unit: '×10⁹/L', referenceRange: '5.5-16.9', category: '血常规' },
      { name: '红细胞(RBC)', key: 'rbc', unit: '×10¹²/L', referenceRange: '5.0-10.0', category: '血常规' },
      { name: '血红蛋白(HGB)', key: 'hgb', unit: 'g/L', referenceRange: '110-190', category: '血常规' },
      { name: '红细胞压积(HCT)', key: 'hct', unit: '%', referenceRange: '37-55', category: '血常规' },
      { name: '血小板(PLT)', key: 'plt', unit: '×10⁹/L', referenceRange: '200-500', category: '血常规' },
      { name: '淋巴细胞(LYM)', key: 'lym', unit: '%', referenceRange: '12-30', category: '血常规' },
      { name: '单核细胞(MON)', key: 'mon', unit: '%', referenceRange: '3-10', category: '血常规' },
      { name: '中性粒细胞(GRA)', key: 'gra', unit: '%', referenceRange: '60-80', category: '血常规' },
    ],
  },
  {
    type: 'biochemistry',
    name: '生化检查',
    keywords: ['生化', '肝功能', '肾功能', '血糖', 'ALT', 'AST', 'BUN', 'CREA'],
    fields: [
      { name: '谷丙转氨酶(ALT)', key: 'alt', unit: 'U/L', referenceRange: '10-100', category: '肝功能' },
      { name: '谷草转氨酶(AST)', key: 'ast', unit: 'U/L', referenceRange: '10-60', category: '肝功能' },
      { name: '碱性磷酸酶(ALP)', key: 'alp', unit: 'U/L', referenceRange: '20-200', category: '肝功能' },
      { name: '总胆红素(TBIL)', key: 'tbil', unit: 'μmol/L', referenceRange: '0-15', category: '肝功能' },
      { name: '白蛋白(ALB)', key: 'alb', unit: 'g/L', referenceRange: '25-40', category: '肝功能' },
      { name: '尿素氮(BUN)', key: 'bun', unit: 'mmol/L', referenceRange: '2.5-9.5', category: '肾功能' },
      { name: '肌酐(CREA)', key: 'crea', unit: 'μmol/L', referenceRange: '40-150', category: '肾功能' },
      { name: '血糖(GLU)', key: 'glu', unit: 'mmol/L', referenceRange: '3.5-7.5', category: '代谢' },
      { name: '总蛋白(TP)', key: 'tp', unit: 'g/L', referenceRange: '55-75', category: '代谢' },
      { name: '钙(Ca)', key: 'ca', unit: 'mmol/L', referenceRange: '2.1-2.8', category: '电解质' },
      { name: '磷(P)', key: 'p', unit: 'mmol/L', referenceRange: '0.8-2.1', category: '电解质' },
    ],
  },
  {
    type: 'urinalysis',
    name: '尿液检查',
    keywords: ['尿检', '尿液分析', '尿常规', '尿蛋白', '尿比重'],
    fields: [
      { name: '尿比重', key: 'specific_gravity', unit: '', referenceRange: '1.015-1.045', category: '物理性质' },
      { name: 'pH值', key: 'ph', unit: '', referenceRange: '5.5-7.5', category: '物理性质' },
      { name: '尿蛋白', key: 'protein', unit: '', referenceRange: '阴性', category: '化学性质' },
      { name: '尿糖', key: 'glucose', unit: '', referenceRange: '阴性', category: '化学性质' },
      { name: '潜血', key: 'blood', unit: '', referenceRange: '阴性', category: '化学性质' },
      { name: '白细胞', key: 'wbc', unit: '/HPF', referenceRange: '0-5', category: '镜检' },
      { name: '红细胞', key: 'rbc', unit: '/HPF', referenceRange: '0-3', category: '镜检' },
    ],
  },
  {
    type: 'imaging',
    name: '影像检查',
    keywords: ['X光', 'CT', 'MRI', 'B超', '超声', '影像', '放射'],
    fields: [
      { name: '检查类型', key: 'exam_type', unit: '', referenceRange: '', category: '基本信息' },
      { name: '检查部位', key: 'body_part', unit: '', referenceRange: '', category: '基本信息' },
      { name: '影像所见', key: 'findings', unit: '', referenceRange: '', category: '描述' },
      { name: '诊断意见', key: 'impression', unit: '', referenceRange: '', category: '结论' },
    ],
  },
  {
    type: 'vaccination',
    name: '疫苗接种记录',
    keywords: ['疫苗', '接种', '免疫', '狂犬', '猫三联', '狗四联'],
    fields: [
      { name: '疫苗名称', key: 'vaccine_name', unit: '', referenceRange: '', category: '基本信息' },
      { name: '接种日期', key: 'vaccination_date', unit: '', referenceRange: '', category: '基本信息' },
      { name: '接种医院', key: 'hospital', unit: '', referenceRange: '', category: '基本信息' },
      { name: '下次接种日期', key: 'next_date', unit: '', referenceRange: '', category: '计划' },
      { name: '批号', key: 'batch_number', unit: '', referenceRange: '', category: '追溯' },
    ],
  },
  {
    type: 'prescription',
    name: '处方记录',
    keywords: ['处方', '用药', '药物', '剂量', '用法'],
    fields: [
      { name: '药品名称', key: 'drug_name', unit: '', referenceRange: '', category: '药品信息' },
      { name: '剂量', key: 'dosage', unit: '', referenceRange: '', category: '药品信息' },
      { name: '用法', key: 'administration', unit: '', referenceRange: '', category: '药品信息' },
      { name: '频率', key: 'frequency', unit: '', referenceRange: '', category: '药品信息' },
      { name: '疗程', key: 'duration', unit: '', referenceRange: '', category: '药品信息' },
      { name: '开方医生', key: 'doctor', unit: '', referenceRange: '', category: '开方信息' },
      { name: '开方日期', key: 'prescription_date', unit: '', referenceRange: '', category: '开方信息' },
    ],
  },
  {
    type: 'other',
    name: '其他医疗记录',
    keywords: [],
    fields: [
      { name: '记录类型', key: 'record_type', unit: '', referenceRange: '', category: '基本信息' },
      { name: '记录内容', key: 'content', unit: '', referenceRange: '', category: '内容' },
      { name: '日期', key: 'date', unit: '', referenceRange: '', category: '基本信息' },
      { name: '医院/医生', key: 'source', unit: '', referenceRange: '', category: '来源' },
    ],
  },
];

export class MedicalRecordOCRService {
  private progressCallbacks: Map<string, (progress: OCRProgress) => void> = new Map();

  // ─── 图片预处理（本地 Canvas 操作） ────────────────────────

  private async preprocessImage(imageBase64: string, options: PreprocessOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas 2D context not available')); return; }

        let { width, height } = img;

        // 裁剪
        if (options.crop) {
          canvas.width = options.crop.width;
          canvas.height = options.crop.height;
          ctx.drawImage(img, options.crop.x, options.crop.y, options.crop.width, options.crop.height, 0, 0, options.crop.width, options.crop.height);
        } else {
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0);
        }

        // 旋转
        if (options.rotate) {
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d')!;
          tempCanvas.width = canvas.height;
          tempCanvas.height = canvas.width;
          tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
          tempCtx.rotate((options.rotate * Math.PI) / 180);
          tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
          canvas.width = tempCanvas.width;
          canvas.height = tempCanvas.height;
          ctx.drawImage(tempCanvas, 0, 0);
        }

        // 亮度调整
        if (options.brightness !== undefined) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const adjustment = options.brightness * 2.55;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, data[i] + adjustment));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjustment));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjustment));
          }
          ctx.putImageData(imageData, 0, 0);
        }

        // 对比度增强
        if (options.enhanceContrast) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const contrastFactor = 1.5;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, contrastFactor * (data[i] - 128) + 128));
            data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (data[i + 1] - 128) + 128));
            data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (data[i + 2] - 128) + 128));
          }
          ctx.putImageData(imageData, 0, 0);
        }

        // 锐化
        if (options.sharpen) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const original = new Uint8ClampedArray(imageData.data);
          const data = imageData.data;
          const w = canvas.width;
          const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
          for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                  for (let kx = -1; kx <= 1; kx++) {
                    const idx = ((y + ky) * w + (x + kx)) * 4 + c;
                    sum += original[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
                  }
                }
                data[(y * w + x) * 4 + c] = Math.min(255, Math.max(0, sum));
              }
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }

        // 降噪（简单均值滤波）
        if (options.denoise) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const original = new Uint8ClampedArray(imageData.data);
          const data = imageData.data;
          const w = canvas.width;
          for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              for (let c = 0; c < 3; c++) {
                let sum = 0;
                let count = 0;
                for (let ky = -1; ky <= 1; ky++) {
                  for (let kx = -1; kx <= 1; kx++) {
                    sum += original[((y + ky) * w + (x + kx)) * 4 + c];
                    count++;
                  }
                }
                data[(y * w + x) * 4 + c] = Math.round(sum / count);
              }
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image for preprocessing'));
      img.src = imageBase64;
    });
  }

  // ─── 文档类型检测 ──────────────────────────────────────────

  private detectDocumentType(text: string): OCRDocumentType {
    for (const template of ocrTemplates) {
      if (template.keywords.some(keyword => text.includes(keyword))) {
        return template.type;
      }
    }
    return 'other';
  }

  private getTemplate(type: OCRDocumentType): OCRTemplate {
    return ocrTemplates.find(t => t.type === type) || ocrTemplates[ocrTemplates.length - 1];
  }

  // ─── 进度通知 ──────────────────────────────────────────────

  private notifyProgress(id: string, stage: OCRProgress['stage'], progress: number, message: string): void {
    const callback = this.progressCallbacks.get(id);
    if (callback) {
      callback({ stage, progress, message });
    }
  }

  onProgress(id: string, callback: (progress: OCRProgress) => void): void {
    this.progressCallbacks.set(id, callback);
  }

  removeProgressCallback(id: string): void {
    this.progressCallbacks.delete(id);
  }

  // ─── 核心 OCR API 调用 ─────────────────────────────────────

  async recognizeImage(
    imageBase64: string,
    petId: string,
    documentType?: OCRDocumentType,
    preprocessOptions?: PreprocessOptions,
  ): Promise<MedicalRecordOCRResult> {
    const ocrId = `ocr-${Date.now()}`;

    this.notifyProgress(ocrId, 'preprocessing', 0.1, '正在预处理图片...');

    // 本地图片预处理
    let processedImage = imageBase64;
    if (preprocessOptions) {
      processedImage = await this.preprocessImage(imageBase64, {
        enhanceContrast: true,
        sharpen: true,
        denoise: true,
        ...preprocessOptions,
      });
    } else {
      // 默认预处理：增强对比度+锐化
      processedImage = await this.preprocessImage(imageBase64, {
        enhanceContrast: true,
        sharpen: true,
      });
    }

    this.notifyProgress(ocrId, 'recognizing', 0.3, '正在识别文字...');

    // 调用后端 OCR API
    const response = await fetch(`${API_BASE_URL}/ocr/recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: processedImage,
        petId,
        documentType: documentType || 'auto',
        language: 'zh-CN',
      }),
    });

    if (!response.ok) {
      throw new Error(`OCR API error: ${response.status} ${response.statusText}`);
    }

    this.notifyProgress(ocrId, 'parsing', 0.6, '正在解析结构化数据...');

    const apiResult = await response.json() as {
      text: string;
      confidence: number;
      regions?: Array<{ text: string; bbox: [number, number, number, number] }>;
    };

    // 检测文档类型
    const detectedType = documentType || this.detectDocumentType(apiResult.text);
    const template = this.getTemplate(detectedType);

    this.notifyProgress(ocrId, 'extracting', 0.8, '正在提取结构化字段...');

    // 结构化提取
    const extractedFields = this.extractFields(apiResult.text, template);

    this.notifyProgress(ocrId, 'validating', 0.9, '正在验证结果...');

    const result: MedicalRecordOCRResult = {
      id: ocrId,
      petId,
      documentType: detectedType,
      rawText: apiResult.text,
      confidence: apiResult.confidence,
      fields: extractedFields,
      processedAt: new Date().toISOString(),
    };

    // 持久化到 databaseService
    await databaseService.put(STORE_NAMES.MEDICAL_RECORDS, {
      ...result,
      source: 'ocr',
    });

    this.notifyProgress(ocrId, 'complete', 1.0, '识别完成');

    return result;
  }

  // ─── 结构化字段提取 ────────────────────────────────────────

  private extractFields(rawText: string, template: OCRTemplate): Record<string, { value: string; unit?: string; referenceRange?: string; status?: 'normal' | 'abnormal' | 'critical'; confidence: number }> {
    const fields: Record<string, { value: string; unit?: string; referenceRange?: string; status?: 'normal' | 'abnormal' | 'critical'; confidence: number }> = {};
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (const field of template.fields) {
      let found = false;

      for (const line of lines) {
        // 尝试多种匹配模式
        const patterns = [
          // 格式：字段名 值 单位
          new RegExp(`${field.name}[\\s:：]*(\\S+)[\\s]*(?:${field.unit || '\\S+'})?`, 'i'),
          // 格式：字段名(缩写) 值 单位
          new RegExp(`${field.key}[\\s:：]*(\\S+)[\\s]*(?:${field.unit || '\\S+'})?`, 'i'),
          // 格式：中文名 值
          new RegExp(`${field.name.replace(/[()（）]/g, '[^\\s]*')}[\\s:：]*(\\S+)`, 'i'),
          // 格式：缩写 值
          new RegExp(`\\b${field.key}\\b[\\s:：]*(\\S+)`, 'i'),
        ];

        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match && match[1]) {
            const value = match[1].replace(/[，,。.]/g, '');
            const numericValue = parseFloat(value);

            let status: 'normal' | 'abnormal' | 'critical' | undefined;
            if (field.referenceRange && !isNaN(numericValue)) {
              const rangeMatch = field.referenceRange.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
              if (rangeMatch) {
                const low = parseFloat(rangeMatch[1]);
                const high = parseFloat(rangeMatch[2]);
                if (numericValue < low * 0.7 || numericValue > high * 1.3) {
                  status = 'critical';
                } else if (numericValue < low || numericValue > high) {
                  status = 'abnormal';
                } else {
                  status = 'normal';
                }
              }
            }

            fields[field.key] = {
              value,
              unit: field.unit || undefined,
              referenceRange: field.referenceRange || undefined,
              status,
              confidence: 0.85,
            };
            found = true;
            break;
          }
        }
        if (found) break;
      }

      if (!found) {
        fields[field.key] = {
          value: '',
          unit: field.unit || undefined,
          referenceRange: field.referenceRange || undefined,
          confidence: 0,
        };
      }
    }

    return fields;
  }

  // ─── 批量识别 ──────────────────────────────────────────────

  async recognizeMultipleImages(
    images: Array<{ base64: string; documentType?: OCRDocumentType }>,
    petId: string,
  ): Promise<MedicalRecordOCRResult[]> {
    const results: MedicalRecordOCRResult[] = [];
    for (let i = 0; i < images.length; i++) {
      const { base64, documentType } = images[i];
      const result = await this.recognizeImage(base64, petId, documentType);
      results.push(result);
    }
    return results;
  }

  // ─── 获取 OCR 历史记录 ─────────────────────────────────────

  async getOCRHistory(petId: string, limit: number = 20): Promise<MedicalRecordOCRResult[]> {
    try {
      const records = await databaseService.getByIndex<MedicalRecordOCRResult & { petId: string; source: string }>(
        STORE_NAMES.MEDICAL_RECORDS,
        'petId',
        petId,
      );
      return records
        .filter(r => r.source === 'ocr')
        .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime())
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  // ─── 结果分析 ──────────────────────────────────────────────

  analyzeOCRResult(result: MedicalRecordOCRResult): {
    summary: string;
    abnormalFields: string[];
    criticalFields: string[];
    recommendations: string[];
  } {
    const abnormalFields: string[] = [];
    const criticalFields: string[] = [];
    const recommendations: string[] = [];

    for (const [key, field] of Object.entries(result.fields)) {
      if (field.status === 'critical') {
        criticalFields.push(key);
        recommendations.push(`🔴 ${key} 值为 ${field.value}${field.unit || ''}，严重偏离正常范围（${field.referenceRange}），请立即就医`);
      } else if (field.status === 'abnormal') {
        abnormalFields.push(key);
        recommendations.push(`🟡 ${key} 值为 ${field.value}${field.unit || ''}，偏离正常范围（${field.referenceRange}），建议复查`);
      }
    }

    let summary = '';
    if (criticalFields.length > 0) {
      summary = `发现 ${criticalFields.length} 项严重异常指标，需要紧急就医！`;
    } else if (abnormalFields.length > 0) {
      summary = `发现 ${abnormalFields.length} 项异常指标，建议进一步检查。`;
    } else {
      summary = '各项指标均在正常范围内。';
    }

    return { summary, abnormalFields, criticalFields, recommendations };
  }

  // ─── 获取模板列表 ──────────────────────────────────────────

  getTemplates(): Array<{ type: OCRDocumentType; name: string; fieldCount: number }> {
    return ocrTemplates.map(t => ({ type: t.type, name: t.name, fieldCount: t.fields.length }));
  }

  getTemplateFields(type: OCRDocumentType): OCRField[] {
    const template = this.getTemplate(type);
    return template.fields;
  }

  // ─── 兼容旧组件接口 ────────────────────────────────────────

  async getMedicalRecords(petId: string): Promise<MedicalRecordOCRResult[]> {
    return this.getOCRHistory(petId);
  }

  async recognizeMedicalDocument(
    imageUrl: string,
    documentType: string,
  ): Promise<MedicalRecordOCRResult> {
    return this.recognizeImage(imageUrl, 'unknown', documentType as OCRDocumentType);
  }

  async saveMedicalRecord(
    petId: string,
    record: Partial<MedicalRecordOCRResult> & { documentType?: string },
  ): Promise<MedicalRecordOCRResult> {
    const result: MedicalRecordOCRResult = {
      id: record.id || `med-${Date.now()}`,
      petId,
      documentType: (record.documentType || record.documentType || 'other') as OCRDocumentType,
      rawText: record.rawText || '',
      confidence: record.confidence || 0,
      fields: record.fields || {},
      processedAt: new Date().toISOString(),
    };
    await databaseService.put(STORE_NAMES.MEDICAL_RECORDS, { ...result, source: 'ocr' });
    return result;
  }

  async deleteMedicalRecord(recordId: string): Promise<void> {
    await databaseService.delete(STORE_NAMES.MEDICAL_RECORDS, recordId);
  }

  async exportToPDF(_recordIds: string[]): Promise<{ success: boolean; url?: string }> {
    // PDF 导出需要后端支持，暂时返回未实现
    return { success: false };
  }
}

export const medicalRecordOCRService = new MedicalRecordOCRService();
