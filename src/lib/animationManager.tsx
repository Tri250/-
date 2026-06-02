import React, { memo, useRef, useEffect, useCallback } from 'react';

interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  iterations?: number;
}

class AnimationManager {
  private static instance: AnimationManager;
  private activeAnimations: Map<string, Animation> = new Map();
  private isBackgrounded = false;
  private reducedMotion = false;

  static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  constructor() {
    this.checkReducedMotion();
    this.setupVisibilityListener();
  }

  private checkReducedMotion(): void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = mediaQuery.matches;
    
    mediaQuery.addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
      if (this.reducedMotion) {
        this.pauseAllAnimations();
      }
    });
  }

  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      this.isBackgrounded = document.hidden;
      
      if (this.isBackgrounded) {
        this.pauseAllAnimations();
      } else {
        this.resumeAllAnimations();
      }
    });
  }

  shouldAnimate(): boolean {
    return !this.reducedMotion && !this.isBackgrounded;
  }

  registerAnimation(key: string, animation: Animation): void {
    this.activeAnimations.set(key, animation);
    
    if (this.isBackgrounded || this.reducedMotion) {
      animation.pause();
    }
  }

  unregisterAnimation(key: string): void {
    const animation = this.activeAnimations.get(key);
    if (animation) {
      animation.cancel();
      this.activeAnimations.delete(key);
    }
  }

  pauseAllAnimations(): void {
    this.activeAnimations.forEach((animation) => {
      try {
        animation.pause();
      } catch {
        console.warn('Failed to pause animation');
      }
    });
  }

  resumeAllAnimations(): void {
    if (this.reducedMotion) return;
    
    this.activeAnimations.forEach((animation) => {
      try {
        animation.play();
      } catch {
        console.warn('Failed to resume animation');
      }
    });
  }

  getActiveAnimationCount(): number {
    return this.activeAnimations.size;
  }

  animate(
    element: HTMLElement,
    keyframes: Keyframe[],
    config: AnimationConfig = {}
  ): Animation | null {
    if (!this.shouldAnimate()) {
      return null;
    }

    const { duration = 300, easing = 'ease-out', delay = 0, iterations = 1 } = config;
    
    const animation = element.animate(keyframes, {
      duration,
      easing,
      delay,
      iterations,
      fill: 'forwards',
    });

    const key = `anim-${Date.now()}-${Math.random()}`;
    this.registerAnimation(key, animation);

    animation.onfinish = () => {
      this.unregisterAnimation(key);
    };

    animation.oncancel = () => {
      this.unregisterAnimation(key);
    };

    return animation;
  }

  fadeIn(element: HTMLElement, duration: number = 300): Animation | null {
    return this.animate(element, [
      { opacity: 0 },
      { opacity: 1 },
    ], { duration });
  }

  fadeOut(element: HTMLElement, duration: number = 300): Animation | null {
    return this.animate(element, [
      { opacity: 1 },
      { opacity: 0 },
    ], { duration });
  }

  slideIn(element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'up', duration: number = 300): Animation | null {
    const transforms: Record<string, string> = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(100%)',
      down: 'translateY(-100%)',
    };

    return this.animate(element, [
      { transform: transforms[direction], opacity: 0 },
      { transform: 'translate(0)', opacity: 1 },
    ], { duration });
  }

  scaleIn(element: HTMLElement, duration: number = 300): Animation | null {
    return this.animate(element, [
      { transform: 'scale(0.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 },
    ], { duration, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' });
  }

  pulse(element: HTMLElement, duration: number = 1000): Animation | null {
    return this.animate(element, [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.05)', opacity: 0.8 },
      { transform: 'scale(1)', opacity: 1 },
    ], { duration, iterations: Infinity });
  }
}

export const animationManager = AnimationManager.getInstance();

interface OptimizedAnimationProps {
  children: React.ReactNode;
  type?: 'fadeIn' | 'slideIn' | 'scaleIn';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  className?: string;
  onAnimationEnd?: () => void;
}

export const OptimizedAnimation = memo(({ 
  children, 
  type = 'fadeIn', 
  direction = 'up',
  duration = 300,
  delay = 0,
  className,
  onAnimationEnd
}: OptimizedAnimationProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !animationManager.shouldAnimate()) {
      return;
    }

    const startAnimation = () => {
      switch (type) {
        case 'fadeIn':
          animationRef.current = animationManager.fadeIn(element, duration);
          break;
        case 'slideIn':
          animationRef.current = animationManager.slideIn(element, direction, duration);
          break;
        case 'scaleIn':
          animationRef.current = animationManager.scaleIn(element, duration);
          break;
      }

      if (animationRef.current && onAnimationEnd) {
        animationRef.current.onfinish = onAnimationEnd;
      }
    };

    if (delay > 0) {
      const timeoutId = setTimeout(startAnimation, delay);
      return () => clearTimeout(timeoutId);
    } else {
      startAnimation();
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
    };
  }, [type, direction, duration, delay, onAnimationEnd]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
});

