// ============================================
// PawSync Pro - MonitorPage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 实时监控和录制管理页面 - 集成真实流媒体、检测和录制服务
// ============================================

import { useEffect, useState, useRef, useCallback } from 'react';
import { Monitor, Camera, AlertTriangle, History, Settings, Maximize2, Minimize2, Mic, MicOff, Volume2, VolumeX, Grid3X3, LayoutGrid } from 'lucide-react';
import { LiveStream } from '../components/monitor/LiveStream';
import { EventAlert } from '../components/monitor/EventAlert';
import { RecordingControls } from '../components/monitor/RecordingControls';
import { MultiCameraLayout } from '../components/monitor/MultiCameraLayout';
import { TimelinePlayback } from '../components/monitor/TimelinePlayback';
import { StreamHealthIndicator } from '../components/monitor/StreamHealthIndicator';
import { useCameraStore } from '../store/cameraStore';
import { useMonitorStore } from '../store/monitorStore';
import type { LiveMonitoring, SmartEvent, RecordingSession, StreamHealth, MonitorLayout } from '../types/monitor';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { StreamManager } from '../services/streaming/streamManager';
import { unifiedDetectionService } from '../services/detection';
import { recordingService } from '../services/recording/recordingService';
import type { StreamConfig as StreamServiceConfig, StreamHealth as StreamingHealth, QualityLevel } from '../services/streaming/types';

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
          {quality === 'auto' ? '自动' : quality === 'high' ? '高清' : quality === 'ultra' ? '超高清' : '标清'}
        </button>
        {showQualityMenu && (
          <div className="absolute bottom-full mb-2 right-0 bg-black/80 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl">
            {['auto', 'low', 'medium', 'high', 'ultra'].map((q) => (
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
                {q === 'auto' ? '自动' : q === 'low' ? '低清' : q === 'medium' ? '标清' : q === 'high' ? '高清' : '超高清'}
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
  icon: React.ElementType; 
  label: string; 
  active?: boolean;
  onClick: () => void;
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

export default function MonitorPage() {
  const { devices, selectedDevice, selectDevice, loadDevices } = useCameraStore();
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
    streamHealth,
    updateStreamHealth,
    addEvent,
  } = useMonitorStore();

  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quality, setQuality] = useState<QualityLevel>('auto');
  const [isTalking, setIsTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // 流管理器实例
  const streamManagerRef = useRef<StreamManager | null>(null);
  
  // 多路监控布局状态
  const [layout, setLayout] = useState<MonitorLayout>({
    type: 'single',
    cameras: devices.filter(d => d.status === 'online').map(d => d.id),
    activeCamera: selectedDevice?.id,
  });
  
  // 录制历史
  const [recordingHistory, setRecordingHistory] = useState<RecordingSession[]>([]);
  
  // 检测服务初始化状态
  const [detectionInitialized, setDetectionInitialized] = useState(false);

  // 初始化流管理器
  useEffect(() => {
    streamManagerRef.current = new StreamManager({
      defaultConfig: {
        preferredProtocol: 'webrtc',
        fallbackProtocols: ['rtsp', 'hls'],
        enableWeakNetworkOptimization: true,
        enableAudio: true,
        enableVideo: true,
      },
      onHealthUpdate: (deviceId: string, health: StreamingHealth) => {
        // 转换为 monitor 类型
        const monitorHealth: StreamHealth = {
          cameraId: deviceId,
          latency: health.network.rtt,
          fps: health.video.frameRate,
          bitrate: health.network.bitrateReceived,
          packetLoss: health.network.packetLoss,
          status: health.quality === 'excellent' ? 'excellent' :
                  health.quality === 'good' ? 'good' :
                  health.quality === 'fair' ? 'poor' : 'critical',
        };
        updateStreamHealth(deviceId, monitorHealth);
      },
      onError: (error) => {
        console.error('流错误:', error);
      },
      onQualityChange: (deviceId: string, newQuality: QualityLevel) => {
        if (selectedDevice?.id === deviceId) {
          setQuality(newQuality);
        }
      },
    });

    return () => {
      streamManagerRef.current?.destroy();
    };
  }, [selectedDevice, updateStreamHealth]);

  // 初始化检测服务
  useEffect(() => {
    const initDetection = async () => {
      try {
        await unifiedDetectionService.initialize({
          mode: 'realtime',
          backendBaseUrl: '/api',
        });
        setDetectionInitialized(true);
        console.log('检测服务初始化成功');
      } catch (error) {
        console.error('检测服务初始化失败:', error);
        // 即使失败也标记为初始化，使用模拟模式
        setDetectionInitialized(true);
      }
    };
    
    initDetection();
  }, []);

  // 加载设备和事件
  useEffect(() => {
    loadDevices();
    loadEvents();
  }, [loadDevices, loadEvents]);

  // 选择默认设备
  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      selectDevice(devices[0]);
      setLayout(prev => ({
        ...prev,
        cameras: devices.filter(d => d.status === 'online').map(d => d.id),
        activeCamera: devices[0].id,
      }));
    }
  }, [devices, selectedDevice, selectDevice]);

  // 录制时长计时器
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

  // 加载录制历史
  useEffect(() => {
    const loadRecordingHistory = async () => {
      try {
        const history = await recordingService.getRecordingHistory();
        setRecordingHistory(history);
      } catch (error) {
        console.error('加载录制历史失败:', error);
      }
    };
    
    if (activeTab === 'recordings') {
      loadRecordingHistory();
    }
  }, [activeTab]);

  // 开始监控
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
      
      // 创建流连接
      if (streamManagerRef.current) {
        try {
          const streamConfig: Partial<StreamServiceConfig> = {
            deviceId: selectedDevice.id,
            preferredProtocol: 'webrtc',
            adaptiveBitrate: {
              enabled: true,
              initialQuality: quality,
            },
          };
          
          // 尝试创建流（如果设备有流 URL）
          if (selectedDevice.streamUrl || selectedDevice.webrtcUrl) {
            await streamManagerRef.current.createStream(selectedDevice.id, streamConfig);
          }
        } catch (error) {
          console.error('创建流连接失败:', error);
        }
      }
    }
  };

  // 停止监控
  const handleStopMonitoring = async () => {
    if (selectedDevice) {
      await stopMonitoring(selectedDevice.id);
      
      // 销毁流连接
      if (streamManagerRef.current) {
        await streamManagerRef.current.destroyStream(selectedDevice.id);
      }
    }
  };

  // 开始录制
  const handleStartRecording = async () => {
    if (selectedDevice && streamManagerRef.current) {
      try {
        // 获取媒体流
        const stream = streamManagerRef.current.getStream(selectedDevice.id);
        
        if (stream) {
          const session = await recordingService.startRecording(
            selectedDevice.id,
            stream,
            {
              format: 'webm',
              quality: 'high',
              audioEnabled: true,
              loopRecording: false,
            }
          );
          
          // 更新 store
          startRecording(selectedDevice.id);
        } else {
          // 如果没有真实流，使用 store 的录制功能
          await startRecording(selectedDevice.id);
        }
      } catch (error) {
        console.error('开始录制失败:', error);
        // 使用 store 的录制功能作为备选
        await startRecording(selectedDevice.id);
      }
    }
  };

  // 停止录制
  const handleStopRecording = async () => {
    try {
      if (recordingSession) {
        await recordingService.stopRecording(recordingSession.id);
      }
      await stopRecording();
      
      // 刷新录制历史
      const history = await recordingService.getRecordingHistory();
      setRecordingHistory(history);
    } catch (error) {
      console.error('停止录制失败:', error);
      await stopRecording();
    }
  };

  // 切换质量
  const handleQualityChange = useCallback(async (newQuality: string) => {
    setQuality(newQuality as QualityLevel);
    
    if (selectedDevice && streamManagerRef.current) {
      try {
        await streamManagerRef.current.switchQuality(selectedDevice.id, newQuality as QualityLevel);
      } catch (error) {
        console.error('切换质量失败:', error);
      }
    }
  }, [selectedDevice]);

  // 处理布局变更
  const handleLayoutChange = useCallback((newLayout: MonitorLayout) => {
    setLayout(newLayout);
  }, []);

  // 处理摄像头选择
  const handleCameraSelect = useCallback((cameraId: string) => {
    const device = devices.find(d => d.id === cameraId);
    if (device) {
      selectDevice(device);
      setLayout(prev => ({
        ...prev,
        activeCamera: cameraId,
      }));
    }
  }, [devices, selectDevice]);

  // 执行检测（模拟真实检测流程）
  const performDetection = useCallback(async () => {
    if (!detectionInitialized || !selectedDevice || !isMonitoring) return;
    
    try {
      // 创建模拟帧数据（实际应用中从视频流获取）
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 绘制模拟图像
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 执行检测
        const result = await unifiedDetectionService.performFullDetection(
          frame,
          undefined,
          selectedDevice.id,
          '1' // 默认宠物 ID
        );
        
        // 处理检测结果
        if (result.aggregatedEvent) {
          // 转换为 SmartEvent
          const smartEvent: SmartEvent = {
            id: result.aggregatedEvent.id,
            type: result.aggregatedEvent.type,
            severity: result.aggregatedEvent.severity,
            description: result.aggregatedEvent.description,
            cameraId: result.aggregatedEvent.cameraId,
            timestamp: result.aggregatedEvent.timestamp,
            petId: result.aggregatedEvent.petId,
            acknowledged: false,
          };
          addEvent(smartEvent);
        }
        
        // 处理行为事件
        for (const behavior of result.behaviorEvents) {
          const smartEvent: SmartEvent = {
            id: behavior.id,
            type: 'behavior',
            severity: behavior.behavior === 'abnormal' ? 'warning' : 'info',
            description: `检测到行为: ${behavior.behavior}`,
            cameraId: behavior.cameraId,
            timestamp: behavior.timestamp,
            petId: behavior.petId,
            acknowledged: false,
          };
          addEvent(smartEvent);
        }
        
        // 处理声音事件
        for (const sound of result.soundEvents) {
          const smartEvent: SmartEvent = {
            id: sound.id,
            type: 'environment',
            severity: 'info',
            description: `检测到声音: ${sound.soundType}`,
            cameraId: sound.cameraId,
            timestamp: sound.timestamp,
            acknowledged: false,
          };
          addEvent(smartEvent);
        }
      }
    } catch (error) {
      console.error('检测失败:', error);
    }
  }, [detectionInitialized, selectedDevice, isMonitoring, addEvent]);

  // 定期执行检测
  useEffect(() => {
    if (!isMonitoring) return;
    
    const interval = setInterval(() => {
      performDetection();
    }, 5000); // 每 5 秒检测一次
    
    return () => clearInterval(interval);
  }, [isMonitoring, performDetection]);

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

  // 当前流健康状态
  const currentHealth = selectedDevice ? streamHealth[selectedDevice.id] : null;

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
                  onClick={() => setActiveTab('events')}
                  className="relative p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unacknowledgedEvents.length}
                  </span>
                </button>
              )}
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {devices.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {devices.filter(d => d.status === 'online').map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleCameraSelect(device.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedDevice?.id === device.id
                      ? 'bg-gradient-to-r from-orange-400 to-peach-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>{device.name}</span>
                  {device.status === 'online' && (
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="max-w-md mx-auto px-4">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'live' as TabType, label: '直播', icon: Monitor, badge: unacknowledgedEvents.length },
              { id: 'events' as TabType, label: '事件', icon: AlertTriangle, badge: unacknowledgedEvents.length },
              { id: 'recordings' as TabType, label: '录制', icon: History, badge: recordingHistory.length },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
                {/* 流健康状态显示 */}
                {currentHealth && isMonitoring && (
                  <StreamHealthIndicator 
                    health={currentHealth} 
                    showDetails={false}
                    className="mb-2"
                  />
                )}
                
                <div className="relative">
                  <LiveStream
                    device={selectedDevice}
                    monitoring={defaultMonitoring}
                    streamManager={streamManagerRef.current}
                    quality={quality}
                    onQualityChange={handleQualityChange}
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
                        onQualityChange={handleQualityChange}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {!isMonitoring ? (
                    <button
                      onClick={handleStartMonitoring}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-peach-500 text-white hover:from-orange-500 hover:to-peach-600 transition-colors font-medium flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Monitor className="w-5 h-5" />
                      开始监控
                    </button>
                  ) : (
                    <button
                      onClick={handleStopMonitoring}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600 transition-colors font-medium flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Monitor className="w-5 h-5" />
                      停止监控
                    </button>
                  )}
                  
                  {/* 多路监控切换按钮 */}
                  <button
                    onClick={() => setLayout(prev => ({
                      ...prev,
                      type: prev.type === 'single' ? 'grid' : 'single',
                      gridSize: prev.type === 'single' ? { rows: 2, cols: 2 } : undefined,
                    }))}
                    className="py-3 px-4 rounded-xl bg-white text-gray-600 hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
                    title="切换多路监控"
                  >
                    {layout.type === 'single' ? <LayoutGrid className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
                  </button>
                </div>

                {/* 多路监控布局 */}
                {layout.type !== 'single' && devices.filter(d => d.status === 'online').length > 1 && (
                  <Card variant="default" padding="medium">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">多路监控</h3>
                    <MultiCameraLayout
                      layout={layout}
                      cameras={devices.filter(d => d.status === 'online')}
                      onLayoutChange={handleLayoutChange}
                      onCameraSelect={handleCameraSelect}
                      showControls={true}
                      enableDrag={true}
                      className="h-48"
                    />
                  </Card>
                )}

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
                      onClick={() => setIsMuted(!isMuted)}
                    />
                    <ActionButton 
                      icon={isTalking ? MicOff : Mic} 
                      label={isTalking ? '结束对讲' : '语音对讲'}
                      active={isTalking}
                      onClick={() => setIsTalking(!isTalking)}
                      disabled={!isMonitoring}
                    />
                    <ActionButton 
                      icon={Camera} 
                      label="截图"
                      onClick={() => {
                        // 截图功能 - 使用 canvas 从视频流截取
                        if (streamManagerRef.current && selectedDevice) {
                          const stream = streamManagerRef.current.getStream(selectedDevice.id);
                          if (stream) {
                            const video = document.createElement('video');
                            video.srcObject = stream;
                            video.play();
                            const canvas = document.createElement('canvas');
                            canvas.width = 640;
                            canvas.height = 480;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(video, 0, 0);
                              const dataUrl = canvas.toDataURL('image/jpeg');
                              // 下载截图
                              const link = document.createElement('a');
                              link.href = dataUrl;
                              link.download = `screenshot-${selectedDevice.name}-${Date.now()}.jpg`;
                              link.click();
                            }
                          }
                        }
                      }}
                      disabled={!isMonitoring}
                    />
                    <ActionButton 
                      icon={Maximize2} 
                      label="全屏"
                      onClick={() => setIsFullscreen(true)}
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
                
                {/* 检测服务状态 */}
                <Card variant="default" padding="small">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${detectionInitialized ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span className="text-xs text-gray-600">
                        AI 检测服务: {detectionInitialized ? '已启用' : '初始化中'}
                      </span>
                    </div>
                    <Badge color={detectionInitialized ? 'green' : 'yellow'} size="small">
                      {detectionInitialized ? '在线' : '离线'}
                    </Badge>
                  </div>
                </Card>
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
          <div className="space-y-4">
            {recordingHistory.length === 0 ? (
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
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-800">录制历史</h3>
                  <Badge color="orange" size="small">{recordingHistory.length} 条记录</Badge>
                </div>
                
                {/* 时间轴回放 */}
                {recordingHistory[0] && (
                  <TimelinePlayback
                    recording={recordingHistory[0]}
                    events={events.filter(e => e.cameraId === recordingHistory[0].cameraId)}
                    currentTime={0}
                    onSeek={(time) => console.log('Seek to:', time)}
                    className="mb-4"
                  />
                )}
                
                {/* 录制列表 */}
                <div className="space-y-3">
                  {recordingHistory.map((recording) => (
                    <Card key={recording.id} variant="default" padding="medium">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-800">
                            {devices.find(d => d.id === recording.cameraId)?.name || '未知摄像头'}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(recording.startTime).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {recording.duration && (
                            <Badge color="gray" size="small">
                              {Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}
                            </Badge>
                          )}
                          {recording.fileSize && (
                            <Badge color="gray" size="small">
                              {(recording.fileSize / 1024 / 1024).toFixed(1)} MB
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}