// ============================================
// PawSync Pro - App.tsx
// 
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 应用主入口组件
// ============================================

import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { TranslatorPage } from './pages/TranslatorPage';
import { HealthPage } from './pages/HealthPage';
import { ProfilePage } from './pages/ProfilePage';
import { CameraPage } from './pages/CameraPage';
import { MonitorPage } from './pages/MonitorPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TrainingPage } from './pages/TrainingPage';
import { ServicesPage } from './pages/ServicesPage';
import { InsurancePage } from './pages/InsurancePage';
import { MedicalPage } from './pages/MedicalPage';
import { AIConsultantPage } from './pages/AIConsultantPage';
import { HealthRecordsPage } from './pages/HealthRecordsPage';
import { HealthManualPage } from './pages/HealthManualPage';
import { RemindersPage } from './pages/RemindersPage';
import { AdvancedHealthPage } from './pages/AdvancedHealthPage';
import { BondEmotionPage } from './pages/BondEmotionPage';
import { CameraMonitorPage } from './pages/CameraMonitorPage';
import VoiceAnalysis from './pages/VoiceAnalysis';
import HealthManagement from './pages/HealthManagement';
import FoodAnalysis from './pages/FoodAnalysis';
import BehaviorAnalysis from './pages/BehaviorAnalysis';
import { useAppStore } from './store/appStore';

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
        return <HealthPage />;
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
        return <ProfilePage onNavigate={setCurrentPage} />;
      case 'camera':
        return <CameraPage />;
      case 'monitor':
        return <MonitorPage />;
      case 'advanced-health':
        return <AdvancedHealthPage />;
      case 'bond-emotion':
        return <BondEmotionPage />;
      case 'camera-monitor':
        return <CameraMonitorPage />;
      case 'voice-analysis':
        return <VoiceAnalysis />;
      case 'health-management':
        return <HealthManagement />;
      case 'food-analysis':
        return <FoodAnalysis />;
      case 'behavior-analysis':
        return <BehaviorAnalysis />;
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
