import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Device } from '../../types/device';

interface CameraListComponentProps {
  devices: Device[];
  onDevicePress?: (device: Device) => void;
  selectedDeviceId?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const CameraListComponent: React.FC<CameraListComponentProps> = ({
  devices,
  onDevicePress,
  selectedDeviceId,
  refreshing = false,
  onRefresh,
}) => {
  const getStatusColor = (status: Device['status']) => {
    switch (status) {
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

  const getStatusText = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return '在线';
      case 'offline':
        return '离线';
      case 'error':
        return '故障';
      default:
        return '未知';
    }
  };

  const renderDeviceItem = ({ item }: { item: Device }) => {
    const isSelected = item.id === selectedDeviceId;
    
    return (
      <TouchableOpacity
        style={[
          styles.deviceItem,
          isSelected && styles.deviceItemSelected,
        ]}
        onPress={() => onDevicePress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.deviceHeader}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={styles.deviceName}>{item.name}</Text>
        </View>
        
        <View style={styles.deviceInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>类型:</Text>
            <Text style={styles.infoValue}>{item.type}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>状态:</Text>
            <Text style={[styles.infoValue, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
          
          {item.settings?.resolution && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>分辨率:</Text>
              <Text style={styles.infoValue}>{item.settings.resolution}</Text>
            </View>
          )}
          
          {item.settings?.batteryLevel !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>电量:</Text>
              <Text style={[
                styles.infoValue,
                item.settings.batteryLevel < 20 && styles.batteryLow,
              ]}>
                {item.settings.batteryLevel}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.settingsIndicators}>
          {item.settings?.nightVision && (
            <View style={styles.indicator}>
              <Text style={styles.indicatorText}>🌙 夜视</Text>
            </View>
          )}
          {item.settings?.motionDetection && (
            <View style={styles.indicator}>
              <Text style={styles.indicatorText}>📡 移动侦测</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📷</Text>
      <Text style={styles.emptyTitle}>暂无摄像头设备</Text>
      <Text style={styles.emptySubtitle}>请添加或连接摄像头设备</Text>
    </View>
  );

  return (
    <FlatList
      data={devices}
      keyExtractor={(item) => item.id}
      renderItem={renderDeviceItem}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={renderEmptyList}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F97316"
            colors={['#F97316']}
          />
        ) : undefined
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  deviceItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceItemSelected: {
    borderWidth: 2,
    borderColor: '#F97316',
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  deviceInfo: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 60,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  batteryLow: {
    color: '#EF4444',
  },
  settingsIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  indicator: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  indicatorText: {
    fontSize: 12,
    color: '#666',
  },
  separator: {
    height: 8,
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
});
