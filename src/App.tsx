// ============================================
// PawSync Pro - App.tsx (优化版)
// P0-P1: 集成微交互、深色模式、性能优化
// ============================================

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigation } from './components/Navigation';
import { useAppStore } from './store/appStore';
import { PawPrint } from 'lucide-react';
import { useDeviceCapabilities, applyPerformanceClass } from './utils/performanceDetection';
import { useDarkMode } from './hooks/useDarkMode';
import { lazyRoute } from './utils/lazyLoad';

// 预加载核心页面
import { HomePage } from './pages/HomePage';

// 懒加载其他页面
const TranslatorPage = lazyRoute(() => import('./pages/TranslatorPage').then(m => ({ default: m.TranslatorPage })));
const HealthPage = lazyRoute(() => import('./pages/HealthPage').then(m => ({ default: m.HealthPage })));
const ProfilePage = lazyRoute(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const CameraPage = lazyRoute(() => import('./pages/CameraPage').then(m => ({ default: m.CameraPage })));
const MonitorPage = lazyRoute(() => import('./pages/MonitorPage').then(m => ({ default: m.MonitorPage })));
const TrainingPage = lazyRoute(() => import('./pages/TrainingPage').then(m => ({ default: m.TrainingPage })));
const ServicesPage = lazyRoute(() => import('./pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const InsurancePage = lazyRoute(() => import('./pages/InsurancePage').then(m => ({ default: m.InsurancePage })));
const MedicalPage = lazyRoute(() => import('./pages/MedicalPage').then(m => ({ default: m.MedicalPage })));
const AIConsultantPage = lazyRoute(() => import('./pages/AIConsultantPage').then(m => ({ default: m.AIConsultantPage })));
const HealthRecordsPage = lazyRoute(() => import('./pages/HealthRecordsPage').then(m => ({ default: m.HealthRecordsPage })));
const HealthManualPage = lazyRoute(() => import('./pages/HealthManualPage').then(m => ({ default: m.HealthManualPage })));
const RemindersPage = lazyRoute(() => import('./pages/RemindersPage').then(m => ({ default: m.RemindersPage })));
const AdvancedHealthPage = lazyRoute(() => import('./pages/AdvancedHealthPage').then(m => ({ default: m.AdvancedHealthPage })));
const BondEmotionPage = lazyRoute(() => import('./pages/BondEmotionPage').then(m => ({ default: m.BondEmotionPage })));
const CameraMonitorPage = lazyRoute(() => import('./pages/CameraMonitorPage').then(m => ({ default: m.CameraMonitorPage })));
const PetsPage = lazyRoute(() => import('./pages/PetsPage').then(m => ({ default: m.PetsPage })));
const HealthReportPage = lazyRoute(() => import('./pages/HealthReportPage').then(m => ({ default: m.HealthReportPage })));
const SettingsPage = lazyRoute(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const FavoritesPage = lazyRoute(() => import('./pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const HelpFeedbackPage = lazyRoute(() => import('./pages/HelpFeedbackPage').then(m => ({ default: m.HelpFeedbackPage })));
const DeveloperInfoPage = lazyRoute(() => import('./pages/DeveloperInfoPage').then(m => ({ default: m.DeveloperInfoPage })));

function LoadingScreen({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-peach-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex flex-col items-center justify-center p-4">
      <motion.div 
        className="w-24 h-24 bg-gradient-to-br from-orange-400 to-peach-500 rounded-full flex items-center justify-center mb-6 shadow-lg"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatType: 'loop'
        }}
      >
        <PawPrint className="w-12 h-12 text-white" />
      </motion.div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">爪爪连心❤️</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">爪印同频 · 守护版</p>
      
      <div className="w-64 bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
        <motion.div 
          className="bg-gradient-to-r from-orange-400 to-peach-500 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{message}</p>
      
      {progress < 100 && (
        <div className="flex items-center gap-2 mt-4">
          <motion.div 
            className="w-2 h-2 rounded-full bg-orange-400"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div 
            className="w-2 h-2 rounded-full bg-orange-400"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          />
          <motion.div 
            className="w-2 h-2 rounded-full bg-orange-400"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </div>
      )}
    </div>
  );
}

// 页面切换动画配置
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const { 
    isInitialized, 
    initProgress, 
    initMessage,
    initializeApp,
  } = useAppStore();
  
  // 检测设备能力
  const capabilities = useDeviceCapabilities();
  
  // 使用新的深色模式 Hook
  const { isDark } = useDarkMode();

  // 初始化应用
  useEffect(() => {
    if (!isInitialized) {
      initializeApp();
    }
  }, [isInitialized, initializeApp]);

  // 应用性能类到根元素
  useEffect(() => {
    applyPerformanceClass(capabilities);
  }, [capabilities]);

  // 注册 Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    }
  }, []);

  // 页面切换处理
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  if (!isInitialized) {
    return <LoadingScreen progress={initProgress} message={initMessage} />;
  }

  const renderPage = () => {
    const pageProps = { onNavigate: handleNavigate };
    
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'pets':
        return <PetsPage {...pageProps} />;
      case 'translator':
        return <TranslatorPage />;
      case 'health':
        return <HealthPage />;
      case 'ai-consultant':
        return <AIConsultantPage {...pageProps} />;
      case 'health-records':
        return <HealthRecordsPage {...pageProps} />;
      case 'health-manual':
        return <HealthManualPage {...pageProps} />;
      case 'reminders':
        return <RemindersPage {...pageProps} />;
      case 'training':
        return <TrainingPage />;
      case 'services':
        return <ServicesPage {...pageProps} />;
      case 'insurance':
        return <InsurancePage />;
      case 'medical':
        return <MedicalPage />;
      case 'profile':
        return <ProfilePage {...pageProps} />;
      case 'camera':
        return <CameraPage />;
      case 'monitor':
        return <MonitorPage />;
      case 'advanced-health':
        return <AdvancedHealthPage {...pageProps} />;
      case 'bond-emotion':
        return <BondEmotionPage />;
      case 'camera-monitor':
        return <CameraMonitorPage {...pageProps} />;
      case 'health-report':
        return <HealthReportPage {...pageProps} />;
      case 'settings':
        return <SettingsPage {...pageProps} />;
      case 'favorites':
        return <FavoritesPage {...pageProps} />;
      case 'help-feedback':
        return <HelpFeedbackPage {...pageProps} />;
      case 'developer-info':
        return <DeveloperInfoPage {...pageProps} />;
      case 'history':
        return <TranslatorPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen"
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
    </div>
  );
}
