import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '../../context/AppContext';
import { styles } from '../../styles/home.styles';

const ACTIONS = [
  { title: '受測者管理', description: '一般受測者與病患資料', icon: 'people-outline', route: '/patients' },
  { title: '檢測分析', description: '查看波形、頻譜與判讀結果', icon: 'analytics-outline', route: '/analytics' },
  { title: '衛教資訊', description: '腸道照護與飲食建議', icon: 'book-outline', route: '/education' },
  { title: '系統設定', description: '感測器、時長與連線設定', icon: 'settings-outline', route: '/settings' },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { settings, patients, records } = useApp();
  const isDark = settings.themeMode === 'dark';
  const latestRecord = [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.textPrimaryDark]}>BowelSound</Text>
            <Text style={[styles.headerSubtitle, isDark && styles.textSecondaryDark]}>腸音檢測系統</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="受測者管理"
            onPress={() => router.push('/patients' as never)}
            style={({ pressed }) => [styles.profileButton, isDark && styles.surfaceDark, pressed && styles.pressed]}>
            <Ionicons name="person-outline" size={22} color={isDark ? '#E8EDF2' : '#26364A'} />
          </Pressable>
        </View>

        <View style={[styles.deviceCard, isDark && styles.surfaceDark]}>
          <View style={styles.deviceHeader}>
            <View style={[styles.statusDot, settings.hardwareConnected && styles.statusDotConnected]} />
            <Text style={[styles.deviceTitle, isDark && styles.textPrimaryDark]}>
              {settings.hardwareConnected ? '腸音感測器已連線' : '腸音感測器尚未連線'}
            </Text>
          </View>
          <Text style={[styles.deviceDescription, isDark && styles.textSecondaryDark]}>
            {settings.hardwareConnected
              ? '設備已就緒，可以開始新的腸音檢測。'
              : '請先至系統設定連接感測器，再開始檢測。'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push((settings.hardwareConnected ? '/record' : '/settings') as never)}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Ionicons name={settings.hardwareConnected ? 'mic-outline' : 'radio-outline'} size={21} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {settings.hardwareConnected ? '開始檢測' : '前往連接感測器'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.overviewRow, isDark && styles.surfaceDark]}>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, isDark && styles.textPrimaryDark]}>{patients.length}</Text>
            <Text style={[styles.overviewLabel, isDark && styles.textSecondaryDark]}>受測者</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, isDark && styles.textPrimaryDark]}>{records.length}</Text>
            <Text style={[styles.overviewLabel, isDark && styles.textSecondaryDark]}>檢測紀錄</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, isDark && styles.textPrimaryDark]}>
              {latestRecord ? (latestRecord.aiResult.status === 'normal' ? '正常' : '注意') : '--'}
            </Text>
            <Text style={[styles.overviewLabel, isDark && styles.textSecondaryDark]}>最近判讀</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, isDark && styles.textPrimaryDark]}>功能</Text>
        <View style={[styles.actionList, isDark && styles.surfaceDark]}>
          {ACTIONS.map((item) => (
            <Pressable
              key={item.title}
              accessibilityRole="button"
              onPress={() => router.push(item.route as never)}
              style={({ pressed }) => [styles.actionRow, isDark && styles.actionRowDark, pressed && styles.pressed]}>
              <View style={[styles.actionIcon, isDark && styles.actionIconDark]}>
                <Ionicons name={item.icon} size={22} color={isDark ? '#69A9F7' : '#1478F2'} />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, isDark && styles.textPrimaryDark]}>{item.title}</Text>
                <Text style={[styles.actionDescription, isDark && styles.textSecondaryDark]}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A1ACB9" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
