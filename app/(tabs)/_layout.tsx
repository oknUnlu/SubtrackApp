import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/hooks/use-app-theme';

export default function TabLayout() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: Platform.OS === 'android' ? 70 : 80,
          paddingBottom: Platform.OS === 'android' ? 10 : 20,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          backgroundColor: colors.tabBarBg,
          overflow: 'visible',
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: t('tabs.subscriptions'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'card' : 'card-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: () => (
            <View
              style={{
                position: 'absolute',
                top: -10,
                height: 45,
                width: 45,
                borderRadius: 30,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 5,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <Ionicons name="add" size={30} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: t('tabs.aiAnalysis'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'analytics' : 'analytics-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'settings' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
