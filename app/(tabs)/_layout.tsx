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
        tabBarActiveTintColor: isDark ? '#69A9F7' : '#1478F2',
        tabBarInactiveTintColor: isDark ? '#83909F' : '#8794A5',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 1,
        },
        tabBarStyle: {
          height: 64,
          paddingTop: 7,
          paddingBottom: 7,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#33404E' : '#E5EAF0',
          backgroundColor: isDark ? '#17212B' : '#FFFFFF',
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
      <Tabs.Screen
        name="explore"
        options={{
          title: '摘要',
          tabBarIcon: ({ color, focused }) => <Ionicons size={23} name={focused ? 'clipboard' : 'clipboard-outline'} color={color} />,
        }}
      />
    </Tabs>
  );
}
