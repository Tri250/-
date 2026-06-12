// ============================================
// PawSync Pro - Design Tokens Index
// 
// 导出所有设计Token
// ============================================

export { colors, gradients, opacity } from './colors';
export type { ColorToken, GradientToken } from './colors';

export { typography, textColors } from './typography';
export type { TypographyToken, TextColorToken } from './typography';

export { spacing, padding, margin, gap } from './spacing';
export type { SpacingToken, PaddingToken, MarginToken, GapToken } from './spacing';

export { radius } from './radius';
export type { RadiusToken } from './radius';

export { shadows } from './shadows';
export type { ShadowToken } from './shadows';

export { motion } from './motion';
export type { MotionToken } from './motion';

export { zIndex } from './z-index';
export type { ZIndexToken } from './z-index';

// ═══════════════════════════════════════════
// 🎨 统一导出 Design System
// ═══════════════════════════════════════════
export const designTokens = {
  colors,
  gradients,
  opacity,
  typography,
  textColors,
  spacing,
  padding,
  margin,
  gap,
  radius,
  shadows,
  motion,
  zIndex,
};

export type DesignTokens = typeof designTokens;