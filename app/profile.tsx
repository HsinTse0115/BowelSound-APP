import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, saveUserProfile } = useApp();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | ''>('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const medsOptions = ['無特殊病史', '腸躁症', '糖尿病', '胃食道逆流'];

  // 當載入完成或全域 profile 變更時，僅初始化一次表單資料，避免打字時被覆蓋卡死
  useEffect(() => {
    if (userProfile && !isInitialized) {
      setName(userProfile.name || '');
      setAge(userProfile.age || '');
      setGender(userProfile.gender || '');
      setHeight(userProfile.height || '');
      setWeight(userProfile.weight || '');
      setSelectedMeds(userProfile.selectedMeds || []);
      setIsInitialized(true);
    }
  }, [userProfile, isInitialized]);

  const toggleMed = (med: string) => {
    setSelectedMeds(prev => {
      if (med === '無特殊病史') {
        return prev.includes('無特殊病史') ? [] : ['無特殊病史'];
      } else {
        const filtered = prev.filter(m => m !== '無特殊病史');
        return filtered.includes(med) ? filtered.filter(m => m !== med) : [...filtered, med];
      }
    });
  };

  const bmi = (height && weight && parseFloat(height) > 0)
    ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)
    : '--';

  // ==================== 預留後端 API 串接範例 ====================
  /**
   * 範例函數：自後端 API 獲取受試者個資
   * @param subjectCode 受試者代號或暱稱
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchProfileFromBackend = async (subjectCode: string) => {
    try {
      // 串接設定檔中的後端 API URL
      const response = await fetch(`http://localhost:8000/api/profile/${subjectCode}`);
      if (!response.ok) throw new Error('無法取得個人資料');
      
      const data = await response.json();
      
      // 使用 set 函式將 API 回傳值更新至動態變數狀態 (State)
      setName(data.name || '');
      setAge(data.age?.toString() || '');
      setGender(data.gender || '');
      setHeight(data.height?.toString() || '');
      setWeight(data.weight?.toString() || '');
      setSelectedMeds(data.selectedMeds || []);
      
      console.log('後端個資同步成功');
    } catch (error) {
      console.error('後端 API 獲取資料發生錯誤:', error);
    }
  };

  /**
   * 範例函數：將個人資料上傳儲存至後端資料庫
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const uploadProfileToBackend = async () => {
    try {
      const payload = {
        name: name.trim(),
        age: age.trim() ? parseInt(age) : null,
        gender: gender || null,
        height: height.trim() ? parseFloat(height) : null,
        weight: weight.trim() ? parseFloat(weight) : null,
        selectedMeds: selectedMeds,
      };

      const response = await fetch('http://localhost:8000/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('資料上傳後端失敗');
      
      const result = await response.json();
      console.log('上傳成功，後端回覆結果:', result);
    } catch (error) {
      console.error('上傳個人資料至後端發生錯誤:', error);
    }
  };
  // =============================================================

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '請輸入受試者代號或暱稱');
      return;
    }

    try {
      // 1. 同步儲存至本機資料庫 (AsyncStorage)
      await saveUserProfile({
        name: name.trim(),
        age: age.trim(),
        gender: gender,
        height: height.trim(),
        weight: weight.trim(),
        selectedMeds,
      });
      setIsInitialized(false);

      // 2. 預留：可在此處同時呼叫 uploadProfileToBackend() 同步至後端伺服器
      // await uploadProfileToBackend();

      Alert.alert('儲存成功', '個人資料已妥善儲存至本機儲存空間。', [
        { text: '確定', onPress: () => router.back() }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('錯誤', '儲存個人資料時發生異常');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>受試者個人資料</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 基本資料卡片 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>基本資料</Text>
          <Text style={styles.label}>受試者代號 / 暱稱</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="請輸入暱稱或代號"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={[styles.row, { marginTop: 12 }]}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.label}>年齡</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="例如: 25"
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>性別</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'M' && styles.genderButtonActive]}
                  onPress={() => setGender('M')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderButtonText, gender === 'M' && styles.genderButtonTextActive]}>男</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'F' && styles.genderButtonActive]}
                  onPress={() => setGender('F')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderButtonText, gender === 'F' && styles.genderButtonTextActive]}>女</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* 體質指標卡片 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>體質指標</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.label}>身高 (cm)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="例如: 175"
                  keyboardType="numeric"
                  value={height}
                  onChangeText={setHeight}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>體重 (kg)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="例如: 65"
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>

          <View style={styles.bmiContainer}>
            <Text style={styles.bmiLabel}>自動計算 BMI 數值</Text>
            <Text style={styles.bmiValue}>{bmi}</Text>
          </View>
        </View>

        {/* 病史卡片 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>病史與用藥 (可複選)</Text>
          <View style={styles.chipContainer}>
            {medsOptions.map(med => {
              const isSelected = selectedMeds.includes(med);
              return (
                <TouchableOpacity
                  key={med}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleMed(med)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {med}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 儲存按鈕 */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.saveBtnText}>儲存個人資料</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bmiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bmiLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  bmiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D6EFD',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
    backgroundColor: '#F8FAFC',
  },
  chipSelected: {
    backgroundColor: '#E8F4FD',
    borderColor: '#0D6EFD',
  },
  chipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#0D6EFD',
    fontWeight: '700',
  },
  genderContainer: {
    flexDirection: 'row',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#E8F4FD',
  },
  genderButtonText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: '#0D6EFD',
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#0D6EFD',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#0D6EFD',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
