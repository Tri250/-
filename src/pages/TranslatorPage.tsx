import { useState, useRef } from 'react';
import { Mic, MicOff, Image, Share2, RefreshCw, Sparkles, Brain, Layers } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Badge, GlassCard, GradientButton } from '../components/UIEnhancements';
import { BrandLogo, BrandBadge } from '../components/Brand';
import { TechParticles } from '../components/TechEffects';

type EmotionType = 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';

const emotionConfig = {
  happy: { emoji: '😸', label: '开心', color: 'from-green-400 to-emerald-500', bgColor: 'bg-green-50', textColor: 'text-green-600', glowColor: 'shadow-green-400/50' },
  anxious: { emoji: '😰', label: '焦虑', color: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600', glowColor: 'shadow-yellow-400/50' },
  angry: { emoji: '😾', label: '生气', color: 'from-red-400 to-pink-500', bgColor: 'bg-red-50', textColor: 'text-red-600', glowColor: 'shadow-red-400/50' },
  needs: { emoji: '🥺', label: '有需求', color: 'from-blue-400 to-cyan-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600', glowColor: 'shadow-blue-400/50' },
  neutral: { emoji: '😐', label: '平静', color: 'from-slate-400 to-slate-500', bgColor: 'bg-slate-50', textColor: 'text-slate-600', glowColor: 'shadow-slate-400/50' },
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
    }, 2500);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pb-24 relative overflow-hidden">
      <TechParticles className="opacity-40" />
      
      <header className="sticky top-0 z-40 glass-effect border-b border-slate-200/50 backdrop-blur-2xl">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo size={48} />
            <div className="flex-1">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">AI 情感翻译机</h1>
              <p className="text-xs text-slate-500 font-semibold">深度解读 {currentPet?.name} 的内心世界</p>
            </div>
            <BrandBadge>专业版</BrandBadge>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6 relative z-10">
        <div className="flex justify-center gap-4 animate-fadeInUp">
          <button
            onClick={startRecording}
            disabled={isRecording || isAnalyzing}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all duration-500
              ${isRecording || isAnalyzing
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'gradient-brand text-white shadow-glow hover:shadow-glow-lg hover:scale-105 active:scale-95'}
            `}
          >
            <Mic className="w-5 h-5" />
            <span className="font-black">录音翻译</span>
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-xl shadow-blue-400/40 hover:shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95"
          >
            <Image className="w-5 h-5" />
            <span className="font-black">拍照分析</span>
          </button>
        </div>

        <div className="relative flex justify-center py-10 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="relative">
            {/* Outer ripple effect */}
            {isRecording && (
              <>
                <div className="absolute -inset-8 bg-gradient-to-br from-orange-400/20 to-cyan-400/20 rounded-full animate-ping" />
                <div className="absolute -inset-4 bg-gradient-to-br from-orange-400/20 to-cyan-400/20 rounded-full animate-pulse-soft" />
              </>
            )}
            
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzing}
              className={`
                relative w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-700 shadow-2xl
                ${isRecording
                  ? 'bg-gradient-to-br from-red-400 to-red-600 scale-110 shadow-xl shadow-red-400/50'
                  : isAnalyzing
                  ? 'bg-gradient-to-br from-slate-300 to-slate-400'
                  : 'bg-gradient-to-br from-orange-400 to-cyan-500 hover:scale-105 shadow-xl shadow-orange-400/50'}
              `}
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-16 h-16 text-white animate-spin" />
                  <div className="text-white font-black text-sm">AI 分析中...</div>
                </div>
              ) : isRecording ? (
                <div className="flex flex-col items-center gap-2">
                  <MicOff className="w-16 h-16 text-white" />
                  <div className="text-white font-black text-sm">点击结束</div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Mic className="w-16 h-16 text-white animate-bounce-soft" />
                  <div className="text-white font-black text-sm">开始录音</div>
                </div>
              )}
            </button>
          </div>
        </div>

        {isRecording && (
          <div className="text-center animate-fadeIn">
            <div className="inline-flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl px-6 py-3 rounded-full border border-slate-700/50 shadow-2xl">
              <div className="flex gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 rounded-full bg-gradient-to-br from-orange-400 to-cyan-400"
                    style={{
                      height: `${10 + Math.random() * 20}px`,
                      animation: `pulse 0.5s ease-in-out infinite ${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              <p className="text-3xl font-black text-white font-mono tracking-wider">{formatTime(recordingTime)}</p>
            </div>
            <p className="text-sm text-slate-500 mt-4 font-semibold">正在录音，请保持安静环境</p>
          </div>
        )}

        {isAnalyzing && (
          <GlassCard className="space-y-4 text-center animate-fadeInUp">
            <div className="flex items-center justify-center gap-3">
              <Brain className="w-7 h-7 text-orange-500 animate-spin-slow" />
              <Layers className="w-7 h-7 text-cyan-500 animate-bounce-soft" />
            </div>
            <p className="text-lg font-black text-slate-800">AI 深度分析中</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-semibold px-2">
                <span>分析进度</span>
                <span>78%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-cyan-500 rounded-full animate-shimmer" style={{ width: '78%' }} />
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium">正在运用深度神经网络分析声音特征...</p>
          </GlassCard>
        )}

        {showResult && (
          <GlassCard className="space-y-6 animate-scale-in" glow>
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${config.color} flex items-center justify-center text-4xl shadow-2xl ${config.glowColor} animate-bounce-soft`}>
                {config.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xl font-black ${config.textColor}`}>{config.label}</span>
                  <Badge variant="success" size="sm" dot>AI 识别</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-400 to-cyan-500 rounded-full shadow-inner transition-all duration-1500"
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-700">{confidence}%</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-semibold">置信度</p>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-orange-50 to-cyan-50 rounded-2xl p-5 border border-orange-100/50">
              <div className="absolute -top-3 left-8 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-orange-100" />
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-cyan-500 flex items-center justify-center shadow-xl">
                    <span className="text-2xl">{config.emoji}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-orange-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-lg text-slate-700 leading-relaxed font-medium">{translation}</p>
                  <div className="flex justify-end mt-3">
                    <span className="text-sm text-slate-500 font-semibold">— {currentPet?.name}</span>
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

        <GlassCard className="text-center space-y-4 pt-4 pb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 mx-auto flex items-center justify-center shadow-xl shadow-blue-400/40 animate-bounce-soft">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-slate-800 text-lg">使用提示</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">请将麦克风靠近宠物，保持安静环境以获得更好的识别效果</p>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
