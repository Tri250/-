import React, { useState } from 'react';
import { 
  ChevronRight, 
  Heart, 
  Bot, 
  FileText, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Activity,
  Star,
  Clock,
  Plus,
  Camera,
  Wifi,
  WifiOff,
  PawPrint,
  Sparkles,
  Gift,
  Flame,
  HeartHandshake,
  Users,
  Settings,
  User
} from 'lucide-react';
import { Card, Button, ProgressRing, Badge } from '../components/DesignSystem';
import { useAppStore } from '../store/appStore';
import { useBondStore } from '../store/bondStore';
import { usePetStore } from '../store/petStore';
import { useReminderStore } from '../store/reminderStore';
import { useHealthRecordStore } from '../store/healthRecordStore';
import { useCameraStore } from '../store/cameraStore';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { currentPet, currentEmotion, healthScore } = useAppStore();
  const { metrics, badges, totalPoints, streakDays } = useBondStore();
  const unlockedBadges = badges.filter(b => b.isUnlocked).length;
  const { pets, currentPetId, setCurrentPet, addPet } = usePetStore();
  const { getUpcomingReminders } = useReminderStore();
  const { getFilteredRecords } = useHealthRecordStore();
  const { devices, isLoading, loadDevices } = useCameraStore();
  
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [newPet, setNewPet] = useState({ name: '', type: 'cat' as const, breed: '', age: '' });

  const upcomingReminders = currentPetId ? getUpcomingReminders(currentPetId, 3) : [];
  const recentRecords = currentPetId ? getFilteredRecords(currentPetId).slice(0, 3) : [];
  const onlineDevices = devices.filter(d => d.status === 'online');

  const quickActions = [
    {
      icon: Bot,
      label: 'AI健康顾问',
      description: '随时咨询',
      color: 'from-primary-500 to-primary-600',
      page: 'ai-consultant',
    },
    {
      icon: Camera,
      label: '智能监控',
      description: '实时查看',
      color: 'from-cyan-500 to-cyan-600',
      page: 'camera',
    },
    {
      icon: Heart,
      label: '情绪翻译',
      description: '读懂毛孩',
      color: 'from-pink-500 to-pink-600',
      page: 'translator',
    },
    {
      icon: FileText,
      label: '健康记录',
      description: '记录状态',
      color: 'from-blue-500 to-blue-600',
      page: 'health-records',
    },
    {
      icon: BookOpen,
      label: '健康手册',
      description: '专业知识',
      color: 'from-green-500 to-green-600',
      page: 'health-manual',
    },
    {
      icon: Calendar,
      label: '智能提醒',
      description: '重要日程',
      color: 'from-purple-500 to-purple-600',
      page: 'reminders',
    },
  ];

  const getEmotionEmoji = (emotion: string) => {
    const map: Record<string, string> = {
      happy: '😸',
      curious: '🧐',
      anxious: '😰',
      angry: '😾',
      needs: '🥺',
      excited: '🤩',
      sleepy: '😴',
      playful: '🐾',
    };
    return map[emotion] || '😐';
  };

  const getBondLevel = (score: number) => {
    if (score >= 90) return { level: '灵魂伴侣', emoji: '💕', color: 'from-pink-400 to-red-400' };
    if (score >= 70) return { level: '亲密伙伴', emoji: '💗', color: 'from-red-400 to-orange-400' };
    if (score >= 50) return { level: '好朋友', emoji: '💝', color: 'from-orange-400 to-yellow-400' };
    if (score >= 30) return { level: '熟悉中', emoji: '🤝', color: 'from-yellow-400 to-green-400' };
    return { level: '新朋友', emoji: '👋', color: 'from-green-400 to-cyan-400' };
  };

  const handleAddPet = () => {
    if (!newPet.name.trim()) return;
    addPet({
      name: newPet.name,
      type: newPet.type,
      breed: newPet.breed || '未知品种',
      age: parseInt(newPet.age) || 0,
      avatarUrl: '',
    });
    setShowAddPetModal(false);
    setNewPet({ name: '', type: 'cat', breed: '', age: '' });
  };

  const petTypeHealthScoreLabel = () => {
    if (!currentPet) return '';
    const type = currentPet.type === 'dog' ? '狗狗' : '猫咪';
    return `${type}专属健康评分`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-neutral-50 pb-24">
      {/* Header with Gradient */}
      <header className="bg-gradient-to-br from-primary-500 via-primary-500 to-rose-500 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-yellow-300/20 rounded-full blur-xl" />
        
        <div className="max-w-md mx-auto px-4 pt-6 pb-12 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Heart className="w-6 h-6 fill-current" />
                PawSync Pro
              </h1>
              <p className="text-xs text-white/80 mt-1">温暖守护 · 陪伴成长</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-all"
                onClick={() => onNavigate('user-profile')}
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Pet Selector */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => setCurrentPet(pet.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  pet.id === currentPetId
                    ? 'bg-white/30 backdrop-blur border border-white/30 shadow-lg'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                  {pet.type === 'dog' ? '🐕' : '🐱'}
                </div>
                <span className="text-sm font-medium whitespace-nowrap">{pet.name}</span>
              </button>
            ))}
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
              onClick={() => setShowAddPetModal(true)}
            >
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">添加</span>
            </button>
          </div>

          {/* Bond Score & Quick Stats */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <ProgressRing 
                progress={metrics.overall} 
                size={120} 
                strokeWidth={12}
                label=""
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl">{getBondLevel(metrics.overall).emoji}</span>
                <span className="text-xs text-white/80 mt-1">{getBondLevel(metrics.overall).level}</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
                  <Star className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm">{unlockedBadges}/{badges.length}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
                  <Flame className="w-4 h-4 text-orange-300" />
                  <span className="text-sm">{streakDays}天</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-1">
                    <HeartHandshake className="w-4 h-4" />
                    亲密度积分
                  </span>
                  <span className="font-bold">{totalPoints}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-300 to-orange-300 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((totalPoints / 2000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 -mt-8 space-y-5">
        {/* Status Card */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Card variant="elevated" padding="lg" className="bg-white shadow-xl">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-rose-100 flex items-center justify-center animate-bounce-gentle">
                  <span className="text-3xl">{getEmotionEmoji(currentEmotion)}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-neutral-800 text-lg">{currentPet?.name}</h3>
                <p className="text-sm text-neutral-500 capitalize flex items-center gap-2">
                  <span>{getEmotionEmoji(currentEmotion)}</span>
                  {currentEmotion}
                </p>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-neutral-400">{petTypeHealthScoreLabel()}</span>
                    <span className="text-xs font-bold text-primary-600">{healthScore}分</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        healthScore >= 80 ? 'bg-gradient-to-r from-success-400 to-success-500' :
                        healthScore >= 60 ? 'bg-gradient-to-r from-warning-400 to-warning-500' :
                        'bg-gradient-to-r from-danger-400 to-danger-500'
                      }`}
                      style={{ width: `${healthScore}%` }}
                    />
                  </div>
                </div>
              </div>
              <Badge variant="success" size="sm" className="bg-success-100 text-success-700 border-success-200">
                {currentPet?.type === 'dog' ? '🐕 狗狗' : '🐱 猫咪'}
              </Badge>
            </div>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {quickActions.map((action, index) => (
            <button
              key={action.page}
              onClick={() => onNavigate(action.page)}
              className="col-span-1"
              style={{ animationDelay: `${0.2 + index * 0.05}s` }}
            >
              <Card className="text-center h-full hover:scale-105 transition-transform">
                <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-3 shadow-lg shadow-black/10`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-sm text-neutral-800 mb-1">{action.label}</h4>
                <p className="text-xs text-neutral-500">{action.description}</p>
              </Card>
            </button>
          ))}
        </div>

        {/* Camera Devices Card */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-500" />
                智能监控
              </h3>
              <button 
                className="text-xs text-primary-500 font-medium flex items-center gap-1"
                onClick={() => onNavigate('camera')}
              >
                管理
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : devices.length === 0 ? (
              <button 
                className="w-full p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl hover:from-cyan-100 hover:to-blue-100 transition-all text-center"
                onClick={() => onNavigate('camera')}
              >
                <Camera className="w-10 h-10 mx-auto text-cyan-400 mb-3" />
                <p className="text-sm font-medium text-neutral-700">添加监控设备</p>
                <p className="text-xs text-neutral-500 mt-1">随时查看毛孩子</p>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {devices.slice(0, 2).map((device) => (
                  <div 
                    key={device.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      device.status === 'online' 
                        ? 'border-success-200 bg-success-50' 
                        : 'border-neutral-200 bg-neutral-50'
                    }`}
                    onClick={() => onNavigate('camera')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        device.status === 'online' ? 'bg-success-100' : 'bg-neutral-200'
                      }`}>
                        {device.status === 'online' ? (
                          <Wifi className="w-5 h-5 text-success-600" />
                        ) : (
                          <WifiOff className="w-5 h-5 text-neutral-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-neutral-800">{device.name}</h4>
                        <p className={`text-xs ${
                          device.status === 'online' ? 'text-success-600' : 'text-neutral-500'
                        }`}>
                          {device.status === 'online' ? '在线' : '离线'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {devices.length > 2 && (
                  <button 
                    className="col-span-2 p-4 border-2 border-dashed border-neutral-200 rounded-xl hover:border-primary-300 transition-all text-center"
                    onClick={() => onNavigate('camera')}
                  >
                    <span className="text-sm text-neutral-500">查看全部 ({devices.length})</span>
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  即将到来
                </h3>
                <button 
                  className="text-xs text-primary-500 font-medium flex items-center gap-1"
                  onClick={() => onNavigate('reminders')}
                >
                  全部
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {upcomingReminders.map((reminder) => (
                  <div 
                    key={reminder.id}
                    className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-neutral-800">{reminder.title}</h4>
                      <p className="text-xs text-neutral-500">{reminder.date} {reminder.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Recent Records */}
        {recentRecords.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  最近记录
                </h3>
                <button 
                  className="text-xs text-primary-500 font-medium flex items-center gap-1"
                  onClick={() => onNavigate('health-records')}
                >
                  更多
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {recentRecords.map((record) => (
                  <div 
                    key={record.id}
                    className="p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <h4 className="font-medium text-sm text-neutral-800">{record.title}</h4>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{record.content}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Add Pet Modal */}
      {showAddPetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-neutral-800">添加毛孩子</h3>
              <button 
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                onClick={() => setShowAddPetModal(false)}
              >
                <div className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">名字</label>
                <input
                  type="text"
                  value={newPet.name}
                  onChange={(e) => setNewPet({...newPet, name: e.target.value})}
                  placeholder="给毛孩子起个名字"
                  className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">类型</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewPet({...newPet, type: 'cat'})}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                      newPet.type === 'cat' 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    <span className="text-xl">🐱</span>
                    <span>猫咪</span>
                  </button>
                  <button
                    onClick={() => setNewPet({...newPet, type: 'dog'})}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                      newPet.type === 'dog' 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    <span className="text-xl">🐕</span>
                    <span>狗狗</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">品种</label>
                  <input
                    type="text"
                    value={newPet.breed}
                    onChange={(e) => setNewPet({...newPet, breed: e.target.value})}
                    placeholder="品种"
                    className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">年龄</label>
                  <input
                    type="number"
                    value={newPet.age}
                    onChange={(e) => setNewPet({...newPet, age: e.target.value})}
                    placeholder="年龄"
                    className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
              
              <Button 
                className="w-full mt-4"
                onClick={handleAddPet}
                disabled={!newPet.name.trim()}
              >
                <PawPrint className="w-4 h-4 mr-2" />
                添加宠物档案
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};