// ============================================
// PawSync Pro - MedicalPage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 医疗咨询页面
// ============================================

import { useState } from 'react';
import { Stethoscope, MessageSquare, Calendar, ChevronRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useMedicalStore } from '../store/medicalStore';

export function MedicalPage() {
  const { symptoms, consultations, appointments, startAIConsultation, currentConsultation } = useMedicalStore();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleStartConsultation = async () => {
    if (selectedSymptoms.length === 0) return;
    
    setIsLoading(true);
    try {
      await startAIConsultation(selectedSymptoms);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colors[severity] || 'bg-gray-100 text-gray-700';
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      low: '轻微',
      medium: '中等',
      high: '严重',
      critical: '紧急'
    };
    return labels[severity] || severity;
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-warning-500 to-warning-600 text-white px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">医疗咨询</h1>
              <p className="text-warning-100">AI 预诊 + 专业兽医服务</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-6 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 text-left hover:shadow-md transition-all">
            <MessageSquare className="w-8 h-8 text-warning-500 mb-2" />
            <h3 className="font-bold text-neutral-800">AI 预诊</h3>
            <p className="text-neutral-500 text-sm">智能分析症状</p>
          </button>
          <button className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 text-left hover:shadow-md transition-all">
            <Calendar className="w-8 h-8 text-secondary-500 mb-2" />
            <h3 className="font-bold text-neutral-800">预约兽医</h3>
            <p className="text-neutral-500 text-sm">在线预约问诊</p>
          </button>
        </div>
      </div>

      {/* AI Consultation */}
      <div className="px-4 max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-4">AI 智能预诊</h2>
          
          {!currentConsultation ? (
            <>
              <p className="text-neutral-600 text-sm mb-4">请选择爱宠出现的症状</p>
              
              <div className="space-y-2 mb-6">
                {symptoms.map((symptom) => (
                  <button
                    key={symptom.id}
                    onClick={() => toggleSymptom(symptom.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedSymptoms.includes(symptom.id)
                        ? 'border-warning-500 bg-warning-50'
                        : 'border-neutral-100 hover:border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-neutral-800">{symptom.name}</h4>
                        <p className="text-sm text-neutral-500">{symptom.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(symptom.severity)}`}>
                        {getSeverityLabel(symptom.severity)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleStartConsultation}
                disabled={selectedSymptoms.length === 0 || isLoading}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  selectedSymptoms.length === 0 || isLoading
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-warning-500 to-warning-600 text-white hover:shadow-lg'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-5 h-5" />
                    开始咨询
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="animate-fade-in">
              {currentConsultation.status === 'in_progress' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Stethoscope className="w-8 h-8 text-warning-500" />
                  </div>
                  <p className="text-neutral-600">AI 正在分析症状...</p>
                </div>
              ) : (
                <div>
                  <div className="bg-success-50 border border-success-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-success-500" />
                      <span className="font-semibold text-success-700">分析完成</span>
                    </div>
                    <p className="text-neutral-700 text-sm">{currentConsultation.diagnosis}</p>
                  </div>
                  
                  {currentConsultation.recommendations && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-neutral-800 mb-2">建议</h4>
                      <ul className="space-y-2">
                        {currentConsultation.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-neutral-600">
                            <div className="w-1.5 h-1.5 bg-warning-400 rounded-full mt-2 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedSymptoms([]);
                    }}
                    className="w-full py-3 bg-neutral-100 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-200 transition-all"
                  >
                    重新咨询
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Consultations */}
      {consultations.length > 0 && (
        <div className="px-4 max-w-md mx-auto">
          <h2 className="text-lg font-bold text-neutral-800 mb-4">最近咨询</h2>
          <div className="space-y-3">
            {consultations.map((consultation) => (
              <div key={consultation.id} className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      consultation.type === 'ai' ? 'bg-warning-100' : 'bg-secondary-100'
                    }`}>
                      {consultation.type === 'ai' ? (
                        <MessageSquare className="w-4 h-4 text-warning-600" />
                      ) : (
                        <Stethoscope className="w-4 h-4 text-secondary-600" />
                      )}
                    </div>
                    <span className="font-medium text-neutral-800">
                      {consultation.type === 'ai' ? 'AI 咨询' : '兽医问诊'}
                    </span>
                  </div>
                  <span className="text-sm text-neutral-500">
                    {consultation.date.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-neutral-600">
                  {consultation.symptoms.length} 个症状
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
