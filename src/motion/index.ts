// ============================================
// PawSync Pro - Motion Index
// 
// 动效系统统一导出
// ============================================

export * from './variants';
export * from './hooks';

import { variants, springs } from './variants';
import * as hooks from './hooks';

export const motionSystem = {
  variants,
  springs,
  hooks,
};

export type MotionSystem = typeof motionSystem;