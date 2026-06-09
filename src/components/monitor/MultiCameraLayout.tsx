// ============================================
// PawSync Pro 3.0 - Multi Camera Layout Component
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 多路监控布局组件 - 支持多种布局类型、响应式设计、拖拽交互
// ============================================

import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3X3,
  Square,
  LayoutGrid,
  Monitor,
  MonitorPlay,
  Maximize2,
  Settings,
  Expand,
} from 'lucide-react';
import type { CameraDevice } from '../../types/camera';
import type { MonitorLayout, StreamHealth } from '../../types/monitor';
import { CameraTile } from './CameraTile';
import { LayoutControls } from './LayoutControls';
import { StreamHealthIndicator } from './StreamHealthIndicator';

interface MultiCameraLayoutProps {
  layout: MonitorLayout;
  cameras: CameraDevice[];
  onLayoutChange?: (layout: MonitorLayout) => void;
  onCameraSelect?: (cameraId: string) => void;
  showControls?: boolean;
  enableDrag?: boolean;
  className?: string;
}

// 布局类型配置
const layoutConfigs = {
  single: { rows: 1, cols: 1, label: '单画面' },
  split: { rows: 1, cols: 2, label: '双分屏' },
  'grid-2x2': { rows: 2, cols: 2, label: '4画面' },
  'grid-3x3': { rows: 3, cols: 3, label: '9画面' },
  'grid-4x4': { rows: 4, cols: 4, label: '16画面' },
};

// 扩展布局类型
type ExtendedLayoutType = 'single' | 'split' | 'grid-2x2' | 'grid-3x3' | 'grid-4x4';

// 将 MonitorLayout 转换为扩展布局类型
const getExtendedLayoutType = (layout: MonitorLayout): ExtendedLayoutType => {
  if (layout.type === 'single') return 'single';
  if (layout.type === 'split') return 'split';
  const { rows, cols } = layout.gridSize || { rows: 2, cols: 2 };
  if (rows === 2 && cols === 2) return 'grid-2x2';
  if (rows === 3 && cols === 3) return 'grid-3x3';
  if (rows === 4 && cols === 4) return 'grid-4x4';
  return 'grid-2x2';
};

// 模拟流健康数据生成
const generateMockHealth = (cameraId: string): StreamHealth => ({
  cameraId,
  latency: Math.floor(Math.random() * 100) + 20,
  fps: Math.floor(Math.random() * 10) + 25,
  bitrate: Math.floor(Math.random() * 2000) + 1500,
  packetLoss: Math.random() * 2,
  status: Math.random() > 0.8 ? 'good' : 'excellent',
});

