import { useEffect, useRef } from 'react';
import type { EmotionWaveform } from '../../types/emotion';

interface EmotionWaveformProps {
  data: EmotionWaveform[];
  color?: string;
  height?: number;
  animated?: boolean;
  showLabels?: boolean;
}

export function EmotionWaveform({
  data,
  color = 'text-orange-500',
  height = 100,
  animated = true,
  showLabels = false,
}: EmotionWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const canvasHeight = rect.height;
    const barWidth = width / data.length;
    const centerY = canvasHeight / 2;

    ctx.clearRect(0, 0, width, canvasHeight);

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(249, 115, 22, 0.3)');
    gradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.8)');
    gradient.addColorStop(1, 'rgba(251, 146, 60, 0.3)');

    data.forEach((point, index) => {
      const x = index * barWidth;
      const barHeight = point.amplitude * canvasHeight * 0.8;
      
      ctx.fillStyle = gradient;
      ctx.fillRect(
        x,
        centerY - barHeight / 2,
        barWidth - 2,
        barHeight
      );
    });

    ctx.beginPath();
    ctx.strokeStyle = color.includes('text-') ? '#f97316' : color;
    ctx.lineWidth = 2;
    ctx.moveTo(0, centerY);
    
    data.forEach((point, index) => {
      const x = index * barWidth;
      const y = centerY - (point.amplitude - 0.5) * canvasHeight * 0.5;
      ctx.lineTo(x, y);
    });
    
    ctx.stroke();

    if (showLabels && data.length > 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px sans-serif';
      ctx.fillText(`0s`, 5, canvasHeight - 5);
      ctx.fillText(`${data[data.length - 1].timestamp.toFixed(1)}s`, width - 40, canvasHeight - 5);
    }

  }, [data, color, showLabels]);

  if (data.length === 0) {
    return (
      <div 
        className="bg-gray-50 rounded-xl flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <p className="text-sm text-gray-400">暂无波形数据</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl"
        style={{ height: `${height}px` }}
      />
      
      {animated && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50 animate-pulse" />
        </div>
      )}
    </div>
  );
}
