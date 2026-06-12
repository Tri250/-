import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Plus,
  Battery,
  Wifi,
  Settings,
  MoreVertical,
  Bell,
  Camera,
  Activity,
  Droplets,
  Utensils,
  Zap,
  Trash2,
  Power
} from 'lucide-react';
import { cameraAdapterService } from '../services/cameraAdapterService';
import type { CameraDevice } from '../types/camera';

interface DevicesPageProps {
  onNavigate: (page: string) => void;
}

interface DeviceItem {
  id: string;
  name: string;
  type: 'camera' | 'collar' | 'dispenser' | 'bowl' | 'other';
  status: 'online' | 'offline' | 'warning';
  battery: number;
  signal: number;
  lastActive: string;
  image?: string;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({ onNavigate }) => {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    // 模拟设备数据
    const mockDevices: DeviceItem[] = [
      {
        id: '1',
        name: 'JOJO的碗',
        type: 'bowl',
        status: 'online',
        battery: 85,
        signal: 95,
        lastActive: '刚刚',
      },
      {
        id: '2',
        name: '智能项圈',
        type: 'collar',
        status: 'online',
        battery: 92,
        signal: 88,
        lastActive: '2分钟前',
      },
      {
        id: '3',
        name: '饮水机',
        type: 'dispenser',
        status: 'warning',
        battery: 15,
        signal: 72,
        lastActive: '5分钟前',
      },
      {
        id: '4',
        name: '客厅摄像头',
        type: 'camera',
        status: 'online',
        battery: 100,
        signal: 98,
        lastActive: '在线',
      },
    ];
    setDevices(mockDevices);
  }, []);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'camera': return Camera;
      case 'collar': return Activity;
      case 'dispenser': return Droplets;
      case 'bowl': return Utensils;
      default: return Zap;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '在线';
      case 'warning': return '注意';
      case 'offline': return '离线';
      default: return '未知';
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 60) return 'text-green-500';
    if (battery > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* 顶部导航 */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">我的设备</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 设备统计 */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-orange-100 text-sm">已连接设备</p>
              <p className="text-3xl font-bold">{devices.length}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm">
                {devices.filter(d => d.status === 'online').length} 在线
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-sm">
                {devices.filter(d => d.status === 'warning').length} 注意
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 设备列表 */}
      <div className="px-4 pb-24">
        <h2 className="text-base font-bold text-gray-800 mb-3">设备列表</h2>
        <div className="space-y-3">
          {devices.map((device) => {
            const DeviceIcon = getDeviceIcon(device.type);
            return (
              <div
                key={device.id}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center">
                      <DeviceIcon className="w-7 h-7 text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{device.name}</h3>
                        <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(device.status)}`}></span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{getStatusText(device.status)} · {device.lastActive}</p>
                    </div>
                  </div>
                  <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* 设备状态详情 */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Battery className={`w-4 h-4 ${getBatteryColor(device.battery)}`} />
                    <span className={`text-sm ${getBatteryColor(device.battery)}`}>{device.battery}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{device.signal}%</span>
                  </div>
                </div>

                {/* 快捷操作 */}
                <div className="flex gap-2 mt-3">
                  {device.type === 'camera' && (
                    <button
                      onClick={() => onNavigate('camera-monitor')}
                      className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
                    >
                      查看监控
                    </button>
                  )}
                  <button className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium">
                    设置
                  </button>
                  <button className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg">
                    <Bell className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 添加设备按钮 */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full mt-4 py-4 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">添加新设备</span>
        </button>
      </div>

      {/* 添加设备模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">添加设备</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Camera, name: '摄像头', desc: '实时监控' },
                { icon: Activity, name: '智能项圈', desc: '活动追踪' },
                { icon: Droplets, name: '饮水机', desc: '智能喂水' },
                { icon: Utensils, name: '喂食器', desc: '定时喂食' },
              ].map((item, index) => (
                <button
                  key={index}
                  className="p-4 bg-gray-50 rounded-xl flex flex-col items-center gap-2 hover:bg-orange-50 transition-colors"
                >
                  <item.icon className="w-8 h-8 text-orange-500" />
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="text-xs text-gray-400">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
