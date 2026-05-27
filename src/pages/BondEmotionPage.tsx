// ============================================
// PawSync Pro 3.0 - Bond & Emotion Page
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 人宠情感连接核心功能页面 - T4阶段
// ============================================

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Camera,
  Mic,
  Zap,
  Home,
  ChevronRight,
  ChevronLeft,
  Plus,
  Square,
  Send,
  X,
  Play,
  Pause
} from 'lucide-react';
import { MemoryTimelineComponent } from '../components/bond/MemoryTimelineComponent';
import { VoiceMemoryWallComponent } from '../components/bond/VoiceMemoryWallComponent';
import { RemoteInteractionCenterComponent } from '../components/bond/RemoteInteractionCenterComponent';
import { useAppStore } from '../store/appStore';

type TabType = 'memories' | 'voices' | 'remote';

export function BondEmotionPage() {
  const { currentPet } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('memories');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const petId = currentPet?.id || '1';
  const petName = currentPet?.name || '毛孩子';

  const handleTakePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        const imageDataUrl = canvas.toDataURL('image/png');
        console.log('Photo taken:', imageDataUrl);
        
        stream.getTracks().forEach(track => track.stop());
        setShowCameraModal(false);
        setShowFloatingAction(false);
        
        alert('照片已保存！');
      }, 1000);
    } catch (error) {
      console.error('Camera error:', error);
      alert('无法访问相机，请检查权限设置');
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('Recording saved:', audioUrl);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Audio recording error:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
    setShowVoiceModal(false);
    setShowFloatingAction(false);
    
    alert('录音已保存！');
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log('Message sent:', messageText);
      setMessageText('');
      setShowMessageModal(false);
      setShowFloatingAction(false);
      alert('留言已保存！');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { 
      key: 'memories' as const, 
      icon: Camera, 
      label: '时光档案',
      emoji: '📸',
      gradient: 'from-pink-500 to-rose-500'
    },
    { 
      key: 'voices' as const, 
      icon: Mic, 
      label: '声音记忆',
      emoji: '🎵',
      gradient: 'from-purple-500 to-indigo-500'
    },
    { 
      key: 'remote' as const, 
      icon: Zap, 
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
      </header>

      {/* 主内容区 */}
      <main className="max-w-md mx-auto px-4 py-6 pb-32">
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

      {/* 添加回忆按钮 */}
      <div className="fixed bottom-20 left-0 right-0 z-30 flex justify-center px-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAddingMemory(!isAddingMemory)}
          className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">添加回忆</span>
        </motion.button>
      </div>

      {/* 添加回忆菜单 */}
      <AnimatePresence>
        {isAddingMemory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingMemory(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-xl p-4 w-[90%] max-w-sm"
            >
              <div className="text-center mb-4">
                <p className="text-sm font-medium text-gray-700">选择添加方式</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={() => {
                    setIsAddingMemory(false);
                    setShowCameraModal(true);
                  }}
                  className="flex flex-col items-center gap-2 p-4 hover:bg-pink-50 rounded-xl transition-colors"
                >
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                    <Camera className="w-6 h-6 text-pink-600" />
                  </div>
                  <p className="text-xs text-gray-700">拍照记录</p>
                </button>

                <button 
                  onClick={() => {
                    setIsAddingMemory(false);
                    setShowVoiceModal(true);
                  }}
                  className="flex flex-col items-center gap-2 p-4 hover:bg-purple-50 rounded-xl transition-colors"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Mic className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-700">录制声音</p>
                </button>

                <button 
                  onClick={() => {
                    setIsAddingMemory(false);
                    setShowMessageModal(true);
                  }}
                  className="flex flex-col items-center gap-2 p-4 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Send className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-700">发送留言</p>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-lg z-30">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {tabs.map(({ key, icon: Icon, label, emoji, gradient }) => (
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

      {/* 拍照模态框 */}
      <AnimatePresence>
        {showCameraModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCameraModal(false)}
              className="fixed inset-0 bg-black/70 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">拍照记录</h3>
                <button onClick={() => setShowCameraModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="aspect-square bg-gray-900 rounded-2xl mb-4 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-16 h-16 text-gray-600" />
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <button
                    onClick={handleTakePhoto}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <Square className="w-8 h-8 text-gray-800" />
                  </button>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500">点击拍摄按钮拍照</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 录音模态框 */}
      <AnimatePresence>
        {showVoiceModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isRecording && setShowVoiceModal(false)}
              className="fixed inset-0 bg-black/70 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">录制声音</h3>
                <button onClick={() => !isRecording && setShowVoiceModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex flex-col items-center mb-4">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-4 transition-all ${
                  isRecording ? 'bg-red-100 animate-pulse' : 'bg-purple-100'
                }`}>
                  {isRecording ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Mic className="w-12 h-12 text-red-500" />
                    </motion.div>
                  ) : (
                    <Mic className="w-12 h-12 text-purple-500" />
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-2">{formatTime(recordingTime)}</p>
                <p className="text-sm text-gray-500">
                  {isRecording ? '正在录制...' : '点击按钮开始录制'}
                </p>
              </div>
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`w-full py-4 rounded-xl font-medium transition-all ${
                  isRecording 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                }`}
              >
                {isRecording ? '停止录制' : '开始录制'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 留言模态框 */}
      <AnimatePresence>
        {showMessageModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMessageModal(false)}
              className="fixed inset-0 bg-black/70 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">发送留言</h3>
                <button onClick={() => setShowMessageModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`给${petName}说点什么吧...`}
                rows={4}
                className="w-full px-4 py-3 bg-gray-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">{messageText.length}/500</span>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    messageText.trim()
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  发送
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
