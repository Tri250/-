import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Languages, ChevronRight, Sparkles } from 'lucide-react';
import { Card } from '../components/DesignSystem/Card';
import { Button } from '../components/DesignSystem/Button';

interface Translation {
  id: string;
  originalText: string;
  translatedText: string;
  confidence: number;
  timestamp: number;
  emotion: 'happy' | 'sad' | 'hungry' | 'playful' | 'anxious' | 'excited';
}

const TRANSLATIONS_MAP: Record<string, { text: string; emotion: Translation['emotion'] }> = {
  '喵~': { text: '主人，我好想你呀！今天过得怎么样？', emotion: 'happy' },
  '汪汪！': { text: '太好啦！见到你真开心！快带我出去玩吧！', emotion: 'excited' },
  '咕噜咕噜': { text: '好舒服呀~继续摸摸我吧~', emotion: 'happy' },
  '呜...': { text: '我有点难过，能陪陪我吗？', emotion: 'sad' },
  '汪！汪！': { text: '有陌生人来了！要提高警惕！', emotion: 'anxious' },
  '喵喵喵': { text: '我饿了！快给我准备晚餐吧！', emotion: 'hungry' },
  '嘿嘿嘿': { text: '来和我玩呀！我精力充沛！', emotion: 'playful' },
};

const EMOTION_COLORS: Record<Translation['emotion'], string> = {
  happy: 'from-yellow-400 to-orange-500',
  sad: 'from-blue-400 to-blue-500',
  hungry: 'from-red-400 to-red-500',
  playful: 'from-green-400 to-green-500',
  anxious: 'from-purple-400 to-purple-500',
  excited: 'from-pink-400 to-pink-500',
};

const EMOTION_LABELS: Record<Translation['emotion'], string> = {
  happy: '开心',
  sad: '难过',
  hungry: '饥饿',
  playful: '想玩',
  anxious: '警惕',
  excited: '兴奋',
};

const MOCK_HISTORY: Translation[] = [
  {
    id: 'trans-1',
    originalText: '喵~',
    translatedText: '主人，我好想你呀！今天过得怎么样？',
    confidence: 92,
    timestamp: Date.now() - 3600000,
    emotion: 'happy',
  },
  {
    id: 'trans-2',
    originalText: '汪汪！',
    translatedText: '太好啦！见到你真开心！快带我出去玩吧！',
    confidence: 88,
    timestamp: Date.now() - 7200000,
    emotion: 'excited',
  },
  {
    id: 'trans-3',
    originalText: '咕噜咕噜',
    translatedText: '好舒服呀~继续摸摸我吧~',
    confidence: 95,
    timestamp: Date.now() - 86400000,
    emotion: 'happy',
  },
];

export const TranslatorPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null);
  const [history] = useState<Translation[]>(MOCK_HISTORY);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setCurrentTranslation(null);
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Simulate translation
    const samples = Object.keys(TRANSLATIONS_MAP);
    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    const result = TRANSLATIONS_MAP[randomSample];
    setCurrentTranslation({
      id: `trans-${Date.now()}`,
      originalText: randomSample,
      translatedText: result.text,
      confidence: Math.floor(Math.random() * 10) + 85,
      timestamp: Date.now(),
      emotion: result.emotion,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-peach-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 pt-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800">宠物翻译器</h1>
          <p className="text-sm text-gray-500">聆听小橘的心声</p>
        </div>

        <Card className="p-8 mb-6 text-center">
          <div className="mb-6">
            <div className="text-5xl font-bold text-gray-800 font-mono">
              {formatTime(recordingTime)}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {isRecording ? '正在聆听...' : '点击按钮开始录音'}
            </p>
          </div>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all transform ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-200'
                : 'bg-gradient-to-br from-orange-400 to-peach-500 hover:scale-105 shadow-lg shadow-orange-200'
            }`}
          >
            {isRecording ? (
              <MicOff className="w-10 h-10 text-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>

          <p className="text-xs text-gray-400 mt-4">
            {isRecording ? '再次点击停止录音' : '最长录音 30 秒'}
          </p>
        </Card>

        {currentTranslation && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <h2 className="font-semibold text-gray-800">翻译结果</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-orange-50 to-peach-50 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">小橘说</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${EMOTION_COLORS[currentTranslation.emotion]}`}>
                    {EMOTION_LABELS[currentTranslation.emotion]}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-2">
                  {currentTranslation.originalText}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Volume2 className="w-3 h-3" />
                  <span>置信度 {currentTranslation.confidence}%</span>
                </div>
              </div>
              <div className="flex justify-center">
                <ChevronRight className="w-5 h-5 text-gray-400 rotate-90" />
              </div>
              <div className="p-4 bg-white border-2 border-orange-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-gray-500">翻译</span>
                </div>
                <p className="text-base text-gray-800">
                  {currentTranslation.translatedText}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">翻译历史</h2>
        </div>
        <div className="space-y-3">
          {history.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${EMOTION_COLORS[item.emotion]} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}
                >
                  {item.emotion === 'happy' ? '😊' : item.emotion === 'sad' ? '😢' : item.emotion === 'hungry' ? '🍽️' : item.emotion === 'playful' ? '🎾' : item.emotion === 'anxious' ? '😰' : '🎉'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{item.originalText}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      {EMOTION_LABELS[item.emotion]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{item.translatedText}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.timestamp).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
