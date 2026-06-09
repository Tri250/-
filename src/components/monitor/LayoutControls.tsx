// ============================================
// PawSync Pro 3.0 - Layout Controls Component
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 布局控制组件
// ============================================

import { memo, useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Grid3X3,
  Square,
  LayoutGrid,
  Plus,
  X,
  GripVertical,
  Monitor,
  MonitorPlay,
  ChevronDown,
  Settings,
} from 'lucide-react';
import type { CameraDevice } from '../../types/camera';
import type { MonitorLayout } from '../../types/monitor';

interface LayoutControlsProps {
  currentLayout: MonitorLayout;
  availableCameras: CameraDevice[];
  onLayoutChange: (layout: MonitorLayout) => void;
  className?: string;
}

// 布局类型配置
const layoutOptions = [
  {
    type: 'single' as const,
    label: '单画面',
    icon: Square,
    description: '1个摄像头',
    gridSize: { rows: 1, cols: 1 },
  },
  {
    type: 'split' as const,
    label: '双分屏',
    icon: MonitorPlay,
    description: '2个摄像头',
    gridSize: { rows: 1, cols: 2 },
  },
  {
    type: 'grid' as const,
    label: '4画面',
    icon: Grid3X3,
    description: '2x2 网格',
    gridSize: { rows: 2, cols: 2 },
  },
  {
    type: 'grid' as const,
    label: '9画面',
    icon: LayoutGrid,
    description: '3x3 网格',
    gridSize: { rows: 3, cols: 3 },
  },
  {
    type: 'grid' as const,
    label: '16画面',
    icon: Monitor,
    description: '4x4 网格',
    gridSize: { rows: 4, cols: 4 },
  },
];

// 判断布局是否匹配
const isLayoutMatch = (
  layout: MonitorLayout,
  type: string,
  gridSize?: { rows: number; cols: number }
): boolean => {
  if (type === 'single') {
    return layout.type === 'single';
  }
  if (type === 'split') {
    return layout.type === 'split';
  }
  if (gridSize) {
    return (
      layout.type === 'grid' &&
      layout.gridSize?.rows === gridSize.rows &&
      layout.gridSize?.cols === gridSize.cols
    );
  }
  return false;
};

