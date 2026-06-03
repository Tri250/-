// ============================================
// PawSync Pro 3.0 - Medical Record OCR Service
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 电子病历OCR识别和管理服务
// ============================================

import type { MedicalRecord, MedicationInfo, LabResult, VetHospital as _VetHospital } from '../types/advanced-health';

const MOCK_DELAY = 1000;

// OCR识别结果
interface OCRResult {
  success: boolean;
  confidence: number;
  extractedData: {
    date?: string;
    hospital?: string;
    veterinarian?: string;
    diagnosis?: string;
    treatment?: string;
    medications?: MedicationInfo[];
    labResults?: LabResult[];
  };
  rawText: string;
  suggestions?: string[];
}

class MedicalRecordOCRService {
  private medicalRecords: MedicalRecord[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    this.medicalRecords = [
      {
        id: 'record-1',
        petId: '1',
        type: 'checkup',
        date: '2026-05-15',
        hospital: '宠物王国24小时医院',
        veterinarian: '张医生',
        diagnosis: '整体健康状况良好，体重略低于标准',
        treatment: '建议调整饮食结构，增加蛋白质摄入',
        medications: [
          {
            name: '宠物专用益生菌',
            dosage: '1袋/次',
            frequency: '每日2次',
            duration: '30天',
            instructions: '饭后半小时服用，用温水冲泡'
          }
        ],
        notes: '猫咪性格温顺，配合检查',
        ocrConfidence: 0.95,
        createdAt: '2026-05-15T14:30:00Z',
        updatedAt: '2026-05-15T14:30:00Z'
      },
      {
        id: 'record-2',
        petId: '1',
        type: 'lab_report',
        date: '2026-04-20',
        hospital: '萌爪宠物医疗中心',
        veterinarian: '李医生',
        diagnosis: '血液常规检查',
        labResults: [
          {
            testName: '白细胞计数',
            result: '12.5',
            unit: '10^9/L',
            referenceRange: '6.0-17.0',
            status: 'normal'
          },
          {
            testName: '红细胞计数',
            result: '8.2',
            unit: '10^12/L',
            referenceRange: '5.5-10.0',
            status: 'normal'
          },
          {
            testName: '血红蛋白',
            result: '130',
            unit: 'g/L',
            referenceRange: '110-170',
            status: 'normal'
          },
          {
            testName: '血小板',
            result: '250',
            unit: '10^9/L',
            referenceRange: '100-500',
            status: 'normal'
          },
          {
            testName: 'ALT谷丙转氨酶',
            result: '45',
            unit: 'U/L',
            referenceRange: '10-100',
            status: 'normal'
          },
          {
            testName: 'ALP碱性磷酸酶',
            result: '38',
            unit: 'U/L',
            referenceRange: '20-150',
            status: 'normal'
          }
        ],
        notes: '肝肾功能正常',
        ocrConfidence: 0.92,
        createdAt: '2026-04-20T10:15:00Z',
        updatedAt: '2026-04-20T10:15:00Z'
      },
      {
        id: 'record-3',
        petId: '1',
        type: 'vaccination',
        date: '2025-12-15',
        hospital: '宠物王国24小时医院',
        veterinarian: '王医生',
        diagnosis: '狂犬疫苗接种',
        treatment: '已完成狂犬病疫苗接种',
        medications: [],
        attachments: ['vaccine-cert.jpg'],
        ocrConfidence: 0.98,
        createdAt: '2025-12-15T16:00:00Z',
        updatedAt: '2025-12-15T16:00:00Z'
      }
    ];
  }

