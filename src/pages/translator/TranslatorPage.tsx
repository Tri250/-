// ============================================
// PawSync Pro - TranslatorPage.tsx
// 
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: AI情感翻译页面 - 模块化重构版
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { Mic, Camera, Share2, ChevronLeft, History, Heart, Activity, X } from 'lucide-react';
import { useAppStore, type Analysis } from '../../store/appStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { RecordingAnimation, AnalysisAnimation } from '../../components/animations';
import { emotionService } from '../../services/emotionService';
import { EMOTION_CONFIGS } from '../../types/emotion';
import type { PrimaryEmotion, EmotionAnalysis } from '../../types/emotion';

// 导入模块化组件
import {
  VoiceRecorder,
  ImageUploaderModal,
  AnalysisPipeline,
  ResultCard,
  AnalysisDimensionsGrid,
  HistoryPanel,
  TrendChart,
  TrendEntryCard,
} from './components';

// 导入模块化Hooks
import { useVoiceRecorder } from './hooks/useVoiceRecorder';
import { useEmotionAnalysis } from './hooks/useEmotionAnalysis';

// 导入服务
import { readFileAsDataURL } from './services/imageProcessor';

// 类型定义
type AppStoreEmotion = 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';

// 情感映射函数
function mapToAppStoreEmotion(emotion: PrimaryEmotion): AppStoreEmotion {
  const emotionMap: Record<PrimaryEmotion, AppStoreEmotion> = {
    happy: 'happy',
    anxious: 'anxious',
    angry: 'angry',
    needs: 'needs',
    calm: 'neutral',
    curious: 'neutral',
    excited: 'happy',
    safe: 'neutral',
  };
  return emotionMap[emotion] || 'neutral';
}

/**
 * AI情感翻译主页面
 * 仅包含页面级状态和布局
 */
