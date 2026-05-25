import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type EmotionType = 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';

const emotionConfig = {
  happy: { emoji: '😸', label: '开心', color: '#22c55e', bgColor: '#dcfce7' },
  anxious: { emoji: '😰', label: '焦虑', color: '#eab308', bgColor: '#fefce8' },
  angry: { emoji: '😾', label: '生气', color: '#ef4444', bgColor: '#fee2e2' },
  needs: { emoji: '🥺', label: '有需求', color: '#3b82f6', bgColor: '#eff6ff' },
  neutral: { emoji: '😐', label: '平静', color: '#6b7280', bgColor: '#f3f4f6' },
};

interface StatusCardProps {
  petName: string;
  emotion: EmotionType;
  healthScore: number;
  lastActivity: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ petName, emotion, healthScore, lastActivity }) => {
  const config = emotionConfig[emotion];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{config.emoji}</Text>
        </View>
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{petName}</Text>
          <View style={[styles.emotionBadge, { backgroundColor: config.bgColor }]}>
            <Text style={[styles.emotionLabel, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
      </View>

      <View style={styles.healthSection}>
        <View style={styles.healthScore}>
          <Text style={styles.healthScoreLabel}>健康指数</Text>
          <Text style={styles.healthScoreValue}>{healthScore}<Text style={styles.healthScoreUnit}>%</Text></Text>
        </View>
        <View style={styles.healthBarContainer}>
          <View style={[styles.healthBar, { width: `${healthScore}%` }]} />
        </View>
        <Text style={styles.lastActivity}>最近活跃 · {lastActivity}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  petInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  emotionBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  emotionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  healthSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  healthScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthScoreLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  healthScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  healthScoreUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#9ca3af',
  },
  healthBarContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 8,
  },
  healthBar: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  lastActivity: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export { StatusCard };
