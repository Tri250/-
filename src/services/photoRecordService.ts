/**
 * PawSync Pro 4.0 温暖治愈版
 * 拍照即记录服务 - OCR识别疫苗本/体重秤/药品包装
 * 
 * 功能：
 * - 拍疫苗本 → OCR自动识别疫苗名称、日期、批次
 * - 拍体重秤 → 自动识别体重数值填入
 * - 拍药品包装 → 扫码录入药品信息
 * - 拍宠物便便 → AI分析健康状况（颜色/形状识别）
 */

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// ============================================================================
// 类型定义
// ============================================================================

export interface PhotoRecordResult {
  type: 'vaccine' | 'weight' | 'medication' | 'stool' | 'general';
  success: boolean;
  data: Record<string, unknown>;
  confidence: number;  // 识别置信度 0-100
  suggestions?: string[];
  rawText?: string;    // OCR原始文本
}

export interface VaccineRecordData {
  vaccineName: string;
  vaccinationDate: string;
  batchNumber?: string;
  hospital?: string;
  nextVaccineDate?: string;
  veterinarian?: string;
}

export interface WeightRecordData {
  weight: number;
  unit: 'kg' | 'lb';
  timestamp: string;
  previousWeight?: number;
  change?: number;
}

export interface MedicationRecordData {
  medicationName: string;
  dosage: string;
  frequency?: string;
  expirationDate?: string;
  manufacturer?: string;
  warnings?: string[];
}

export interface StoolAnalysisData {
  color: string;
  shape: string;
  healthIndicator: 'normal' | 'concern' | 'warning';
  suggestions: string[];
  possibleIssues?: string[];
}

// ============================================================================
// OCR识别服务
// ============================================================================

class PhotoRecordService {
  
  /**
   * 拍照并识别
   */
  async captureAndRecognize(type: 'vaccine' | 'weight' | 'medication' | 'stool'): Promise<PhotoRecordResult> {
    try {
      // 调用摄像头拍照
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        saveToGallery: true,
      });
      
      // 根据类型进行识别
      const result = await this.recognizeImage(photo.base64String!, type);
      
