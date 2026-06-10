// ============================================
// PawSync Pro 3.0 - Voice Memory Wall Component
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 声音记忆墙 - 录制宠物声音、动态波形卡片
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Play, 
  Pause, 
  Square, 
  Download,
  Trash2,
  Volume2,
  Settings,
  MoreVertical,
  Check,
  X,
  Waves,
  Share2,
  Edit3,
  Save,
  AlertCircle,
  Brain
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useVoices, IntentionResult, VoiceProfileAnalysis } from '../../hooks/useVoices';
import type { VoiceMemory } from '../../types/bond';

export function VoiceMemoryWallComponent() {
  const { currentPet } = useAppStore();
  
  // 使用 useVoices Hook 管理声音数据
  const {
    voices,
    loading,
    error,
    loadVoices,
    uploadVoice,
    analyzeVoice,
    deleteVoice,
    setAsNotification,
  } = useVoices();
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceMemory | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSound, setNotificationSound] = useState<string | null>(null);
  const [editingVoice, setEditingVoice] = useState<VoiceMemory | null>(null);
  const [editLabel, setEditLabel] = useState('');
  
  // 意图识别结果
  const [lastIntentionResult, setLastIntentionResult] = useState<IntentionResult | null>(null);
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  
  // 声音画像分析
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfileAnalysis | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // 录音相关
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // 播放相关
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  
  // 波形可视化
  const [liveWaveform, setLiveWaveform] = useState<number[]>([]);
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const petId = currentPet?.id || '1';
  const petName = currentPet?.name || '毛孩子';

  // 加载声音数据
  useEffect(() => {
    if (petId) {
      loadVoices(petId);
    }
    return () => {
      // 清理资源
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopRecording();
    };
  }, [petId, loadVoices]);

  // 设置通知音
  useEffect(() => {
    const notificationVoice = voices.find(v => v.isUsedAsNotification);
    setNotificationSound(notificationVoice?.id || null);
  }, [voices]);

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

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // 设置音频分析器
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // 创建 MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // 开始实时波形更新
      startWaveformVisualization();
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  }, []);

  // 实时波形可视化
  const startWaveformVisualization = useCallback(() => {
    waveformIntervalRef.current = setInterval(() => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // 采样 15 个点用于显示
        const step = Math.floor(dataArray.length / 15);
        const waveform: number[] = [];
        for (let i = 0; i < 15; i++) {
          const value = dataArray[i * step] / 255;
          waveform.push(Math.max(0.1, value));
        }
        setLiveWaveform(waveform);
      }
    }, 50);
  }, []);

  // 停止录音并上传
  const stopRecording = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
          });
          
          // 上传到后端并获取意图识别结果
          try {
            const intentionResult = await uploadVoice(audioBlob, petId);
            setLastIntentionResult(intentionResult);
            setShowIntentionModal(true);
          } catch (err) {
            console.error('上传声音失败:', err);
            alert('上传声音失败，请稍后重试');
          }
          
          // 清理
          cleanupRecording();
          resolve();
        };
        
        mediaRecorderRef.current.stop();
      } else {
        cleanupRecording();
        resolve();
      }
    });
  }, [uploadVoice, petId]);

  const cleanupRecording = () => {
    setIsRecording(false);
    setRecordingDuration(0);
    setLiveWaveform([]);
    
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  };

  const generateRandomWaveform = () => {
    return Array.from({ length: 15 }, () => Math.random() * 0.6 + 0.2);
  };

  // 播放音频
  const handlePlay = useCallback((voice: VoiceMemory) => {
    if (playingId === voice.id) {
      // 暂停
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
    } else {
      // 停止之前的播放
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // 创建新的音频
      const audio = new Audio(voice.url);
      audioRef.current = audio;
      
      audio.onloadedmetadata = () => {
        audio.play();
        setPlayingId(voice.id);
        setPlayProgress(0);
      };
      
      audio.ontimeupdate = () => {
        setPlayProgress(audio.currentTime / audio.duration);
      };
      
      audio.onended = () => {
        setPlayingId(null);
        setPlayProgress(0);
      };
      
      audio.onerror = () => {
        console.error('Failed to play audio');
        setPlayingId(null);
      };
    }
  }, [playingId]);

  // 下载音频
  const handleDownload = useCallback((voice: VoiceMemory) => {
    if (voice.url && !voice.url.startsWith('/audio/')) {
      const a = document.createElement('a');
      a.href = voice.url;
      a.download = `${voice.label || '录音'}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert('音频不可下载');
    }
  }, []);

  // 分享音频
  const handleShare = useCallback(async (voice: VoiceMemory) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: voice.label || '宠物声音',
          text: `听听${petName}的声音！`,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      alert('您的浏览器不支持分享功能');
    }
  }, [petName]);

  // 设置为通知音
  const handleSetAsNotification = async (voiceId: string) => {
    try {
      await setAsNotification(voiceId);
    } catch (err) {
      console.error('设置通知音失败:', err);
    }
  };

  // 删除声音
  const handleDelete = async (voiceId: string) => {
    if (!confirm('确定要删除这条声音记忆吗？')) return;
    
    try {
      await deleteVoice(voiceId);
      if (notificationSound === voiceId) {
        setNotificationSound(null);
      }
    } catch (err) {
      console.error('删除声音失败:', err);
      alert('删除失败，请稍后重试');
    }
  };

  // 分析声音（获取声音画像）
  const handleAnalyze = async (voiceId: string) => {
    try {
      const result = await analyzeVoice(voiceId);
      if (result.profile) {
        setVoiceProfile(result.profile);
        setShowProfileModal(true);
      }
    } catch (err) {
      console.error('分析声音失败:', err);
      alert('分析失败，请稍后重试');
    }
  };

  // 编辑标签
  const handleStartEdit = (voice: VoiceMemory) => {
    setEditingVoice(voice);
    setEditLabel(voice.label || '');
  };

  const handleSaveEdit = () => {
    // TODO: 调用 API 更新标签
    if (editingVoice) {
      setEditingVoice(null);
      setEditLabel('');
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
      animate={{ scale: [1, 1.02, 1] }}
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
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="text-red-600 font-medium">正在录音...</span>
      </motion.div>

      <p className="text-3xl font-bold text-gray-800 mb-6">
        {formatDuration(recordingDuration)}
      </p>

      {/* 实时波形 */}
      <div className="w-full max-w-md">
        <WaveformVisualizer 
          data={liveWaveform.length > 0 ? liveWaveform : generateRandomWaveform()} 
          isPlaying={true} 
        />
      </div>

      <button
        onClick={() => stopRecording()}
        className="mt-8 px-8 py-4 bg-white text-red-600 rounded-2xl font-medium hover:bg-red-50 transition-colors shadow-lg flex items-center gap-2"
      >
        <Square className="w-5 h-5" />
        停止录音
      </button>
    </motion.div>
  );

  // 意图识别结果模态框
  const IntentionModal = () => (
    <AnimatePresence>
      {showIntentionModal && lastIntentionResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowIntentionModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                AI 意图识别结果
              </h3>
              <button
                onClick={() => setShowIntentionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 意图 */}
            <div className="mb-4 p-4 bg-purple-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">识别意图</p>
              <p className="text-lg text-purple-600 font-medium">
                {lastIntentionResult.intention}
              </p>
            </div>

            {/* 转录文本 */}
            {lastIntentionResult.transcription && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">转录文本</p>
                <p className="text-lg text-gray-800 font-medium">
                  "{lastIntentionResult.transcription}"
                </p>
              </div>
            )}

            {/* AI 建议 */}
            <div className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">AI 建议</p>
              <p className="text-lg text-pink-600 font-medium">
                💬 {lastIntentionResult.suggestion}
              </p>
            </div>

            {/* 情绪 */}
            {getEmotionConfig(lastIntentionResult.emotion) && (
              <div className="mb-4">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getEmotionConfig(lastIntentionResult.emotion)?.color}`}>
                  <span>{getEmotionConfig(lastIntentionResult.emotion)?.emoji}</span>
                  <span className="text-sm font-medium">{getEmotionConfig(lastIntentionResult.emotion)?.label}</span>
                </span>
              </div>
            )}

            {/* 置信度 */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">置信度</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  style={{ width: `${lastIntentionResult.confidence * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(lastIntentionResult.confidence * 100)}%
              </p>
            </div>

            <button
              onClick={() => setShowIntentionModal(false)}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium"
            >
              确定
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 声音画像模态框
  const ProfileModal = () => (
    <AnimatePresence>
      {showProfileModal && voiceProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowProfileModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                {petName}的声音画像
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 声音类型 */}
            <div className="mb-4 p-4 bg-purple-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">声音类型</p>
              <p className="text-lg text-purple-600 font-medium">
                {voiceProfile.voiceType}
              </p>
            </div>

            {/* 频率范围 */}
            <div className="mb-4 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">频率范围</p>
              <p className="text-lg text-blue-600 font-medium">
                {voiceProfile.frequencyRange}
              </p>
            </div>

            {/* 常见情绪 */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">常见情绪</p>
              <div className="flex flex-wrap gap-2">
                {voiceProfile.typicalEmotions.map((emotion, idx) => (
                  <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    {emotion}
                  </span>
                ))}
              </div>
            </div>

            {/* 沟通模式 */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">沟通模式</p>
              <div className="flex flex-wrap gap-2">
                {voiceProfile.communicationPatterns.map((pattern, idx) => (
                  <span key={idx} className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                    {pattern}
                  </span>
                ))}
              </div>
            </div>

            {/* 建议 */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">AI 建议</p>
              <ul className="space-y-2">
                {voiceProfile.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-500">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium"
            >
              确定
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 播放详情模态框
  const PlayDetailModal = () => (
    <AnimatePresence>
      {selectedVoice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVoice(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">{getTypeConfig(selectedVoice.type).emoji}</span>
                {selectedVoice.label}
              </h3>
              <button
                onClick={() => setSelectedVoice(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 波形可视化 */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <WaveformVisualizer 
                data={selectedVoice.waveformData}
                isPlaying={playingId === selectedVoice.id}
                progress={playProgress}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{formatDuration(selectedVoice.duration * playProgress)}</span>
                <span>{formatDuration(selectedVoice.duration)}</span>
              </div>
            </div>

            {/* 真实意图识别结果 */}
            {selectedVoice.transcription && (
              <div className="mb-4 p-3 bg-purple-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">AI 识别结果</p>
                <p className="text-lg text-purple-600 font-medium">
                  "{selectedVoice.transcription}"
                </p>
                {selectedVoice.translation && (
                  <p className="text-sm text-gray-600 mt-2">
                    💬 {selectedVoice.translation}
                  </p>
                )}
              </div>
            )}

            {getEmotionConfig(selectedVoice.emotion) && (
              <div className="mb-4">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getEmotionConfig(selectedVoice.emotion)?.color}`}>
                  <span>{getEmotionConfig(selectedVoice.emotion)?.emoji}</span>
                  <span className="text-sm font-medium">{getEmotionConfig(selectedVoice.emotion)?.label}</span>
                </span>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePlay(selectedVoice)}
                className={`py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                  playingId === selectedVoice.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {playingId === selectedVoice.id ? (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>暂停</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>播放</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleDownload(selectedVoice)}
                className="py-3 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>下载</span>
              </button>
              
              <button
                onClick={() => handleAnalyze(selectedVoice.id)}
                className="py-3 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-200 transition-colors"
              >
                <Brain className="w-5 h-5" />
                <span>分析画像</span>
              </button>
              
              <button
                onClick={() => handleShare(selectedVoice)}
                className="py-3 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>分享</span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedVoice(null);
                  handleDelete(selectedVoice.id);
                }}
                className="col-span-2 py-3 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>删除</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 加载状态
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

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-2">加载声音数据失败</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => loadVoices(petId)}
          className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
        >
          重新加载
        </button>
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
          onClick={startRecording}
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

            {voices.length > 0 ? (
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
            ) : (
              <p className="text-center text-gray-500 py-4">
                还没有声音记忆，先录制一些吧
              </p>
            )}
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
                    <div className="flex-1">
                      {editingVoice?.id === voice.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="flex-1 px-2 py-1 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingVoice(null)}
                            className="p-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-medium text-gray-800">{voice.label}</h3>
                      )}
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
                        onClick={() => handleStartEdit(voice)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit3 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => setSelectedVoice(voice)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="更多"
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
                      progress={isPlaying ? playProgress : 0}
                    />
                  </div>

                  {/* 真实意图识别结果 */}
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
                      onClick={() => handleAnalyze(voice.id)}
                      className="p-2.5 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors"
                      title="分析声音画像"
                    >
                      <Brain className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDownload(voice)}
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

      {/* 模态框 */}
      <PlayDetailModal />
      <IntentionModal />
      <ProfileModal />
    </div>
  );
}