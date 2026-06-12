/**
 * DevicesPage - 设备页面（温情科技风格）
 *
 * 设计参考：
 * - 顶部"我的设备"标题 + 副标题
 * - 宠物主图 + 圆形宠物头像
 * - 标签页：全部设备/喂食设备/穿戴设备
 * - 设备列表卡片（含电量、状态、今日数据）
 * - 添加设备入口
 */

import React, { useState } from 'react';
import {
  ChevronRight,
  Plus,
  Edit3,
  Battery,
  Utensils,
  Footprints,
  Droplet,
  Apple,
  Activity,
  ListFilter,
  Dog,
} from 'lucide-react';
import { WarmContainer, WarmCard, SectionTitle } from '../components/WarmContainer';
import { useAppStore } from '../store/appStore';

export const DevicesPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentPet } = useAppStore();
  const petName = currentPet?.name || 'JOJO';
  const [activeTab, setActiveTab] = useState<'all' | 'feed' | 'wear'>('all');

  const devices = [
    {
      id: '1',
      name: `${petName}的碗`,
      type: 'feed',
      online: true,
      battery: 85,
      icon: Utensils,
      color: '#f59e0b',
      data: [
        { icon: Apple, label: '今日喂食', value: '2次' },
        { icon: Utensils, label: '今日进食', value: '320g' },
        { icon: Activity, label: '设备状态', value: '正常' },
      ],
    },
    {
      id: '2',
      name: '智能项圈',
      type: 'wear',
      online: true,
      battery: 92,
      icon: Footprints,
      color: '#3b82f6',
      data: [
        { icon: Footprints, label: '今日步数', value: '5780步' },
        { icon: Activity, label: '今日活动', value: '68分钟' },
        { icon: Activity, label: '设备状态', value: '正常' },
      ],
    },
    {
      id: '3',
      name: '饮水机',
      type: 'feed',
      online: true,
      battery: 78,
      icon: Droplet,
      color: '#06b6d4',
      data: [
        { icon: Droplet, label: '今日饮水', value: '5次' },
        { icon: Droplet, label: '今日饮水量', value: '1200ml' },
        { icon: Activity, label: '设备状态', value: '正常' },
      ],
    },
  ];

  const filteredDevices = devices.filter((d) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'feed') return d.type === 'feed';
    if (activeTab === 'wear') return d.type === 'wear';
    return true;
  });

  return (
    <WarmContainer>
      {/* 顶部 */}
      <div className="px-4 pt-6 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的设备</h1>
          <p className="text-sm text-gray-500 mt-1">智能设备，守护爱宠每一天</p>
        </div>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(255, 220, 180, 0.4)',
          }}
        >
          <Plus className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* 宠物主图区域 */}
      <div
        className="mx-4 mt-3 rounded-2xl overflow-hidden relative"
        style={{
          height: '160px',
          background: 'linear-gradient(135deg, #f5e6d3 0%, #d4a574 100%)',
        }}
      >
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255, 255, 255, 0.9)' }}
          >
            <Dog className="w-16 h-16 text-amber-700" strokeWidth={1.5} />
          </div>
        </div>
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-[11px] font-medium"
          style={{ background: 'rgba(255, 255, 255, 0.85)', color: '#92400e' }}
        >
          3 台设备在线
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        {/* 标签页 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className="pb-2 text-sm font-semibold relative"
              style={{ color: activeTab === 'all' ? '#f97316' : '#6b7280' }}
            >
              全部设备 (3)
              {activeTab === 'all' && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: '#f97316' }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className="pb-2 text-sm font-medium relative"
              style={{ color: activeTab === 'feed' ? '#f97316' : '#6b7280' }}
            >
              喂食设备 (1)
              {activeTab === 'feed' && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: '#f97316' }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('wear')}
              className="pb-2 text-sm font-medium relative"
              style={{ color: activeTab === 'wear' ? '#f97316' : '#6b7280' }}
            >
              穿戴设备 (1)
              {activeTab === 'wear' && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: '#f97316' }}
                />
              )}
            </button>
          </div>
          <button className="w-8 h-8 flex items-center justify-center">
            <ListFilter className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* 设备列表 */}
        <div className="space-y-3">
          {filteredDevices.map((device) => {
            const Icon = device.icon;
            return (
              <WarmCard key={device.id} padding="md">
                <div className="flex items-start gap-3">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    <Icon className="w-9 h-9" style={{ color: device.color }} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-gray-900">{device.name}</h3>
                        <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <button
                        className="px-3 py-1 rounded-full text-[11px] font-medium"
                        style={{
                          background: 'rgba(249, 115, 22, 0.1)',
                          color: '#ea580c',
                        }}
                      >
                        设备管理
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-2 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-600">在线</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">
                        {device.type === 'wear' ? '剩余电量' : '滤芯剩余'} {device.battery}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                      {device.data.map((item, i) => {
                        const DataIcon = item.icon;
                        return (
                          <div key={i} className="flex flex-col items-center text-center">
                            <div className="flex items-center gap-1 mb-1">
                              <DataIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-[10px] text-gray-500">{item.label}</span>
                            </div>
                            <span className="text-[13px] font-semibold text-gray-900">
                              {item.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </WarmCard>
            );
          })}
        </div>

        {/* 添加设备 */}
        <div
          className="rounded-2xl p-6 flex flex-col items-center justify-center text-center"
          style={{
            background: 'rgba(255, 251, 244, 0.6)',
            border: '1.5px dashed rgba(249, 115, 22, 0.3)',
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ background: 'rgba(249, 115, 22, 0.1)' }}
          >
            <Plus className="w-6 h-6" style={{ color: '#f97316' }} />
          </div>
          <h3 className="text-base font-bold text-gray-900">添加设备</h3>
          <p className="text-xs text-gray-500 mt-1">添加更多智能设备，开启智慧养宠生活</p>
        </div>

        <div className="h-4" />
      </main>
    </WarmContainer>
  );
};

export default DevicesPage;