export default function TranslatorPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  // 全局状态
  const { currentPet, addAnalysis, setCurrentEmotion, analyses } = useAppStore();

  // 页面级状态
  const [showResult, setShowResult] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<Analysis | null>(null);

  // 使用模块化Hooks
  const voiceRecorder = useVoiceRecorder();
  const emotionAnalysis = useEmotionAnalysis();

  // 当前分析结果
  const [currentAnalysis, setCurrentAnalysis] = useState<EmotionAnalysis | null>(null);

  // 清理副作用
  useEffect(() => {
    return () => {
      voiceRecorder.resetRecording();
      emotionAnalysis.resetAnalysis();
    };
  }, []);

  // 处理录音完成
  const handleRecordingComplete = useCallback(async (
    audioData: Float32Array,
    context: {
      duration: number;
      maxLevel: number;
      hasValidSound: boolean;
    }
  ) => {
    await emotionAnalysis.analyzeVoice(audioData, context);
  }, [emotionAnalysis]);

  // 处理分析完成
  useEffect(() => {
    if (emotionAnalysis.state === 'success' && emotionAnalysis.result) {
      setShowResult(true);
      setCurrentAnalysis(emotionAnalysis.result.analysis);
      setCurrentEmotion(mapToAppStoreEmotion(emotionAnalysis.result.emotion));

      // 添加到历史记录
      addAnalysis({
        petId: currentPet?.id || '',
        type: emotionAnalysis.analysisSource,
        result: {
          emotion: mapToAppStoreEmotion(emotionAnalysis.result.emotion),
          translation: emotionAnalysis.result.translation,
          confidence: emotionAnalysis.result.confidence,
        },
      });
    }
  }, [emotionAnalysis.state, emotionAnalysis.result, emotionAnalysis.analysisSource, addAnalysis, currentPet, setCurrentEmotion]);

  // 处理图片选择
  const handleImageSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    try {
      const imageUrl = await readFileAsDataURL(file);
      setSelectedImage(imageUrl);
      setShowImageModal(true);
    } catch (error) {
      console.error('图片加载失败:', error);
    }
  }, []);

  // 处理图片分析
  const handleImageAnalysis = useCallback(async () => {
    if (!selectedFile) return;

    setShowImageModal(false);
    await emotionAnalysis.analyzeImage(selectedFile);
  }, [selectedFile, emotionAnalysis]);

  // 关闭图片弹窗
  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
    setSelectedImage(null);
    setSelectedFile(null);
  }, []);

  // 处理分享
  const handleShare = useCallback(async () => {
    try {
      const { ShareService } = await import('../../lib/platformService');

      const shareText = `${currentPet?.name}的心情\n\n${emotionAnalysis.result?.translation || ''}\n\n——来自 爪爪连心❤️`;

      await ShareService.share({
        title: '爪爪连心❤️ - 宠物心声',
        text: shareText,
        dialogTitle: '分享宠物心声',
      });
    } catch (error) {
      console.error('分享失败', error);
    }
  }, [currentPet, emotionAnalysis.result]);

  // 处理重试
  const handleRetry = useCallback(() => {
    setShowResult(false);
    voiceRecorder.resetRecording();
    emotionAnalysis.resetAnalysis();
    setCurrentAnalysis(null);
    setSelectedImage(null);
    setSelectedFile(null);
  }, [voiceRecorder, emotionAnalysis]);

  // 监听录音状态变化
  useEffect(() => {
    if (voiceRecorder.state === 'stopped' && voiceRecorder.audioData) {
      handleRecordingComplete(voiceRecorder.audioData, {
        duration: voiceRecorder.recordingTime,
        maxLevel: voiceRecorder.maxAudioLevelReached,
        hasValidSound: voiceRecorder.hasValidAudio,
      });
    }
  }, [voiceRecorder.state, voiceRecorder.audioData, voiceRecorder.recordingTime, voiceRecorder.maxAudioLevelReached, voiceRecorder.hasValidAudio, handleRecordingComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-peach-50/30 pb-20">
      {/* 头部导航 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate?.('home')}
              className="p-2 hover:bg-orange-50 rounded-full transition-colors"
              aria-label="返回首页"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            <div className="flex flex-col items-center">
              <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-orange-500" />
                AI 情感翻译机
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${
                  voiceRecorder.isRecording ? 'bg-red-500 animate-pulse' :
                  emotionAnalysis.isAnalyzing ? 'bg-orange-500 animate-pulse' :
                  'bg-green-500'
                }`} />
                <span className="text-xs text-gray-400">
                  {voiceRecorder.isRecording ? '录音中' : emotionAnalysis.isAnalyzing ? '分析中' : '就绪'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistoryModal(true)}
                className="p-2 hover:bg-orange-50 rounded-full transition-colors"
                aria-label="查看历史"
                disabled={analyses.length === 0}
              >
                <History className={`w-5 h-5 ${analyses.length > 0 ? 'text-gray-600' : 'text-gray-300'}`} />
              </button>
              <button
                onClick={handleShare}
                disabled={!showResult}
                className="p-2 hover:bg-orange-50 rounded-full transition-colors disabled:opacity-50"
                aria-label="分享"
              >
                <Share2 className={`w-5 h-5 ${showResult ? 'text-orange-500' : 'text-gray-300'}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 操作按钮 */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={voiceRecorder.startRecording}
            disabled={voiceRecorder.isRecording || emotionAnalysis.isAnalyzing}
            icon={<Mic className="w-5 h-5" />}
            className={voiceRecorder.isRecording || emotionAnalysis.isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
          >
            录音翻译
          </Button>
          <Button
            variant="secondary"
            icon={<Camera className="w-5 h-5" />}
            onClick={() => {
              setSelectedImage(null);
              setSelectedFile(null);
              setShowImageModal(true);
            }}
            disabled={voiceRecorder.isRecording || emotionAnalysis.isAnalyzing}
            className={voiceRecorder.isRecording || emotionAnalysis.isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
          >
            拍照分析
          </Button>
        </div>

        {/* 录音/分析区域 */}
        <div className="flex flex-col items-center gap-6">
          {/* 录音动画 */}
          {!emotionAnalysis.isAnalyzing && !showResult && (
            <RecordingAnimation
              isActive={voiceRecorder.isRecording}
              audioLevel={voiceRecorder.audioLevel}
              size="large"
              onClick={voiceRecorder.isRecording ? voiceRecorder.stopRecording : voiceRecorder.startRecording}
            />
          )}

          {/* 分析动画 */}
          {emotionAnalysis.isAnalyzing && (
            <AnalysisAnimation
              isActive={emotionAnalysis.isAnalyzing}
              source={emotionAnalysis.analysisSource}
            />
          )}

          {/* 未录音提示 */}
          {!voiceRecorder.isRecording && !emotionAnalysis.isAnalyzing && !showResult && (
            <div className="text-center space-y-2">
              <p className="text-gray-500 text-sm">
                点击爪印按钮开始录音
              </p>
              <p className="text-gray-400 text-xs">
                或使用拍照分析功能
              </p>
            </div>
          )}

          {/* 错误提示 */}
          {(voiceRecorder.errorMessage || emotionAnalysis.errorMessage) && 
           !voiceRecorder.isRecording && !emotionAnalysis.isAnalyzing && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-sm mx-auto animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="text-red-500 text-xl">⚠️</div>
                <div className="flex-1">
                  <p className="text-red-700 text-sm font-medium mb-1">分析失败</p>
                  <p className="text-red-600 text-xs">{voiceRecorder.errorMessage || emotionAnalysis.errorMessage}</p>
                </div>
                <button
                  onClick={() => {
                    voiceRecorder.resetRecording();
                    emotionAnalysis.resetAnalysis();
                  }}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 录音状态显示 */}
          {voiceRecorder.isRecording && (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <Heart className="w-5 h-5 text-red-500 animate-pulse" />
                <p className="text-gray-600 font-medium text-lg">
                  宝贝正在说话呢...
                </p>
                <Heart className="w-5 h-5 text-red-500 animate-pulse" />
              </div>

              <div className="inline-flex items-center justify-center px-4 py-2 bg-red-50 rounded-full">
                <span className="text-2xl font-bold text-red-600 tabular-nums">
                  {voiceRecorder.formatTime(voiceRecorder.recordingTime)}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-gray-400">音量:</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${Math.min(100, voiceRecorder.audioLevel)}%`,
                      background: `linear-gradient(90deg, #22c55e, #f97316)`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500">{Math.round(voiceRecorder.audioLevel)}%</span>
              </div>

              <p className="text-xs text-gray-400">
                点击按钮结束录音
              </p>
            </div>
          )}
        </div>

        {/* 分析结果 */}
        {showResult && emotionAnalysis.result && (
          <ResultCard
            emotion={emotionAnalysis.result.emotion}
            translation={emotionAnalysis.result.translation}
            confidence={emotionAnalysis.result.confidence}
            analysis={currentAnalysis}
            analysisSource={emotionAnalysis.analysisSource}
            selectedImage={selectedImage}
            petName={currentPet?.name}
            onRetry={handleRetry}
            onShare={handleShare}
          />
        )}

        {/* 小贴士 */}
        <Card variant="default" padding="medium">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                <strong>小贴士</strong>
              </p>
              <p className="text-xs text-gray-500">
                请将麦克风靠近宝贝，保持环境安静。AI会分析音调、频率、节奏等多个维度，确保95%以上的分析准确率。
              </p>
            </div>
          </div>
        </Card>

        {/* 分析维度 */}
        <Card variant="default" padding="medium">
          <AnalysisDimensionsGrid isActive={emotionAnalysis.isAnalyzing} />
        </Card>

        {/* 情绪趋势入口 */}
        <TrendEntryCard onClick={() => setShowTrendModal(true)} />
      </main>

      {/* 历史记录弹窗 */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <HistoryPanel
            analyses={analyses}
            currentPetId={currentPet?.id || ''}
            onSelectItem={setSelectedHistoryItem}
            onClose={() => {
              setShowHistoryModal(false);
              setSelectedHistoryItem(null);
            }}
            className="mx-4 max-w-sm w-full"
          />
        </div>
      )}

      {/* 情绪趋势弹窗 */}
      {showTrendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <TrendChart
            onClose={() => setShowTrendModal(false)}
            className="mx-4 max-w-md w-full"
          />
        </div>
      )}

      {/* 图片选择弹窗 */}
      {showImageModal && (
        <ImageUploaderModal
          isOpen={showImageModal}
          onClose={closeImageModal}
          onAnalysisRequested={handleImageAnalysis}
        />
      )}
    </div>
  );
}