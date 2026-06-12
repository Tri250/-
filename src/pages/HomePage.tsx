import React, { useState, useEffect, useCallback } from 'react';
import { 
  Stethoscope, 
  FileText, 
  Utensils, 
  PawPrint,
  ChevronRight,
  Plus,
  Battery,
  Droplets,
  Flame,
  Clock,
  Activity,
  Dog,
  Cat,
  Zap
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { usePetStore } from '../store/petStore';
import { useBondStore } from '../store/bondStore';
import { cameraAdapterService } from '../services/cameraAdapterService';
import type { CameraDevice } from '../types/camera';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

// 功能网格项
interface FeatureItem {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  page: string;
}

// 设备项
interface DeviceItem {
  id: string;
  name: string;
  type: 'bowl' | 'collar' | 'dispenser' | 'other';
  status: 'online' | 'offline';
  battery: number;
  image?: string;
}

// 饮食数据项
interface DietDataItem {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'alert';
  color: string;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { currentPet, healthScore } = useAppStore();
  const { pets, currentPetId, setCurrentPet } = usePetStore();
  const { metrics, totalPoints, streakDays } = useBondStore();
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载数据
  const loadData = useCallback(async () => {
    const devices = await cameraAdapterService.getDevices();
    setCameras(devices);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 功能网格数据
  const features: FeatureItem[] = [
    {
      icon: Stethoscope,
      label: 'AI问诊',
      description: '智能问答',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      page: 'ai-consultant',
    },
    {
      icon: FileText,
      label: '健康报告',
      description: '今日生成',
      color: '#10B981',
      bgColor: '#ECFDF5',
      page: 'health-report',
    },
    {
      icon: Utensils,
      label: '饮食建议',
      description: '科学喂养',
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      page: 'diet-advice',
    },
    {
      icon: PawPrint,
      label: '宠物档案',
      description: '记录成长',
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
      page: 'pet-profile',
    },
  ];

  // 模拟设备数据
  const devices: DeviceItem[] = [
    { id: '1', name: 'JOJO的碗', type: 'bowl', status: 'online', battery: 85 },
    { id: '2', name: '智能项圈', type: 'collar', status: 'online', battery: 92 },
    { id: '3', name: '饮水机', type: 'dispenser', status: 'online', battery: 78 },
  ];

  // 饮食数据
  const dietData: DietDataItem[] = [
    { icon: Utensils, label: '进食次数', value: '8', unit: '次', status: 'normal', color: '#3B82F6' },
    { icon: Activity, label: '进食总量', value: '320', unit: 'g', status: 'normal', color: '#10B981' },
    { icon: Flame, label: '消耗卡路里', value: '280', unit: 'kcal', status: 'normal', color: '#F59E0B' },
    { icon: Clock, label: '进食时长', value: '12', unit: '分钟', status: 'normal', color: '#8B5CF6' },
  ];

  // 获取宠物头像
  const getPetAvatar = (pet: typeof pets[0]) => {
    if (pet.avatar) return pet.avatar;
    return pet.type === 'dog' 
      ? 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop'
      : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop';
  };

  // 获取设备图标
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'bowl': return Utensils;
      case 'collar': return Activity;
      case 'dispenser': return Droplets;
      default: return Zap;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-orange-200 mb-4"></div>
          <div className="text-orange-500 font-medium">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      {/* 顶部宠物信息区 */}
      <div className="bg-gradient-to-b from-white to-[#FAF7F2] px-4 pt-12 pb-4">
        {/* 宠物信息卡片 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
              <img 
                src={getPetAvatar(currentPet || pets[0])} 
                alt={currentPet?.name || '宠物'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-800">{currentPet?.name || 'JOJO'}</h1>
              <span className="text-blue-500">
                {currentPet?.gender === 'male' ? '♂' : '♀'}
              </span>
            </div>
            <p className="text-sm text-gray-500">{currentPet?.breed || '柯基犬'} · {currentPet?.age || 2}岁</p>
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 rounded-full">
              <Zap className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-700 font-medium">活力充沛</span>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('pet-profile')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 宠物心情语录 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl text-gray-300">"</span>
            <div className="flex-1">
              <p className="text-gray-700 text-sm leading-relaxed">
                今天我跑了多少圈，感觉活力满满呀~
              </p>
            </div>
            <div className="flex items-center gap-2">
              <img 
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=60&h=60&fit=crop" 
                alt="pet"
                className="w-10 h-10 rounded-lg object-cover"
              />
              <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 rounded-full text-xs text-blue-600 font-medium">
                孪生宠物
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 宠物3D展示区 */}
        <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
          <img 
            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop" 
            alt="3D Pet"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      </div>

      {/* 功能网格 */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-3">
          {features.map((feature, index) => (
            <button
              key={index}
              onClick={() => onNavigate(feature.page)}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow active:scale-95"
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: feature.bgColor }}
              >
                <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <span className="text-sm font-medium text-gray-800">{feature.label}</span>
              <span className="text-xs text-gray-400">{feature.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 我的设备 */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">我的设备</h2>
          <button 
            onClick={() => onNavigate('devices')}
            className="flex items-center gap-1 text-sm text-gray-500"
          >
            查看全部
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {devices.map((device) => {
            const DeviceIcon = getDeviceIcon(device.type);
            return (
              <button
                key={device.id}
                onClick={() => onNavigate('camera-monitor')}
                className="flex-shrink-0 w-24 bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative mb-2">
                  <div className="w-16 h-16 mx-auto bg-gray-50 rounded-xl flex items-center justify-center">
                    <DeviceIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="absolute top-0 right-0 flex items-center gap-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">在线</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-800 text-center truncate">{device.name}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Battery className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{device.battery}%</span>
                </div>
              </button>
            );
          })}
          <button className="flex-shrink-0 w-24 bg-gray-50 rounded-2xl p-3 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-xs text-gray-500">添加设备</span>
          </button>
        </div>
      </div>

      {/* 今日饮食数据 */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">今日饮食数据</h2>
          <button 
            onClick={() => onNavigate('diet-data')}
            className="flex items-center gap-1 text-sm text-gray-500"
          >
            更多数据
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {dietData.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-gray-800">{item.value}</span>
                <span className="text-sm text-gray-500">{item.unit}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-400">正常</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 积分和亲密度 */}
      <div className="px-4">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
            <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
              <Zap className="w-3 h-3 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">{totalPoints} 积分</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
              <Activity className="w-3 h-3 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">{metrics.overall}% 亲密度</span>
          </div>
        </div>
      </div>
    </div>
  );
};
