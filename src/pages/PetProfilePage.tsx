import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Plus,
  Syringe,
  Droplets,
  Trash2,
  Download
} from 'lucide-react';
import { usePetStore } from '../store/petStore';
import { useAppStore } from '../store/appStore';
import { useHealthStore } from '../store/healthStore';
import { useReminderStore } from '../store/reminderStore';
import { Card, Badge, EmptyState } from '../components/DesignSystem';
import { useResponsiveStyle } from '../lib/responsive';

interface PetProfilePageProps {
  onNavigate: (page: string) => void;
}

export const PetProfilePage: React.FC<PetProfilePageProps> = ({ onNavigate }) => {
  const { currentPet, getCurrentPet, getPetVaccines, getPetGrowth, addVaccine, addGrowthRecord, updatePet } = usePetStore();
  const { healthScore } = useAppStore();
  const { getScore, getMetricsByPet, addMetric } = useHealthStore();
  const { getFilteredReminders, addReminder } = useReminderStore();
  const responsiveStyle = useResponsiveStyle();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'photos'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // 获取当前宠物数据
  const pet = getCurrentPet();
  const petId = pet?.id || '1';
  
  // 获取健康评分 - 使用默认值防止 undefined
  const healthScoreData = getScore(petId) || { overall: 0, physical: 0, mental: 0, nutrition: 0, activity: 0, lastUpdated: '' };
  
  // 获取疫苗记录
  const vaccines = getPetVaccines(petId);
  
  // 获取成长记录
  const growthRecords = getPetGrowth(petId);
  
  // 获取健康指标
  const healthMetrics = getMetricsByPet(petId);
  
  // 获取提醒
  const reminders = getFilteredReminders(petId);

  // 健康数据卡片
  const healthData = [
    { 
      label: '健康评分', 
      value: (healthScoreData?.overall || 0).toString(), 
      unit: '分', 
      icon: Heart, 
      color: '#EF4444',
      trend: (healthScoreData?.physical || 0) > 80 ? 'up' : 'stable'
    },
    { 
      label: '体重', 
      value: pet?.weight?.toString() || healthMetrics.find(m => m?.type === 'weight')?.value?.toString() || '12.5', 
      unit: 'kg', 
      icon: Weight, 
      color: '#3B82F6',
      trend: 'stable'
    },
    { 
      label: '体温', 
      value: healthMetrics.find(m => m?.type === 'temperature')?.value?.toFixed(1) || '38.5', 
      unit: '°C', 
      icon: Activity, 
      color: '#F59E0B',
      trend: 'stable'
    },
    { 
      label: '年龄', 
      value: calculateAge(pet?.birthday || '2022-03-15').toString(), 
      unit: '岁', 
      icon: Calendar, 
      color: '#10B981',
      trend: 'up'
    },
  ];

  // 计算年龄
  const calculateAge = (birthday: string): number => {
    const birth = new Date(birthday);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  // 添加疫苗记录
  const handleAddVaccine = () => {
    addVaccine({
      petId,
      name: '狂犬疫苗',
      date: new Date().toISOString().split('T')[0],
      nextDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      veterinarian: '宠物医院',
      notes: '年度疫苗接种',
    });
  };

  // 添加成长记录
  const handleAddGrowthRecord = () => {
    addGrowthRecord({
      petId,
      date: new Date().toISOString().split('T')[0],
      weight: pet?.weight || 12.5,
      height: 35,
      notes: '定期体重测量',
    });
  };

  // 添加健康指标
  const handleAddMetric = async () => {
    await addMetric({
      petId,
      type: 'weight',
      value: pet?.weight || 12.5,
      unit: 'kg',
      timestamp: new Date().toISOString(),
      status: 'normal',
      note: '定期测量',
    });
  };

  // 分享档案
  const handleShare = async () => {
    try {
      const { ShareService } = await import('../lib/platformService');
      
      const shareText = `🐾 ${pet?.name || '宠物'}档案\n\n品种: ${pet?.breed || '未知'}\n年龄: ${calculateAge(pet?.birthday || '2022-03-15')}岁\n健康评分: ${healthScoreData.overall}分\n\n来自 爪爪连心❤️`;
      
      await ShareService.share({
        title: '宠物档案',
        text: shareText,
        dialogTitle: '分享宠物档案'
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  // 导出档案
  const handleExport = () => {
    const data = {
      pet: pet,
      healthScore: healthScoreData,
      vaccines: vaccines,
      growthRecords: growthRecords,
      healthMetrics: healthMetrics,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pet?.name || '宠物'}_档案_${new Date().toLocaleDateString('zh-CN')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 获取宠物头像
  const getPetAvatar = () => {
    if (pet?.avatar) return pet.avatar;
    return pet?.type === 'dog'
      ? 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20golden%20retriever%20dog%20portrait&image_size=square'
      : 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20orange%20cat%20portrait&image_size=square';
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      {/* 顶部导航 */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">宠物档案</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={handleExport}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 宠物头像区 */}
      <div className="bg-white px-4 pb-6">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div 
              className="overflow-hidden border-4 border-white shadow-lg"
              style={{
                width: responsiveStyle.avatarSize,
                height: responsiveStyle.avatarSize,
                borderRadius: responsiveStyle.avatarSize / 2,
              }}
            >
              <img
                src={getPetAvatar()}
                alt={pet?.name || '宠物'}
                className="w-full h-full object-cover"
              />
            </div>
            <button 
              className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 transition-colors"
              onClick={() => onNavigate('pets')}
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-gray-800">{pet?.name || 'JOJO'}</h2>
            <span className="text-blue-500 text-lg">{pet?.gender === 'male' ? '♂' : '♀'}</span>
            {pet?.healthStatus === 'excellent' && (
              <Badge variant="success" size="sm">健康优秀</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">{pet?.breed || '柯基犬'} · {calculateAge(pet?.birthday || '2022-03-15')}岁</p>
          {pet?.characteristics && (
            <p className="text-xs text-gray-400 mt-2 max-w-xs text-center">{pet?.characteristics}</p>
          )}
        </div>
      </div>

      {/* 健康数据卡片 */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-4 gap-3">
          {healthData.map((item, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onNavigate('health-report')}
            >
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
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Syringe className="w-5 h-5 text-green-500" />
                  疫苗记录
                </h3>
                <button 
                  onClick={handleAddVaccine}
                  className="text-sm text-orange-500 flex items-center gap-1 hover:text-orange-600"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>
              {vaccines.length === 0 ? (
                <div className="py-4">
                  <EmptyState
                    type="records"
                    title="暂无疫苗记录"
                    description="添加疫苗记录以便追踪"
                    action={
                      <button 
                        onClick={handleAddVaccine}
                        className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium"
                      >
                        添加疫苗记录
                      </button>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {vaccines.slice(0, 3).map((record, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-800">{record.name}</p>
                        <p className="text-xs text-gray-400">接种: {record.date}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          已接种
                        </span>
                        <p className="text-xs text-gray-400 mt-1">下次: {record.nextDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 成长记录 */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  成长记录
                </h3>
                <button 
                  onClick={handleAddGrowthRecord}
                  className="text-sm text-orange-500 flex items-center gap-1 hover:text-orange-600"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>
              {growthRecords.length === 0 ? (
                <div className="py-4">
                  <EmptyState
                    type="records"
                    title="暂无成长记录"
                    description="记录宠物的成长变化"
                    action={
                      <button 
                        onClick={handleAddGrowthRecord}
                        className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium"
                      >
                        添加成长记录
                      </button>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {growthRecords.slice(0, 3).map((record, index) => (
                    <div key={index} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">{record.date}</span>
                          <span className="text-sm text-orange-500 font-medium">{record.weight}kg</span>
                        </div>
                        {record.notes && <p className="text-sm text-gray-500 mt-1">{record.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 健康提醒 */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-purple-500" />
                  健康提醒
                </h3>
                <button 
                  onClick={() => onNavigate('reminders')}
                  className="text-sm text-orange-500 flex items-center gap-1 hover:text-orange-600"
                >
                  查看全部
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {reminders.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">暂无待办提醒</p>
              ) : (
                <div className="space-y-2">
                  {reminders.slice(0, 3).map((reminder) => (
                    <div key={reminder.id} className="flex items-center gap-2 py-2">
                      <div className={`w-2 h-2 rounded-full ${reminder.isCompleted ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                      <span className={`text-sm ${reminder.isCompleted ? 'text-gray-400' : 'text-gray-800'}`}>
                        {reminder.title}
                      </span>
                      <span className="text-xs text-gray-400">{reminder.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">完整健康记录</h3>
                <button
                  onClick={() => onNavigate('health-records')}
                  className="text-sm text-orange-500"
                >
                  查看
                </button>
              </div>
              <p className="text-sm text-gray-500">查看所有健康相关的记录和指标</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">日常记录</h3>
                <button
                  onClick={() => onNavigate('records')}
                  className="text-sm text-orange-500"
                >
                  查看
                </button>
              </div>
              <p className="text-sm text-gray-500">喂食、饮水、活动等日常记录</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">饮食数据</h3>
                <button
                  onClick={() => onNavigate('diet-data')}
                  className="text-sm text-orange-500"
                >
                  查看
                </button>
              </div>
              <p className="text-sm text-gray-500">营养摄入和饮食分析</p>
            </Card>
          </div>
        )}

        {activeTab === 'photos' && (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">暂无照片</p>
            <button 
              onClick={() => onNavigate('camera-monitor')}
              className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              上传照片
            </button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PetProfilePage;
