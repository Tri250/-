// ============================================
// PawSync Pro - Primitives Index
// 
// 导出所有原子组件
// ============================================

export {
  LiquidGlass,
  GlassCard,
  GlassButton,
  GlassModal,
  GlassToolbar,
  GlassTabBar,
} from './LiquidGlass';
export type { LiquidGlassProps } from './LiquidGlass';

export {
  AnimatedPressable,
  LightPressable,
  StrongPressable,
  BouncyPressable,
} from './AnimatedPressable';
export type { AnimatedPressableProps } from './AnimatedPressable';

export {
  AnimatedCard,
  LightCard,
  FloatingCard,
  StaticCard,
} from './AnimatedCard';
export type { AnimatedCardProps } from './AnimatedCard';

export {
  AnimatedNumber,
  LargeAnimatedNumber,
  SmallAnimatedNumber,
  PercentageNumber,
  TemperatureNumber,
  WeightNumber,
} from './AnimatedNumber';
export type { AnimatedNumberProps } from './AnimatedNumber';

export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonListItem,
  SkeletonStatCard,
  SkeletonPage,
} from './Skeleton';
export type { SkeletonProps } from './Skeleton';

export {
  Toast,
  ToastContainer,
  useToast,
} from './Toast';
export type { ToastType, ToastProps, ToastContainerProps } from './Toast';

// ═══════════════════════════════════════════
// 🎨 统一导出
// ═══════════════════════════════════════════
export const primitives = {
  LiquidGlass: LiquidGlass,
  AnimatedPressable: AnimatedPressable,
  AnimatedCard: AnimatedCard,
  AnimatedNumber: AnimatedNumber,
  Skeleton: Skeleton,
  Toast: Toast,
};