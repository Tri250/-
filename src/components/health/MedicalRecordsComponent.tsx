// ============================================
// PawSync Pro 3.0 - Medical Records OCR Component
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 电子病历OCR识别与管理 - 支持上传体检报告、化验单、处方单
// ============================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Camera,
  X,
  Check,
  Loader2,
  Download,
  Trash2,
  Eye,
  Filter,
  Calendar,
  Stethoscope,
  Pill,
  Syringe,
  FileCheck,
  FileSearch,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Image as ImageIcon,
  AlertTriangle,
  Info
} from 'lucide-react';
import { medicalRecordOCRService } from '../../services/medicalRecordOCRService';
import type { MedicalRecord, LabResult } from '../../types/advanced-health';

interface MedicalRecordsComponentProps {
  petId: string;
  petName: string;
}

export function MedicalRecordsComponent({ petId, petName }: MedicalRecordsComponentProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [filterType, setFilterType] = useState<MedicalRecord['type'] | 'all'>('all');
  const [uploading, setUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAbnormalAlert, setShowAbnormalAlert] = useState(false);
  const [selectedAbnormalResult, setSelectedAbnormalResult] = useState<LabResult | null>(null);

  const abnormalResults = useMemo(() => {
    if (!selectedRecord?.labResults) return [];
    return selectedRecord.labResults.filter(r => r.status === 'abnormal' || r.status === 'critical');
  }, [selectedRecord]);

  useEffect(() => {
    loadRecords();
  }, [petId]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await medicalRecordOCRService.getMedicalRecords(petId);
      setRecords(data);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSelectedImage(URL.createObjectURL(file));

    try {
      // 模拟OCR识别
      const result = await medicalRecordOCRService.recognizeMedicalDocument(
        URL.createObjectURL(file),
        'checkup'
      );
      setOcrResult(result);
    } catch (error) {
      console.error('OCR failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!ocrResult) return;

    try {
      const newRecord = await medicalRecordOCRService.saveMedicalRecord(petId, {
        type: ocrResult.extractedData.labResults?.length ? 'lab_report' : 'checkup',
        date: ocrResult.extractedData.date || new Date().toISOString().split('T')[0],
        hospital: ocrResult.extractedData.hospital || '',
        veterinarian: ocrResult.extractedData.veterinarian || '',
        diagnosis: ocrResult.extractedData.diagnosis,
        treatment: ocrResult.extractedData.treatment,
        medications: ocrResult.extractedData.medications,
        labResults: ocrResult.extractedData.labResults,
        ocrConfidence: ocrResult.confidence
      });

      setRecords(prev => [newRecord, ...prev]);
      setShowUploadModal(false);
      setOcrResult(null);
      setSelectedImage(null);
    } catch (error) {
      console.error('Failed to save record:', error);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('确定要删除这条病历记录吗？')) return;

    try {
      await medicalRecordOCRService.deleteMedicalRecord(recordId);
      setRecords(prev => prev.filter(r => r.id !== recordId));
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  const handleExportPDF = async () => {
    const selectedIds = records.map(r => r.id);
    try {
      const result = await medicalRecordOCRService.exportToPDF(selectedIds);
      if (result.success) {
        alert('PDF导出成功！');
      } else {
        alert('导出失败: ' + result.error);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getRecordTypeConfig = (type: MedicalRecord['type']) => {
    const configs = {
      checkup: { icon: Stethoscope, label: '体检报告', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
      lab_report: { icon: FileSearch, label: '化验单', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
      prescription: { icon: Pill, label: '处方单', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
      vaccination: { icon: Syringe, label: '疫苗接种', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-600' },
      surgery: { icon: FileCheck, label: '手术记录', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-600' },
      other: { icon: FileText, label: '其他', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-600' }
    };
    return configs[type];
  };

  const filteredRecords = filterType === 'all' 
    ? records 
    : records.filter(r => r.type === filterType);

  const getLabStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'abnormal': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // 上传模态框
  const UploadModal = () => (
    <AnimatePresence>
      {showUploadModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowUploadModal(false);
            setOcrResult(null);
            setSelectedImage(null);
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-500" />
                上传病历文档
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setOcrResult(null);
                  setSelectedImage(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* 上传区域 */}
              {!selectedImage && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-green-400 transition-colors cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <ImageIcon className="w-8 h-8 text-green-600" />
                  </motion.div>
                  <p className="text-gray-600 mb-2">点击上传图片</p>
                  <p className="text-xs text-gray-400">支持 JPG、PNG 格式</p>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                      <Camera className="w-4 h-4" />
                      <span className="text-sm">拍照</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 上传中 */}
              {uploading && (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                  <Loader2 className="w-12 h-12 text-green-500 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">正在识别文档内容...</p>
                </div>
              )}

              {/* 图片预览 */}
              {selectedImage && !uploading && (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden">
                    <img
                      src={selectedImage}
                      alt="上传的图片"
                      className="w-full h-64 object-contain bg-gray-100"
                    />
                  </div>

                  {/* OCR结果 */}
                  {ocrResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-gray-800">识别完成</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          置信度: {(ocrResult.confidence * 100).toFixed(0)}%
                        </span>
                      </div>

                      {/* 提取的信息 */}
                      <div className="space-y-3">
                        {ocrResult.extractedData.date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">日期:</span>
                            <span className="font-medium text-gray-800">{ocrResult.extractedData.date}</span>
                          </div>
                        )}
                        {ocrResult.extractedData.hospital && (
                          <div className="flex items-center gap-2 text-sm">
                            <Stethoscope className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">医院:</span>
                            <span className="font-medium text-gray-800">{ocrResult.extractedData.hospital}</span>
                          </div>
                        )}
                        {ocrResult.extractedData.veterinarian && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">医生:</span>
                            <span className="font-medium text-gray-800">{ocrResult.extractedData.veterinarian}</span>
                          </div>
                        )}
                        {ocrResult.extractedData.diagnosis && (
                          <div className="text-sm">
                            <span className="text-gray-600">诊断:</span>
                            <p className="mt-1 text-gray-800">{ocrResult.extractedData.diagnosis}</p>
                          </div>
                        )}
                      </div>

                      {/* 建议 */}
                      {ocrResult.suggestions && ocrResult.suggestions.length > 0 && (
                        <div className="pt-3 border-t border-green-200">
                          <p className="text-sm text-gray-600 mb-2">识别建议:</p>
                          <ul className="space-y-1">
                            {ocrResult.suggestions.map((suggestion: string, idx: number) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setOcrResult(null);
                  setSelectedImage(null);
                }}
                className="flex-1 py-3 bg-white text-gray-600 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                取消
              </button>
              {ocrResult && (
                <button
                  onClick={handleSaveRecord}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  保存病历
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 详情模态框
  const DetailModal = () => (
    <AnimatePresence>
      {showDetailModal && selectedRecord && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const config = getRecordTypeConfig(selectedRecord.type);
                  const Icon = config.icon;
                  return (
                    <>
                      <div className={`w-10 h-10 ${config.bgColor} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${config.textColor}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{config.label}</h3>
                        <p className="text-sm text-gray-500">{formatDate(selectedRecord.date)}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* 基础信息 */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Stethoscope className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">医院:</span>
                  <span className="font-medium text-gray-800">{selectedRecord.hospital}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">医生:</span>
                  <span className="font-medium text-gray-800">{selectedRecord.veterinarian}</span>
                </div>
                {selectedRecord.ocrConfidence && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">OCR识别置信度:</span>
                    <span className="font-medium text-gray-800">{(selectedRecord.ocrConfidence * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>

              {/* 诊断结果 */}
              {selectedRecord.diagnosis && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">诊断结果</h4>
                  <p className="text-sm text-gray-600 bg-blue-50 rounded-xl p-3">{selectedRecord.diagnosis}</p>
                </div>
              )}

              {/* 治疗方案 */}
              {selectedRecord.treatment && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">治疗方案</h4>
                  <p className="text-sm text-gray-600 bg-purple-50 rounded-xl p-3">{selectedRecord.treatment}</p>
                </div>
              )}

              {/* 化验结果 */}
              {selectedRecord.labResults && selectedRecord.labResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">化验结果</h4>
                    {abnormalResults.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAbnormalAlert(true)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {abnormalResults.length}项异常
                      </motion.button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {selectedRecord.labResults.map((result, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: result.status !== 'normal' ? 1.02 : 1 }}
                        onClick={() => {
                          if (result.status !== 'normal') {
                            setSelectedAbnormalResult(result);
                            setShowAbnormalAlert(true);
                          }
                        }}
                        className={`rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all ${
                          result.status === 'normal' 
                            ? 'bg-gray-50 hover:bg-gray-100' 
                            : result.status === 'abnormal'
                              ? 'bg-orange-50 border-2 border-orange-300 hover:border-orange-400'
                              : 'bg-red-50 border-2 border-red-300 hover:border-red-400 animate-pulse'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {result.status !== 'normal' && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                result.status === 'critical' ? 'bg-red-200' : 'bg-orange-200'
                              }`}
                            >
                              <AlertTriangle className={`w-3 h-3 ${
                                result.status === 'critical' ? 'text-red-600' : 'text-orange-600'
                              }`} />
                            </motion.div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-800">{result.testName}</p>
                            <p className="text-xs text-gray-500">参考范围: {result.referenceRange} {result.unit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getLabStatusColor(result.status)}`}>
                            {result.result}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            result.status === 'normal' ? 'bg-green-100 text-green-700' :
                            result.status === 'abnormal' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {result.status === 'normal' ? '正常' : result.status === 'abnormal' ? '异常' : '危急'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* 用药记录 */}
              {selectedRecord.medications && selectedRecord.medications.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">用药记录</h4>
                  <div className="space-y-2">
                    {selectedRecord.medications.map((med, idx) => (
                      <div key={idx} className="bg-orange-50 rounded-xl p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                              <Pill className="w-4 h-4 text-orange-500" />
                              {med.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              剂量: {med.dosage} | 频率: {med.frequency}
                            </p>
                          </div>
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                            {med.duration}
                          </span>
                        </div>
                        {med.instructions && (
                          <p className="text-xs text-gray-500 mt-2">{med.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 备注 */}
              {selectedRecord.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">备注</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selectedRecord.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => handleDeleteRecord(selectedRecord.id)}
                className="flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                <Download className="w-4 h-4" />
                导出PDF
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const AbnormalAlertModal = () => (
    <AnimatePresence>
      {showAbnormalAlert && selectedAbnormalResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowAbnormalAlert(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <AlertTriangle className="w-6 h-6" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold">异常数据提示</h3>
                  <p className="text-sm text-white/80">请关注以下化验结果</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">{selectedAbnormalResult.testName}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedAbnormalResult.status === 'critical' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {selectedAbnormalResult.status === 'critical' ? '危急值' : '异常'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">检测值</p>
                    <p className={`text-2xl font-bold ${
                      selectedAbnormalResult.status === 'critical' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {selectedAbnormalResult.result}
                    </p>
                    <p className="text-xs text-gray-400">{selectedAbnormalResult.unit}</p>
                  </div>
                  <div className="text-center bg-green-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-1">参考范围</p>
                    <p className="text-lg font-bold text-green-600">{selectedAbnormalResult.referenceRange}</p>
                    <p className="text-xs text-gray-400">{selectedAbnormalResult.unit}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">建议措施</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5" />
                    建议尽快咨询兽医进行进一步检查
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5" />
                    记录宠物近期饮食和行为变化
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5" />
                    如有用药，请告知兽医完整用药史
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAbnormalAlert(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  关闭
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowAbnormalAlert(false);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Stethoscope className="w-4 h-4" />
                  咨询兽医
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-bold text-gray-800">电子病历</h2>
          <span className="text-sm text-gray-500">({records.length}条记录)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl flex items-center gap-2 hover:shadow-lg transition-all"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">上传病历</span>
          </button>
          {records.length > 0 && (
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-white text-gray-600 rounded-xl flex items-center gap-2 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">导出全部</span>
            </button>
          )}
        </div>
      </div>

      {/* 筛选标签 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
            filterType === 'all' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        {(['checkup', 'lab_report', 'prescription', 'vaccination'] as const).map((type) => {
          const config = getRecordTypeConfig(type);
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                filterType === type 
                  ? `${config.bgColor} ${config.textColor} shadow-md` 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* 记录列表 */}
      {filteredRecords.length > 0 ? (
        <div className="space-y-3">
          {filteredRecords.map((record, index) => {
            const config = getRecordTypeConfig(record.type);
            const Icon = config.icon;
            
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setSelectedRecord(record);
                  setShowDetailModal(true);
                }}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${config.textColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-800">{config.label}</h3>
                      <span className="text-xs text-gray-500">{formatDate(record.date)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{record.hospital}</p>
                    {record.diagnosis && (
                      <p className="text-xs text-gray-500 line-clamp-2">{record.diagnosis}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">暂无病历记录</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-green-500 text-white rounded-xl hover:shadow-lg transition-all"
          >
            上传第一份病历
          </button>
        </div>
      )}

      {/* 模态框 */}
      <UploadModal />
      <DetailModal />
      <AbnormalAlertModal />
    </div>
  );
}
