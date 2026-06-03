import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useReminderStore } from '../../store/reminderStore';
import { ReminderType } from '../../types/health-record';

interface RemindersPageProps {
  onReminderPress?: (reminder: any) => void;
}

export const RemindersPage: React.FC<RemindersPageProps> = ({
  onReminderPress,
}) => {
  const { reminders, loading, fetchReminders, addReminder, updateReminder, deleteReminder } = useReminderStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    type: 'checkup' as ReminderType,
    date: new Date(),
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleAddReminder = async () => {
    if (!newReminder.title.trim()) {
      Alert.alert('错误', '请输入提醒标题');
      return;
    }

    await addReminder({
      ...newReminder,
      petId: selectedPetId || undefined,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    setShowAddModal(false);
    setNewReminder({
      title: '',
      description: '',
      type: 'checkup',
      date: new Date(),
    });
  };

  const handleToggleComplete = async (reminderId: string, currentStatus: boolean) => {
    await updateReminder(reminderId, { completed: !currentStatus });
  };

  const handleDeleteReminder = async (reminderId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这条提醒吗？',
      [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => deleteReminder(reminderId) },
      ]
    );
  };

  const getReminderIcon = (type: ReminderType) => {
    switch (type) {
      case 'vaccination':
        return '💉';
      case 'medication':
        return '💊';
      case 'checkup':
        return '🩺';
      case 'grooming':
        return '✂️';
      case 'feeding':
        return '🍽️';
      default:
        return '📌';
    }
  };

  const renderReminderItem = ({ item }: { item: any }) => {
    const isPast = new Date(item.date) < new Date();
    const isToday = new Date(item.date).toDateString() === new Date().toDateString();

    return (
      <TouchableOpacity
        style={[
          styles.reminderCard,
          item.completed && styles.reminderCardCompleted,
        ]}
        onPress={() => onReminderPress?.(item)}
      >
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleToggleComplete(item.id, item.completed)}
        >
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <View style={styles.reminderContent}>
          <View style={styles.reminderHeader}>
            <Text style={styles.reminderIcon}>{getReminderIcon(item.type)}</Text>
            <Text style={[
              styles.reminderTitle,
              item.completed && styles.completedText,
            ]}>
              {item.title}
            </Text>
          </View>

          {item.description && (
            <Text style={styles.reminderDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.reminderMeta}>
            <Text style={[
              styles.reminderDate,
              isPast && !item.completed && styles.pastDate,
              isToday && styles.todayDate,
            ]}>
              {isToday ? '今天' : new Date(item.date).toLocaleDateString()}
            </Text>
            {item.petId && (
              <Text style={styles.petBadge}>关联宠物</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteReminder(item.id)}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>暂无提醒</Text>
      <Text style={styles.emptySubtitle}>点击下方按钮添加新提醒</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={renderReminderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ 添加提醒</Text>
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加提醒</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>标题</Text>
              <TextInput
                style={styles.input}
                value={newReminder.title}
                onChangeText={(text) => setNewReminder({ ...newReminder, title: text })}
                placeholder="输入提醒标题"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>描述</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newReminder.description}
                onChangeText={(text) => setNewReminder({ ...newReminder, description: text })}
                placeholder="输入描述"
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddReminder}
            >
              <Text style={styles.submitButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  reminderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reminderCardCompleted: {
    backgroundColor: '#f9f9f9',
    opacity: 0.7,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F97316',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#F97316',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reminderContent: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reminderIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  reminderDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    marginLeft: 24,
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 24,
  },
  reminderDate: {
    fontSize: 12,
    color: '#999',
  },
  pastDate: {
    color: '#EF4444',
  },
  todayDate: {
    color: '#F97316',
    fontWeight: '600',
  },
  petBadge: {
    fontSize: 10,
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 18,
  },
  addButton: {
    backgroundColor: '#F97316',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#F97316',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
