import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import {
  deleteTransaction,
  getBudgetVsActual,
  getCategoryDistribution,
  getCurrencySymbol,
  getMonthlyTotal,
  getRecentTransactions,
  getSetting,
  getSubscriptionCount,
  getWeeklyTrend,
  TransactionItem,
} from "../../database/db";

import { styles } from "../../styles";

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍔", transport: "🚗", fun: "🎮", shopping: "🛍️",
  bills: "📄", health: "💊", education: "📚", tech: "💻", other: "📌",
};

function getShortDayName(dayIndex: number, locale: string): string {
  const refDate = new Date(2024, 0, 7 + dayIndex); // Jan 7, 2024 is Sunday
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(refDate);
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();

  /* -------------------- */
  /* STATE                */
  /* -------------------- */
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);

  const [categories, setCategories] = useState<
    { category: string; total: number }[]
  >([]);

  const [weeklyTrend, setWeeklyTrend] = useState<
    { day: string; total: number }[]
  >([]);

  const [currSymbol, setCurrSymbol] = useState("₺");
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
  const [budgetInfo, setBudgetInfo] = useState<{ budget: number; actual: number } | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<Map<string, { budget: number; actual: number }>>(new Map());

  /* -------------------- */
  /* DATA LOAD            */
  /* -------------------- */
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
    } catch (error) {
      console.error("Dashboard load error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  /* -------------------- */
  /* UI                  */
  /* -------------------- */
  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#fff'}} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>Subtrack AI</Text>
          <Text style={styles.date}>
            {new Intl.DateTimeFormat(i18n.language, {
              day: 'numeric',
              month: 'long',
              weekday: 'long',
            }).format(new Date())}
          </Text>
        </View>
        <Ionicons name="notifications-outline" size={22} color="#374151" />
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
            <Ionicons name="card-outline" size={18} color="#6b7280" />
          </View>
          <Text style={styles.statValue}>{subscriptionCount}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>{t('home.dailyAverage')}</Text>
            <Ionicons name="analytics-outline" size={18} color="#6b7280" />
          </View>
          <Text style={styles.statValue}>{currSymbol}{dailyAverage.toFixed(0)}</Text>
        </View>
      </View>

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

            return categories.map((item) => {
              const percent = total > 0 ? item.total / total : 0;
              const cat = {
                icon: CATEGORY_ICONS[item.category] || "📌",
                label: t(`categories.${item.category}`, { defaultValue: item.category }),
              };
              const catBudget = categoryBudgets.get(item.category);
              const budgetPercent = catBudget ? item.total / catBudget.budget : 0;
              const budgetColor = budgetPercent >= 0.9 ? "#ef4444" : budgetPercent >= 0.7 ? "#f59e0b" : "#22c55e";

              return (
                <View
                  key={item.category}
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", marginBottom: 8 }}>
                    <Text style={{ fontSize: 20, marginRight: 10 }}>
                      {cat.icon}
                    </Text>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600" }}>
                        {cat.label}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#6b7280" }}>
                        {t('home.percentThisMonth', { percent: Math.round(percent * 100) })}
                        {catBudget ? ` · ${currSymbol}${catBudget.budget.toFixed(0)} ${t('budget.limit')}` : ''}
                      </Text>
                    </View>

                    <Text style={{ fontWeight: "700" }}>
                      {currSymbol}{item.total.toFixed(0)}
                    </Text>
                  </View>

                  <View
                    style={{
                      height: 6,
                      backgroundColor: "#e5e7eb",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.min((catBudget ? budgetPercent : percent) * 100, 100)}%`,
                        height: "100%",
                        backgroundColor: catBudget ? budgetColor : "#22c55e",
                      }}
                    />
                  </View>
                </View>
              );
            });
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
          (() => {
            const max = Math.max(...weeklyTrend.map((d) => d.total), 1);
            const todayIndex = new Date().getDay();

            return (
              <View style={{ marginTop: 16 }}>
                {weeklyTrend.map((item, index) => {
                  const percent = item.total / max;
                  const isToday = Number(item.day) === todayIndex;

                  return (
                    <View
                      key={index}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 10,
                        opacity: item.total === 0 ? 0.4 : 1,
                      }}
                    >
                      <Text style={{ width: 36, fontSize: 12 }}>
                        {getShortDayName(Number(item.day), i18n.language)}
                      </Text>

                      <View
                        style={{
                          flex: 1,
                          height: 8,
                          backgroundColor: "#e5e7eb",
                          borderRadius: 6,
                          marginHorizontal: 8,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: `${percent * 100}%`,
                            height: "100%",
                            backgroundColor: isToday
                              ? "#16a34a"
                              : "#22c55e",
                          }}
                        />
                      </View>

                      <Text
                        style={{
                          width: 60,
                          textAlign: "right",
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {currSymbol}{item.total.toFixed(0)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })()
        )}
      </View>

      {/* Recent Transactions */}
      <View style={styles.largeCard}>
        <Text style={styles.cardTitle}>{t('home.recentTransactions')}</Text>

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
              <View
                key={tx.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#f9fafb",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 10 }}>{cat.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600" }}>{tx.title}</Text>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>{dateStr} - {cat.label}</Text>
                  {tx.notes ? <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }} numberOfLines={1}>{tx.notes}</Text> : null}
                </View>
                <Text style={{ fontWeight: "700", marginRight: 10 }}>
                  {currSymbol}{tx.amount.toFixed(2)}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      t('home.deleteTransaction'),
                      t('common.deleteConfirm', { name: tx.title }),
                      [
                        { text: t('common.cancel'), style: "cancel" },
                        {
                          text: t('common.delete'),
                          style: "destructive",
                          onPress: async () => {
                            await deleteTransaction(tx.id);
                            loadDashboard();
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      {/* Ad */}
      <View style={styles.adArea}>
        <Text style={styles.adTitle}>{t('common.adArea')}</Text>
        <Text style={styles.adSubtitle}>{t('common.adBanner')}</Text>
      </View>
    </ScrollView>
  </SafeAreaView>
  );
}
