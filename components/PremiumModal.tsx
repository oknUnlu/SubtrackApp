import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getSetting, setSetting } from "../database/db";
import { useAppTheme } from "@/hooks/use-app-theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPurchased: () => void;
};

export default function PremiumModal({ visible, onClose, onPurchased }: Props) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      // In production, this is where you'd call your IAP provider (RevenueCat, etc.)
      // For now we simulate a successful purchase by setting the flag directly.
      await setSetting("premium", "true");
      onPurchased();
      onClose();
      Alert.alert(
        t("settings.removeAdsSuccessTitle"),
        t("settings.removeAdsSuccessMsg")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      // In production, call IAP restore. Here we check local flag.
      const val = await getSetting("premium");
      if (val === "true") {
        onPurchased();
        onClose();
        Alert.alert(
          t("settings.removeAdsSuccessTitle"),
          t("settings.removeAdsAlready")
        );
      } else {
        Alert.alert(t("common.error"), "No previous purchase found.");
      }
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: "ban-outline" as const, key: "removeAdsBenefit1" },
    { icon: "heart-outline" as const, key: "removeAdsBenefit2" },
    { icon: "infinite-outline" as const, key: "removeAdsBenefit3" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: colors.modalOverlay, justifyContent: "flex-end" }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: "hidden",
          }}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={{ paddingTop: 32, paddingBottom: 28, paddingHorizontal: 24, alignItems: "center" }}
            >
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: "rgba(255,255,255,0.2)",
                justifyContent: "center", alignItems: "center",
                marginBottom: 12,
              }}>
                <Ionicons name="star" size={32} color="#fff" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "center" }}>
                {t("settings.removeAds")}
              </Text>
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 6, textAlign: "center" }}>
                {t("settings.removeAdsSubtitle")}
              </Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
              {benefits.map((b) => (
                <View key={b.key} style={{
                  flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16,
                }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: colors.primaryLight,
                    justifyContent: "center", alignItems: "center",
                  }}>
                    <Ionicons name={b.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text, flex: 1 }}>
                    {t(`settings.${b.key}`)}
                  </Text>
                </View>
              ))}

              <View style={{
                backgroundColor: colors.primaryLight,
                borderRadius: 16, padding: 16, alignItems: "center", marginVertical: 8,
              }}>
                <Text style={{ fontSize: 28, fontWeight: "800", color: colors.primary }}>
                  {t("settings.removeAdsPrice")}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {t("settings.removeAdsOneTime")}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handlePurchase}
                disabled={loading}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16, padding: 16,
                  alignItems: "center", marginTop: 16,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                  {t("settings.removeAdsBuy")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRestore}
                disabled={loading}
                style={{ alignItems: "center", paddingVertical: 14 }}
              >
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {t("settings.removeAdsRestore")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
