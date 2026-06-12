/**
 * Apple Style Animation Library - Apple风格动画库
 *
 * 提供Apple级别的流畅动画效果
 * 包括：页面过渡、手势动画、微交互等
 */

import { Capacitor } from '@capacitor/core';

// 动画配置
export const AnimationConfig = {
  // 动画时长
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 700,
  },
  
  // 动画曲线
  easing: {
    linear: 'linear',
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
    // Apple 特殊曲线
    spring: [0.175, 0.885, 0.32, 1.275],
    bounce: [0.68, -0.55, 0.265, 1.55],
    smooth: [0.25, 0.1, 0.25, 1],
    ios: [0.23, 1, 0.32, 1],
    iosModal: [0.4, 0, 0.2, 1],
    iosSheet: [0.32, 0.72, 0, 1],
  },
  
  // 原生平台优化
  native: {
    useHardwareAcceleration: true,
    useWillChange: true,
  },
};

// 检测是否为原生平台
const isNative = () => Capacitor.isNativePlatform();

// 将贝塞尔曲线转换为CSS格式
const bezierToCSS = (bezier: number[]) => 
  `cubic-bezier(${bezier.join(', ')})`;

/**
 * 页面过渡动画
 */
export const PageTransitions = {
  // iOS 风格页面推入
  push: {
    enter: {
      opacity: [0, 1],
      transform: ['translateX(100%)', 'translateX(0)'],
      duration: AnimationConfig.duration.slow,
      easing: AnimationConfig.easing.ios,
    },
    exit: {
      opacity: [1, 0],
      transform: ['translateX(0)', 'translateX(-30%)'],
      duration: AnimationConfig.duration.slow,
      easing: AnimationConfig.easing.ios,
    },
  },
  
  // iOS 风格页面弹出
  pop: {
    enter: {
      opacity: [0, 1],
      transform: ['translateX(-30%)', 'translateX(0)'],
      duration: AnimationConfig.duration.slow,
      easing: AnimationConfig.easing.ios,
    },
    exit: {
      opacity: [1, 0],
      transform: ['translateX(0)', 'translateX(100%)'],
      duration: AnimationConfig.duration.slow,
      easing: AnimationConfig.easing.ios,
    },
  },
  
  // 模态框弹出
  modal: {
    enter: {
      opacity: [0, 1],
      transform: ['translateY(100%)', 'translateY(0)'],
      duration: AnimationConfig.duration.slow,
      easing: AnimationConfig.easing.iosModal,
    },
    exit: {
      opacity: [1, 0],
      transform: ['translateY(0)', 'translateY(100%)'],
      duration: AnimationConfig.duration.normal,
      easing: AnimationConfig.easing.iosModal,
    },
  },
  
  // 底部弹出面板
  sheet: {
    enter: {
      opacity: [0, 1],
      transform: ['translateY(100%)', 'translateY(0)'],
      duration: AnimationConfig.duration.slow,
      easing: AnimationConfig.easing.iosSheet,
    },
    exit: {
      opacity: [1, 0],
      transform: ['translateY(0)', 'translateY(100%)'],
      duration: AnimationConfig.duration.normal,
      easing: AnimationConfig.easing.iosSheet,
    },
  },
  
  // 淡入淡出
  fade: {
    enter: {
      opacity: [0, 1],
      duration: AnimationConfig.duration.normal,
      easing: AnimationConfig.easing.easeOut,
    },
    exit: {
      opacity: [1, 0],
      duration: AnimationConfig.duration.fast,
      easing: AnimationConfig.easing.easeIn,
    },
  },
};

/**
 * 微交互动画
 */
export const MicroInteractions = {
  // 按钮点击
  buttonPress: {
    scale: [1, 0.97],
    duration: AnimationConfig.duration.fast,
    easing: AnimationConfig.easing.ios,
  },
  
  // 按钮释放
  buttonRelease: {
    scale: [0.97, 1],
    duration: AnimationConfig.duration.fast,
    easing: AnimationConfig.easing.spring,
  },
  
  // 卡片悬停
  cardHover: {
    transform: ['translateY(0)', 'translateY(-2px)'],
    boxShadow: [
      '0 2px 8px rgba(0,0,0,0.04)',
      '0 8px 16px rgba(0,0,0,0.08)',
    ],
    duration: AnimationConfig.duration.normal,
    easing: AnimationConfig.easing.ios,
  },
  
  // 列表项点击
  listItemPress: {
    opacity: [1, 0.7],
    duration: AnimationConfig.duration.fast,
    easing: AnimationConfig.easing.ios,
  },
  
  // 开关切换
  toggleSwitch: {
    transform: ['translateX(0)', 'translateX(20px)'],
    duration: AnimationConfig.duration.normal,
    easing: AnimationConfig.easing.spring,
  },
  
  // 图标旋转
  iconRotate: {
    transform: ['rotate(0deg)', 'rotate(180deg)'],
    duration: AnimationConfig.duration.normal,
    easing: AnimationConfig.easing.ios,
  },
  
  // 数字变化
  numberChange: {
    opacity: [0, 1],
    transform: ['translateY(-10px)', 'translateY(0)'],
    duration: AnimationConfig.duration.normal,
    easing: AnimationConfig.easing.spring,
  },
};

