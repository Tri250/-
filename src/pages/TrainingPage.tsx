import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTrainingStore } from '../../store/trainingStore';
import { usePetStore } from '../../store/petStore';

interface TrainingPageProps {
  petId?: string;
}

export const TrainingPage: React.FC<TrainingPageProps> = ({ petId }) => {
  const { trainingActivities, addDailyActivity } = useTrainingStore();
  const { pets, getPetById } = usePetStore();
  const [selectedPet, setSelectedPet] = useState(petId || pets[0]?.id || '');
  const [activityName, setActivityName] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const currentPet = getPetById(selectedPet);

  useEffect(() => {
    if (petId) {
      setSelectedPet(petId);
    }
  }, [petId]);

  const handleAddActivity = async () => {
    if (!selectedPet) {
      Alert.alert('错误', '请选择宠物');
      return;
    }
    if (!activityName.trim()) {
      Alert.alert('错误', '请输入活动名称');
      return;
    }

    const activity = {
      petId: selectedPet,
      name: activityName.trim(),
      duration: parseInt(duration) || 0,
      notes: notes.trim(),
      date: new Date().toISOString(),
    };

    await addDailyActivity(activity);
    setActivityName('');
    setDuration('');
    setNotes('');
    Alert.alert('成功', '训练活动已添加');
  };

  const petActivities = trainingActivities.filter(
    (a) => a.petId === selectedPet
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>训练课程</Text>
        <Text style={styles.subtitle}>
          {currentPet ? `${currentPet.name}的训练记录` : '选择宠物查看训练记录'}
        </Text>
      </View>

      <View style={styles.petSelector}>
        <Text style={styles.sectionTitle}>选择宠物</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {pets.map((pet) => (
            <TouchableOpacity
              key={pet.id}
              style={[
                styles.petChip,
                selectedPet === pet.id && styles.petChipSelected,
              ]}
              onPress={() => setSelectedPet(pet.id)}
            >
              <Text style={styles.petChipEmoji}>{pet.avatar || '🐾'}</Text>
              <Text style={[
                styles.petChipName,
                selectedPet === pet.id && styles.petChipNameSelected,
              ]}>
                {pet.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.addActivitySection}>
        <Text style={styles.sectionTitle}>添加训练活动</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>活动名称</Text>
          <TextInput
            style={styles.input}
            value={activityName}
            onChangeText={setActivityName}
            placeholder="如：坐下、握手、召回"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>训练时长（分钟）</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="输入训练时长"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>备注</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="训练表现、遇到的问题等"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleAddActivity}>
          <Text style={styles.submitButtonText}>添加训练</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>训练历史</Text>
        {petActivities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎾</Text>
            <Text style={styles.emptyTitle}>暂无训练记录</Text>
            <Text style={styles.emptySubtitle}>开始记录你的训练课程吧</Text>
          </View>
        ) : (
          petActivities.map((activity, index) => (
            <View key={activity.id || index} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityName}>{activity.name}</Text>
                {activity.duration > 0 && (
                  <Text style={styles.activityDuration}>{activity.duration}分钟</Text>
                )}
              </View>
              {activity.notes && (
                <Text style={styles.activityNotes}>{activity.notes}</Text>
              )}
              <Text style={styles.activityDate}>
                {new Date(activity.date).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#F97316',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  petSelector: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  petChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
  },
  petChipSelected: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  petChipEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  petChipName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  petChipNameSelected: {
    color: '#F97316',
    fontWeight: '600',
  },
  addActivitySection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
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
    backgroundColor: '#f9f9f9',
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
  historySection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  activityCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityDuration: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '500',
  },
  activityNotes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  activityDate: {
    fontSize: 12,
    color: '#999',
  },
});
