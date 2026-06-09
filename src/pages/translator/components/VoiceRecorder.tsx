// ============================================
// PawSync Pro - VoiceRecorder.tsx
// 
// 描述: 录音组件（独立状态机）
// ============================================

import React from 'react';
import { Mic, Heart, Clock } from 'lucide-react';
import { RecordingAnimation } from '../../../components/animations';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

/**
 * 组件属性
 */
export interface VoiceRecorderProps {
  onRecordingComplete?: (audioData: Float32Array, context: {
    duration: number;
    maxLevel: number;
    hasValidSound: boolean;
  }) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 主题颜色配置
 */
const THEME_COLORS = {
  primary: '#f97316',
  secondary: '#fb923c',
  success: '#22c55e',
};

/**
 * 录音组件
 * 提供完整的录音交互界面
 */
export function VoiceRecorder({
  onRecordingComplete,
  onError,
  disabled = false,
  className = '',
}: VoiceRecorderProps) {
  const {
    isRecording,
    recordingTime,
    audioLevel,
    hasValidAudio,
    maxAudioLevelReached,
    errorMessage,
    audioData,
    startRecording,
    stopRecording,
    formatTime,
  } = useVoiceRecorder();

  // 处理录音完成
  React.useEffect(() => {
    if (audioData && !isRecording && !errorMessage) {
      onRecordingComplete?.(audioData, {
        duration: recordingTime,
        maxLevel: maxAudioLevelReached,
        hasValidSound: hasValidAudio,
      });
    }
  }, [audioData, isRecording, errorMessage, recordingTime, maxAudioLevelReached, hasValidAudio, onRecordingComplete]);

  // 处理错误
  React.useEffect(() => {
    if (errorMessage) {
      onError?.(errorMessage);
    }
  }, [errorMessage, onError]);

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      {/* 录音动画按钮 */}
      <RecordingAnimation
        isActive={isRecording}
        audioLevel={audioLevel}
        size="large"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
      />

      {/* 录音状态显示 */}
      {isRecording && (
        <div className="text-center space-y-3 animate-fadeIn">
          {/* 提示文字 */}
          <div className="flex items-center justify-center gap-3">
            <Heart className="w-5 h-5 text-red-500 animate-pulse" />
            <p className="text-gray-600 font-medium text-lg">
              宝贝正在说话呢...
            </p>
            <Heart className="w-5 h-5 text-red-500 animate-pulse" />
          </div>

          {/* 录音时间 */}
          <div className="inline-flex items-center justify-center px-4 py-2 bg-red-50 rounded-full">
            <Clock className="w-4 h-4 text-red-500 mr-2" />
            <p className="text-2xl font-bold text-red-600 tabular-nums">
              {formatTime(recordingTime)}
            </p>
          </div>

          {/* 音量指示器 */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-400">音量:</span>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${Math.min(100, audioLevel)}%`,
                  background: `linear-gradient(90deg, ${THEME_COLORS.success}, ${THEME_COLORS.primary})`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500">{Math.round(audioLevel)}%</span>
          </div>

          {/* 结束提示 */}
          <p className="text-xs text-gray-400">
            点击按钮结束录音
          </p>
        </div>
      )}

      {/* 未录音时的提示 */}
      {!isRecording && !audioData && (
        <div className="text-center space-y-2">
          <p className="text-gray-500 text-sm">
            点击爪印按钮开始录音
          </p>
          <p className="text-gray-400 text-xs">
            请将麦克风靠近宝贝，保持环境安静
          </p>
        </div>
      )}
    </div>
  );
}