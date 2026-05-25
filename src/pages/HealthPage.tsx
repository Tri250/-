import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Activity, AlertTriangle, Bell, Heart, Moon, Sun, Thermometer, ChevronRight, Shield } from 'lucide-react-native';
import { useAppStore } from '../store/appStore';

const alertTypeConfig = {
  cough: { icon: Activity, label: '咳嗽', color: '#eab308', bgColor: '#fefce8' },
  vomit: { icon: AlertTriangle, label: '呕吐', color: '#ef4444', bgColor: '#fee2e2' },
  pain: { icon: Heart, label: '疼痛', color: '#a855f7', bgColor: '#f5f3ff' },
  abnormal: { icon: Bell, label: '异常', color: '#f97316', bgColor: '#fff7ed' },
};

const severityConfig = {
  low: { label: '轻微', color: '#22c55e', bgColor: '#dcfce7' },
  medium: { label: '中等', color: '#eab308', bgColor: '#fefce8' },
  high: { label: '严重', color: '#ef4444', bgColor: '#fee2e2' },
};

const HealthPage: React.FC = () => {
  const { healthAlerts, healthScore, currentPet } = useAppStore();
  const [nightMode, setNightMode] = useState(true);

  const healthMetrics = [
    { label: '心率', value: '120', unit: 'bpm', icon: Heart, color: '#ef4444', bgColor: '#fee2e2' },
    { label: '体温', value: '38.2', unit: '°C', icon: Thermometer, color: '#f97316', bgColor: '#fff7ed' },
    { label: '活动量', value: '85', unit: '%', icon: Activity, color: '#22c55e', bgColor: '#dcfce7' },
  ];

  const dailyData = [
    { time: '00:00', heartRate: 110, activity: 20 },
    { time: '04:00', heartRate: 105, activity: 15 },
    { time: '08:00', heartRate: 125, activity: 70 },
    { time: '12:00', heartRate: 120, activity: 85 },
    { time: '16:00', heartRate: 115, activity: 60 },
    { time: '20:00', heartRate: 118, activity: 45 },
  ];

  const maxHeartRate = Math.max(...dailyData.map(d => d.heartRate));
  const maxActivity = Math.max(...dailyData.map(d => d.activity));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>全天候健康哨兵</Text>
        <Text style={styles.subtitle}>守护 {currentPet?.name} 的健康</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.healthScoreCard}>
          <View style={styles.healthScoreContent}>
            <View>
              <Text style={styles.healthScoreLabel}>当前健康指数</Text>
              <Text style={styles.healthScoreValue}>{healthScore}%</Text>
            </View>
            <View style={styles.healthScoreIcon}>
              <Shield size={32} color="#fff" />
            </View>
          </View>
          <View style={styles.healthScoreStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>监测中 · 数据更新于 2分钟前</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {healthMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <View key={metric.label} style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: metric.bgColor }]}>
                  <Icon size={20} color={metric.color} />
                </View>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>
                  {metric.value}
                  <Text style={styles.metricUnit}>{metric.unit}</Text>
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>今日监测曲线</Text>
            <View style={styles.cardLegend}>
              <View style={styles.legendItem}>
                <View style={styles.legendDotRed} />
                <Text style={styles.legendText}>心率</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendDotGreen} />
                <Text style={styles.legendText}>活动</Text>
              </View>
            </View>
          </View>
          <View style={styles.chartContainer}>
            {dailyData.map((data, index) => (
              <View key={index} style={styles.chartColumn}>
                <View style={styles.chartBars}>
                  <View
                    style={[styles.chartBarRed, { height: `${(data.heartRate / maxHeartRate) * 80}%` }]}
                  />
                  <View
                    style={[styles.chartBarGreen, { height: `${(data.activity / maxActivity) * 60}%` }]}
                  />
                </View>
                <Text style={styles.chartLabel}>{data.time}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Moon size={20} color="#a855f7" />
              <Text style={styles.cardTitle}>夜间监护模式</Text>
            </View>
            <TouchableOpacity
              onPress={() => setNightMode(!nightMode)}
              style={[styles.toggleButton, { backgroundColor: nightMode ? '#a855f7' : '#e5e7eb' }]}
            >
              <View style={[styles.toggleKnob, { left: nightMode ? 20 : 2 }]} />
            </TouchableOpacity>
          </View>
          <View style={styles.nightModeContent}>
            <View style={[styles.nightModeBadge, { backgroundColor: nightMode ? '#f5f3ff' : '#f3f4f6' }]}>
              {nightMode ? (
                <Moon size={12} color="#a855f7" />
              ) : (
                <Sun size={12} color="#9ca3af" />
              )}
              <Text style={[styles.nightModeText, { color: nightMode ? '#a855f7' : '#6b7280' }]}>
                {nightMode ? '已开启' : '已关闭'}
              </Text>
            </View>
            <Text style={styles.nightModeDescription}>
              {nightMode ? '夜间异常行为将被实时监测' : '夜间监测已关闭'}
            </Text>
          </View>
        </View>

        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>健康警报记录</Text>
            <TouchableOpacity style={styles.sectionLink}>
              <Text style={styles.sectionLinkText}>全部</Text>
              <ChevronRight size={16} color="#22c55e" />
            </TouchableOpacity>
          </View>

          {healthAlerts.length > 0 ? (
            <View style={styles.alertList}>
              {healthAlerts.slice(0, 3).map((alert) => {
                const typeConfig = alertTypeConfig[alert.type];
                const severityConfigItem = severityConfig[alert.severity];
                const Icon = typeConfig.icon;
                return (
                  <View key={alert.id} style={styles.alertCard}>
                    <View style={styles.alertContent}>
                      <View style={[styles.alertIcon, { backgroundColor: typeConfig.bgColor }]}>
                        <Icon size={20} color={typeConfig.color} />
                      </View>
                      <View style={styles.alertInfo}>
                        <View style={styles.alertHeader}>
                          <Text style={styles.alertType}>{typeConfig.label}</Text>
                          <View style={[styles.severityBadge, { backgroundColor: severityConfigItem.bgColor }]}>
                            <Text style={[styles.severityText, { color: severityConfigItem.color }]}>
                              {severityConfigItem.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.alertMessage}>{alert.message}</Text>
                      </View>
                    </View>
                    <Text style={styles.alertTime}>{alert.timestamp}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyAlert}>
              <Shield size={48} color="#22c55e" />
              <Text style={styles.emptyAlertTitle}>暂无健康警报</Text>
              <Text style={styles.emptyAlertText}>{currentPet?.name} 状态良好</Text>
            </View>
          )}
        </View>

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>
            ⚠️ <Text style={styles.disclaimerBold}>免责声明</Text>：本结果为AI辅助分析，不构成医疗诊断，请以专业兽医意见为准
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
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
  healthScoreCard: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  healthScoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthScoreLabel: {
    fontSize: 12,
    color: '#86efac',
  },
  healthScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  healthScoreIcon: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthScoreStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: '#86efac',
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#86efac',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#9ca3af',
    marginLeft: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLegend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDotRed: {
    width: 8,
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  legendDotGreen: {
    width: 8,
    height: 8,
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#6b7280',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 96,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBars: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    height: 80,
    alignItems: 'flex-end',
  },
  chartBarRed: {
    width: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarGreen: {
    width: 8,
    backgroundColor: '#22c55e',
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  toggleButton: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleKnob: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  nightModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nightModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  nightModeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  nightModeDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  sectionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionLinkText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  alertList: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  alertContent: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertInfo: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  alertType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '500',
  },
  alertMessage: {
    fontSize: 12,
    color: '#6b7280',
  },
  alertTime: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
  },
  emptyAlert: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  emptyAlertTitle: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
  },
  emptyAlertText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  disclaimerCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  disclaimerBold: {
    fontWeight: '600',
    color: '#dc2626',
  },
});

export { HealthPage };
