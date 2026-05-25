import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Mic, MicOff, ImageIcon, Share2, RefreshCw, Sparkles } from 'lucide-react-native';
import { useAppStore } from '../store/appStore';

type EmotionType = 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';

const emotionConfig = {
  happy: { emoji: '😸', label: '开心', color: '#22c55e', bgColor: '#dcfce7' },
  anxious: { emoji: '😰', label: '焦虑', color: '#eab308', bgColor: '#fefce8' },
  angry: { emoji: '😾', label: '生气', color: '#ef4444', bgColor: '#fee2e2' },
  needs: { emoji: '🥺', label: '有需求', color: '#3b82f6', bgColor: '#eff6ff' },
  neutral: { emoji: '😐', label: '平静', color: '#6b7280', bgColor: '#f3f4f6' },
};

const mockTranslations = {
  happy: [
    '主人，我今天超开心的！要不要一起玩呀？',
    '今天心情真好，谢谢主人陪我～',
    '喵～今天阳光真好，我很满足！',
  ],
  anxious: [
    '主人，你要去哪里呀？不要离开我太久...',
    '有点紧张，能陪陪我吗？',
    '外面好像有声音，有点害怕...',
  ],
  angry: [
    '哼！你为什么不给我开门！',
    '我生气了！快给我小鱼干！',
    '别碰我！我现在不想理你！',
  ],
  needs: [
    '主人，我饿了，要吃饭饭～',
    '想出去玩玩，放我出去嘛～',
    '好久没梳毛了，帮我梳梳毛吧！',
  ],
  neutral: [
    '今天天气不错呢...',
    '我在思考猫生...',
    '嗯...就这样吧。',
  ],
};

const TranslatorPage: React.FC = () => {
  const { currentPet, addAnalysis, setCurrentEmotion } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [emotion, setEmotion] = useState<EmotionType>('neutral');
  const [translation, setTranslation] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const timerRef = useRef<number | null>(null);

  const pulseScale = useRef(new Animated.Value(1)).current;

  const emotions: EmotionType[] = ['happy', 'anxious', 'angry', 'needs', 'neutral'];

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    pulseScale.setValue(1);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    analyzeVoice();
  };

  const analyzeVoice = () => {
    setIsAnalyzing(true);
    setShowResult(false);

    setTimeout(() => {
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const translations = mockTranslations[randomEmotion];
      const randomTranslation = translations[Math.floor(Math.random() * translations.length)];
      const randomConfidence = 85 + Math.floor(Math.random() * 14);

      setEmotion(randomEmotion);
      setTranslation(randomTranslation);
      setConfidence(randomConfidence);
      setIsAnalyzing(false);
      setShowResult(true);
      setCurrentEmotion(randomEmotion);

      addAnalysis({
        petId: currentPet?.id || '',
        type: 'voice',
        result: {
          emotion: randomEmotion,
          translation: randomTranslation,
          confidence: randomConfidence,
        },
      });
    }, 1500);
  };

  const handleShare = () => {
    const text = `【PawSync Pro】${currentPet?.name}说："${translation}"`;
    console.log('Share:', text);
    alert('已复制到剪贴板');
  };

  const handleRetry = () => {
    setShowResult(false);
    setEmotion('neutral');
    setTranslation('');
    setConfidence(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const config = emotionConfig[emotion];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI 情感翻译机</Text>
        <Text style={styles.subtitle}>倾听 {currentPet?.name} 的心声</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={startRecording}
            disabled={isRecording || isAnalyzing}
            style={[
              styles.actionButton,
              { backgroundColor: isRecording || isAnalyzing ? '#f3f4f6' : '#f97316' },
            ]}
          >
            <Mic size={20} color={isRecording || isAnalyzing ? '#9ca3af' : '#fff'} />
            <Text style={[styles.buttonText, { color: isRecording || isAnalyzing ? '#9ca3af' : '#fff' }]}>
              录音翻译
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonBlue}>
            <ImageIcon size={20} color="#fff" />
            <Text style={styles.buttonTextWhite}>拍照分析</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recordingArea}>
          <Animated.View
            style={{ transform: [{ scale: pulseScale }] }}
          >
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzing}
              style={[
                styles.recordButton,
                {
                  backgroundColor: isRecording
                    ? '#ef4444'
                    : isAnalyzing
                    ? '#9ca3af'
                    : '#f97316',
                },
              ]}
            >
              {isAnalyzing ? (
                <RefreshCw size={48} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
              ) : isRecording ? (
                <MicOff size={56} color="#fff" />
              ) : (
                <Mic size={56} color="#fff" />
              )}
            </TouchableOpacity>
          </Animated.View>

          {isRecording && (
            <View style={styles.waveAnimation}>
              <View style={styles.wave} />
              <View style={[styles.wave, { animationDelay: '0.2s' }]} />
              <View style={[styles.wave, { animationDelay: '0.4s' }]} />
            </View>
          )}
        </View>

        {isRecording && (
          <View style={styles.recordingInfo}>
            <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
            <Text style={styles.recordingHint}>正在录音，点击结束</Text>
          </View>
        )}

        {isAnalyzing && (
          <View style={styles.analyzingInfo}>
            <Sparkles size={20} color="#f97316" style={{ animation: 'spin 1s linear infinite' }} />
            <Text style={styles.analyzingText}>AI 正在分析中...</Text>
          </View>
        )}

        {showResult && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={[styles.emotionBadge, { backgroundColor: config.bgColor }]}>
                <Text style={{ fontSize: 16 }}>{config.emoji}</Text>
                <Text style={[styles.emotionLabel, { color: config.color }]}>{config.label}</Text>
              </View>
              <Text style={styles.confidence}>置信度: {confidence}%</Text>
            </View>

            <View style={styles.translationBox}>
              <Text style={styles.translationText}>{translation}</Text>
              <Text style={styles.translationAuthor}>— {currentPet?.name}</Text>
            </View>

            <View style={styles.resultButtons}>
              <TouchableOpacity onPress={handleRetry} style={styles.resultButton}>
                <RefreshCw size={16} color="#6b7280" />
                <Text style={styles.resultButtonText}>再录一次</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.resultButtonPrimary}>
                <Share2 size={16} color="#fff" />
                <Text style={styles.resultButtonTextWhite}>分享</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            💡 提示：请将麦克风靠近宠物，保持环境安静以获得更好的识别效果
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7ed',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  mainContent: {
    padding: 16,
    gap: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextWhite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  recordingArea: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  recordButton: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  waveAnimation: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    borderWidth: 4,
    borderColor: '#fed7aa',
    opacity: 0.3,
    animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
  },
  recordingInfo: {
    alignItems: 'center',
  },
  recordingTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  recordingHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  analyzingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzingText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  emotionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  confidence: {
    fontSize: 12,
    color: '#9ca3af',
  },
  translationBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  translationText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  translationAuthor: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 8,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  resultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  resultButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f97316',
  },
  resultButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  resultButtonTextWhite: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  tipCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  tipText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export { TranslatorPage };