/**
 * 手势动画
 */
export const GestureAnimations = {
  // 拖拽跟随
  dragFollow: {
    transform: 'translateX(x) translateY(y)',
    duration: AnimationConfig.duration.instant,
    easing: AnimationConfig.easing.linear,
  },
  
  // 拖拽释放回弹
  dragRelease: {
    transform: ['translateX(x) translateY(y)', 'translateX(0) translateY(0)'],
    duration: AnimationConfig.duration.slow,
    easing: AnimationConfig.easing.spring,
  },
  
  // 滑动删除
  swipeDelete: {
    opacity: [1, 0],
    transform: ['translateX(0)', 'translateX(-100%)'],
    height: ['auto', '0'],
    duration: AnimationConfig.duration.normal,
    easing: AnimationConfig.easing.ios,
  },
  
  // 滑动取消
  swipeCancel: {
    transform: ['translateX(x)', 'translateX(0)'],
    duration: AnimationConfig.duration.normal,
    easing: AnimationConfig.easing.spring,
  },
};

/**
 * 加载动画
 */
export const LoadingAnimations = {
  // 骨架屏
  skeleton: {
    backgroundPosition: ['-200% 0', '200% 0'],
    duration: AnimationConfig.duration.slower,
    easing: AnimationConfig.easing.linear,
    iterations: Infinity,
  },
  
  // 进度条
  progress: {
    width: ['0%', '100%'],
    duration: AnimationConfig.duration.slowest,
    easing: AnimationConfig.easing.easeInOut,
  },
  
  // 旋转加载
  spinner: {
    transform: ['rotate(0deg)', 'rotate(360deg)'],
    duration: 1000,
    easing: AnimationConfig.easing.linear,
    iterations: Infinity,
  },
  
  // 脉冲
  pulse: {
    opacity: [1, 0.5, 1],
    scale: [1, 1.05, 1],
    duration: AnimationConfig.duration.slower,
    easing: AnimationConfig.easing.easeInOut,
    iterations: Infinity,
  },
};

/**
 * 反馈动画
 */
export const FeedbackAnimations = {
  // 成功反馈
  success: {
    opacity: [0, 1],
    scale: [0.5, 1],
    duration: AnimationConfig.duration.normal,
    easing: AnimationConfig.easing.spring,
  },
  
  // 错误抖动
  errorShake: {
    transform: [
      'translateX(0)',
      'translateX(-10px)',
      'translateX(10px)',
      'translateX(-10px)',
      'translateX(10px)',
      'translateX(0)',
    ],
    duration: AnimationConfig.duration.slow,
    easing: AnimationConfig.easing.easeInOut,
  },
  
  // 警告闪烁
  warningFlash: {
    opacity: [1, 0.3, 1],
    duration: AnimationConfig.duration.normal,
    easing: AnimationConfig.easing.easeInOut,
  },
  
  // 点赞动画
  like: {
    scale: [1, 1.3, 1],
    duration: AnimationConfig.duration.normal,
    easing: AnimationConfig.easing.bounce,
  },
};

/**
 * 动画执行器
 */
export class AnimationExecutor {
  private element: HTMLElement;
  private useNative: boolean;

  constructor(element: HTMLElement) {
    this.element = element;
    this.useNative = isNative();
  }

  // 执行动画
  animate(config: {
    opacity?: [number, number];
    transform?: [string, string];
    scale?: [number, number];
    boxShadow?: [string, string];
    width?: [string, string];
    height?: [string, string];
    backgroundPosition?: [string, string];
    duration: number;
    easing: number[] | string;
    iterations?: number;
    fill?: 'none' | 'forwards' | 'backwards' | 'both';
    delay?: number;
  }): Promise<void> {
    return new Promise((resolve) => {
      const keyframes: Keyframe[] = [];
      
      // 构建起始帧
      const startFrame: Keyframe = {};
      const endFrame: Keyframe = { offset: 1 };
      
      if (config.opacity) {
        startFrame.opacity = config.opacity[0];
        endFrame.opacity = config.opacity[1];
      }
      
      if (config.transform) {
        startFrame.transform = config.transform[0];
        endFrame.transform = config.transform[1];
      }
      
      if (config.scale) {
        startFrame.transform = `scale(${config.scale[0]})`;
        endFrame.transform = `scale(${config.scale[1]})`;
      }
      
      if (config.boxShadow) {
        startFrame.boxShadow = config.boxShadow[0];
        endFrame.boxShadow = config.boxShadow[1];
      }
      
      if (config.width) {
        startFrame.width = config.width[0];
        endFrame.width = config.width[1];
      }
      
      if (config.height) {
        startFrame.height = config.height[0];
        endFrame.height = config.height[1];
      }
      
      if (config.backgroundPosition) {
        startFrame.backgroundPosition = config.backgroundPosition[0];
        endFrame.backgroundPosition = config.backgroundPosition[1];
      }
      
      keyframes.push(startFrame, endFrame);
      
      // 动画选项
      const options: KeyframeAnimationOptions = {
        duration: config.duration,
        easing: typeof config.easing === 'string' 
          ? config.easing 
          : bezierToCSS(config.easing),
        fill: config.fill || 'forwards',
        iterations: config.iterations || 1,
        delay: config.delay || 0,
      };
      
      // 原生平台优化
      if (this.useNative && AnimationConfig.native.useHardwareAcceleration) {
        this.element.style.willChange = 'transform, opacity';
      }
      
      // 执行动画
      const animation = this.element.animate(keyframes, options);
      
      animation.onfinish = () => {
        if (this.useNative) {
          this.element.style.willChange = 'auto';
        }
        resolve();
      };
    });
  }

