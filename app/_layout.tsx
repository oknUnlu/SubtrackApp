import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { SystemBars } from 'react-native-edge-to-edge';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import BiometricLock from '@/components/BiometricLock';
import { initDB, getSetting } from '@/database/db';
import { AppThemeProvider, useAppTheme } from '@/hooks/use-app-theme';
import { initI18n } from '@/i18n/i18n';
import { rescheduleAllReminders } from '@/utils/notifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent({ showOnboarding }: { showOnboarding: boolean }) {
  const { isDark } = useAppTheme();
  const router = useRouter();

  useEffect(() => {
    if (showOnboarding) {
      router.replace('/onboarding');
    }
  }, [showOnboarding, router]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="budget" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="history" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="yearly-report" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="bank-report" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="category-trend" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="installments" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="monthly-report" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="spending-goals" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <SystemBars style={isDark ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initDB();
        await initI18n();
        rescheduleAllReminders().catch(() => {});

        const onboardingDone = await getSetting('onboardingComplete');
        if (onboardingDone !== 'true') {
          setShowOnboarding(true);
        }
      } catch (e) {
        console.warn('Bootstrap error', e);
      } finally {
        setIsReady(true);
      }
    }
    bootstrap();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <AppThemeProvider>
      <BiometricLock>
        <AppContent showOnboarding={showOnboarding} />
      </BiometricLock>
    </AppThemeProvider>
  );
}
