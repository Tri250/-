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
  Heart
} from 'lucide-react';
import { MemoryTimelineComponent } from '../components/bond/MemoryTimelineComponent';
import { VoiceMemoryWallComponent } from '../components/bond/VoiceMemoryWallComponent';
import { RemoteInteractionCenterComponent } from '../components/bond/RemoteInteractionCenterComponent';
import { useAppStore } from '../store/appStore';

type TabType = 'memories' | 'voices' | 'remote';

export default function BondEmotionPage() {
  const { currentPet } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('memories');

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
            {renderContent()}
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

    </div>
  );
}
