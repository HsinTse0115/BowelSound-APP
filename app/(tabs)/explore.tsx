import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const summaryItems = [
  {
    label: '今日採集',
    value: '3',
    unit: '筆',
    icon: 'mic-outline',
    color: '#0D6EFD',
    backgroundColor: '#E8F4FD',
  },
  {
    label: '待確認訊號',
    value: '1',
    unit: '筆',
    icon: 'pulse-outline',
    color: '#8B5CF6',
    backgroundColor: '#F3E8FF',
  },
  {
    label: '模型狀態',
    value: '待命',
    unit: '',
    icon: 'hardware-chip-outline',
    color: '#10B981',
    backgroundColor: '#E6F8F3',
  },
] as const;

const workflowItems = ['確認患者身分與感測器位置', '完成腸音採集並保留原始波形', '檢視 AI 推論摘要與異常提示'];

export default function SummaryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>檢測摘要</Text>
            <Text style={styles.headerSubtitle}>腸音採集與 AI 推論概況</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="clipboard-outline" size={24} color="#0D6EFD" />
          </View>
        </View>

        <View style={styles.summaryList}>
          {summaryItems.map((item) => (
            <View key={item.label} style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: item.backgroundColor }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.summaryText}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <View style={styles.summaryValueRow}>
                  <Text style={styles.summaryValue}>{item.value}</Text>
                  {item.unit ? <Text style={styles.summaryUnit}>{item.unit}</Text> : null}
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>臨床檢測流程</Text>
          <View style={styles.workflowList}>
            {workflowItems.map((item, index) => (
              <View key={item} style={styles.workflowItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepText}>{index + 1}</Text>
                </View>
                <Text style={styles.workflowText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#0D6EFD" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>資料僅供醫療人員判讀輔助</Text>
            <Text style={styles.infoDesc}>請結合患者臨床狀態與醫囑進行後續處置。</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryList: {
    gap: 14,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
  },
  summaryUnit: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 4,
    marginBottom: 3,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 14,
  },
  workflowList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 16,
  },
  workflowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepText: {
    color: '#0D6EFD',
    fontSize: 14,
    fontWeight: '800',
  },
  workflowText: {
    flex: 1,
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 16,
    marginTop: 28,
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D6EFD',
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});
