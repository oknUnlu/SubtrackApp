import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import ExpenseDonutChart from "../components/ExpenseDonutChart";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  formatNumber,
  getBudgetVsActual,
  getCategoryDistribution,
  getCurrencySymbol,
  getSetting,
} from "../database/db";

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍔", transport: "🚗", fun: "🎮", shopping: "🛍️",
  bills: "📄", health: "💊", education: "📚", tech: "💻", other: "📌",
  groceries: "🛒", rent: "🏠", fuel: "⛽", clothing: "👕",
  beauty: "💄", sports: "⚽", pets: "🐾", gifts: "🎁", travel: "✈️",
  insurance: "🛡️", taxes: "🏛️", savings: "🏦", charity: "❤️",
  kids: "👶", home: "🔧", coffee: "☕", subscriptions: "📱", parking: "🅿️",
};

const CATEGORY_COLORS: Record<string, string> = {
  food: "#f97316", transport: "#3b82f6", fun: "#8b5cf6", shopping: "#ec4899",
  bills: "#6366f1", health: "#ef4444", education: "#14b8a6", tech: "#06b6d4", other: "#6b7280",
  groceries: "#84cc16", rent: "#a855f7", fuel: "#eab308", clothing: "#f43f5e",
  beauty: "#d946ef", sports: "#22c55e", pets: "#f97316", gifts: "#e11d48", travel: "#0ea5e9",
  insurance: "#64748b", taxes: "#78716c", savings: "#059669", charity: "#ef4444",
  kids: "#f59e0b", home: "#8b5cf6", coffee: "#92400e", subscriptions: "#6366f1", parking: "#0284c7",
};

export default function SpendingDistributionScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const [categories, setCategories] = useState<{ category: string; total: number }[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<Map<string, { budget: number; actual: number }>>(new Map());
  const [currSymbol, setCurrSymbol] = useState("₺");

  useEffect(() => {
    (async () => {
      try {
        const cats = await getCategoryDistribution();
        setCategories(cats);

        const currency = await getSetting("currency");
        setCurrSymbol(getCurrencySymbol(currency ?? "TRY"));

        const budgetData = await getBudgetVsActual();
        const catBudgetMap = new Map<string, { budget: number; actual: number }>();
        for (const cb of budgetData.categories) {
          catBudgetMap.set(cb.category, { budget: cb.budget, actual: cb.actual });
        }
        setCategoryBudgets(catBudgetMap);
      } catch (error) {
        console.error("Spending distribution load error:", error);
      }
    })();
  }, []);

  const total = categories.reduce((s, c) => s + c.total, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="close" size={24} color={colors.icon} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>{t("spendingDistribution.title")}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{t("spendingDistribution.subtitle")}</Text>
          </View>
        </View>

        {/* Reports & Tools */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16 }}>{t('home.quickActions')}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {[
              { icon: "calendar-outline" as const, label: t("monthlyReport.title"), route: "/monthly-report" },
              { icon: "bar-chart-outline" as const, label: t("yearlyReport.title"), route: "/yearly-report" },
              { icon: "card-outline" as const, label: t("bankReport.title"), route: "/bank-report" },
              { icon: "trending-up-outline" as const, label: t("categoryTrend.title"), route: "/category-trend" },
              { icon: "receipt-outline" as const, label: t("installments.title"), route: "/installments" },
              { icon: "flag-outline" as const, label: t("spendingGoals.title"), route: "/spending-goals" },
            ].map((item) => (
              <TouchableOpacity
                key={item.route}
                onPress={() => router.push(item.route as any)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.surfaceTertiary,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  gap: 8,
                }}
              >
                <Ionicons name={item.icon} size={18} color={colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {categories.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📊</Text>
            <Text style={{ color: colors.textSecondary }}>{t("home.noSpendingData")}</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20 }}>
            <ExpenseDonutChart
              data={categories.map((item) => ({
                category: t(`categories.${item.category}`, { defaultValue: item.category }),
                total: item.total,
                color: CATEGORY_COLORS[item.category] || "#6b7280",
              }))}
              total={total}
              currencySymbol={currSymbol}
              totalLabel={t("home.totalLabel")}
              innerCircleColor={colors.surface}
              textColor={colors.text}
              textSecondaryColor={colors.textSecondary}
            />
            {categories.map((item) => {
              const percent = total > 0 ? item.total / total : 0;
              const cat = {
                icon: CATEGORY_ICONS[item.category] || "📌",
                label: t(`categories.${item.category}`, { defaultValue: item.category }),
              };
              const catBudget = categoryBudgets.get(item.category);
              const budgetPercent = catBudget ? item.total / catBudget.budget : 0;
              const budgetColor = budgetPercent >= 0.9 ? colors.danger : budgetPercent >= 0.7 ? colors.warning : colors.primary;

              return (
                <View key={item.category} style={{ backgroundColor: colors.surfaceTertiary, borderRadius: 14, padding: 12, marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", marginBottom: 8 }}>
                    <Text style={{ fontSize: 20, marginRight: 10 }}>{cat.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600", color: colors.text }}>{cat.label}</Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {t('home.percentThisMonth', { percent: Math.round(percent * 100) })}
                        {catBudget ? ` · ${currSymbol}${formatNumber(catBudget.budget, 2)} ${t('budget.limit')}` : ''}
                      </Text>
                    </View>
                    <Text style={{ fontWeight: "700", color: colors.text }}>{currSymbol}{formatNumber(item.total, 2)}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 6, overflow: "hidden" }}>
                    <View style={{
                      width: `${Math.min((catBudget ? budgetPercent : percent) * 100, 100)}%`,
                      height: "100%",
                      backgroundColor: catBudget ? budgetColor : colors.primary,
                    }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