  // OCR识别体检报告/化验单
  async recognizeMedicalDocument(
    imageUrl: string,
    documentType: 'checkup' | 'lab_report' | 'prescription' | 'vaccination' | 'other'
  ): Promise<OCRResult> {
    await this.simulateDelay(MOCK_DELAY * 2);
    
    // 模拟OCR识别结果
    const mockResults: Record<string, OCRResult> = {
      checkup: {
        success: true,
        confidence: 0.94,
        extractedData: {
          date: new Date().toISOString().split('T')[0],
          hospital: '市中心宠物医院',
          veterinarian: '陈医生',
          diagnosis: '常规体检，各项指标正常',
          treatment: '建议继续保持当前饲养方式',
          medications: []
        },
        rawText: '宠物名称：糖糖\n性别：雄\n年龄：2岁\n体重：4.3kg\n体温：38.5℃\n体检日期：2026年5月26日\n体检医院：市中心宠物医院\n主诊医生：陈医生\n诊断结果：常规体检，各项指标正常\n建议：建议继续保持当前饲养方式，定期体检',
        suggestions: ['建议补充一些微量元素', '注意口腔卫生']
      },
      lab_report: {
        success: true,
        confidence: 0.91,
        extractedData: {
          date: new Date().toISOString().split('T')[0],
          hospital: '萌爪宠物医疗中心',
          veterinarian: '李医生',
          labResults: [
            {
              testName: '血糖',
              result: '5.2',
              unit: 'mmol/L',
              referenceRange: '4.1-8.5',
              status: 'normal'
            },
            {
              testName: '肌酐',
              result: '120',
              unit: 'μmol/L',
              referenceRange: '80-180',
              status: 'normal'
            }
          ]
        },
        rawText: '化验单\n宠物名：糖糖\n日期：2026年5月26日\n医院：萌爪宠物医疗中心\n化验项目：\n1. 血糖 5.2 mmol/L (参考值4.1-8.5) 正常\n2. 肌酐 120 μmol/L (参考值80-180) 正常\n3. 尿素氮 6.5 mmol/L (参考值4.0-10.0) 正常',
        suggestions: ['各项指标正常，继续保持']
      },
      prescription: {
        success: true,
        confidence: 0.89,
        extractedData: {
          date: new Date().toISOString().split('T')[0],
          hospital: '宠物王国医院',
          veterinarian: '张医生',
          medications: [
            {
              name: '消炎药',
              dosage: '50mg',
              frequency: '每日2次',
              duration: '7天',
              instructions: '饭后服用'
            },
            {
              name: '止疼药',
              dosage: '25mg',
              frequency: '每日1次',
              duration: '3天',
              instructions: '必要时服用'
            }
          ]
        },
        rawText: '处方笺\n日期：2026年5月26日\n医院：宠物王国医院\n医生：张医生\n药品：\n1. 消炎药 50mg 用法：每日2次，每次1片，饭后服用，共7天\n2. 止疼药 25mg 用法：每日1次，每次1片，必要时服用，共3天',
        suggestions: ['遵医嘱按时服药', '注意观察用药后反应']
      }
    };

    return mockResults[documentType] || mockResults.checkup;
  }

