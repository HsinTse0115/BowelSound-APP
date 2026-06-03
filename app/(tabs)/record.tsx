import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, Modal, FlatList, Alert, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router'; // 匯入路由功能
import { Ionicons } from '@expo/vector-icons'; // 匯入圖示套件

import { styles } from '../../styles/record.styles';
import { useApp, Patient } from '../../context/AppContext';
import { WaveformVisualizer } from '../../components/WaveformVisualizer';

/**
 * RecordScreen 元件：負責即時採集腸音信號的頁面。
 * 包含選擇病患、動態波形模擬、自動/手動停止錄音及儲存功能。
 */
export default function RecordScreen() {
  const router = useRouter();
  const { patients, settings, addRecord } = useApp();

  // 狀態管理
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0); // 記錄錄音的總秒數
  const [hasCaffeine, setHasCaffeine] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const symptomOptions = ['無症狀', '脹氣', '腹痛', '便秘', '腹瀉'];

  const toggleSymptom = (symp: string) => {
    setSelectedSymptoms(prev => {
      if (symp === '無症狀') {
        return prev.includes('無症狀') ? [] : ['無症狀'];
      } else {
        const filtered = prev.filter(s => s !== '無症狀');
        return filtered.includes(symp) ? filtered.filter(s => s !== symp) : [...filtered, symp];
      }
    });
  };

  // 取得目前選擇的病患詳細資料
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // 停止錄音並儲存資料的邏輯
  const handleStopRecording = useCallback((overrideDuration?: number) => {
    setIsRecording(false);
    
    if (!selectedPatientId) return;

    // 計算最終錄音時長，確保至少有 1 秒（防止秒數為 0 時的例外）
    const finalDuration = overrideDuration !== undefined ? overrideDuration : seconds;
    const duration = Math.max(1, finalDuration);

    // 呼叫 AppContext 中的 addRecord 儲存資料，包含咖啡因與腸胃症狀
    const newRecord = addRecord(selectedPatientId, duration, hasCaffeine, selectedSymptoms);

    // 重置錄音前狀態
    setHasCaffeine(false);
    setSelectedSymptoms([]);

    // 跳出成功提示對話框，引導用戶進行下一步操作
    Alert.alert(
      '腸音採集已儲存！',
      'AI 分析已生成',
      [
        {
          text: '返回首頁',
          onPress: () => router.replace('/'),
          style: 'cancel',
        },
        {
          text: '查看分析結果',
          onPress: () => {
            router.push({
              pathname: '/analytics',
              params: { recordId: newRecord.id }
            });
          },
          style: 'default',
        },
      ],
      { cancelable: false }
    );
  }, [selectedPatientId, seconds, addRecord, router, hasCaffeine, selectedSymptoms]);

  // 計時器邏輯：當 isRecording 改變時啟動或清除計時器
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isRecording) {
      // 正在錄音，每 1000 毫秒 (1 秒) 秒數加 1
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    }

    // 清理機制：元件卸載或狀態改變時清除計時器
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  // 監聽錄音計時限制，達到設定時間後自動停止
  useEffect(() => {
    const defaultDuration = settings?.defaultDuration;
    if (isRecording && defaultDuration && defaultDuration > 0 && seconds >= defaultDuration) {
      handleStopRecording(defaultDuration);
    }
  }, [seconds, isRecording, settings?.defaultDuration, handleStopRecording]);

  // 將秒數轉換為「MM:SS」格式 (例如 72 秒轉換為 01:12)
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const displaySeconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${displaySeconds}`;
  };

  // 點擊按鈕的處理邏輯
  const handleRecordPress = () => {
    if (!selectedPatientId) {
      Alert.alert('提示', '請先選擇病患');
      return;
    }

    if (!isRecording) {
      // 準備開始錄製，將秒數歸零
      setSeconds(0);
      setIsRecording(true);
    } else {
      // 手動停止錄製
      handleStopRecording();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* 返回上一頁按鈕 */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        
        {/* 標題區塊 */}
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>腸音檢測系統</Text>
          {selectedPatient ? (
            <Text style={styles.subTitle}>當前病患: {selectedPatient.name} ({selectedPatient.id})</Text>
          ) : (
            <Text style={styles.subTitle}>請先選擇病患</Text>
          )}
        </View>
      </View>

      {isRecording ? (
        <View style={styles.mainContent}>
          {/* 腸音波形模擬顯示區域 */}
          <View style={styles.waveformBox}>
            {/* 動態波形模擬元件 */}
            <WaveformVisualizer isRecording={isRecording} />
            <Text style={styles.statusText}>🔴 正在接收訊號...</Text>
          </View>

          {/* 顯示動態計時器 */}
          <Text style={styles.timeDisplay}>
            {formatTime(seconds)}
          </Text>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.recordButton, styles.recordButtonActive]}
              onPress={handleRecordPress}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>停止</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          {/* 病患選擇器 */}
          <Text style={styles.sectionTitle}>病患綁定</Text>
          <TouchableOpacity 
            style={styles.patientSelector} 
            onPress={() => setIsPickerVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.patientSelectorLeft}>
              <Ionicons 
                name="person-circle-outline" 
                size={24} 
                color={selectedPatient ? "#0D6EFD" : "#94A3B8"} 
              />
              {selectedPatient ? (
                <Text style={styles.patientSelectorText}>
                  {selectedPatient.id} - {selectedPatient.name} ({selectedPatient.gender === 'M' ? '男' : '女'}, {selectedPatient.age}歲)
                </Text>
              ) : (
                <Text style={styles.patientSelectorPlaceholder}>點擊此處選擇病患...</Text>
              )}
            </View>
            <Ionicons name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>

          {/* 環境與麥克風狀態 */}
          <View style={styles.statusBox}>
            <Text style={styles.statusBoxText}>🎤 麥克風權限：🟢 已授權</Text>
            <Text style={styles.statusBoxText}>🔊 當前環境音量：🟢 35 dB</Text>
          </View>

          {/* 狀態確認 */}
          <Text style={styles.sectionTitle}>錄音前狀態確認</Text>
          <View style={styles.rowItem}>
            <Text style={styles.rowItemText}>☕ 錄音前喝咖啡/茶</Text>
            <Switch value={hasCaffeine} onValueChange={setHasCaffeine} trackColor={{ true: '#0D6EFD' }} />
          </View>

          {/* 症狀確認 */}
          <Text style={styles.sectionTitle}>當前腸胃症狀 (可複選)</Text>
          <View style={styles.chipContainer}>
            {symptomOptions.map(symp => {
              const isSelected = selectedSymptoms.includes(symp);
              return (
                <TouchableOpacity 
                  key={symp} 
                  style={[styles.chip, isSelected && styles.chipSelected]} 
                  onPress={() => toggleSymptom(symp)}
                  activeOpacity={0.7}
                >
                  <Text style={isSelected ? styles.chipTextSelected : styles.chipText}>{symp}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 開始檢測大按鈕 */}
          <View style={{ alignItems: 'center', marginTop: 30, marginBottom: 20 }}>
            <TouchableOpacity 
              style={[
                styles.recordButton, 
                !selectedPatientId && styles.recordButtonDisabled
              ]}
              onPress={handleRecordPress}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>開始檢測</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* 病患選擇器 Modal */}
      <Modal
        visible={isPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>選擇病患</Text>
              <TouchableOpacity onPress={() => setIsPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={patients}
              keyExtractor={(item: Patient) => item.id}
              renderItem={({ item }: { item: Patient }) => {
                const isSelected = selectedPatientId === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.patientItem,
                      isSelected && styles.patientItemSelected
                    ]}
                    onPress={() => {
                      setSelectedPatientId(item.id);
                      setIsPickerVisible(false);
                    }}
                  >
                    <View style={styles.patientItemInfo}>
                      <Text style={[
                        styles.patientItemName,
                        isSelected && styles.patientItemTextSelected
                      ]}>
                        {item.name}
                      </Text>
                      <Text style={[
                        styles.patientItemDetails,
                        isSelected && styles.patientItemTextSelected
                      ]}>
                        {item.id} • {item.gender === 'M' ? '男' : '女'} • {item.age}歲
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#0D6EFD" />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>無病患資料，請先新增病患</Text>
                </View>
              }
              contentContainerStyle={{ paddingVertical: 10 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}