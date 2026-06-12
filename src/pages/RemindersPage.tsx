import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Calendar, 
  Plus, 
  Clock,
  Check,
  Syringe,
  Scissors,
  Droplets,
  Pill,
  Activity,
  Star,
  Sparkles,
  Trash2,
  Edit3,
  Bell,
  BellOff,
  MoreVertical,
  X,
} from 'lucide-react';
import { Card, EmptyState, Badge, Button } from '../components/DesignSystem';
import { useReminderStore } from '../store/reminderStore';
import { usePetStore } from '../store/petStore';
import { REMINDER_TYPES, ReminderType, Reminder } from '../types/reminder';
import { AddReminderModal } from '../components/AddReminderModal';
import { useResponsiveStyle } from '../lib/responsiveStyle';
import { LocalNotifications } from '@capacitor/local-notifications';

interface RemindersPageProps {
  onNavigate: (page: string) => void;
}

export default function RemindersPage({ onNavigate }: RemindersPageProps) {
  const responsive = useResponsiveStyle();
  const { currentPetId } = usePetStore();
  const {
    selectedType,
    viewMode,
    reminders,
    getFilteredReminders,
    getUpcomingReminders,
    setSelectedType,
    setViewMode,
    toggleComplete,
    addReminder,
    updateReminder,
    deleteReminder,
    sendNotification,
    getSmartRecommendations,
  } = useReminderStore();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<Record<string, boolean>>({});

  const filteredReminders = currentPetId ? getFilteredReminders(currentPetId) : [];
  const upcomingReminders = currentPetId ? getUpcomingReminders(currentPetId, 5) : [];

  // 检查通知权限
  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    try {
      const { display } = await LocalNotifications.checkPermissions();
      setNotificationStatus({ enabled: display === 'granted' });
    } catch (error) {
      console.log('Notification permission check failed:', error);
      setNotificationStatus({ enabled: false });
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const result = await LocalNotifications.requestPermissions();
      setNotificationStatus({ enabled: result.display === 'granted' });
      return result.display === 'granted';
    } catch (error) {
      console.log('Notification permission request failed:', error);
      return false;
    }
  };

  const handleAddReminder = (reminderData: Parameters<typeof addReminder>[0]) => {
    addReminder(reminderData);
    
    // 如果通知权限已开启，为该提醒创建本地通知
    if (notificationStatus.enabled) {
      scheduleLocalNotification(reminderData);
    }
  };

  const scheduleLocalNotification = async (reminder: Reminder | Parameters<typeof addReminder>[0]) => {
    try {
      const notificationDate = new Date(`${reminder.date} ${reminder.time}`);
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: reminder.title,
            body: reminder.notes || `提醒时间: ${reminder.date} ${reminder.time}`,
            schedule: { at: notificationDate },
            sound: 'default',
            actionTypeId: 'REMINDER_ACTION',
            extra: {
              reminderId: reminder.id || Date.now().toString(),
              type: reminder.type,
            },
          },
        ],
      });
      
      console.log('Local notification scheduled:', reminder.title);
    } catch (error) {
      console.log('Failed to schedule notification:', error);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    deleteReminder(id);
    setShowActionMenu(null);
    
    // 取消相关的本地通知（如果有）
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: parseInt(id) || Date.now() }],
      });
    } catch (error) {
      console.log('Failed to cancel notification:', error);
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsAddModalOpen(true);
    setShowActionMenu(null);
  };

  const handleToggleNotification = async (reminder: Reminder) => {
    const channels: ('app' | 'push' | 'email' | 'sms' | 'wechat')[] = ['app', 'push'];
    await sendNotification(reminder, channels);
    setShowActionMenu(null);
  };

  const handleToggleComplete = async (id: string) => {
    toggleComplete(id);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'vaccine': return Syringe;
      case 'deworming': return Droplets;
      case 'checkup': return Activity;
      case 'bath': return Droplets;
      case 'brush_teeth': return Sparkles;
      case 'medicine': return Pill;
      case 'grooming': return Scissors;
      case 'birthday': return Star;
      default: return Calendar;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return '今天';
    if (date.toDateString() === tomorrow.toDateString()) return '明天';

    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (priority?: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-br from-purple-500 to-purple-600 text-white px-4 py-5 md:py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
            <button 
              onClick={() => onNavigate('home')}
              className="p-2.5 -ml-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 active:bg-white/40 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="返回"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg md:text-xl font-bold">智能提醒</h1>
              <p className="text-xs md:text-sm text-white/80">不错过任何重要时间</p>
            </div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="p-2.5 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 active:bg-white/40 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="添加提醒"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-white/20 backdrop-blur p-1 rounded-xl">
            <button
              onClick={() => setViewMode('today')}
              className={`flex-1 px-4 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] md:min-h-0 ${
                viewMode === 'today' ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white active:bg-white/10'
              }`}
            >
              今天
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex-1 px-4 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] md:min-h-0 ${
                viewMode === 'week' ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white active:bg-white/10'
              }`}
            >
              本周
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 px-4 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] md:min-h-0 ${
                viewMode === 'all' ? 'bg-white text-purple-600' : 'text-white/80 hover:text-white active:bg-white/10'
              }`}
            >
              全部
            </button>
          </div>
        </div>
      </header>

      {/* Type Filter */}
      <div className="bg-white border-b border-neutral-100 px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[40px] ${
                selectedType === null
                  ? 'bg-purple-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 active:bg-neutral-300'
              }`}
            >
              全部
            </button>
            {REMINDER_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id as ReminderType)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[40px] ${
                  selectedType === type.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 active:bg-neutral-300'
                }`}
                style={selectedType !== type.id ? { backgroundColor: type.color + '20', color: type.color } : {}}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Permission Banner */}
      {!notificationStatus.enabled && (
        <div className="bg-yellow-50 border-b border-yellow-100 px-4 py-3">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellOff className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-700">通知权限未开启</span>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
            >
              开启通知
            </button>
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-6">
        <div className="max-w-md mx-auto">
          {/* Upcoming */}
          {upcomingReminders.length > 0 && viewMode === 'all' && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-2">
                <Star className="w-4 h-4 text-warning-500" />
                即将到来
              </h2>
              <div className="space-y-3">
                {upcomingReminders.map((reminder) => {
                  const Icon = getIconForType(reminder.type);
                  const typeConfig = REMINDER_TYPES.find(t => t.id === reminder.type);
                  return (
                    <Card key={reminder.id} hover className="border-l-4" style={{ borderLeftColor: typeConfig?.color }}>
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-11 h-11 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: typeConfig?.color + '20' }}
                        >
                          <Icon className="w-5 h-5" style={{ color: typeConfig?.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-neutral-800 text-base md:text-sm">{reminder.title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Clock className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                            <span className="text-sm text-neutral-500">{formatDate(reminder.date)} {reminder.time}</span>
                            {reminder.repeat !== 'once' && (
                              <Badge variant="default" size="sm">
                                {reminder.repeat === 'daily' ? '每天' : reminder.repeat === 'weekly' ? '每周' : reminder.repeat === 'monthly' ? '每月' : '每年'}
                              </Badge>
                            )}
                          </div>
                          {reminder.notes && (
                            <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{reminder.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleComplete(reminder.id)}
                            className={`w-7 h-7 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 ${
                              reminder.isCompleted
                                ? 'bg-success-500 border-success-500'
                                : 'border-neutral-300 hover:border-purple-500 active:border-purple-400'
                            }`}
                            aria-label={reminder.isCompleted ? '标记为未完成' : '标记为完成'}
                          >
                            {reminder.isCompleted && <Check className="w-4 h-4 text-white" />}
                          </button>
                          <button
                            onClick={() => setShowActionMenu(showActionMenu === reminder.id ? null : reminder.id)}
                            className="p-2 rounded-full hover:bg-neutral-100 transition-colors min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
                            aria-label="更多操作"
                          >
                            <MoreVertical className="w-5 h-5 text-neutral-400" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Action Menu */}
                      {showActionMenu === reminder.id && (
                        <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEditReminder(reminder)}
                            className="flex items-center gap-1 px-3 py-2 bg-neutral-100 rounded-lg text-sm text-neutral-600 hover:bg-neutral-200 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            编辑
                          </button>
                          <button
                            onClick={() => handleToggleNotification(reminder)}
                            className="flex items-center gap-1 px-3 py-2 bg-purple-100 rounded-lg text-sm text-purple-600 hover:bg-purple-200 transition-colors"
                          >
                            <Bell className="w-4 h-4" />
                            发送通知
                          </button>
                          <button
                            onClick={() => handleDeleteReminder(reminder.id)}
                            className="flex items-center gap-1 px-3 py-2 bg-red-100 rounded-lg text-sm text-red-600 hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            删除
                          </button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Reminders */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
              {viewMode === 'today' ? '今天' : viewMode === 'week' ? '本周' : '所有'}
            </h2>
            {filteredReminders.length === 0 ? (
              <EmptyState
                type="reminders"
                title="还没有提醒"
                description="创建您的第一个提醒吧"
                action={
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-6 py-3 md:py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 active:from-purple-600 active:to-purple-700 transition-all min-h-[48px] md:min-h-0"
                  >
                    添加提醒
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredReminders.map((reminder) => {
                  const Icon = getIconForType(reminder.type);
                  const typeConfig = REMINDER_TYPES.find(t => t.id === reminder.type);
                  return (
                    <Card key={reminder.id} hover className={`border-l-4 ${reminder.isCompleted ? 'opacity-60' : ''}`} style={{ borderLeftColor: typeConfig?.color }}>
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-11 h-11 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: typeConfig?.color + '20' }}
                        >
                          <Icon className="w-5 h-5" style={{ color: typeConfig?.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-neutral-800 text-base md:text-sm ${reminder.isCompleted ? 'line-through' : ''}`}>{reminder.title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Clock className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                            <span className="text-sm text-neutral-500">{formatDate(reminder.date)} {reminder.time}</span>
                            {reminder.repeat !== 'once' && (
                              <Badge variant="default" size="sm">
                                {reminder.repeat === 'daily' ? '每天' : reminder.repeat === 'weekly' ? '每周' : reminder.repeat === 'monthly' ? '每月' : '每年'}
                              </Badge>
                            )}
                          </div>
                          {reminder.notes && (
                            <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{reminder.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleComplete(reminder.id)}
                            className={`w-7 h-7 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 ${
                              reminder.isCompleted
                                ? 'bg-success-500 border-success-500'
                                : 'border-neutral-300 hover:border-purple-500 active:border-purple-400'
                            }`}
                            aria-label={reminder.isCompleted ? '标记为未完成' : '标记为完成'}
                          >
                            {reminder.isCompleted && <Check className="w-4 h-4 text-white" />}
                          </button>
                          <button
                            onClick={() => setShowActionMenu(showActionMenu === reminder.id ? null : reminder.id)}
                            className="p-2 rounded-full hover:bg-neutral-100 transition-colors min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
                            aria-label="更多操作"
                          >
                            <MoreVertical className="w-5 h-5 text-neutral-400" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Action Menu */}
                      {showActionMenu === reminder.id && (
                        <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEditReminder(reminder)}
                            className="flex items-center gap-1 px-3 py-2 bg-neutral-100 rounded-lg text-sm text-neutral-600 hover:bg-neutral-200 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            编辑
                          </button>
                          <button
                            onClick={() => handleToggleNotification(reminder)}
                            className="flex items-center gap-1 px-3 py-2 bg-purple-100 rounded-lg text-sm text-purple-600 hover:bg-purple-200 transition-colors"
                          >
                            <Bell className="w-4 h-4" />
                            发送通知
                          </button>
                          <button
                            onClick={() => handleDeleteReminder(reminder.id)}
                            className="flex items-center gap-1 px-3 py-2 bg-red-100 rounded-lg text-sm text-red-600 hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            删除
                          </button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddReminderModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingReminder(null);
        }}
        onSubmit={editingReminder ? (data) => {
          updateReminder(editingReminder.id, data);
          setEditingReminder(null);
        } : handleAddReminder}
        currentPetId={currentPetId}
        editingReminder={editingReminder}
      />
    </div>
  );
};