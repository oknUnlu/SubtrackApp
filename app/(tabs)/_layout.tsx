import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <Tabs
  screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: Colors[colorScheme].tint,
    tabBarInactiveTintColor: '#9CA3AF',
    tabBarStyle: {
      height: 72,          // ⬅️ artırıldı
      paddingBottom: 8,
    },
    tabBarItemStyle: {
      paddingTop: 6,      // ⬅️ çok önemli
    },
  }}
>

      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="subscriptions"
        options={{
          title: 'Abonelikler',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'card' : 'card-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
  name="add"
  options={{
    title: 'Ekle',
    tabBarIcon: ({ color, focused }) => (
      <Ionicons
        name={focused ? 'add-circle' : 'add-circle-outline'}
        size={40}          // ⬅️ biraz büyüdü
        color={color}
        style={{
          marginTop: -6,   // ⬅️ yukarı taşı ama kesme yok
        }}
      />
    ),
  }}
/>

      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Analiz',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'analytics' : 'analytics-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
