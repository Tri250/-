import React from 'react';
import { Image, Calendar, Heart, Star } from 'lucide-react';
import { Card } from '../DesignSystem/Card';
import { useBondStore } from '../../store/bondStore';
import { Milestone, Memory } from '../../types/bond';

interface MemoryTimelineComponentProps {
  petId: string;
  onMemoryPress?: (memory: Memory | Milestone) => void;
}

export const MemoryTimelineComponent: React.FC<MemoryTimelineComponentProps> = ({
  petId,
  onMemoryPress,
}) => {
  const { memories, milestones } = useBondStore();
  const petMemories = memories.filter((m) => m.petId === petId);
  const petMilestones = milestones.filter((m) => m.petId === petId);

  const sortedItems = [
    ...petMemories.map((m) => ({ ...m, itemType: 'memory' as const })),
    ...petMilestones.map((m) => ({ ...m, itemType: 'milestone' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedItems.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">还没有回忆</p>
        <p className="text-xs text-gray-400 mt-1">开始记录你与宠物的美好时光吧！</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedItems.map((item) => (
        <Card
          key={item.id}
          className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onMemoryPress?.(item)}
        >
          {item.itemType === 'memory' && (item as Memory).mediaUrl && (
            <img
              src={(item as Memory).mediaUrl}
              alt={item.title}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-4">
            <div className="flex items-start gap-3">
              {item.itemType === 'milestone' && (
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-peach-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">{(item as Milestone).emoji || '🎉'}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(item.date).toLocaleDateString('zh-CN')}</span>
                  {item.itemType === 'milestone' && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                      里程碑
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
