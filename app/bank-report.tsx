import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { formatNumber, getBankDistribution, getCurrencySymbol, getSetting } from "../database/db";
import { useAppTheme } from "@/hooks/use-app-theme";

const BANK_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#ef4444", "#6366f1", "#06b6d4"];

export default function BankReportScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [banks, setBanks] = useState<{ bankName: string; total: number; count: number }[]>([]);
  const [currSymbol, setCurrSymbol] = useState("₺");

  useEffect(() => {
    (async () => {
      const currency = await getSetting("currency");
      setCurrSymbol(getCurrencySymbol(currency ?? "TRY"));
      const data = await getBankDistribution();
      setBanks(data);
    })();
  }, []);

  const grandTotal = banks.reduce((s, b) => s + b.total, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="close" size={24} color={colors.icon} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>{t("bankReport.title")}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{t("bankReport.subtitle")}</Text>
          </View>
        </View>

        {/* Total */}
        <View style={{ backgroundColor: colors.purple, borderRadius: 20, padding: 20, marginBottom: 20 }}>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>{t("bankReport.totalCardSpending")}</Text>
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700", marginTop: 4 }}>{currSymbol}{formatNumber(grandTotal, 2)}</Text>
        </View>

        {banks.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 40 }}>💳</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>{t("bankReport.noCardData")}</Text>
          </View>
        ) : (
          banks.map((bank, idx) => {
            const pct = grandTotal > 0 ? (bank.total / grandTotal) * 100 : 0;
            const bankColor = BANK_COLORS[idx % BANK_COLORS.length];
            return (
              <View key={bank.bankName} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: bankColor + "20", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                    <Ionicons name="business-outline" size={20} color={bankColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 16, color: colors.text }}>{bank.bankName}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t("bankReport.transactions", { count: bank.count })}</Text>
                  </View>
                  <Text style={{ fontWeight: "700", fontSize: 18, color: colors.text }}>{currSymbol}{formatNumber(bank.total)}</Text>
                </View>
                <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 6, overflow: "hidden" }}>
                  <View style={{ width: `${pct}%`, height: "100%", backgroundColor: bankColor, borderRadius: 6 }} />
                </View>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>{pct.toFixed(1)}%</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
