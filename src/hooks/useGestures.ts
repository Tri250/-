import { useState, useCallback, useRef, useEffect } from 'react';

interface SwipeConfig {
  threshold?: number;
  velocityThreshold?: number;
}

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
}

interface GestureCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
}

export function useGestures(
  callbacks: GestureCallbacks,
  config: SwipeConfig = {}
) {
  const { threshold = 50, velocityThreshold = 0.3 } = config;
  
  const [swipeState, setSwipeState] = useState<SwipeState | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapTime = useRef<number>(0);
  const elementRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setSwipeState({
      startX: clientX,
      startY: clientY,
      startTime: Date.now(),
    });
    setIsLongPress(false);

    // 长按检测
    if (callbacks.onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPress(true);
        callbacks.onLongPress?.();
      }, 500);
    }
  }, [callbacks]);

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!swipeState) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = Math.abs(clientX - swipeState.startX);
    const deltaY = Math.abs(clientY - swipeState.startY);

    // 如果移动距离超过阈值，取消长按
    if ((deltaX > 10 || deltaY > 10) && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, [swipeState]);

  const handleTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!swipeState) return;

    // 清除长按定时器
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // 如果是长按，不处理滑动
    if (isLongPress) {
      setSwipeState(null);
      return;
    }

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    
    const deltaX = clientX - swipeState.startX;
    const deltaY = clientY - swipeState.startY;
    const deltaTime = Date.now() - swipeState.startTime;
    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;

    // 双击检测
    const now = Date.now();
    if (now - lastTapTime.current < 300 && callbacks.onDoubleTap) {
      callbacks.onDoubleTap();
      lastTapTime.current = 0;
      setSwipeState(null);
      return;
    }
    lastTapTime.current = now;

    // 判断滑动方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      if (Math.abs(deltaX) > threshold && velocityX > velocityThreshold) {
        if (deltaX > 0) {
          callbacks.onSwipeRight?.();
        } else {
          callbacks.onSwipeLeft?.();
        }
      }
    } else {
      // 垂直滑动
      if (Math.abs(deltaY) > threshold && velocityY > velocityThreshold) {
        if (deltaY > 0) {
          callbacks.onSwipeDown?.();
        } else {
          callbacks.onSwipeUp?.();
        }
      }
    }

    setSwipeState(null);
  }, [swipeState, isLongPress, callbacks, threshold, velocityThreshold]);

  // 清理
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleTouchStart,
      onMouseMove: handleTouchMove,
      onMouseUp: handleTouchEnd,
      onMouseLeave: handleTouchEnd,
    },
    ref: elementRef,
    isLongPress,
  };
}

// 专门用于页面返回的手势Hook
export function useSwipeBack(onSwipeBack: () => void) {
  return useGestures({
    onSwipeRight: onSwipeBack,
  }, {
    threshold: 80,
    velocityThreshold: 0.2,
  });
}

// 下拉刷新手势Hook
export function usePullToRefresh(onRefresh: () => void) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const isAtTopRef = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      isAtTopRef.current = window.scrollY === 0;
      if (isAtTopRef.current) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTopRef.current) return;
      
      const currentY = e.touches[0].clientY;
      const distance = currentY - startYRef.current;
      
      if (distance > 0 && distance < 150) {
        setIsPulling(true);
        setPullDistance(distance);
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 80) {
        onRefresh();
      }
      setIsPulling(false);
      setPullDistance(0);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, pullDistance]);

  return { isPulling, pullDistance };
}

export default useGestures;
