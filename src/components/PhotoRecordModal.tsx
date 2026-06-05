/**
 * PawSync Pro 4.0 温暖治愈版
 * 拍照记录组件 - 拍照即记录
 * 
 * 功能：
 * - 拍疫苗本 → OCR自动识别疫苗名称、日期、批次
 * - 拍体重秤 → 自动识别体重数值填入
 * - 拍药品包装 → 扫码录入药品信息
 * - 拍宠物便便 → AI分析健康状况
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Image,
  Syringe,
  Scale,
  Pill,
  ScanLine,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { photoRecordService, PhotoRecordResult, VaccineRecordData, WeightRecordData, MedicationRecordData, StoolAnalysisData } from '../services/photoRecordService';
import { cn } from '../lib/utils';

// ============================================================================
// 类型定义
// ============================================================================

interface PhotoRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'vaccine' | 'weight' | 'medication' | 'stool';
  onRecordCreated: (data: Record<string, unknown>) => void;
}

type RecordStep = 'select' | 'capture' | 'recognizing' | 'result' | 'confirm';

// ============================================================================
// 记录类型配置
// ============================================================================

const recordTypeConfig = {
  vaccine: {
    icon: Syringe,
    label: '疫苗记录',
    color: 'bg-secondary-500',
    lightColor: 'bg-secondary-50',
    textColor: 'text-secondary-600',
    description: '拍疫苗本，自动识别疫苗信息',
  },
  weight: {
    icon: Scale,
    label: '体重记录',
    color: 'bg-primary-500',
    lightColor: 'bg-primary-50',
    textColor: 'text-primary-600',
    description: '拍体重秤，自动识别体重数值',
  },
  medication: {
    icon: Pill,
    label: '喂药记录',
    color: 'bg-lavender-500',
    lightColor: 'bg-lavender-50',
    textColor: 'text-lavender-600',
    description: '拍药品包装，自动识别药品信息',
  },
  stool: {
    icon: ScanLine,
    label: '便便分析',
    color: 'bg-cream-500',
    lightColor: 'bg-cream-50',
    textColor: 'text-cream-600',
    description: '拍宠物便便，AI分析健康状况',
  },
};

// ============================================================================
// 拍照记录组件
// ============================================================================

export const PhotoRecordModal: React.FC<PhotoRecordModalProps> = ({
  isOpen,
  onClose,
  type,
  onRecordCreated,
}) => {
  const [step, setStep] = useState<RecordStep>('select');
  const [result, setResult] = useState<PhotoRecordResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const config = recordTypeConfig[type];
  const IconComponent = config.icon;
  
  // 拍照识别
  const handleCapture = useCallback(async () => {
    setIsProcessing(true);
    setStep('recognizing');
    
    try {
      const recognitionResult = await photoRecordService.captureAndRecognize(type);
      setResult(recognitionResult);
      setStep('result');
    } catch (error) {
      console.error('识别失败:', error);
      setStep('select');
    } finally {
      setIsProcessing(false);
    }
  }, [type]);
  
  // 从图片库选择
  const handleSelectImage = useCallback(async () => {
    setIsProcessing(true);
    setStep('recognizing');
    
    try {
      const recognitionResult = await photoRecordService.selectAndRecognize(type);
      setResult(recognitionResult);
      setStep('result');
    } catch (error) {
      console.error('识别失败:', error);
      setStep('select');
    } finally {
      setIsProcessing(false);
    }
  }, [type]);
  
  // 确认记录
  const handleConfirm = useCallback(() => {
    if (result && result.success) {
      onRecordCreated(result.data);
      onClose();
    }
  }, [result, onRecordCreated, onClose]);
  
  // 重新识别
  const handleRetry = useCallback(() => {
    setResult(null);
    setStep('select');
  }, []);
  
  // 渲染识别结果
  const renderResult = () => {
    if (!result) return null;
    
    const renderVaccineResult = (data: VaccineRecordData) => (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary-50">
          <span className="text-sm text-neutral-600">疫苗名称</span>
          <span className="text-sm font-medium text-secondary-600">{data.vaccineName}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary-50">
          <span className="text-sm text-neutral-600">接种日期</span>
          <span className="text-sm font-medium text-secondary-600">{data.vaccinationDate}</span>
        </div>
        {data.batchNumber && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary-50">
            <span className="text-sm text-neutral-600">批次号</span>
            <span className="text-sm font-medium text-secondary-600">{data.batchNumber}</span>
          </div>
        )}
        {data.hospital && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary-50">
            <span className="text-sm text-neutral-600">接种医院</span>
            <span className="text-sm font-medium text-secondary-600">{data.hospital}</span>
          </div>
        )}
      </div>
    );
    
    const renderWeightResult = (data: WeightRecordData) => (
      <div className="space-y-3">
        <div className="flex items-center justify-center p-6 rounded-xl bg-primary-50">
          <div className="text-center">
            <span className="text-4xl font-bold text-primary-600">{data.weight}</span>
            <span className="text-lg text-primary-500 ml-2">{data.unit}</span>
            {data.change && (
              <div className={cn(
                'text-sm mt-2',
                data.change > 0 ? 'text-secondary-500' : 'text-danger-500'
              )}>
                {data.change > 0 ? '+' : ''}{data.change} kg (较上次)
              </div>
            )}
          </div>
        </div>
      </div>
    );
    
    const renderMedicationResult = (data: MedicationRecordData) => (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-lavender-50">
          <span className="text-sm text-neutral-600">药品名称</span>
          <span className="text-sm font-medium text-lavender-600">{data.medicationName}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-lavender-50">
          <span className="text-sm text-neutral-600">剂量</span>
          <span className="text-sm font-medium text-lavender-600">{data.dosage}</span>
        </div>
        {data.frequency && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-lavender-50">
            <span className="text-sm text-neutral-600">频率</span>
            <span className="text-sm font-medium text-lavender-600">{data.frequency}</span>
          </div>
        )}
        {data.warnings && data.warnings.length > 0 && (
          <div className="p-3 rounded-xl bg-danger-50 border border-danger-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-danger-500" />
              <span className="text-sm font-medium text-danger-600">注意事项</span>
            </div>
            {data.warnings.map((warning, index) => (
              <p key={index} className="text-xs text-danger-500 ml-6">{warning}</p>
            ))}
          </div>
        )}
      </div>
    );
    
    const renderStoolResult = (data: StoolAnalysisData) => (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-cream-50">
          <span className="text-sm text-neutral-600">颜色</span>
          <span className="text-sm font-medium text-cream-600">{data.color}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-cream-50">
          <span className="text-sm text-neutral-600">形状</span>
          <span className="text-sm font-medium text-cream-600">{data.shape}</span>
        </div>
        
        {/* 健康状态指示 */}
        <div className={cn(
          'p-4 rounded-xl',
          data.healthIndicator === 'normal' ? 'bg-secondary-50 border border-secondary-200' :
          data.healthIndicator === 'concern' ? 'bg-cream-50 border border-cream-200' :
          'bg-danger-50 border border-danger-200'
        )}>
          <div className="flex items-center gap-2 mb-2">
            {data.healthIndicator === 'normal' && (
              <CheckCircle className="w-5 h-5 text-secondary-500" />
            )}
            {data.healthIndicator === 'concern' && (
              <Info className="w-5 h-5 text-cream-500" />
            )}
            {data.healthIndicator === 'warning' && (
              <AlertCircle className="w-5 h-5 text-danger-500" />
            )}
            <span className={cn(
              'text-sm font-medium',
              data.healthIndicator === 'normal' ? 'text-secondary-600' :
              data.healthIndicator === 'concern' ? 'text-cream-600' :
              'text-danger-600'
            )}>
              {data.healthIndicator === 'normal' ? '健康状态良好' :
               data.healthIndicator === 'concern' ? '需要关注' :
               '建议立即就医'}
            </span>
          </div>
          {data.suggestions.map((suggestion, index) => (
            <p key={index} className="text-xs text-neutral-500 ml-7">{suggestion}</p>
          ))}
        </div>
      </div>
    );
    
    switch (type) {
      case 'vaccine':
        return renderVaccineResult(result.data as VaccineRecordData);
      case 'weight':
        return renderWeightResult(result.data as WeightRecordData);
      case 'medication':
        return renderMedicationResult(result.data as MedicationRecordData);
      case 'stool':
        return renderStoolResult(result.data as StoolAnalysisData);
      default:
        return null;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-white rounded-t-3xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className={cn('p-4 flex items-center justify-between', config.lightColor)}>
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.color)}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-800">{config.label}</h3>
                <p className="text-xs text-neutral-500">{config.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/50 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
          
          {/* 内容区域 */}
          <div className="p-6 min-h-[300px]">
            {/* 选择拍照方式 */}
            {step === 'select' && (
              <div className="space-y-4">
                <button
                  onClick={handleCapture}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  <Camera className="w-6 h-6 text-primary-500" />
                  <div>
                    <span className="text-base font-medium text-primary-600">拍照识别</span>
                    <p className="text-xs text-primary-400">打开相机，拍摄需要识别的内容</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary-400 ml-auto" />
                </button>
                
                <button
                  onClick={handleSelectImage}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition-colors"
                >
                  <Image className="w-6 h-6 text-secondary-500" />
                  <div>
                    <span className="text-base font-medium text-secondary-600">从相册选择</span>
                    <p className="text-xs text-secondary-400">选择已有的图片进行识别</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-secondary-400 ml-auto" />
                </button>
              </div>
            )}
            
            {/* 正在识别 */}
            {step === 'recognizing' && (
              <div className="flex flex-col items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className={cn('w-16 h-16 rounded-full flex items-center justify-center', config.lightColor)}
                >
                  <Sparkles className={cn('w-8 h-8', config.textColor)} />
                </motion.div>
                <p className="text-sm text-neutral-500 mt-4">正在识别中...</p>
                <p className="text-xs text-neutral-400 mt-2">AI正在分析您的图片</p>
              </div>
            )}
            
            {/* 识别结果 */}
            {step === 'result' && result && (
              <div className="space-y-4">
                {/* 置信度指示 */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50">
                  <span className="text-xs text-neutral-500">识别置信度</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence}%` }}
                        className={cn('h-full rounded-full',
                          result.confidence >= 90 ? 'bg-secondary-500' :
                          result.confidence >= 70 ? 'bg-cream-500' :
                          'bg-danger-500'
                        )}
                      />
                    </div>
                    <span className={cn('text-xs font-medium',
                      result.confidence >= 90 ? 'text-secondary-500' :
                      result.confidence >= 70 ? 'text-cream-500' :
                      'text-danger-500'
                    )}>
                      {result.confidence}%
                    </span>
                  </div>
                </div>
                
                {/* 结果详情 */}
                {renderResult()}
                
                {/* 建议 */}
                {result.suggestions && result.suggestions.length > 0 && (
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-sky-500" />
                      <span className="text-sm font-medium text-sky-600">AI建议</span>
                    </div>
                    {result.suggestions.map((suggestion, index) => (
                      <p key={index} className="text-xs text-sky-500 ml-6">{suggestion}</p>
                    ))}
                  </div>
                )}
                
                {/* 操作按钮 */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleRetry}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm text-neutral-600">重新识别</span>
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!result.success}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors',
                      result.success
                        ? `${config.color} text-white hover:opacity-90`
                        : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    )}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">确认记录</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhotoRecordModal;