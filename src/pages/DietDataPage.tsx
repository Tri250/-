import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Calendar,
  ChevronDown,
  Utensils,
  Droplets,
  Flame,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  PieChart,
  BarChart3,
  Plus,
  Camera,
  Trash2,
  Edit3,
  X,
} from 'lucide-react';
import { useDietStore, type TimeRange, type MealType, type DietRecord } from '../store/dietStore';
import { usePetStore } from '../store/petStore';
import { Card, Badge, EmptyState, Button } from '../components/DesignSystem';
import { useResponsiveStyle } from '../lib/responsiveStyle';
import { Camera as CameraPlugin, CameraResultType } from '@capacitor/camera';

interface DietDataPageProps {
  onNavigate: (page: string) => void;
}

// 餐食类型配置
const MEAL_TYPE_CONFIG: Record<MealType, { label: string; icon: React.ElementType; color: string }> = {
  breakfast: { label: '早餐', icon: Utensils, color: '#F59E0B' },
  lunch: { label: '午餐', icon: Utensils, color: '#10B981' },
  dinner: { label: '晚餐', icon: Utensils, color: '#8B5CF6' },
  snack: { label: '零食', icon: Utensils, color: '#EC4899' },
  treat: { label: '奖励', icon: Utensils, color: '#06B6D4' },
};

