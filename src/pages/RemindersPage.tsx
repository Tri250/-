import React, { useState } from 'react';
import { Plus, Bell, ChevronRight, Check, Trash2 } from 'lucide-react';
import { Card } from '../components/DesignSystem/Card';
import { Button } from '../components/DesignSystem/Button';

interface Reminder {
  id: string;
  petId: string;
  petName: string;
  title: string;
  description?: string;
  type: 'vaccination' | 'medication' | 'checkup' | 'grooming' | 'feeding' | 'other';
  date: string;
  completed: boolean;
}

interface RemindersPageProps {
  onNavigate?: (page: string) => void;
}

const MOCK_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    petId: 'pet-1',
    petName: '小橘',
    title: '狂犬疫苗加强针',
    description: '距离上次接种已满 11 个月，需要进行加强免疫',
    type: 'vaccination',
    date: '2026-06-15',
    completed: false,
  },
  {
    id: 'rem-2',
    petId: 'pet-1',
    petName: '小橘',
    title: '体内驱虫',
    description: '每3个月一次的常规驱虫',
    type: 'medication',
    date: '2026-06-20',
    completed: false,
  },
  {
    id: 'rem-3',
    petId: 'pet-1',
    petName: '小橘',
    title: '年度体检',
    description: '建议进行全面的健康检查',
    type: 'checkup',
    date: '2026-07-01',
    completed: true,
  },
  {
    id: 'rem-4',
    petId: 'pet-1',
    petName: '小橘',
    title: '洗澡美容',
    description: '常规洗澡和毛发护理',
    type: 'grooming',
    date: '2026-06-10',
    completed: false,
  },
];

const TYPE_LABELS: Record<Reminder['type'], string> = {
  vaccination: '疫苗',
  medication: '用药',
  checkup: '体检',
  grooming: '美容',
  feeding: '喂食',
  other: '其他',
};

const TYPE_ICONS: Record<Reminder['type'], string> = {
  vaccination: '💉',
  medication: '💊',
  checkup: '🩺',
  grooming: '✂️',
  feeding: '🍽️',
  other: '📌',
};

const TYPE_COLORS: Record<Reminder['type'], string> = {
  vaccination: 'from-blue-400 to-blue-500',
  medication: 'from-green-400 to-green-500',
  checkup: 'from-purple-400 to-purple-500',
  grooming: 'from-pink-400 to-pink-500',
  feeding: 'from-yellow-400 to-yellow-500',
  other: 'from-gray-400 to-gray-500',
};

export const RemindersPage: React.FC<RemindersPageProps> = ({ onNavigate }) => {
  const [reminders, setReminders] = useState<Reminder[]>(MOCK_REMINDERS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const toggleComplete = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'pending') return !r.completed;
    if (filter === 'completed') return r.completed;
    return true;
  });

  const pendingCount = reminders.filter((r) => !r.completed).length;
  const completedCount = reminders.filter((r) => r.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-peach-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.('home')}
              className="p-2 hover:bg-white rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600 rotate-180" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">提醒事项</h1>
              <p className="text-sm text-gray-500">
                {pendingCount} 项待办 · {completedCount} 项已完成
              </p>
            </div>
          </div>
          <Button className="!p-2 !rounded-full">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { value: 'all' as const, label: '全部', count: reminders.length },
            { value: 'pending' as const, label: '待办', count: pendingCount },
            { value: 'completed' as const, label: '已完成', count: completedCount },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredReminders.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">暂无提醒事项</p>
              <Button>添加第一个提醒</Button>
            </Card>
          ) : (
            filteredReminders.map((reminder) => (
              <Card
                key={reminder.id}
                className={`p-4 ${reminder.completed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${TYPE_COLORS[reminder.type]} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}
                  >
                    {TYPE_ICONS[reminder.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                            {TYPE_LABELS[reminder.type]}
                          </span>
                          <span className="text-xs text-gray-400">· {reminder.petName}</span>
                        </div>
                        <h3
                          className={`font-semibold text-gray-800 ${
                            reminder.completed ? 'line-through' : ''
                          }`}
                        >
                          {reminder.title}
                        </h3>
                        {reminder.description && (
                          <p className="text-sm text-gray-500 mt-1">{reminder.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          📅 {new Date(reminder.date).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleComplete(reminder.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            reminder.completed
                              ? 'bg-green-100 text-green-600'
                              : 'hover:bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
