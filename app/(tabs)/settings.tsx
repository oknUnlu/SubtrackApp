import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
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

import { styles } from "../../styles/settings";
import { exportTransactionsCsv, exportSubscriptionsCsv } from "../../utils/csvExport";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [currency, setCurrency] = useState("TRY");
  const [interval, setInterval] = useState("monthly");
  const [mainView, setMainView] = useState("monthly");

  const [modal, setModal] = useState<null | "currency" | "interval" | "view" | "language">(null);

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
  };

  const select = async (key: string, value: string) => {
    await setSetting(key, value);
    if (key === "currency") setCurrency(value);
    if (key === "interval") setInterval(value);
    if (key === "mainView") setMainView(value);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title')}</Text>
          <Ionicons name="settings-outline" size={22} />
        </View>

        {/* Settings List */}
        <View style={styles.card}>
          <SettingRow
            icon="cash-outline"
            label={t('settings.currency')}
            value={currencyLabel(currency, t)}
            onPress={() => setModal("currency")}
          />

          <Divider />

          <SettingRow
            icon="repeat-outline"
            label={t('settings.defaultSubscription')}
            value={interval === "monthly" ? t('common.monthly') : t('common.yearly')}
            onPress={() => setModal("interval")}
          />

          <Divider />

          <SettingRow
            icon="stats-chart-outline"
            label={t('settings.mainView')}
            value={mainView === "monthly" ? t('common.monthly') : t('common.yearly')}
            onPress={() => setModal("view")}
          />

          <Divider />
          <SettingRow
            icon="language-outline"
            label={t('settings.language')}
            value={languageLabel(i18n.language)}
            onPress={() => setModal("language")}
          />
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
            <Ionicons name="download-outline" size={20} color="#22c55e" />
            <Text style={styles.rowLabel}>{t('settings.exportExpenses')}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>CSV</Text>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity
            style={styles.row}
            onPress={async () => {
              try { await exportSubscriptionsCsv(); }
              catch (e) { console.error(e); Alert.alert(t('common.error')); }
            }}
          >
            <Ionicons name="cloud-download-outline" size={20} color="#22c55e" />
            <Text style={styles.rowLabel}>{t('settings.exportSubscriptions')}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>CSV</Text>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>{t('settings.dangerZone')}</Text>

          <TouchableOpacity style={styles.dangerButton} onPress={reset}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.dangerText}>{t('settings.deleteAllData')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <OptionModal
        visible={modal === "currency"}
        title={t('settings.currency')}
        options={[
          { label: t('settings.currencyTRY'), value: "TRY" },
          { label: t('settings.currencyUSD'), value: "USD" },
          { label: t('settings.currencyEUR'), value: "EUR" },
        ]}
        onSelect={(v: string) => select("currency", v)}
        onClose={() => setModal(null)}
      />

      <OptionModal
        visible={modal === "interval"}
        title={t('settings.defaultSubscription')}
        options={[
          { label: t('common.monthly'), value: "monthly" },
          { label: t('common.yearly'), value: "yearly" },
        ]}
        onSelect={(v: string) => select("interval", v)}
        onClose={() => setModal(null)}
      />

      <OptionModal
        visible={modal === "view"}
        title={t('settings.mainView')}
        options={[
          { label: t('common.monthly'), value: "monthly" },
          { label: t('common.yearly'), value: "yearly" },
        ]}
        onSelect={(v: string) => select("mainView", v)}
        onClose={() => setModal(null)}
      />

      <OptionModal
        visible={modal === "language"}
        title={t('settings.language')}
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
        onSelect={async (v: string) => {
          await changeLanguage(v);
          setModal(null);
        }}
        onClose={() => setModal(null)}
      />
    </SafeAreaView>
  );
}
function SettingRow({ icon, label, value, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#22c55e" />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.rowValue}>{value}</Text>
      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function OptionModal({ visible, title, options, onSelect, onClose }: {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{title}</Text>

          {options.map((o) => (
            <TouchableOpacity
              key={o.value}
              style={styles.option}
              onPress={() => onSelect(o.value)}
            >
              <Text style={styles.optionText}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function currencyLabel(v: string, t: any) {
  if (v === "USD") return t('settings.currencyUSD');
  if (v === "EUR") return t('settings.currencyEUR');
  return t('settings.currencyTRY');
}

function languageLabel(code: string): string {
  const labels: Record<string, string> = {
    tr: "Türkçe",
    en: "English",
    es: "Español",
    pt: "Português",
    hi: "हिन्दी",
    id: "Bahasa Indonesia",
    ja: "日本語",
    ko: "한국어",
  };
  return labels[code] || code;
}
