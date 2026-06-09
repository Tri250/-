// ============================================
// PawSync Pro - useEmotionAnalysis.ts
// 
// 描述: 分析流程Hook
// ============================================

import { useState, useCallback } from 'react';
import { emotionService } from '../../../services/emotionService';
import type { EmotionAnalysis, PrimaryEmotion } from '../../../types/emotion';
import { validateAudioData } from '../services/audioProcessor';

/**
 * 分析状态
 */
export type AnalysisState = 'idle' | 'analyzing' | 'success' | 'error';

/**
 * 分析源类型
 */
export type AnalysisSource = 'voice' | 'image';

/**
 * 分析结果
 */
export interface AnalysisResult {
  emotion: PrimaryEmotion;
  translation: string;
  confidence: number;
  analysis: EmotionAnalysis;
}

/**
 * Hook返回值接口
 */
export interface UseEmotionAnalysisReturn {
  state: AnalysisState;
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  errorMessage: string | null;
  analysisSource: AnalysisSource;
  analyzeVoice: (audioData: Float32Array, context?: {
    duration: number;
    maxLevel: number;
    hasValidSound: boolean;
  }) => Promise<void>;
  analyzeImage: (file: File) => Promise<void>;
  resetAnalysis: () => void;
}

/**
 * 情感分析Hook
 * 提供语音和图像的情感分析功能
 */
export function useEmotionAnalysis(): UseEmotionAnalysisReturn {
  // 状态
  const [state, setState] = useState<AnalysisState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisSource, setAnalysisSource] = useState<AnalysisSource>('voice');

  // 语音分析
  const analyzeVoice = useCallback(async (
    audioData: Float32Array,
    context?: {
      duration: number;
      maxLevel: number;
      hasValidSound: boolean;
    }
  ) => {
    setState('analyzing');
    setAnalysisSource('voice');
    setErrorMessage(null);
    setResult(null);

    try {
      // 验证音频数据
      const validation = validateAudioData(audioData);
      if (!validation.isValid) {
        setErrorMessage(validation.error || '音频数据无效');
        setState('error');
        return;
      }

      // 调用情感分析服务
      const analysis = await emotionService.analyzeVoice(audioData, {
        duration: context?.duration,
        maxLevel: context?.maxLevel,
        hasValidSound: context?.hasValidSound,
      });

      // 检查置信度
      if (analysis.confidence < 60) {
        setErrorMessage('分析置信度过低，请尝试在更安静的环境中重新录音。');
        setState('error');
        return;
      }

      // 设置结果
      setResult({
        emotion: analysis.primaryEmotion,
        translation: analysis.translation,
        confidence: analysis.confidence,
        analysis,
      });
      setState('success');
    } catch (error) {
      console.error('分析失败:', error);
      setErrorMessage('语音分析失败，请重试。');
      setState('error');
    }
  }, []);

  // 图像分析
  const analyzeImage = useCallback(async (file: File) => {
    setState('analyzing');
    setAnalysisSource('image');
    setErrorMessage(null);
    setResult(null);

    try {
      // 先进行动物检测
      const animalDetection = await emotionService.detectAnimal(file);

      if (!animalDetection.isAnimal) {
        setErrorMessage(animalDetection.message || '未检测到宠物，请上传包含宠物的图片。');
        setState('error');
        return;
      }

      if (animalDetection.confidence < 60) {
        setErrorMessage('宠物检测置信度过低，请上传更清晰的宠物照片。');
        setState('error');
        return;
      }

      // 调用图像分析服务
      const analysis = await emotionService.analyzeImageFile(file);

      // 检查置信度
      if (analysis.confidence < 60) {
        setErrorMessage('无法准确识别情感，请上传宠物表情更清晰的照片。');
        setState('error');
        return;
      }

      // 设置结果
      setResult({
        emotion: analysis.primaryEmotion,
        translation: analysis.translation,
        confidence: analysis.confidence,
        analysis,
      });
      setState('success');
    } catch (error) {
      console.error('图片分析失败:', error);
      setErrorMessage('图片分析失败，请重试。');
      setState('error');
    }
  }, []);

  // 重置分析
  const resetAnalysis = useCallback(() => {
    setState('idle');
    setResult(null);
    setErrorMessage(null);
    setAnalysisSource('voice');
  }, []);

  return {
    state,
    isAnalyzing: state === 'analyzing',
    result,
    errorMessage,
    analysisSource,
    analyzeVoice,
    analyzeImage,
    resetAnalysis,
  };
}