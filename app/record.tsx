import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, Modal, FlatList, Alert, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router'; // 匯入路由功能
import { Ionicons } from '@expo/vector-icons'; // 匯入圖示套件

import { styles } from '../styles/record.styles';
import { useApp, Patient } from '../context/AppContext';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { apiRequest } from '../services/api';

/**
 * RecordScreen 元件：負責即時採集腸音信號的頁面。
 * 包含選擇病患、動態波形模擬、自動/手動停止錄音及儲存功能。
 */
export default function RecordScreen() {
  const router = useRouter();
  const { patients, settings, addRecord } = useApp();
  const isDark = settings.themeMode === 'dark';

  // 狀態管理
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0); // 記錄錄音的總秒數
  const [hasCaffeine, setHasCaffeine] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [micPermission, setMicPermission] = useState('已授權'); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [envVolume, setEnvVolume] = useState(35); // 單位為 dB
  const [mealTime, setMealTime] = useState('空腹');

  const symptomOptions = ['無症狀', '脹氣', '腹痛', '便秘', '腹瀉'];
  const mealTimeOptions = ['空腹', '飯後1小時內', '飯後1-2小時', '飯後2小時以上'];

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

    // 呼叫 AppContext 中的 addRecord 儲存資料，包含咖啡因、腸胃症狀、飯後時間與環境分貝
    const newRecord = addRecord(selectedPatientId, duration, hasCaffeine, selectedSymptoms, mealTime, envVolume);

    // 重置錄音前狀態
    setHasCaffeine(false);
    setSelectedSymptoms([]);

    // 跳出成功提示對話框，引引導用戶進行下一步操作
    Alert.alert(
      '腸音採集已儲存！',
      'AI 分析已生成',
      [
        {
          text: '返回首頁',
          onPress: () => router.replace('/(tabs)' as never),
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
  }, [selectedPatientId, seconds, addRecord, router, hasCaffeine, selectedSymptoms, mealTime, envVolume]);

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

  // 模擬環境音量微幅起伏 (可高達 55 dB，模擬環境音量警示)
  useEffect(() => {
    if (!isRecording) {
      const interval = setInterval(() => {
        setEnvVolume(prev => {
          // 80% 機率微調，20% 機率較大波動
          const isLarge = Math.random() < 0.2;
          const range = isLarge ? 9 : 3;
          const offset = isLarge ? 4 : 1;
          const change = Math.floor(Math.random() * range) - offset;
          const next = prev + change;
          // 限制分貝在 30 ~ 55 dB 區間
          return Math.max(30, Math.min(55, next));
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  // ==================== 預留後端 API 串接範例 ====================
  /**
   * 範例函數：上傳腸音音訊檔與生理數據至後端，並取得 AI 診斷 JSON
   * @param audioUri 音訊檔案本地 URI 路徑
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const uploadBowelRecordAndAnalyze = async (audioUri: string) => {
    try {
      // 1. 建立 Multipart 表單 (對應系統架構圖: 1. 上傳音訊 + 飲食狀態 + 個資參數)
      const formData = new FormData();
      
      // 加入二進位音訊檔案
      formData.append('audio', {
        uri: audioUri,
        name: 'bowel_sound.wav',
        type: 'audio/wav',
      } as any);

      // 加入錄音前問卷參數 (狀態紀錄表單)
      formData.append('patientId', selectedPatientId || '');
      formData.append('hasCaffeine', String(hasCaffeine));
      formData.append('symptoms', JSON.stringify(selectedSymptoms));
      formData.append('duration', String(seconds));
      formData.append('mealTime', mealTime);
      formData.append('decibelLevel', String(envVolume));
      
      // 病患識別資料可由目前選取的 patient 一併打包上傳
      formData.append('patientName', selectedPatient?.name || '');

      // 2. 發送 API 請求
      const response = await apiRequest(settings.apiUrl, '/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) throw new Error('後端 AI 模型辨識失敗');
      
      // 3. 讀取回傳結果 (對應系統架構圖: 6. 回傳 AI 辨識結果 JSON)
      const result = await response.json();
      console.log('AI 診斷回傳資料:', result);

      // 4. 更新前端狀態 (範例說明如何使用 set 函式更新)
      // 例如：將回傳結果寫入全域/本地 State 以在 UI 進行圖表與報告的更新
      
    } catch (error) {
      console.error('上傳腸音至後端時發生錯誤:', error);
    }
  };
  // =============================================================

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
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        {/* 返回上一頁按鈕 */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={isDark ? '#EEF2F5' : '#1E293B'} />
        </TouchableOpacity>
        
        {/* 標題區塊 */}
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, isDark && styles.textPrimaryDark]}>腸音檢測系統</Text>
          {selectedPatient ? (
            <Text style={[styles.subTitle, isDark && styles.textSecondaryDark]}>當前受測者: {selectedPatient.name} ({selectedPatient.id})</Text>
          ) : (
          <Text style={[styles.subTitle, isDark && styles.textSecondaryDark]}>請先選擇受測者</Text>
          )}
        </View>
      </View>

      {isRecording ? (
        <View style={styles.mainContent}>
          {/* 腸音波形模擬顯示區域 */}
          <View style={styles.waveformBox}>
            {/* 動態波形模擬元件 */}
            <WaveformVisualizer isRecording={isRecording} />
            <Text style={styles.statusText}>正在接收訊號…</Text>
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
        <ScrollView style={isDark && styles.containerDark} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          {/* 病患選擇器 */}
          <Text style={[styles.sectionTitle, isDark && styles.textPrimaryDark]}>受測者</Text>
          <TouchableOpacity 
            style={[styles.patientSelector, isDark && styles.surfaceDark]}
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
                <Text style={[styles.patientSelectorText, isDark && styles.textPrimaryDark]}>
                  {selectedPatient.id} - {selectedPatient.name} ({selectedPatient.gender === 'M' ? '男' : '女'}, {selectedPatient.age}歲)
                </Text>
              ) : (
                <Text style={[styles.patientSelectorPlaceholder, isDark && styles.textSecondaryDark]}>點擊此處選擇受測者...</Text>
              )}
            </View>
            <Ionicons name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>

          {/* 環境與麥克風狀態 */}
          <View style={[styles.statusBox, (envVolume >= 50 || !settings.hardwareConnected) && styles.statusBoxWarning]}>
            <View style={styles.statusLine}>
              <Ionicons name="mic-outline" size={18} color={micPermission === '已授權' ? '#1478F2' : '#D95D5D'} />
              <Text style={[styles.statusBoxText, micPermission !== '已授權' && styles.statusBoxWarningText]}>
                麥克風權限：{micPermission === '已授權' ? '已授權' : '未授權'}
              </Text>
            </View>
            <View style={styles.statusLine}>
              <Ionicons name="volume-medium-outline" size={18} color={envVolume >= 50 ? '#D95D5D' : '#1478F2'} />
              <Text style={[styles.statusBoxText, envVolume >= 50 && styles.statusBoxWarningText]}>
                當前環境音量：{envVolume} dB
              </Text>
            </View>
            <View style={styles.statusLine}>
              <Ionicons name="radio-outline" size={18} color={settings.hardwareConnected ? '#2DA66F' : '#D95D5D'} />
              <Text style={[styles.statusBoxText, !settings.hardwareConnected && styles.statusBoxWarningText]}>
                感測器：{settings.hardwareConnected ? '已連線' : '未連線'}
              </Text>
            </View>
          </View>

          {!settings.hardwareConnected && (
            <TouchableOpacity style={styles.connectionAlert} onPress={() => router.push('/settings' as never)}>
              <Ionicons name="information-circle-outline" size={20} color="#B5472F" />
              <Text style={styles.connectionAlertText}>請先連接腸音感測器</Text>
              <Ionicons name="chevron-forward" size={18} color="#B5472F" />
            </TouchableOpacity>
          )}

          {envVolume >= 50 && (
            <View style={styles.warningAlertBox}>
              <Ionicons name="warning" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.warningAlertText}>環境音量過高（≥ 50 dB），請移至安靜處以確保量測品質</Text>
            </View>
          )}

          {/* 狀態確認 */}
          <Text style={[styles.sectionTitle, isDark && styles.textPrimaryDark]}>錄音前狀態確認</Text>
          <View style={[styles.rowItem, isDark && styles.rowItemDark]}>
            <Text style={[styles.rowItemText, isDark && styles.textPrimaryDark]}>錄音前喝咖啡或茶</Text>
            <Switch value={hasCaffeine} onValueChange={setHasCaffeine} trackColor={{ true: '#0D6EFD' }} />
          </View>

          {/* 飯後時間確認 */}
          <Text style={[styles.sectionTitle, isDark && styles.textPrimaryDark]}>飯後時間</Text>
          <View style={styles.chipContainer}>
            {mealTimeOptions.map(option => {
              const isSelected = mealTime === option;
              return (
                <TouchableOpacity 
                  key={option} 
                  style={[styles.chip, isDark && styles.chipDark, isSelected && styles.chipSelected]}
                  onPress={() => setMealTime(option)}
                  activeOpacity={0.7}
                >
                  <Text style={isSelected ? styles.chipTextSelected : [styles.chipText, isDark && styles.textSecondaryDark]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 症狀確認 */}
          <Text style={[styles.sectionTitle, isDark && styles.textPrimaryDark]}>當前腸胃症狀 (可複選)</Text>
          <View style={styles.chipContainer}>
            {symptomOptions.map(symp => {
              const isSelected = selectedSymptoms.includes(symp);
              return (
                <TouchableOpacity 
                  key={symp} 
                  style={[styles.chip, isDark && styles.chipDark, isSelected && styles.chipSelected]}
                  onPress={() => toggleSymptom(symp)}
                  activeOpacity={0.7}
                >
                  <Text style={isSelected ? styles.chipTextSelected : [styles.chipText, isDark && styles.textSecondaryDark]}>{symp}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 開始檢測大按鈕 */}
          <View style={{ alignItems: 'center', marginTop: 30, marginBottom: 20 }}>
            <TouchableOpacity 
              style={[
                styles.recordButton, 
                (!selectedPatientId || envVolume >= 50 || !settings.hardwareConnected) && styles.recordButtonDisabled
              ]}
              onPress={handleRecordPress}
              disabled={!selectedPatientId || envVolume >= 50 || !settings.hardwareConnected}
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
              <Text style={styles.modalTitle}>選擇受測者</Text>
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
