import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { healthApi, behaviorApi } from '../lib/api';
import { Heart, Activity, AlertTriangle, CheckCircle, Calendar, Stethoscope, FileText, TrendingUp } from 'lucide-react';
export default function HealthManagement() {
 const { currentPet, healthAlerts, resolveAlert, addHealthAlert } = useAppStore();
 const [alerts, setAlerts] = useState([]);
 const [symptoms, setSymptoms] = useState<string[]>([]);
 const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
 const [isDiagnosing, setIsDiagnosing] = useState(false);
 const [diagnosis, setDiagnosis] = useState<any>(null);
 const [journals, setJournals] = useState([]);
 const [showJournalModal, setShowJournalModal] = useState(false);
 const availableSymptoms = [
 '呕吐', '腹泻', '食欲不振', '嗜睡', '咳嗽', '打喷嚏', '皮肤瘙痒',
 '脱毛', '口臭', '尿频', '便秘', '体重下降', '呼吸困难', '抽搐'
 ];
 useEffect(() => {
 const fetchAlerts = async () => {
 if (currentPet) {
 try {
 const response = await healthApi.getAlerts(currentPet.id);
 setAlerts(response.data?.alerts || []);
 }
 catch (error) {
 console.error('Failed to fetch alerts:', error);
 }
 }
 };
 const fetchJournals = async () => {
 if (currentPet) {
 try {
 const response = await healthApi.getJournal(currentPet.id);
 setJournals(response.data?.journals || []);
 }
 catch (error) {
 console.error('Failed to fetch journals:', error);
 }
 }
 };
 fetchAlerts();
 fetchJournals();
 }, [currentPet]);
 const handleResolveAlert = async (alertId: string) => {
 try {
 await healthApi.resolveAlert(alertId);
 resolveAlert(alertId);
 setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isResolved: true } : a));
 }
 catch (error) {
 console.error('Failed to resolve alert:', error);
 }
 };
 const handleDiagnose = async () => {
 if (selectedSymptoms.length === 0)
 return;
 setIsDiagnosing(true);
 try {
 const response = await healthApi.diagnose({
 petId: currentPet.id,
 symptoms: selectedSymptoms,
 breed: currentPet.breed,
 });
 setDiagnosis(response.data);
 }
 catch (error) {
 console.error('Failed to diagnose:', error);
 }
 finally {
 setIsDiagnosing(false);
 }
 };
 const handleGenerateJournal = async () => {
 try {
 const response = await healthApi.generateJournal(currentPet.id);
 setJournals(prev => [response.data.journal, ...prev]);
 setShowJournalModal(false);
 }
 catch (error) {
 console.error('Failed to generate journal:', error);
 }
 };
 const toggleSymptom = (symptom: string) => {
 setSelectedSymptoms(prev => prev.includes(symptom)
 ? prev.filter(s => s !== symptom)
 : [...prev, symptom]);
 };
 const getSeverityColor = (severity: string) => {
 const colors: Record<string, string> = {
 'low': 'bg-green-100 text-green-800 border-green-200',
 'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
 'high': 'bg-red-100 text-red-800 border-red-200',
 };
 return colors[severity] || colors['low'];
 };
 const getSeverityIcon = (severity: string) => {
 if (severity === 'high')
 return '🔴';
 if (severity === 'medium')
 return '🟡';
 return '🟢';
 };
 return (<div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
 <div className="max-w-6xl mx-auto px-4 py-8">
 <div className="text-center mb-8">
 <h1 className="text-3xl font-bold text-gray-800 mb-2">健康管理中心</h1>
 <p className="text-gray-600">全方位守护宠物健康，智能预警早发现</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
 <div className="bg-white rounded-2xl shadow-lg p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-500">健康评分</p>
 <p className="text-3xl font-bold text-green-600">{currentPet?.healthScore || 0}</p>
 </div>
 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
 <Heart className="w-8 h-8 text-green-500"/>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-2xl shadow-lg p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-500">待处理预警</p>
 <p className="text-3xl font-bold text-orange-600">
 {alerts.filter(a => !a.isResolved).length}
 </p>
 </div>
 <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
 <AlertTriangle className="w-8 h-8 text-orange-500"/>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-2xl shadow-lg p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-500">行为记录</p>
 <p className="text-3xl font-bold text-blue-600">查看</p>
 </div>
 <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
 <Activity className="w-8 h-8 text-blue-500"/>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-white rounded-2xl shadow-xl p-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center">
 <AlertTriangle className="w-6 h-6 text-orange-500 mr-2"/>
 <h2 className="text-xl font-semibold text-gray-800">健康预警</h2>
 </div>
 <span className="text-sm text-gray-500">{alerts.length} 条记录</span>
 </div>

 {alerts.length === 0 ? (<p className="text-gray-500 text-center py-8">暂无健康预警记录</p>) : (<div className="space-y-4">
 {alerts.map((alert, index) => (<div key={index} className={`p-4 rounded-lg border ${alert.isResolved
 ? 'bg-gray-50 border-gray-200'
 : getSeverityColor(alert.severity)}`}>
 <div className="flex items-start justify-between">
 <div className="flex items-start">
 <span className="text-lg mr-3">{getSeverityIcon(alert.severity)}</span>
 <div>
 <p className="font-medium text-gray-800">{alert.message}</p>
 <p className="text-sm text-gray-600 mt-1">{alert.recommendation}</p>
 <p className="text-xs text-gray-400 mt-2">{alert.timestamp}</p>
 </div>
 </div>
 {!alert.isResolved && (<button onClick={() => handleResolveAlert(alert.id)} className="ml-4 px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
 已处理
 </button>)}
 </div>
 </div>))}
 </div>)}
 </div>

 <div className="bg-white rounded-2xl shadow-xl p-6">
 <div className="flex items-center mb-4">
 <Stethoscope className="w-6 h-6 text-blue-500 mr-2"/>
 <h2 className="text-xl font-semibold text-gray-800">AI初诊助手</h2>
 </div>

 <p className="text-gray-600 text-sm mb-4">选择宠物出现的症状，AI将提供初步诊断建议</p>

 <div className="flex flex-wrap gap-2 mb-6">
 {availableSymptoms.map((symptom) => (<button key={symptom} onClick={() => toggleSymptom(symptom)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSymptoms.includes(symptom)
 ? 'bg-blue-500 text-white'
 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
 {symptom}
 </button>))}
 </div>

 <button onClick={handleDiagnose} disabled={selectedSymptoms.length === 0 || isDiagnosing} className={`w-full py-3 rounded-lg font-semibold transition-all ${selectedSymptoms.length === 0 || isDiagnosing
 ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
 : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'}`}>
 {isDiagnosing ? '诊断中...' : '开始诊断'}
 </button>

 {diagnosis && (<div className="mt-6 p-4 bg-blue-50 rounded-lg">
 <h3 className="font-semibold text-blue-800 mb-2">诊断结果</h3>
 <div className="space-y-2">
 <p><span className="text-gray-600">置信度:</span> {Math.round(diagnosis.confidence * 100)}%</p>
 <p><span className="text-gray-600">建议就医:</span> {diagnosis.shouldSeeVet ? '是' : '否'}</p>
 <p><span className="text-gray-600">紧急程度:</span> {diagnosis.urgency}</p>
 </div>
 <div className="mt-4">
 <p className="text-sm font-medium text-gray-700">可能的情况:</p>
 <ul className="mt-2 space-y-1">
 {diagnosis.possibleConditions?.map((condition, i) => (<li key={i} className="text-sm text-gray-600">- {condition}</li>))}
 </ul>
 </div>
 <div className="mt-4">
 <p className="text-sm font-medium text-gray-700">建议:</p>
 <ul className="mt-2 space-y-1">
 {diagnosis.recommendations?.map((rec, i) => (<li key={i} className="text-sm text-gray-600">- {rec}</li>))}
 </ul>
 </div>
 </div>)}
 </div>
 </div>

 <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center">
 <Calendar className="w-6 h-6 text-purple-500 mr-2"/>
 <h2 className="text-xl font-semibold text-gray-800">宠物日记</h2>
 </div>
 <button onClick={() => setShowJournalModal(true)} className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
 生成今日日记
 </button>
 </div>

 {journals.length === 0 ? (<p className="text-gray-500 text-center py-8">暂无日记记录</p>) : (<div className="space-y-4">
 {journals.map((journal, index) => (<div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
 <div className="flex items-center justify-between mb-2">
 <p className="font-medium text-gray-800">{journal.date}</p>
 <span className="text-sm text-gray-500">
 <FileText className="inline-block w-4 h-4 mr-1"/>
 第{journals.length - index}天
 </span>
 </div>
 <p className="text-gray-600 mb-3">{journal.summary}</p>
 <div className="flex items-center gap-4">
 <div className="flex items-center">
 <Heart className="w-4 h-4 text-red-400 mr-1"/>
 <span className="text-sm text-gray-600">健康: {journal.healthScore}</span>
 </div>
 <div className="flex items-center">
 <Activity className="w-4 h-4 text-blue-400 mr-1"/>
 <span className="text-sm text-gray-600">活动: {journal.activityScore}</span>
 </div>
 <div className="flex items-center">
 <TrendingUp className="w-4 h-4 text-green-400 mr-1"/>
 <span className="text-sm text-gray-600">心情: {journal.emotionScore}</span>
 </div>
 </div>
 </div>))}
 </div>)}
 </div>

 {showJournalModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
 <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
 <h3 className="text-xl font-semibold text-gray-800 mb-4">生成宠物日记</h3>
 <p className="text-gray-600 mb-6">AI将根据今日的行为记录和健康数据，为您生成一份温馨的宠物日记。</p>
 <div className="flex gap-4">
 <button onClick={() => setShowJournalModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
 取消
 </button>
 <button onClick={handleGenerateJournal} className="flex-1 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600">
 确认生成
 </button>
 </div>
 </div>
 </div>)}
 </div>
 </div>);
}
