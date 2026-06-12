import React, { useState } from 'react';
import {
  ChevronLeft,
  Camera,
  Edit3,
  Calendar,
  Weight,
  Ruler,
  Heart,
  Activity,
  FileText,
  Share2,
  ChevronRight
} from 'lucide-react';
import { usePetStore } from '../store/petStore';
import { useAppStore } from '../store/appStore';

interface PetProfilePageProps {
  onNavigate: (page: string) => void;
}

export const PetProfilePage: React.FC<PetProfilePageProps> = ({ onNavigate }) => {
  const { currentPet } = usePetStore();
  const { healthScore } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'photos'>('overview');

  // 宠物基本信息
  const petInfo = {
    name: currentPet?.name || 'JOJO',
    breed: currentPet?.breed || '柯基犬',
    age: currentPet?.age || 2,
    gender: currentPet?.gender || 'male',
    weight: '12.5',
    height: '35',
    birthday: '2022-03-15',
    avatar: currentPet?.avatar || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
  };

  // 健康数据
  const healthData = [
    { label: '健康评分', value: healthScore.toString(), unit: '分', icon: Heart, color: '#EF4444' },
    { label: '体重', value: petInfo.weight, unit: 'kg', icon: Weight, color: '#3B82F6' },
    { label: '身高', value: petInfo.height, unit: 'cm', icon: Ruler, color: '#10B981' },
    { label: '年龄', value: petInfo.age.toString(), unit: '岁', icon: Calendar, color: '#F59E0B' },
  ];

  // 疫苗记录
  const vaccineRecords = [
    { name: '狂犬疫苗', date: '2024-03-15', status: '已接种', nextDate: '2025-03-15' },
    { name: '六联疫苗', date: '2024-03-15', status: '已接种', nextDate: '2025-03-15' },
    { name: '驱虫', date: '2024-05-01', status: '已做', nextDate: '2024-06-01' },
  ];

  // 成长记录
  const growthRecords = [
    { date: '2024-05-20', weight: '12.5kg', note: '体重正常，食欲良好' },
    { date: '2024-04-20', weight: '12.2kg', note: '体重略有增加' },
    { date: '2024-03-20', weight: '11.8kg', note: '生长发育正常' },
  ];

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
          <h1 className="text-lg font-bold text-gray-800">宠物档案</h1>
          <button className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 宠物头像区 */}
      <div className="bg-white px-4 pb-6">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img
                src={petInfo.avatar}
                alt={petInfo.name}
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-gray-800">{petInfo.name}</h2>
            <span className="text-blue-500 text-lg">{petInfo.gender === 'male' ? '♂' : '♀'}</span>
          </div>
          <p className="text-sm text-gray-500">{petInfo.breed} · {petInfo.age}岁</p>
        </div>
      </div>

      {/* 健康数据卡片 */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-4 gap-3">
          {healthData.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl p-3 shadow-sm">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-bold text-gray-800">{item.value}</span>
                <span className="text-xs text-gray-500">{item.unit}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab切换 */}
      <div className="px-4 mb-4">
        <div className="flex bg-white rounded-xl p-1 shadow-sm">
          {[
            { id: 'overview', label: '概览' },
            { id: 'records', label: '记录' },
            { id: 'photos', label: '相册' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab内容 */}
      <div className="px-4 pb-24">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* 疫苗记录 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">疫苗记录</h3>
                <button className="text-sm text-orange-500">查看全部</button>
              </div>
              <div className="space-y-3">
                {vaccineRecords.map((record, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-800">{record.name}</p>
                      <p className="text-xs text-gray-400">上次: {record.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {record.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">下次: {record.nextDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 成长记录 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">成长记录</h3>
                <button className="text-sm text-orange-500">查看全部</button>
              </div>
              <div className="space-y-3">
                {growthRecords.map((record, index) => (
                  <div key={index} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{record.date}</span>
                        <span className="text-sm text-orange-500 font-medium">{record.weight}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{record.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">暂无更多记录</p>
            <button
              onClick={() => onNavigate('health-records')}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium"
            >
              添加记录
            </button>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">暂无照片</p>
            <button className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium">
              上传照片
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
