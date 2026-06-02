// ============================================
// PawSync Pro 3.0 - Bond & Emotion Page
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 人宠情感连接核心功能页面 - T4阶段
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Camera,
  Plus,
  X
} from 'lucide-react';
import { MemoryTimelineComponent } from '../components/bond/MemoryTimelineComponent';
import { VoiceMemoryWallComponent } from '../components/bond/VoiceMemoryWallComponent';
import { RemoteInteractionCenterComponent } from '../components/bond/RemoteInteractionCenterComponent';
import { useAppStore } from '../store/appStore';

type TabType = 'memories' | 'voices' | 'remote';

export function BondEmotionPage() {
  const { currentPet } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('memories');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const petName = currentPet?.name || '毛孩子';

  const tabs = [
    { 
      key: 'memories' as const, 
      label: '时光档案',
      emoji: '📸',
      gradient: 'from-pink-500 to-rose-500'
    },
    { 
      key: 'voices' as const, 
      label: '声音记忆',
      emoji: '🎵',
      gradient: 'from-purple-500 to-indigo-500'
    },
    { 
      key: 'remote' as const, 
      label: '远程互动',
      emoji: '📱',
      gradient: 'from-blue-500 to-cyan-500'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'memories':
        return <MemoryTimelineComponent />;
      case 'voices':
        return <VoiceMemoryWallComponent />;
      case 'remote':
        return <RemoteInteractionCenterComponent />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-pink-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center"
              >
                <Heart className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">情感连接</h1>
                <p className="text-xs text-gray-500">强化{petName}的情感纽带</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUploadModal(true)}
                className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl shadow-lg"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-md mx-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'memories' ? (
              <MemoryTimelineComponent 
                externalShowUploadModal={showUploadModal}
                onExternalShowUploadModalChange={setShowUploadModal}
              />
            ) : renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-lg z-30">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {tabs.map(({ key, label, emoji, gradient }) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(key)}
                className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${
                  activeTab === key 
                    ? `bg-gradient-to-br ${gradient} text-white shadow-lg` 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-2xl mb-1">{emoji}</span>
                <span className={`text-xs font-medium ${activeTab === key ? 'text-white' : 'text-gray-500'}`}>
                  {label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </nav>

      {/* 添加回忆模态框 */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-xl p-2 w-64"
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 mb-2">
                <h3 className="font-semibold text-gray-800">添加回忆</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <button 
                onClick={() => {
                  setShowUploadModal(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-50 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Camera className="w-5 h-5 text-pink-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">添加回忆</p>
                  <p className="text-xs text-gray-500">记录{petName}的精彩瞬间</p>
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
