import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useApp } from '@/context/AppContext';
export default function TabLayout() {
  const { settings } = useApp();
  const isDark = settings.themeMode === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#EEEEEE' : '#303030',
        tabBarInactiveTintColor: isDark ? '#AAAAAA' : '#707070',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '700',
          marginTop: 1,
        },
        tabBarStyle: {
          minHeight: 68,
          paddingTop: 7,
          paddingBottom: 7,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#444444' : '#DDDDDD',
          backgroundColor: isDark ? '#222222' : '#F5F5F5',
          elevation: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '首頁',
          tabBarIcon: ({ color, focused }) => <Ionicons size={23} name={focused ? 'home' : 'home-outline'} color={color} />,
        }}
      />
      <Tabs.Screen name="calendar" options={{ title: '日曆', tabBarIcon: ({ color }) => <Ionicons size={23} name="calendar-outline" color={color} /> }} />
      <Tabs.Screen name="habits" options={{ title: '習慣', tabBarIcon: ({ color }) => <Ionicons size={23} name="leaf-outline" color={color} /> }} />
      <Tabs.Screen name="me" options={{ title: '我的', tabBarIcon: ({ color }) => <Ionicons size={23} name="person-outline" color={color} /> }} />
      <Tabs.Screen name="explore" options={{ href: null, title: '量測紀錄' }} />
      <Tabs.Screen name="knowledge" options={{ href: null, title: '知識' }} />
    </Tabs>
  );
}
