import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Image, Video, FileText, Check, Star, Square, Play, Pause, Camera, Upload } from 'lucide-react';
import { GlassModal, GlassInput, GlassTextarea } from './DesignSystem';
import { HealthTag, RecordType } from '../types/health-record';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (record: {
    type: RecordType;
    title: string;
    content: string;
    tags: string[];
    isImportant: boolean;
    attachments?: string[];
    voiceDuration?: number;
  }) => void;
  availableTags: HealthTag[];
  initialType?: RecordType;
}

const RECORD_TYPE_CONFIG: {
  type: RecordType;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { type: 'text', label: '文字', icon: FileText, color: 'bg-blue-500' },
  { type: 'voice', label: '语音', icon: Mic, color: 'bg-purple-500' },
  { type: 'photo', label: '图片', icon: Image, color: 'bg-green-500' },
  { type: 'video', label: '视频', icon: Video, color: 'bg-red-500' },
];

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableTags,
  initialType = 'text',
}) => {
  const [recordType, setRecordType] = useState<RecordType>(initialType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isImportant, setIsImportant] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoRecordingTime, setVideoRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (recordType === 'text' && !content.trim()) return;
    if (recordType === 'voice' && !audioBlob && recordingTime === 0) return;
    if (recordType === 'photo' && !selectedImage) return;
    if (recordType === 'video' && !selectedVideo && videoRecordingTime === 0) return;

    const attachments: string[] = [];
    if (selectedImage) attachments.push(selectedImage);
    if (selectedVideo) attachments.push(selectedVideo);

    onSubmit({
      type: recordType,
      title: title.trim(),
      content: content.trim() || getDefaultContent(),
      tags: selectedTags,
      isImportant,
      attachments,
      voiceDuration: recordType === 'voice' ? recordingTime : undefined,
    });

    handleClose();
  };

  const getDefaultContent = () => {
    switch (recordType) {
      case 'voice':
        return `语音记录 (${recordingTime}秒)`;
      case 'photo':
        return '图片记录';
      case 'video':
        return `视频记录 (${videoRecordingTime}秒)`;
      default:
        return '';
    }
  };

  const handleClose = () => {
    stopRecording();
    stopVideoRecording();
    setRecordType(initialType);
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setIsImportant(false);
    setIsRecording(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setIsPlaying(false);
    setSelectedImage(null);
    setSelectedVideo(null);
    setIsVideoRecording(false);
    setVideoRecordingTime(0);
    audioChunksRef.current = [];
    videoChunksRef.current = [];
    onClose();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
      } else {
        audioRef.current.src = audioUrl;
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedVideo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: true 
      });
      videoStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream);
      videoRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        setSelectedVideo(videoUrl);
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start();
      setIsVideoRecording(true);
      setVideoRecordingTime(0);

      videoTimerRef.current = setInterval(() => {
        setVideoRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start video recording:', error);
      alert('无法访问摄像头，请检查权限设置');
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current && isVideoRecording) {
      videoRecorderRef.current.stop();
      setIsVideoRecording(false);
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current);
        videoTimerRef.current = null;
      }
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const isSubmitDisabled = () => {
    if (!title.trim()) return true;
    switch (recordType) {
      case 'text':
        return !content.trim();
      case 'voice':
        return !audioBlob && recordingTime === 0;
      case 'photo':
        return !selectedImage;
      case 'video':
        return !selectedVideo && videoRecordingTime === 0;
      default:
        return false;
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={handleClose} title="添加健康记录" size="md">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            记录类型
          </label>
          <div className="grid grid-cols-4 gap-2">
            {RECORD_TYPE_CONFIG.map((config) => (
              <button
                key={config.type}
                onClick={() => {
                  setRecordType(config.type);
                  stopRecording();
                  stopVideoRecording();
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                  recordType === config.type
                    ? 'bg-primary-50 border-2 border-primary-500'
                    : 'bg-neutral-50 border-2 border-transparent hover:bg-neutral-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center`}>
                  <config.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium text-neutral-600">{config.label}</span>
              </button>
            ))}
          </div>
        </div>

        <GlassInput
          label="标题"
          placeholder="输入记录标题..."
          value={title}
          onChange={setTitle}
          required
        />

        <div>
          {recordType === 'text' && (
            <GlassTextarea
              label="内容"
              placeholder="详细描述宠物的健康状况..."
              value={content}
              onChange={setContent}
              rows={4}
              required
            />
          )}

          {recordType === 'voice' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">语音记录</label>
              
              {!audioBlob && !isRecording && (
                <button
                  onClick={startRecording}
                  className="w-full py-4 rounded-xl flex flex-col items-center justify-center gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all"
                >
                  <Mic className="w-8 h-8" />
                  <span className="font-medium">点击开始录音</span>
                </button>
              )}

              {isRecording && (
                <div className="w-full py-4 rounded-xl flex flex-col items-center justify-center gap-3 bg-red-500 text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    <Mic className="w-6 h-6 animate-bounce" />
                  </div>
                  <span className="text-2xl font-bold">{formatTime(recordingTime)}</span>
                  <span className="text-sm">正在录音...</span>
                  <button
                    onClick={stopRecording}
                    className="mt-2 px-6 py-2 bg-white text-red-500 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    <Square className="w-4 h-4 inline mr-2" />
                    停止录音
                  </button>
                </div>
              )}

              {audioBlob && !isRecording && (
                <div className="w-full py-4 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={isPlaying ? pauseAudio : playAudio}
                      className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center hover:bg-purple-600 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <div className="text-center">
                      <p className="text-sm font-medium text-purple-700">录音完成</p>
                      <p className="text-lg font-bold text-purple-600">{formatTime(recordingTime)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setAudioBlob(null);
                        setRecordingTime(0);
                      }}
                      className="px-4 py-2 text-sm text-purple-600 hover:text-purple-800"
                    >
                      重新录制
                    </button>
                  </div>
                </div>
              )}

              <GlassTextarea
                label="备注（可选）"
                placeholder="添加语音记录的补充说明..."
                value={content}
                onChange={setContent}
                rows={2}
              />
            </div>
          )}

          {recordType === 'photo' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">图片记录</label>
              
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {!selectedImage && (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full py-8 rounded-xl border-2 border-dashed border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all cursor-pointer"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-10 h-10 text-green-500" />
                    <span className="font-medium text-green-700">点击上传图片</span>
                    <span className="text-sm text-green-600">支持 JPG、PNG、GIF 格式</span>
                  </div>
                </button>
              )}

              {selectedImage && (
                <div className="relative rounded-xl overflow-hidden bg-green-50 border border-green-200">
                  <img
                    src={selectedImage}
                    alt="Selected image"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-medium">
                    图片已选择
                  </div>
                </div>
              )}

              <GlassTextarea
                label="备注（可选）"
                placeholder="添加图片记录的补充说明..."
                value={content}
                onChange={setContent}
                rows={2}
              />
            </div>
          )}

          {recordType === 'video' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">视频记录</label>
              
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />

              {!selectedVideo && !isVideoRecording && (
                <div className="space-y-3">
                  <button
                    onClick={startVideoRecording}
                    className="w-full py-4 rounded-xl flex flex-col items-center justify-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                  >
                    <Camera className="w-8 h-8" />
                    <span className="font-medium">点击开始录像</span>
                  </button>
                  
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-red-700">或上传现有视频</span>
                    </div>
                  </button>
                </div>
              )}

              {isVideoRecording && (
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    className="w-full h-48 object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-2xl font-bold">{formatTime(videoRecordingTime)}</span>
                    </div>
                    <button
                      onClick={stopVideoRecording}
                      className="mt-4 px-6 py-2 bg-white text-red-500 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      <Square className="w-4 h-4 inline mr-2" />
                      停止录像
                    </button>
                  </div>
                </div>
              )}

              {selectedVideo && !isVideoRecording && (
                <div className="relative rounded-xl overflow-hidden bg-red-50 border border-red-200">
                  <video
                    src={selectedVideo}
                    className="w-full h-48 object-cover"
                    controls
                  />
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-3 py-1 bg-red-500 text-white rounded-lg text-sm font-medium">
                    视频已选择 ({videoRecordingTime > 0 ? formatTime(videoRecordingTime) : '已上传'})
                  </div>
                </div>
              )}

              <GlassTextarea
                label="备注（可选）"
                placeholder="添加视频记录的补充说明..."
                value={content}
                onChange={setContent}
                rows={2}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            标签
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'ring-2 ring-offset-1 shadow-sm'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    ...(isSelected && { ringColor: tag.color, boxShadow: `0 0 0 2px ${tag.color}` }),
                  }}
                >
                  {isSelected && (
                    <Check className="w-3 h-3 inline mr-1" />
                  )}
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportant(!isImportant)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              isImportant
                ? 'bg-amber-100 text-amber-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Star
              className={`w-4 h-4 ${isImportant ? 'fill-amber-500 text-amber-500' : ''}`}
            />
            <span className="text-sm font-medium">标记为重要</span>
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl bg-neutral-100 text-neutral-700 font-medium hover:bg-neutral-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled()}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存记录
          </button>
        </div>
      </div>
    </GlassModal>
  );
};