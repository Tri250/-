import { useState } from 'react';
import { Camera, Smartphone, CheckCircle, AlertCircle, Loader, Wifi, User, Link } from 'lucide-react';
import { BRAND_INFO } from '../../services/cameraService';
import type { BrandInfo, PairingProgress, CameraDevice } from '../../types/camera';

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
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                设备码 <span className="text-danger-400">*</span>
              </label>
              <input
                type="text"
                value={deviceCode}
                onChange={(e) => setDeviceCode(e.target.value)}
                placeholder="请输入设备背面的设备码"
                className="w-full px-4 py-3 rounded-xl border border-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-neutral-800 text-white placeholder-neutral-500"
              />
            </div>
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-primary-300">
                  <p className="font-medium mb-1">如何获取设备码？</p>
                  <p className="text-primary-400/70">在摄像头机身底部或说明书上找到设备码</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'ip':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                IP地址 <span className="text-danger-400">*</span>
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="例如: 192.168.1.100"
                className="w-full px-4 py-3 rounded-xl border border-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-neutral-800 text-white placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                端口
              </label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="默认: 554"
                className="w-full px-4 py-3 rounded-xl border border-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-neutral-800 text-white placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                用户名 <span className="text-danger-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="设备登录用户名"
                className="w-full px-4 py-3 rounded-xl border border-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-neutral-800 text-white placeholder-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                密码 <span className="text-danger-400">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="设备登录密码"
                className="w-full px-4 py-3 rounded-xl border border-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-neutral-800 text-white placeholder-neutral-500"
              />
            </div>
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Wifi className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-primary-300">
                  <p className="font-medium mb-1">IP摄像头配置</p>
                  <p className="text-primary-400/70">请确保摄像头与手机在同一网络，并在摄像头设置中启用RTSP协议</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'account':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                账号授权码 <span className="text-danger-400">*</span>
              </label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="请输入账号授权码"
                className="w-full px-4 py-3 rounded-xl border border-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-neutral-800 text-white placeholder-neutral-500"
              />
            </div>
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-primary-300">
                  <p className="font-medium mb-1">账号授权</p>
                  <p className="text-primary-400/70">请在品牌官方App中获取授权码或API访问权限</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'qr':
        return (
          <div className="space-y-4">
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Link className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-primary-300">
                  <p className="font-medium mb-1">扫码配对</p>
                  <p className="text-primary-400/70">请使用品牌官方App扫描二维码完成配对</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-neutral-900 rounded-2xl p-6 shadow-lg max-w-md mx-auto border border-neutral-800">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center border border-primary-500/30">
          <Camera className="w-8 h-8 text-primary-400" />
        </div>
        <h2 className="text-xl font-bold text-white">添加摄像头设备</h2>
        <p className="text-sm text-neutral-400 mt-1">支持小米、华为、萤石、TP-Link等主流品牌</p>
      </div>

      {stage === 'select-brand' && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-300 mb-4">请选择摄像头品牌</p>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {BRAND_INFO.map((brand) => (
              <button
                key={brand.id}
                onClick={() => handleBrandSelect(brand)}
                className={`p-3 rounded-xl border-2 border-neutral-700 bg-neutral-800/50 hover:border-primary-500/50 hover:bg-neutral-800 transition-all flex flex-col items-center gap-2 group`}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{brand.icon}</span>
                <span className="font-medium text-neutral-200 text-sm">{brand.name}</span>
              </button>
            ))}
          </div>
          
          <button
            onClick={onCancel}
            className="w-full py-3 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            取消
          </button>
        </div>
      )}

      {stage === 'enter-info' && (
        <div className="space-y-4">
          <button
            onClick={() => setStage('select-brand')}
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            ← 返回选择品牌
          </button>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/50 border border-neutral-700">
            <span className="text-2xl">{selectedBrand?.icon}</span>
            <div>
              <h4 className="font-medium text-white">{selectedBrand?.name}</h4>
              <p className="text-xs text-neutral-400">{selectedBrand?.description}</p>
            </div>
          </div>

          {renderInfoInput()}

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              设备名称（选填）
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="例如：客厅摄像头"
              className="w-full px-4 py-3 rounded-xl border border-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-neutral-800 text-white placeholder-neutral-500"
            />
          </div>

          {error && (
            <div className="bg-danger-500/10 border border-danger-500/30 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-danger-400 flex-shrink-0" />
              <p className="text-sm text-danger-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleStartPairing}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all font-medium shadow-lg shadow-primary-500/20"
            >
              开始配对
            </button>
          </div>
        </div>
      )}

      {stage === 'pairing' && progress && (
        <div className="text-center py-8">
          <Loader className="w-12 h-12 mx-auto mb-4 text-primary-400 animate-spin" />
          <p className="font-medium text-white mb-2">{progress.message}</p>
          <div className="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      {stage === 'success' && (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success-400" />
          <p className="font-bold text-white text-lg mb-2">配对成功！</p>
          <p className="text-sm text-neutral-400 mb-6">设备已添加到您的摄像头列表</p>
          <button
            onClick={onCancel}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all font-medium shadow-lg shadow-primary-500/20"
          >
            完成
          </button>
        </div>
      )}

      {stage === 'error' && (
        <div className="text-center py-8">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-danger-400" />
          <p className="font-bold text-white text-lg mb-2">配对失败</p>
          <p className="text-sm text-neutral-400 mb-6">请检查输入信息是否正确，或尝试重新配对</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleRetry}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all font-medium shadow-lg shadow-primary-500/20"
            >
              重试
            </button>
          </div>
        </div>
      )}
    </div>
  );
}