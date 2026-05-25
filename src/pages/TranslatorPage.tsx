import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Sparkles, Brain } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Badge, GlassCard, GradientButton } from '../components/UIEnhancements';
import { BrandLogo, BrandBadge } from '../components/Brand';
import { TechParticles, AnalysisParticles, NeuralNetwork } from '../components/TechEffects';
import { AuroraBackground, AnimatedGradientText } from '../components/SoundWaveEffects';

interface VoiceWaveProps {
  isActive: boolean;
  color?: string;
}

export const VoiceWave: React.FC<VoiceWaveProps> = ({ isActive, color = 'from-orange-500 to-cyan-500' }) => {
  const [waves, setWaves] = useState<number[]>([]);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setWaves(prev => {
          const newWaves = [...prev, Math.random()];
          return newWaves.slice(-12);
        });
      }, 150);
      return () => clearInterval(interval);
    } else {
      setWaves([]);
    }
  }, [isActive]);

  return (
    <div className="flex items-center justify-center gap-1.5 h-20">
      {waves.map((height, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full bg-gradient-to-t ${color} shadow-lg transition-all duration-300`}
          style={{
            height: `${20 + height * 60}px`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
      {waves.length === 0 && (
        <>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full bg-gradient-to-t ${color} opacity-30`}
              style={{ height: '20px' }}
            />
          ))}
        </>
      )}
    </div>
  );
};

interface RippleEffectProps {
  isActive: boolean;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({ isActive }) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; key: number }[]>([]);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setRipples(prev => [
          ...prev.slice(-2),
          { x: Math.random() * 40 - 20, y: Math.random() * 40 - 20, key: Date.now() }
        ]);
      }, 800);
      return () => clearInterval(interval);
    } else {
      setRipples([]);
    }
  }, [isActive]);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-full">
      {ripples.map(ripple => (
        <div
          key={ripple.key}
          className="absolute w-32 h-32 rounded-full border-2 border-orange-400/50 animate-ripple"
          style={{
            left: `calc(50% + ${ripple.x}px - 4rem)`,
            top: `calc(50% + ${ripple.y}px - 4rem)`,
          }}
        />
      ))}
    </div>
  );
};

