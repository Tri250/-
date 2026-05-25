import { useState, useRef } from 'react';
import { Mic, MicOff, Image, Share2, RefreshCw, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Badge, GlassCard, GradientButton } from '../components/UIEnhancements';

type EmotionType = 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';

const emotionConfig = {
  happy: { emoji: '😸', label: '开心', color: 'from-green-400 to-emerald-500', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  anxious: { emoji: '😰', label: '焦虑', color: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
  angry: { emoji: '😾', label: '生气', color: 'from-red-400 to-pink-500', bgColor: 'bg-red-50', textColor: 'text-red-600' },
  needs: { emoji: '🥺', label: '有需求', color: 'from-blue-400 to-cyan-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  neutral: { emoji: '😐', label: '平静', color: 'from-gray-400 to-slate-500', bgColor: 'bg-gray-50', textColor: 'text-gray-600' },
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
    }, 2000);
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
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50/30 pb-20">
      <header className="sticky top-0 z-40 glass-effect border-b border-surface-200/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center shadow-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-800 tracking-tight">AI 情感翻译机</h1>
              <p className="text-xs text-surface-500">倾听 {currentPet?.name} 的心声</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-center gap-4 animate-fadeInUp">
          <button
            onClick={startRecording}
            disabled={isRecording || isAnalyzing}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300
              ${isRecording || isAnalyzing
                ? 'bg-surface-100 text-surface-400 cursor-not-allowed'
                : 'gradient-brand text-white shadow-glow hover:shadow-glow-lg hover:scale-105 active:scale-95'
              }
            `}
          >
            <Mic className="w-5 h-5" />
            <span className="font-semibold">录音翻译</span>
          </button>
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Image className="w-5 h-5" />
            <span className="font-semibold">拍照分析</span>
          </button>
        </div>

        <div className="relative flex justify-center py-12 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isAnalyzing}
            className={`
              w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl
              ${isRecording
                ? 'bg-gradient-to-br from-red-400 to-red-600 animate-pulse scale-110 shadow-red-400/50'
                : isAnalyzing
                ? 'bg-gradient-to-br from-surface-300 to-surface-400'
                : 'bg-gradient-to-br from-brand-400 to-accent-500 hover:scale-105 shadow-brand-400/50'
              }
            `}
          >
            {isAnalyzing ? (
              <RefreshCw className="w-16 h-16 text-white animate-spin" />
            ) : isRecording ? (
              <div className="flex flex-col items-center">
                <MicOff className="w-16 h-16 text-white" />
  
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Mic className="w-16 h-16 text-white" />
                <span className="text-white text-sm font-medium mt-2">点击录音</span>
              </div>
            )}
          </button>
          
          {isRecording && (
            <>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 rounded-full border-4 border-red-300 animate-ping opacity-30" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 rounded-full border-4 border-red-400 animate-ping opacity-20" style={{ animationDelay: '0.3s' }} />
              </div>
            </>
          )}
        </div>

        {isRecording && (
          <div className="text-center animate-fadeIn">
            <p className="text-3xl font-bold text-surface-800 font-mono">{formatTime(recordingTime)}</p>
            <p className="text-sm text-surface-500 mt-2">正在录音，点击结束</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center animate-fadeIn">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-6 h-6 text-brand-500 animate-spin" />
              <p className="text-lg font-semibold text-surface-700">AI 正在分析中...</p>
              <Sparkles className="w-6 h-6 text-brand-500 animate-spin" />
            </div>
            <p className="text-sm text-surface-500 mt-2">请稍候，正在解读 {currentPet?.name} 的情绪</p>
          </div>
        )}

        {showResult && (
          <GlassCard className="space-y-4 animate-scaleIn" glow>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center text-3xl shadow-lg`}>
                {config.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-lg font-bold ${config.textColor}`}>{config.label}</span>
                  <Badge variant="success" size="sm" dot>AI识别</Badge>
                </div>
                <p className="text-sm text-surface-500">置信度: <span className="font-bold text-surface-700">{confidence}%</span></p>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-brand-50 to-accent-50 rounded-2xl p-5 border border-brand-100">
              <div className="absolute -top-3 left-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-brand-50" />
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-xl shadow-md">
                  💬
                </div>
                <div className="flex-1">
                  <p className="text-lg text-surface-700 leading-relaxed font-medium">{translation}</p>
                  <div className="flex justify-end mt-2">
                    <span className="text-sm text-surface-500">— {currentPet?.name}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-2">
              <GradientButton 
                onClick={handleRetry}
                variant="secondary"
                size="md"
                icon={<RefreshCw className="w-5 h-5" />}
              >
                再录一次
              </GradientButton>
              <GradientButton 
                onClick={handleShare}
                variant="primary"
                size="md"
                icon={<Share2 className="w-5 h-5" />}
              >
                分享
              </GradientButton>
            </div>
          </GlassCard>
        )}

        <GlassCard className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 mx-auto flex items-center justify-center shadow-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-surface-800 mb-1">使用提示</h3>
            <p className="text-sm text-surface-500">请将麦克风靠近宠物，保持环境安静以获得更好的识别效果</p>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
