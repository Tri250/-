import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronDown,
  Calendar,
  Utensils,
  Droplets,
  Activity,
  Heart,
  FileText,
  Clock,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  X,
  Scissors,
  GraduationCap,
  Dumbbell,
} from 'lucide-react';
import { useRecordsStore, type RecordType, type Record } from '../store/recordsStore';
import { usePetStore } from '../store/petStore';
import { Card, Badge, EmptyState, Button } from '../components/DesignSystem';
import { useResponsiveStyle } from '../lib/responsiveStyle';
import { Camera as CameraPlugin, CameraResultType } from '@capacitor/camera';

interface RecordsPageProps {
  onNavigate: (page: string) => void;
}

// 记录类型配置
const RECORD_TYPE_CONFIG: Record<RecordType, { label: string; icon: React.ElementType; color: string }> = {
  feeding: { label: '喂食', icon: Utensils, color: '#F59E0B' },
  drinking: { label: '饮水', icon: Droplets, color: '#3B82F6' },
  activity: { label: '活动', icon: Activity, color: '#10B981' },
  health: { label: '健康', icon: Heart, color: '#8B5CF6' },
  grooming: { label: '护理', icon: Scissors, color: '#EC4899' },
  training: { label: '训练', icon: GraduationCap, color: '#06B6D4' },
  other: { label: '其他', icon: FileText, color: '#6B7280' },
};

