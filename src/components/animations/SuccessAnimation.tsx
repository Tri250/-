import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  duration?: number;
  onClose?: () => void;
}

export function SuccessAnimation({
  show,
  message = '操作成功',
  duration = 2000,
  onClose,
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center animate-scale-in shadow-2xl">
        <CheckCircle className="w-16 h-16 text-green-500 animate-bounce-once mb-4 gpu-accelerated" />
        <p className="text-lg font-medium text-gray-800">{message}</p>
      </div>
    </div>
  );
}

interface ErrorAnimationProps {
  show: boolean;
  message?: string;
  onClose?: () => void;
}

export function ErrorAnimation({
  show,
  message = '操作失败',
  onClose,
}: ErrorAnimationProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center animate-scale-in shadow-2xl animate-shake">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-4xl">❌</span>
        </div>
        <p className="text-lg font-medium text-red-600">{message}</p>
      </div>
    </div>
  );
}
