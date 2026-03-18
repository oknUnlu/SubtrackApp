import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import AdBanner from '@/components/AdBanner';
import ExpenseDonutChart from '../../components/ExpenseDonutChart';
import WeeklyBarChart from '../../components/WeeklyBarChart';
import { useAppTheme } from '@/hooks/use-app-theme';
import { createStyles } from "../../styles";
import { initInstallDate, checkAndPromptReview, requestReview } from '../../utils/reviewPrompt';

import {
  deleteTransaction,
  formatNumber,
  getBudgetVsActual,
  getCategoryDistribution,
  getCurrencySymbol,
  getMonthlyComparison,
  getMonthlyTotal,
  getPaymentMethodDistribution,
  getRecentTransactions,
  getSetting,
  setSetting,
  getSubscriptionCount,
  getTagsForTransactions,
  getWeeklyTrend,
  TagItem,
  TransactionItem,
} from "../../database/db";

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
  const [paymentDistribution, setPaymentDistribution] = useState<{ method: string; total: number }[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const reviewChecked = useRef(false);

  // Review prompt - uygulama ilk açıldığında tarih kaydet, belirli gün sonra sor
  useEffect(() => {
    initInstallDate();
  }, []);

  useEffect(() => {
    if (!reviewChecked.current) {
      reviewChecked.current = true;
      checkAndPromptReview().then((shouldShow) => {
        if (shouldShow) {
          // Biraz gecikme ile göster, dashboard yüklendikten sonra
          setTimeout(() => setShowReviewModal(true), 2000);
        }
      });
    }
  }, []);

  const handleReviewNow = async () => {
    setShowReviewModal(false);
    await requestReview();
  };

  const handleReviewLater = () => {
    setShowReviewModal(false);
    // Tekrar sorulsun diye işaretlemiyoruz
  };

  const handleReviewNever = async () => {
    setShowReviewModal(false);
    await setSetting('review_prompted', 'true');
  };

  const loadDashboard = async () => {
    try {
      const total = await getMonthlyTotal();
      const subs = await getSubscriptionCount();
      const cats = await getCategoryDistribution();
      const weekly = await getWeeklyTrend();
      const recent = await getRecentTransactions(5);
      const currency = await getSetting("currency");

      const today = new Date().getDate();
      setMonthlyTotal(total);
      setSubscriptionCount(subs);
      setDailyAverage(today > 0 ? total / today : 0);
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

      const payDist = await getPaymentMethodDistribution();
      setPaymentDistribution(payDist);
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
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.totalCard}
      >
        <View style={styles.totalHeader}>
          <Ionicons name="wallet-outline" size={18} color="#fff" />
          <Text style={styles.totalLabel}>{t('home.totalSpending')}</Text>
        </View>
        <Text style={styles.totalAmount}>{currSymbol}{formatNumber(monthlyTotal, 2)}</Text>
        <View style={styles.totalFooter}>
          <Ionicons name="trending-up-outline" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.totalSubText}>{t('home.includingSubs')}</Text>
        </View>

        {budgetInfo && (
          <View style={{ marginTop: 12 }}>
            <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 6, overflow: "hidden" }}>
              <View style={{
                width: `${budgetInfo.budget > 0 ? Math.min((budgetInfo.actual / budgetInfo.budget) * 100, 100) : 0}%`,
                height: "100%",
                backgroundColor: budgetInfo.actual > budgetInfo.budget ? "#fca5a5" : "rgba(255,255,255,0.8)",
                borderRadius: 6,
              }} />
            </View>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>
              {budgetInfo.actual > budgetInfo.budget
                ? t('budget.exceeded')
                : `${t('budget.remaining')} ${currSymbol}${formatNumber(budgetInfo.budget - budgetInfo.actual, 2)}`
              }
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.push('/budget')}
          style={{ marginTop: budgetInfo ? 8 : 12, flexDirection: "row", alignItems: "center" }}
        >
          <Ionicons name="wallet-outline" size={14} color="rgba(255,255,255,0.8)" />
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginLeft: 6, fontWeight: "600" }}>
            {budgetInfo ? t('budget.editBudget') : t('budget.setBudgetAction')}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats Row */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 16, alignItems: "center", justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="card-outline" size={20} color={colors.primary} />
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>{subscriptionCount}</Text>
          </View>
          <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: "500", marginTop: 4 }}>{t('home.activeSubscriptions')}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 16, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="analytics-outline" size={18} color={colors.primary} style={{ marginBottom: 6 }} />
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>{currSymbol}{formatNumber(dailyAverage, 2)}</Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: "500", marginTop: 2 }}>{t('home.dailyAverage')}</Text>
        </View>
      </View>

      {/* Payment Method Distribution */}
      {paymentDistribution.length > 0 && (() => {
        const cashTotal = paymentDistribution.find(p => p.method === "cash")?.total ?? 0;
        const debitTotal = paymentDistribution.find(p => p.method === "debit_card")?.total ?? 0;
        const cardTotal = paymentDistribution.find(p => p.method === "credit_card")?.total ?? 0;
        const payTotal = cashTotal + debitTotal + cardTotal;
        const methods = [
          { label: t('home.cashSpending'), icon: "cash-outline" as const, amount: cashTotal, color: colors.primary, bg: colors.primary + "15" },
          { label: t('home.debitSpending'), icon: "wallet-outline" as const, amount: debitTotal, color: colors.warning, bg: colors.warning + "15" },
          { label: t('home.cardSpending'), icon: "card-outline" as const, amount: cardTotal, color: colors.purple, bg: colors.purple + "15" },
        ];
        return (
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginBottom: 12 }}>
            {methods.map((m, i) => {
              const pct = payTotal > 0 ? (m.amount / payTotal) * 100 : 0;
              return (
                <View key={m.label}>
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: m.bg, justifyContent: "center", alignItems: "center" }}>
                      <Ionicons name={m.icon} size={18} color={m.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{m.label}</Text>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{currSymbol}{formatNumber(m.amount, 2)}</Text>
                      </View>
                      <View style={{ height: 5, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
                        <View style={{ width: `${Math.min(pct, 100)}%`, height: "100%", backgroundColor: m.color, borderRadius: 3 }} />
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginLeft: 10, minWidth: 32, textAlign: "right" }}>
                      {payTotal > 0 ? `%${Math.round(pct)}` : ''}
                    </Text>
                  </View>
                  {i < methods.length - 1 && <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 50 }} />}
                </View>
              );
            })}
          </View>
        );
      })()}

      {/* Quick Actions */}
      <View style={styles.largeCard}>
        <Text style={styles.cardTitle}>{t('home.quickActions')}</Text>
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

      {/* Monthly Comparison */}
      {comparison && (comparison.thisMonth > 0 || comparison.lastMonth > 0) && (
        <View style={styles.largeCard}>
          <Text style={styles.cardTitle}>{t('home.monthlyComparison')}</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.primaryLight, borderRadius: 14, padding: 14, marginRight: 6 }}>
              <Text style={{ fontSize: 12, color: colors.primaryLightText, fontWeight: "500" }}>{t('home.thisMonth')}</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.primaryLightText, marginTop: 4 }}>
                {currSymbol}{formatNumber(comparison.thisMonth, 2)}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: 14, padding: 14, marginLeft: 6 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "500" }}>{t('home.lastMonth')}</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 4 }}>
                {currSymbol}{formatNumber(comparison.lastMonth, 2)}
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
            barColor={colors.primary}
            barColorActive={colors.primaryDark}
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
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{dateStr} - {cat.label}</Text>
                    <Ionicons
                      name={tx.paymentMethod === "credit_card" ? "card" : tx.paymentMethod === "debit_card" ? "wallet" : "cash-outline"}
                      size={12}
                      color={tx.paymentMethod === "credit_card" ? colors.purple : tx.paymentMethod === "debit_card" ? colors.warning : colors.primary}
                    />
                    {(tx.paymentMethod === "credit_card" || tx.paymentMethod === "debit_card") && tx.bankName ? (
                      <Text style={{ fontSize: 10, color: tx.paymentMethod === "credit_card" ? colors.purple : colors.warning, fontWeight: "500" }}>{tx.bankName}</Text>
                    ) : null}
                  </View>
                  {tx.notes ? <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>{tx.notes}</Text> : null}
                  {tx.receiptUri ? (
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                      <Ionicons name="receipt-outline" size={11} color={colors.primary} />
                      <Text style={{ fontSize: 10, color: colors.primary, marginLeft: 3 }}>{t('home.receiptAttached')}</Text>
                    </View>
                  ) : null}
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
                <Text style={{ fontWeight: "700", marginRight: 10, color: colors.text }}>{currSymbol}{formatNumber(tx.amount, 2)}</Text>
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

    {/* Review Popup Modal */}
    <Modal
      visible={showReviewModal}
      transparent
      animationType="fade"
      onRequestClose={handleReviewLater}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 28, width: "100%", maxWidth: 340, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 }}>
          {/* Star icon */}
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.purple + "20", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 32 }}>⭐</Text>
          </View>

          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, textAlign: "center", marginBottom: 10 }}>
            {t('review.title')}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 24 }}>
            {t('review.message')}
          </Text>

          {/* Rate Now Button */}
          <TouchableOpacity
            onPress={handleReviewNow}
            style={{ backgroundColor: colors.purple, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, width: "100%", alignItems: "center", marginBottom: 10 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{t('review.rateNow')}</Text>
          </TouchableOpacity>

          {/* Maybe Later Button */}
          <TouchableOpacity
            onPress={handleReviewLater}
            style={{ backgroundColor: colors.surfaceSecondary, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, width: "100%", alignItems: "center", marginBottom: 8 }}
          >
            <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>{t('review.later')}</Text>
          </TouchableOpacity>

          {/* No Thanks Button */}
          <TouchableOpacity onPress={handleReviewNever}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{t('review.noThanks')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </SafeAreaView>
  );
}
