// ============================================
// PawSync Pro - Design System Index
// 
// 统一导出入口
// ============================================

// Tokens
export * from './tokens';

// Primitives
export * from './primitives';

// ═══════════════════════════════════════════
// 🎨 Design System 完整导出
// ═══════════════════════════════════════════
import { designTokens } from './tokens';
import { primitives } from './primitives';

export const designSystem = {
  tokens: designTokens,
  primitives,
};

export type DesignSystem = typeof designSystem;