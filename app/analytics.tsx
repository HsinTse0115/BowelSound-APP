// app/analytics.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp, Patient, BowelRecord } from '@/context/AppContext';
import { styles } from '../styles/analytics.styles';

/**
 * 視覺化分析頁面 (AnalyticsScreen)
 * 提供病患與腸音紀錄的連動選擇，並呈現時域波形圖、頻域頻譜圖及 AI 診斷報告。
 */
export default function AnalyticsScreen() {
  const router = useRouter();
  const { patients, records } = useApp();

  // 選擇的病患與紀錄狀態
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<BowelRecord | null>(null);

  // Modal 顯示狀態
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [recordModalVisible, setRecordModalVisible] = useState(false);

  // 1. 初始化預設選取：若有病患，預設選擇第一位病患及其最新一筆檢測紀錄
  useEffect(() => {
    if (patients.length > 0 && !selectedPatient) {
      const firstPatient = patients[0];
      setSelectedPatient(firstPatient);

      // 篩選該病患的紀錄
      const patientRecords = records.filter(r => r.patientId === firstPatient.id);
      if (patientRecords.length > 0) {
        // 依時間由新到舊排序
        const sorted = [...patientRecords].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSelectedRecord(sorted[0]);
      }
    }
  }, [patients, records, selectedPatient]);

  // 2. 連動篩選：當點擊選擇不同病患時，更新選取病患，並自動預選該病患的最新一筆紀錄
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientModalVisible(false);

    const patientRecords = records.filter(r => r.patientId === patient.id);
    if (patientRecords.length > 0) {
      const sorted = [...patientRecords].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSelectedRecord(sorted[0]);
    } else {
      setSelectedRecord(null);
    }
  };

  // 3. 篩選出目前選取病患的所有紀錄
  const filteredRecords = useMemo(() => {
    if (!selectedPatient) return [];
    return records
      .filter(r => r.patientId === selectedPatient.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedPatient, records]);

  // 日期格式化工具 (YYYY/MM/DD HH:mm)
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${date} ${hours}:${minutes}`;
  };

  // 頻譜圖 HSL 熱圖顏色生成 (0-255 映射至 冷色藍 240度 到 暖色紅 0度)
  const getHeatmapColor = (value: number) => {
    const hue = Math.max(0, Math.min(240, 240 - (value / 255) * 240));
    return `hsl(${hue}, 85%, 50%)`;
  };

  // 根據 AI 診斷狀態回傳色彩與圖示設定
  const statusConfig = useMemo(() => {
    if (!selectedRecord) return null;
    const status = selectedRecord.aiResult.status;
    switch (status) {
      case 'normal':
        return {
          label: '正常 (Normal)',
          color: '#10B981',
          bgColor: '#E6F8F3',
          icon: 'checkmark-circle-outline' as const,
        };
      case 'hyper':
        return {
          label: '亢進 (Hyperactive)',
          color: '#EF4444',
          bgColor: '#FEE2E2',
          icon: 'alert-circle-outline' as const,
        };
      case 'hypo':
        return {
          label: '減弱 (Hypoactive)',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          icon: 'warning-outline' as const,
        };
      default:
        return {
          label: '未定義',
          color: '#64748B',
          bgColor: '#F1F5F9',
          icon: 'help-circle-outline' as const,
        };
    }
  }, [selectedRecord]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部導覽列 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>視覺化分析</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 連動篩選下拉選單區塊 */}
        <View style={styles.selectorsContainer}>
          {/* 病患選擇器 */}
          <View style={styles.selectorCol}>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setPatientModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectorLabel}>選擇病患</Text>
              <View style={styles.selectorValueContainer}>
                <Text style={styles.selectorValueText} numberOfLines={1}>
                  {selectedPatient ? `${selectedPatient.name} (${selectedPatient.id})` : '未選取'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </View>
            </TouchableOpacity>
          </View>

          {/* 紀錄選擇器 */}
          <View style={styles.selectorCol}>
            <TouchableOpacity
              style={[
                styles.selectorButton,
                (!selectedPatient || filteredRecords.length === 0) && styles.selectorButtonDisabled
              ]}
              onPress={() => selectedPatient && filteredRecords.length > 0 && setRecordModalVisible(true)}
              disabled={!selectedPatient || filteredRecords.length === 0}
              activeOpacity={0.7}
            >
              <Text style={styles.selectorLabel}>檢測紀錄</Text>
              <View style={styles.selectorValueContainer}>
                <Text
                  style={[
                    styles.selectorValueText,
                    (!selectedPatient || filteredRecords.length === 0) && styles.selectorValueTextDisabled
                  ]}
                  numberOfLines={1}
                >
                  {filteredRecords.length === 0
                    ? '無採集紀錄'
                    : selectedRecord
                    ? formatDate(selectedRecord.createdAt)
                    : '選擇紀錄'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 核心內容展示區 */}
        {!selectedRecord ? (
          /* 空狀態畫面：提示錄音引導 */
          <View style={styles.emptyCard}>
            <Ionicons name="mic-off-outline" size={64} color="#94A3B8" />
            <Text style={styles.emptyTitle}>請先進行腸音採集</Text>
            <Text style={styles.emptySubtitle}>
              病患 {selectedPatient ? selectedPatient.name : ''} 目前尚無任何腸音紀錄，無法進行視覺化頻譜分析。
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/record')}
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>立即前往採集</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 數據分析視覺化與報告 */
          <View>
            {/* 1. 音訊時域波形圖 Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Ionicons name="pulse" size={20} color="#8B5CF6" />
                  <Text style={styles.cardTitle}>音訊時域波形圖 (Waveform)</Text>
                </View>
                <Text style={styles.cardSubtitle}>50 採樣點能量分布</Text>
              </View>
              <View style={styles.waveformContainer}>
                <View style={styles.waveformBarContainer}>
                  {selectedRecord.aiResult.waveformMockData.map((val, idx) => {
                    // 將 [-1.0, 1.0] 的能量絕對值映射至適當高度
                    const barHeight = Math.max(4, Math.abs(val) * 110);
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.waveformBar,
                          {
                            height: barHeight,
                            backgroundColor: statusConfig?.color || '#8B5CF6',
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 2. 頻域頻譜圖 Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Ionicons name="analytics" size={20} color="#0D6EFD" />
                  <Text style={styles.cardTitle}>頻域頻譜圖 (Spectrogram)</Text>
                </View>
                <Text style={styles.cardSubtitle}>10x10 聲學能量矩陣</Text>
              </View>
              
              <View style={styles.spectrogramContainer}>
                {/* Y 軸刻度標籤 (50Hz - 500Hz) */}
                <View style={styles.yAxis}>
                  <Text style={styles.yAxisText}>500 Hz</Text>
                  <Text style={styles.yAxisText}>250 Hz</Text>
                  <Text style={styles.yAxisText}>50 Hz</Text>
                </View>

                {/* 10x10 網格熱圖 */}
                <View style={styles.gridWrapper}>
                  <View style={styles.gridContainer}>
                    {selectedRecord.aiResult.spectrogramMockData.map((row, rIdx) => (
                      <View key={rIdx} style={styles.gridRow}>
                        {row.map((val, cIdx) => (
                          <View
                            key={cIdx}
                            style={[
                              styles.gridCell,
                              { backgroundColor: getHeatmapColor(val) },
                            ]}
                          />
                        ))}
                      </View>
                    ))}
                  </View>

                  {/* X 軸時間標籤 (0s - 錄音時長) */}
                  <View style={[styles.xAxis, { width: 10 * 23 }]}>
                    <Text style={styles.xAxisText}>0s</Text>
                    <Text style={styles.xAxisText}>{selectedRecord.duration / 2}s</Text>
                    <Text style={styles.xAxisText}>{selectedRecord.duration}s</Text>
                  </View>
                </View>
              </View>

              {/* 頻譜能量對照圖例 (冷色到暖色) */}
              <View style={styles.legendContainer}>
                <Text style={styles.legendLabel}>低能量 (0)</Text>
                <View style={styles.legendBar}>
                  <View style={{ flexDirection: 'row', width: '100%', height: 8 }}>
                    {[0, 32, 64, 96, 128, 160, 192, 224, 255].map((val, idx) => (
                      <View
                        key={idx}
                        style={{
                          flex: 1,
                          height: 8,
                          backgroundColor: getHeatmapColor(val),
                          borderTopLeftRadius: idx === 0 ? 4 : 0,
                          borderBottomLeftRadius: idx === 0 ? 4 : 0,
                          borderTopRightRadius: idx === 8 ? 4 : 0,
                          borderBottomRightRadius: idx === 8 ? 4 : 0,
                        }}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.legendLabel}>高能量 (255)</Text>
              </View>
            </View>

            {/* 3. AI 診斷報告面板 Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Ionicons name="document-text" size={20} color="#10B981" />
                  <Text style={styles.cardTitle}>AI 診斷報告面板</Text>
                </View>
              </View>

              {/* 三大指標 */}
              <View style={styles.metricsRow}>
                {/* 腸鳴音頻率 */}
                <View style={styles.metricCard}>
                  <Ionicons name="heart" size={24} color="#EF4444" />
                  <Text style={styles.metricLabel}>腸鳴音頻率</Text>
                  <Text style={styles.metricValue}>
                    {selectedRecord.aiResult.frequency} 次/分
                  </Text>
                </View>

                {/* 狀態分類 */}
                <View style={styles.metricCard}>
                  <Ionicons name="medical" size={24} color={statusConfig?.color} />
                  <Text style={styles.metricLabel}>狀態分類</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig?.bgColor }]}>
                    <Text style={[styles.statusBadgeText, { color: statusConfig?.color }]}>
                      {statusConfig?.label.split(' ')[0]}
                    </Text>
                  </View>
                </View>

                {/* 信心度 */}
                <View style={styles.metricCard}>
                  <Ionicons name="shield-checkmark" size={24} color="#0D6EFD" />
                  <Text style={styles.metricLabel}>AI 信心度</Text>
                  <Text style={styles.metricValue}>
                    {(selectedRecord.aiResult.confidence * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>

              {/* 檢測參數欄位 */}
              <View style={styles.paramSection}>
                <Text style={styles.paramSectionTitle}>檢測生理與環境參數</Text>
                <View style={styles.paramGrid}>
                  <View style={styles.paramItem}>
                    <Ionicons name="restaurant-outline" size={16} color="#64748B" />
                    <Text style={styles.paramLabel}>飯後時間：</Text>
                    <Text style={styles.paramValue}>{selectedRecord.mealTime || '未紀錄'}</Text>
                  </View>
                  <View style={styles.paramItem}>
                    <Ionicons name="volume-medium-outline" size={16} color="#64748B" />
                    <Text style={styles.paramLabel}>環境音量：</Text>
                    <Text style={styles.paramValue}>{selectedRecord.decibelLevel ? `${selectedRecord.decibelLevel} dB` : '未紀錄'}</Text>
                  </View>
                  <View style={styles.paramItem}>
                    <Ionicons name="cafe-outline" size={16} color="#64748B" />
                    <Text style={styles.paramLabel}>咖啡因/茶：</Text>
                    <Text style={styles.paramValue}>{selectedRecord.hasCaffeine ? '是' : '否'}</Text>
                  </View>
                  <View style={styles.paramItem}>
                    <Ionicons name="warning-outline" size={16} color="#64748B" />
                    <Text style={styles.paramLabel}>腸胃症狀：</Text>
                    <Text style={styles.paramValue}>
                      {selectedRecord.symptoms && selectedRecord.symptoms.length > 0 
                        ? selectedRecord.symptoms.join(', ') 
                        : '無症狀'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 詳細臨床診斷說明 */}
              <View
                style={[
                  styles.reportSection,
                  { borderLeftColor: statusConfig?.color || '#10B981' },
                ]}
              >
                <View style={styles.reportHeader}>
                  <Ionicons
                    name={statusConfig?.icon || 'checkmark-circle-outline'}
                    size={18}
                    color={statusConfig?.color}
                  />
                  <Text style={styles.reportHeaderTitle}>臨床診斷說明</Text>
                </View>
                <Text style={styles.reportText}>{selectedRecord.aiResult.notes}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 病患選擇 Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={patientModalVisible}
        onRequestClose={() => setPatientModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPatientModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>選擇病患</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setPatientModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={patients}
              keyExtractor={(item: Patient) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }: { item: Patient }) => {
                const isSelected = selectedPatient?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => handlePatientSelect(item)}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={styles.modalItemTitle}>{item.name}</Text>
                      <View style={styles.modalItemMeta}>
                        <Text style={styles.modalItemMetaText}>ID: {item.id}</Text>
                        <Text style={styles.modalItemMetaText}>
                          {item.gender === 'M' ? '男' : '女'} / {item.age} 歲
                        </Text>
                      </View>
                    </View>
                    <View style={styles.modalItemRight}>
                      {isSelected && <Ionicons name="checkmark" size={20} color="#0D6EFD" />}
                      <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 檢測紀錄選擇 Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={recordModalVisible}
        onRequestClose={() => setRecordModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRecordModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>選擇檢測紀錄</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setRecordModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredRecords}
              keyExtractor={(item: BowelRecord) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }: { item: BowelRecord }) => {
                const isSelected = selectedRecord?.id === item.id;
                const recStatus = item.aiResult.status;
                let recStatusLabel = '正常';
                let recStatusColor = '#10B981';
                if (recStatus === 'hyper') {
                  recStatusLabel = '亢進';
                  recStatusColor = '#EF4444';
                } else if (recStatus === 'hypo') {
                  recStatusLabel = '減弱';
                  recStatusColor = '#F59E0B';
                }

                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setSelectedRecord(item);
                      setRecordModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={styles.modalItemTitle}>{formatDate(item.createdAt)}</Text>
                      <View style={styles.modalItemMeta}>
                        <Text style={styles.modalItemMetaText}>時長: {item.duration}秒</Text>
                        <Text style={[styles.modalItemMetaText, { color: recStatusColor }]}>
                          狀態: {recStatusLabel}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.modalItemRight}>
                      {isSelected && <Ionicons name="checkmark" size={20} color="#0D6EFD" />}
                      <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
