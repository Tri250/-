// ============================================
// PawSync Pro 3.0 - Voice Memory Wall Component
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 声音记忆墙 - 录制宠物声音、动态波形卡片
// ============================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Play, 
  Pause, 
  Square, 
  Heart, 
  Download,
  Trash2,
  Volume2,
  VolumeX,
  Settings,
  ChevronRight,
  MoreVertical,
  Check,
  X,
  Sparkles,
  Waves
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface VoiceMemory {
  id: string;
  type: 'meow' | 'bark' | 'purr' | 'chirp' | 'growl' | 'whine' | 'other';
  label?: string;
  url: string;
  duration: number;
  waveformData: number[];
  transcription?: string;
  translation?: string;
  emotion?: 'happy' | 'angry' | 'anxious' | 'hungry' | 'affectionate' | 'curious';
  timestamp: string;
  isUsedAsNotification: boolean;
}

export function VoiceMemoryWallComponent() {
  const { currentPet } = useAppStore();
  const [voices, setVoices] = useState<VoiceMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceMemory | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSound, setNotificationSound] = useState<string | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const petId = currentPet?.id || '1';
  const petName = currentPet?.name || '毛孩子';

  useEffect(() => {
    loadData();
  }, [petId]);

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const loadData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockVoices: VoiceMemory[] = [
        {
          id: 'voice-1',
          type: 'meow',
          label: '撒娇的叫声',
          url: '/audio/meow1.mp3',
          duration: 3.5,
          waveformData: [0.3, 0.5, 0.7, 0.4, 0.6, 0.8, 0.5, 0.3, 0.6, 0.4, 0.7, 0.5, 0.8, 0.6, 0.4],
          transcription: '喵~',
          translation: '我想要抱抱',
          emotion: 'affectionate',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          isUsedAsNotification: true
        },
        {
          id: 'voice-2',
          type: 'purr',
          label: '呼噜声',
          url: '/audio/purr1.mp3',
          duration: 8.2,
          waveformData: [0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.4, 0.5, 0.6, 0.5, 0.4, 0.5, 0.4, 0.3, 0.2],
          transcription: '呼噜呼噜',
          translation: '我很舒服，很满足',
          emotion: 'happy',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          isUsedAsNotification: false
        },
        {
          id: 'voice-3',
          type: 'meow',
          label: '饿了的声音',
          url: '/audio/meow2.mp3',
          duration: 2.8,
          waveformData: [0.5, 0.8, 0.6, 0.9, 0.7, 0.8, 0.5, 0.6, 0.7, 0.4, 0.5, 0.3],
          transcription: '喵！喵！',
          translation: '我饿了，快给我吃的！',
          emotion: 'hungry',
          timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
          isUsedAsNotification: false
        }
      ];

      setVoices(mockVoices);
      setNotificationSound(mockVoices.find(v => v.isUsedAsNotification)?.id || null);
    } catch (error) {
      console.error('Failed to load voice memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { emoji: string; label: string; color: string }> = {
      meow: { emoji: '🐱', label: '喵叫', color: 'text-orange-500' },
      bark: { emoji: '🐕', label: '犬吠', color: 'text-blue-500' },
      purr: { emoji: '💤', label: '呼噜', color: 'text-purple-500' },
      chirp: { emoji: '🐦', label: '鸟鸣', color: 'text-green-500' },
      growl: { emoji: '😾', label: '低吼', color: 'text-red-500' },
      whine: { emoji: '🥺', label: '呜咽', color: 'text-yellow-500' },
      other: { emoji: '🔊', label: '其他', color: 'text-gray-500' }
    };
    return configs[type] || configs.other;
  };

  const getEmotionConfig = (emotion?: string) => {
    if (!emotion) return null;
    const configs: Record<string, { emoji: string; label: string; color: string }> = {
      happy: { emoji: '😊', label: '开心', color: 'bg-yellow-100 text-yellow-700' },
      angry: { emoji: '😠', label: '生气', color: 'bg-red-100 text-red-700' },
      anxious: { emoji: '😰', label: '焦虑', color: 'bg-blue-100 text-blue-700' },
      hungry: { emoji: '🤤', label: '饥饿', color: 'bg-orange-100 text-orange-700' },
      affectionate: { emoji: '🥰', label: '撒娇', color: 'bg-pink-100 text-pink-700' },
      curious: { emoji: '🤔', label: '好奇', color: 'bg-indigo-100 text-indigo-700' }
    };
    return configs[emotion];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    
    // 模拟音频分析器
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    } catch (error) {
      console.error('Audio context not supported:', error);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    
    // 创建新的语音记忆
    const newVoice: VoiceMemory = {
      id: `voice-${Date.now()}`,
      type: 'meow',
      label: `录音 ${voices.length + 1}`,
      url: '/audio/new-recording.mp3',
      duration: recordingDuration,
      waveformData: generateRandomWaveform(),
      timestamp: new Date().toISOString(),
      isUsedAsNotification: false
    };
    
    setVoices(prev => [newVoice, ...prev]);
    setRecordingDuration(0);

    // 关闭音频上下文
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const generateRandomWaveform = () => {
    return Array.from({ length: 15 }, () => Math.random() * 0.6 + 0.2);
  };

  const handlePlay = (voice: VoiceMemory) => {
    if (playingId === voice.id) {
      setPlayingId(null);
    } else {
      setPlayingId(voice.id);
      // 模拟播放
      setTimeout(() => setPlayingId(null), voice.duration * 1000);
    }
  };

  const handleSetAsNotification = (voiceId: string) => {
    setVoices(prev => prev.map(v => ({
      ...v,
      isUsedAsNotification: v.id === voiceId
    })));
    setNotificationSound(voiceId);
  };

  const handleDelete = (voiceId: string) => {
    if (!confirm('确定要删除这条声音记忆吗？')) return;
    setVoices(prev => prev.filter(v => v.id !== voiceId));
    if (notificationSound === voiceId) {
      setNotificationSound(null);
    }
  };

  // 波形可视化组件
  const WaveformVisualizer = ({ 
    data, 
    isPlaying, 
    progress = 0 
  }: { 
    data: number[]; 
    isPlaying: boolean; 
    progress?: number;
  }) => {
    return (
      <div className="flex items-center justify-center gap-1 h-16">
        {data.map((height, index) => {
          const isPast = progress * data.length > index;
          return (
            <motion.div
              key={index}
              animate={{
                height: isPlaying ? [height * 40, height * 60, height * 40] : [height * 40, height * 50, height * 40],
              }}
              transition={{
                duration: 0.5 + Math.random() * 0.3,
                repeat: isPlaying ? Infinity : 0,
                delay: index * 0.02
              }}
              className={`w-1.5 rounded-full transition-colors ${
                isPast ? 'bg-gradient-to-t from-purple-500 to-pink-500' : 'bg-gray-300'
              }`}
              style={{ 
                height: `${height * 40}px`,
                minHeight: '8px'
              }}
            />
          );
        })}
      </div>
    );
  };

  // 录音动画
  const RecordingAnimation = () => (
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
      className="w-full h-full bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex flex-col items-center justify-center p-8"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-lg"
      >
        <Mic className="w-12 h-12 text-white" />
      </motion.div>

      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="flex items-center gap-2 mb-4"
      >
        <div className="w-3 h-3 bg-red-500 rounded-full" />
        <span className="text-red-600 font-medium">正在录音...</span>
      </motion.div>

      <p className="text-3xl font-bold text-gray-800 mb-6">
        {formatDuration(recordingDuration)}
      </p>

      {/* 实时波形 */}
      <div className="w-full max-w-md">
        <WaveformVisualizer 
          data={generateRandomWaveform()} 
          isPlaying={true} 
        />
      </div>

      <button
        onClick={handleStopRecording}
        className="mt-8 px-8 py-4 bg-white text-red-600 rounded-2xl font-medium hover:bg-red-50 transition-colors shadow-lg flex items-center gap-2"
      >
        <Square className="w-5 h-5" />
        停止录音
      </button>
    </motion.div>
  );

  // 播放动画
  const PlayAnimation = () => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setPlayingId(null)}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-8 max-w-md w-full text-center"
      >
        {selectedVoice && (
          <>
            <div className="text-6xl mb-4">
              {getTypeConfig(selectedVoice.type).emoji}
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {selectedVoice.label}
            </h3>

            {selectedVoice.transcription && (
              <p className="text-2xl text-purple-600 mb-2 font-medium">
                "{selectedVoice.transcription}"
              </p>
            )}

            {selectedVoice.translation && (
              <p className="text-gray-600 mb-4">
                翻译：{selectedVoice.translation}
              </p>
            )}

            {/* 波形可视化 */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <WaveformVisualizer 
                data={selectedVoice.waveformData}
                isPlaying={true}
                progress={0.5}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{formatDuration(0)}</span>
                <span>{formatDuration(selectedVoice.duration)}</span>
              </div>
            </div>

            {getEmotionConfig(selectedVoice.emotion) && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getEmotionConfig(selectedVoice.emotion)?.color}`}>
                <span>{getEmotionConfig(selectedVoice.emotion)?.emoji}</span>
                <span className="text-sm font-medium">{getEmotionConfig(selectedVoice.emotion)?.label}</span>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            🎵 {petName}的声音记忆墙
          </h1>
          <p className="text-sm text-gray-500">
            记录每一次独特的叫声
          </p>
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 录音按钮 */}
      {!isRecording ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartRecording}
          className="w-full py-6 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl shadow-lg flex items-center justify-center gap-3"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Mic className="w-6 h-6" />
          </motion.div>
          <span className="font-medium">开始录音</span>
        </motion.button>
      ) : (
        <RecordingAnimation />
      )}

      {/* 设置面板 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-purple-500" />
                APP提示音设置
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-2">
              {voices.map((voice) => (
                <div
                  key={voice.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                    notificationSound === voice.id 
                      ? 'bg-purple-50 border-2 border-purple-300' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeConfig(voice.type).emoji}</span>
                    <div>
                      <p className="font-medium text-gray-800">{voice.label}</p>
                      <p className="text-xs text-gray-500">{formatDuration(voice.duration)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {notificationSound === voice.id && (
                      <span className="text-xs text-purple-600 font-medium">已设为提示音</span>
                    )}
                    <button
                      onClick={() => handleSetAsNotification(voice.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        notificationSound === voice.id
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {notificationSound === voice.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 声音列表 */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Waves className="w-5 h-5 text-purple-500" />
          声音收藏 ({voices.length})
        </h2>

        {voices.map((voice, index) => {
          const config = getTypeConfig(voice.type);
          const emotionConfig = getEmotionConfig(voice.emotion);
          const isPlaying = playingId === voice.id;

          return (
            <motion.div
              key={voice.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* 类型图标 */}
                <div className={`text-3xl ${isPlaying ? 'animate-bounce' : ''}`}>
                  {config.emoji}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-800">{voice.label}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{config.label}</span>
                        <span>·</span>
                        <span>{formatTime(voice.timestamp)}</span>
                        <span>·</span>
                        <span>{formatDuration(voice.duration)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {voice.isUsedAsNotification && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs flex items-center gap-1">
                          <Volume2 className="w-3 h-3" />
                          提示音
                        </span>
                      )}
                      <button
                        onClick={() => setSelectedVoice(voice)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* 波形可视化 */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-2">
                    <WaveformVisualizer 
                      data={voice.waveformData} 
                      isPlaying={isPlaying}
                    />
                  </div>

                  {/* 翻译和情感 */}
                  <div className="flex items-center gap-2 mb-2">
                    {voice.transcription && (
                      <span className="text-sm text-purple-600 font-medium">
                        "{voice.transcription}"
                      </span>
                    )}
                    {voice.translation && (
                      <span className="text-sm text-gray-600">
                        → {voice.translation}
                      </span>
                    )}
                  </div>

                  {emotionConfig && (
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${emotionConfig.color}`}>
                      <span>{emotionConfig.emoji}</span>
                      <span>{emotionConfig.label}</span>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handlePlay(voice)}
                      className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                        isPlaying 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>播放中</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>播放</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSetAsNotification(voice.id)}
                      className={`p-2.5 rounded-xl transition-colors ${
                        voice.isUsedAsNotification
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title="设为APP提示音"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {}}
                      className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                      title="下载"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(voice.id)}
                      className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 空状态 */}
      {voices.length === 0 && !isRecording && (
        <div className="text-center py-12">
          <Mic className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">还没有声音记忆</p>
          <p className="text-sm text-gray-400">
            点击上方按钮录制{petName}的第一声叫声
          </p>
        </div>
      )}

      {/* 播放模态框 */}
      <AnimatePresence>
        {selectedVoice && (
          <PlayAnimation />
        )}
      </AnimatePresence>
    </div>
  );
}