export const DietDataPage: React.FC<DietDataPageProps> = ({ onNavigate }) => {
  const responsive = useResponsiveStyle();
  const { currentPetId } = usePetStore();
  const {
    timeRange,
    setTimeRange,
    selectedDate,
    setSelectedDate,
    records,
    advices,
    getStats,
    getNutritionIntake,
    getRecordsByDate,
    getRecordsByRange,
    getAdvicesByPet,
    addRecord,
    updateRecord,
    deleteRecord,
    initialize,
    isLoading,
  } = useDietStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DietRecord | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newRecord, setNewRecord] = useState<{
    type: MealType;
    food: string;
    amount: number;
    calories: number;
    time: string;
    note: string;
  }>({
    type: 'breakfast',
    food: '',
    amount: 100,
    calories: 0,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    note: '',
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 获取统计数据
  const stats = currentPetId ? getStats(currentPetId, timeRange) : null;
  const nutrition = currentPetId ? getNutritionIntake(currentPetId) : null;
  const todayRecords = getRecordsByDate(selectedDate);
  const rangeRecords = getRecordsByRange(timeRange);
  const petAdvices = currentPetId ? getAdvicesByPet(currentPetId) : [];

  // 计算变化趋势
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // 今日数据
  const todayData = [
    {
      type: 'feeding',
      label: '进食次数',
      value: stats?.totalMeals || 0,
      unit: '次',
      change: 0,
      changeLabel: '较昨日',
      icon: Utensils,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
    },
    {
      type: 'drinking',
      label: '进食总量',
      value: stats?.totalAmount || 0,
      unit: 'g',
      change: 0,
      changeLabel: '较昨日',
      icon: Droplets,
      color: '#10B981',
      bgColor: '#ECFDF5',
    },
    {
      type: 'calories',
      label: '消耗卡路里',
      value: stats?.totalCalories || 0,
      unit: 'kcal',
      change: 0,
      changeLabel: '较昨日',
      icon: Flame,
      color: '#F59E0B',
      bgColor: '#FFFBEB',
    },
    {
      type: 'duration',
      label: '进食时长',
      value: stats?.totalDuration || 0,
      unit: '分钟',
      change: 0,
      changeLabel: '较昨日',
      icon: Clock,
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
    },
  ];

  // 周数据（从真实记录计算）
  const getWeekData = () => {
    const weekData: { date: string; feeding: number; drinking: number; calories: number; duration: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayRecords = (records || []).filter(r => r?.date === dateStr);
      
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      weekData.push({
        date: dayNames[date.getDay()],
        feeding: dayRecords.length || 0,
        drinking: dayRecords.reduce((sum, r) => sum + (r?.amount || 0), 0),
        calories: dayRecords.reduce((sum, r) => sum + (r?.calories || 0), 0),
        duration: dayRecords.length * 1.5 || 0,
      });
    }
    
    return weekData;
  };

  const weekData = getWeekData();

  // 营养摄入分布
  const nutritionData = nutrition ? [
    { name: '蛋白质', value: nutrition.protein, color: '#3B82F6' },
    { name: '脂肪', value: nutrition.fat, color: '#F59E0B' },
    { name: '碳水化合物', value: nutrition.carbohydrate, color: '#10B981' },
    { name: '纤维', value: nutrition.fiber, color: '#8B5CF6' },
  ] : [];

  // 获取变化趋势图标
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3" />;
    if (change < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  // 获取变化颜色
  const getTrendColor = (change: number, type: string) => {
    const positiveIncrease = ['feeding', 'calories', 'duration'];
    const isPositive = positiveIncrease.includes(type);
    
    if (change === 0) return 'text-gray-400';
    if (isPositive) {
      return change > 0 ? 'text-green-500' : 'text-red-500';
    } else {
      return change < 0 ? 'text-green-500' : 'text-red-500';
    }
  };

  // 添加记录
  const handleAddRecord = async () => {
    if (!currentPetId || !newRecord.food) return;
    
    await addRecord({
      petId: currentPetId,
      type: newRecord.type,
      food: newRecord.food,
      amount: newRecord.amount,
      calories: newRecord.calories,
      time: newRecord.time,
      date: selectedDate,
      note: newRecord.note,
    });
    
    setShowAddModal(false);
    setNewRecord({
      type: 'breakfast',
      food: '',
      amount: 100,
      calories: 0,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      note: '',
    });
  };

  // 更新记录
  const handleUpdateRecord = async () => {
    if (!editingRecord) return;
    
    await updateRecord(editingRecord.id, {
      type: newRecord.type,
      food: newRecord.food,
      amount: newRecord.amount,
      calories: newRecord.calories,
      time: newRecord.time,
      note: newRecord.note,
    });
    
    setEditingRecord(null);
    setShowAddModal(false);
    setNewRecord({
      type: 'breakfast',
      food: '',
      amount: 100,
      calories: 0,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      note: '',
    });
  };

  // 删除记录
  const handleDeleteRecord = async (id: string) => {
    await deleteRecord(id);
  };

  // 拍照添加记录
  const handleTakePhoto = async () => {
    try {
      const photo = await CameraPlugin.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
      });
      
      // 这里可以添加图片分析逻辑，识别食物类型和数量
      console.log('Photo taken:', photo.base64String);
      
      // 设置图片并打开添加模态框
      setNewRecord(prev => ({
        ...prev,
        note: prev.note + ' [有图片]',
      }));
      setShowAddModal(true);
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  // 编辑记录
  const handleEditRecord = (record: DietRecord) => {
    setEditingRecord(record);
    setNewRecord({
      type: record.type,
      food: record.food,
      amount: record.amount,
      calories: record.calories || 0,
      time: record.time,
      note: record.note || '',
    });
    setShowAddModal(true);
  };

  // 格式化日期显示
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
    
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* 顶部导航 */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">饮食数据</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTakePhoto}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Camera className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 日期选择器 */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              timeRange === 'day'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            日
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              timeRange === 'week'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            周
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              timeRange === 'month'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            月
          </button>
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-50 rounded-full"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{formatDateDisplay(selectedDate)}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        
        {/* 日期快速选择 */}
        {showDatePicker && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const dateStr = date.toISOString().split('T')[0];
              const isSelected = selectedDate === dateStr;
              
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setShowDatePicker(false);
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i === 0 ? '今天' : i === 1 ? '昨天' : date.toLocaleDateString('zh-CN', { day: 'numeric' })}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* 今日数据概览 */}
      {!isLoading && (
        <div className="px-4 py-4">
          <h2 className="text-base font-bold text-gray-800 mb-3">
            {timeRange === 'day' ? '今日概览' : timeRange === 'week' ? '本周概览' : '本月概览'}
          </h2>
          <div className="grid grid-cols-2 gap-3" style={{ gap: responsive.spacing }}>
            {todayData.map((item, index) => (
              <Card key={index} variant="default" padding="md" hover={false}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: item.bgColor }}
                  >
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold text-gray-800">{item.value}</span>
                  <span className="text-sm text-gray-500">{item.unit}</span>
                </div>
                <div className={`flex items-center gap-1 text-xs ${getTrendColor(item.change, item.type)}`}>
                  {getTrendIcon(item.change)}
                  <span>{Math.abs(item.change)}%</span>
                  <span className="text-gray-400">{item.changeLabel}</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-400">正常</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 今日饮食记录列表 */}
      {!isLoading && timeRange === 'day' && (
        <div className="px-4 pb-4">
          <h2 className="text-base font-bold text-gray-800 mb-3">今日饮食记录</h2>
          {todayRecords.length === 0 ? (
            <EmptyState
              type="records"
              title="今日暂无饮食记录"
              description="点击右上角添加按钮记录宝贝的饮食"
              action={
                <Button onClick={() => setShowAddModal(true)}>
                  添加记录
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {todayRecords.map((record) => {
                const typeConfig = MEAL_TYPE_CONFIG[record.type];
                return (
                  <Card key={record.id} variant="default" padding="md" hover={false}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${typeConfig.color}20` }}
                        >
                          <typeConfig.icon className="w-5 h-5" style={{ color: typeConfig.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{record.food}</span>
                            <Badge variant="default" size="sm">
                              {typeConfig.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <span>{record.amount}g</span>
                            {record.calories && <span>· {record.calories} kcal</span>}
                            <Clock className="w-3 h-3" />
                            <span>{record.time}</span>
                          </div>
                          {record.note && (
                            <p className="text-xs text-gray-400 mt-1">{record.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditRecord(record)}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Edit3 className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-2 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 周趋势图表 */}
      {!isLoading && timeRange === 'week' && (
        <div className="px-4 pb-4">
          <Card variant="default" padding="lg" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">本周趋势</h3>
              <button className="flex items-center gap-1 text-sm text-orange-500">
                <BarChart3 className="w-4 h-4" />
                详细分析
              </button>
            </div>
            <div className="space-y-4">
              {/* 进食次数趋势 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">进食次数</span>
                  <span className="text-sm font-medium text-gray-800">
                    平均 {(weekData.reduce((sum, d) => sum + d.feeding, 0) / 7).toFixed(1)} 次/天
                  </span>
                </div>
                <div className="flex items-end gap-2 h-20">
                  {weekData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-blue-100 rounded-t-lg transition-all"
                        style={{ height: `${Math.min((day.feeding / 10) * 100, 100)}%` }}
                      >
                        <div
                          className="w-full bg-blue-500 rounded-t-lg"
                          style={{ height: '100%' }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400">{day.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 卡路里趋势 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">消耗卡路里</span>
                  <span className="text-sm font-medium text-gray-800">
                    平均 {Math.round(weekData.reduce((sum, d) => sum + d.calories, 0) / 7)} kcal/天
                  </span>
                </div>
                <div className="flex items-end gap-2 h-20">
                  {weekData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-orange-100 rounded-t-lg transition-all"
                        style={{ height: `${Math.min((day.calories / 500) * 100, 100)}%` }}
                      >
                        <div
                          className="w-full bg-orange-500 rounded-t-lg"
                          style={{ height: '100%' }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400">{day.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 营养摄入分布 */}
      {!isLoading && nutritionData.length > 0 && (
        <div className="px-4 pb-4">
          <Card variant="default" padding="lg" hover={false}>
            <h3 className="font-bold text-gray-800 mb-4">营养摄入分布</h3>
            <div className="flex items-center gap-6">
              {/* 饼图示意 */}
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {nutritionData.reduce((acc, item, index) => {
                    const prevOffset = acc.offset;
                    const dashArray = `${item.value} ${100 - item.value}`;
                    acc.elements.push(
                      <circle
                        key={index}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="20"
                        strokeDasharray={dashArray}
                        strokeDashoffset={-prevOffset}
                      />
                    );
                    acc.offset += item.value;
                    return acc;
                  }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-lg font-bold text-gray-800">100%</span>
                    <p className="text-xs text-gray-400">营养均衡</p>
                  </div>
                </div>
              </div>

              {/* 图例 */}
              <div className="flex-1 space-y-2">
                {nutritionData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 饮食建议 */}
      {!isLoading && petAdvices.length > 0 && (
        <div className="px-4 pb-24">
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-4 text-white">
            <h3 className="font-bold mb-2">饮食建议</h3>
            {petAdvices.map((advice) => (
              <p key={advice.id} className="text-sm text-orange-100 mb-2">
                {advice.content}
              </p>
            ))}
            <button
              onClick={() => onNavigate('diet-advice')}
              className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
            >
              查看详细建议
            </button>
          </div>
        </div>
      )}

      {/* 添加/编辑记录模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card variant="default" padding="lg" className="mx-4 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {editingRecord ? '编辑饮食记录' : '添加饮食记录'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRecord(null);
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 餐食类型 */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2">餐食类型</label>
                <div className="flex gap-2">
                  {Object.entries(MEAL_TYPE_CONFIG).map(([type, config]) => (
                    <button
                      key={type}
                      onClick={() => setNewRecord(prev => ({ ...prev, type: type as MealType }))}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
                        newRecord.type === type
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <config.icon className="w-4 h-4" />
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 食物名称 */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2">食物名称</label>
                <input
                  type="text"
                  value={newRecord.food}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, food: e.target.value }))}
                  placeholder="例如：狗粮、零食..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 数量 */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2">数量 (克)</label>
                <input
                  type="number"
                  value={newRecord.amount}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 卡路里 */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2">卡路里 (kcal)</label>
                <input
                  type="number"
                  value={newRecord.calories}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 时间 */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2">时间</label>
                <input
                  type="time"
                  value={newRecord.time}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 备注 */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2">备注</label>
                <input
                  type="text"
                  value={newRecord.note}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="可选备注..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRecord(null);
                  }}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={editingRecord ? handleUpdateRecord : handleAddRecord}
                  disabled={!newRecord.food}
                  className="flex-1"
                >
                  {editingRecord ? '保存' : '添加'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DietDataPage;