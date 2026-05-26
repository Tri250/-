import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';
import type { EmotionWaveform } from '../../types/emotion';

interface VoiceRecorderProps {
  onRecordingComplete?: (audioData: Float32Array, duration: number) => void;
  onAnalysisStart?: () => void;
  disabled?: boolean;
  maxDuration?: number;
}

export function VoiceRecorder({
  onRecordingComplete,
  onAnalysisStart,
  disabled = false,
  maxDuration = 60,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveformData, setWaveformData] = useState<EmotionWaveform[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setWaveformData([]);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const level = Math.min(100, (average / 128) * 100);
        setAudioLevel(level);

        setWaveformData((prev) => [
          ...prev.slice(-99),
          {
            timestamp: Date.now() / 1000,
            amplitude: level / 100,
            frequency: average,
          },
        ]);

        animationRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  }, [maxDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setTimeout(() => {
      analyzeRecording();
    }, 500);
  }, []);

  const analyzeRecording = async () => {
    setIsAnalyzing(true);
    onAnalysisStart?.();

    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockAudioData = new Float32Array(44100 * recordingTime);
    for (let i = 0; i < mockAudioData.length; i++) {
      mockAudioData[i] = (Math.random() * 2 - 1) * 0.5;
    }

    onRecordingComplete?.(mockAudioData, recordingTime);
    setIsAnalyzing(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">录音分析</h3>
        <p className="text-sm text-gray-500">点击开始录音，AI将分析宠物声音中的情感</p>
      </div>

      <div className="relative flex justify-center mb-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isAnalyzing}
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            isAnalyzing
              ? 'bg-gradient-to-br from-gray-300 to-gray-400 cursor-not-allowed'
              : isRecording
              ? 'bg-gradient-to-br from-red-400 to-red-600 animate-pulse scale-110'
              : disabled
              ? 'bg-gradient-to-br from-gray-300 to-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-br from-orange-400 to-peach-500 hover:scale-105'
          }`}
        >
          {isAnalyzing ? (
            <Loader className="w-14 h-14 text-white animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-14 h-14 text-white" />
          ) : (
            <Mic className="w-14 h-14 text-white" />
          )}
        </button>

        {isRecording && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-40 rounded-full border-4 border-red-300 animate-ping opacity-30" />
              <div
                className="absolute w-36 h-36 rounded-full border-4 border-red-400 animate-ping opacity-20"
                style={{ animationDelay: '0.2s' }}
              />
            </div>

            <div
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </div>
          </>
        )}
      </div>

      {isRecording && (
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-sm text-gray-600">音量</span>
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-red-500 transition-all duration-100"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{Math.round(audioLevel)}%</span>
          </div>

          {waveformData.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2 text-center">实时波形</p>
              <div className="h-16 flex items-center justify-center gap-1">
                {waveformData.slice(-40).map((point, index) => (
                  <div
                    key={index}
                    className="w-1 bg-gradient-to-t from-orange-400 to-peach-500 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(4, point.amplitude * 100)}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isAnalyzing && (
        <div className="text-center">
          <p className="text-gray-600 font-medium flex items-center justify-center gap-2">
            <Loader className="w-5 h-5 text-orange-500 animate-spin" />
            AI 正在分析中...
          </p>
        </div>
      )}

      <div className="bg-gradient-to-r from-orange-50 to-peach-50 rounded-xl p-4 border border-orange-100">
        <p className="text-xs text-gray-500 text-center">
          💡 提示：请将麦克风靠近宠物，保持环境安静以获得更好的识别效果
        </p>
      </div>
    </div>
  );
}
