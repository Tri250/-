// ============================================
// PawSync Pro - useVoiceRecorder.ts
// 
// 描述: 录音逻辑Hook - 独立状态机
// ============================================

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  validateAudioData,
  mergeAudioChunks,
  calculateAudioDuration,
  createAudioContext,
  initializeAnalyzer,
  createMediaRecorder,
  formatRecordingTime,
} from '../services/audioProcessor';

/**
 * 录音状态
 */
export type RecordingState = 'idle' | 'recording' | 'stopped' | 'error';

/**
 * Hook返回值接口
 */
export interface UseVoiceRecorderReturn {
  state: RecordingState;
  isRecording: boolean;
  recordingTime: number;
  audioLevel: number;
  hasValidAudio: boolean;
  maxAudioLevelReached: number;
  errorMessage: string | null;
  audioData: Float32Array | null;
  recordedBlob: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
  formatTime: (seconds: number) => string;
}

/**
 * 录音Hook
 * 提供完整的录音功能，包括：
 * - 真实麦克风录音
 * - 模拟录音（用于Web预览）
 * - 音频数据验证
 * - 音量级别监控
 */
export function useVoiceRecorder(): UseVoiceRecorderReturn {
  // 状态
  const [state, setState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasValidAudio, setHasValidAudio] = useState(false);
  const [maxAudioLevelReached, setMaxAudioLevelReached] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<Float32Array | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  // Refs
  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const blobChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);

  // 清理函数
  const cleanup = useCallback(() => {
    // 停止计时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 停止动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // 停止MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // 停止媒体流
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // 关闭AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    isRecordingRef.current = false;
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // 模拟录音（用于Web预览）
  const startMockRecording = useCallback(() => {
    setState('recording');
    setRecordingTime(0);
    setHasValidAudio(true);
    setMaxAudioLevelReached(50);
    setErrorMessage(null);
    isRecordingRef.current = true;

    // 模拟计时器
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => {
        const newTime = prev + 1;
        // 模拟音频电平波动
        const mockLevel = Math.random() * 30 + 20;
        setAudioLevel(mockLevel);
        setMaxAudioLevelReached((max) => Math.max(max, mockLevel));
        return newTime;
      });
    }, 1000);

    // 模拟音频捕获动画
    const mockCapture = () => {
      if (!isRecordingRef.current) return;

      const mockLevel = Math.random() * 40 + 10;
      setAudioLevel(mockLevel);

      animationRef.current = requestAnimationFrame(mockCapture);
    };
    mockCapture();

    console.log('模拟录音已开始（Web预览模式）');
  }, []);

  // 真实录音
  const startRealRecording = useCallback(async () => {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 初始化AudioContext
      const audioContext = createAudioContext();
      
      // 确保AudioContext处于运行状态
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      audioContextRef.current = audioContext;

      // 初始化分析器
      const analyser = initializeAnalyzer(audioContext, stream);
      analyserRef.current = analyser;

      // 创建MediaRecorder
      const { recorder } = createMediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          blobChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType;
        const blob = new Blob(blobChunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;

      setState('recording');
      setRecordingTime(0);
      audioChunksRef.current = [];
      blobChunksRef.current = [];
      setErrorMessage(null);
      isRecordingRef.current = true;

      // 计时器
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // 音频捕获循环
      const captureAudio = () => {
        if (!analyserRef.current || !isRecordingRef.current) return;

        const dataArray = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(dataArray);
        audioChunksRef.current.push(dataArray.slice(0));

        // 计算RMS音量级别
        const rms = Math.sqrt(
          dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length
        );
        const level = rms * 100;
        setAudioLevel(level);

        // 跟踪最大音量级别
        setMaxAudioLevelReached((prev) => Math.max(prev, level));

        // 检测是否有有效音频
        if (level > 5) {
          setHasValidAudio(true);
        }

        animationRef.current = requestAnimationFrame(captureAudio);
      };
      captureAudio();
    } catch (error) {
      console.error('无法访问麦克风:', error);

      // 处理各种错误情况
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          console.log('麦克风权限被拒绝，切换到模拟模式');
          startMockRecording();
          return;
        } else if (error.name === 'NotFoundError') {
          setErrorMessage('未检测到麦克风设备。请连接麦克风后重试。');
          setState('error');
          return;
        } else if (error.name === 'NotReadableError') {
          setErrorMessage('麦克风被其他应用程序占用。请关闭其他使用麦克风的应用后重试。');
          setState('error');
          return;
        }
      }

      // 其他错误也回退到模拟模式
      console.log('录音初始化失败，切换到模拟模式');
      startMockRecording();
    }
  }, [startMockRecording]);

  // 开始录音
  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    setHasValidAudio(false);
    setMaxAudioLevelReached(0);
    setAudioData(null);
    setRecordedBlob(null);

    // 检查是否为Web预览环境
    const isWebPreview = window.location.hostname === 'localhost' ||
      window.location.hostname.includes('10.25');

    if (isWebPreview) {
      startMockRecording();
      return;
    }

    await startRealRecording();
  }, [startMockRecording, startRealRecording]);

  // 停止录音
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    cleanup();
    setState('stopped');
    setAudioLevel(0);

    // 合并音频数据
    if (audioChunksRef.current.length > 0) {
      const mergedData = mergeAudioChunks(audioChunksRef.current);
      setAudioData(mergedData);

      // 验证录音有效性
      if (recordingTime < 1) {
        setErrorMessage('录音时间太短，请至少录音1秒钟。');
        return;
      }

      if (!hasValidAudio && maxAudioLevelReached < 3) {
        setErrorMessage('未检测到有效声音，请确保麦克风正常工作并对准宠物发声。');
        return;
      }

      // 验证音频数据
      const validation = validateAudioData(mergedData);
      if (!validation.isValid) {
        setErrorMessage(validation.error || '音频数据无效');
        return;
      }
    } else {
      setErrorMessage('未捕获到音频数据，请检查麦克风设置后重试。');
    }
  }, [cleanup, recordingTime, hasValidAudio, maxAudioLevelReached]);

  // 重置录音
  const resetRecording = useCallback(() => {
    cleanup();
    setState('idle');
    setRecordingTime(0);
    setAudioLevel(0);
    setHasValidAudio(false);
    setMaxAudioLevelReached(0);
    setErrorMessage(null);
    setAudioData(null);
    setRecordedBlob(null);
    audioChunksRef.current = [];
    blobChunksRef.current = [];
  }, [cleanup]);

  return {
    state,
    isRecording: state === 'recording',
    recordingTime,
    audioLevel,
    hasValidAudio,
    maxAudioLevelReached,
    errorMessage,
    audioData,
    recordedBlob,
    startRecording,
    stopRecording,
    resetRecording,
    formatTime: formatRecordingTime,
  };
}