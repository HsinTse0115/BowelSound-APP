// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useApp } from '../../context/AppContext';
// 引入剛剛寫好的樣式
import { styles } from '../../styles/home.styles';

export default function HomeScreen() {
  const router = useRouter();
  const { settings } = useApp();
  const isConnected = settings.hardwareConnected;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 頂部歡迎區塊 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>腸音檢測系統</Text>
            <Text style={styles.welcomeText}>臨床監測儀表板</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="medical" size={24} color="#0D6EFD" />
          </View>
        </View>

        {/* 2x2 網格功能選單 */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/record')} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8F4FD' }]}>
              <Ionicons name="mic" size={32} color="#0D6EFD" />
            </View>
            <Text style={styles.menuTitle}>即時採集</Text>
            <Text style={styles.menuDesc}>AI 即時推論與收音</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/patients')} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: '#E6F8F3' }]}>
              <Ionicons name="people" size={32} color="#10B981" />
            </View>
            <Text style={styles.menuTitle}>病患管理</Text>
            <Text style={styles.menuDesc}>建立與管理病歷</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/analytics')} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="analytics" size={32} color="#8B5CF6" />
            </View>
            <Text style={styles.menuTitle}>視覺化分析</Text>
            <Text style={styles.menuDesc}>頻譜與趨勢變化</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/settings')} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="settings" size={32} color="#6B7280" />
            </View>
            <Text style={styles.menuTitle}>系統設定</Text>
            <Text style={styles.menuDesc}>硬體連線與參數</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/profile' as any)} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFF9E6' }]}>
              <Ionicons name="person" size={32} color="#F59E0B" />
            </View>
            <Text style={styles.menuTitle}>個人資料</Text>
            <Text style={styles.menuDesc}>受試者基本資料設定</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/education' as any)} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: '#EBF7FF' }]}>
              <Ionicons name="book" size={32} color="#0284C7" />
            </View>
            <Text style={styles.menuTitle}>衛教資訊</Text>
            <Text style={styles.menuDesc}>腸道保健與飲食指引</Text>
          </TouchableOpacity>
        </View>

        {/* 底部系統狀態提示區塊 */}
        <View style={isConnected ? styles.infoBannerConnected : styles.infoBanner}>
          <Ionicons 
            name={isConnected ? "checkmark-circle" : "information-circle"} 
            size={24} 
            color={isConnected ? "#10B981" : "#0D6EFD"} 
          />
          <View style={styles.infoTextContainer}>
            <Text style={isConnected ? styles.infoTitleConnected : styles.infoTitle}>
              {isConnected ? "感測器已連線" : "系統狀態正常"}
            </Text>
            <Text style={styles.infoDesc}>
              {isConnected ? "感測器已連線，信號接收就緒" : "邊緣運算模型與連線模組待命中"}
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}