export const MultiCameraLayout = memo(function MultiCameraLayout({
  layout,
  cameras,
  onLayoutChange,
  onCameraSelect,
  showControls = true,
  enableDrag = true,
  className = '',
}: MultiCameraLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(layout.activeCamera);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [draggedCameraId, setDraggedCameraId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [cameraOrder, setCameraOrder] = useState<string[]>(layout.cameras);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamHealths, setStreamHealths] = useState<Record<string, StreamHealth>>({});

  // 获取布局配置
  const layoutType = getExtendedLayoutType(layout);
  const config = layoutConfigs[layoutType];

  // 计算网格样式
  const gridStyle = useMemo(() => {
    // 响应式调整
    const isMobile = containerRef.current?.clientWidth < 600;
    if (isMobile && layoutType !== 'single') {
      // 移动端自动调整为单列
      return {
        gridTemplateColumns: '1fr',
        gridTemplateRows: `repeat(${config.rows * config.cols}, 1fr)`,
      };
    }
    return {
      gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
      gridTemplateRows: `repeat(${config.rows}, 1fr)`,
    };
  }, [layoutType, config]);

  // 计算槽位数量
  const slotCount = config.rows * config.cols;

  // 获取摄像头信息
  const getCameraById = useCallback((id: string): CameraDevice | undefined => {
    return cameras.find((c) => c.id === id);
  }, [cameras]);

  // 处理摄像头选择
  const handleCameraSelect = useCallback((cameraId: string) => {
    setSelectedCameraId(cameraId);
    onCameraSelect?.(cameraId);
  }, [onCameraSelect]);

  // 处理布局变更
  const handleLayoutChange = useCallback((newLayout: MonitorLayout) => {
    setCameraOrder(newLayout.cameras);
    onLayoutChange?.(newLayout);
  }, [onLayoutChange]);

  // 处理拖拽开始
  const handleDragStart = useCallback((e: React.DragEvent, cameraId: string) => {
    e.dataTransfer.setData('cameraId', cameraId);
    setDraggedCameraId(cameraId);
  }, []);

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropTargetIndex(index);
  }, []);

  // 处理放置
  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceCameraId = e.dataTransfer.getData('cameraId');
    if (!sourceCameraId) return;

    const newOrder = [...cameraOrder];
    const sourceIndex = newOrder.indexOf(sourceCameraId);
    if (sourceIndex === -1) return;

    // 交换位置
    if (targetIndex < newOrder.length) {
      const targetCameraId = newOrder[targetIndex];
      newOrder[sourceIndex] = targetCameraId;
      newOrder[targetIndex] = sourceCameraId;
    } else {
      // 移动到空槽位
      newOrder.splice(sourceIndex, 1);
      newOrder.push(sourceCameraId);
    }

    setCameraOrder(newOrder);
    setDraggedCameraId(null);
    setDropTargetIndex(null);

    const newLayout: MonitorLayout = {
      ...layout,
      cameras: newOrder,
    };
    onLayoutChange?.(newLayout);
  }, [cameraOrder, layout, onLayoutChange]);

  // 处理全屏
  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 初始化流健康数据
  useEffect(() => {
    const healths: Record<string, StreamHealth> = {};
    cameras.forEach((camera) => {
      healths[camera.id] = generateMockHealth(camera.id);
    });
    setStreamHealths(healths);
  }, [cameras]);

  // 定期更新流健康数据
  useEffect(() => {
    const interval = setInterval(() => {
      setStreamHealths((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((cameraId) => {
          updated[cameraId] = {
            ...updated[cameraId],
            latency: Math.floor(Math.random() * 100) + 20,
            fps: Math.floor(Math.random() * 10) + 25,
          };
        });
        return updated;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 快速切换布局按钮
  const layoutButtons = [
    { type: 'single' as ExtendedLayoutType, icon: Square, label: '单画面' },
    { type: 'split' as ExtendedLayoutType, icon: MonitorPlay, label: '双分屏' },
    { type: 'grid-2x2' as ExtendedLayoutType, icon: Grid3X3, label: '4画面' },
    { type: 'grid-3x3' as ExtendedLayoutType, icon: LayoutGrid, label: '9画面' },
    { type: 'grid-4x4' as ExtendedLayoutType, icon: Monitor, label: '16画面' },
  ];

  // 快速切换布局
  const handleQuickLayoutChange = useCallback((type: ExtendedLayoutType) => {
    const newConfig = layoutConfigs[type];
    const newLayout: MonitorLayout = {
      type: type === 'single' ? 'single' : type === 'split' ? 'split' : 'grid',
      gridSize: { rows: newConfig.rows, cols: newConfig.cols },
      cameras: cameraOrder.slice(0, newConfig.rows * newConfig.cols),
      activeCamera: selectedCameraId,
    };
    handleLayoutChange(newLayout);
  }, [cameraOrder, selectedCameraId, handleLayoutChange]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}
    >
      {/* 控制栏 */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-3">
          <div className="flex items-center justify-between">
            {/* 左侧 - 布局切换 */}
            <div className="flex items-center gap-1">
              {layoutButtons.map((btn) => {
                const isActive = layoutType === btn.type;
                return (
                  <button
                    key={btn.type}
                    onClick={() => handleQuickLayoutChange(btn.type)}
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title={btn.label}
                  >
                    <btn.icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            {/* 右侧 - 设置和全屏 */}
            <div className="flex items-center gap-2">
              {/* 流健康状态 */}
              {selectedCameraId && streamHealths[selectedCameraId] && (
                <StreamHealthIndicator
                  health={streamHealths[selectedCameraId]}
                  compact
                />
              )}

              {/* 设置 */}
              <button
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                className={`p-2 rounded-lg transition-colors ${
                  showSettingsPanel
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* 全屏 */}
              <button
                onClick={handleFullscreen}
                className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
              >
                {isFullscreen ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Expand className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主网格区域 */}
      <div
        className="grid gap-1 p-1 h-full"
        style={gridStyle}
      >
        {Array.from({ length: slotCount }).map((_, index) => {
          const cameraId = cameraOrder[index];
          const camera = cameraId ? getCameraById(cameraId) : undefined;
          const isSelected = selectedCameraId === cameraId;
          const isDropTarget = dropTargetIndex === index;
          const health = cameraId ? streamHealths[cameraId] : undefined;

          return (
            <div
              key={`slot-${index}`}
              className={`
                relative rounded-lg overflow-hidden transition-all
                ${isDropTarget ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-gray-900' : ''}
                ${!camera ? 'bg-gray-800/50' : ''}
              `}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
            >
              {camera ? (
                <CameraTile
                  camera={camera}
                  isMain={isSelected && layoutType === 'single'}
                  isSelected={isSelected}
                  health={health}
                  onSelect={() => handleCameraSelect(camera.id)}
                  onFullscreen={() => {
                    handleQuickLayoutChange('single');
                    handleCameraSelect(camera.id);
                  }}
                  draggable={enableDrag}
                  onDragStart={(e) => handleDragStart(e, camera.id)}
                  className="h-full"
                />
              ) : (
                // 空槽位
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-10 h-10 border-2 border-dashed border-gray-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs text-gray-600">{index + 1}</span>
                    </div>
                    <p className="text-xs">空槽位</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 设置面板 */}
      <AnimatePresence>
        {showSettingsPanel && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-12 right-2 w-72 max-h-[80vh] overflow-y-auto z-30"
          >
            <LayoutControls
              currentLayout={layout}
              availableCameras={cameras}
              onLayoutChange={handleLayoutChange}
              className="shadow-xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 拖拽指示器 */}
      <AnimatePresence>
        {draggedCameraId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-orange-500/90 backdrop-blur-sm rounded-lg px-4 py-2 z-30"
          >
            <p className="text-white text-sm">
              拖拽 {getCameraById(draggedCameraId)?.name || '摄像头'} 到目标位置
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 响应式提示 */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-500 opacity-50">
        {config.label} · {cameraOrder.filter((id) => getCameraById(id)?.status === 'online').length}/{cameraOrder.length} 在线
      </div>
    </div>
  );
});

// 虚拟化网格组件 - 用于大网格布局优化
export const VirtualizedCameraGrid = memo(function VirtualizedCameraGrid({
  cameras,
  layout,
  onCameraSelect,
  itemHeight = 200,
  containerHeight = 600,
}: {
  cameras: CameraDevice[];
  layout: MonitorLayout;
  onCameraSelect?: (cameraId: string) => void;
  itemHeight?: number;
  containerHeight?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { rows, cols } = layout.gridSize || { rows: 4, cols: 4 };

  // 计算可见范围
  const visibleStartRow = Math.floor(scrollTop / itemHeight);
  const visibleEndRow = Math.min(
    rows,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + 1
  );

  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // 渲染可见行
  const renderVisibleRows = useMemo(() => {
    const rowsToRender = [];
    for (let row = visibleStartRow; row < visibleEndRow; row++) {
      const rowItems = [];
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        const cameraId = layout.cameras[index];
        const camera = cameras.find((c) => c.id === cameraId);
        rowItems.push(
          <div
            key={`cell-${row}-${col}`}
            className="aspect-video bg-gray-800 rounded-lg overflow-hidden"
          >
            {camera ? (
              <CameraTile
                camera={camera}
                onSelect={() => onCameraSelect?.(camera.id)}
                className="h-full"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <span className="text-xs">空槽位 {index + 1}</span>
              </div>
            )}
          </div>
        );
      }
      rowsToRender.push(
        <div
          key={`row-${row}`}
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {rowItems}
        </div>
      );
    }
    return rowsToRender;
  }, [visibleStartRow, visibleEndRow, cols, layout.cameras, cameras, onCameraSelect]);

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: rows * itemHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: visibleStartRow * itemHeight,
            left: 0,
            right: 0,
          }}
        >
          {renderVisibleRows}
        </div>
      </div>
    </div>
  );
});