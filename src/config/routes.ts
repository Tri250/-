// ============================================
// PawSync Pro - Route Configuration
//
// 统一路由配置: 路由常量 + 元数据
// 核心功能路由保持不变
// ============================================

import type { ElementType } from 'react';
import {
  Home,
  ClipboardList,
  Heart,
  User,
  Video,
  Languages,
  BellRing,
  Brain,
  Stethoscope,
  Activity,
  Camera,
  Monitor,
  BookOpen,
  Shield,
  Smile,
  Award,
  ClipboardCheck,
  FileHeart,
  Dumbbell,
  ShoppingBag,
  Bookmark,
  Ticket,
  MessageCircle,
  Settings,
  HelpCircle,
  Info,
  Share2,
  Sparkles,
} from 'lucide-react';

// ============================================
// 🔀 路由常量 (保持与现有 switch 一致)
// ============================================
export const ROUTES = {
  HOME: 'home',
  PETS: 'pets',
  TRANSLATOR: 'translator',
  HEALTH: 'health',
  AI_CONSULTANT: 'ai-consultant',
  HEALTH_RECORDS: 'health-records',
  HEALTH_MANUAL: 'health-manual',
  REMINDERS: 'reminders',
  TRAINING: 'training',
  SERVICES: 'services',
  INSURANCE: 'insurance',
  MEDICAL: 'medical',
  PROFILE: 'profile',
  CAMERA: 'camera',
  MONITOR: 'monitor',
  ADVANCED_HEALTH: 'advanced-health',
  BOND_EMOTION: 'bond-emotion',
  CAMERA_MONITOR: 'camera-monitor',
  HEALTH_REPORT: 'health-report',
  SETTINGS: 'settings',
  FAVORITES: 'favorites',
  HELP_FEEDBACK: 'help-feedback',
  DEVELOPER_INFO: 'developer-info',
  HISTORY: 'history',
} as const;

export type RouteId = typeof ROUTES[keyof typeof ROUTES];

// ============================================
// 📋 路由元数据 (统一配置源)
// ============================================
export interface RouteMeta {
  id: RouteId;
  title: string;
  subtitle?: string;
  icon: ElementType;
  description?: string;
  /** 是否底部Tab */
  isBottomTab?: boolean;
  /** Tab顺序 */
  tabOrder?: number;
  /** 是否在首页快捷入口 */
  isHomeShortcut?: boolean;
  /** 是否健康相关模块 */
  isHealthModule?: boolean;
  /** 是否设置类页面 */
  isSettingsPage?: boolean;
  /** 面包屑父级 */
  parent?: RouteId;
  /** 强调色 (用于图标背景) */
  accent?: string;
}