      return result;
    } catch (error) {
      console.error('拍照识别失败:', error);
      return {
        type,
        success: false,
        data: {},
        confidence: 0,
        suggestions: ['拍照失败，请重试'],
      };
    }
  }
  
  /**
   * 从图片库选择并识别
   */
  async selectAndRecognize(type: 'vaccine' | 'weight' | 'medication' | 'stool'): Promise<PhotoRecordResult> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      
      const result = await this.recognizeImage(photo.base64String!, type);
      
      return result;
    } catch (error) {
      console.error('图片选择失败:', error);
      return {
        type,
        success: false,
        data: {},
        confidence: 0,
        suggestions: ['图片选择失败，请重试'],
      };
    }
  }
  
  /**
   * 图像识别核心逻辑
   * 注意：这里是模拟实现，实际需要接入OCR API（如百度OCR、腾讯OCR、Google Vision等）
   */
  private async recognizeImage(base64: string, type: 'vaccine' | 'weight' | 'medication' | 'stool'): Promise<PhotoRecordResult> {
    // 模拟OCR处理延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    switch (type) {
      case 'vaccine':
        return this.recognizeVaccineRecord(base64);
      case 'weight':
        return this.recognizeWeightRecord(base64);
      case 'medication':
        return this.recognizeMedicationRecord(base64);
      case 'stool':
        return this.recognizeStoolAnalysis(base64);
      default:
        return {
          type: 'general',
          success: false,
          data: {},
          confidence: 0,
        };
    }
  }
  
  /**
   * 疫苗本识别
   */
  private recognizeVaccineRecord(base64: string): PhotoRecordResult {
    // 模拟识别结果
    // 实际接入OCR API后，会解析疫苗本上的文字信息
    const mockData: VaccineRecordData = {
      vaccineName: '狂犬疫苗',
      vaccinationDate: new Date().toISOString().split('T')[0],
      batchNumber: 'RB2024001',
      hospital: '宠爱动物医院',
      nextVaccineDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      veterinarian: '张医生',
    };
    
    return {
      type: 'vaccine',
      success: true,
      data: mockData,
      confidence: 92,
      rawText: '狂犬疫苗 2024-06-05 批次号:RB2024001 宠爱动物医院',
      suggestions: [
        '已识别疫苗信息，请确认是否正确',
        '建议设置下次疫苗接种提醒',
      ],
    };
  }
  
  /**
   * 体重秤识别
   */
  private recognizeWeightRecord(base64: string): PhotoRecordResult {
    // 模拟识别体重数值
    // 实际接入OCR API后，会识别体重秤显示屏上的数字
    const mockWeight = 5.2 + Math.random() * 0.5;  // 模拟体重
    
    const mockData: WeightRecordData = {
      weight: Math.round(mockWeight * 10) / 10,
      unit: 'kg',
      timestamp: new Date().toISOString(),
      previousWeight: 5.0,
      change: Math.round((mockWeight - 5.0) * 10) / 10,
    };
    
    return {
      type: 'weight',
      success: true,
      data: mockData,
      confidence: 95,
      rawText: `${mockData.weight} kg`,
      suggestions: [
        `体重${mockData.change > 0 ? '增加' : '减少'}了${Math.abs(mockData.change)}kg`,
        mockData.change > 0.5 ? '体重增长较快，建议关注饮食' : '体重稳定，继续保持',
      ],
    };
  }
  
  /**
   * 药品包装识别
   */
  private recognizeMedicationRecord(base64: string): PhotoRecordResult {
    // 模拟识别药品信息
    // 实际接入OCR API后，会识别药品包装上的信息
    const mockData: MedicationRecordData = {
      medicationName: '宠物驱虫药',
      dosage: '每次1片',
      frequency: '每月1次',
      expirationDate: '2025-12-31',
      manufacturer: '宠物健康制药',
      warnings: [
        '请勿与牛奶同时服用',
        '服用后可能出现轻微不适',
      ],
    };
    
    return {
      type: 'medication',
      success: true,
      data: mockData,
      confidence: 88,
      rawText: '宠物驱虫药 每次1片 每月1次 有效期至2025-12-31',
      suggestions: [
        '已识别药品信息',
        '注意：此药与某些药物存在相互作用，请咨询兽医',
      ],
    };
  }
  
  /**
   * 宠物便便分析（AI视觉识别）
   */
  private recognizeStoolAnalysis(base64: string): PhotoRecordResult {
    // 模拟AI分析结果
    // 实际接入视觉AI API后，会分析便便的颜色、形状等
    const colors = ['棕色', '黑色', '黄色', '绿色', '红色'];
    const shapes = ['成型', '软便', '稀便', '硬便'];
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    
    let healthIndicator: 'normal' | 'concern' | 'warning' = 'normal';
    const suggestions: string[] = [];
    const possibleIssues: string[] = [];
    
    // 根据颜色和形状判断健康状况
    if (randomColor === '红色' || randomColor === '黑色') {
      healthIndicator = 'warning';
      suggestions.push('⚠️ 发现异常颜色，建议立即就医');
      possibleIssues.push('可能存在消化道出血');
    } else if (randomColor === '绿色' || randomColor === '黄色') {
      healthIndicator = 'concern';
      suggestions.push('颜色略有异常，建议观察');
      possibleIssues.push('可能消化不良或饮食问题');
    } else {
      suggestions.push('颜色正常，健康状况良好');
    }
    
    if (randomShape === '稀便') {
      if (healthIndicator === 'normal') healthIndicator = 'concern';
      suggestions.push('便便偏软，注意饮食和水分');
      possibleIssues.push('可能轻微腹泻');
    } else if (randomShape === '硬便') {
      if (healthIndicator === 'normal') healthIndicator = 'concern';
      suggestions.push('便便偏硬，建议增加水分摄入');
      possibleIssues.push('可能便秘');
    } else {
      suggestions.push('形状正常，消化功能良好');
    }
    
    const mockData: StoolAnalysisData = {
      color: randomColor,
      shape: randomShape,
      healthIndicator,
      suggestions,
      possibleIssues: possibleIssues.length > 0 ? possibleIssues : undefined,
    };
    
    return {
      type: 'stool',
      success: true,
      data: mockData,
      confidence: 85,
      suggestions,
    };
  }
  
  /**
   * 药品扫码录入（模拟）
   */
  async scanMedicationBarcode(): Promise<MedicationRecordData | null> {
    // 实际需要接入条码扫描API
    // 这里返回模拟数据
    return {
      medicationName: '宠物维生素',
      dosage: '每日1粒',
      frequency: '长期服用',
      expirationDate: '2026-06-01',
      manufacturer: '宠物营养健康',
    };
  }
  
  /**
   * 药物相互作用检查
   */
  checkDrugInteraction(drugA: string, drugB: string): {
    hasInteraction: boolean;
    severity: 'none' | 'minor' | 'moderate' | 'major';
    description: string;
  } {
    // 模拟药物相互作用数据库
    const interactionDatabase: Record<string, Record<string, {
      severity: 'minor' | 'moderate' | 'major';
      description: string;
    }>> = {
      '驱虫药': {
        '抗生素': { severity: 'moderate', description: '可能影响驱虫效果，建议间隔24小时服用' },
        '维生素': { severity: 'minor', description: '无明显相互作用' },
      },
      '抗生素': {
        '益生菌': { severity: 'minor', description: '建议间隔2小时服用' },
        '驱虫药': { severity: 'moderate', description: '可能影响药效' },
      },
    };
    
    const interaction = interactionDatabase[drugA]?.[drugB] || interactionDatabase[drugB]?.[drugA];
    
    if (interaction) {
      return {
        hasInteraction: true,
        severity: interaction.severity,
        description: interaction.description,
      };
    }
    
    return {
      hasInteraction: false,
      severity: 'none',
      description: '未发现已知相互作用',
    };
  }
}

// ============================================================================
// 导出单例
// ============================================================================

export const photoRecordService = new PhotoRecordService();
export default photoRecordService;