import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { formatNumber, getCurrencySymbol, getSetting, getYearlyCategoryTotals, getYearlyMonthlyTotals, getYearlyTotal } from "../database/db";
import { useAppTheme } from "@/hooks/use-app-theme";

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍔", transport: "🚗", fun: "🎮", shopping: "🛍️",
  bills: "📄", health: "💊", education: "📚", tech: "💻", other: "📌",
};

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function YearlyReportScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [monthlyTotals, setMonthlyTotals] = useState<{ month: string; total: number }[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<{ category: string; total: number }[]>([]);
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [currSymbol, setCurrSymbol] = useState("₺");

  useEffect(() => {
    (async () => {
      const currency = await getSetting("currency");
      setCurrSymbol(getCurrencySymbol(currency ?? "TRY"));
      const mt = await getYearlyMonthlyTotals(year);
      setMonthlyTotals(mt);
      const ct = await getYearlyCategoryTotals(year);
      setCategoryTotals(ct);
      const yt = await getYearlyTotal(year);
      setYearlyTotal(yt);
    })();
  }, [year]);

  const maxMonth = Math.max(...monthlyTotals.map(m => m.total), 1);
  const topMonth = monthlyTotals.reduce((a, b) => (b.total > a.total ? b : a), { month: "01", total: 0 });
  const catTotal = categoryTotals.reduce((s, c) => s + c.total, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="close" size={24} color={colors.icon} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>{t("yearlyReport.title")}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{t("yearlyReport.subtitle")}</Text>
          </View>
        </View>

        {/* Year Selector */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20, gap: 16 }}>
          <TouchableOpacity onPress={() => setYear(y => y - 1)}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>{year}</Text>
          <TouchableOpacity onPress={() => setYear(y => Math.min(y + 1, currentYear))}>
            <Ionicons name="chevron-forward" size={24} color={year >= currentYear ? colors.textMuted : colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t("yearlyReport.totalSpent")}</Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text, marginTop: 4 }}>{currSymbol}{formatNumber(yearlyTotal)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t("yearlyReport.monthlyAvg")}</Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text, marginTop: 4 }}>{currSymbol}{formatNumber(yearlyTotal / 12)}</Text>
          </View>
        </View>

        {monthlyTotals.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 40 }}>📅</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>{t("yearlyReport.noData")}</Text>
          </View>
        ) : (
          <>
            {/* Monthly Breakdown */}
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 }}>{t("yearlyReport.monthlyBreakdown")}</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 20 }}>
              {Array.from({ length: 12 }, (_, i) => {
                const key = String(i + 1).padStart(2, "0");
                const found = monthlyTotals.find(m => m.month === key);
                const total = found?.total ?? 0;
                const pct = maxMonth > 0 ? (total / maxMonth) * 100 : 0;
                return (
                  <View key={key} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ width: 36, fontSize: 12, color: colors.textSecondary, fontWeight: "600" }}>{MONTH_SHORT[i]}</Text>
                    <View style={{ flex: 1, height: 20, backgroundColor: colors.border, borderRadius: 6, overflow: "hidden", marginHorizontal: 8 }}>
                      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: topMonth.month === key ? colors.danger : colors.primary, borderRadius: 6 }} />
                    </View>
                    <Text style={{ width: 70, textAlign: "right", fontSize: 12, fontWeight: "600", color: colors.text }}>{currSymbol}{formatNumber(total)}</Text>
                  </View>
                );
              })}
            </View>

            {/* Category Breakdown */}
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 }}>{t("yearlyReport.categoryBreakdown")}</Text>
            {categoryTotals.map(cat => {
              const pct = catTotal > 0 ? (cat.total / catTotal) * 100 : 0;
              return (
                <View key={cat.category} style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 22, marginRight: 10 }}>{CATEGORY_ICONS[cat.category] ?? "📌"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: colors.text }}>{t(`categories.${cat.category}`, { defaultValue: cat.category })}</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>{pct.toFixed(1)}%</Text>
                  </View>
                  <Text style={{ fontWeight: "700", color: colors.text }}>{currSymbol}{formatNumber(cat.total)}</Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
