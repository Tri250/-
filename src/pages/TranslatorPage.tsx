import { useState, useRef } from 'react';
import { Mic, MicOff, Image, Share2, RefreshCw, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/appStore';

type EmotionType = 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';

const emotionConfig = {
  happy: { emoji: '😸', label: '开心', color: 'text-green-500', bgColor: 'bg-green-50' },
  anxious: { emoji: '😰', label: '焦虑', color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  angry: { emoji: '😾', label: '生气', color: 'text-red-500', bgColor: 'bg-red-50' },
  needs: { emoji: '🥺', label: '有需求', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  neutral: { emoji: '😐', label: '平静', color: 'text-gray-500', bgColor: 'bg-gray-50' },
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

export function TranslatorPage() {
  const { currentPet, addAnalysis, setCurrentEmotion } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [emotion, setEmotion] = useState<EmotionType>('neutral');
  const [translation, setTranslation] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const timerRef = useRef<number | null>(null);

  const emotions: EmotionType[] = ['happy', 'anxious', 'angry', 'needs', 'neutral'];

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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
    const text = `【PawSync Pro】${currentPet?.name}说："${translation}"`;
    if (navigator.share) {
      navigator.share({ title: `${currentPet?.name}的心声`, text });
    } else {
      navigator.clipboard.writeText(text);
      alert('已复制到剪贴板');
    }
  };

  const handleRetry = () => {
    setShowResult(false);
    setEmotion('neutral');
    setTranslation('');
    setConfidence(0);
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
          <h1 className="text-xl font-bold text-gray-800 text-center">AI 情感翻译机</h1>
          <p className="text-xs text-gray-400 text-center">倾听 {currentPet?.name} 的心声</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-center gap-4">
          <button
            onClick={startRecording}
            disabled={isRecording || isAnalyzing}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
              isRecording || isAnalyzing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg hover:shadow-xl'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="font-medium">录音翻译</span>
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Image className="w-5 h-5" />
            <span className="font-medium">拍照分析</span>
          </button>
        </div>

        <div className="relative flex justify-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isAnalyzing}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isRecording
                ? 'bg-gradient-to-br from-red-400 to-red-600 animate-pulse scale-110'
                : isAnalyzing
                ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                : 'bg-gradient-to-br from-orange-400 to-peach-500 hover:scale-105'
            }`}
          >
            {isAnalyzing ? (
              <RefreshCw className="w-12 h-12 text-white animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-14 h-14 text-white" />
            ) : (
              <Mic className="w-14 h-14 text-white" />
            )}
          </button>
          
          {isRecording && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-4 border-orange-300 animate-ping opacity-30" />
              <div className="absolute w-40 h-40 rounded-full border-4 border-orange-400 animate-ping opacity-20" style={{ animationDelay: '0.2s' }} />
              <div className="absolute w-32 h-32 rounded-full border-4 border-orange-500 animate-ping opacity-10" style={{ animationDelay: '0.4s' }} />
            </div>
          )}
        </div>

        {isRecording && (
          <div className="text-center">
            <p className="text-gray-600 font-medium">{formatTime(recordingTime)}</p>
            <p className="text-xs text-gray-400 mt-1">正在录音，点击结束</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center">
            <p className="text-gray-600 font-medium flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500 animate-spin" />
              AI 正在分析中...
            </p>
          </div>
        )}

        {showResult && (
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-orange-100 animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
                {config.emoji} {config.label}
              </span>
              <span className="text-xs text-gray-400">置信度: {confidence}%</span>
            </div>

            <div className="relative bg-gradient-to-br from-orange-50 to-peach-50 rounded-xl p-4 mb-4">
              <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-orange-50" />
              <p className="text-gray-700 text-center leading-relaxed">{translation}</p>
              <div className="flex justify-end mt-2">
                <span className="text-xs text-gray-400">— {currentPet?.name}</span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">再录一次</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">分享</span>
              </button>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-orange-50 to-peach-50 rounded-xl p-4 border border-orange-100">
          <p className="text-xs text-gray-500 text-center">
            💡 提示：请将麦克风靠近宠物，保持环境安静以获得更好的识别效果
          </p>
        </div>
      </main>
    </div>
  );
}