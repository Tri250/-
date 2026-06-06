import { useEffect, useState } from 'react';
import { Camera, Plus, X, Monitor } from 'lucide-react';
import { CameraList } from '../components/camera/CameraList';
import { CameraPlayer } from '../components/camera/CameraPlayer';
import { DevicePairing } from '../components/camera/DevicePairing';
import { useCameraStore } from '../store/cameraStore';
import type { CameraDevice } from '../types/camera';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

export default function CameraPage() {
  const { devices, selectedDevice, isLoading, loadDevices, selectDevice, addDevice, removeDevice } = useCameraStore();
  const [showPairing, setShowPairing] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleDeviceClick = (device: CameraDevice) => {
    selectDevice(device);
    setShowPlayer(true);
  };

  const handleStreamClick = (device: CameraDevice) => {
    selectDevice(device);
    setShowPlayer(true);
  };

  const handleDeleteDevice = async (device: CameraDevice) => {
    if (confirm(`确定要删除 ${device.name} 吗？`)) {
      await removeDevice(device.id);
    }
  };

  const handlePaired = (device: CameraDevice) => {
    addDevice(device);
    setShowPairing(false);
  };

  const onlineDevices = devices.filter(d => d.status === 'online').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-peach-50/30 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Camera className="w-6 h-6 text-orange-500" />
                摄像头设备
              </h1>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {onlineDevices} 在线
                </span>
                <span className="text-gray-300">·</span>
                <span>{devices.length} 个设备</span>
              </p>
            </div>
            {!showPairing && (
              <button
                onClick={() => setShowPairing(true)}
                className="p-3 rounded-full bg-gradient-to-br from-orange-400 to-peach-500 text-white hover:from-orange-500 hover:to-peach-600 transition-all shadow-lg hover:shadow-xl"
                aria-label="添加设备"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {showPairing ? (
          <div className="mb-4">
            <button
              onClick={() => setShowPairing(false)}
              className="mb-4 text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1 font-medium"
            >
              <X className="w-4 h-4" />
              取消配对
            </button>
            <DevicePairing
              onPaired={handlePaired}
              onCancel={() => setShowPairing(false)}
            />
          </div>
        ) : showPlayer && selectedDevice ? (
          <div className="mb-4 space-y-4">
            <button
              onClick={() => {
                setShowPlayer(false);
                selectDevice(null);
              }}
              className="mb-4 text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1 font-medium"
            >
              <X className="w-4 h-4" />
              返回设备列表
            </button>
            <CameraPlayer
              device={selectedDevice}
              className="aspect-video rounded-2xl overflow-hidden shadow-lg"
            />
            <Card variant="default" padding="medium">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-500" />
                设备信息
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">设备名称</span>
                  <span className="text-gray-800 font-medium">{selectedDevice.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">品牌</span>
                  <Badge color="blue" size="small">{selectedDevice.brand}</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">型号</span>
                  <span className="text-gray-800">{selectedDevice.model}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">状态</span>
                  <div className="flex items-center gap-2">
                    {selectedDevice.status === 'online' ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-green-600 font-medium">在线</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span className="text-gray-500">离线</span>
                      </>
                    )}
                  </div>
                </div>
                {selectedDevice.location && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 text-sm">位置</span>
                    <span className="text-gray-800">{selectedDevice.location}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <>
            <CameraList
              devices={devices}
              onDeviceClick={handleDeviceClick}
              onStreamClick={handleStreamClick}
              onDeleteDevice={handleDeleteDevice}
              onAddClick={() => setShowPairing(true)}
              loading={isLoading}
            />
            
            {devices.length === 0 && !isLoading && (
              <EmptyState
                icon={<Monitor className="w-12 h-12" />}
                title="还没有摄像头设备"
                description="添加摄像头设备，随时随地关注宝贝的动态"
                action={{
                  label: '添加设备',
                  onClick: () => setShowPairing(true),
                  icon: <Plus className="w-5 h-5" />
                }}
              />
            )}
          </>
        )}
      </main>

      {devices.length === 0 && !isLoading && !showPairing && (
        <div className="fixed bottom-20 left-0 right-0 p-4 max-w-md mx-auto">
          <Card variant="gradient" padding="medium">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-peach-100 flex items-center justify-center flex-shrink-0">
                <Monitor className="w-7 h-7 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 mb-1">还没有摄像头设备</p>
                <p className="text-xs text-gray-500">点击右上角添加设备开始监控</p>
              </div>
              <button
                onClick={() => setShowPairing(true)}
                className="px-4 py-2 bg-gradient-to-br from-orange-400 to-peach-500 text-white rounded-full text-sm font-medium hover:from-orange-500 hover:to-peach-600 transition-all shadow-md"
              >
                添加
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
