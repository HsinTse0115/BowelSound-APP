// app/index.tsx
import React from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  View, 
  Image, 
  useWindowDimensions 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { styles } from '../styles/welcome.styles';

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTabletOrWeb = width >= 768;

  // 根據螢幕尺寸調整圖片大小
  const imageSize = isTabletOrWeb ? 340 : 240;

  const handleEnterApp = () => {
    // 進入主系統 (Tab 導覽)
    router.replace('/(tabs)' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 隱藏預設導覽列 */}
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View 
          style={[
            styles.responsiveWrapper, 
            isTabletOrWeb ? styles.horizontalContainer : styles.verticalContainer
          ]}
        >
          {/* 左半部 / 上半部：聽診器硬體圖片 */}
          <View 
            style={[
              styles.imageSection, 
              isTabletOrWeb ? styles.imageSectionHorizontal : styles.imageSectionVertical
            ]}
          >
            <View style={styles.imageContainer}>
              <Image
                source={require('../assets/images/stethoscope.jpg')}
                style={[
                  styles.hardwareImage,
                  { width: imageSize, height: imageSize }
                ]}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* 右半部 / 下半部：產品文字介紹與功能特色 */}
          <View 
            style={[
              styles.textSection, 
              isTabletOrWeb ? styles.textSectionHorizontal : styles.textSectionVertical
            ]}
          >
            {/* 品牌標籤 */}
            <View style={styles.brandBadge}>
              <Ionicons name="wifi-outline" size={14} color="#0D6EFD" />
              <Text style={styles.brandBadgeText}>📡 EDGE AI SYSTEM READY</Text>
            </View>

            {/* 標題與副標 */}
            <Text style={styles.appTitle}>BowelSound™</Text>
            <Text style={styles.tagline}>數位雙向腸音聽診監測系統</Text>
            <Text style={styles.introText}>
              專為臨床腸道功能監測設計的智慧分析平台。透過高感度物理聲學聽診器與邊緣端卷積神經網路 (CNN)，即時擷取並診斷消化道之低頻蠕動信號，輔助醫護人員早期評估腸胃健康狀態。
            </Text>

            {/* 系統特點清單 */}
            <View style={styles.featuresContainer}>
              {/* 特色 1 */}
              <View style={styles.featureCard}>
                <View style={[styles.iconBox, { backgroundColor: '#E8F4FD' }]}>
                  <Ionicons name="mic-outline" size={24} color="#0D6EFD" />
                </View>
                <View style={styles.featureTextContent}>
                  <Text style={styles.featureTitle}>高精密聲學硬體探頭</Text>
                  <Text style={styles.featureDesc}>
                    專業過濾高頻環境雜訊，精準捕捉 20-500Hz 消化道內微弱的蠕動咕嚕聲與水流聲。
                  </Text>
                </View>
              </View>

              {/* 特色 2 */}
              <View style={styles.featureCard}>
                <View style={[styles.iconBox, { backgroundColor: '#E6F8F3' }]}>
                  <Ionicons name="hardware-chip-outline" size={24} color="#10B981" />
                </View>
                <View style={styles.featureTextContent}>
                  <Text style={styles.featureTitle}>邊緣端 AI 診斷 (正常/異常)</Text>
                  <Text style={styles.featureDesc}>
                    內建卷積網路，以蠕動亢進、蠕動低下、腸胃無蠕動及音頻特徵為基準，無延遲判讀結果。
                  </Text>
                </View>
              </View>

              {/* 特色 3 */}
              <View style={styles.featureCard}>
                <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="git-compare-outline" size={24} color="#8B5CF6" />
                </View>
                <View style={styles.featureTextContent}>
                  <Text style={styles.featureTitle}>多重生理與環境對照</Text>
                  <Text style={styles.featureDesc}>
                    智慧綁定飯後時間、症狀及喝咖啡狀態，搭配小於 50dB 之環境音量安全防錯監測。
                  </Text>
                </View>
              </View>
            </View>

            {/* 進入系統按鈕 */}
            <View style={styles.buttonSection}>
              <TouchableOpacity 
                style={styles.ctaButton} 
                onPress={handleEnterApp}
                activeOpacity={0.8}
              >
                <Text style={styles.ctaButtonText}>進入監測系統</Text>
                <Ionicons name="arrow-forward-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              
              {!isTabletOrWeb && (
                <View style={styles.scrollHint}>
                  <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                  <Text style={styles.scrollHintText}>向下滾動瀏覽更多</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