export const RecordsPage: React.FC<RecordsPageProps> = ({ onNavigate }) => {
  const responsive = useResponsiveStyle();
  const { currentPetId } = usePetStore();
  const {
    activeFilter,
    setActiveFilter,
    selectedDate,
    setSelectedDate,
    records,
    summaries,
    getFilteredRecords,
    getRecordsByDate,
    getDateSummary,
    addRecord,
    updateRecord,
    deleteRecord,
    initialize,
    isLoading,
  } = useRecordsStore();
  
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newRecord, setNewRecord] = useState<{
    type: RecordType;
    title: string;
    description: string;
    time: string;
    date: string;
    tag: string;
    tagColor: string;
    note: string;
    duration: number;
    amount: number;
    unit: string;
  }>({
    type: 'feeding',
    title: '',
    description: '',
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toISOString().split('T')[0],
    tag: '',
    tagColor: '#F59E0B',
    note: '',
    duration: 0,
    amount: 0,
    unit: '',
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 获取过滤后的记录
  const filteredRecords = currentPetId ? getFilteredRecords(currentPetId, activeFilter) : [];
  const todayRecords = getRecordsByDate(selectedDate);
  const todaySummary = getDateSummary(selectedDate);

  // 分类筛选数据
  const filters = [
    { id: 'all', icon: FileText, label: '全部', color: '#F59E0B' },
    { id: 'feeding', icon: Utensils, label: '喂食', color: '#F59E0B' },
    { id: 'drinking', icon: Droplets, label: '饮水', color: '#3B82F6' },
    { id: 'activity', icon: Activity, label: '活动', color: '#10B981' },
    { id: 'health', icon: Heart, label: '健康', color: '#8B5CF6' },
    { id: 'grooming', icon: Scissors, label: '护理', color: '#EC4899' },
    { id: 'training', icon: GraduationCap, label: '训练', color: '#06B6D4' },
    { id: 'other', icon: FileText, label: '其他', color: '#6B7280' },
  ];

  // 获取类型图标和颜色
  const getTypeConfig = (type: RecordType) => {
    return RECORD_TYPE_CONFIG[type] || RECORD_TYPE_CONFIG.other;
  };

  // 按日期分组
  const groupedRecords = filteredRecords.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, Record[]>);

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
    
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // 添加记录
  const handleAddRecord = async () => {
    if (!currentPetId || !newRecord.title) return;
    
    await addRecord({
      petId: currentPetId,
      type: newRecord.type,
      title: newRecord.title,
      description: newRecord.description,
      time: newRecord.time,
      date: newRecord.date,
      status: 'normal',
      tag: newRecord.tag,
      tagColor: newRecord.tagColor,
      note: newRecord.note,
      duration: newRecord.duration,
      amount: newRecord.amount,
      unit: newRecord.unit,
    });
    
    setShowAddModal(false);
    resetNewRecord();
  };

  // 更新记录
  const handleUpdateRecord = async () => {
    if (!editingRecord) return;
    
    await updateRecord(editingRecord.id, {
      type: newRecord.type,
      title: newRecord.title,
      description: newRecord.description,
      time: newRecord.time,
      date: newRecord.date,
      tag: newRecord.tag,
      tagColor: newRecord.tagColor,
      note: newRecord.note,
      duration: newRecord.duration,
      amount: newRecord.amount,
      unit: newRecord.unit,
    });
    
    setEditingRecord(null);
    setShowAddModal(false);
    resetNewRecord();
  };

  // 删除记录
  const handleDeleteRecord = async (id: string) => {
    await deleteRecord(id);
  };

  // 编辑记录
  const handleEditRecord = (record: Record) => {
    setEditingRecord(record);
    setNewRecord({
      type: record.type,
      title: record.title,
      description: record.description,
      time: record.time,
      date: record.date,
      tag: record.tag || '',
      tagColor: record.tagColor || '#F59E0B',
      note: record.note || '',
      duration: record.duration || 0,
      amount: record.amount || 0,
      unit: record.unit || '',
    });
    setShowAddModal(true);
  };

  // 重置新记录表单
  const resetNewRecord = () => {
    setNewRecord({
      type: 'feeding',
      title: '',
      description: '',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      date: selectedDate,
      tag: '',
      tagColor: '#F59E0B',
      note: '',
      duration: 0,
      amount: 0,
      unit: '',
    });
  };

  // 拍照添加记录
  const handleTakePhoto = async () => {
    try {
      const photo = await CameraPlugin.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
      });
      
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

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* 顶部标题区 */}
      <div className="bg-gradient-to-b from-white to-[#FAF7F2] px-4 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">记录</h1>
            <p className="text-sm text-gray-500">记录每一次陪伴，见证每一点成长</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTakePhoto}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as RecordType | 'all')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all flex-shrink-0 ${
                activeFilter === filter.id 
                  ? 'bg-white shadow-md' 
                  : 'bg-transparent'
              }`}
            >
              <filter.icon 
                className="w-6 h-6" 
                style={{ color: activeFilter === filter.id ? filter.color : '#9CA3AF' }} 
              />
              <span 
                className="text-xs font-medium"
                style={{ color: activeFilter === filter.id ? filter.color : '#9CA3AF' }}
              >
                {filter.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* 记录列表 */}
      {!isLoading && (
        <div className="px-4 pb-24">
          {/* 日期选择器 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">{formatDateDisplay(selectedDate)}</h2>
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm text-gray-600 shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              选择日期
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* 日期快速选择 */}
          {showDatePicker && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
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

          {/* 今日汇总 */}
          {todaySummary && (
            <Card variant="default" padding="md" hover={false} className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">今日汇总</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(RECORD_TYPE_CONFIG).map(([type, config]) => {
                  const count = todaySummary[type as keyof typeof todaySummary] || 0;
                  if (count === 0) return null;
                  
                  return (
                    <div 
                      key={type}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl"
                    >
                      <config.icon className="w-4 h-4" style={{ color: config.color }} />
                      <span className="text-sm font-medium text-gray-700">{count}次</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* 时间线 */}
          {filteredRecords.length === 0 ? (
            <EmptyState
              type="records"
              title="暂无记录"
              description="点击右上角添加按钮记录宝贝的日常"
              action={
                <Button onClick={() => setShowAddModal(true)}>
                  添加记录
                </Button>
              }
            />
          ) : (
            <div className="relative">
              {/* 时间线轴线 */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* 记录项 */}
              {Object.entries(groupedRecords).map(([date, dateRecords]) => (
                <div key={date} className="mb-6">
                  {/* 日期标题 */}
                  <button 
                    onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                    className="flex items-center justify-between w-full py-2 mb-3"
                  >
                    <span className="text-sm font-semibold text-gray-500">{formatDateDisplay(date)}</span>
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        expandedDate === date ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  {/* 该日期的记录 */}
                  {dateRecords.map((record) => {
                    const typeConfig = getTypeConfig(record.type);
                    return (
                      <div key={record.id} className="relative flex gap-4 mb-4">
                        {/* 时间点 */}
                        <div 
                          className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${typeConfig.color}20` }}
                        >
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: typeConfig.color }}
                          ></div>
                        </div>

                        {/* 内容卡片 */}
                        <Card variant="default" padding="md" hover={false} className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${typeConfig.color}15` }}
                              >
                                <typeConfig.icon className="w-5 h-5" style={{ color: typeConfig.color }} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-800">{record.title}</h3>
                                  {record.tag && (
                                    <Badge variant="default" size="sm">
                                      {record.tag}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{record.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{record.time}</span>
                            </div>
                          </div>

                          {/* 详细信息 */}
                          {(record.duration || record.amount) && (
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                              {record.duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {record.duration}分钟
                                </span>
                              )}
                              {record.amount && record.unit && (
                                <span>{record.amount}{record.unit}</span>
                              )}
                            </div>
                          )}

                          {/* 图片 */}
                          {record.image && (
                            <div className="mt-3 rounded-xl overflow-hidden">
                              <img 
                                src={record.image} 
                                alt={record.title}
                                className="w-full h-24 object-cover"
                              />
                            </div>
                          )}

                          {/* 备注 */}
                          {record.note && (
                            <p className="text-xs text-gray-400 mt-2">{record.note}</p>
                          )}

                          {/* 操作按钮 */}
                          <div className="flex items-center justify-end gap-2 mt-3">
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
                        </Card>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 添加/编辑记录模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card variant="default" padding="lg" className="mx-4 max-w-sm w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {editingRecord ? '编辑记录' : '添加记录'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRecord(null);
                  resetNewRecord();
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 记录类型 */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2">记录类型</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(RECORD_TYPE_CONFIG).map(([type, config]) => (
                    <button
                      key={type}
                      onClick={() => setNewRecord(prev => ({ ...prev, type: type as RecordType }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all ${
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

              {/* 标题 */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2">标题</label>
                <input
                  type="text"
                  value={newRecord.title}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="例如：喂食、散步..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2">描述</label>
                <input
                  type="text"
                  value={newRecord.description}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="例如：喂食了 120g 狗粮"
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

              {/* 日期 */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2">日期</label>
                <input
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 数量 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2">数量</label>
                  <input
                    type="number"
                    value={newRecord.amount}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2">单位</label>
                  <input
                    type="text"
                    value={newRecord.unit}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="g, ml, kg..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* 时长 */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2">时长 (分钟)</label>
                <input
                  type="number"
                  value={newRecord.duration}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 标签 */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2">标签</label>
                <input
                  type="text"
                  value={newRecord.tag}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, tag: e.target.value }))}
                  placeholder="例如：主食、零食..."
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
                    resetNewRecord();
                  }}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={editingRecord ? handleUpdateRecord : handleAddRecord}
                  disabled={!newRecord.title}
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