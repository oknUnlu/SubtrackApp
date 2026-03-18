import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { formatNumber, getCurrencySymbol, getMonthlyReport, getSetting } from "../database/db";
import { useAppTheme } from "@/hooks/use-app-theme";

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍔", transport: "🚗", fun: "🎮", shopping: "🛍️",
  bills: "📄", health: "💊", education: "📚", tech: "💻", other: "📌",
};

export default function MonthlyReportScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();

  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState<{
    total: number;
    topCategory: { category: string; total: number } | null;
    transactionCount: number;
    avgPerDay: number;
    cashTotal: number;
    cardTotal: number;
    debitTotal: number;
  } | null>(null);
  const [currSymbol, setCurrSymbol] = useState("₺");

  const load = async () => {
    const data = await getMonthlyReport(currentMonth);
    setReport(data);
    const currency = await getSetting("currency");
    setCurrSymbol(getCurrencySymbol(currency ?? "TRY"));
  };

  useEffect(() => { load(); }, [currentMonth]);

  const changeMonth = (delta: number) => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const monthLabel = (() => {
    const [y, m] = currentMonth.split("-").map(Number);
    return new Intl.DateTimeFormat(i18n.language, { month: "long", year: "numeric" }).format(new Date(y, m - 1));
  })();

  const paymentTotal = report ? report.cashTotal + report.debitTotal + report.cardTotal : 0;
  const cashPercent = report && paymentTotal > 0 ? Math.round((report.cashTotal / paymentTotal) * 100) : 0;
  const debitPercent = report && paymentTotal > 0 ? Math.round((report.debitTotal / paymentTotal) * 100) : 0;
  const cardPercent = report && paymentTotal > 0 ? 100 - cashPercent - debitPercent : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="close" size={24} color={colors.icon} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>{t("monthlyReport.title")}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{t("monthlyReport.subtitle")}</Text>
          </View>
        </View>

        {/* Month Selector */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={{ padding: 8 }}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginHorizontal: 16 }}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={{ padding: 8 }}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {!report || report.total === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 40 }}>📊</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>{t("monthlyReport.noData")}</Text>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t("monthlyReport.totalSpent")}</Text>
                <Text style={{ fontSize: 22, fontWeight: "700", color: colors.primary, marginTop: 4 }}>{currSymbol}{formatNumber(report.total)}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t("monthlyReport.transactionCount")}</Text>
                <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text, marginTop: 4 }}>{report.transactionCount}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t("monthlyReport.avgPerDay")}</Text>
                <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text, marginTop: 4 }}>{currSymbol}{formatNumber(report.avgPerDay)}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t("monthlyReport.topCategory")}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <Text style={{ fontSize: 20, marginRight: 6 }}>
                    {CATEGORY_ICONS[report.topCategory?.category ?? "other"] ?? "📌"}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                    {t(`categories.${report.topCategory?.category ?? "other"}`)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Cash vs Card */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>{t("monthlyReport.cashVsCard")}</Text>

              {/* Stacked bar */}
              <View style={{ height: 12, borderRadius: 8, overflow: "hidden", flexDirection: "row", backgroundColor: colors.border, marginBottom: 12 }}>
                {report.cashTotal > 0 && (
                  <View style={{ width: `${cashPercent}%`, height: "100%", backgroundColor: colors.primary }} />
                )}
                {report.debitTotal > 0 && (
                  <View style={{ width: `${debitPercent}%`, height: "100%", backgroundColor: colors.warning }} />
                )}
                {report.cardTotal > 0 && (
                  <View style={{ width: `${cardPercent}%`, height: "100%", backgroundColor: colors.purple }} />
                )}
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, marginRight: 8 }} />
                  <View>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>{t("monthlyReport.cash")}</Text>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{currSymbol}{formatNumber(report.cashTotal, 2)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.warning, marginRight: 8 }} />
                  <View>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>{t("monthlyReport.debit")}</Text>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{currSymbol}{formatNumber(report.debitTotal, 2)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.purple, marginRight: 8 }} />
                  <View>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>{t("monthlyReport.card")}</Text>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{currSymbol}{formatNumber(report.cardTotal, 2)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
