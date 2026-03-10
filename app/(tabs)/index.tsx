import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import AdBanner from '@/components/AdBanner';
import ExpenseDonutChart from '../../components/ExpenseDonutChart';
import WeeklyBarChart from '../../components/WeeklyBarChart';
import { useAppTheme } from '@/hooks/use-app-theme';
import { createStyles } from "../../styles";

import {
  deleteTransaction,
  getBudgetVsActual,
  getCategoryDistribution,
  getCurrencySymbol,
  getMonthlyComparison,
  getMonthlyTotal,
  getRecentTransactions,
  getSetting,
  getSubscriptionCount,
  getTagsForTransactions,
  getWeeklyTrend,
  TagItem,
  TransactionItem,
} from "../../database/db";

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍔", transport: "🚗", fun: "🎮", shopping: "🛍️",
  bills: "📄", health: "💊", education: "📚", tech: "💻", other: "📌",
};

const CATEGORY_COLORS: Record<string, string> = {
  food: "#f97316", transport: "#3b82f6", fun: "#8b5cf6", shopping: "#ec4899",
  bills: "#6366f1", health: "#ef4444", education: "#14b8a6", tech: "#06b6d4", other: "#6b7280",
};

function getShortDayName(dayIndex: number, locale: string): string {
  const refDate = new Date(2024, 0, 7 + dayIndex);
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(refDate);
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [categories, setCategories] = useState<{ category: string; total: number }[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<{ day: string; total: number }[]>([]);
  const [currSymbol, setCurrSymbol] = useState("₺");
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
  const [budgetInfo, setBudgetInfo] = useState<{ budget: number; actual: number } | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<Map<string, { budget: number; actual: number }>>(new Map());
  const [comparison, setComparison] = useState<{ thisMonth: number; lastMonth: number; changePercent: number } | null>(null);
  const [transactionTags, setTransactionTags] = useState<Map<string, TagItem[]>>(new Map());

  const loadDashboard = async () => {
    try {
      const total = await getMonthlyTotal();
      const subs = await getSubscriptionCount();
      const cats = await getCategoryDistribution();
      const weekly = await getWeeklyTrend();
      const recent = await getRecentTransactions(5);
      const currency = await getSetting("currency");

      const today = new Date().getDate();
      const avg = today > 0 ? total / today : 0;

      setMonthlyTotal(total);
      setSubscriptionCount(subs);
      setDailyAverage(avg);
      setCategories(cats);
      setWeeklyTrend(weekly);
      setRecentTransactions(recent);
      setCurrSymbol(getCurrencySymbol(currency ?? "TRY"));

      const budgetData = await getBudgetVsActual();
      setBudgetInfo(budgetData.overall);
      const catBudgetMap = new Map<string, { budget: number; actual: number }>();
      for (const cb of budgetData.categories) {
        catBudgetMap.set(cb.category, { budget: cb.budget, actual: cb.actual });
      }
      setCategoryBudgets(catBudgetMap);

      const comp = await getMonthlyComparison();
      setComparison(comp);

      if (recent.length > 0) {
        const tagMap = await getTagsForTransactions(recent.map(r => r.id));
        setTransactionTags(tagMap);
      }
    } catch (error) {
      console.error("Dashboard load error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: colors.safeAreaBg }} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View>
            <Text style={styles.appName}>SubTrack</Text>
            <Text style={styles.date}>
              {new Intl.DateTimeFormat(i18n.language, {
                day: 'numeric',
                month: 'long',
                weekday: 'long',
              }).format(new Date())}
            </Text>
          </View>
        </View>
      </View>

      {/* Monthly Total */}
      <LinearGradient
        colors={["#22c55e", "#16a34a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.totalCard}
      >
        <View style={styles.totalHeader}>
          <Ionicons name="wallet-outline" size={18} color="#fff" />
          <Text style={styles.totalLabel}>{t('home.totalSpending')}</Text>
        </View>
        <Text style={styles.totalAmount}>{currSymbol}{monthlyTotal.toFixed(2)}</Text>
        <View style={styles.totalFooter}>
          <Ionicons name="trending-up-outline" size={16} color="#dcfce7" />
          <Text style={styles.totalSubText}>{t('home.includingSubs')}</Text>
        </View>

        {budgetInfo && (
          <View style={{ marginTop: 12 }}>
            <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 6, overflow: "hidden" }}>
              <View style={{
                width: `${Math.min((budgetInfo.actual / budgetInfo.budget) * 100, 100)}%`,
                height: "100%",
                backgroundColor: budgetInfo.actual > budgetInfo.budget ? "#fca5a5" : "#dcfce7",
                borderRadius: 6,
              }} />
            </View>
            <Text style={{ color: "#dcfce7", fontSize: 12, marginTop: 4 }}>
              {budgetInfo.actual > budgetInfo.budget
                ? t('budget.exceeded')
                : `${t('budget.remaining')} ${currSymbol}${(budgetInfo.budget - budgetInfo.actual).toFixed(0)}`
              }
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.push('/budget')}
          style={{ marginTop: budgetInfo ? 8 : 12, flexDirection: "row", alignItems: "center" }}
        >
          <Ionicons name="wallet-outline" size={14} color="#dcfce7" />
          <Text style={{ color: "#dcfce7", fontSize: 13, marginLeft: 6, fontWeight: "600" }}>
            {budgetInfo ? t('budget.editBudget') : t('budget.setBudgetAction')}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>{t('home.activeSubscriptions')}</Text>
            <Ionicons name="card-outline" size={18} color={colors.iconSecondary} />
          </View>
          <Text style={styles.statValue}>{subscriptionCount}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>{t('home.dailyAverage')}</Text>
            <Ionicons name="analytics-outline" size={18} color={colors.iconSecondary} />
          </View>
          <Text style={styles.statValue}>{currSymbol}{dailyAverage.toFixed(0)}</Text>
        </View>
      </View>

      {/* Monthly Comparison */}
      {comparison && (comparison.thisMonth > 0 || comparison.lastMonth > 0) && (
        <View style={styles.largeCard}>
          <Text style={styles.cardTitle}>{t('home.monthlyComparison')}</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.primaryLight, borderRadius: 14, padding: 14, marginRight: 6 }}>
              <Text style={{ fontSize: 12, color: colors.primaryLightText, fontWeight: "500" }}>{t('home.thisMonth')}</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.primaryLightText, marginTop: 4 }}>
                {currSymbol}{comparison.thisMonth.toFixed(0)}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: 14, padding: 14, marginLeft: 6 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "500" }}>{t('home.lastMonth')}</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 4 }}>
                {currSymbol}{comparison.lastMonth.toFixed(0)}
              </Text>
            </View>
          </View>
          {comparison.lastMonth > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name={comparison.changePercent > 0 ? "trending-up-outline" : "trending-down-outline"}
                size={18}
                color={comparison.changePercent > 0 ? colors.danger : colors.primary}
              />
              <Text style={{
                marginLeft: 6, fontWeight: "600",
                color: comparison.changePercent > 0 ? colors.danger : colors.primary,
              }}>
                {comparison.changePercent > 0 ? "+" : ""}{comparison.changePercent.toFixed(1)}% {t('home.vsLastMonth')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Category Distribution */}
      <View style={styles.largeCard}>
        <Text style={styles.cardTitle}>{t('home.spendingDistribution')}</Text>
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>{t('home.noSpendingData')}</Text>
          </View>
        ) : (
          (() => {
            const total = categories.reduce((s, c) => s + c.total, 0);
            const chartData = categories.map((item) => ({
              category: t(`categories.${item.category}`, { defaultValue: item.category }),
              total: item.total,
              color: CATEGORY_COLORS[item.category] || "#6b7280",
            }));

            return (
              <>
                <ExpenseDonutChart
                  data={chartData}
                  total={total}
                  currencySymbol={currSymbol}
                  totalLabel={t('home.totalLabel')}
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
                            {catBudget ? ` · ${currSymbol}${catBudget.budget.toFixed(0)} ${t('budget.limit')}` : ''}
                          </Text>
                        </View>
                        <Text style={{ fontWeight: "700", color: colors.text }}>{currSymbol}{item.total.toFixed(0)}</Text>
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
              </>
            );
          })()
        )}
      </View>

      {/* Weekly Trend */}
      <View style={styles.largeCard}>
        <Text style={styles.cardTitle}>{t('home.weeklyTrend')}</Text>
        {weeklyTrend.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📈</Text>
            <Text style={styles.emptyText}>{t('home.noTrendData')}</Text>
          </View>
        ) : (
          <WeeklyBarChart
            data={weeklyTrend.map((item) => ({
              day: item.day,
              total: item.total,
              label: getShortDayName(Number(item.day), i18n.language),
            }))}
            currencySymbol={currSymbol}
            axisColor={colors.border}
            labelColor={colors.textSecondary}
            yLabelColor={colors.textMuted}
          />
        )}
      </View>

      {/* Recent Transactions */}
      <View style={styles.largeCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text style={[styles.cardTitle, { marginBottom: 0 }]}>{t('home.recentTransactions')}</Text>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}>{t('history.viewAll')}</Text>
          </TouchableOpacity>
        </View>
        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyText}>{t('home.noTransactions')}</Text>
          </View>
        ) : (
          recentTransactions.map((tx) => {
            const cat = {
              icon: CATEGORY_ICONS[tx.category ?? "other"] || "📌",
              label: t(`categories.${tx.category ?? "other"}`, { defaultValue: tx.category ?? "other" }),
            };
            const txDate = new Date(tx.date);
            const dateStr = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'numeric' }).format(txDate);

            return (
              <View key={tx.id} style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceTertiary, borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>{cat.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: colors.text }}>{tx.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{dateStr} - {cat.label}</Text>
                  {tx.notes ? <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>{tx.notes}</Text> : null}
                  {(transactionTags.get(tx.id) ?? []).length > 0 && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 3 }}>
                      {(transactionTags.get(tx.id) ?? []).map(tag => (
                        <View key={tag.id} style={{ backgroundColor: tag.color + "20", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 10, color: tag.color, fontWeight: "600" }}>{tag.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <Text style={{ fontWeight: "700", marginRight: 10, color: colors.text }}>{currSymbol}{tx.amount.toFixed(2)}</Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      t('home.deleteTransaction'),
                      t('common.deleteConfirm', { name: tx.title }),
                      [
                        { text: t('common.cancel'), style: "cancel" },
                        { text: t('common.delete'), style: "destructive", onPress: async () => { await deleteTransaction(tx.id); loadDashboard(); } },
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      {/* Ad */}
      <AdBanner />
    </ScrollView>
  </SafeAreaView>
  );
}