export const routeMeta: Record<RouteId, RouteMeta> = {
  // === 底部 4 Tab ===
  [ROUTES.HOME]: {
    id: ROUTES.HOME,
    title: '首页',
    subtitle: '爪爪连心',
    icon: Home,
    description: '核心功能入口',
    isBottomTab: true,
    tabOrder: 1,
    accent: 'from-orange-100 to-amber-100',
  },
  [ROUTES.HEALTH_RECORDS]: {
    id: ROUTES.HEALTH_RECORDS,
    title: '记录',
    subtitle: '成长时光',
    icon: ClipboardList,
    description: '宠物每日记录',
    isBottomTab: true,
    tabOrder: 2,
    accent: 'from-rose-100 to-pink-100',
  },
  [ROUTES.HEALTH]: {
    id: ROUTES.HEALTH,
    title: '健康',
    subtitle: '健康监测',
    icon: Heart,
    description: '健康状态与趋势',
    isBottomTab: true,
    tabOrder: 3,
    accent: 'from-emerald-100 to-teal-100',
  },
  [ROUTES.PROFILE]: {
    id: ROUTES.PROFILE,
    title: '我的',
    subtitle: '个人中心',
    icon: User,
    description: '账户与设置',
    isBottomTab: true,
    tabOrder: 4,
    accent: 'from-violet-100 to-purple-100',
  },

  // === 首页快捷入口 ===
  [ROUTES.CAMERA_MONITOR]: {
    id: ROUTES.CAMERA_MONITOR,
    title: '实时监控',
    subtitle: '宠物动态',
    icon: Video,
    description: '查看宠物实时画面',
    isHomeShortcut: true,
    accent: 'from-blue-100 to-cyan-100',
  },
  [ROUTES.TRANSLATOR]: {
    id: ROUTES.TRANSLATOR,
    title: '情感翻译',
    subtitle: '懂你所想',
    icon: Languages,
    description: 'AI解析宠物情绪',
    isHomeShortcut: true,
    accent: 'from-violet-100 to-purple-100',
  },
  [ROUTES.REMINDERS]: {
    id: ROUTES.REMINDERS,
    title: '智能提醒',
    subtitle: '定时关怀',
    icon: BellRing,
    description: '重要事项不遗漏',
    isHomeShortcut: true,
    accent: 'from-amber-100 to-orange-100',
  },
  [ROUTES.AI_CONSULTANT]: {
    id: ROUTES.AI_CONSULTANT,
    title: '健康顾问',
    subtitle: 'AI医生',
    icon: Brain,
    description: '24h智能健康咨询',
    isHomeShortcut: true,
    accent: 'from-emerald-100 to-teal-100',
  },

  // === 健康模块 ===
  [ROUTES.HEALTH_MANUAL]: {
    id: ROUTES.HEALTH_MANUAL,
    title: '健康手册',
    icon: BookOpen,
    description: '健康知识百科',
    isHealthModule: true,
    parent: ROUTES.HEALTH,
    accent: 'from-sky-100 to-blue-100',
  },
  [ROUTES.ADVANCED_HEALTH]: {
    id: ROUTES.ADVANCED_HEALTH,
    title: '高级健康',
    icon: Shield,
    description: '深度健康分析',
    isHealthModule: true,
    parent: ROUTES.HEALTH,
    accent: 'from-indigo-100 to-violet-100',
  },
  [ROUTES.BOND_EMOTION]: {
    id: ROUTES.BOND_EMOTION,
    title: '情感纽带',
    icon: Smile,
    description: '记录情感互动',
    isHealthModule: true,
    parent: ROUTES.HEALTH,
    accent: 'from-pink-100 to-rose-100',
  },
  [ROUTES.HEALTH_REPORT]: {
    id: ROUTES.HEALTH_REPORT,
    title: '健康报告',
    icon: FileHeart,
    description: '健康状态报告',
    isHealthModule: true,
    parent: ROUTES.HEALTH,
    accent: 'from-teal-100 to-emerald-100',
  },

  // === 设备 / 工具 ===
  [ROUTES.CAMERA]: {
    id: ROUTES.CAMERA,
    title: '摄像头',
    icon: Camera,
    description: '拍摄与上传',
    parent: ROUTES.CAMERA_MONITOR,
    accent: 'from-slate-100 to-gray-100',
  },
  [ROUTES.MONITOR]: {
    id: ROUTES.MONITOR,
    title: '监视器',
    icon: Monitor,
    description: '实时画面监控',
    parent: ROUTES.CAMERA_MONITOR,
    accent: 'from-slate-100 to-gray-100',
  },

  // === 服务 ===
  [ROUTES.TRAINING]: {
    id: ROUTES.TRAINING,
    title: '训练',
    icon: Dumbbell,
    description: '训练课程',
    parent: ROUTES.SERVICES,
    accent: 'from-amber-100 to-orange-100',
  },
  [ROUTES.SERVICES]: {
    id: ROUTES.SERVICES,
    title: '服务订单',
    icon: ShoppingBag,
    description: '订购的服务',
    parent: ROUTES.PROFILE,
    accent: 'from-orange-100 to-amber-100',
  },
  [ROUTES.INSURANCE]: {
    id: ROUTES.INSURANCE,
    title: '保险',
    icon: Shield,
    description: '宠物保险',
    parent: ROUTES.SERVICES,
    accent: 'from-cyan-100 to-sky-100',
  },
  [ROUTES.MEDICAL]: {
    id: ROUTES.MEDICAL,
    title: '医疗',
    icon: Stethoscope,
    description: '医疗服务',
    parent: ROUTES.SERVICES,
    accent: 'from-rose-100 to-pink-100',
  },
  [ROUTES.FAVORITES]: {
    id: ROUTES.FAVORITES,
    title: '收藏夹',
    icon: Bookmark,
    description: '收藏的内容',
    parent: ROUTES.PROFILE,
    accent: 'from-emerald-100 to-teal-100',
  },

  // === 设置 ===
  [ROUTES.PETS]: {
    id: ROUTES.PETS,
    title: '宠物档案',
    icon: Activity,
    description: '宠物信息管理',
    parent: ROUTES.PROFILE,
    accent: 'from-blue-100 to-cyan-100',
  },
  [ROUTES.SETTINGS]: {
    id: ROUTES.SETTINGS,
    title: '应用设置',
    icon: Settings,
    description: '个性化配置',
    isSettingsPage: true,
    parent: ROUTES.PROFILE,
    accent: 'from-slate-100 to-gray-100',
  },
  [ROUTES.HELP_FEEDBACK]: {
    id: ROUTES.HELP_FEEDBACK,
    title: '帮助与反馈',
    icon: HelpCircle,
    description: '寻求帮助',
    isSettingsPage: true,
    parent: ROUTES.PROFILE,
    accent: 'from-rose-100 to-pink-100',
  },
  [ROUTES.DEVELOPER_INFO]: {
    id: ROUTES.DEVELOPER_INFO,
    title: '关于我们',
    icon: Info,
    description: '应用信息',
    isSettingsPage: true,
    parent: ROUTES.PROFILE,
    accent: 'from-neutral-100 to-slate-100',
  },

  // === 其他 ===
  [ROUTES.HISTORY]: {
    id: ROUTES.HISTORY,
    title: '翻译历史',
    icon: MessageCircle,
    description: '历史翻译记录',
    parent: ROUTES.TRANSLATOR,
    accent: 'from-violet-100 to-purple-100',
  },
};