  // 快捷方法
  fadeIn(duration = AnimationConfig.duration.normal): Promise<void> {
    return this.animate({
      opacity: [0, 1],
      duration,
      easing: AnimationConfig.easing.easeOut,
    });
  }

  fadeOut(duration = AnimationConfig.duration.fast): Promise<void> {
    return this.animate({
      opacity: [1, 0],
      duration,
      easing: AnimationConfig.easing.easeIn,
    });
  }

  slideUp(duration = AnimationConfig.duration.slow): Promise<void> {
    return this.animate({
      opacity: [0, 1],
      transform: ['translateY(100%)', 'translateY(0)'],
      duration,
      easing: AnimationConfig.easing.iosModal,
    });
  }

  slideDown(duration = AnimationConfig.duration.slow): Promise<void> {
    return this.animate({
      opacity: [0, 1],
      transform: ['translateY(-100%)', 'translateY(0)'],
      duration,
      easing: AnimationConfig.easing.iosModal,
    });
  }

  scaleIn(duration = AnimationConfig.duration.normal): Promise<void> {
    return this.animate({
      opacity: [0, 1],
      scale: [0.9, 1],
      duration,
      easing: AnimationConfig.easing.spring,
    });
  }

  scaleOut(duration = AnimationConfig.duration.fast): Promise<void> {
    return this.animate({
      opacity: [1, 0],
      scale: [1, 0.9],
      duration,
      easing: AnimationConfig.easing.easeIn,
    });
  }

  bounce(duration = AnimationConfig.duration.slow): Promise<void> {
    return this.animate({
      scale: [1, 1.1, 1],
      duration,
      easing: AnimationConfig.easing.bounce,
    });
  }

  shake(duration = AnimationConfig.duration.slow): Promise<void> {
    return this.animate({
      transform: [
        'translateX(0)',
        'translateX(-10px)',
        'translateX(10px)',
        'translateX(-10px)',
        'translateX(10px)',
        'translateX(0)',
      ],
      duration,
      easing: AnimationConfig.easing.easeInOut,
    });
  }

  press(): Promise<void> {
    return this.animate({
      scale: [1, 0.97],
      duration: AnimationConfig.duration.fast,
      easing: AnimationConfig.easing.ios,
    });
  }

  release(): Promise<void> {
    return this.animate({
      scale: [0.97, 1],
      duration: AnimationConfig.duration.fast,
      easing: AnimationConfig.easing.spring,
    });
  }
}

/**
 * 创建动画执行器
 */
export const createAnimation = (element: HTMLElement) => 
  new AnimationExecutor(element);

/**
 * 批量动画
 */
export const animateAll = async (
  elements: HTMLElement[],
  animationFn: (executor: AnimationExecutor) => Promise<void>
): Promise<void> => {
  const promises = elements.map(el => animationFn(new AnimationExecutor(el)));
  await Promise.all(promises);
};

/**
 * 顺序动画
 */
export const animateSequence = async (
  elements: HTMLElement[],
  animationFn: (executor: AnimationExecutor) => Promise<void>,
  delay = AnimationConfig.duration.fast
): Promise<void> => {
  for (let i = 0; i < elements.length; i++) {
    await animationFn(new AnimationExecutor(elements[i]));
    if (i < elements.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * React Hook - 使用动画
 */
export const useAnimation = () => {
  const createExecutor = (element: HTMLElement | null) => {
    if (!element) return null;
    return new AnimationExecutor(element);
  };

  return {
    createExecutor,
    config: AnimationConfig,
    transitions: PageTransitions,
    micro: MicroInteractions,
    gestures: GestureAnimations,
    loading: LoadingAnimations,
    feedback: FeedbackAnimations,
  };
};