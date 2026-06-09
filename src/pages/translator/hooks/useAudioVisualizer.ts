// ============================================
// PawSync Pro - useAudioVisualizer.ts
// 
// 描述: 音频可视化Hook
// ============================================

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * 可视化数据
 */
export interface VisualizerData {
  waveform: number[];
  frequency: number[];
  level: number;
}

/**
 * Hook返回值接口
 */
export interface UseAudioVisualizerReturn {
  data: VisualizerData;
  isActive: boolean;
  startVisualization: (analyser: AnalyserNode) => void;
  stopVisualization: () => void;
  simulateVisualization: () => void;
}

/**
 * 音频可视化Hook
 * 提供音频波形和频率可视化功能
 */
export function useAudioVisualizer(): UseAudioVisualizerReturn {
  // 状态
  const [data, setData] = useState<VisualizerData>({
    waveform: [],
    frequency: [],
    level: 0,
  });
  const [isActive, setIsActive] = useState(false);

  // Refs
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isActiveRef = useRef(false);

  // 清理函数
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    isActiveRef.current = false;
    setIsActive(false);
    analyserRef.current = null;
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // 实时可视化
  const visualize = useCallback(() => {
    if (!analyserRef.current || !isActiveRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;

    // 波形数据
    const waveformArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(waveformArray);

    // 频率数据
    const frequencyArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(frequencyArray);

    // 计算音量级别
    const rms = Math.sqrt(
      waveformArray.reduce((sum, val) => sum + val * val, 0) / waveformArray.length
    );
    const level = rms * 100;

    // 更新状态（采样以减少渲染压力）
    setData({
      waveform: Array.from(waveformArray.slice(0, 64)),
      frequency: Array.from(frequencyArray.slice(0, 32)),
      level,
    });

    animationRef.current = requestAnimationFrame(visualize);
  }, []);

  // 开始可视化
  const startVisualization = useCallback((analyser: AnalyserNode) => {
    analyserRef.current = analyser;
    isActiveRef.current = true;
    setIsActive(true);
    visualize();
  }, [visualize]);

  // 停止可视化
  const stopVisualization = useCallback(() => {
    cleanup();
    setData({
      waveform: [],
      frequency: [],
      level: 0,
    });
  }, [cleanup]);

  // 模拟可视化（用于测试）
  const simulateVisualization = useCallback(() => {
    isActiveRef.current = true;
    setIsActive(true);

    const simulate = () => {
      if (!isActiveRef.current) return;

      // 生成模拟波形数据
      const waveform: number[] = [];
      for (let i = 0; i < 64; i++) {
        waveform.push(Math.sin(i * 0.1) * 0.5 + Math.random() * 0.2);
      }

      // 生成模拟频率数据
      const frequency: number[] = [];
      for (let i = 0; i < 32; i++) {
        frequency.push(Math.random() * 100 + 50);
      }

      // 模拟音量级别
      const level = Math.random() * 40 + 20;

      setData({
        waveform,
        frequency,
        level,
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();
  }, []);

  return {
    data,
    isActive,
    startVisualization,
    stopVisualization,
    simulateVisualization,
  };
}