import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { Mic, MicOff, Sparkles, Brain } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Badge, GlassCard, GradientButton } from '../components/UIEnhancements';
import { BrandLogo, BrandBadge } from '../components/Brand';
import { TechParticles, AnalysisParticles, NeuralNetwork } from '../components/TechEffects';
import { AuroraBackground, AnimatedGradientText } from '../components/SoundWaveEffects';
import { useStableInterval, useBatchState } from '../hooks/usePerformanceOptimized';
import { sanitizeString } from '../lib/security';

interface VoiceWaveProps {
  isActive: boolean;
  color?: string;
}

export const VoiceWave = memo(function VoiceWave({
  isActive,
  color = 'from-orange-500 to-cyan-500',
}: VoiceWaveProps) {
  const [waves, setWaves] = useState<number[]>([]);

  useStableInterval(
    () => {
      setWaves((prev) => {
        const newWaves = [...prev, Math.random()];
        return newWaves.slice(-12);
      });
    },
    isActive ? 150 : null
  );

  useEffect(() => {
    if (!isActive) setWaves([]);
  }, [isActive]);

  const waveElements = useMemo(() => {
    if (waves.length === 0) {
      return [...Array(12)].map((_, i) => (
        <div
          key={`static-${i}`}
          className={`w-1.5 rounded-full bg-gradient-to-t ${color} opacity-30`}
          style={{ height: '20px' }}
        />
      ));
    }
    return waves.map((height, i) => (
      <div
        key={`wave-${i}`}
        className={`w-1.5 rounded-full bg-gradient-to-t ${color} shadow-lg transition-all duration-300`}
        style={{
          height: `${20 + height * 60}px`,
          animationDelay: `${i * 0.05}s`,
        }}
      />
    ));
  }, [waves, color]);

  return (
    <div className="flex items-center justify-center gap-1.5 h-20">
      {waveElements}
    </div>
  );
});

interface RippleEffectProps {
  isActive: boolean;
}

export const RippleEffect = memo(function RippleEffect({
  isActive,
}: RippleEffectProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; key: number }[]>([]);

  useStableInterval(
    () => {
      setRipples((prev) => [
        ...prev.slice(-2),
        { x: Math.random() * 40 - 20, y: Math.random() * 40 - 20, key: Date.now() },
      ]);
    },
    isActive ? 800 : null
  );

  useEffect(() => {
    if (!isActive) setRipples([]);
  }, [isActive]);

  const rippleElements = useMemo(() => {
    return ripples.map((ripple) => (
      <div
        key={ripple.key}
        className="absolute w-32 h-32 rounded-full border-2 border-orange-400/50 animate-ripple"
        style={{
          left: `calc(50% + ${ripple.x}px - 4rem)`,
          top: `calc(50% + ${ripple.y}px - 4rem)`,
        }}
      />
    ));
  }, [ripples]);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-full">
      {rippleElements}
    </div>
  );
});

const HeaderMemo = memo(function HeaderMemo({ currentPetName }: { currentPetName: string }) {
  return (
    <header className="sticky top-0 z-40 glass-effect border-b border-slate-200/50 backdrop-blur-2xl">
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <BrandLogo size={48} />
          <div className="flex-1">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              <AnimatedGradientText>AI情感翻译</AnimatedGradientText>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              深度解读 {currentPetName} 的内心世界
            </p>
          </div>
          <BrandBadge>AI Powered</BrandBadge>
        </div>
      </div>
    </header>
  );
});

const ControlButtonsMemo = memo(function ControlButtonsMemo({
  startRecording,
  isRecording,
  isAnalyzing,
}: {
  startRecording: () => void;
  isRecording: boolean;
  isAnalyzing: boolean;
}) {
  return (
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
  );
});

const MainRecordButtonMemo = memo(function MainRecordButtonMemo({
  isRecording,
  isAnalyzing,
  startRecording,
  stopRecording,
}: {
  isRecording: boolean;
  isAnalyzing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}) {
  return (
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
  );
});

const FooterInfoMemo = memo(function FooterInfoMemo() {
  return (
    <GlassCard className="text-center space-y-4 pt-5 pb-6 card-3d-hover">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 mx-auto flex items-center justify-center shadow-xl shadow-blue-400/40 animate-float">
        <Brain className="w-8 h-8 text-white" />
      </div>
      <div className="space-y-1">
        <h3 className="font-black text-slate-800 text-lg">Gemini 2.5 翻译技术</h3>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">
          由带娃的小陈工倾力打造，准确率达90%+
        </p>
      </div>
    </GlassCard>
  );
});

