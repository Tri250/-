import { useState, useEffect } from 'react';
import { Camera, Smartphone, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useCameraStore } from '../../store/cameraStore';

interface DevicePairingProps {
  onPaired: (device: any) => void;
  onCancel: () => void;
}

type PairingStage = 'select-brand' | 'enter-details' | 'pairing' | 'success' | 'error';

const officialBrands = [
  { brand: 'pawsync', name: 'Pawsync 标准款', icon: '🐾', color: 'hover:border-orange-400' },
  { brand: 'pawsync_pro', name: 'Pawsync Pro 专业版', icon: '🦴', color: 'hover:border-blue-400' },
  { brand: 'pawsync_petcam', name: 'Pawsync PetCam 迷你款', icon: '📹', color: 'hover:border-green-400' },
];

const officialModels = {
  pawsync: ['PetCam V1', 'PetCam V2', 'PetCam Mini'],
  pawsync_pro: ['PetCam Pro', 'PetCam Pro X'],
  pawsync_petcam: ['PetCam Mini', 'PetCam Tiny'],
};

export function DevicePairing({ onPaired, onCancel }: DevicePairingProps) {
  const { bindDevice, isPairing, seedWhitelist } = useCameraStore();
  const [stage, setStage] = useState<PairingStage>('select-brand');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [serialNumber, setSerialNumber] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [location, setLocation] = useState('');
  const [petId, setPetId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    seedWhitelist();
  }, [seedWhitelist]);

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel(officialModels[brand as keyof typeof officialModels][0]);
    setStage('enter-details');
  };

  const handleStartPairing = async () => {
    if (!selectedBrand || !selectedModel || !serialNumber.trim()) {
      setError('请完整填写设备信息');
      return;
    }

    setStage('pairing');
    setError(null);

    try {
      const newDevice = await bindDevice({
        name: deviceName || `${officialBrands.find(b => b.brand === selectedBrand)?.name}`,
        brand: selectedBrand,
        model: selectedModel,
        serialNumber: serialNumber.trim(),
        petId,
        location: location || undefined,
      });
      
      setStage('success');
      onPaired(newDevice);
    } catch (err) {
      setError(err instanceof Error ? err.message : '设备绑定失败');
      setStage('error');
    }
  };

  const handleRetry = () => {
    setStage('enter-details');
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-100 to-peach-100 flex items-center justify-center">
          <Camera className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">添加官方摄像头设备</h2>
        <p className="text-sm text-gray-500 mt-1">仅支持 Pawsync 官方摄像头设备</p>
      </div>

      {stage === 'select-brand' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">请选择官方摄像头型号</p>
          {officialBrands.map((brand) => (
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

      {stage === 'enter-details' && (
        <div className="space-y-4">
          <button
            onClick={() => setStage('select-brand')}
            className="text-sm text-orange-500 hover:text-orange-600"
          >
            ← 返回选择型号
          </button>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              设备型号
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            >
              {officialModels[selectedBrand as keyof typeof officialModels].map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              设备序列号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="例如：PSV1-XXXX-XXXX"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              安装位置（选填）
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例如：客厅、卧室、阳台"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            />
          </div>

          <div className="bg-orange-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-700">
                <p className="font-medium mb-1">重要提示</p>
                <p>本平台仅支持 Pawsync 官方摄像头设备，不兼容第三方品牌。请确保您的设备是官方正品。</p>
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
              disabled={isPairing}
              className="flex-1 py-3 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPairing ? '绑定中...' : '开始绑定'}
            </button>
          </div>
        </div>
      )}

      {stage === 'pairing' && (
        <div className="text-center py-8">
          <Loader className="w-12 h-12 mx-auto mb-4 text-orange-500 animate-spin" />
          <p className="font-medium text-gray-800 mb-2">正在绑定设备...</p>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-peach-500 animate-pulse"
              style={{ width: '60%' }}
            />
          </div>
        </div>
      )}

      {stage === 'success' && (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <p className="font-bold text-gray-800 text-lg mb-2">绑定成功！</p>
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
          <p className="font-bold text-gray-800 text-lg mb-2">绑定失败</p>
          <p className="text-sm text-gray-500 mb-6">
            {error || '请检查设备是否为官方正品，或确认序列号是否正确'}
          </p>
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
