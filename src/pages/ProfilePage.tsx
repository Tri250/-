import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { User, Edit, History, Settings, Crown, Star, Heart, ChevronRight, Camera, X } from 'lucide-react-native';
import { useAppStore } from '../store/appStore';

const menuItems = [
  { icon: History, label: '分析历史', description: '查看所有翻译记录' },
  { icon: Settings, label: '设置', description: '隐私、通知等设置' },
  { icon: Heart, label: '收藏', description: '收藏的精彩时刻' },
  { icon: Star, label: '帮助与反馈', description: '使用帮助与问题反馈' },
];

const ProfilePage: React.FC = () => {
  const { currentPet, analyses } = useAppStore();
  const [showEdit, setShowEdit] = useState(false);
  const [petName, setPetName] = useState(currentPet?.name || '');
  const [petBreed, setPetBreed] = useState(currentPet?.breed || '');
  const [petAge, setPetAge] = useState(currentPet?.age.toString() || '');

  const recentAnalyses = analyses.slice(-3).reverse();

  const emotionEmoji = {
    happy: '😸',
    anxious: '😰',
    angry: '😾',
    needs: '🥺',
    neutral: '😐',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>宠物档案</Text>
        <Text style={styles.subtitle}>管理 {currentPet?.name} 的信息</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.profileCard}>
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>
                  {emotionEmoji[analyses.length > 0 ? analyses[analyses.length - 1].result.emotion : 'happy']}
                </Text>
              </View>
              <TouchableOpacity style={styles.cameraButton}>
                <Camera size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                {showEdit ? (
                  <TextInput
                    value={petName}
                    onChangeText={setPetName}
                    style={styles.nameInput}
                    placeholder="宠物名字"
                  />
                ) : (
                  <Text style={styles.petName}>{petName}</Text>
                )}
                <TouchableOpacity onPress={() => setShowEdit(!showEdit)} style={styles.editButton}>
                  {showEdit ? (
                    <X size={16} color="#6b7280" />
                  ) : (
                    <Edit size={16} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.petInfo}>
                {showEdit ? (
                  <TextInput
                    value={petBreed}
                    onChangeText={setPetBreed}
                    style={styles.infoInput}
                    placeholder="品种"
                  />
                ) : (
                  <Text style={styles.petBreed}>{petBreed}</Text>
                )}
                <Text style={styles.infoSeparator}>·</Text>
                {showEdit ? (
                  <TextInput
                    value={petAge}
                    onChangeText={setPetAge}
                    style={styles.infoInput}
                    placeholder="年龄"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.petAge}>{petAge} 岁</Text>
                )}
              </View>
              <View style={styles.memberBadge}>
                <Crown size={12} color="#a855f7" />
                <Text style={styles.memberText}>Pro会员</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{analyses.length}</Text>
            <Text style={styles.statLabel}>翻译次数</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>128</Text>
            <Text style={styles.statLabel}>守护天数</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statLabel}>健康率</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>最近翻译</Text>
          {recentAnalyses.length > 0 ? (
            <View style={styles.historyList}>
              {recentAnalyses.map((analysis) => (
                <View key={analysis.id} style={styles.historyItem}>
                  <View style={styles.historyEmoji}>
                    {emotionEmoji[analysis.result.emotion]}
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyText} numberOfLines={1}>{analysis.result.translation}</Text>
                    <Text style={styles.historyTime}>
                      {new Date(analysis.createdAt).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.historyConfidence}>{analysis.result.confidence}%</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryTitle}>暂无翻译记录</Text>
              <Text style={styles.emptyHistoryText}>快去使用翻译功能吧</Text>
            </View>
          )}
        </View>

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === menuItems.length - 1;
            return (
              <TouchableOpacity key={item.label} style={[styles.menuItem, isLast ? styles.menuItemLast : {}]}>
                <View style={styles.menuIcon}>
                  <Icon size={20} color="#a855f7" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </View>
                <ChevronRight size={20} color="#d1d5db" />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerVersion}>PawSync Pro v1.0.0</Text>
          <Text style={styles.footerTagline}>爪印同频 · 守护版</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf5ff',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3e8ff',
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
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  profileContent: {
    flexDirection: 'row',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  cameraButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    borderBottomWidth: 2,
    borderBottomColor: '#a855f7',
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  petBreed: {
    fontSize: 14,
    color: '#6b7280',
  },
  petAge: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoInput: {
    fontSize: 14,
    color: '#6b7280',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoSeparator: {
    color: '#d1d5db',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  memberText: {
    fontSize: 12,
    color: '#a855f7',
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: '#a855f7',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#e9d5ff',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  historyEmoji: {
    fontSize: 24,
    width: 40,
    height: 40,
    backgroundColor: '#fff7ed',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyText: {
    fontSize: 14,
    color: '#374151',
  },
  historyTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  historyConfidence: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 24,
  },
  emptyHistoryTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyHistoryText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f3e8ff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  menuDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    padding: 16,
  },
  footerVersion: {
    fontSize: 12,
    color: '#9ca3af',
  },
  footerTagline: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 4,
  },
});

export { ProfilePage };
