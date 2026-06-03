import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'low' | 'medium' | 'high';
  borderRadius?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 'medium',
  borderRadius = 16,
}) => {
  return (
    <View style={[styles.container, { borderRadius }, style]}>
      <View style={[
        styles.glass,
        styles[intensity],
        { borderRadius },
      ]}>
        <View style={[styles.content, { borderRadius }]}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  glass: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  low: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  high: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

// Loading spinner component
export const GlassSpinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <View style={[styles.spinnerContainer, { width: size, height: size }]}>
    <View style={[styles.spinner, { width: size, height: size }]} />
  </View>
);

const styles = StyleSheet.create({
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#fff',
    borderRadius: 100,
  },
});
