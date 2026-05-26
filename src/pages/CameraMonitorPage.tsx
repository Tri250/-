// ============================================
// PawSync Pro 3.0 - Camera Monitor Page
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 摄像头监控中心页面 - T2阶段核心页面
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Bell, Grid3X3, List, Plus, X } from 'lucide-react';
import { CameraMonitorComponent } from '../components/monitor/CameraMonitorComponent';
import { CameraListComponent } from '../components/monitor/CameraListComponent';
import { useAppStore } from '../store/appStore';

type ViewMode = 'grid' | 'list' | 'monitor';

export function CameraMonitorPage() {
  const { currentPet } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [showFullMonitor, setShowFullMonitor] = useState(false);

  const petName = currentPet?.name || '毛孩子';

  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return <CameraListComponent />;
      case 'grid':
        return <CameraListComponent />;
      case 'monitor':
        return (
          <div className="h-[calc(100vh-200px)]">
            <CameraMonitorComponent autoConnect={true} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center"
              >
                <Camera className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">监控中心</h1>
                <p className="text-xs text-gray-500">实时守护{petName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  2
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>
          </div>

          {/* 视图切换 */}
          <div className="flex gap-2 mt-3 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-gray-800 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm">列表</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-gray-800 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="text-sm">网格</span>
            </button>
            <button
              onClick={() => setViewMode('monitor')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                viewMode === 'monitor'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm">监控</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-md mx-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 全屏监控模式 */}
      <AnimatePresence>
        {showFullMonitor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
          >
            <CameraMonitorComponent />
            
            <button
              onClick={() => setShowFullMonitor(false)}
              className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
