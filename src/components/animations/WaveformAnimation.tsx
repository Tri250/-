import { useEffect, useState } from 'react';

type EmotionType = 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';

interface WaveformAnimationProps {
  isActive: boolean;
  emotion?: EmotionType;
  barCount?: number;
  height?: number;
}

export function WaveformAnimation({
  isActive,
  emotion = 'happy',
  barCount = 20,
  height = 60,
}: WaveformAnimationProps) {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setBars(
          Array.from({ length: barCount }, () => Math.random() * height + 10)
        );
      }, 100);

      return () => clearInterval(interval);
    } else {
      setBars(Array(barCount).fill(height / 3));
    }
  }, [isActive, barCount, height]);

  const getColor = () => {
    const colors: Record<EmotionType, string> = {
      happy: 'bg-green-400',
      anxious: 'bg-yellow-400',
      angry: 'bg-red-400',
      needs: 'bg-purple-400',
      neutral: 'bg-gray-400',
    };
    return colors[emotion];
  };

  return (
    <div
      className="flex items-center justify-center gap-1"
      style={{ height: `${height}px` }}
    >
      {bars.map((barHeight, index) => (
        <div
          key={index}
          className={`w-1 rounded-full transition-all duration-100 gpu-accelerated ${getColor()}`}
          style={{
            height: isActive ? `${barHeight}px` : `${height / 3}px`,
            animationDelay: `${index * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}
