import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useTranslatorStore } from '../../store/translatorStore';
import { usePetStore } from '../../store/petStore';
import { VoiceRecorder } from '../../components/common/VoiceRecorder';
import { TranslationResult } from '../../components/common/TranslationResult';

interface TranslatorPageProps {
  petId?: string;
}

export const TranslatorPage: React.FC<TranslatorPageProps> = ({ petId }) => {
  const { translations, addTranslation } = useTranslatorStore();
  const { pets, getPetById } = usePetStore();
  const [selectedPet, setSelectedPet] = useState(petId || pets[0]?.id || '');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentPet = getPetById(selectedPet);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTimer(0);
    setRecordedText('');
    setTranslatedText('');
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    
    // Simulate voice-to-text conversion
    const mockRecordedText = generateMockRecording();
    setRecordedText(mockRecordedText);
    
    // Simulate translation
    const mockTranslation = generateMockTranslation(mockRecordedText);
    setTranslatedText(mockTranslation);
    
    // Save to store
    if (mockRecordedText && mockTranslation) {
      await addTranslation({
        petId: selectedPet,
        originalText: mockRecordedText,
        translatedText: mockTranslation,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const generateMockRecording = () => {
    const phrases = [
      '汪汪汪！',
      '呜呜...',
      '旺！',
      '嗷呜~',
      '嘿嘿！',
    ];
    const randomPhrases = [];
    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count; i++) {
      randomPhrases.push(phrases[Math.floor(Math.random() * phrases.length)]);
    }
    return randomPhrases.join(' ');
  };

  const generateMockTranslation = (text: string) => {
    const translations: Record<string, string> = {
      '汪汪汪！': '主人！你终于回来了！我好开心！',
      '呜呜...': '我有点难过，可能需要你的陪伴',
      '旺！': '有陌生人来了！要提高警惕！',
      '嗷呜~': '我有点无聊，想出去玩',
      '嘿嘿！': '看到美味的食物啦！好期待！',
    };
    
    let result = text;
    Object.keys(translations).forEach((key) => {
      result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), translations[key]);
    });
    
    if (result === text) {
      const mockTranslations = [
        '我觉得今天心情很好！',
        '我想要出去散步',
        '我有点饿了',
        '我想和你玩',
      ];
      return mockTranslations[Math.floor(Math.random() * mockTranslations.length)];
    }
    
    return result;
  };

  const handlePlayTranslation = () => {
    if (translatedText) {
      Alert.alert('播放翻译', `正在播放: ${translatedText}`);
    }
  };

  const handleClear = () => {
    setRecordedText('');
    setTranslatedText('');
    setTimer(0);
  };

  const petTranslations = translations.filter((t) => t.petId === selectedPet);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>宠物翻译器</Text>
        <Text style={styles.subtitle}>
          尝试理解{currentPet?.name || '宠物'}的心声
        </Text>
      </View>

      <View style={styles.petSelector}>
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

      <View style={styles.recordingSection}>
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>{formatTime(timer)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
          ]}
          onPress={isRecording ? handleStopRecording : handleStartRecording}
        >
          <Text style={styles.recordButtonIcon}>
            {isRecording ? '⏹️' : '🎤'}
          </Text>
          <Text style={styles.recordButtonText}>
            {isRecording ? '停止录音' : '开始录音'}
          </Text>
        </TouchableOpacity>

        {currentPet && (
          <Text style={styles.hint}>
            正在聆听 {currentPet.name} 的声音...
          </Text>
        )}
      </View>

      {(recordedText || translatedText) && (
        <View style={styles.resultSection}>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>原始声音</Text>
            <Text style={styles.resultText}>{recordedText}</Text>
          </View>

          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>↓</Text>
          </View>

          <View style={[styles.resultCard, styles.translatedCard]}>
            <Text style={styles.resultLabel}>翻译结果</Text>
            <Text style={[styles.resultText, styles.translatedText]}>
              {translatedText}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handlePlayTranslation}>
              <Text style={styles.actionButtonIcon}>🔊</Text>
              <Text style={styles.actionButtonText}>播放</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleClear}>
              <Text style={styles.actionButtonIcon}>🗑️</Text>
              <Text style={styles.actionButtonText}>清除</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>翻译历史</Text>
        {petTranslations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>暂无翻译记录</Text>
            <Text style={styles.emptySubtitle}>开始录音来翻译宠物的声音</Text>
          </View>
        ) : (
          petTranslations.slice(0, 10).map((translation, index) => (
            <View key={translation.id || index} style={styles.historyCard}>
              <Text style={styles.historyOriginal}>{translation.originalText}</Text>
              <Text style={styles.historyArrow}>→</Text>
              <Text style={styles.historyTranslated}>{translation.translatedText}</Text>
              <Text style={styles.historyDate}>
                {new Date(translation.timestamp).toLocaleString()}
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
  recordingSection: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerContainer: {
    marginBottom: 20,
  },
  timer: {
    fontSize: 48,
    fontWeight: '200',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordButtonActive: {
    backgroundColor: '#EF4444',
  },
  recordButtonIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  resultSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  translatedCard: {
    backgroundColor: '#FFF3E0',
  },
  resultLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  translatedText: {
    color: '#F97316',
    fontWeight: '500',
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  arrow: {
    fontSize: 24,
    color: '#F97316',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  historySection: {
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
  historyCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyOriginal: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  historyArrow: {
    fontSize: 12,
    color: '#F97316',
    marginBottom: 4,
  },
  historyTranslated: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 10,
    color: '#999',
  },
});
