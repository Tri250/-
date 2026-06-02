import { useState } from 'react';
import { Camera, Smartphone, CheckCircle, AlertCircle, Loader, Wifi, User, Link } from 'lucide-react';
import { BRAND_INFO } from '../../services/cameraService';
import type { CameraBrand, BrandInfo, PairingProgress, CameraDevice } from '../../types/camera';

interface DevicePairingProps {
  onPaired: (device: CameraDevice) => void;
  onCancel: () => void;
}

type PairingStage = 'select-brand' | 'enter-info' | 'pairing' | 'success' | 'error';

export function DevicePairing({ onPaired, onCancel }: DevicePairingProps) {
  const [stage, setStage] = useState<PairingStage>('select-brand');
  const [selectedBrand, setSelectedBrand] = useState<BrandInfo | null>(null);
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('554');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accountId, setAccountId] = useState('');
  const [progress, setProgress] = useState<PairingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBrandSelect = (brand: BrandInfo) => {
    setSelectedBrand(brand);
    setStage('enter-info');
    setError(null);
  };

  const validateInputs = (): boolean => {
    if (!selectedBrand) return false;

    switch (selectedBrand.pairingMethod) {
      case 'code':
        if (!deviceCode.trim()) {
          setError('请输入设备码');
          return false;
        }
        break;
      case 'ip':
        if (!ipAddress.trim()) {
          setError('请输入IP地址');
          return false;
        }
        if (!username.trim() || !password.trim()) {
          setError('请输入用户名和密码');
          return false;
        }
        break;
      case 'account':
        if (!accountId.trim()) {
          setError('请输入账号ID或授权码');
          return false;
        }
        break;
      case 'qr':
        break;
    }
    return true;
  };

  const handleStartPairing = async () => {
    if (!validateInputs()) return;

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

    const newDevice: CameraDevice = {
      id: `cam-${Date.now()}`,
      brand: selectedBrand!.id,
      model: deviceCode || 'IP Camera',
      name: deviceName || `${selectedBrand!.name}摄像头`,
      status: 'online',
      streamUrl: ipAddress 
        ? `rtsp://${username}:${password}@${ipAddress}:${port}/stream` 
        : `https://example.com/stream/${deviceCode || Date.now()}`,
      thumbnail: `https://picsum.photos/400/300?random=${Date.now()}`,
      lastActive: new Date().toISOString(),
      ipAddress: ipAddress || undefined,
      port: port ? parseInt(port) : undefined,
      capabilities: [],
      settings: {
        resolution: '1080p',
        nightVisionMode: 'auto',
        motionDetection: { enabled: true, sensitivity: 60, notificationEnabled: true },
        recording: { mode: 'motion', quality: 'high', storage: 'sd' },
        audio: { enabled: true, volume: 80, noiseReduction: true },
        aiTracking: { enabled: false, targetType: 'pet', smoothTracking: false },
      },
      protocol: ipAddress ? 'rtsp' : 'webrtc',
    };

    setStage('success');
    onPaired(newDevice);
  };

  const handleRetry = () => {
    setStage('enter-info');
    setError(null);
    setProgress(null);
  };

  const renderInfoInput = () => {
    if (!selectedBrand) return null;

    switch (selectedBrand.pairingMethod) {
      case 'code':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                设备码 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={deviceCode}
                onChange={(e) => setDeviceCode(e.target.value)}
                placeholder="请输入设备背面的设备码"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all bg-white text-gray-800"
              />
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">如何获取设备码？</p>
                  <p className="text-blue-600">在摄像头机身底部或说明书上找到设备码</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'ip':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IP地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="例如: 192.168.1.100"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all bg-white text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                端口
              </label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="默认: 554"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all bg-white text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="设备登录用户名"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all bg-white text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="设备登录密码"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all bg-white text-gray-800"
              />
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Wifi className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">IP摄像头配置</p>
                  <p className="text-blue-600">请确保摄像头与手机在同一网络，并在摄像头设置中启用RTSP协议</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'account':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                账号授权码 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="请输入账号授权码"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all bg-white text-gray-800"
              />
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">账号授权</p>
                  <p className="text-blue-600">请在品牌官方App中获取授权码或API访问权限</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'qr':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Link className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">扫码配对</p>
                  <p className="text-blue-600">请使用品牌官方App扫描二维码完成配对</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-100 to-peach-100 flex items-center justify-center">
          <Camera className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">添加摄像头设备</h2>
        <p className="text-sm text-gray-500 mt-1">支持小米、华为、萤石、TP-Link等主流品牌</p>
      </div>

      {stage === 'select-brand' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">请选择摄像头品牌</p>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {BRAND_INFO.map((brand) => (
              <button
                key={brand.id}
                onClick={() => handleBrandSelect(brand)}
                className={`p-3 rounded-xl border-2 border-gray-200 ${brand.color} hover:shadow-md transition-all flex flex-col items-center gap-2`}
              >
                <span className="text-2xl">{brand.icon}</span>
                <span className="font-medium text-gray-800 text-sm">{brand.name}</span>
              </button>
            ))}
          </div>
          
          <button
            onClick={onCancel}
            className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors"
          >
            取消
          </button>
        </div>
      )}

      {stage === 'enter-info' && (
        <div className="space-y-4">
          <button
            onClick={() => setStage('select-brand')}
            className="text-sm text-orange-500 hover:text-orange-600"
          >
            ← 返回选择品牌
          </button>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-100">
            <span className="text-2xl">{selectedBrand?.icon}</span>
            <div>
              <h4 className="font-medium text-gray-800">{selectedBrand?.name}</h4>
              <p className="text-xs text-gray-500">{selectedBrand?.description}</p>
            </div>
          </div>

          {renderInfoInput()}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              设备名称（选填）
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="例如：客厅摄像头"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all bg-white text-gray-800"
            />
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
          <p className="text-sm text-gray-500 mb-6">请检查输入信息是否正确，或尝试重新配对</p>
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