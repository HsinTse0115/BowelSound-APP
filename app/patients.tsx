import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '@/context/AppContext';
import { styles } from '@/styles/patients.styles';

/**
 * 格式化 ISO 8601 時間字串為 YYYY/MM/DD HH:mm
 * @param isoString ISO 時間字串
 * @returns 格式化後的日期時間字串
 */
const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
  } catch {
    return isoString;
  }
};

/**
 * AI 診斷結果狀態與顯示資訊對照表
 */
const STATUS_MAP = {
  normal: {
    label: '正常',
    tagStyle: styles.statusTagNormal,
    textStyle: styles.statusTagTextNormal,
  },
  abnormal: {
    label: '異常',
    tagStyle: styles.statusTagHyper,
    textStyle: styles.statusTagTextHyper,
  },
};

/**
 * 病患管理頁面元件 (app/patients.tsx)
 * 提供病患列表展示、即時關鍵字搜尋、病患新增與歷史腸音檢測紀錄展開功能。
 */
export default function PatientsScreen() {
  const router = useRouter();
  const { patients, records, addPatient } = useApp();

  // 搜尋與篩選狀態
  const [searchQuery, setSearchQuery] = useState('');
  
  // 展開病患卡片的 ID
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 新增病患 Modal 顯示狀態與表單欄位狀態
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [bedNumber, setBedNumber] = useState('');
  const [note, setNote] = useState('');

  // 表單驗證錯誤訊息狀態
  const [nameError, setNameError] = useState('');
  const [ageError, setAgeError] = useState('');

  // 點擊病患卡片展開或收合
  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // 即時搜尋過濾後的病患清單
  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
    );
  }, [patients, searchQuery]);

  // 表單送出處理
  const handleSubmit = () => {
    let hasError = false;

    // 驗證姓名
    if (!name.trim()) {
      setNameError('請輸入病患姓名');
      hasError = true;
    } else {
      setNameError('');
    }

    // 驗證年齡
    const ageNum = parseInt(age, 10);
    if (!age) {
      setAgeError('請輸入年齡');
      hasError = true;
    } else if (isNaN(ageNum) || ageNum <= 0) {
      setAgeError('年齡必須是大於 0 的整數');
      hasError = true;
    } else {
      setAgeError('');
    }

    if (hasError) return;

    // 呼叫 context 中的 addPatient 進行全域狀態更新
    addPatient({
      name: name.trim(),
      age: ageNum,
      gender,
      bedNumber: bedNumber.trim() || undefined,
      note: note.trim() || undefined,
    });

    // 預留：將新增病患資料上傳至後端伺服器
    // uploadPatientToBackend({ name: name.trim(), age: ageNum, gender, bedNumber: bedNumber.trim(), note: note.trim() });

    // 重置表單狀態並關閉彈窗
    setName('');
    setAge('');
    setGender('M');
    setBedNumber('');
    setNote('');
    setNameError('');
    setAgeError('');
    setModalVisible(false);
  };

  // ==================== 預留後端 API 串接範例 ====================
  /**
   * 範例：從後端 API 獲取最新的病患列表，並更新本地資料
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchPatientsFromBackend = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/patients');
      if (!response.ok) throw new Error('取得病患列表失敗');
      const data = await response.json();
      console.log('取得後端病患資料成功:', data);
    } catch (error) {
      console.error('後端 API 讀取發生錯誤:', error);
    }
  };

  /**
   * 範例：將新新增的病患資料以 POST 請求提交給後端
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const uploadPatientToBackend = async (patientData: {
    name: string;
    age: number;
    gender: 'M' | 'F';
    bedNumber?: string;
    note?: string;
  }) => {
    try {
      const response = await fetch('http://localhost:8000/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });
      if (!response.ok) throw new Error('新增病患上傳失敗');
      const result = await response.json();
      console.log('後端病患新增成功:', result);
    } catch (error) {
      console.error('後端 API 提交發生錯誤:', error);
    }
  };
  // =============================================================

  // 取消新增並重置表單狀態
  const handleCancel = () => {
    setName('');
    setAge('');
    setGender('M');
    setBedNumber('');
    setNote('');
    setNameError('');
    setAgeError('');
    setModalVisible(false);
  };

  /**
   * 取得特定病患以時間倒序排列的歷史紀錄
   */
  const getPatientRecords = (patientId: string) => {
    return records
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部標題列 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>病患管理</Text>
        <TouchableOpacity
          style={styles.addHeaderButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="person-add-outline" size={22} color="#0D6EFD" />
        </TouchableOpacity>
      </View>

      {/* 搜尋列 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜尋姓名或病患 ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* 病患列表 */}
      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              {searchQuery ? '無相符的搜尋結果' : '目前尚無病患資料'}
            </Text>
            <Text style={styles.emptySubText}>
              {searchQuery ? '請嘗試其他關鍵字' : '點選右上角或下方按鈕新增病患'}
            </Text>
          </View>
        }
        renderItem={({ item: patient }) => {
          const isExpanded = expandedId === patient.id;
          const patientRecords = getPatientRecords(patient.id);
          const avatarColor = patient.gender === 'M' ? '#0D6EFD' : '#DB2777';
          const firstChar = patient.name.charAt(0);

          return (
            <View style={[styles.patientCard, isExpanded && styles.patientCardActive]}>
              <TouchableOpacity
                style={styles.cardMainRow}
                onPress={() => toggleExpand(patient.id)}
                activeOpacity={0.7}
              >
                {/* 圓形頭像佔位符 */}
                <View style={[styles.avatarContainer, { backgroundColor: avatarColor }]}>
                  <Text style={styles.avatarText}>{firstChar}</Text>
                </View>

                {/* 基本資訊 */}
                <View style={styles.infoContainer}>
                  <View style={styles.nameRow}>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.idText}>{patient.id}</Text>
                  </View>
                  <Text style={styles.demographicsText}>
                    {patient.gender === 'M' ? '男' : '女'} · {patient.age} 歲 · 床號: {patient.bedNumber || '無'}
                  </Text>
                </View>

                {/* 展開/收合圖示 */}
                <View style={styles.expandIcon}>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color="#64748B"
                  />
                </View>
              </TouchableOpacity>

              {/* 展開詳情區域 */}
              {isExpanded && (
                <View style={styles.expandedDetail}>
                  {/* 備註與基本詳情 */}
                  <Text style={styles.detailLabel}>病床號碼</Text>
                  <Text style={styles.noteText}>
                    {patient.bedNumber || '未分配床號'}
                  </Text>

                  <Text style={styles.detailLabel}>臨床備註</Text>
                  <Text style={styles.noteText}>
                    {patient.note || '無臨床備註。'}
                  </Text>

                  <Text style={styles.detailLabel}>建立時間</Text>
                  <Text style={[styles.noteText, { marginBottom: 20 }]}>
                    {formatDate(patient.createdAt)}
                  </Text>

                  {/* 歷史檢測紀錄列表 */}
                  <View style={styles.historySectionHeader}>
                    <Text style={styles.historySectionTitle}>歷史腸音檢測紀錄</Text>
                    <Text style={styles.historyCount}>
                      共 {patientRecords.length} 筆
                    </Text>
                  </View>

                  {patientRecords.length > 0 ? (
                    <View style={styles.recordList}>
                      {patientRecords.map((record) => {
                        const statusInfo = STATUS_MAP[record.aiResult.status] || {
                          label: record.aiResult.status,
                          tagStyle: styles.statusTagNormal,
                          textStyle: styles.statusTagTextNormal,
                        };

                        return (
                          <View key={record.id} style={styles.recordCard}>
                            <View style={styles.recordHeader}>
                              <View style={styles.recordDateRow}>
                                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                                <Text style={styles.recordDate}>
                                  {formatDate(record.createdAt)}
                                </Text>
                              </View>
                              <Text style={styles.recordDuration}>
                                {record.duration} 秒
                              </Text>
                            </View>

                            <View style={styles.recordResultContainer}>
                              <Text style={styles.aiNotes} numberOfLines={2}>
                                {record.aiResult.notes}
                              </Text>
                              
                              <View style={[styles.statusTag, statusInfo.tagStyle]}>
                                <Text style={statusInfo.textStyle}>
                                  {statusInfo.label}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.emptyRecordsText}>暫無歷史採集紀錄</Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      {/* 懸浮新增病患按鈕 (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>新增病患</Text>
      </TouchableOpacity>

      {/* 新增病患對話框 (Modal) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancel}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1, justifyContent: 'flex-end' }}
            >
              <View style={styles.modalContainer}>
                {/* Modal 標頭 */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>新增病患</Text>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={handleCancel}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={22} color="#475569" />
                  </TouchableOpacity>
                </View>

                {/* 表單內容 */}
                <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                  {/* 姓名欄位 */}
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>姓名 *</Text>
                    <TextInput
                      style={[styles.input, nameError ? styles.inputError : null]}
                      placeholder="請輸入病患姓名"
                      placeholderTextColor="#94A3B8"
                      value={name}
                      onChangeText={(val) => {
                        setName(val);
                        if (val.trim()) setNameError('');
                      }}
                      autoCorrect={false}
                    />
                    {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                  </View>

                  {/* 年齡欄位 */}
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>年齡 *</Text>
                    <TextInput
                      style={[styles.input, ageError ? styles.inputError : null]}
                      placeholder="請輸入年齡"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      value={age}
                      onChangeText={(val) => {
                        setAge(val);
                        if (val.trim()) setAgeError('');
                      }}
                    />
                    {ageError ? <Text style={styles.errorText}>{ageError}</Text> : null}
                  </View>

                  {/* 病床號碼欄位 */}
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>病床號碼</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="請輸入病床號碼 (例如: 302-1)"
                      placeholderTextColor="#94A3B8"
                      value={bedNumber}
                      onChangeText={setBedNumber}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                  </View>

                  {/* 性別欄位 */}
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>性別 *</Text>
                    <View style={styles.genderSelector}>
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          gender === 'M' && styles.genderOptionSelectedM,
                        ]}
                        onPress={() => setGender('M')}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.genderOptionText,
                            gender === 'M' && styles.genderOptionTextSelectedM,
                          ]}
                        >
                          男 (Male)
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          gender === 'F' && styles.genderOptionSelectedF,
                        ]}
                        onPress={() => setGender('F')}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.genderOptionText,
                            gender === 'F' && styles.genderOptionTextSelectedF,
                          ]}
                        >
                          女 (Female)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 備註欄位 */}
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>臨床備註</Text>
                    <TextInput
                      style={[styles.input, styles.notesInput]}
                      placeholder="請輸入臨床備註 (如症狀、開刀史等)..."
                      placeholderTextColor="#94A3B8"
                      multiline={true}
                      numberOfLines={4}
                      value={note}
                      onChangeText={setNote}
                    />
                  </View>

                  {/* 按鈕群組 */}
                  <View style={styles.modalButtonsRow}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonCancel]}
                      onPress={handleCancel}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelButtonText}>取消</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonSubmit]}
                      onPress={handleSubmit}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.submitButtonText}>確認送出</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