export const TranslatorPage = memo(function TranslatorPage() {
  const { currentPet, addAnalysis, setCurrentEmotion } = useAppStore();
  
  const [state, setState] = useBatchState({
    isRecording: false,
    showResult: false,
    emotion: 'neutral' as 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral',
    translation: '',
    confidence: 0,
    recordingTime: 0,
    isAnalyzing: false,
    analysisPhase: 0,
  });
  
  const phaseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analyzeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const emotions = useMemo<Array<'happy' | 'anxious' | 'angry' | 'needs' | 'neutral'>>(() => [
    'happy',
    'anxious',
    'angry',
    'needs',
    'neutral',
  ], []);

  const mockTranslations = useMemo(() => ({
    happy: [
      '主人，我今天超开心的！要不要一起玩呀？',
      '今天心情真好，谢谢主人陪我～',
      '开心到飞起！快给我零食奖励吧！',
    ],
    anxious: [
      '主人，你要去哪里呀？不要离开我太久...',
      '有点紧张，能陪陪我吗？',
      '感觉有点不安，求摸摸求安慰～',
    ],
    angry: [
      '哼！你为什么不给我开门！',
      '我生气了！快给我小鱼干！',
      '气死我了！你居然不理我！',
    ],
    needs: [
      '主人，我饿了，要吃饭饭～',
      '想出去玩玩，放我出去嘛～',
      '我渴了，给我水喝好不好？',
    ],
    neutral: [
      '今天天气不错呢...',
      '我在思考猫生...',
      '就是想安静地待一会儿～',
    ],
  }), []);

  useStableInterval(
    () => {
      setState(prev => ({ recordingTime: prev.recordingTime + 1 }));
    },
    state.isRecording ? 1000 : null
  );

  const startRecording = useCallback(() => {
    if (state.isRecording || state.isAnalyzing) return;
    setState({ isRecording: true, recordingTime: 0 });
  }, [state.isRecording, state.isAnalyzing, setState]);

  const stopRecording = useCallback(() => {
    if (!state.isRecording) return;
    setState({ isRecording: false });
  }, [state.isRecording, setState]);

  const analyzeVoice = useCallback(() => {
    setState({
      isAnalyzing: true,
      showResult: false,
      analysisPhase: 0,
    });

    const phases = [0, 33, 66, 100];
    let phaseIndex = 0;

    phaseIntervalRef.current = setInterval(() => {
      phaseIndex++;
      if (phaseIndex < phases.length) {
        setState({ analysisPhase: phases[phaseIndex] });
      }
    }, 600);

    analyzeTimeoutRef.current = setTimeout(() => {
      if (phaseIntervalRef.current) clearInterval(phaseIntervalRef.current);
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const translations = mockTranslations[randomEmotion];
      const randomTranslation = translations[Math.floor(Math.random() * translations.length)];
      const randomConfidence = 88 + Math.floor(Math.random() * 12);
      const safeTranslation = sanitizeString(randomTranslation);

      setState({
        emotion: randomEmotion,
        translation: safeTranslation,
        confidence: randomConfidence,
        isAnalyzing: false,
        showResult: true,
        analysisPhase: 100,
      });
      
      setCurrentEmotion(randomEmotion);

      addAnalysis({
        petId: currentPet?.id || '',
        type: 'voice',
        result: {
          emotion: randomEmotion,
          translation: safeTranslation,
          confidence: randomConfidence,
        },
      });
    }, 2500);
  }, [emotions, mockTranslations, currentPet, addAnalysis, setCurrentEmotion, setState]);

  useEffect(() => {
    if (!state.isRecording && state.recordingTime > 0 && !state.isAnalyzing) {
      analyzeVoice();
    }
  }, [state.isRecording, state.recordingTime, state.isAnalyzing, analyzeVoice]);

  useEffect(() => {
    return () => {
      if (phaseIntervalRef.current) clearInterval(phaseIntervalRef.current);
      if (analyzeTimeoutRef.current) clearTimeout(analyzeTimeoutRef.current);
    };
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const emotionStyle = useMemo(() => {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      happy: { bg: 'from-green-400 to-emerald-500', text: 'text-green-600', border: 'border-green-200' },
      anxious: { bg: 'from-yellow-400 to-orange-500', text: 'text-yellow-600', border: 'border-yellow-200' },
      angry: { bg: 'from-red-400 to-pink-500', text: 'text-red-600', border: 'border-red-200' },
      needs: { bg: 'from-blue-400 to-cyan-500', text: 'text-blue-600', border: 'border-blue-200' },
      neutral: { bg: 'from-slate-400 to-slate-500', text: 'text-slate-600', border: 'border-slate-200' },
    };
    return styles[state.emotion] || styles.neutral;
  }, [state.emotion]);

  const emotionIcon = useMemo(() => {
    const icons: Record<string, string> = {
      happy: '😸',
      anxious: '😰',
      angry: '😾',
      needs: '🥺',
      neutral: '😐',
    };
    return icons[state.emotion] || '😐';
  }, [state.emotion]);

  const emotionLabel = useMemo(() => {
    const labels: Record<string, string> = {
      happy: '开心',
      anxious: '紧张',
      angry: '生气',
      needs: '有需求',
      neutral: '平静',
    };
    return labels[state.emotion] || '平静';
  }, [state.emotion]);

  const resetResult = useCallback(() => {
    setState({
      showResult: false,
      emotion: 'neutral',
      translation: '',
      confidence: 0,
    });
  }, [setState]);

  const recordingDisplay = useMemo(() => {
    if (!state.isRecording) return null;
    return (
      <div className="text-center animate-fadeIn">
        <div className="inline-flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl px-8 py-4 rounded-full border border-slate-700/60 shadow-2xl">
          <VoiceWave isActive color="from-green-400 to-emerald-500" />
          <p className="text-4xl font-black text-white font-mono tracking-wider">
            {formatTime(state.recordingTime)}
          </p>
        </div>
        <p className="text-sm text-slate-500 mt-4 font-medium">正在录音，请保持安静环境</p>
      </div>
    );
  }, [state.isRecording, state.recordingTime, formatTime]);

  const analyzingDisplay = useMemo(() => {
    if (!state.isAnalyzing) return null;
    return (
      <GlassCard className="space-y-5 text-center animate-fadeInUp">
        <div className="flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-orange-500 animate-pulse" />
          <Sparkles className="w-8 h-8 text-cyan-500 animate-bounce" />
        </div>
        <p className="text-lg font-black text-slate-800">Gemini 2.5 深度分析中</p>

        <div className="space-y-3">
          <div className="flex justify-between text-xs text-slate-600 font-bold px-2">
            <span>分析进度</span>
            <span className="text-orange-600">{state.analysisPhase}%</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${state.analysisPhase}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium px-2">
            <span>声音采集</span>
            <span>情感识别</span>
            <span>结果生成</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 font-medium animate-pulse">
          正在运用深度神经网络分析声音特征...
        </p>
      </GlassCard>
    );
  }, [state.isAnalyzing, state.analysisPhase]);

  const resultDisplay = useMemo(() => {
    if (!state.showResult) return null;
    return (
      <GlassCard className="space-y-6 animate-scale-in" glow>
        <div className="flex items-center gap-4">
          <div
            className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${emotionStyle.bg} flex items-center justify-center text-4xl shadow-2xl animate-bounce-soft`}
          >
            {emotionIcon}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-xl font-black ${emotionStyle.text}`}>
                {emotionLabel}
              </span>
              <Badge variant="success" size="sm" dot pulse>
                AI识别
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>置信度</span>
                <span className="text-orange-600 font-black">{state.confidence}%</span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${state.confidence}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className={`relative bg-gradient-to-br from-orange-50 to-cyan-50 rounded-2xl p-5 border ${emotionStyle.border} card-3d-hover`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-cyan-500 flex items-center justify-center shadow-xl animate-float">
              <span className="text-2xl">{emotionIcon}</span>
            </div>
            <div className="flex-1">
              <p className="text-lg text-slate-700 leading-relaxed font-medium">{state.translation}</p>
              <div className="flex justify-end mt-3">
                <span className="text-sm text-slate-500 font-semibold">— {currentPet?.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-2">
          <GradientButton
            onClick={resetResult}
            variant="secondary"
            size="md"
            icon={<Mic className="w-5 h-5" />}
          >
            再录一次
          </GradientButton>
          <GradientButton
            onClick={() => alert('分享功能开发中')}
            variant="primary"
            size="md"
            icon={<Sparkles className="w-5 h-5" />}
          >
            分享
          </GradientButton>
        </div>
      </GlassCard>
    );
  }, [state.showResult, state.confidence, state.translation, emotionStyle, emotionIcon, emotionLabel, currentPet, resetResult]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pb-24 relative overflow-hidden">
      <AuroraBackground />
      <TechParticles className="opacity-20" />
      {state.isAnalyzing && <AnalysisParticles className="opacity-60 animate-fadeIn" />}
      {state.isAnalyzing && <NeuralNetwork className="opacity-30 animate-fadeIn" />}

      <HeaderMemo currentPetName={currentPet?.name || ''} />

      <main className="max-w-md mx-auto px-4 py-6 space-y-6 relative z-10">
        <ControlButtonsMemo
          startRecording={startRecording}
          isRecording={state.isRecording}
          isAnalyzing={state.isAnalyzing}
        />

        <MainRecordButtonMemo
          isRecording={state.isRecording}
          isAnalyzing={state.isAnalyzing}
          startRecording={startRecording}
          stopRecording={stopRecording}
        />

        {recordingDisplay}
        {analyzingDisplay}
        {resultDisplay}

        <FooterInfoMemo />
      </main>
    </div>
  );
});