export const LayoutControls = memo(function LayoutControls({
  currentLayout,
  availableCameras,
  onLayoutChange,
  className = '',
}: LayoutControlsProps) {
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [showCameraManager, setShowCameraManager] = useState(false);
  const [cameraOrder, setCameraOrder] = useState<string[]>(currentLayout.cameras);

  // 获取当前布局标签
  const getCurrentLayoutLabel = (): string => {
    if (currentLayout.type === 'single') return '单画面';
    if (currentLayout.type === 'split') return '双分屏';
    if (currentLayout.type === 'grid') {
      const { rows, cols } = currentLayout.gridSize || { rows: 2, cols: 2 };
      return `${rows * cols}画面`;
    }
    return '自定义';
  };

  // 选择布局
  const handleSelectLayout = (option: typeof layoutOptions[0]) => {
    const newLayout: MonitorLayout = {
      type: option.type,
      gridSize: option.gridSize,
      cameras: currentLayout.cameras.slice(0, option.gridSize.rows * option.gridSize.cols),
      activeCamera: currentLayout.activeCamera,
    };
    onLayoutChange(newLayout);
    setShowLayoutPicker(false);
  };

  // 添加摄像头
  const handleAddCamera = (camera: CameraDevice) => {
    if (!currentLayout.cameras.includes(camera.id)) {
      const newLayout: MonitorLayout = {
        ...currentLayout,
        cameras: [...currentLayout.cameras, camera.id],
      };
      onLayoutChange(newLayout);
    }
  };

  // 移除摄像头
  const handleRemoveCamera = (cameraId: string) => {
    const newLayout: MonitorLayout = {
      ...currentLayout,
      cameras: currentLayout.cameras.filter((id) => id !== cameraId),
      activeCamera: currentLayout.activeCamera === cameraId ? undefined : currentLayout.activeCamera,
    };
    onLayoutChange(newLayout);
  };

  // 重新排序摄像头
  const handleReorder = (newOrder: string[]) => {
    setCameraOrder(newOrder);
    const newLayout: MonitorLayout = {
      ...currentLayout,
      cameras: newOrder,
    };
    onLayoutChange(newLayout);
  };

  // 获取摄像头信息
  const getCameraById = (id: string): CameraDevice | undefined => {
    return availableCameras.find((c) => c.id === id);
  };

  // 获取未添加的摄像头
  const unaddedCameras = availableCameras.filter(
    (c) => !currentLayout.cameras.includes(c.id)
  );

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 ${className}`}>
      {/* 布局选择 */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">布局方式</label>
        <div className="relative">
          <button
            onClick={() => setShowLayoutPicker(!showLayoutPicker)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span className="text-white text-sm">{getCurrentLayoutLabel()}</span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${showLayoutPicker ? 'rotate-180' : ''}`}
            />
          </button>

          {/* 布局选项下拉 */}
          <AnimatePresence>
            {showLayoutPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-20"
              >
                {layoutOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = isLayoutMatch(currentLayout, option.type, option.gridSize);
                  return (
                    <button
                      key={`${option.type}-${option.gridSize?.rows || 1}-${option.gridSize?.cols || 1}`}
                      onClick={() => handleSelectLayout(option)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700/50 transition-colors ${
                        isActive ? 'bg-orange-500/20 text-orange-400' : 'text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-xs text-gray-400">{option.description}</p>
                      </div>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 摄像头管理 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-400">摄像头列表</label>
          <button
            onClick={() => setShowCameraManager(!showCameraManager)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* 已添加的摄像头 */}
        <div className="space-y-1 mb-3">
          {currentLayout.cameras.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">暂无摄像头</p>
          ) : (
            <Reorder.Group
              axis="y"
              values={cameraOrder}
              onReorder={handleReorder}
              className="space-y-1"
            >
              {currentLayout.cameras.map((cameraId) => {
                const camera = getCameraById(cameraId);
                if (!camera) return null;
                return (
                  <Reorder.Item
                    key={cameraId}
                    value={cameraId}
                    className="flex items-center gap-2 px-2 py-1.5 bg-gray-700/50 rounded-lg cursor-move hover:bg-gray-700 transition-colors"
                  >
                    <GripVertical className="w-4 h-4 text-gray-500" />
                    <div
                      className={`w-2 h-2 rounded-full ${
                        camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm text-white flex-1 truncate">{camera.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCamera(cameraId);
                      }}
                      className="p-1 hover:bg-gray-600 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          )}
        </div>

        {/* 添加摄像头 */}
        <AnimatePresence>
          {showCameraManager && unaddedCameras.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-700 pt-3"
            >
              <p className="text-xs text-gray-400 mb-2">可用摄像头</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {unaddedCameras.map((camera) => (
                  <button
                    key={camera.id}
                    onClick={() => handleAddCamera(camera)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-400" />
                    <div
                      className={`w-2 h-2 rounded-full ${
                        camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm text-white flex-1 text-left truncate">
                      {camera.name}
                    </span>
                    {camera.location && (
                      <span className="text-xs text-gray-400">{camera.location}</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 快速添加按钮 */}
        {unaddedCameras.length > 0 && !showCameraManager && (
          <button
            onClick={() => setShowCameraManager(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">添加摄像头</span>
          </button>
        )}
      </div>

      {/* 布局预览 */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <label className="text-sm text-gray-400 mb-2 block">布局预览</label>
        <div className="bg-gray-900 rounded-lg p-2">
          <LayoutPreview layout={currentLayout} cameras={availableCameras} />
        </div>
      </div>
    </div>
  );
});

// 布局预览组件
const LayoutPreview = memo(function LayoutPreview({
  layout,
  cameras,
}: {
  layout: MonitorLayout;
  cameras: CameraDevice[];
}) {
  const getGridStyle = () => {
    if (layout.type === 'single') {
      return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
    }
    if (layout.type === 'split') {
      return { gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: '1fr' };
    }
    const { rows, cols } = layout.gridSize || { rows: 2, cols: 2 };
    return {
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
    };
  };

  const getSlotCount = (): number => {
    if (layout.type === 'single') return 1;
    if (layout.type === 'split') return 2;
    const { rows, cols } = layout.gridSize || { rows: 2, cols: 2 };
    return rows * cols;
  };

  const getCameraById = (id: string): CameraDevice | undefined => {
    return cameras.find((c) => c.id === id);
  };

  return (
    <div
      className="grid gap-1 aspect-video"
      style={getGridStyle()}
    >
      {Array.from({ length: getSlotCount() }).map((_, index) => {
        const cameraId = layout.cameras[index];
        const camera = cameraId ? getCameraById(cameraId) : undefined;
        return (
          <div
            key={index}
            className={`
              bg-gray-800 rounded aspect-video flex items-center justify-center
              ${camera ? 'border border-gray-600' : 'border border-dashed border-gray-700'}
            `}
          >
            {camera ? (
              <div className="text-center">
                <div
                  className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                    camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <p className="text-xs text-gray-400 truncate max-w-[60px]">{camera.name}</p>
              </div>
            ) : (
              <Plus className="w-4 h-4 text-gray-600" />
            )}
          </div>
        );
      })}
    </div>
  );
});