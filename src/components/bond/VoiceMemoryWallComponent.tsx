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
  Save
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface VoiceMemory {
  id: string;
  type: 'meow' | 'bark' | 'purr' | 'chirp' | 'growl' | 'whine' | 'other';
  label?: string;
  url: string;
  blob?: Blob;
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
  const [editingVoice, setEditingVoice] = useState<VoiceMemory | null>(null);
  const [editLabel, setEditLabel] = useState('');
  
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

  useEffect(() => {
    loadData();
    return () => {
      // 清理资源
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopRecording();
    };
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

  // 停止录音
  const stopRecording = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
          });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // 创建新的语音记忆
          const newVoice: VoiceMemory = {
            id: `voice-${Date.now()}`,
            type: 'other',
            label: `录音 ${voices.length + 1}`,
            url: audioUrl,
            blob: audioBlob,
            duration: recordingDuration,
            waveformData: liveWaveform.length > 0 ? liveWaveform : generateRandomWaveform(),
            timestamp: new Date().toISOString(),
            isUsedAsNotification: false
          };
          
          setVoices(prev => [newVoice, ...prev]);
          
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
  }, [voices.length, recordingDuration, liveWaveform]);

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
        // 如果是模拟数据，显示提示
        if (voice.url.startsWith('/audio/')) {
          alert('演示音频不可用，请录制新的声音');
        }
      };
    }
  }, [playingId]);

  // 下载音频
  const handleDownload = useCallback((voice: VoiceMemory) => {
    if (voice.blob) {
      // 如果有 blob，直接下载
      const url = URL.createObjectURL(voice.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${voice.label || '录音'}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (voice.url && !voice.url.startsWith('/audio/')) {
      // 如果有有效的 URL
      const a = document.createElement('a');
      a.href = voice.url;
      a.download = `${voice.label || '录音'}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // 演示数据，提示用户
      alert('演示音频不可下载，请录制新的声音');
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

  const handleSetAsNotification = (voiceId: string) => {
    setVoices(prev => prev.map(v => ({
      ...v,
      isUsedAsNotification: v.id === voiceId
    })));
    setNotificationSound(voiceId);
  };

  const handleDelete = (voiceId: string) => {
    if (!confirm('确定要删除这条声音记忆吗？')) return;
    
    const voice = voices.find(v => v.id === voiceId);
    if (voice?.url.startsWith('blob:')) {
      URL.revokeObjectURL(voice.url);
    }
    
    setVoices(prev => prev.filter(v => v.id !== voiceId));
    if (notificationSound === voiceId) {
      setNotificationSound(null);
    }
  };

  // 编辑标签
  const handleStartEdit = (voice: VoiceMemory) => {
    setEditingVoice(voice);
    setEditLabel(voice.label || '');
  };

  const handleSaveEdit = () => {
    if (editingVoice) {
      setVoices(prev => prev.map(v => 
        v.id === editingVoice.id ? { ...v, label: editLabel } : v
      ));
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

            {selectedVoice.transcription && (
              <div className="mb-4 p-3 bg-purple-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">识别结果</p>
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
                className="py-3 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
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

      {/* 播放详情模态框 */}
      <PlayDetailModal />
    </div>
  );
}
