// ============================================
// PawSync Pro 3.0 - Advanced Health Page
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: AI健康预警与健康管理中心 - T3阶段核心页面
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  FileText, 
  AlertTriangle,
  Bell,
  Phone,
  Home,
  BarChart3,
  Stethoscope
} from 'lucide-react';
import { HealthDashboardComponent } from '../components/health/HealthDashboardComponent';
import { DynamicChartsComponent } from '../components/health/DynamicChartsComponent';
import { AlertCardsComponent } from '../components/health/AlertCardsComponent';
import { MedicalRecordsComponent } from '../components/health/MedicalRecordsComponent';
import { useAppStore } from '../store/appStore';

type TabType = 'dashboard' | 'alerts' | 'records' | 'charts';

interface AdvancedHealthPageProps {
  onNavigate?: (page: string) => void;
}

export function AdvancedHealthPage({ onNavigate }: AdvancedHealthPageProps) {
  const { currentPet } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showNavigation, setShowNavigation] = useState(true);

  const petId = currentPet?.id || '1';
  const petName = currentPet?.name || '毛孩子';
  const petBreed = currentPet?.breed;

  const tabs = [
    { key: 'dashboard', icon: Shield, label: '健康仪表盘', color: 'green' },
    { key: 'alerts', icon: AlertTriangle, label: '预警中心', color: 'orange' },
    { key: 'records', icon: FileText, label: '电子病历', color: 'blue' },
    { key: 'charts', icon: BarChart3, label: '数据图表', color: 'purple' }
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {petName}的健康中心
              </h2>
              <p className="text-sm text-gray-500">
                AI多模态健康预警 · 全天候守护
              </p>
            </div>
            <HealthDashboardComponent 
              petId={petId} 
              onNavigateToDetails={() => onNavigate?.('health-report')}
            />
          </motion.div>
        );

      case 'alerts':
        return (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                AI预警中心
              </h2>
              <p className="text-sm text-gray-500">
                智能识别 · 分级响应 · 及时守护
              </p>
            </div>
            <AlertCardsComponent petId={petId} petName={petName} />
          </motion.div>
        );

      case 'records':
        return (
          <motion.div
            key="records"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                电子病历库
              </h2>
              <p className="text-sm text-gray-500">
                OCR智能识别 · 永久保存 · 随时查阅
              </p>
            </div>
            <MedicalRecordsComponent petId={petId} petName={petName} />
          </motion.div>
        );

      case 'charts':
        return (
          <motion.div
            key="charts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                健康数据可视化
              </h2>
              <p className="text-sm text-gray-500">
                活动趋势 · 睡眠分析 · 成长曲线
              </p>
            </div>
            <DynamicChartsComponent 
              petId={petId} 
              petName={petName}
              petBreed={petBreed}
            />
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-green-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNavigation(!showNavigation)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Shield className="w-6 h-6 text-green-600" />
              </motion.button>
              <div>
                <h1 className="text-lg font-bold text-gray-800">爪爪连心❤️</h1>
                <p className="text-xs text-gray-500">AI健康预警系统</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Phone className="w-5 h-5 text-orange-600" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* 侧边导航 */}
      <AnimatePresence>
        {showNavigation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNavigation(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.nav
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50 pt-20 hidden lg:block"
            >
              <div className="p-4 space-y-2">
                <div className="mb-6 p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold">{petName}</p>
                      <p className="text-xs text-green-100">{petBreed || '宠物'}</p>
                    </div>
                  </div>
                  <div className="text-xs text-green-100">
                    🐾 健康状态: 优秀
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setShowNavigation(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'dashboard' 
                      ? 'bg-green-50 text-green-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span className="font-medium">返回首页</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setShowNavigation(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'dashboard' 
                      ? 'bg-green-50 text-green-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">健康仪表盘</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('alerts');
                    setShowNavigation(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'alerts' 
                      ? 'bg-orange-50 text-orange-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">预警中心</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('records');
                    setShowNavigation(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'records' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">电子病历</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('charts');
                    setShowNavigation(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'charts' 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">数据图表</span>
                </button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* 主内容区 */}
      <main className={`max-w-md mx-auto px-4 py-6 pb-24 transition-all ${showNavigation ? 'lg:ml-80' : ''}`}>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-lg z-30">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {tabs.map(({ key, icon: Icon, label, color }) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(key)}
                className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${
                  activeTab === key 
                    ? `bg-${color}-50 text-${color}-600` 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className={`relative ${activeTab === key ? `bg-${color}-100` : 'bg-gray-100'} p-2 rounded-xl`}>
                  <Icon className={`w-5 h-5 ${activeTab === key ? `text-${color}-600` : 'text-gray-500'}`} />
                  {key === 'alerts' && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span className={`text-xs mt-1 font-medium ${activeTab === key ? `text-${color}-600` : 'text-gray-500'}`}>
                  {label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
