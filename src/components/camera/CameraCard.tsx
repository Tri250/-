import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Device } from '../../types/device';

interface CameraCardProps {
  device: Device;
  onClick?: (device: Device) => void;
  style?: any;
  className?: string;
  theme?: 'light' | 'dark';
}

export const CameraCard: React.FC<CameraCardProps> = ({
  device,
  onClick,
  style,
  className,
  theme = 'light',
}) => {
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48) / 2;

  const handlePress = () => {
    onClick?.(device);
  };

  const getStatusColor = () => {
    switch (device.status) {
      case 'online':
        return '#10B981';
      case 'offline':
        return '#EF4444';
      case 'error':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const renderThumbnail = () => {
    if (device.snapshotUrl) {
      return (
        <Image
          source={{ uri: device.snapshotUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      );
    }
    if (device.thumbnailUrl) {
      return (
        <Image
          source={{ uri: device.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      );
    }
    return (
      <View style={styles.placeholderThumbnail}>
        <Text style={styles.placeholderIcon}>📷</Text>
        <Text style={styles.placeholderText}>暂无预览</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: cardWidth },
        theme === 'dark' && styles.containerDark,
        className,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailContainer}>
        {renderThumbnail()}
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        {device.isRecording && (
          <View style={styles.recordingBadge}>
            <Text style={styles.recordingText}>录制中</Text>
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.deviceName} numberOfLines={1}>
          {device.name}
        </Text>
        
        <View style={styles.deviceMeta}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{device.type}</Text>
          </View>
          
          {device.settings?.resolution && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{device.settings.resolution}</Text>
            </View>
          )}
        </View>

        <View style={styles.settingsRow}>
          {device.settings?.nightVision && (
            <View style={styles.settingBadge}>
              <Text style={styles.settingIcon}>🌙</Text>
              <Text style={styles.settingText}>夜视</Text>
            </View>
          )}
          
          {device.settings?.motionDetection && (
            <View style={styles.settingBadge}>
              <Text style={styles.settingIcon}>📡</Text>
              <Text style={styles.settingText}>移动侦测</Text>
            </View>
          )}
        </View>

        {device.settings?.batteryLevel !== undefined && (
          <View style={styles.batteryContainer}>
            <Text style={[
              styles.batteryText,
              device.settings.batteryLevel < 20 && styles.batteryLow,
            ]}>
              🔋 {device.settings.batteryLevel}%
            </Text>
          </View>
        )}

        {device.status === 'offline' && device.lastSeen && (
          <Text style={styles.lastSeenText}>
            最后在线: {new Date(device.lastSeen).toLocaleString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
  containerDark: {
    backgroundColor: '#1F2937',
  },
  thumbnailContainer: {
    position: 'relative',
    height: 120,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  recordingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recordingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  deviceMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#666',
  },
  settingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  settingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  settingIcon: {
    fontSize: 10,
    marginRight: 2,
  },
  settingText: {
    fontSize: 10,
    color: '#666',
  },
  batteryContainer: {
    marginTop: 4,
  },
  batteryText: {
    fontSize: 12,
    color: '#666',
  },
  batteryLow: {
    color: '#EF4444',
  },
  lastSeenText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
});
