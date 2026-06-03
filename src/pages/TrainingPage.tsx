import React, { useState } from 'react';
import { Plus, Award, Clock, ChevronRight, Target } from 'lucide-react';
import { Card } from '../components/DesignSystem/Card';
import { Button } from '../components/DesignSystem/Button';

interface TrainingActivity {
  id: string;
  petId: string;
  petName: string;
  name: string;
  duration: number;
  notes?: string;
  date: string;
  category: 'basic' | 'advanced' | 'trick' | 'social';
}

const CATEGORY_LABELS = {
  basic: '基础',
  advanced: '进阶',
  trick: '技巧',
  social: '社交',
};

const CATEGORY_COLORS = {
  basic: 'from-blue-400 to-blue-500',
  advanced: 'from-purple-400 to-purple-500',
  trick: 'from-pink-400 to-pink-500',
  social: 'from-green-400 to-green-500',
};

const MOCK_ACTIVITIES: TrainingActivity[] = [
  {
    id: 'train-1',
    petId: 'pet-1',
    petName: '小橘',
    name: '坐下',
    duration: 15,
    notes: '表现良好，5分钟内学会',
    date: '2026-06-02',
    category: 'basic',
  },
  {
    id: 'train-2',
    petId: 'pet-1',
    petName: '小橘',
    name: '握手',
    duration: 20,
    notes: '需要更多练习',
    date: '2026-06-01',
    category: 'basic',
  },
  {
    id: 'train-3',
    petId: 'pet-1',
    petName: '小橘',
    name: '翻滚',
    duration: 30,
    date: '2026-05-30',
    category: 'trick',
  },
];

export const TrainingPage: React.FC = () => {
  const [activities] = useState<TrainingActivity[]>(MOCK_ACTIVITIES);

  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);
  const totalSessions = activities.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-peach-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 pt-4">
          <h1 className="text-2xl font-bold text-gray-800">训练课程</h1>
          <p className="text-sm text-gray-500">记录小橘的成长足迹</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-500">总训练次数</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalSessions}</p>
            <p className="text-xs text-gray-400">次</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-500">总训练时长</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalDuration}</p>
            <p className="text-xs text-gray-400">分钟</p>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">训练记录</h2>
          <Button className="!py-2 !px-4 !text-sm">
            <Plus className="w-4 h-4 mr-1" />
            添加训练
          </Button>
        </div>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <Card className="p-8 text-center">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">还没有训练记录</p>
              <p className="text-xs text-gray-400 mt-1">开始第一次训练吧！</p>
            </Card>
          ) : (
            activities.map((activity) => (
              <Card key={activity.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${CATEGORY_COLORS[activity.category]} rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                            {CATEGORY_LABELS[activity.category]}
                          </span>
                          <span className="text-xs text-gray-400">· {activity.petName}</span>
                        </div>
                        <h3 className="font-semibold text-gray-800">{activity.name}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.duration} 分钟
                          </span>
                          <span>📅 {new Date(activity.date).toLocaleDateString('zh-CN')}</span>
                        </div>
                        {activity.notes && (
                          <p className="text-sm text-gray-500 mt-2 p-2 bg-gray-50 rounded-lg">
                            {activity.notes}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
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
