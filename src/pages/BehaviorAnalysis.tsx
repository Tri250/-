import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { behaviorApi } from '../lib/api';
import { Activity, Smile, Frown, Meh, Heart, Zap, Calendar, Eye, AlertTriangle } from 'lucide-react';
export default function BehaviorAnalysis() {
 const { currentPet, addBehaviorEvent, addDailyJournal } = useAppStore();
 const [events, setEvents] = useState([]);
 const [emotions, setEmotions] = useState([]);
 const [isRecording, setIsRecording] = useState(false);
 const [selectedBehavior, setSelectedBehavior] = useState('');
 const [showEventModal, setShowEventModal] = useState(false);
 const [multimodalResult, setMultimodalResult] = useState<any>(null);
 const behaviorTypes = [
 { type: 'eating', label: '进食', icon: '🍽️' },
 { type: 'drinking', label: '饮水', icon: '💧' },
 { type: 'sleeping', label: '睡觉', icon: '😴' },
 { type: 'playing', label: '玩耍', icon: '🎾' },
 { type: 'grooming', label: '梳理毛发', icon: '🧴' },
 { type: 'scratching', label: '抓挠', icon: '✂️' },
 { type: 'litter_box', label: '使用猫砂盆', icon: '🚽' },
 { type: 'barking', label: '吠叫', icon: '🐕' },
 { type: 'meowing', label: '喵喵叫', icon: '🐱' },
 { type: 'purring', label: '咕噜', icon: '💤' },
 { type: 'running', label: '奔跑', icon: '🏃' },
 { type: 'jumping', label: '跳跃', icon: '🦵' },
 { type: 'hiding', label: '躲藏', icon: '🙈' },
 { type: 'anxious', label: '焦虑', icon: '😰' },
 { type: 'aggressive', label: '攻击性', icon: '😠' },
 ];
 useEffect(() => {
 const fetchEvents = async () => {
 if (currentPet) {
 try {
 const response = await behaviorApi.getEvents(currentPet.id);
 setEvents(response.data?.events || []);
 }
 catch (error) {
 console.error('Failed to fetch events:', error);
 }
 }
 };
 const fetchEmotions = async () => {
 if (currentPet) {
 try {
 const response = await behaviorApi.getEmotions(currentPet.id);
 setEmotions(response.data?.emotions || []);
 }
 catch (error) {
 console.error('Failed to fetch emotions:', error);
 }
 }
 };
 fetchEvents();
 fetchEmotions();
 }, [currentPet]);
 const handleAddEvent = async () => {
 if (!selectedBehavior)
 return;
 try {
 const response = await behaviorApi.record({
 petId: currentPet.id,
 behaviorType: selectedBehavior,
 confidence: 0.95,
 });
 addBehaviorEvent({
 petId: currentPet.id,
 behaviorType: selectedBehavior,
 confidence: 0.95,
 timestamp: new Date().toISOString(),
 });
 setEvents(prev => [response.data.behaviorEvent, ...prev]);
 setShowEventModal(false);
 setSelectedBehavior('');
 }
 catch (error) {
 console.error('Failed to record behavior:', error);
 }
 };
 const handleMultimodalAnalyze = async () => {
 try {
 const response = await behaviorApi.multimodalAnalyze({
 petId: currentPet.id,
 });
 setMultimodalResult(response.data);
 }
 catch (error) {
 console.error('Failed to analyze:', error);
 }
 };
 const getEmotionIcon = (emotion: string) => {
 const icons: Record<string, string> = {
 'happy': '😊',
 'anxious': '😰',
 'angry': '😠',
 'sad': '😢',
 'neutral': '😐',
 'excited': '🤩',
 'relaxed': '😌',
 };
 return icons[emotion] || icons['neutral'];
 };
 const getEmotionColor = (emotion: string) => {
 const colors: Record<string, string> = {
 'happy': 'bg-green-100 text-green-800',
 'anxious': 'bg-yellow-100 text-yellow-800',
 'angry': 'bg-red-100 text-red-800',
 'sad': 'bg-blue-100 text-blue-800',
 'neutral': 'bg-gray-100 text-gray-800',
 'excited': 'bg-purple-100 text-purple-800',
 'relaxed': 'bg-teal-100 text-teal-800',
 };
 return colors[emotion] || colors['neutral'];
 };
 const getBehaviorIcon = (type: string) => {
 const found = behaviorTypes.find(b => b.type === type);
 return found?.icon || '📌';
 };
 const getBehaviorLabel = (type: string) => {
 const found = behaviorTypes.find(b => b.type === type);
 return found?.label || type;
 };
 return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
 <div className="max-w-6xl mx-auto px-4 py-8">
 <div className="text-center mb-8">
 <h1 className="text-3xl font-bold text-gray-800 mb-2">行为分析中心</h1>
 <p className="text-gray-600">AI驱动的宠物行为监测与情感分析</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
 <div className="bg-white rounded-2xl shadow-lg p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-500">今日行为</p>
 <p className="text-2xl font-bold text-blue-600">{events.filter(e => {
 const eventDate = new Date(e.timestamp);
 const today = new Date();
 return eventDate.toDateString() === today.toDateString();
 }).length}</p>
 </div>
 <Activity className="w-10 h-10 text-blue-400"/>
 </div>
 </div>

 <div className="bg-white rounded-2xl shadow-lg p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-500">活跃时长</p>
 <p className="text-2xl font-bold text-green-600">2.5小时</p>
 </div>
 <Zap className="w-10 h-10 text-green-400"/>
 </div>
 </div>

 <div className="bg-white rounded-2xl shadow-lg p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-500">平均心情</p>
 <p className="text-2xl font-bold text-purple-600">😊 愉快</p>
 </div>
 <Smile className="w-10 h-10 text-purple-400"/>
 </div>
 </div>

 <div className="bg-white rounded-2xl shadow-lg p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-500">健康评分</p>
 <p className="text-2xl font-bold text-orange-600">92</p>
 </div>
 <Heart className="w-10 h-10 text-orange-400"/>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
 <div className="bg-white rounded-2xl shadow-xl p-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center">
 <Activity className="w-6 h-6 text-blue-500 mr-2"/>
 <h2 className="text-xl font-semibold text-gray-800">行为记录</h2>
 </div>
 <button onClick={() => setShowEventModal(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
 添加记录
 </button>
 </div>

 {events.length === 0 ? (<p className="text-gray-500 text-center py-8">暂无行为记录</p>) : (<div className="space-y-3 max-h-80 overflow-y-auto">
 {events.slice(0, 10).map((event, index) => (<div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
 <div className="flex items-center">
 <span className="text-xl mr-3">{getBehaviorIcon(event.behaviorType)}</span>
 <div>
 <p className="font-medium text-gray-800">{getBehaviorLabel(event.behaviorType)}</p>
 <p className="text-xs text-gray-500">
 {new Date(event.timestamp).toLocaleTimeString()}
 </p>
 </div>
 </div>
 <span className="text-sm text-gray-500">
 {Math.round(event.confidence * 100)}%
 </span>
 </div>))}
 </div>)}
 </div>

 <div className="bg-white rounded-2xl shadow-xl p-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center">
 <Smile className="w-6 h-6 text-purple-500 mr-2"/>
 <h2 className="text-xl font-semibold text-gray-800">情感状态</h2>
 </div>
 <button onClick={handleMultimodalAnalyze} className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600">
 三模分析
 </button>
 </div>

 {multimodalResult && (<div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
 <div className="flex items-center mb-2">
 <span className="text-2xl mr-2">
 {multimodalResult.shouldAlert ? '⚠️' : '😊'}
 </span>
 <div>
 <p className="font-medium text-gray-800">{multimodalResult.overallEmotion}</p>
 <p className="text-sm text-gray-500">置信度: {Math.round(multimodalResult.confidence * 100)}%</p>
 </div>
 </div>
 <p className="text-gray-600">{multimodalResult.message}</p>
 {multimodalResult.recommendation && (<p className="text-sm text-green-600 mt-2">{multimodalResult.recommendation}</p>)}
 </div>)}

 {emotions.length === 0 ? (<p className="text-gray-500 text-center py-8">暂无情感记录</p>) : (<div className="flex flex-wrap gap-3">
 {emotions.slice(0, 8).map((emotion, index) => (<div key={index} className={`px-4 py-2 rounded-full ${getEmotionColor(emotion.emotionType)}`}>
 <span className="text-lg mr-1">{getEmotionIcon(emotion.emotionType)}</span>
 <span className="text-sm font-medium">{emotion.emotionType}</span>
 </div>))}
 </div>)}
 </div>
 </div>

 <div className="bg-white rounded-2xl shadow-xl p-6">
 <div className="flex items-center mb-4">
 <Calendar className="w-6 h-6 text-blue-500 mr-2"/>
 <h2 className="text-xl font-semibold text-gray-800">今日活动概览</h2>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="bg-green-50 rounded-lg p-4 text-center">
 <p className="text-3xl mb-1">🍽️</p>
 <p className="text-sm text-gray-600">进食次数</p>
 <p className="text-xl font-bold text-green-600">3次</p>
 </div>
 <div className="bg-blue-50 rounded-lg p-4 text-center">
 <p className="text-3xl mb-1">💧</p>
 <p className="text-sm text-gray-600">饮水次数</p>
 <p className="text-xl font-bold text-blue-600">5次</p>
 </div>
 <div className="bg-purple-50 rounded-lg p-4 text-center">
 <p className="text-3xl mb-1">🎾</p>
 <p className="text-sm text-gray-600">玩耍时长</p>
 <p className="text-xl font-bold text-purple-600">45分钟</p>
 </div>
 <div className="bg-orange-50 rounded-lg p-4 text-center">
 <p className="text-3xl mb-1">😴</p>
 <p className="text-sm text-gray-600">睡眠时长</p>
 <p className="text-xl font-bold text-orange-600">12小时</p>
 </div>
 </div>

 <div className="mt-6 flex items-center justify-center">
 <div className="relative w-48 h-48">
 <svg className="w-full h-full transform -rotate-90">
 <circle cx="96" cy="96" r="88" stroke="#e5e7eb" strokeWidth="12" fill="none"/>
 <circle cx="96" cy="96" r="88" stroke="#8b5cf6" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={`${(92 / 100) * 553} 553`}/>
 </svg>
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="text-center">
 <p className="text-3xl font-bold text-purple-600">92</p>
 <p className="text-sm text-gray-500">活跃度</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {showEventModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
 <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
 <h3 className="text-xl font-semibold text-gray-800 mb-4">添加行为记录</h3>
 <div className="grid grid-cols-3 gap-2">
 {behaviorTypes.map((behavior) => (<button key={behavior.type} onClick={() => setSelectedBehavior(behavior.type)} className={`p-3 rounded-lg text-center transition-all ${selectedBehavior === behavior.type
 ? 'bg-blue-500 text-white'
 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
 <p className="text-xl mb-1">{behavior.icon}</p>
 <p className="text-xs">{behavior.label}</p>
 </button>))}
 </div>
 <div className="flex gap-4 mt-6">
 <button onClick={() => setShowEventModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium">
 取消
 </button>
 <button onClick={handleAddEvent} disabled={!selectedBehavior} className={`flex-1 py-3 rounded-lg font-medium transition-all ${!selectedBehavior
 ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
 : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
 确认添加
 </button>
 </div>
 </div>
 </div>)}

 <div className="mt-6 bg-gradient-to-r from-green-100 to-teal-100 rounded-xl p-4 flex items-start">
 <Eye className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
 <div>
 <p className="font-medium text-green-800">👁️ 行为洞察</p>
 <p className="text-sm text-green-700">通过持续监测宠物的行为模式，可以提前发现健康问题的迹象。例如，饮水次数异常增加可能提示肾脏问题。</p>
 </div>
 </div>
 </div>
 </div>);
}
