type EmotionType = 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';

interface EmotionPulseProps {
  emotion: EmotionType;
  isActive?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function EmotionPulse({
  emotion,
  isActive = true,
  size = 'medium',
}: EmotionPulseProps) {
  const getEmotionEmoji = () => {
    const emojis: Record<EmotionType, string> = {
      happy: '😸',
      anxious: '😰',
      angry: '😾',
      needs: '🥺',
      neutral: '😐',
    };
    return emojis[emotion];
  };

  const getEmotionColor = () => {
    const colors: Record<EmotionType, string> = {
      happy: 'bg-green-400',
      anxious: 'bg-yellow-400',
      angry: 'bg-red-400',
      needs: 'bg-purple-400',
      neutral: 'bg-gray-400',
    };
    return colors[emotion];
  };

  const getSizeClass = () => {
    const sizes = {
      small: 'text-2xl',
      medium: 'text-4xl',
      large: 'text-6xl',
    };
    return sizes[size];
  };

  return (
    <div className={`relative ${isActive ? 'animate-pulse' : ''}`}>
      <div
        className={`absolute inset-0 rounded-full opacity-20 blur-lg ${getEmotionColor()} transition-all duration-300`}
      />

      <div className="relative flex items-center justify-center">
        <span className={`${getSizeClass()} gpu-accelerated transition-all duration-300`}>
          {getEmotionEmoji()}
        </span>
      </div>
    </div>
  );
}
