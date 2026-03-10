import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getSetting } from "@/database/db";
import { useAppTheme } from "@/hooks/use-app-theme";

type Props = { children: React.ReactNode };

export default function BiometricLock({ children }: Props) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [locked, setLocked] = useState<boolean | null>(null); // null = loading

  const authenticate = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("settings.biometricPrompt"),
        fallbackLabel: t("settings.biometricFallback"),
        disableDeviceFallback: false,
      });

      if (result.success) {
        setLocked(false);
      }
    } catch {
      // auth failed or cancelled, stay locked
    }
  }, [t]);

  useEffect(() => {
    async function checkLockSetting() {
      try {
        const enabled = await getSetting("biometricLock");
        if (enabled === "true") {
          setLocked(true);
          authenticate();
        } else {
          setLocked(false);
        }
      } catch {
        setLocked(false);
      }
    }
    checkLockSetting();
  }, [authenticate]);

  // Still checking
  if (locked === null) {
    return null;
  }

  // Not locked
  if (!locked) {
    return <>{children}</>;
  }

  // Locked overlay
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="lock-closed" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        {t("settings.biometricLocked")}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t("settings.biometricLockedDesc")}
      </Text>
      <Pressable
        style={[styles.unlockButton, { backgroundColor: colors.primary }]}
        onPress={authenticate}
      >
        <Ionicons name="finger-print-outline" size={22} color="#fff" />
        <Text style={styles.unlockText}>{t("settings.biometricUnlock")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  unlockButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  unlockText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