// ============================================
// 🎯 快捷查找函数
// ============================================
export const getRoute = (id: RouteId): RouteMeta => routeMeta[id];

export const getBottomTabs = (): RouteMeta[] =>
  Object.values(routeMeta)
    .filter((r) => r.isBottomTab)
    .sort((a, b) => (a.tabOrder ?? 99) - (b.tabOrder ?? 99));

export const getHomeShortcuts = (): RouteMeta[] =>
  Object.values(routeMeta).filter((r) => r.isHomeShortcut);

export const getHealthModules = (): RouteMeta[] =>
  Object.values(routeMeta).filter((r) => r.isHealthModule);

export const getBreadcrumb = (id: RouteId): RouteMeta[] => {
  const chain: RouteMeta[] = [];
  let current: RouteId | undefined = id;
  const visited = new Set<RouteId>();
  while (current && !visited.has(current)) {
    visited.add(current);
    const meta = routeMeta[current];
    if (meta) chain.unshift(meta);
    current = meta.parent;
  }
  return chain;
};

export const isBottomTab = (id: string): boolean =>
  Object.values(routeMeta).some((r) => r.isBottomTab && r.id === id);

export const getRouteTitle = (id: string): string => {
  const meta = routeMeta[id as RouteId];
  return meta?.title || '爪爪连心';
};

// ============================================
// 🔘 FAB 快捷动作 (中间"+"号展开项)
// ============================================
export interface FabAction {
  id: string;
  label: string;
  icon: ElementType;
  route?: RouteId;
  action?: () => void;
  /** 渐变背景 */
  gradient: string;
  /** 说明 */
  hint: string;
}

export const fabActions: FabAction[] = [
  {
    id: 'new-record',
    label: '新建记录',
    icon: ClipboardCheck,
    route: ROUTES.HEALTH_RECORDS,
    gradient: 'from-orange-400 to-amber-500',
    hint: '记录今日状态',
  },
  {
    id: 'translate',
    label: '情感翻译',
    icon: Languages,
    route: ROUTES.TRANSLATOR,
    gradient: 'from-violet-400 to-purple-500',
    hint: 'AI 解析宠物情绪',
  },
  {
    id: 'ai-help',
    label: 'AI 问诊',
    icon: Stethoscope,
    route: ROUTES.AI_CONSULTANT,
    gradient: 'from-emerald-400 to-teal-500',
    hint: '智能健康顾问',
  },
  {
    id: 'achievement',
    label: '勋章',
    icon: Award,
    gradient: 'from-pink-400 to-rose-500',
    hint: '查看成就徽章',
  },
];

// ============================================
// ✨ 统一导出
// ============================================
export const routeConfig = {
  ROUTES,
  meta: routeMeta,
  bottomTabs: getBottomTabs(),
  homeShortcuts: getHomeShortcuts(),
  healthModules: getHealthModules(),
  fabActions,
  helpers: {
    getRoute,
    getBreadcrumb,
    isBottomTab,
    getRouteTitle,
  },
};

export default routeConfig;