OptimizedAnimation.displayName = 'OptimizedAnimation';

interface OptimizedTransitionProps {
  children: React.ReactNode;
  in: boolean;
  type?: 'fade' | 'slide' | 'scale';
  duration?: number;
  unmountOnExit?: boolean;
  className?: string;
}

export const OptimizedTransition = memo(({ 
  children, 
  in: show,
  type = 'fade',
  duration = 300,
  unmountOnExit = true,
  className
}: OptimizedTransitionProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(show);
  const animationRef = useRef<Animation | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (show && !isVisible) {
      setIsVisible(true);
      
      if (animationManager.shouldAnimate()) {
        switch (type) {
          case 'fade':
            animationRef.current = animationManager.fadeIn(element, duration);
            break;
          case 'slide':
            animationRef.current = animationManager.slideIn(element, 'up', duration);
            break;
          case 'scale':
            animationRef.current = animationManager.scaleIn(element, duration);
            break;
        }
      }
    } else if (!show && isVisible) {
      if (animationManager.shouldAnimate()) {
        switch (type) {
          case 'fade':
            animationRef.current = animationManager.fadeOut(element, duration);
            break;
          case 'slide':
            animationRef.current = animationManager.slideIn(element, 'down', duration);
            break;
          case 'scale':
            animationRef.current = animationManager.animate(element, [
              { transform: 'scale(1)', opacity: 1 },
              { transform: 'scale(0.8)', opacity: 0 },
            ], { duration });
            break;
        }

        if (animationRef.current) {
          animationRef.current.onfinish = () => {
            if (unmountOnExit) {
              setIsVisible(false);
            }
          };
        }
      } else if (unmountOnExit) {
        setIsVisible(false);
      }
    }
  }, [show, isVisible, type, duration, unmountOnExit]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
    };
  }, []);

  if (!isVisible && unmountOnExit) {
    return null;
  }

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
});

OptimizedTransition.displayName = 'OptimizedTransition';

export const useOptimizedAnimation = () => {
  const animate = useCallback((
    element: HTMLElement,
    keyframes: Keyframe[],
    config?: AnimationConfig
  ) => {
    return animationManager.animate(element, keyframes, config);
  }, []);

  const fadeIn = useCallback((element: HTMLElement, duration?: number) => {
    return animationManager.fadeIn(element, duration);
  }, []);

  const fadeOut = useCallback((element: HTMLElement, duration?: number) => {
    return animationManager.fadeOut(element, duration);
  }, []);

  const shouldAnimate = useCallback(() => {
    return animationManager.shouldAnimate();
  }, []);

  return { animate, fadeIn, fadeOut, shouldAnimate };
};

export const useReducedMotion = (): boolean => {
  const [reducedMotion, setReducedMotion] = React.useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return reducedMotion;
};