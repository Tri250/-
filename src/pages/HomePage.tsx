import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Bell, TrendingUp, Moon, ChevronRight } from 'lucide-react-native';
import { useAppStore } from '../store/appStore';
import { StatusCard } from '../components/StatusCard';
import { QuickAction } from '../components/QuickAction';

const HomePage: React.FC = () => {
  const { currentPet, currentEmotion, healthScore, healthAlerts } = useAppStore();
  const lastActivity = '刚刚活跃';

  const handleNavigate = (action: string) => {
    console.log('Navigate to:', action);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>PawSync Pro</Text>
          <Text style={styles.appSubtitle}>爪印同频 · 守护版</Text>
        </View>
        <TouchableOpacity style={styles.bellButton}>
          <Bell size={24} color="#6b7280" />
          {healthAlerts.length > 0 && (
            <View style={styles.badge} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <StatusCard
          petName={currentPet?.name || ''}
          emotion={currentEmotion}
          healthScore={healthScore}
          lastActivity={lastActivity}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快捷操作</Text>
          <QuickAction onAction={handleNavigate} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <TrendingUp size={20} color="#22c55e" />
              <Text style={styles.cardTitle}>健康趋势</Text>
            </View>
            <TouchableOpacity style={styles.cardLink}>
              <Text style={styles.cardLinkText}>查看详情</Text>
              <ChevronRight size={16} color="#f97316" />
            </TouchableOpacity>
          </View>
          <View style={styles.chartContainer}>
            {[65, 72, 68, 78, 82, 75, 88].map((height, index) => (
              <View
                key={index}
                style={[styles.chartBar, { height: `${height}%` }]}
              />
            ))}
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>周一</Text>
            <Text style={styles.chartLabel}>周三</Text>
            <Text style={styles.chartLabel}>周五</Text>
            <Text style={styles.chartLabel}>周日</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Moon size={20} color="#a855f7" />
              <Text style={styles.cardTitle}>离家守护</Text>
            </View>
            <TouchableOpacity style={styles.toggleButton}>
              <View style={styles.toggleKnob} />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardDescription}>
            守护模式已开启，小橘的异常行为将被实时监测
          </Text>
        </View>

        {healthAlerts.length > 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertContent}>
              <View style={styles.alertIcon}>
                <Bell size={16} color="#ef4444" />
              </View>
              <View>
                <Text style={styles.alertTitle}>健康提醒</Text>
                <Text style={styles.alertMessage}>{healthAlerts[0].message}</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.alertLink}>查看</Text>
            </TouchableOpacity>
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  bellButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  mainContent: {
    padding: 16,
    gap: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  cardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLinkText: {
    fontSize: 12,
    color: '#f97316',
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 80,
    marginBottom: 8,
  },
  chartBar: {
    flex: 1,
    backgroundColor: '#f97316',
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  toggleButton: {
    width: 40,
    height: 24,
    backgroundColor: '#f97316',
    borderRadius: 12,
    padding: 2,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  alertCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  alertMessage: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  alertLink: {
    fontSize: 12,
    color: '#f97316',
    fontWeight: '500',
  },
});

export { HomePage };
