import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useBondStore } from '../../store/bondStore';
import { usePetStore } from '../../store/petStore';
import { Milestone } from '../../types/bond';

interface MemoryTimelineComponentProps {
  petId: string;
  onMemoryPress?: (memory: any) => void;
}

export const MemoryTimelineComponent: React.FC<MemoryTimelineComponentProps> = ({
  petId,
  onMemoryPress,
}) => {
  const { memories, milestones } = useBondStore();
  const { getPetById } = usePetStore();
  const pet = getPetById(petId);
  const petMemories = memories.filter((m) => m.petId === petId);
  const petMilestones = milestones.filter((m) => m.petId === petId);

  const sortedItems = [
    ...petMemories.map((m) => ({ ...m, itemType: 'memory' as const })),
    ...petMilestones.map((m) => ({ ...m, itemType: 'milestone' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const renderMemoryItem = (memory: any) => (
    <TouchableOpacity
      key={memory.id}
      style={styles.memoryCard}
      onPress={() => onMemoryPress?.(memory)}
    >
      {memory.mediaUrl && (
        <Image source={{ uri: memory.mediaUrl }} style={styles.memoryImage} />
      )}
      <View style={styles.memoryContent}>
        <Text style={styles.memoryTitle}>{memory.title}</Text>
        <Text style={styles.memoryDescription} numberOfLines={2}>
          {memory.description}
        </Text>
        <Text style={styles.memoryDate}>
          {new Date(memory.date).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMilestoneItem = (milestone: Milestone) => (
    <TouchableOpacity
      key={milestone.id}
      style={styles.milestoneCard}
      onPress={() => onMemoryPress?.(milestone)}
    >
      <View style={styles.milestoneIcon}>
        <Text style={styles.milestoneEmoji}>{milestone.emoji || '🎉'}</Text>
      </View>
      <View style={styles.milestoneContent}>
        <Text style={styles.milestoneTitle}>{milestone.title}</Text>
        <Text style={styles.milestoneDescription}>{milestone.description}</Text>
        <Text style={styles.milestoneDate}>
          {new Date(milestone.date).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{pet?.name || '宠物'}的回忆</Text>
        <Text style={styles.headerSubtitle}>
          {petMemories.length} 个回忆 · {petMilestones.length} 个里程碑
        </Text>
      </View>

      <View style={styles.timeline}>
        {sortedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>还没有回忆</Text>
            <Text style={styles.emptyStateSubtext}>
              开始记录你与宠物的美好时光吧！
            </Text>
          </View>
        ) : (
          sortedItems.map((item) =>
            item.itemType === 'memory'
              ? renderMemoryItem(item)
              : renderMilestoneItem(item)
          )
        )}
      </View>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  timeline: {
    padding: 16,
  },
  memoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  memoryImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  memoryContent: {
    padding: 16,
  },
  memoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  memoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  memoryDate: {
    fontSize: 12,
    color: '#999',
  },
  milestoneCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  milestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneEmoji: {
    fontSize: 24,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  milestoneDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
  },
});
