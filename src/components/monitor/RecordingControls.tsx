import { useState } from 'react';
import { Circle, Square, Pause, Play, Clock, HardDrive, Download } from 'lucide-react';
import type { RecordingSession } from '../../types/monitor';

interface RecordingControlsProps {
  session: RecordingSession | null;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording?: () => void;
  onResumeRecording?: () => void;
  recordingDuration?: number;
}

export function RecordingControls({
  session,
  isRecording,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  recordingDuration = 0,
}: RecordingControlsProps) {
  const [isPaused, setIsPaused] = useState(false);

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      onResumeRecording?.();
    } else {
      onPauseRecording?.();
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">录制控制</h3>
          <p className="text-sm text-gray-500 mt-1">
            {isRecording ? '正在录制监控画面' : '点击开始录制'}
          </p>
        </div>
        
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`} />
            <span className={`text-sm font-medium ${isPaused ? 'text-yellow-600' : 'text-red-600'}`}>
              {isPaused ? '已暂停' : '录制中'}
            </span>
          </div>
        )}
      </div>

      {isRecording && session && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-2 text-gray-500" />
            <p className="text-2xl font-bold text-gray-800">{formatDuration(recordingDuration)}</p>
            <p className="text-xs text-gray-500 mt-1">录制时长</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <HardDrive className="w-5 h-5 mx-auto mb-2 text-gray-500" />
            <p className="text-2xl font-bold text-gray-800">{formatFileSize(session.fileSize)}</p>
            <p className="text-xs text-gray-500 mt-1">文件大小</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <Circle className={`w-5 h-5 mx-auto mb-2 ${isPaused ? 'text-yellow-500' : 'text-red-500'}`} />
            <p className="text-sm font-bold text-gray-800">{isPaused ? '已暂停' : '正常'}</p>
            <p className="text-xs text-gray-500 mt-1">录制状态</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        {!isRecording ? (
          <button
            onClick={onStartRecording}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Circle className="w-6 h-6 fill-current" />
            <span className="text-lg font-semibold">开始录制</span>
          </button>
        ) : (
          <>
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-all"
            >
              {isPaused ? (
                <>
                  <Play className="w-5 h-5" />
                  <span className="font-medium">继续</span>
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5" />
                  <span className="font-medium">暂停</span>
                </>
              )}
            </button>
            
            <button
              onClick={onStopRecording}
              className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-all"
            >
              <Square className="w-5 h-5" />
              <span className="font-medium">停止</span>
            </button>
          </>
        )}
      </div>

      {isRecording && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            💡 提示：录制过程中请保持网络连接稳定，录制文件将保存在本地
          </p>
        </div>
      )}

      {!isRecording && session && session.fileUrl && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <button
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">下载录制文件</span>
          </button>
        </div>
      )}
    </div>
  );
}
