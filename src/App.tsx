// ============================================
// PawSync Pro - App.tsx
//
// 应用主入口组件
// 路由: 状态驱动 (state-based routing)
// 配置: src/config/routes.ts
// ============================================

import { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { useAppStore } from './store/appStore';
import { PawPrint } from 'lucide-react';
import { useDeviceCapabilities, applyPerformanceClass } from './utils/performanceDetection';
import { routeConfig, ROUTES } from './config/routes';

// 懒加载其他页面 (性能优化)
const TranslatorPage = lazy(() => import('./pages/TranslatorPage'));
const HealthPage = lazy(() => import('./pages/HealthPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CameraPage = lazy(() => import('./pages/CameraPage'));
const MonitorPage = lazy(() => import('./pages/MonitorPage'));
const TrainingPage = lazy(() => import('./pages/TrainingPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const InsurancePage = lazy(() => import('./pages/InsurancePage'));
const MedicalPage = lazy(() => import('./pages/MedicalPage'));
const AIConsultantPage = lazy(() => import('./pages/AIConsultantPage'));
const HealthRecordsPage = lazy(() => import('./pages/HealthRecordsPage'));
const HealthManualPage = lazy(() => import('./pages/HealthManualPage'));
const RemindersPage = lazy(() => import('./pages/RemindersPage'));
const AdvancedHealthPage = lazy(() => import('./pages/AdvancedHealthPage'));
const BondEmotionPage = lazy(() => import('./pages/BondEmotionPage'));
const CameraMonitorPage = lazy(() => import('./pages/CameraMonitorPage'));
const PetsPage = lazy(() => import('./pages/PetsPage'));
const HealthReportPage = lazy(() => import('./pages/HealthReportPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const HelpFeedbackPage = lazy(() => import('./pages/HelpFeedbackPage'));
const DeveloperInfoPage = lazy(() => import('./pages/DeveloperInfoPage'));

// 页面加载占位符
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-cream-50">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-14 h-14 border-4 border-orange-200 border-t-primary-400 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <PawPrint className="w-6 h-6 text-primary-400" />
        </div>
      </div>
      <p className="text-neutral-500 text-sm font-medium">加载中...</p>
    </div>
  </div>
);

// 启动加载页
function LoadingScreen({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 flex flex-col items-center justify-center p-4">
      <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-rose-400 rounded-3xl flex items-center justify-center mb-6 shadow-[0_8px_32px_rgba(251,146,60,0.4)]">
        <PawPrint className="w-12 h-12 text-white" strokeWidth={2.2} />
      </div>
      <h1 className="text-2xl font-bold text-neutral-800 mb-1">爪爪连心</h1>
      <p className="text-neutral-500 mb-8 text-sm">关爱每一只毛孩子</p>

      <div className="w-64 bg-white rounded-full h-1.5 mb-3 overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-orange-400 to-rose-400"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-neutral-500 font-medium">{message}</p>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(ROUTES.HOME);
  const { isInitialized, initProgress, initMessage, initializeApp, settings } = useAppStore();

  // 设备能力检测
  const capabilities = useDeviceCapabilities();

  useEffect(() => {
    if (!isInitialized) initializeApp();
  }, [isInitialized, initializeApp]);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // 应用性能类
  useEffect(() => {
    applyPerformanceClass(capabilities);
  }, [capabilities]);

  // 导航回调
  const goTo = useCallback((page: string) => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setCurrentPage(page);
  }, []);

  const goBack = useCallback(() => {
    goTo(ROUTES.HOME);
  }, [goTo]);

  if (!isInitialized) {
    return <LoadingScreen progress={initProgress} message={initMessage} />;
  }

  // 渲染当前页面 (核心路由保持不变)
  const renderPage = () => {
    switch (currentPage) {
      case ROUTES.HOME:
        return <HomePage onNavigate={goTo} />;
      case ROUTES.PETS:
        return <PetsPage onNavigate={goTo} />;
      case ROUTES.TRANSLATOR:
        return <TranslatorPage />;
      case ROUTES.HEALTH:
        return <HealthPage />;
      case ROUTES.AI_CONSULTANT:
        return <AIConsultantPage onNavigate={goTo} />;
      case ROUTES.HEALTH_RECORDS:
        return <HealthRecordsPage onNavigate={goTo} />;
      case ROUTES.HEALTH_MANUAL:
        return <HealthManualPage onNavigate={goTo} />;
      case ROUTES.REMINDERS:
        return <RemindersPage onNavigate={goTo} />;
      case ROUTES.TRAINING:
        return <TrainingPage />;
      case ROUTES.SERVICES:
        return <ServicesPage onNavigate={goTo} />;
      case ROUTES.INSURANCE:
        return <InsurancePage />;
      case ROUTES.MEDICAL:
        return <MedicalPage />;
      case ROUTES.PROFILE:
        return <ProfilePage onNavigate={goTo} />;
      case ROUTES.CAMERA:
        return <CameraPage />;
      case ROUTES.MONITOR:
        return <MonitorPage />;
      case ROUTES.ADVANCED_HEALTH:
        return <AdvancedHealthPage onNavigate={goTo} />;
      case ROUTES.BOND_EMOTION:
        return <BondEmotionPage />;
      case ROUTES.CAMERA_MONITOR:
        return <CameraMonitorPage onNavigate={goTo} />;
      case ROUTES.HEALTH_REPORT:
        return <HealthReportPage onNavigate={goTo} />;
      case ROUTES.SETTINGS:
        return <SettingsPage onNavigate={goTo} />;
      case ROUTES.FAVORITES:
        return <FavoritesPage onNavigate={goTo} />;
      case ROUTES.HELP_FEEDBACK:
        return <HelpFeedbackPage onNavigate={goTo} />;
      case ROUTES.DEVELOPER_INFO:
        return <DeveloperInfoPage onNavigate={goTo} />;
      case ROUTES.HISTORY:
        return <TranslatorPage />;
      default:
        return <HomePage onNavigate={goTo} />;
    }
  };

  // 将 goBack 传给需要返回的页面
  // (通过 routeConfig 判断是否为底部 Tab)
  const hasBack = !routeConfig.helpers.isBottomTab(currentPage);

  return (
    <div className={`min-h-screen ${settings.darkMode ? 'bg-gray-900' : 'bg-cream-50'}`}>
      {/* 统一返回按钮: 通过 context/prop 模式传递给各页面 */}
      <Suspense fallback={<PageLoader />}>
        {renderPage()}
      </Suspense>

      <Navigation currentPage={currentPage} onNavigate={goTo} />
    </div>
  );
}