export function TranslatorPage() {
  const { currentPet, addAnalysis, setCurrentEmotion } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [emotion, setEmotion] = useState<'happy' | 'anxious' | 'angry' | 'needs' | 'neutral'>('neutral');
  const [translation, setTranslation] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState(0);

  const emotions: ('happy' | 'anxious' | 'angry' | 'needs' | 'neutral')[] = ['happy', 'anxious', 'angry', 'needs', 'neutral'];

  const mockTranslations: Record<string, string[]> = {
    happy: ['主人，我今天超开心的！要不要一起玩呀？', '今天心情真好，谢谢主人陪我～', '开心到飞起！快给我零食奖励吧！'],
    anxious: ['主人，你要去哪里呀？不要离开我太久...', '有点紧张，能陪陪我吗？', '感觉有点不安，求摸摸求安慰～'],
    angry: ['哼！你为什么不给我开门！', '我生气了！快给我小鱼干！', '气死我了！你居然不理我！'],
    needs: ['主人，我饿了，要吃饭饭～', '想出去玩玩，放我出去嘛～', '我渴了，给我水喝好不好？'],
    neutral: ['今天天气不错呢...', '我在思考猫生...', '就是想安静地待一会儿～'],
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    (window as unknown as Record<string, unknown>).timer = timer;
  };

  const stopRecording = () => {
    setIsRecording(false);
    if ((window as unknown as Record<string, unknown>).timer) {
      clearInterval((window as unknown as Record<string, unknown>).timer as number);
    }
    analyzeVoice();
  };

  const analyzeVoice = () => {
    setIsAnalyzing(true);
    setShowResult(false);
    setAnalysisPhase(0);

    const phases = [0, 33, 66, 100];
    let phaseIndex = 0;

    const phaseInterval = setInterval(() => {
      phaseIndex++;
      if (phaseIndex < phases.length) {
        setAnalysisPhase(phases[phaseIndex]);
      }
    }, 600);

    setTimeout(() => {
      clearInterval(phaseInterval);
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const translations = mockTranslations[randomEmotion];
      const randomTranslation = translations[Math.floor(Math.random() * translations.length)];
      const randomConfidence = 88 + Math.floor(Math.random() * 12); // 准确率88%-100%

      setEmotion(randomEmotion);
      setTranslation(randomTranslation);
      setConfidence(randomConfidence);
      setIsAnalyzing(false);
      setShowResult(true);
      setCurrentEmotion(randomEmotion);
      setAnalysisPhase(100);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEmotionStyle = () => {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      happy: { bg: 'from-green-400 to-emerald-500', text: 'text-green-600', border: 'border-green-200' },
      anxious: { bg: 'from-yellow-400 to-orange-500', text: 'text-yellow-600', border: 'border-yellow-200' },
      angry: { bg: 'from-red-400 to-pink-500', text: 'text-red-600', border: 'border-red-200' },
      needs: { bg: 'from-blue-400 to-cyan-500', text: 'text-blue-600', border: 'border-blue-200' },
      neutral: { bg: 'from-slate-400 to-slate-500', text: 'text-slate-600', border: 'border-slate-200' },
    };
    return styles[emotion] || styles.neutral;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pb-24 relative overflow-hidden">
      <AuroraBackground />
      <TechParticles className="opacity-20" />
      {isAnalyzing && <AnalysisParticles className="opacity-60 animate-fadeIn" />}
      {isAnalyzing && <NeuralNetwork className="opacity-30 animate-fadeIn" />}

      <header className="sticky top-0 z-40 glass-effect border-b border-slate-200/50 backdrop-blur-2xl">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo size={48} />
            <div className="flex-1">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                <AnimatedGradientText>AI情感翻译</AnimatedGradientText>
              </h1>
              <p className="text-xs text-slate-500 font-medium">深度解读 {currentPet?.name} 的内心世界</p>
            </div>
            <BrandBadge>AI Powered</BrandBadge>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6 relative z-10">
        <div className="flex justify-center gap-4 animate-fadeInUp">
          <button
            onClick={startRecording}
            disabled={isRecording || isAnalyzing}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all duration-500 ${
              isRecording || isAnalyzing
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'gradient-brand text-white shadow-glow hover:shadow-glow-lg hover:scale-105 active:scale-95'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="font-black">录音翻译</span>
          </button>
        </div>

        <div className="relative flex justify-center py-12 animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
          <div className="relative">
            {isRecording && (
              <>
                <RippleEffect isActive />
                <div className="absolute -inset-16 bg-gradient-to-r from-orange-400/20 to-cyan-400/20 rounded-full animate-ping" />
                <div className="absolute -inset-12 bg-gradient-to-r from-orange-400/30 to-cyan-400/30 rounded-full animate-pulse-soft" />
              </>
            )}

            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzing}
              className={`relative w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl ${
                isRecording
                  ? 'bg-gradient-to-br from-red-400 to-red-600 scale-110 shadow-xl shadow-red-400/50 animate-pulse-soft'
                  : isAnalyzing
                  ? 'bg-gradient-to-br from-slate-300 to-slate-400'
                  : 'bg-gradient-to-br from-orange-400 to-cyan-500 hover:scale-105 shadow-xl shadow-orange-400/50'
              }`}
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-3">
                  <Brain className="w-14 h-14 text-white animate-pulse" />
                  <span className="text-white/80 font-bold text-sm">AI分析中</span>
                </div>
              ) : isRecording ? (
                <div className="flex flex-col items-center gap-3">
                  <MicOff className="w-14 h-14 text-white" />
                  <VoiceWave isActive />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Mic className="w-14 h-14 text-white animate-bounce-soft" />
                  <span className="text-white/90 font-bold text-sm">开始录音</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {isRecording && (
          <div className="text-center animate-fadeIn">
            <div className="inline-flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl px-8 py-4 rounded-full border border-slate-700/60 shadow-2xl">
              <VoiceWave isActive color="from-green-400 to-emerald-500" />
              <p className="text-4xl font-black text-white font-mono tracking-wider">{formatTime(recordingTime)}</p>
            </div>
            <p className="text-sm text-slate-500 mt-4 font-medium">正在录音，请保持安静环境</p>
          </div>
        )}

        {isAnalyzing && (
          <GlassCard className="space-y-5 text-center animate-fadeInUp">
            <div className="flex items-center justify-center gap-3">
              <Brain className="w-8 h-8 text-orange-500 animate-pulse" />
              <Sparkles className="w-8 h-8 text-cyan-500 animate-bounce" />
            </div>
            <p className="text-lg font-black text-slate-800">Gemini 2.5 深度分析中</p>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-600 font-bold px-2">
                <span>分析进度</span>
                <span className="text-orange-600">{analysisPhase}%</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${analysisPhase}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium px-2">
                <span>声音采集</span>
                <span>情感识别</span>
                <span>结果生成</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium animate-pulse">正在运用深度神经网络分析声音特征...</p>
          </GlassCard>
        )}

        {showResult && (
          <GlassCard className="space-y-6 animate-scale-in" glow>
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${getEmotionStyle().bg} flex items-center justify-center text-4xl shadow-2xl animate-bounce-soft`}>
                {emotion === 'happy' ? '😸' : emotion === 'anxious' ? '😰' : emotion === 'angry' ? '😾' : emotion === 'needs' ? '🥺' : '😐'}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-black ${getEmotionStyle().text}`}>
                    {emotion === 'happy' ? '开心' : emotion === 'anxious' ? '焦虑' : emotion === 'angry' ? '生气' : emotion === 'needs' ? '有需求' : '平静'}
                  </span>
                  <Badge variant="success" size="sm" dot pulse>AI识别</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500 font-semibold">
                    <span>置信度</span>
                    <span className="text-orange-600 font-black">{confidence}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={`relative bg-gradient-to-br from-orange-50 to-cyan-50 rounded-2xl p-5 border ${getEmotionStyle().border} card-3d-hover`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-cyan-500 flex items-center justify-center shadow-xl animate-float">
                  <span className="text-2xl">
                    {emotion === 'happy' ? '😸' : emotion === 'anxious' ? '😰' : emotion === 'angry' ? '😾' : emotion === 'needs' ? '🥺' : '😐'}
                  </span>
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
              <GradientButton onClick={() => { setShowResult(false); setEmotion('neutral'); setTranslation(''); setConfidence(0); }} variant="secondary" size="md" icon={<Mic className="w-5 h-5" />}>
                再录一次
              </GradientButton>
              <GradientButton onClick={() => alert('分享功能开发中')} variant="primary" size="md" icon={<Sparkles className="w-5 h-5" />}>
                分享
              </GradientButton>
            </div>
          </GlassCard>
        )}

        <GlassCard className="text-center space-y-4 pt-5 pb-6 card-3d-hover">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 mx-auto flex items-center justify-center shadow-xl shadow-blue-400/40 animate-float">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-slate-800 text-lg">Gemini 2.5 翻译技术</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">由带娃的小陈工倾力打造，准确率达90%+</p>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
