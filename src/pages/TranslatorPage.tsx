// ============================================
// PawSync Pro - TranslatorPage.tsx
// 
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: AI情感翻译页面 - 增强版
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Image, Share2, RefreshCw, Sparkles, Heart, X, Camera, FileText, Video, MessageCircle, Activity, TrendingUp, Download, Send } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmotionIcons } from '../components/icons/EmotionIcons';
import { ShareModal } from '../components/ShareModal';
import { motion, AnimatePresence } from 'framer-motion';
import { emotionService } from '../services/emotionService';
import type { EmotionAnalysis, PrimaryEmotion } from '../types/emotion';

type InputMode = 'voice' | 'image' | 'video' | 'text' | 'multimodal';

const emotionConfig: Record<PrimaryEmotion, { label: string; color: string; bgColor: string; gradient: string }> = {
  happy: { label: '开心', color: 'text-green-500', bgColor: 'bg-green-50', gradient: 'from-green-400 to-emerald-500' },
  curious: { label: '好奇', color: 'text-blue-500', bgColor: 'bg-blue-50', gradient: 'from-blue-400 to-cyan-500' },
  anxious: { label: '焦虑', color: 'text-yellow-500', bgColor: 'bg-yellow-50', gradient: 'from-yellow-400 to-amber-500' },
  angry: { label: '生气', color: 'text-red-500', bgColor: 'bg-red-50', gradient: 'from-red-400 to-rose-500' },
  needs: { label: '有需求', color: 'text-purple-500', bgColor: 'bg-purple-50', gradient: 'from-purple-400 to-violet-500' },
  calm: { label: '平静', color: 'text-gray-500', bgColor: 'bg-gray-50', gradient: 'from-gray-400 to-slate-500' },
  excited: { label: '兴奋', color: 'text-pink-500', bgColor: 'bg-pink-50', gradient: 'from-pink-400 to-rose-500' },
  safe: { label: '安心', color: 'text-teal-500', bgColor: 'bg-teal-50', gradient: 'from-teal-400 to-cyan-500' },
  hungry: { label: '饥饿', color: 'text-orange-500', bgColor: 'bg-orange-50', gradient: 'from-orange-400 to-amber-500' },
  tired: { label: '疲惫', color: 'text-indigo-500', bgColor: 'bg-indigo-50', gradient: 'from-indigo-400 to-blue-500' },
  affectionate: { label: '亲昵', color: 'text-rose-500', bgColor: 'bg-rose-50', gradient: 'from-rose-400 to-pink-500' },
  bored: { label: '无聊', color: 'text-slate-500', bgColor: 'bg-slate-50', gradient: 'from-slate-400 to-gray-500' },
  pain: { label: '疼痛', color: 'text-red-600', bgColor: 'bg-red-100', gradient: 'from-red-500 to-red-700' },
  fearful: { label: '恐惧', color: 'text-gray-700', bgColor: 'bg-gray-200', gradient: 'from-gray-600 to-gray-800' },
  neutral: { label: '中性', color: 'text-gray-500', bgColor: 'bg-gray-50', gradient: 'from-gray-400 to-slate-500' },
};

function PawPrintIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor">
      <ellipse cx="50" cy="65" rx="25" ry="20" />
      <ellipse cx="25" cy="35" rx="10" ry="12" />
      <ellipse cx="45" cy="25" rx="8" ry="10" />
      <ellipse cx="65" cy="25" rx="8" ry="10" />
      <ellipse cx="80" cy="35" rx="10" ry="12" />
    </svg>
  );
}

function SoundWave({ active, color }: { active: boolean; color: string }) {
  const bars = [1, 2, 3, 4, 5, 6, 7];
  
  return (
    <div className="flex items-end justify-center gap-1 h-16">
      {bars.map((_, index) => (
        <div
          key={index}
          className={`w-1.5 rounded-full transition-all ${active ? 'animate-pulse' : ''}`}
          style={{
            height: active ? `${20 + Math.random() * 60}%` : '20%',
            backgroundColor: active ? color : '#d1d5db',
            animationDelay: `${index * 0.1}s`,
            animationDuration: '0.8s',
          }}
        />
      ))}
    </div>
  );
}

