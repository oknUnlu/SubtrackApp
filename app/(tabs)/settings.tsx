import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../i18n/i18n';

import {
  clearAllData,
  getSetting,
  setSetting,
} from "../../database/db";

import { createStyles } from "../../styles/settings";
import { exportTransactionsCsv, exportSubscriptionsCsv } from "../../utils/csvExport";
import { useAppTheme } from '@/hooks/use-app-theme';
import { colorThemes } from '@/constants/theme';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, setDarkMode, colorThemeId, setColorTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [currency, setCurrency] = useState("TRY");
  const [interval, setInterval] = useState("monthly");
  const [mainView, setMainView] = useState("monthly");
  const [reminderDays, setReminderDays] = useState("1");
  const [darkModeSetting, setDarkModeSetting] = useState("system");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const [modal, setModal] = useState<null | "currency" | "interval" | "view" | "language" | "reminder" | "darkMode" | "colorTheme">(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const c = await getSetting("currency");
    const i = await getSetting("interval");
    const v = await getSetting("mainView");
    if (c) setCurrency(c);
    if (i) setInterval(i);
    if (v) setMainView(v);
    const rd = await getSetting("reminderDaysBefore");
    if (rd) setReminderDays(rd);
    const dm = await getSetting("darkMode");
    if (dm) setDarkModeSetting(dm);
    // Biometric
    const hasHw = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(hasHw && enrolled);
    const bl = await getSetting("biometricLock");
    setBiometricEnabled(bl === "true");
  };

  const select = async (key: string, value: string) => {
    await setSetting(key, value);
    if (key === "currency") setCurrency(value);
    if (key === "interval") setInterval(value);
    if (key === "mainView") setMainView(value);
    if (key === "reminderDaysBefore") setReminderDays(value);
    if (key === "darkMode") {
      setDarkModeSetting(value);
      setDarkMode(value);
    }
    if (key === "colorTheme") {
      setColorTheme(value);
    }
    setModal(null);
  };

  const reset = () => {
    Alert.alert(
      t('settings.deleteAllConfirm'),
      t('settings.deleteAllWarning'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            Alert.alert(t('common.deleted'));
          },
        },
      ]
    );
  };

  const darkModeLabel = (v: string) => {
    if (v === "light") return t('settings.darkModeLight');
    if (v === "dark") return t('settings.darkModeDark');
    return t('settings.darkModeSystem');
  };

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      // Verify biometric before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('settings.biometricPrompt'),
        disableDeviceFallback: false,
      });
      if (result.success) {
        await setSetting("biometricLock", "true");
        setBiometricEnabled(true);
      }
    } else {
      await setSetting("biometricLock", "false");
      setBiometricEnabled(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title')}</Text>
        </View>

        <View style={styles.card}>
          <SettingRow icon="cash-outline" label={t('settings.currency')} value={currencyLabel(currency, t)} onPress={() => setModal("currency")} colors={colors} />
          <Divider colors={colors} />
          <SettingRow icon="repeat-outline" label={t('settings.defaultSubscription')} value={interval === "monthly" ? t('common.monthly') : t('common.yearly')} onPress={() => setModal("interval")} colors={colors} />
          <Divider colors={colors} />
          <SettingRow icon="stats-chart-outline" label={t('settings.mainView')} value={mainView === "monthly" ? t('common.monthly') : t('common.yearly')} onPress={() => setModal("view")} colors={colors} />
          <Divider colors={colors} />
          <SettingRow icon="notifications-outline" label={t('settings.reminderDays')} value={t('settings.daysBefore', { count: Number(reminderDays) })} onPress={() => setModal("reminder")} colors={colors} />
          <Divider colors={colors} />
          <SettingRow icon="moon-outline" label={t('settings.darkMode')} value={darkModeLabel(darkModeSetting)} onPress={() => setModal("darkMode")} colors={colors} />
          <Divider colors={colors} />
          <SettingRow icon="color-palette-outline" label={t('settings.colorTheme')} value={t(`settings.theme_${colorThemeId}`)} onPress={() => setModal("colorTheme")} colors={colors} />
          {biometricAvailable && (
            <>
              <Divider colors={colors} />
              <View style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }}>
                <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
                <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text, flex: 1 }}>{t('settings.biometricLock')}</Text>
                <Switch
                  value={biometricEnabled}
                  onValueChange={toggleBiometric}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={biometricEnabled ? colors.primary : colors.textMuted}
                />
              </View>
            </>
          )}
          <Divider colors={colors} />
          <SettingRow icon="language-outline" label={t('settings.language')} value={languageLabel(i18n.language)} onPress={() => setModal("language")} colors={colors} />
        </View>

        {/* Data Export */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={async () => {
              try { await exportTransactionsCsv(); }
              catch (e) { console.error(e); Alert.alert(t('common.error')); }
            }}
          >
            <Ionicons name="download-outline" size={20} color={colors.primary} />
            <Text style={styles.rowLabel}>{t('settings.exportExpenses')}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>CSV</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <Divider colors={colors} />
          <TouchableOpacity
            style={styles.row}
            onPress={async () => {
              try { await exportSubscriptionsCsv(); }
              catch (e) { console.error(e); Alert.alert(t('common.error')); }
            }}
          >
            <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
            <Text style={styles.rowLabel}>{t('settings.exportSubscriptions')}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>CSV</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerCard}>
          <TouchableOpacity style={styles.dangerButton} onPress={reset}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.dangerText}>{t('settings.deleteAllData')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <OptionModal visible={modal === "currency"} title={t('settings.currency')} colors={colors}
        options={[
          { label: t('settings.currencyTRY'), value: "TRY" },
          { label: t('settings.currencyUSD'), value: "USD" },
          { label: t('settings.currencyEUR'), value: "EUR" },
          { label: t('settings.currencyBRL'), value: "BRL" },
          { label: t('settings.currencyINR'), value: "INR" },
          { label: t('settings.currencyIDR'), value: "IDR" },
          { label: t('settings.currencyJPY'), value: "JPY" },
          { label: t('settings.currencyKRW'), value: "KRW" },
        ]}
        onSelect={(v: string) => select("currency", v)} onClose={() => setModal(null)}
      />
      <OptionModal visible={modal === "interval"} title={t('settings.defaultSubscription')} colors={colors}
        options={[
          { label: t('common.monthly'), value: "monthly" },
          { label: t('common.yearly'), value: "yearly" },
        ]}
        onSelect={(v: string) => select("interval", v)} onClose={() => setModal(null)}
      />
      <OptionModal visible={modal === "view"} title={t('settings.mainView')} colors={colors}
        options={[
          { label: t('common.monthly'), value: "monthly" },
          { label: t('common.yearly'), value: "yearly" },
        ]}
        onSelect={(v: string) => select("mainView", v)} onClose={() => setModal(null)}
      />
      <OptionModal visible={modal === "language"} title={t('settings.language')} colors={colors}
        options={[
          { label: "Türkçe", value: "tr" },
          { label: "English", value: "en" },
          { label: "Español", value: "es" },
          { label: "Português", value: "pt" },
          { label: "हिन्दी", value: "hi" },
          { label: "Bahasa Indonesia", value: "id" },
          { label: "日本語", value: "ja" },
          { label: "한국어", value: "ko" },
        ]}
        onSelect={async (v: string) => { await changeLanguage(v); setModal(null); }}
        onClose={() => setModal(null)}
      />
      <OptionModal visible={modal === "reminder"} title={t('settings.reminderDays')} colors={colors}
        options={[
          { label: t('settings.daysBefore', { count: 1 }), value: "1" },
          { label: t('settings.daysBefore', { count: 2 }), value: "2" },
          { label: t('settings.daysBefore', { count: 3 }), value: "3" },
          { label: t('settings.daysBefore', { count: 7 }), value: "7" },
        ]}
        onSelect={(v: string) => select("reminderDaysBefore", v)} onClose={() => setModal(null)}
      />
      <OptionModal visible={modal === "darkMode"} title={t('settings.darkMode')} colors={colors}
        options={[
          { label: t('settings.darkModeSystem'), value: "system" },
          { label: t('settings.darkModeLight'), value: "light" },
          { label: t('settings.darkModeDark'), value: "dark" },
        ]}
        onSelect={(v: string) => select("darkMode", v)} onClose={() => setModal(null)}
      />

      {/* Color Theme Picker */}
      <Modal visible={modal === "colorTheme"} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1, backgroundColor: colors.modalOverlay, justifyContent: "flex-end" }} onPress={() => setModal(null)}>
          <View style={{ backgroundColor: colors.surface, padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 16, color: colors.text }}>{t('settings.colorTheme')}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", paddingBottom: 8 }}>
              {colorThemes.map((theme) => {
                const isSelected = theme.id === colorThemeId;
                return (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => select("colorTheme", theme.id)}
                    style={{
                      alignItems: "center",
                      width: 90,
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: isSelected ? theme.primary : colors.border,
                      backgroundColor: isSelected ? (theme.id === 'default' ? colors.primaryLight : theme.primaryLight) : colors.background,
                    }}
                  >
                    <View style={{
                      width: 44, height: 44, borderRadius: 22,
                      backgroundColor: theme.primary,
                      justifyContent: "center", alignItems: "center",
                      marginBottom: 8,
                      shadowColor: theme.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 3,
                    }}>
                      <Ionicons name={theme.icon as any} size={22} color="#fff" />
                    </View>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? theme.primary : colors.textSecondary,
                      textAlign: "center",
                    }}>
                      {t(`settings.theme_${theme.id}`)}
                    </Text>
                    {isSelected && (
                      <View style={{
                        position: "absolute", top: 6, right: 6,
                        width: 18, height: 18, borderRadius: 9,
                        backgroundColor: theme.primary,
                        justifyContent: "center", alignItems: "center",
                      }}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, value, onPress, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{value}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 48 }} />;
}

function OptionModal({ visible, title, options, onSelect, onClose, colors }: {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  onClose: () => void;
  colors: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={{ flex: 1, backgroundColor: colors.modalOverlay, justifyContent: "flex-end" }} onPress={onClose}>
        <View style={{ backgroundColor: colors.surface, padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12, color: colors.text }}>{title}</Text>
          {options.map((o) => (
            <TouchableOpacity key={o.value} style={{ paddingVertical: 14 }} onPress={() => onSelect(o.value)}>
              <Text style={{ fontSize: 16, color: colors.text }}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function currencyLabel(v: string, t: any) {
  const key = `settings.currency${v}`;
  return t(key, { defaultValue: t('settings.currencyTRY') });
}

function languageLabel(code: string): string {
  const labels: Record<string, string> = {
    tr: "Türkçe", en: "English", es: "Español", pt: "Português",
    hi: "हिन्दी", id: "Bahasa Indonesia", ja: "日本語", ko: "한국어",
  };
  return labels[code] || code;
}
