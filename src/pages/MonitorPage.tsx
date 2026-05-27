// ============================================
// PawSync Pro - MonitorPage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 实时监控和录制管理页面
// ============================================

import { useEffect, useState } from 'react';
import { Monitor, Camera, AlertTriangle, History, Settings, Maximize2, Minimize2, Mic, MicOff, Volume2, VolumeX, Wifi, Plus, X, Check } from 'lucide-react';
import { LiveStream } from '../components/monitor/LiveStream';
import { EventAlert } from '../components/monitor/EventAlert';
import { RecordingControls } from '../components/monitor/RecordingControls';
import { useCameraStore } from '../store/cameraStore';
import { useMonitorStore } from '../store/monitorStore';
import type { LiveMonitoring } from '../types/monitor';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'live' | 'events' | 'recordings';

function StreamControls({ 
  isFullscreen, 
  onToggleFullscreen,
  quality,
  onQualityChange 
}: { 
  isFullscreen: boolean; 
  onToggleFullscreen: () => void;
  quality: string;
  onQualityChange: (quality: string) => void;
}) {
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <button
          onClick={() => setShowQualityMenu(!showQualityMenu)}
          className="px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white rounded-lg text-xs font-medium hover:bg-black/60 transition-colors"
        >
          {quality === 'auto' ? '自动' : quality === 'high' ? '高清' : '标清'}
        </button>
        {showQualityMenu && (
          <div className="absolute bottom-full mb-2 right-0 bg-black/80 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl">
            {['auto', 'high', 'medium'].map((q) => (
              <button
                key={q}
                onClick={() => {
                  onQualityChange(q);
                  setShowQualityMenu(false);
                }}
                className={`block w-full px-4 py-2 text-left text-white text-xs hover:bg-white/20 transition-colors ${
                  quality === q ? 'bg-white/20 font-semibold' : ''
                }`}
              >
                {q === 'auto' ? '自动' : q === 'high' ? '高清' : '标清'}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onToggleFullscreen}
        className="p-1.5 bg-black/50 backdrop-blur-sm text-white rounded-lg hover:bg-black/60 transition-colors"
        aria-label={isFullscreen ? '退出全屏' : '全屏'}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

function ActionButton({ 
  icon: Icon, 
  label, 
  active = false,
  onClick,
  disabled = false 
}: { 
  icon: any; 
  label: string; 
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center p-3 rounded-xl transition-all
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${active 
          ? 'bg-orange-500 text-white shadow-lg' 
          : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
        }
      `}
    >
      <Icon className="w-5 h-5 mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export function MonitorPage() {
  const { devices, selectedDevice, selectDevice, loadDevices, pairDevice } = useCameraStore();
  const { 
    isMonitoring, 
    monitoring, 
    events, 
    recordingSession,
    recordingDuration,
    startMonitoring, 
    stopMonitoring, 
    loadEvents, 
    acknowledgeEvent,
    startRecording,
    stopRecording,
    incrementRecordingDuration,
  } = useMonitorStore();

  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [isTalking, setIsTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showAddCameraModal, setShowAddCameraModal] = useState(false);
  const [cameraBrand, setCameraBrand] = useState('xiaomi' as 'xiaomi' | 'hikvision' | 'ezviz' | 'other');
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [isPairing, setIsPairing] = useState(false);

  const cameraBrands = [
    { id: 'xiaomi' as const, name: '小米', icon: '📱' },
    { id: 'hikvision' as const, name: '海康威视', icon: '🏢' },
    { id: 'ezviz' as const, name: '萤石', icon: '✨' },
    { id: 'other' as const, name: '其他品牌', icon: '📷' },
  ];

  const handleAddCamera = async () => {
    console.log('开始添加摄像头...', { cameraBrand, deviceCode, deviceName });
    
    if (!deviceCode.trim()) {
      alert('请输入设备配对码');
      return;
    }
    if (!deviceName.trim()) {
      alert('请输入设备名称');
      return;
    }

    setIsPairing(true);
    try {
      const newDevice = await pairDevice(cameraBrand, deviceCode, deviceName);
      console.log('设备添加成功:', newDevice);
      
      // 自动选中新添加的设备
      if (newDevice) {
        selectDevice(newDevice);
      }
      
      setShowAddCameraModal(false);
      setDeviceCode('');
      setDeviceName('');
      alert('摄像头添加成功！');
    } catch (error) {
      console.error('添加摄像头失败:', error);
      alert('添加失败，请检查配对码是否正确');
    } finally {
      setIsPairing(false);
    }
  };

  useEffect(() => {
    loadDevices();
    loadEvents();
  }, [loadDevices, loadEvents]);

  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      selectDevice(devices[0]);
    }
  }, [devices, selectedDevice, selectDevice]);

  useEffect(() => {
    let interval: number | undefined;
    if (recordingSession?.status === 'recording') {
      interval = window.setInterval(() => {
        incrementRecordingDuration();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingSession, incrementRecordingDuration]);

  const handleStartMonitoring = async () => {
    if (selectedDevice) {
      const config = {
        quality: 'auto' as const,
        audioEnabled: true,
        nightVision: false,
        motionDetection: true,
        eventRecording: true,
      };
      await startMonitoring(selectedDevice.id, config);
    }
  };

  const handleStopMonitoring = async () => {
    if (selectedDevice) {
      await stopMonitoring(selectedDevice.id);
    }
  };

  const handleStartRecording = async () => {
    if (selectedDevice) {
      await startRecording(selectedDevice.id);
    }
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  const unacknowledgedEvents = events.filter(e => !e.acknowledged);
  const defaultMonitoring: LiveMonitoring = monitoring || {
    isActive: false,
    streamQuality: 'auto',
    isRecording: false,
    eventDetection: {
      abnormalBehavior: true,
      emotionalChange: true,
      dangerApproach: true,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-peach-50/30 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Monitor className="w-6 h-6 text-orange-500" />
                实时监控
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                {selectedDevice ? selectedDevice.name : '选择摄像头'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unacknowledgedEvents.length > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab('events');
                  }}
                  className="relative p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unacknowledgedEvents.length}
                  </span>
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  selectDevice(device);
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedDevice?.id === device.id
                    ? 'bg-gradient-to-r from-orange-400 to-peach-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{device.name}</span>
                {device.status === 'online' ? (
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                ) : (
                  <span className="w-2 h-2 bg-gray-400 rounded-full" />
                )}
              </button>
            ))}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddCameraModal(true);
              }}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 bg-primary-500 text-white hover:bg-primary-600 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>添加</span>
            </button>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'live' as TabType, label: '直播', icon: Monitor },
              { id: 'events' as TabType, label: '事件', icon: AlertTriangle, badge: unacknowledgedEvents.length },
              { id: 'recordings' as TabType, label: '录制', icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(tab.id);
                  }}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-orange-500 border-orange-500'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {activeTab === 'live' && (
          <div className="space-y-6">
            {selectedDevice ? (
              <>
                <div className="relative">
                  <LiveStream
                    device={selectedDevice}
                    monitoring={defaultMonitoring}
                    className="aspect-video rounded-2xl overflow-hidden shadow-xl"
                  />
                  
                  {isMonitoring && (
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <Badge color="green" size="small" icon={<span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}>
                        直播中
                      </Badge>
                      <StreamControls 
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                        quality={quality}
                        onQualityChange={setQuality}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {!isMonitoring ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStartMonitoring();
                      }}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-peach-500 text-white hover:from-orange-500 hover:to-peach-600 transition-colors font-medium flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Monitor className="w-5 h-5" />
                      开始监控
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStopMonitoring();
                      }}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600 transition-colors font-medium flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Monitor className="w-5 h-5" />
                      停止监控
                    </button>
                  )}
                </div>

                <Card variant="default" padding="medium">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">快捷操作</h3>
                    <Badge color="gray" size="small">触摸控制</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <ActionButton 
                      icon={isMuted ? VolumeX : Volume2} 
                      label={isMuted ? '取消静音' : '静音'}
                      active={isMuted}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                    />
                    <ActionButton 
                      icon={isTalking ? MicOff : Mic} 
                      label={isTalking ? '结束对讲' : '语音对讲'}
                      active={isTalking}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsTalking(!isTalking);
                      }}
                      disabled={!isMonitoring}
                    />
                    <ActionButton 
                      icon={Camera} 
                      label="截图"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        alert('截图功能');
                      }}
                      disabled={!isMonitoring}
                    />
                    <ActionButton 
                      icon={Maximize2} 
                      label="全屏"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsFullscreen(true);
                      }}
                      disabled={!isMonitoring}
                    />
                  </div>
                </Card>

                <RecordingControls
                  session={recordingSession}
                  isRecording={recordingSession?.status === 'recording'}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  recordingDuration={recordingDuration}
                />
              </>
            ) : (
              <EmptyState
                icon={<Camera className="w-12 h-12" />}
                title="暂无摄像头"
                description="请先在设备管理中添加摄像头"
                action={{
                  label: '去添加',
                  onClick: () => window.location.hash = '#camera',
                  icon: <Camera className="w-5 h-5" />
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            {events.length === 0 ? (
              <EmptyState
                icon={<AlertTriangle className="w-12 h-12" />}
                title="暂无事件"
                description="监控中的所有事件将显示在这里"
              />
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-800">事件列表</h3>
                  <Badge color="orange" size="small">{events.length} 条记录</Badge>
                </div>
                
                {events.map((event) => (
                  <EventAlert
                    key={event.id}
                    event={event}
                    onAcknowledge={() => acknowledgeEvent(event.id)}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'recordings' && (
          <EmptyState
            icon={<History className="w-12 h-12" />}
            title="暂无录制"
            description="在直播页面点击录制按钮开始录制"
            action={{
              label: '去直播',
              onClick: () => setActiveTab('live'),
              icon: <Monitor className="w-5 h-5" />
            }}
          />
        )}
      </main>

      {/* 添加摄像头模态框 */}
      <AnimatePresence>
        {showAddCameraModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCameraModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">添加摄像头</h3>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAddCameraModal(false);
                  }} 
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 品牌选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择品牌</label>
                  <div className="grid grid-cols-4 gap-2">
                    {cameraBrands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCameraBrand(brand.id);
                        }}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                          cameraBrand === brand.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="text-xl">{brand.icon}</span>
                        <span className="text-xs font-medium">{brand.name}</span>
                        {cameraBrand === brand.id && (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 设备名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">设备名称</label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="例如：客厅摄像头"
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                  />
                </div>

                {/* 配对码 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">设备配对码</label>
                  <input
                    type="text"
                    value={deviceCode}
                    onChange={(e) => setDeviceCode(e.target.value)}
                    placeholder="请输入设备配对码"
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                  />
                </div>

                {/* 提示信息 */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-blue-600">
                    💡 提示：配对码通常在摄像头底部或说明书上，一般为6-8位数字或字母。
                  </p>
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddCamera();
                }}
                disabled={isPairing}
                className={`w-full mt-6 py-3 rounded-xl font-medium transition-all ${
                  isPairing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/30'
                }`}
              >
                {isPairing ? '配对中...' : '添加摄像头'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
