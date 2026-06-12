// ============================================
// PawSync Pro - App.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 应用主入口组件
// ============================================

import { useState, useEffect, Suspense, lazy } from 'react';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { useAppStore } from './store/appStore';
import { PawPrint, Plus, X, Camera, FileText, Activity, Apple, Droplet, Footprints } from 'lucide-react';
import { useDeviceCapabilities, applyPerformanceClass } from './utils/performanceDetection';

// 懒加载其他页面（性能优化）
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
const DevicesPage = lazy(() => import('./pages/DevicesPage'));
const RecordsPage = lazy(() => import('./pages/RecordsPage'));

// 页面加载占位符
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">加载中...</p>
    </div>
  </div>
);

function LoadingScreen({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-peach-50 flex flex-col items-center justify-center p-4">
      <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-peach-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse">
        <PawPrint className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">爪爪连心❤️</h1>
      <p className="text-gray-500 mb-8">爪印同频 · 守护版</p>
      
      <div className="w-64 bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-orange-400 to-peach-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-sm text-gray-600 font-medium">{message}</p>
      
      {progress < 100 && (
        <div className="flex items-center gap-2 mt-4">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const { 
    isInitialized, 
    initProgress, 
    initMessage,
    initializeApp,
    settings
  } = useAppStore();
  
  // 检测设备能力
  const capabilities = useDeviceCapabilities();

  useEffect(() => {
    if (!isInitialized) {
      initializeApp();
    }
  }, [isInitialized, initializeApp]);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);
  
  // 应用性能类到根元素
  useEffect(() => {
    applyPerformanceClass(capabilities);
  }, [capabilities]);

  if (!isInitialized) {
    return <LoadingScreen progress={initProgress} message={initMessage} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'devices':
        return <DevicesPage onNavigate={setCurrentPage} />;
      case 'records':
        return <RecordsPage onNavigate={setCurrentPage} />;
      case 'profile':
        return <ProfilePage onNavigate={setCurrentPage} />;
      case 'pets':
        return <PetsPage onNavigate={setCurrentPage} />;
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
      case 'camera':
        return <CameraPage />;
      case 'monitor':
        return <MonitorPage />;
      case 'advanced-health':
        return <AdvancedHealthPage onNavigate={setCurrentPage} />;
      case 'bond-emotion':
        return <BondEmotionPage />;
      case 'camera-monitor':
        return <CameraMonitorPage onNavigate={setCurrentPage} />;
      case 'health-report':
        return <HealthReportPage onNavigate={setCurrentPage} />;
      case 'settings':
        return <SettingsPage onNavigate={setCurrentPage} />;
      case 'favorites':
        return <FavoritesPage onNavigate={setCurrentPage} />;
      case 'help-feedback':
        return <HelpFeedbackPage onNavigate={setCurrentPage} />;
      case 'developer-info':
        return <DeveloperInfoPage onNavigate={setCurrentPage} />;
      case 'history':
        return <TranslatorPage />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  const addRecordTypes = [
    { icon: Apple, label: '喂食', color: '#f59e0b', bg: '#fef3c7' },
    { icon: Droplet, label: '饮水', color: '#3b82f6', bg: '#dbeafe' },
    { icon: Footprints, label: '活动', color: '#10b981', bg: '#d1fae5' },
    { icon: Activity, label: '健康', color: '#a78bfa', bg: '#ede9fe' },
    { icon: FileText, label: '其他', color: '#fbbf24', bg: '#fef3c7' },
  ];

  return (
    <div className={`min-h-screen ${settings.darkMode ? 'bg-gray-900' : ''}`}>
      <Suspense fallback={<PageLoader />}>
        {renderPage()}
      </Suspense>
      <BottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onAdd={() => setShowAddSheet(true)}
      />

      {/* 添加记录底部弹窗 */}
      {showAddSheet && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
          onClick={() => setShowAddSheet(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">添加记录</h3>
              <button
                onClick={() => setShowAddSheet(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {addRecordTypes.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setShowAddSheet(false);
                      setCurrentPage('records');
                    }}
                    className="flex flex-col items-center gap-2 active:scale-95"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: item.bg }}
                    >
                      <Icon className="w-7 h-7" style={{ color: item.color }} strokeWidth={2} />
                    </div>
                    <span className="text-xs text-gray-700 font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}