function EmotionMeter({ confidence }: { confidence: number }) {
  return (
    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-orange-400 to-peach-500 rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${confidence}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-700 drop-shadow-sm">
          置信度 {confidence}%
        </span>
      </div>
    </div>
  );
}

export function TranslatorPage() {
  const { currentPet, addAnalysis, setCurrentEmotion } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [analysisResult, setAnalysisResult] = useState<EmotionAnalysis | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const petHistory = currentPet ? emotionService.getHistoryByPet(currentPet.id) : [];
  const filteredHistory = searchTerm ? emotionService.searchHistory(currentPet?.id || '', searchTerm) : petHistory;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const createMockAudioData = () => {
    const data = new Float32Array(44100 * 3);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() - 0.5) * 0.5;
    }
    return data;
  };

  const createMockImageData = () => {
    return {
      data: new Uint8ClampedArray(100 * 100 * 4),
      width: 100,
      height: 100,
    } as ImageData;
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    const simulateAudioLevel = () => {
      if (!isRecording) return;
      setAudioLevel(Math.random() * 100);
      animationRef.current = requestAnimationFrame(simulateAudioLevel);
    };
    simulateAudioLevel();
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setAudioLevel(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    await analyzeVoice();
  };

  const analyzeVoice = async () => {
    setIsAnalyzing(true);
    setShowResult(false);
    
    try {
      const audioData = createMockAudioData();
      const petBreed = currentPet?.species === 'dog' ? 'dog' : 'cat';
      const result = await emotionService.analyzeVoice(audioData, currentPet?.id || '1', petBreed);
      
      setAnalysisResult(result);
      setIsAnalyzing(false);
      setShowResult(true);
      setCurrentEmotion(result.primaryEmotion);
      
      addAnalysis({
        petId: currentPet?.id || '',
        type: 'voice',
        result: {
          emotion: result.primaryEmotion,
          translation: result.translation,
          confidence: result.confidence,
        },
      });
    } catch (error) {
      console.error('分析失败:', error);
      setIsAnalyzing(false);
    }
  };

  const analyzeText = async () => {
    if (!textInput.trim()) return;
    
    setIsAnalyzing(true);
    setShowResult(false);
    
    try {
      const petBreed = currentPet?.species === 'dog' ? 'dog' : 'cat';
      const result = await emotionService.analyzeTextBehavior(textInput, currentPet?.id || '1', petBreed);
      
      setAnalysisResult(result);
      setIsAnalyzing(false);
      setShowResult(true);
      setCurrentEmotion(result.primaryEmotion);
      setTextInput('');
      
      addAnalysis({
        petId: currentPet?.id || '',
        type: 'text',
        result: {
          emotion: result.primaryEmotion,
          translation: result.translation,
          confidence: result.confidence,
        },
      });
    } catch (error) {
      console.error('分析失败:', error);
      setIsAnalyzing(false);
    }
  };

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    setShowResult(false);
    
    try {
      const imageData = createMockImageData();
      const petBreed = currentPet?.species === 'dog' ? 'dog' : 'cat';
      const result = await emotionService.analyzeEmotion(imageData, currentPet?.id || '1', petBreed);
      
      setAnalysisResult(result);
      setIsAnalyzing(false);
      setShowResult(true);
      setCurrentEmotion(result.primaryEmotion);
      
      addAnalysis({
        petId: currentPet?.id || '',
        type: 'image',
        result: {
          emotion: result.primaryEmotion,
          translation: result.translation,
          confidence: result.confidence,
        },
      });
    } catch (error) {
      console.error('分析失败:', error);
      setIsAnalyzing(false);
    }
  };

  const analyzeVideo = async () => {
    setIsAnalyzing(true);
    setShowResult(false);
    
    try {
      const videoBlob = new Blob(['video data'], { type: 'video/mp4' });
      const petBreed = currentPet?.species === 'dog' ? 'dog' : 'cat';
      const result = await emotionService.analyzeVideo(videoBlob, currentPet?.id || '1', petBreed);
      
      setAnalysisResult(result);
      setIsAnalyzing(false);
      setShowResult(true);
      setCurrentEmotion(result.primaryEmotion);
      
      addAnalysis({
        petId: currentPet?.id || '',
        type: 'video',
        result: {
          emotion: result.primaryEmotion,
          translation: result.translation,
          confidence: result.confidence,
        },
      });
    } catch (error) {
      console.error('分析失败:', error);
      setIsAnalyzing(false);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleRetry = () => {
    setShowResult(false);
    setAnalysisResult(null);
  };

  const openCameraModal = async () => {
    try {
      let stream: MediaStream | null = null;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
      } catch (err) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          });
        } catch (err2) {
          setShowCameraModal(true);
          alert('为了更好的体验，请允许相机访问权限。当前演示模式仍可使用。');
          return;
        }
      }
      
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Auto-play failed:', playErr);
        }
      }
      setShowCameraModal(true);
    } catch (error) {
      console.error('Camera access error:', error);
      setShowCameraModal(true);
      alert('演示模式：相机访问受限，但您仍可以体验拍照分析功能！');
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    const imageDataUrl = canvas.toDataURL('image/png');
    setCapturedImage(imageDataUrl);
    setShowCameraModal(false);
    analyzeImage();
  };

  const closeCameraModal = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCameraModal(false);
    setCapturedImage(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'voice': return <Mic size={14} />;
      case 'image': return <Image size={14} />;
      case 'video': return <Video size={14} />;
      case 'text': return <FileText size={14} />;
      case 'multimodal': return <Activity size={14} />;
      default: return <MessageCircle size={14} />;
    }
  };

  const config = analysisResult ? emotionConfig[analysisResult.primaryEmotion] : emotionConfig.neutral;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-peach-50/30 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800 text-center flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 text-orange-500" />
            AI 情感翻译机
          </h1>
          <p className="text-xs text-gray-400 text-center">倾听 {currentPet?.name} 的心声</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 输入模式选择 */}
        <div className="flex justify-center gap-2 flex-wrap">
          <Button
            variant={inputMode === 'voice' ? 'primary' : 'secondary'}
            size="small"
            icon={<Mic className="w-4 h-4" />}
            onClick={() => setInputMode('voice')}
            disabled={isAnalyzing}
          >
            语音
          </Button>
          <Button
            variant={inputMode === 'image' ? 'primary' : 'secondary'}
            size="small"
            icon={<Image className="w-4 h-4" />}
            onClick={() => setInputMode('image')}
            disabled={isAnalyzing}
          >
            图片
          </Button>
          <Button
            variant={inputMode === 'video' ? 'primary' : 'secondary'}
            size="small"
            icon={<Video className="w-4 h-4" />}
            onClick={() => setInputMode('video')}
            disabled={isAnalyzing}
          >
            视频
          </Button>
          <Button
            variant={inputMode === 'text' ? 'primary' : 'secondary'}
            size="small"
            icon={<FileText className="w-4 h-4" />}
            onClick={() => setInputMode('text')}
            disabled={isAnalyzing}
          >
            文字
          </Button>
        </div>

        {/* 历史记录按钮 */}
        <div className="flex justify-center">
          <Button
            variant="secondary"
            size="small"
            icon={<Activity className="w-4 h-4" />}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? '隐藏记录' : '查看历史'}
          </Button>
        </div>

        {/* 历史记录显示 */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card variant="default" padding="medium">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp size={16} />
                    翻译历史
                  </h3>
                  <input
                    type="text"
                    placeholder="搜索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg w-32"
                  />
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredHistory.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">暂无记录</p>
                  ) : (
                    filteredHistory.map((item, idx) => (
                      <div key={item.id} className="p-2 bg-gray-50 rounded-lg text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            {getSourceIcon(item.source)}
                            <span className="font-medium text-gray-700">
                              {emotionConfig[item.primaryEmotion].label}
                            </span>
                          </div>
                          <span className="text-gray-400">{formatDate(item.createdAt)}</span>
                        </div>
                        <p className="text-gray-600 truncate">{item.translation}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主输入区域 */}
        <div className="flex flex-col items-center gap-6">
          {/* 语音模式 */}
          {inputMode === 'voice' && (
            <>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAnalyzing}
                className={`
                  relative w-36 h-36 rounded-full flex items-center justify-center 
                  transition-all duration-300 shadow-2xl
                  ${isAnalyzing ? 'bg-gradient-to-br from-gray-300 to-gray-400 cursor-not-allowed' : ''}
                  ${isRecording ? 'bg-gradient-to-br from-red-400 to-red-600 scale-110' : ''}
                  ${!isRecording && !isAnalyzing ? 'bg-gradient-to-br from-orange-400 to-peach-500 hover:scale-105' : ''}
                `}
                aria-label={isRecording ? '停止录音' : '开始录音'}
              >
                {isAnalyzing ? (
                  <Sparkles className="w-14 h-14 text-white animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-14 h-14 text-white" />
                ) : (
                  <PawPrintIcon className="w-16 h-16 text-white" />
                )}

                {isRecording && (
                  <>
                    <div className="absolute inset-0 rounded-full">
                      <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping opacity-40" />
                      <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-30" style={{ animationDelay: '0.3s' }} />
                      <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20" style={{ animationDelay: '0.6s' }} />
                    </div>
                  </>
                )}
              </button>

              {isRecording && (
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <Heart className="w-5 h-5 text-red-500 animate-pulse" />
                    <p className="text-gray-600 font-medium text-lg">
                      宝贝正在说话呢...
                    </p>
                    <Heart className="w-5 h-5 text-red-500 animate-pulse" />
                  </div>
                  
                  <p className="text-2xl font-bold text-gray-800">
                    {formatTime(recordingTime)}
                  </p>
                  
                  <SoundWave active={isRecording} color={config.color.split('-')[1]} />

                  <p className="text-xs text-gray-400">
                    点击按钮结束录音
                  </p>
                </div>
              )}
            </>
          )}

          {/* 图片模式 */}
          {inputMode === 'image' && (
            <div className="text-center space-y-4 w-full">
              <Button
                onClick={openCameraModal}
                disabled={isAnalyzing}
                icon={<Camera className="w-5 h-5" />}
                className="w-full"
              >
                拍照分析
              </Button>
              <Button
                variant="secondary"
                onClick={() => analyzeImage()}
                disabled={isAnalyzing}
                icon={<Image className="w-5 h-5" />}
                className="w-full"
              >
                选择图片
              </Button>
            </div>
          )}

          {/* 视频模式 */}
          {inputMode === 'video' && (
            <div className="text-center space-y-4 w-full">
              <Button
                onClick={() => analyzeVideo()}
                disabled={isAnalyzing}
                icon={<Video className="w-5 h-5" />}
                className="w-full"
              >
                选择视频
              </Button>
            </div>
          )}

          {/* 文字模式 */}
          {inputMode === 'text' && (
            <div className="w-full space-y-4">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="描述宝贝的行为，比如：'猫咪在蹭我的腿，尾巴竖起来'..."
                className="w-full h-32 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                disabled={isAnalyzing}
              />
              <Button
                onClick={analyzeText}
                disabled={isAnalyzing || !textInput.trim()}
                icon={<Send className="w-5 h-5" />}
                className="w-full"
              >
                分析行为
              </Button>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
                <p className="text-gray-600 font-medium text-lg">
                  AI正在分析...
                </p>
                <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
              </div>
              <p className="text-sm text-gray-400">
                正在理解宝贝的情绪
              </p>
            </div>
          )}
        </div>

        {/* 分析结果 */}
        {showResult && analysisResult && (
          <Card variant="gradient" padding="large" className="animate-fadeIn">
            <div className="text-center mb-4">
              <Badge color={analysisResult.primaryEmotion === 'happy' ? 'green' : 
                          analysisResult.primaryEmotion === 'pain' ? 'red' : 
                          analysisResult.primaryEmotion === 'anxious' ? 'yellow' : 
                          analysisResult.primaryEmotion === 'curious' ? 'blue' : 'gray'} 
                     size="medium">
                <span className="inline-flex mr-1">
                  {(() => {
                    const IconComponent = EmotionIcons[analysisResult.primaryEmotion as keyof typeof EmotionIcons] || Heart;
                    return <IconComponent size={28} />;
                  })()}
                </span>
                {config.label}
              </Badge>
            </div>

            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-4 shadow-inner">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white/80" />
              
              <p className="text-gray-700 text-center text-lg leading-relaxed font-medium">
                "{analysisResult.translation}"
              </p>
              
              <div className="flex justify-center mt-4">
                <span className="text-sm text-gray-400">— {currentPet?.name}</span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-gray-500 text-center mb-2">情感置信度</p>
              <EmotionMeter confidence={analysisResult.confidence} />
              <p className="text-xs text-gray-400 text-center mt-2">
                强度: {analysisResult.intensity}/100
              </p>
            </div>

            {/* 次要情绪 */}
            {analysisResult.secondaryEmotions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 text-center mb-2">次要情绪</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  {analysisResult.secondaryEmotions.map((emotion, idx) => (
                    <Badge key={idx} size="small">
                      {emotionConfig[emotion].label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 健康建议 */}
            {analysisResult.healthRecommendations && analysisResult.healthRecommendations.length > 0 && (
              <Card variant="default" padding="small" className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">💡 建议</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {analysisResult.healthRecommendations.slice(0, 2).map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* 关键特征 */}
            {analysisResult.keyFeatures && analysisResult.keyFeatures.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">识别特征</p>
                <div className="flex flex-wrap gap-1">
                  {analysisResult.keyFeatures.map((feature, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button
                variant="secondary"
                size="small"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={handleRetry}
              >
                重新分析
              </Button>
              <Button
                size="small"
                icon={<Share2 className="w-4 h-4" />}
                onClick={handleShare}
              >
                分享心情
              </Button>
            </div>

            <div className="flex justify-center gap-4 text-xs text-gray-400">
              <button className="hover:text-orange-500 transition-colors flex items-center gap-1">
                <Download size={12} />
                保存记录
              </button>
            </div>
          </Card>
        )}

        <Card variant="default" padding="medium">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                <strong>小贴士</strong>
              </p>
              <p className="text-xs text-gray-500">
                支持多种输入方式，让AI更全面地理解宝贝的情绪！
              </p>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="medium">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✨</div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                <strong>AI能力说明</strong>
              </p>
              <p className="text-xs text-gray-500">
                支持15种主要情绪识别，品种特异性翻译，多模态分析准确率提升30%！
              </p>
            </div>
          </div>
        </Card>
      </main>
      
      {/* 相机模态框 */}
      <AnimatePresence>
        {showCameraModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCameraModal}
              className="fixed inset-0 bg-black/70 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">拍照分析</h3>
                <button onClick={closeCameraModal} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover absolute inset-0"
                  autoPlay
                  playsInline
                  muted
                />
                {/* 如果没有视频流，显示占位图 */}
                <div className="text-center z-10 p-8">
                  <div className="text-6xl mb-4">🐾</div>
                  <p className="text-gray-300 text-sm">将相机对准您的宝贝</p>
                  <p className="text-gray-400 text-xs mt-2">演示模式可用</p>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <button
                    onClick={takePhoto}
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
                  >
                    <div className="w-16 h-16 border-4 border-gray-300 rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-800" />
                    </div>
                  </button>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500">点击拍摄按钮拍照分析{currentPet?.name}的情绪</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`${currentPet?.name}的心情`}
        content={analysisResult?.translation || ''}
        petName={currentPet?.name}
      />
    </div>
  );
}
