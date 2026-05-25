import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Mic, Image, Activity, History } from 'lucide-react-native';

const actions = [
  { id: 'record', icon: Mic, label: '录音', color: '#f97316', bgColor: '#fff7ed' },
  { id: 'photo', icon: Image, label: '拍照', color: '#3b82f6', bgColor: '#eff6ff' },
  { id: 'health', icon: Activity, label: '健康', color: '#22c55e', bgColor: '#dcfce7' },
  { id: 'history', icon: History, label: '历史', color: '#a855f7', bgColor: '#f3e8ff' },
];

interface QuickActionProps {
  onAction: (action: string) => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ onAction }) => {
  return (
    <View style={styles.container}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <TouchableOpacity
            key={action.id}
            onPress={() => onAction(action.id)}
            style={styles.actionButton}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.bgColor }]}>
              <Icon size={24} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
});

export { QuickAction };
