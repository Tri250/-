import React, { useState, useEffect } from 'react';
import { Syringe, Droplets, Activity, Scissors, Pill, Star, Sparkles, Cake, Bell, Settings } from 'lucide-react';
import { GlassModal, GlassInput, GlassSelect, GlassTextarea } from './DesignSystem';
import { REMINDER_TYPES, ReminderType, RepeatType, NOTIFICATION_CHANNELS, NotificationChannel, NOTIFY_BEFORE_OPTIONS } from '../types/reminder';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reminder: {
    petId: string;
    type: ReminderType;
    title: string;
    notes?: string;
    date: string;
    time: string;
    repeat: RepeatType;
    endDate?: string;
    notification?: {
      channels: NotificationChannel[];
      notifyBefore: number;
    };
  }) => void;
  currentPetId: string | null;
  petBirthday?: string;
  lastVaccineDate?: string;
  lastDewormingDate?: string;
}

const REPEAT_OPTIONS = [
  { value: 'once', label: '仅一次' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'yearly', label: '每年' },
];

const TYPE_ICONS: Record<ReminderType, React.ElementType> = {
  vaccine: Syringe,
  deworming: Droplets,
  checkup: Activity,
  bath: Droplets,
  brush_teeth: Sparkles,
  medicine: Pill,
  grooming: Scissors,
  birthday: Cake,
  custom: Star,
};

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentPetId,
  petBirthday,
  lastVaccineDate,
  lastDewormingDate,
}) => {
  const [selectedType, setSelectedType] = useState<ReminderType>('vaccine');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [repeat, setRepeat] = useState<RepeatType>('once');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<NotificationChannel[]>(['app', 'push']);
  const [notifyBefore, setNotifyBefore] = useState(60);
  const [smartRecommendations, setSmartRecommendations] = useState<Array<{ type: ReminderType; suggestedDate: string; suggestedTime: string; reason: string }>>([]);

  const generateSmartRecommendations = React.useCallback(() => {
    const recommendations: Array<{ type: ReminderType; suggestedDate: string; suggestedTime: string; reason: string }> = [];
    const today = new Date();

    if (petBirthday) {
      const birthday = new Date(petBirthday);
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      recommendations.push({
        type: 'birthday',
        suggestedDate: thisYearBirthday.toISOString().split('T')[0],
        suggestedTime: '09:00',
        reason: `${thisYearBirthday.getFullYear() - birthday.getFullYear()}岁生日即将到来`,
      });
    }

    if (lastVaccineDate) {
      const lastVaccine = new Date(lastVaccineDate);
      const nextVaccine = new Date(lastVaccine);
      nextVaccine.setFullYear(nextVaccine.getFullYear() + 1);
      if (nextVaccine > today && nextVaccine < new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)) {
        recommendations.push({
          type: 'vaccine',
          suggestedDate: nextVaccine.toISOString().split('T')[0],
          suggestedTime: '10:00',
          reason: '疫苗年度加强接种时间',
        });
      }
    }

    if (lastDewormingDate) {
      const lastDeworming = new Date(lastDewormingDate);
      const nextDeworming = new Date(lastDeworming);
      nextDeworming.setMonth(nextDeworming.getMonth() + 3);
      if (nextDeworming > today && nextDeworming < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        recommendations.push({
          type: 'deworming',
          suggestedDate: nextDeworming.toISOString().split('T')[0],
          suggestedTime: '09:00',
          reason: '季度驱虫提醒',
        });
      }
    }

    const nextCheckup = new Date(today);
    nextCheckup.setMonth(nextCheckup.getMonth() + 6);
    recommendations.push({
      type: 'checkup',
      suggestedDate: nextCheckup.toISOString().split('T')[0],
      suggestedTime: '10:00',
      reason: '建议每半年进行一次体检',
    });

    setSmartRecommendations(recommendations);
  }, [petBirthday, lastVaccineDate, lastDewormingDate]);

  useEffect(() => {
    if (isOpen) {
      generateSmartRecommendations();
    }
  }, [isOpen, generateSmartRecommendations]);

  const applyRecommendation = (rec: { type: ReminderType; suggestedDate: string; suggestedTime: string; reason: string }) => {
    setSelectedType(rec.type);
    setDate(rec.suggestedDate);
    setTime(rec.suggestedTime);
    setTitle(REMINDER_TYPES.find(t => t.id === rec.type)?.name || '提醒');
    setNotes(rec.reason);
  };

  const resetForm = () => {
    setSelectedType('vaccine');
    setTitle('');
    setNotes('');
    setDate('');
    setTime('09:00');
    setRepeat('once');
    setEndDate('');
    setErrors({});
    setShowNotificationSettings(false);
    setSelectedChannels(['app', 'push']);
    setNotifyBefore(60);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentPetId) {
      newErrors.pet = '请先选择一只宠物';
    }

    if (!date) {
      newErrors.date = '请选择日期';
    }

    if (!time) {
      newErrors.time = '请选择时间';
    }

    if (repeat !== 'once' && endDate && new Date(endDate) < new Date(date)) {
      newErrors.endDate = '结束日期不能早于开始日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !currentPetId) return;

    onSubmit({
      petId: currentPetId,
      type: selectedType,
      title: title || REMINDER_TYPES.find(t => t.id === selectedType)?.name || '提醒',
      notes: notes || undefined,
      date,
      time,
      repeat,
      endDate: endDate || undefined,
      notification: {
        channels: selectedChannels,
        notifyBefore,
      },
    });

    handleClose();
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const toggleChannel = (channel: NotificationChannel) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  return (
    <GlassModal isOpen={isOpen} onClose={handleClose} title="添加提醒" size="md">
      <div className="space-y-5 md:space-y-5">
        {errors.pet && (
          <div className="p-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm">
            {errors.pet}
          </div>
        )}

        <div className="space-y-3">
          <label className="text-sm font-medium text-neutral-700 block">提醒类型</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-2">
            {REMINDER_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type.id];
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 md:p-2.5 rounded-xl border-2 transition-all min-h-[56px] md:min-h-0 ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 active:bg-neutral-50'
                  }`}
                >
                  <div
                    className="w-9 h-9 md:w-8 md:h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: type.color + '20' }}
                  >
                    <Icon className="w-5 h-5 md:w-4 md:h-4" style={{ color: type.color }} />
                  </div>
                  <span className={`text-xs md:text-xs font-medium ${isSelected ? 'text-purple-700' : 'text-neutral-600'}`}>
                    {type.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <GlassInput
          label="提醒标题"
          value={title}
          onChange={setTitle}
          placeholder={REMINDER_TYPES.find(t => t.id === selectedType)?.name || '提醒'}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 block">
              日期 <span className="text-danger-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={getTodayDate()}
              className={`w-full rounded-xl px-4 py-3 text-base md:text-sm transition-all duration-200 min-h-[44px]
                bg-white/60 border ${errors.date ? 'border-danger-300' : 'border-neutral-200 focus:border-purple-400'}
                focus:outline-none focus:ring-2 ${errors.date ? 'focus:ring-danger-200' : 'focus:ring-purple-200'}`}
            />
            {errors.date && <p className="text-sm text-danger-500">{errors.date}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 block">
              时间 <span className="text-danger-500">*</span>
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`w-full rounded-xl px-4 py-3 text-base md:text-sm transition-all duration-200 min-h-[44px]
                bg-white/60 border ${errors.time ? 'border-danger-300' : 'border-neutral-200 focus:border-purple-400'}
                focus:outline-none focus:ring-2 ${errors.time ? 'focus:ring-danger-200' : 'focus:ring-purple-200'}`}
            />
            {errors.time && <p className="text-sm text-danger-500">{errors.time}</p>}
          </div>
        </div>

        <GlassSelect
          label="重复周期"
          value={repeat}
          onChange={(v) => setRepeat(v as RepeatType)}
          options={REPEAT_OPTIONS}
        />

        {repeat !== 'once' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 block">结束日期（可选）</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={date || getTodayDate()}
              className={`w-full rounded-xl px-4 py-3 text-base md:text-sm transition-all duration-200 min-h-[44px]
                bg-white/60 border ${errors.endDate ? 'border-danger-300' : 'border-neutral-200 focus:border-purple-400'}
                focus:outline-none focus:ring-2 ${errors.endDate ? 'focus:ring-danger-200' : 'focus:ring-purple-200'}`}
            />
            {errors.endDate && <p className="text-sm text-danger-500">{errors.endDate}</p>}
          </div>
        )}

        <GlassTextarea
          label="备注（可选）"
          value={notes}
          onChange={setNotes}
          placeholder="添加备注信息..."
          rows={2}
        />

        {smartRecommendations.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-500" />
              智能推荐
            </label>
            <div className="space-y-2">
              {smartRecommendations.slice(0, 3).map((rec, index) => {
                const typeConfig = REMINDER_TYPES.find(t => t.id === rec.type);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applyRecommendation(rec)}
                    className="w-full p-3 md:p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 text-left hover:border-yellow-300 active:from-yellow-100 active:to-orange-100 transition-all min-h-[56px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeConfig?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-700 truncate">{typeConfig?.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{rec.reason}</p>
                      </div>
                      <div className="text-xs text-neutral-400 flex-shrink-0">
                        {new Date(rec.suggestedDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            className="w-full flex items-center justify-between p-3 md:p-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-300 active:bg-neutral-100 transition-all min-h-[48px]"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-neutral-700">通知设置</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">{selectedChannels.length}个渠道</span>
              <Settings className={`w-4 h-4 text-neutral-400 transition-transform ${showNotificationSettings ? 'rotate-90' : ''}`} />
            </div>
          </button>

          {showNotificationSettings && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-700 block">通知渠道</label>
                <div className="flex flex-wrap gap-2">
                  {NOTIFICATION_CHANNELS.map((channel) => {
                    const isSelected = selectedChannels.includes(channel.id);
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => toggleChannel(channel.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] ${
                          isSelected
                            ? 'bg-purple-500 text-white'
                            : 'bg-white border border-neutral-200 text-neutral-600 hover:border-purple-300 active:bg-neutral-50'
                        }`}
                      >
                        <span className="mr-1">{channel.icon}</span>
                        {channel.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 block">提前提醒时间</label>
                <select
                  value={notifyBefore}
                  onChange={(e) => setNotifyBefore(parseInt(e.target.value))}
                  className="w-full rounded-xl px-4 py-3 text-base md:text-sm bg-white border border-neutral-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 min-h-[44px]"
                >
                  {NOTIFY_BEFORE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Fixed bottom action buttons on mobile */}
        <div className="sticky bottom-0 left-0 right-0 pt-4 pb-2 md:pb-0 bg-gradient-to-t from-white via-white to-transparent -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 md:py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-medium hover:bg-neutral-50 active:bg-neutral-100 transition-colors min-h-[48px] md:min-h-0"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 md:py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 active:from-purple-600 active:to-purple-700 transition-all min-h-[48px] md:min-h-0"
            >
              添加提醒
            </button>
          </div>
        </div>
      </div>
    </GlassModal>
  );
};