import { Mic, MicOff } from 'lucide-react';

type ButtonSize = 'small' | 'medium' | 'large';

interface RecordButtonProps {
  isRecording: boolean;
  onClick: () => void;
  size?: ButtonSize;
  disabled?: boolean;
}

export function RecordButton({
  isRecording,
  onClick,
  size = 'large',
  disabled = false,
}: RecordButtonProps) {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
  };

  const iconSizes = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-14 h-14',
  };

  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <>
          <div className="absolute inset-0 rounded-full bg-red-400 animate-ripple opacity-30" />
          <div
            className="absolute inset-0 rounded-full bg-red-400 animate-ripple opacity-20"
            style={{ animationDelay: '0.3s' }}
          />
          <div
            className="absolute inset-0 rounded-full bg-red-400 animate-ripple opacity-10"
            style={{ animationDelay: '0.6s' }}
          />
        </>
      )}

      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          ${sizeClasses[size]} rounded-full flex items-center justify-center
          transition-all duration-300 shadow-2xl gpu-accelerated
          ${isRecording
            ? 'bg-gradient-to-br from-red-400 to-red-600 scale-110 animate-breathe'
            : 'bg-gradient-to-br from-orange-400 to-orange-500 hover:scale-105'
          }
          active:scale-95
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isRecording ? (
          <MicOff className={`${iconSizes[size]} text-white`} />
        ) : (
          <Mic className={`${iconSizes[size]} text-white`} />
        )}
      </button>
    </div>
  );
}
