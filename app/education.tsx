// app/education.tsx
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { styles } from '../styles/education.styles';

export default function EducationScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sounds' | 'diet'>('sounds');

  return (
    <SafeAreaView style={styles.container}>
      {/* 隱藏 Expo Router 預設導覽列 */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* 自訂頂部導覽列 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>健康衛教資訊</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Tab 切換按鈕組 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'sounds' && styles.activeTab]}
            onPress={() => setActiveTab('sounds')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'sounds' && styles.activeTabText]}>
              腸鳴音狀態指南
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'diet' && styles.activeTab]}
            onPress={() => setActiveTab('diet')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'diet' && styles.activeTabText]}>
              腸胃健康與飲食
            </Text>
          </TouchableOpacity>
        </View>

        {/* 內容渲染區域 */}
        {activeTab === 'sounds' ? (
          <View>
            <Text style={styles.sectionTitle}>🔊 腸鳴音分類狀態指引</Text>
            
            {/* 1. 正常腸鳴音 */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                  <Text style={styles.cardTitle}>正常腸鳴音 (Normal)</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: '#E6F8F3' }]}>
                  <Text style={[styles.badgeText, { color: '#10B981' }]}>健康狀態</Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.descriptionText}>
                  規律、低沉且平緩的咕嚕聲，代表腸胃蠕動頻率與消化道功能運作非常健康。
                </Text>
                <View style={styles.featureBox}>
                  <View style={styles.featureRow}>
                    <Ionicons name="stats-chart" size={14} color="#64748B" />
                    <Text style={styles.featureLabel}>標準判定基準：</Text>
                  </View>
                  <Text style={styles.featureValue}>• 蠕動次數：每分鐘 4 至 9 次{"\n"}• 音頻特徵：規律低沉、起伏平穩</Text>
                </View>
                <View style={styles.clinicalTipBox}>
                  <View style={styles.clinicalTipTitleRow}>
                    <Ionicons name="bulb" size={14} color="#15803D" />
                    <Text style={styles.clinicalTipTitle}>照護建議</Text>
                  </View>
                  <Text style={styles.clinicalTipText}>
                    請繼續保持規律作息與均衡飲食。每日補充足夠水分，並搭配適度運動。
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. 異常腸鳴音 */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Ionicons name="alert-circle" size={22} color="#EF4444" />
                  <Text style={styles.cardTitle}>異常腸鳴音 (Abnormal)</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: '#FEF2F2' }]}>
                  <Text style={[styles.badgeText, { color: '#EF4444' }]}>注意異常</Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.descriptionText}>
                  腸道收縮力度、速度或聲響偏離正常生理範圍。本系統去除了複雜的爆裂音分類，簡化以四大異常指標為判讀基準：
                </Text>
                
                <View style={styles.featureBox}>
                  <View style={styles.featureRow}>
                    <Ionicons name="git-commit" size={14} color="#EF4444" />
                    <Text style={[styles.featureLabel, { color: '#EF4444' }]}>異常判斷四大基準：</Text>
                  </View>
                  <Text style={[styles.featureValue, { lineHeight: 22 }]}>
                    1. **蠕動亢進**：每分鐘達 10 次以上，音頻尖銳急促（常見於急性腸胃炎、感染或腹瀉前夕）。{"\n"}
                    2. **蠕動低下**：每分鐘僅 1 至 3 次，聲音稀疏微弱（常見於便秘、腸阻塞早期或麻醉術後恢復期）。{"\n"}
                    3. **腸道無蠕動**：持續數分鐘皆無任何腸鳴音，次數為 0（警示腸阻塞晚期、腸麻痺或腹膜炎，需密切注意）。{"\n"}
                    4. **次數與音頻異常**：雖然收音次數在正常區間，但其頻譜能量分佈有高頻雜訊或聲學特徵異常。
                  </Text>
                </View>

                <View style={[styles.clinicalTipBox, { backgroundColor: '#FFF5F5', borderLeftColor: '#EF4444' }]}>
                  <View style={styles.clinicalTipTitleRow}>
                    <Ionicons name="warning" size={14} color="#B91C1C" />
                    <Text style={[styles.clinicalTipTitle, { color: '#B91C1C' }]}>臨床建議與處置</Text>
                  </View>
                  <Text style={[styles.clinicalTipText, { color: '#991B1B' }]}>
                    若持續偵測為「異常」，且伴隨劇烈腹痛、嘔吐、腹脹如鼓或無法排氣（放屁）等臨床症狀，請儘速就醫尋求專業醫師協助。
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>🥗 腸道功能調理與飲食指引</Text>

            {/* 便秘型飲食指引 */}
            <View style={styles.dietCard}>
              <View style={styles.dietHeader}>
                <Ionicons name="leaf" size={24} color="#10B981" />
                <Text style={styles.dietTitle}>便秘型（腸道蠕動減緩）</Text>
              </View>
              <View style={styles.dietContent}>
                <View>
                  <Text style={styles.dietSubTitle}>🟢 建議多攝取的食物：</Text>
                  <View style={styles.dietList}>
                    <View style={styles.dietItem}>
                      <Ionicons name="checkmark" size={18} color="#10B981" />
                      <Text style={styles.dietItemText}>高纖維蔬果：奇異果、香蕉、黑木耳、地瓜葉、燕麥。</Text>
                    </View>
                    <View style={styles.dietItem}>
                      <Ionicons name="checkmark" size={18} color="#10B981" />
                      <Text style={styles.dietItemText}>充足水分：每日飲水量達 2000c.c. 以上，促進腸胃排空。</Text>
                    </View>
                    <View style={styles.dietItem}>
                      <Ionicons name="checkmark" size={18} color="#10B981" />
                      <Text style={styles.dietItemText}>優質油脂與益生菌：適量橄欖油、堅果與無糖優格，潤滑腸道。</Text>
                    </View>
                  </View>
                </View>
                <View>
                  <Text style={styles.dietSubTitle}>🔴 應減少攝取的食物：</Text>
                  <View style={styles.dietList}>
                    <View style={styles.dietItem}>
                      <Ionicons name="close" size={18} color="#EF4444" />
                      <Text style={styles.dietItemText}>精緻澱粉：白麵包、蛋糕、白米飯，易降低腸道排空速度。</Text>
                    </View>
                    <View style={styles.dietItem}>
                      <Ionicons name="close" size={18} color="#EF4444" />
                      <Text style={styles.dietItemText}>油炸及高脂肪食品：消化時間長，加重腸道負擔。</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* 腹瀉型飲食指引 */}
            <View style={styles.dietCard}>
              <View style={styles.dietHeader}>
                <Ionicons name="water" size={24} color="#0D6EFD" />
                <Text style={styles.dietTitle}>腹瀉型（腸道蠕動亢進）</Text>
              </View>
              <View style={styles.dietContent}>
                <View>
                  <Text style={styles.dietSubTitle}>🟢 建議多攝取的食物：</Text>
                  <View style={styles.dietList}>
                    <View style={styles.dietItem}>
                      <Ionicons name="checkmark" size={18} color="#0D6EFD" />
                      <Text style={styles.dietItemText}>低渣飲食：白粥、白吐司、去皮雞肉、蒸蛋，易消化且不易刺激腸道。</Text>
                    </View>
                    <View style={styles.dietItem}>
                      <Ionicons name="checkmark" size={18} color="#0D6EFD" />
                      <Text style={styles.dietItemText}>電解質補給：溫水稀釋電解質運動飲料，或適度補充淡鹽水。</Text>
                    </View>
                    <View style={styles.dietItem}>
                      <Ionicons name="checkmark" size={18} color="#0D6EFD" />
                      <Text style={styles.dietItemText}>少量多餐：以溫熱食物為主，減少單次進食量。</Text>
                    </View>
                  </View>
                </View>
                <View>
                  <Text style={styles.dietSubTitle}>🔴 應減少攝取的食物：</Text>
                  <View style={styles.dietList}>
                    <View style={styles.dietItem}>
                      <Ionicons name="close" size={18} color="#EF4444" />
                      <Text style={styles.dietItemText}>乳製品：牛奶、起司、冰淇淋，易因乳糖刺激加劇腹瀉。</Text>
                    </View>
                    <View style={styles.dietItem}>
                      <Ionicons name="close" size={18} color="#EF4444" />
                      <Text style={styles.dietItemText}>辛辣與刺激性食物：咖啡、辣椒、茶，會過度加速胃腸收縮。</Text>
                    </View>
                    <View style={styles.dietItem}>
                      <Ionicons name="close" size={18} color="#EF4444" />
                      <Text style={styles.dietItemText}>粗纖維與易脹氣食物：竹筍、芹菜、豆類、洋蔥。</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
