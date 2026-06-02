import React, { useState } from 'react';
import { Syringe, Droplets, Activity, Scissors, Pill, Star, Sparkles } from 'lucide-react';
import { GlassModal, GlassInput, GlassSelect, GlassTextarea } from './DesignSystem';
import { REMINDER_TYPES, ReminderType, RepeatType } from '../types/reminder';

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
  }) => void;
  currentPetId: string | null;
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
  custom: Star,
};

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentPetId,
}) => {
  const [selectedType, setSelectedType] = useState<ReminderType>('vaccine');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [repeat, setRepeat] = useState<RepeatType>('once');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setSelectedType('vaccine');
    setTitle('');
    setNotes('');
    setDate('');
    setTime('09:00');
    setRepeat('once');
    setEndDate('');
    setErrors({});
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
    });

    handleClose();
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <GlassModal isOpen={isOpen} onClose={handleClose} title="添加提醒" size="md">
      <div className="space-y-5">
        {errors.pet && (
          <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm">
            {errors.pet}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">提醒类型</label>
          <div className="grid grid-cols-4 gap-2">
            {REMINDER_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type.id];
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: type.color + '20' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: type.color }} />
                  </div>
                  <span className={`text-xs font-medium ${isSelected ? 'text-purple-700' : 'text-neutral-600'}`}>
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">
              日期 <span className="text-danger-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={getTodayDate()}
              className={`w-full rounded-lg px-4 py-2.5 text-sm transition-all duration-200
                bg-white/60 border ${errors.date ? 'border-danger-300' : 'border-neutral-200 focus:border-purple-400'}
                focus:outline-none focus:ring-2 ${errors.date ? 'focus:ring-danger-200' : 'focus:ring-purple-200'}`}
            />
            {errors.date && <p className="text-sm text-danger-500">{errors.date}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">
              时间 <span className="text-danger-500">*</span>
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`w-full rounded-lg px-4 py-2.5 text-sm transition-all duration-200
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">结束日期（可选）</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={date || getTodayDate()}
              className={`w-full rounded-lg px-4 py-2.5 text-sm transition-all duration-200
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

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-medium hover:bg-neutral-50 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            添加提醒
          </button>
        </div>
      </div>
    </GlassModal>
  );
};