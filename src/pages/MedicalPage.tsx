// ============================================
// PawSync Pro - MedicalPage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 医疗咨询页面 - 完整功能实现
// ============================================

import { useState } from 'react';
import { Stethoscope, MessageSquare, Calendar, CheckCircle, Clock, FileText, Plus, Phone, MapPin, User, AlertCircle, ChevronRight, X } from 'lucide-react';
import { useMedicalStore } from '../store/medicalStore';
import { usePetStore } from '../store/petStore';
import { Card, Button, Badge, GlassModal } from '../components/DesignSystem';
import { useResponsiveStyle } from '../lib/responsiveStyle';

export default function MedicalPage() {
  const { symptoms, consultations, appointments, medicalRecords, currentConsultation, startAIConsultation, bookAppointment, addMedicalRecord } = useMedicalStore();
  const { pets, selectedPetId } = usePetStore();
  const responsive = useResponsiveStyle();
  
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'consultation' | 'appointments' | 'records'>('consultation');
  
  // 预约表单状态
  const [appointmentForm, setAppointmentForm] = useState({
    date: new Date(),
    time: '09:00',
    vetName: '',
    clinicName: '',
    address: '',
    purpose: '',
    notes: ''
  });
  
  // 医疗记录表单状态
  const [recordForm, setRecordForm] = useState({
    date: new Date(),
    type: 'checkup' as 'vaccination' | 'checkup' | 'treatment' | 'surgery',
    title: '',
    description: '',
    vetName: '',
    nextDueDate: new Date()
  });

  const selectedPet = pets.find(p => p.id === selectedPetId);

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

  const handleBookAppointment = async () => {
    if (!appointmentForm.vetName || !appointmentForm.clinicName || !appointmentForm.purpose) {
      return;
    }
    
    const success = await bookAppointment({
      date: appointmentForm.date,
      time: appointmentForm.time,
      vetName: appointmentForm.vetName,
      clinicName: appointmentForm.clinicName,
      address: appointmentForm.address,
      purpose: appointmentForm.purpose,
      notes: appointmentForm.notes
    });
    
    if (success) {
      setShowAppointmentModal(false);
      setAppointmentForm({
        date: new Date(),
        time: '09:00',
        vetName: '',
        clinicName: '',
        address: '',
        purpose: '',
        notes: ''
      });
    }
  };

  const handleAddRecord = () => {
    if (!recordForm.title || !recordForm.description) {
      return;
    }
    
    addMedicalRecord({
      date: recordForm.date,
      type: recordForm.type,
      title: recordForm.title,
      description: recordForm.description,
      vetName: recordForm.vetName,
      nextDueDate: recordForm.nextDueDate
    });
    
    setShowRecordModal(false);
    setRecordForm({
      date: new Date(),
      type: 'checkup',
      title: '',
      description: '',
      vetName: '',
      nextDueDate: new Date()
    });
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

  const getRecordTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vaccination: '疫苗接种',
      checkup: '健康体检',
      treatment: '治疗记录',
      surgery: '手术记录'
    };
    return labels[type] || type;
  };

  const getRecordTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      vaccination: 'primary',
      checkup: 'success',
      treatment: 'warning',
      surgery: 'danger'
    };
    return colors[type] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: '已预约',
      completed: '已完成',
      cancelled: '已取消'
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-warning-500 to-warning-600 text-white px-6 py-8" style={{ paddingTop: Math.max(0, (responsive.safeAreaPadding?.paddingTop as number || 0) + 32) }}>
        <div style={{ maxWidth: responsive.contentMaxWidth, margin: '0 auto' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">医疗咨询</h1>
              <p className="text-warning-100">AI 预诊 + 专业兽医服务</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/20 backdrop-blur rounded-xl p-3">
              <div className="text-sm text-warning-100">咨询记录</div>
              <div className="text-xl font-bold">{consultations.length}</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3">
              <div className="text-sm text-warning-100">预约次数</div>
              <div className="text-xl font-bold">{appointments.length}</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3">
              <div className="text-sm text-warning-100">医疗档案</div>
              <div className="text-xl font-bold">{medicalRecords.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 sticky top-0 bg-neutral-50 z-10">
        <div className="flex gap-2" style={{ maxWidth: responsive.contentMaxWidth, margin: '0 auto' }}>
          {(['consultation', 'appointments', 'records'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-warning-500 text-white shadow-lg'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {tab === 'consultation' ? 'AI咨询' : tab === 'appointments' ? '预约管理' : '医疗档案'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4" style={{ maxWidth: responsive.contentMaxWidth, margin: '0 auto' }}>
        {/* AI Consultation Tab */}
        {activeTab === 'consultation' && (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Card 
                variant="gradient" 
                padding="md" 
                onClick={() => setActiveTab('consultation')}
                className="text-left"
              >
                <MessageSquare className="w-8 h-8 text-warning-500 mb-2" />
                <h3 className="font-bold text-neutral-800">AI 预诊</h3>
                <p className="text-neutral-500 text-sm">智能分析症状</p>
              </Card>
              <Card 
                variant="gradient" 
                padding="md" 
                onClick={() => setShowAppointmentModal(true)}
                className="text-left"
              >
                <Calendar className="w-8 h-8 text-secondary-500 mb-2" />
                <h3 className="font-bold text-neutral-800">预约兽医</h3>
                <p className="text-neutral-500 text-sm">在线预约问诊</p>
              </Card>
            </div>

            {/* AI Consultation */}
            <Card variant="default" padding="lg">
              <h2 className="text-lg font-bold text-neutral-800 mb-4">AI 智能预诊</h2>
              
              {selectedPet && (
                <div className="mb-4 p-3 bg-warning-50 rounded-xl border border-warning-100">
                  <div className="flex items-center gap-2">
                    <span className="text-warning-600 font-medium">当前宠物:</span>
                    <span className="text-neutral-800">{selectedPet.name}</span>
                  </div>
                </div>
              )}
              
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
                          <Badge variant={symptom.severity === 'critical' ? 'danger' : symptom.severity === 'high' ? 'warning' : 'default'} size="sm">
                            {getSeverityLabel(symptom.severity)}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="gradient"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    disabled={selectedSymptoms.length === 0}
                    onClick={handleStartConsultation}
                    icon={<Stethoscope className="w-5 h-5" />}
                  >
                    开始咨询
                  </Button>
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

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="md"
                          fullWidth
                          onClick={() => {
                            setSelectedSymptoms([]);
                          }}
                        >
                          重新咨询
                        </Button>
                        <Button
                          variant="primary"
                          size="md"
                          fullWidth
                          onClick={() => setShowAppointmentModal(true)}
                          icon={<Calendar className="w-4 h-4" />}
                        >
                          预约兽医
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Recent Consultations */}
            {consultations.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-neutral-800 mb-4">最近咨询</h2>
                <div className="space-y-3">
                  {consultations.slice(0, 5).map((consultation) => (
                    <Card key={consultation.id} variant="default" padding="md" hover>
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
                      {consultation.diagnosis && (
                        <p className="text-xs text-neutral-500 mt-2 line-clamp-2">
                          {consultation.diagnosis}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-800">预约管理</h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAppointmentModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                新预约
              </Button>
            </div>

            {appointments.length === 0 ? (
              <Card variant="outlined" padding="lg">
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500">暂无预约记录</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowAppointmentModal(true)}
                  >
                    立即预约
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <Card key={appointment.id} variant="default" padding="md" hover>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-secondary-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-neutral-800">{appointment.purpose}</h3>
                          <p className="text-sm text-neutral-500">{appointment.clinicName}</p>
                        </div>
                      </div>
                      <Badge variant={appointment.status === 'completed' ? 'success' : appointment.status === 'cancelled' ? 'danger' : 'primary'} size="sm">
                        {getStatusLabel(appointment.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Clock className="w-4 h-4" />
                        <span>{appointment.date.toLocaleDateString()} {appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <User className="w-4 h-4" />
                        <span>{appointment.vetName}</span>
                      </div>
                      {appointment.address && (
                        <div className="flex items-center gap-2 text-neutral-600 col-span-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{appointment.address}</span>
                        </div>
                      )}
                    </div>

                    {appointment.status === 'scheduled' && (
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" fullWidth icon={<Phone className="w-4 h-4" />}>
                          联系诊所
                        </Button>
                        <Button variant="ghost" size="sm" fullWidth icon={<ChevronRight className="w-4 h-4" />}>
                          详情
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-800">医疗档案</h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowRecordModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                添加记录
              </Button>
            </div>

            {medicalRecords.length === 0 ? (
              <Card variant="outlined" padding="lg">
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500">暂无医疗记录</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowRecordModal(true)}
                  >
                    添加记录
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {medicalRecords.map((record) => (
                  <Card key={record.id} variant="default" padding="md" hover>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-warning-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-warning-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-neutral-800">{record.title}</h3>
                          <p className="text-sm text-neutral-500">{record.date.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge variant={getRecordTypeColor(record.type) as any} size="sm">
                        {getRecordTypeLabel(record.type)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-neutral-600 mb-2">{record.description}</p>
                    
                    {record.vetName && (
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <User className="w-4 h-4" />
                        <span>医生: {record.vetName}</span>
                      </div>
                    )}
                    
                    {record.nextDueDate && (
                      <div className="mt-2 p-2 bg-primary-50 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-primary-500" />
                        <span className="text-sm text-primary-700">
                          下次提醒: {record.nextDueDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Appointment Modal */}
      <GlassModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        title="预约兽医"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">预约日期</label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 transition-all"
              value={appointmentForm.date.toISOString().split('T')[0]}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, date: new Date(e.target.value) }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">预约时间</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 transition-all"
              value={appointmentForm.time}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, time: e.target.value }))}
            >
              {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">诊所名称 *</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 transition-all"
              placeholder="请输入诊所名称"
              value={appointmentForm.clinicName}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, clinicName: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">兽医姓名 *</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 transition-all"
              placeholder="请输入兽医姓名"
              value={appointmentForm.vetName}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, vetName: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">诊所地址</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 transition-all"
              placeholder="请输入诊所地址"
              value={appointmentForm.address}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">预约目的 *</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 transition-all"
              placeholder="如: 常规体检、疫苗接种等"
              value={appointmentForm.purpose}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, purpose: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">备注</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 transition-all resize-none"
              placeholder="其他需要说明的事项"
              rows={3}
              value={appointmentForm.notes}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" size="lg" fullWidth onClick={() => setShowAppointmentModal(false)}>
              取消
            </Button>
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              onClick={handleBookAppointment}
              disabled={!appointmentForm.vetName || !appointmentForm.clinicName || !appointmentForm.purpose}
            >
              确认预约
            </Button>
          </div>
        </div>
      </GlassModal>

      {/* Record Modal */}
      <GlassModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="添加医疗记录"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">记录类型</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 transition-all"
              value={recordForm.type}
              onChange={(e) => setRecordForm(prev => ({ ...prev, type: e.target.value as any }))}
            >
              <option value="vaccination">疫苗接种</option>
              <option value="checkup">健康体检</option>
              <option value="treatment">治疗记录</option>
              <option value="surgery">手术记录</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">记录日期</label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 transition-all"
              value={recordForm.date.toISOString().split('T')[0]}
              onChange={(e) => setRecordForm(prev => ({ ...prev, date: new Date(e.target.value) }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">记录标题 *</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 transition-all"
              placeholder="如: 狂犬疫苗接种、年度体检等"
              value={recordForm.title}
              onChange={(e) => setRecordForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">详细描述 *</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 transition-all resize-none"
              placeholder="请详细描述医疗过程和结果"
              rows={4}
              value={recordForm.description}
              onChange={(e) => setRecordForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">主治医生</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 transition-all"
              placeholder="请输入医生姓名"
              value={recordForm.vetName}
              onChange={(e) => setRecordForm(prev => ({ ...prev, vetName: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">下次提醒日期</label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-warning-500 focus:ring-2 focus:ring-warning-200 transition-all"
              value={recordForm.nextDueDate.toISOString().split('T')[0]}
              onChange={(e) => setRecordForm(prev => ({ ...prev, nextDueDate: new Date(e.target.value) }))}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" size="lg" fullWidth onClick={() => setShowRecordModal(false)}>
              取消
            </Button>
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              onClick={handleAddRecord}
              disabled={!recordForm.title || !recordForm.description}
            >
              保存记录
            </Button>
          </div>
        </div>
      </GlassModal>

      <div className="h-8" />
    </div>
  );
}