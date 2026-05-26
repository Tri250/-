import { useState } from 'react';
import { Camera, Smartphone, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import type { CameraBrand, PairingProgress } from '../../types/camera';

interface DevicePairingProps {
  onPaired: (device: any) => void;
  onCancel: () => void;
}

type PairingStage = 'select-brand' | 'enter-code' | 'pairing' | 'success' | 'error';

const brandInfo: Array<{ brand: CameraBrand; name: string; icon: string; color: string }> = [
  { brand: 'xiaomi', name: '小米米家', icon: '📱', color: 'hover:border-orange-400' },
  { brand: 'huawei', name: '华为海雀', icon: '🐦', color: 'hover:border-blue-400' },
  { brand: 'honor', name: '荣耀小值', icon: '✨', color: 'hover:border-red-400' },
];

export function DevicePairing({ onPaired, onCancel }: DevicePairingProps) {
  const [stage, setStage] = useState<PairingStage>('select-brand');
  const [selectedBrand, setSelectedBrand] = useState<CameraBrand | null>(null);
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [progress, setProgress] = useState<PairingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBrandSelect = (brand: CameraBrand) => {
    setSelectedBrand(brand);
    setStage('enter-code');
  };

  const handleStartPairing = async () => {
    if (!deviceCode.trim()) {
      setError('请输入设备码');
      return;
    }

    setStage('pairing');
    setError(null);

    const stages = [
      { stage: 'scanning' as const, message: '正在扫描设备...', delay: 800 },
      { stage: 'connecting' as const, message: '正在连接设备...', delay: 1000 },
      { stage: 'verifying' as const, message: '正在验证设备...', delay: 800 },
    ];

    for (const s of stages) {
      setProgress({ stage: s.stage, message: s.message, progress: 0 });
      await new Promise(resolve => setTimeout(resolve, s.delay));
      
      let p = 0;
      const interval = setInterval(() => {
        p += 20;
        setProgress({ stage: s.stage, message: s.message, progress: p });
        if (p >= 100) clearInterval(interval);
      }, s.delay / 5);
      
      await new Promise(resolve => setTimeout(resolve, s.delay));
    }

    setProgress({ stage: 'completed', message: '配对成功！', progress: 100 });
    await new Promise(resolve => setTimeout(resolve, 500));

    setStage('success');
    onPaired({
      id: `cam-${Date.now()}`,
      brand: selectedBrand,
      model: deviceCode,
      name: deviceName || `${brandInfo.find(b => b.brand === selectedBrand)?.name}摄像头`,
      status: 'online',
      streamUrl: `https://example.com/stream/${deviceCode}`,
      thumbnailUrl: `https://picsum.photos/400/300?random=${Date.now()}`,
      lastOnline: new Date().toISOString(),
    });
  };

  const handleRetry = () => {
    setStage('enter-code');
    setDeviceCode('');
    setError(null);
    setProgress(null);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-100 to-peach-100 flex items-center justify-center">
          <Camera className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">添加摄像头设备</h2>
        <p className="text-sm text-gray-500 mt-1">支持小米、华为、荣耀等主流品牌</p>
      </div>

      {stage === 'select-brand' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">请选择摄像头品牌</p>
          {brandInfo.map((brand) => (
            <button
              key={brand.brand}
              onClick={() => handleBrandSelect(brand.brand)}
              className={`w-full p-4 rounded-xl border-2 border-gray-200 ${brand.color} hover:shadow-md transition-all flex items-center gap-4`}
            >
              <span className="text-4xl">{brand.icon}</span>
              <span className="font-medium text-gray-800">{brand.name}</span>
            </button>
          ))}
          
          <button
            onClick={onCancel}
            className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors"
          >
            取消
          </button>
        </div>
      )}

      {stage === 'enter-code' && (
        <div className="space-y-4">
          <button
            onClick={() => setStage('select-brand')}
            className="text-sm text-orange-500 hover:text-orange-600"
          >
            ← 返回选择品牌
          </button>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              设备码 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={deviceCode}
              onChange={(e) => setDeviceCode(e.target.value)}
              placeholder="请输入设备背面的设备码"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              设备名称（选填）
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="例如：客厅摄像头"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            />
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">如何获取设备码？</p>
                <p className="text-blue-600">在摄像头机身底部或说明书上找到以"MB"或"HW"开头的设备码</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleStartPairing}
              className="flex-1 py-3 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
            >
              开始配对
            </button>
          </div>
        </div>
      )}

      {stage === 'pairing' && progress && (
        <div className="text-center py-8">
          <Loader className="w-12 h-12 mx-auto mb-4 text-orange-500 animate-spin" />
          <p className="font-medium text-gray-800 mb-2">{progress.message}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-peach-500 transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      {stage === 'success' && (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <p className="font-bold text-gray-800 text-lg mb-2">配对成功！</p>
          <p className="text-sm text-gray-500 mb-6">设备已添加到您的摄像头列表</p>
          <button
            onClick={onCancel}
            className="px-8 py-3 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
          >
            完成
          </button>
        </div>
      )}

      {stage === 'error' && (
        <div className="text-center py-8">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <p className="font-bold text-gray-800 text-lg mb-2">配对失败</p>
          <p className="text-sm text-gray-500 mb-6">请检查设备码是否正确，或尝试重新配对</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleRetry}
              className="px-6 py-3 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
            >
              重试
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
