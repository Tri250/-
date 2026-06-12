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
  Image as ImageIcon
} from 'lucide-react';
import { useRecordsStore, type RecordType } from '../store/recordsStore';

interface RecordsPageProps {
  onNavigate: (page: string) => void;
}

export const RecordsPage: React.FC<RecordsPageProps> = ({ onNavigate }) => {
  const {
    activeFilter,
    setActiveFilter,
    selectedDate,
    setSelectedDate,
    getFilteredRecords,
    getDateSummary,
    initialize,
    isLoading,
  } = useRecordsStore();
  
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [localFilter, setLocalFilter] = useState<RecordType | 'all'>('all');

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 获取过滤后的记录
  const filteredRecords = getFilteredRecords('pet-1', localFilter);
  const summary = getDateSummary(selectedDate);
  
  // 分类筛选数据
  const filters: FilterItem[] = [
    { id: 'all', icon: Utensils, label: '全部', color: '#F59E0B' },
    { id: 'feeding', icon: Utensils, label: '喂食', color: '#F59E0B' },
    { id: 'drinking', icon: Droplets, label: '饮水', color: '#3B82F6' },
    { id: 'activity', icon: Activity, label: '活动', color: '#10B981' },
    { id: 'health', icon: Heart, label: '健康', color: '#8B5CF6' },
    { id: 'other', icon: FileText, label: '其他', color: '#6B7280' },
  ];

  // 模拟记录数据
  const records: RecordItem[] = [
    {
      id: '1',
      type: 'feeding',
      title: '喂食',
      description: '喂食了 120g 狗粮',
      time: '08:30',
      date: '2024年5月20日',
      tag: '主食',
      tagColor: '#F59E0B',
    },
    {
      id: '2',
      type: 'drinking',
      title: '饮水',
      description: '喝水 200ml',
      time: '10:15',
      date: '2024年5月20日',
    },
    {
      id: '3',
      type: 'activity',
      title: '活动',
      description: '散步 30 分钟，消耗 120 kcal',
      time: '14:00',
      date: '2024年5月20日',
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
    },
    {
      id: '4',
      type: 'health',
      title: '健康',
      description: '体重 12.5kg',
      time: '20:00',
      date: '2024年5月20日',
    },
    {
      id: '5',
      type: 'other',
      title: '其他',
      description: '洗澡，驱虫',
      time: '21:30',
      date: '2024年5月20日',
    },
  ];

  // 历史日期汇总数据
  const historyData = [
    { type: 'feeding', count: 2, icon: Utensils, color: '#F59E0B' },
    { type: 'drinking', count: 3, icon: Droplets, color: '#3B82F6' },
    { type: 'activity', count: 1, icon: Activity, color: '#10B981' },
    { type: 'health', count: 1, icon: Heart, color: '#8B5CF6' },
    { type: 'other', count: 1, icon: FileText, color: '#6B7280' },
  ];

  // 获取类型图标和颜色
  const getTypeIcon = (type: RecordType) => {
    const filter = filters.find(f => f.id === type);
    return filter || filters[0];
  };

  // 过滤记录
  const filteredRecords = activeFilter === 'all' 
    ? records 
    : records.filter(r => r.type === activeFilter);

  // 按日期分组
  const groupedRecords = filteredRecords.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, RecordItem[]>);

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
        </div>

        {/* 宠物图片 */}
        <div className="relative h-32 rounded-2xl overflow-hidden mb-4">
          <img 
            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=400&fit=crop" 
            alt="Pet"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        </div>

        {/* 分类筛选 */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
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

      {/* 记录列表 */}
      <div className="px-4 pb-24">
        {/* 日期选择器 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">2024年5月20日</h2>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm text-gray-600 shadow-sm">
            <Calendar className="w-4 h-4" />
            选择日期
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* 时间线 */}
        <div className="relative">
          {/* 时间线轴线 */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {/* 记录项 */}
          {Object.entries(groupedRecords).map(([date, dateRecords]) => (
            <div key={date}>
              {dateRecords.map((record, index) => {
                const typeInfo = getTypeIcon(record.type);
                return (
                  <div key={record.id} className="relative flex gap-4 mb-6">
                    {/* 时间点 */}
                    <div 
                      className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${typeInfo.color}20` }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: typeInfo.color }}
                      ></div>
                    </div>

                    {/* 内容卡片 */}
                    <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${typeInfo.color}15` }}
                          >
                            <typeInfo.icon className="w-5 h-5" style={{ color: typeInfo.color }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-800">{record.title}</h3>
                              {record.tag && (
                                <span 
                                  className="px-2 py-0.5 text-xs rounded-full"
                                  style={{ 
                                    backgroundColor: `${record.tagColor}20`,
                                    color: record.tagColor 
                                  }}
                                >
                                  {record.tag}
                                </span>
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
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* 历史日期汇总 */}
        <div className="mt-6">
          <button 
            onClick={() => setExpandedDate(expandedDate === 'history' ? null : 'history')}
            className="flex items-center justify-between w-full py-3 border-t border-gray-200"
          >
            <h3 className="text-base font-bold text-gray-800">2024年5月19日</h3>
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedDate === 'history' ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {expandedDate === 'history' && (
            <div className="flex flex-wrap gap-3 py-3">
              {historyData.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm"
                >
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  <span className="text-sm font-medium text-gray-700">{item.count}次</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
