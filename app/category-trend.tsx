import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { getCategoryMonthlyTrend, getCurrencySymbol, getSetting } from "../database/db";
import { useAppTheme } from "@/hooks/use-app-theme";

const CATEGORY_DATA = [
  { key: "food", icon: "🍔" },
  { key: "transport", icon: "🚗" },
  { key: "fun", icon: "🎮" },
  { key: "shopping", icon: "🛍️" },
  { key: "bills", icon: "📄" },
  { key: "health", icon: "💊" },
  { key: "education", icon: "📚" },
  { key: "tech", icon: "💻" },
  { key: "other", icon: "📌" },
];

export default function CategoryTrendScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [trend, setTrend] = useState<{ month: string; total: number }[]>([]);
  const [currSymbol, setCurrSymbol] = useState("₺");

  useEffect(() => {
    (async () => {
      const currency = await getSetting("currency");
      setCurrSymbol(getCurrencySymbol(currency ?? "TRY"));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const data = await getCategoryMonthlyTrend(selectedCategory, 6);
      setTrend(data);
    })();
  }, [selectedCategory]);

  const maxVal = Math.max(...trend.map(t => t.total), 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="close" size={24} color={colors.icon} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>{t("categoryTrend.title")}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{t("categoryTrend.subtitle")}</Text>
          </View>
        </View>

        {/* Category Selector */}
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>{t("categoryTrend.selectCategory")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {CATEGORY_DATA.map(cat => (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setSelectedCategory(cat.key)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 6,
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
                backgroundColor: selectedCategory === cat.key ? colors.primary : colors.surface,
              }}
            >
              <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: selectedCategory === cat.key ? "#fff" : colors.text }}>
                {t(`categories.${cat.key}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Trend Chart */}
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16 }}>{t("categoryTrend.last6Months")}</Text>

        {trend.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 40 }}>📉</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>{t("categoryTrend.noData")}</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
            {trend.map((item, idx) => {
              const pct = maxVal > 0 ? (item.total / maxVal) * 100 : 0;
              const monthLabel = item.month.slice(5); // "03" from "2024-03"
              return (
                <View key={item.month} style={{ flexDirection: "row", alignItems: "center", marginBottom: idx < trend.length - 1 ? 12 : 0 }}>
                  <Text style={{ width: 50, fontSize: 13, color: colors.textSecondary, fontWeight: "600" }}>{monthLabel}</Text>
                  <View style={{ flex: 1, height: 24, backgroundColor: colors.border, borderRadius: 8, overflow: "hidden", marginHorizontal: 8 }}>
                    <View style={{ width: `${pct}%`, height: "100%", backgroundColor: colors.primary, borderRadius: 8 }} />
                  </View>
                  <Text style={{ width: 80, textAlign: "right", fontSize: 13, fontWeight: "700", color: colors.text }}>{currSymbol}{item.total.toFixed(0)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