  // 保存识别结果为病历
  async saveMedicalRecord(
    petId: string,
    recordData: {
      type: MedicalRecord['type'];
      date: string;
      hospital: string;
      veterinarian: string;
      diagnosis?: string;
      treatment?: string;
      medications?: MedicationInfo[];
      labResults?: LabResult[];
      notes?: string;
      ocrConfidence?: number;
    }
  ): Promise<MedicalRecord> {
    await this.simulateDelay(MOCK_DELAY);
    
    const newRecord: MedicalRecord = {
      id: `record-${Date.now()}`,
      petId,
      ...recordData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.medicalRecords.unshift(newRecord);
    return newRecord;
  }

  // 获取宠物所有病历
  async getMedicalRecords(
    petId: string,
    options?: {
      type?: MedicalRecord['type'];
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<MedicalRecord[]> {
    await this.simulateDelay(MOCK_DELAY);
    
    let filtered = this.medicalRecords.filter(r => r.petId === petId);
    
    if (options?.type) {
      filtered = filtered.filter(r => r.type === options.type);
    }
    
    if (options?.startDate) {
      filtered = filtered.filter(r => r.date >= options.startDate!);
    }
    
    if (options?.endDate) {
      filtered = filtered.filter(r => r.date <= options.endDate!);
    }
    
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }

  // 获取单个病历详情
  async getMedicalRecord(recordId: string): Promise<MedicalRecord | null> {
    await this.simulateDelay(MOCK_DELAY / 2);
    return this.medicalRecords.find(r => r.id === recordId) || null;
  }

  // 更新病历
  async updateMedicalRecord(
    recordId: string,
    updates: Partial<MedicalRecord>
  ): Promise<MedicalRecord | null> {
    await this.simulateDelay(MOCK_DELAY);
    
    const index = this.medicalRecords.findIndex(r => r.id === recordId);
    if (index === -1) return null;
    
    this.medicalRecords[index] = {
      ...this.medicalRecords[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.medicalRecords[index];
  }

  // 删除病历
  async deleteMedicalRecord(recordId: string): Promise<boolean> {
    await this.simulateDelay(MOCK_DELAY / 2);
    
    const index = this.medicalRecords.findIndex(r => r.id === recordId);
    if (index === -1) return false;
    
    this.medicalRecords.splice(index, 1);
    return true;
  }

  // 导出PDF
  async exportToPDF(
    recordIds: string[],
    _options?: {
      includeImages?: boolean;
      language?: 'zh' | 'en';
    }
  ): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
    await this.simulateDelay(MOCK_DELAY * 2);
    
    // 模拟PDF生成
    const records = this.medicalRecords.filter(r => recordIds.includes(r.id));
    
    if (records.length === 0) {
      return {
        success: false,
        error: '未找到指定的病历记录'
      };
    }
    
    return {
      success: true,
      pdfUrl: `/exports/medical-records-${Date.now()}.pdf`
    };
  }

  // 获取病历类型配置
  getRecordTypeConfig(type: MedicalRecord['type']) {
    const config = {
      checkup: { icon: '🩺', label: '体检报告', color: 'blue' },
      lab_report: { icon: '🧪', label: '化验单', color: 'purple' },
      prescription: { icon: '💊', label: '处方单', color: 'orange' },
      vaccination: { icon: '💉', label: '疫苗接种', color: 'green' },
      surgery: { icon: '🏥', label: '手术记录', color: 'red' },
      other: { icon: '📄', label: '其他', color: 'gray' }
    };
    
    return config[type];
  }

  // 获取实验室检查项目的中英文对照
  getLabTestMapping() {
    return {
      // 血液常规
      WBC: { name: '白细胞计数', unit: '10^9/L', referenceRange: '6.0-17.0' },
      RBC: { name: '红细胞计数', unit: '10^12/L', referenceRange: '5.5-10.0' },
      HGB: { name: '血红蛋白', unit: 'g/L', referenceRange: '110-170' },
      PLT: { name: '血小板', unit: '10^9/L', referenceRange: '100-500' },
      // 生化指标
      ALT: { name: '谷丙转氨酶', unit: 'U/L', referenceRange: '10-100' },
      ALP: { name: '碱性磷酸酶', unit: 'U/L', referenceRange: '20-150' },
      CREA: { name: '肌酐', unit: 'μmol/L', referenceRange: '80-180' },
      BUN: { name: '尿素氮', unit: 'mmol/L', referenceRange: '4.0-10.0' },
      GLU: { name: '血糖', unit: 'mmol/L', referenceRange: '4.1-8.5' },
      TP: { name: '总蛋白', unit: 'g/L', referenceRange: '55-85' },
      ALB: { name: '白蛋白', unit: 'g/L', referenceRange: '25-40' },
      // 其他
      T4: { name: '甲状腺素', unit: 'μg/dL', referenceRange: '1.0-4.0' }
    };
  }

  // 验证数值是否在参考范围内
  validateLabResult(result: number, referenceRange: string): LabResult['status'] {
    const match = referenceRange.match(/([\d.]+)-([\d.]+)/);
    if (!match) return 'normal';
    
    const min = parseFloat(match[1]);
    const max = parseFloat(match[2]);
    
    if (result < min) return 'abnormal';
    if (result > max) return 'abnormal';
    return 'normal';
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const medicalRecordOCRService = new MedicalRecordOCRService();
