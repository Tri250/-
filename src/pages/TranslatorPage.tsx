// ============================================
// PawSync Pro - TranslatorPage.tsx
// 
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: AI情感翻译页面
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Image, Share2, RefreshCw, Sparkles, Heart, X, Camera } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmotionIcons } from '../components/icons/EmotionIcons';
import { ShareModal } from '../components/ShareModal';
import { motion, AnimatePresence } from 'framer-motion';

type EmotionType = 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';

const emotionConfig = {
  happy: { label: '开心', color: 'text-green-500', bgColor: 'bg-green-50', gradient: 'from-green-400 to-emerald-500' },
  anxious: { label: '焦虑', color: 'text-yellow-500', bgColor: 'bg-yellow-50', gradient: 'from-yellow-400 to-amber-500' },
  angry: { label: '生气', color: 'text-red-500', bgColor: 'bg-red-50', gradient: 'from-red-400 to-rose-500' },
  needs: { label: '有需求', color: 'text-blue-500', bgColor: 'bg-blue-50', gradient: 'from-blue-400 to-indigo-500' },
  neutral: { label: '平静', color: 'text-gray-500', bgColor: 'bg-gray-50', gradient: 'from-gray-400 to-slate-500' },
};

const mockTranslations = {
  happy: [
    '主人，我今天超开心的！要不要一起玩呀？',
    '今天心情真好，谢谢主人陪我～',
    '喵～今天阳光真好，我很满足！',
  ],
  anxious: [
    '主人，你要去哪里呀？不要离开我太久...',
    '有点紧张，能陪陪我吗？',
    '外面好像有声音，有点害怕...',
  ],
  angry: [
    '哼！你为什么不给我开门！',
    '我生气了！快给我小鱼干！',
    '别碰我！我现在不想理你！',
  ],
  needs: [
    '主人，我饿了，要吃饭饭～',
    '想出去玩玩，放我出去嘛～',
    '好久没梳毛了，帮我梳梳毛吧！',
  ],
  neutral: [
    '今天天气不错呢...',
    '我在思考猫生...',
    '嗯...就这样吧。',
  ],
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
  const [emotion, setEmotion] = useState<EmotionType>('neutral');
  const [translation, setTranslation] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const emotions: EmotionType[] = ['happy', 'anxious', 'angry', 'needs', 'neutral'];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

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

  const stopRecording = () => {
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
    
    analyzeVoice();
  };

  const analyzeVoice = () => {
    setIsAnalyzing(true);
    setShowResult(false);
    
    setTimeout(() => {
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const translations = mockTranslations[randomEmotion];
      const randomTranslation = translations[Math.floor(Math.random() * translations.length)];
      const randomConfidence = 85 + Math.floor(Math.random() * 14);

      setEmotion(randomEmotion);
      setTranslation(randomTranslation);
      setConfidence(randomConfidence);
      setIsAnalyzing(false);
      setShowResult(true);
      setCurrentEmotion(randomEmotion);
      
      addAnalysis({
        petId: currentPet?.id || '',
        type: 'voice',
        result: {
          emotion: randomEmotion,
          translation: randomTranslation,
          confidence: randomConfidence,
        },
      });
    }, 1500);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleRetry = () => {
    setShowResult(false);
    setEmotion('neutral');
    setTranslation('');
    setConfidence(0);
  };

  const openCameraModal = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setShowCameraModal(true);
    } catch (error) {
      console.error('Camera access error:', error);
      alert('无法访问相机，请检查权限设置');
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
    analyzePhoto();
  };

  const closeCameraModal = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCameraModal(false);
    setCapturedImage(null);
  };

  const analyzePhoto = () => {
    setIsAnalyzing(true);
    setShowResult(false);
    
    setTimeout(() => {
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const translations = mockTranslations[randomEmotion];
      const randomTranslation = translations[Math.floor(Math.random() * translations.length)];
      const randomConfidence = 80 + Math.floor(Math.random() * 19);

      setEmotion(randomEmotion);
      setTranslation(randomTranslation);
      setConfidence(randomConfidence);
      setIsAnalyzing(false);
      setShowResult(true);
      setCurrentEmotion(randomEmotion);
      
      addAnalysis({
        petId: currentPet?.id || '',
        type: 'photo',
        result: {
          emotion: randomEmotion,
          translation: randomTranslation,
          confidence: randomConfidence,
        },
      });
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const config = emotionConfig[emotion];

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
        <div className="flex justify-center gap-4">
          <Button
            onClick={startRecording}
            disabled={isRecording || isAnalyzing}
            icon={<Mic className="w-5 h-5" />}
            className={isRecording || isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
          >
            录音翻译
          </Button>
          <Button
            variant="secondary"
            icon={<Image className="w-5 h-5" />}
            onClick={openCameraModal}
            disabled={isRecording || isAnalyzing}
            className={isRecording || isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
          >
            拍照分析
          </Button>
        </div>

        <div className="flex flex-col items-center gap-6">
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

          {isAnalyzing && (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
                <p className="text-gray-600 font-medium text-lg">
                  AI正在倾听...
                </p>
                <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
              </div>
              <p className="text-sm text-gray-400">
                正在分析宝贝的情绪
              </p>
            </div>
          )}
        </div>

        {showResult && (
          <Card variant="gradient" padding="large" className="animate-fadeIn">
            <div className="text-center mb-4">
              <Badge color={config.color.includes('green') ? 'green' : config.color.includes('yellow') ? 'yellow' : config.color.includes('red') ? 'red' : config.color.includes('blue') ? 'blue' : 'gray'} size="medium">
                <span className="inline-flex mr-1">
                  {(() => {
                    const IconComponent = EmotionIcons[emotion];
                    return <IconComponent size={28} />;
                  })()}
                </span>
                {config.label}
              </Badge>
            </div>

            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-4 shadow-inner">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white/80" />
              
              <p className="text-gray-700 text-center text-lg leading-relaxed font-medium">
                "{translation}"
              </p>
              
              <div className="flex justify-center mt-4">
                <span className="text-sm text-gray-400">— {currentPet?.name}</span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-gray-500 text-center mb-2">情感置信度</p>
              <EmotionMeter confidence={confidence} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button
                variant="secondary"
                size="small"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={handleRetry}
              >
                再听一次
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
              <button className="hover:text-orange-500 transition-colors">
                💾 保存记录
              </button>
              <button className="hover:text-orange-500 transition-colors">
                💬 社区讨论
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
                请将麦克风靠近宝贝，保持环境安静，这样AI能更准确地理解宝贝的心情哦~
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
              <div className="aspect-square bg-gray-900 rounded-2xl mb-4 relative overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <button
                    onClick={takePhoto}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <Camera className="w-8 h-8 text-gray-800" />
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
        content={translation}
        petName={currentPet?.name}
      />
    </div>
  );
}
