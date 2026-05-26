// ============================================
// PawSync Pro - App.tsx
// 
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 应用主入口组件（性能优化版 - 路由懒加载）
// ============================================

import { useState, lazy, Suspense } from 'react';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { TranslatorPage } from './pages/TranslatorPage';
import { HealthPage } from './pages/HealthPage';
import { ProfilePage } from './pages/ProfilePage';
import { CameraPage } from './pages/CameraPage';
import { MonitorPage } from './pages/MonitorPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TrainingPage } from './pages/Training';
import { ServicesPage } from './pages/ServicesPage';
import { InsurancePage } from './pages/InsurancePage';
import { MedicalPage } from './pages/MedicalPage';
import { AIConsultantPage } from './pages/AIConsultantPage';
import { HealthRecordsPage } from './pages/HealthRecordsPage';
import { HealthManualPage } from './pages/HealthManualPage';
import { RemindersPage } from './pages/RemindersPage';
import { useAppStore } from './store/appStore';

// 路由懒加载 - 减少初始加载体积
const AdvancedHealthPage = lazy(() => import('./pages/AdvancedHealthPage'));
const BondEmotionPage = lazy(() => import('./pages/BondEmotionPage'));
const CameraMonitorPage = lazy(() => import('./pages/CameraMonitorPage'));

// 加载中占位组件
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-50">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
  </div>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated, isOnboardingComplete, login, register, completeOnboarding } = useAppStore();

  const handleAuthSuccess = () => {
    // 认证成功，状态已在store中更新
  };

  const handleOnboardingComplete = () => {
    completeOnboarding();
  };

  // 未登录显示认证页面
  if (!isAuthenticated) {
    return <AuthPage onSuccess={handleAuthSuccess} />;
  }

  // 已登录但未完成引导，显示引导页面
  if (!isOnboardingComplete) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'translator':
        return <TranslatorPage />;
      case 'health':
        return (
          <Suspense fallback={<PageLoader />}>
            <AdvancedHealthPage onNavigate={setCurrentPage} />
          </Suspense>
        );
      case 'ai-consultant':
        return <AIConsultantPage onNavigate={setCurrentPage} />;
      case 'health-records':
        return <HealthRecordsPage onNavigate={setCurrentPage} />;
      case 'health-manual':
        return <HealthManualPage onNavigate={setCurrentPage} />;
      case 'reminders':
        return <RemindersPage onNavigate={setCurrentPage} />;
      case 'training':
        return <TrainingPage />;
      case 'services':
        return <ServicesPage onNavigate={setCurrentPage} />;
      case 'insurance':
        return <InsurancePage />;
      case 'medical':
        return <MedicalPage />;
      case 'profile':
        return <ProfilePage />;
      case 'camera':
        return <CameraPage />;
      case 'monitor':
        return (
          <Suspense fallback={<PageLoader />}>
            <CameraMonitorPage onNavigate={setCurrentPage} />
          </Suspense>
        );
      case 'bond':
        return (
          <Suspense fallback={<PageLoader />}>
            <BondEmotionPage onNavigate={setCurrentPage} />
          </Suspense>
        );
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {renderPage()}
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}
