import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';

const workflowItems = ['確認患者身分與感測器位置', '完成腸音採集並保留原始波形', '檢視 AI 推論摘要與異常提示'];

export default function SummaryScreen() {
  const router = useRouter();
  const { records, patients, settings } = useApp();
  const isDark = settings.themeMode === 'dark';

  const summaryItems = useMemo(() => {
    const now = new Date();
    const isToday = (value: string) => {
      const date = new Date(value);
      return date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
    };
    const todayRecords = records.filter(record => isToday(record.createdAt));
    const abnormalRecords = records.filter(record => record.aiResult.status === 'abnormal');

    return [
      { label: '今日採集', value: String(todayRecords.length), unit: '筆', icon: 'mic-outline' as const, color: '#1478F2', backgroundColor: '#EAF3FF' },
      { label: '異常訊號', value: String(abnormalRecords.length), unit: '筆', icon: 'pulse-outline' as const, color: '#C65A48', backgroundColor: '#FFF0EC' },
      { label: '感測器', value: settings.hardwareConnected ? '已連線' : '未連線', unit: '', icon: 'radio-outline' as const, color: settings.hardwareConnected ? '#2DA66F' : '#7B8998', backgroundColor: settings.hardwareConnected ? '#E9F8F1' : '#F0F3F6' },
    ];
  }, [records, settings.hardwareConnected]);

  // 取得最新紀錄，新到舊排序
  const sortedRecords = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusTag = (status: 'normal' | 'abnormal') => {
    switch (status) {
      case 'normal':
        return { label: '正常', color: '#10B981', bg: '#E6F8F3' };
      case 'abnormal':
        return { label: '異常', color: '#EF4444', bg: '#FEF2F2' };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const hr = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${y}/${m}/${d} ${hr}:${min}`;
    } catch {
      return isoString;
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.textPrimaryDark]}>檢測摘要</Text>
            <Text style={[styles.headerSubtitle, isDark && styles.textSecondaryDark]}>腸音採集與 AI 推論概況</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="clipboard-outline" size={24} color="#0D6EFD" />
          </View>
        </View>

        <View style={styles.summaryList}>
          {summaryItems.map((item) => (
            <View key={item.label} style={[styles.summaryCard, isDark && styles.surfaceDark]}>
              <View style={[styles.summaryIcon, { backgroundColor: item.backgroundColor }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.summaryText}>
                <Text style={[styles.summaryLabel, isDark && styles.textSecondaryDark]}>{item.label}</Text>
                <View style={styles.summaryValueRow}>
                  <Text style={[styles.summaryValue, isDark && styles.textPrimaryDark]}>{item.value}</Text>
                  {item.unit ? <Text style={styles.summaryUnit}>{item.unit}</Text> : null}
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textPrimaryDark]}>檢測流程</Text>
          <View style={[styles.workflowList, isDark && styles.surfaceDark]}>
            {workflowItems.map((item, index) => (
              <View key={item} style={styles.workflowItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepText}>{index + 1}</Text>
                </View>
                <Text style={[styles.workflowText, isDark && styles.textPrimaryDark]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 最近檢測歷史區塊 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textPrimaryDark]}>最近檢測歷史</Text>
          {sortedRecords.length === 0 ? (
            <View style={styles.emptyList}>
              <Ionicons name="folder-open-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyText}>尚無任何檢測紀錄</Text>
            </View>
          ) : (
            <View style={styles.recordList}>
              {sortedRecords.map(item => {
                const patient = patients.find(p => p.id === item.patientId);
                const tag = getStatusTag(item.aiResult.status);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.recordCard, isDark && styles.surfaceDark]}
                    onPress={() => router.push({ pathname: '/analytics', params: { recordId: item.id } })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.recordCardLeft}>
                      <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                          {patient ? patient.name.charAt(0) : '?'}
                        </Text>
                      </View>
                      <View style={styles.recordMeta}>
                        <View style={styles.recordNameRow}>
                          <Text style={[styles.patientName, isDark && styles.textPrimaryDark]}>{patient ? patient.name : '未知受測者'}</Text>
                          {patient?.bedNumber && (
                            <View style={styles.bedBadge}>
                              <Text style={styles.bedText}>{patient.bedNumber} 床</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.recordTime}>{formatDate(item.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={styles.recordCardRight}>
                      <View style={[styles.statusTag, { backgroundColor: tag.bg }]}>
                        <Text style={[styles.statusTagText, { color: tag.color }]}>{tag.label}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginLeft: 8 }} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
  emptyList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
    marginTop: 8,
    fontWeight: '500',
  },
  recordList: {
    gap: 12,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  recordCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  recordMeta: {
    flex: 1,
  },
  recordNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 8,
  },
  bedBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bedText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  recordTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  recordCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  containerDark: { backgroundColor: '#101820' },
  surfaceDark: { backgroundColor: '#17212B', borderColor: '#33404E' },
  textPrimaryDark: { color: '#EEF2F5' },
  textSecondaryDark: { color: '#A6B1BC' },
});
