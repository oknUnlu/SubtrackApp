import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import {
  clearAllData,
  getSetting,
  setSetting,
} from "../../database/db";

import { styles } from "../../styles/settings";

export default function SettingsScreen() {
  const [currency, setCurrency] = useState("TRY");
  const [interval, setInterval] = useState("monthly");
  const [mainView, setMainView] = useState("monthly");

  const [modal, setModal] = useState<null | "currency" | "interval" | "view">(null);

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
      "Tüm veriler silinsin mi?",
      "Bu işlem geri alınamaz.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            Alert.alert("Silindi");
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
          <Text style={styles.title}>Kontrol Merkezi</Text>
          <Ionicons name="settings-outline" size={22} />
        </View>

        {/* Settings List */}
        <View style={styles.card}>
          <SettingRow
            icon="cash-outline"
            label="Para Birimi"
            value={currencyLabel(currency)}
            onPress={() => setModal("currency")}
          />

          <Divider />

          <SettingRow
            icon="repeat-outline"
            label="Varsayılan Abonelik"
            value={interval === "monthly" ? "Aylık" : "Yıllık"}
            onPress={() => setModal("interval")}
          />

          <Divider />

          <SettingRow
            icon="stats-chart-outline"
            label="Ana Gösterim"
            value={mainView === "monthly" ? "Aylık" : "Yıllık"}
            onPress={() => setModal("view")}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Tehlikeli Alan</Text>

          <TouchableOpacity style={styles.dangerButton} onPress={reset}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.dangerText}>Tüm Verileri Sil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <OptionModal
        visible={modal === "currency"}
        title="Para Birimi"
        options={[
          { label: "Türk Lirası (₺)", value: "TRY" },
          { label: "Dolar ($)", value: "USD" },
          { label: "Euro (€)", value: "EUR" },
        ]}
        onSelect={(v: string) => select("currency", v)}
        onClose={() => setModal(null)}
      />

      <OptionModal
        visible={modal === "interval"}
        title="Varsayılan Abonelik"
        options={[
          { label: "Aylık", value: "monthly" },
          { label: "Yıllık", value: "yearly" },
        ]}
        onSelect={(v: string) => select("interval", v)}
        onClose={() => setModal(null)}
      />

      <OptionModal
        visible={modal === "view"}
        title="Ana Gösterim"
        options={[
          { label: "Aylık", value: "monthly" },
          { label: "Yıllık", value: "yearly" },
        ]}
        onSelect={(v: string) => select("mainView", v)}
        onClose={() => setModal(null)}
      />
    </SafeAreaView>
  );
}
function SettingRow({ icon, label, value, onPress }: any) {
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

function OptionModal({ visible, title, options, onSelect, onClose }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{title}</Text>

          {options.map((o: any) => (
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

function currencyLabel(v: string) {
  if (v === "USD") return "Dolar ($)";
  if (v === "EUR") return "Euro (€)";
  return "Türk Lirası (₺)";
}
