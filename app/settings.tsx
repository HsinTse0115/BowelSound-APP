// app/settings.tsx
import React, { useState, useEffect } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';
import { styles } from '../styles/settings.styles';
import { apiRequest, normalizeApiUrl } from '../services/api';

/**
 * 系統設定頁面元件
 * 
 * 此頁面提供使用者配置系統參數，包含：
 * 1. API 伺服器網址連線設定
 * 2. 預設錄音時長選擇
 * 3. 模擬腸音探頭藍牙連線狀態切換
 * 4. 顯示唯讀系統資訊
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useApp();
  const isDark = settings.themeMode === 'dark';

  // API 網址的本地輸入狀態，當使用者點選儲存時才同步至全域 Context
  const [localApiUrl, setLocalApiUrl] = useState(settings.apiUrl);
  // 控制是否顯示「儲存成功」的提示文字
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // 當全域設定的 API 網址改變時（例如初始化），同步更新本地輸入狀態
  useEffect(() => {
    setLocalApiUrl(settings.apiUrl);
  }, [settings.apiUrl]);

  /**
   * 處理 API 伺服器網址儲存
   */
  const handleSaveApiUrl = () => {
    let normalized: string;
    try {
      normalized = normalizeApiUrl(localApiUrl);
    } catch (error) {
      Alert.alert('網址格式錯誤', error instanceof Error ? error.message : '請檢查 API 網址');
      return;
    }
    setLocalApiUrl(normalized);
    updateSettings({ apiUrl: normalized });
    setShowSavedFeedback(true);
    
    // 2 秒後自動隱藏儲存成功提示
    const timer = setTimeout(() => {
      setShowSavedFeedback(false);
    }, 2000);

    return () => clearTimeout(timer);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const normalized = normalizeApiUrl(localApiUrl);
      const response = await apiRequest(normalized, '/api/health', {}, 5000);
      if (!response.ok) throw new Error(`伺服器回應 ${response.status}`);
      Alert.alert('連線成功', 'API 伺服器可以正常存取');
    } catch (error) {
      Alert.alert('連線失敗', error instanceof Error ? error.message : '請確認網址與網路狀態');
    } finally {
      setIsTestingConnection(false);
    }
  };

  /**
   * 處理預設錄音時長變更
   * @param duration 錄音秒數（0 代表不限）
   */
  const handleDurationSelect = (duration: number) => {
    updateSettings({ defaultDuration: duration });
  };

  /**
   * 處理模擬腸音探頭連線狀態切換
   * @param value true 表示已連線，false 表示未連線
   */
  const handleHardwareToggle = (value: boolean) => {
    updateSettings({ hardwareConnected: value });
  };

  const handleThemeChange = (themeMode: 'light' | 'dark') => {
    updateSettings({ themeMode });
  };

  // 定義時長選項與其對應的顯示文字
  const durationOptions = [
    { label: '10 秒', value: 10 },
    { label: '30 秒', value: 30 },
    { label: '60 秒', value: 60 },
    { label: '不限', value: 0 },
  ];

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* 頂部導覽列 */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={isDark ? '#EEF2F5' : '#1E293B'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textPrimaryDark]}>系統設定</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. API 連線設定 */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#E8F4FD' }]}>
              <Ionicons name="globe-outline" size={20} color="#0D6EFD" />
            </View>
            <Text style={[styles.sectionTitle, isDark && styles.textPrimaryDark]}>API 連線設定</Text>
          </View>
          
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={localApiUrl}
              onChangeText={setLocalApiUrl}
              placeholder="請輸入 API 伺服器網址"
              placeholderTextColor="#94A3B8"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSaveApiUrl}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>儲存</Text>
            </TouchableOpacity>
          </View>
          
          {showSavedFeedback && (
            <View style={styles.savedFeedback}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '600' }}>設定已成功儲存</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.testButton, isTestingConnection && styles.testButtonDisabled]}
            onPress={handleTestConnection}
            disabled={isTestingConnection}
            activeOpacity={0.75}
          >
            <Ionicons name="pulse-outline" size={18} color="#1478F2" />
            <Text style={styles.testButtonText}>{isTestingConnection ? '測試中…' : '測試 API 連線'}</Text>
          </TouchableOpacity>
        </View>

        {/* 2. 錄音時長設定 */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="time-outline" size={20} color="#8B5CF6" />
            </View>
            <Text style={[styles.sectionTitle, isDark && styles.textPrimaryDark]}>預設錄音時長</Text>
          </View>
          
          <View style={styles.buttonGroup}>
            {durationOptions.map((option) => {
              const isActive = settings.defaultDuration === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.durationBtn, isActive && styles.durationBtnActive]}
                  onPress={() => handleDurationSelect(option.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.durationBtnText, isActive && styles.durationBtnTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. 探頭連線模擬 */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#E6F8F3' }]}>
              <Ionicons name="radio-outline" size={20} color="#10B981" />
            </View>
            <Text style={[styles.sectionTitle, isDark && styles.textPrimaryDark]}>感測器硬體模擬</Text>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={[styles.switchLabel, isDark && styles.textPrimaryDark]}>模擬腸音探頭連線</Text>
              <View style={[
                styles.statusBadge, 
                settings.hardwareConnected ? styles.statusBadgeConnected : styles.statusBadgeDisconnected
              ]}>
                <Text style={
                  settings.hardwareConnected ? styles.statusBadgeTextConnected : styles.statusBadgeTextDisconnected
                }>
                  {settings.hardwareConnected ? '已連線' : '未連線'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.hardwareConnected}
              onValueChange={handleHardwareToggle}
              trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
              thumbColor={settings.hardwareConnected ? '#10B981' : '#F1F5F9'}
              ios_backgroundColor="#CBD5E1"
            />
          </View>
        </View>

        {/* 4. 系統資訊面板 */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="contrast-outline" size={20} color="#5267C9" />
            </View>
            <Text style={[styles.sectionTitle, isDark && styles.textPrimaryDark]}>介面外觀</Text>
          </View>
          <View style={styles.themeGroup}>
            {([
              { value: 'light', label: 'Light', icon: 'sunny-outline' },
              { value: 'dark', label: 'Dark', icon: 'moon-outline' },
            ] as const).map(option => {
              const selected = settings.themeMode === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.themeButton, isDark && styles.themeButtonDark, selected && styles.themeButtonSelected]}
                  onPress={() => handleThemeChange(option.value)}
                >
                  <Ionicons name={option.icon} size={19} color={selected ? '#FFFFFF' : '#64748B'} />
                  <Text style={[styles.themeButtonText, selected && styles.themeButtonTextSelected]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. 系統資訊面板 */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
            </View>
            <Text style={[styles.sectionTitle, isDark && styles.textPrimaryDark]}>系統資訊</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, isDark && styles.textSecondaryDark]}>App 版本號</Text>
            <Text style={[styles.infoVal, isDark && styles.textPrimaryDark]}>v1.0.0</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, isDark && styles.textSecondaryDark]}>AI 模型版本號</Text>
            <Text style={[styles.infoVal, isDark && styles.textPrimaryDark]}>Edge-BowelSound-v1.2</Text>
          </View>

          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={[styles.infoKey, isDark && styles.textSecondaryDark]}>系統運行環境</Text>
            <Text style={[styles.infoVal, isDark && styles.textPrimaryDark]}>React Native / Expo Go</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
