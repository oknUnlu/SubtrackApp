import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  getBudgetVsActual,
  getCategoryDistribution,
  getMonthlyComparison,
  getMonthlyTotal,
  getSubscriptions,
  getTransactions,
} from "../../database/db";
import { generateAllInsights, Insight } from "../../utils/analysis";
import { styles } from "../../styles/ai";

const INSIGHT_COLORS: Record<string, { border: string; bg: string; icon: string }> = {
  warning: { border: "#f59e0b", bg: "#fffbeb", icon: "#f59e0b" },
  tip: { border: "#22c55e", bg: "#f0fdf4", icon: "#22c55e" },
  info: { border: "#3b82f6", bg: "#eff6ff", icon: "#3b82f6" },
  achievement: { border: "#8b5cf6", bg: "#f5f3ff", icon: "#8b5cf6" },
};

export default function AIAnalysisScreen() {
  const { t } = useTranslation();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(true);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const [transactions, subscriptions, categories, monthlyTotal, comparison, budgetData] =
        await Promise.all([
          getTransactions(),
          getSubscriptions(),
          getCategoryDistribution(),
          getMonthlyTotal(),
          getMonthlyComparison(),
          getBudgetVsActual(),
        ]);

      if (transactions.length === 0) {
        setHasData(false);
        setInsights([]);
        setLoading(false);
        return;
      }

      setHasData(true);
      const result = generateAllInsights({
        transactions,
        subscriptions,
        categories,
        monthlyTotal,
        comparison,
        budgetData,
      });
      setInsights(result);
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      runAnalysis();
    }, [])
  );

  const renderInsight = (insight: Insight, index: number) => {
    const colors = INSIGHT_COLORS[insight.type] || INSIGHT_COLORS.info;

    const params = { ...insight.descriptionParams };
    if (params.category && typeof params.category === "string") {
      params.category = t(`categories.${params.category}`, { defaultValue: String(params.category) });
    }
    if (params.day && typeof params.day === "string") {
      params.day = t(`ai.days.${params.day}`, { defaultValue: String(params.day) });
    }

    return (
      <View
        key={index}
        style={{
          backgroundColor: colors.bg,
          borderLeftWidth: 4,
          borderLeftColor: colors.border,
          borderRadius: 14,
          padding: 16,
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Ionicons
            name={insight.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={colors.icon}
          />
          <Text style={{ fontWeight: "700", fontSize: 15, marginLeft: 8, color: "#222", flex: 1 }}>
            {t(insight.titleKey)}
          </Text>
        </View>
        <Text style={{ color: "#4b5563", lineHeight: 20 }}>
          {t(insight.descriptionKey, params)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f7f9" }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t("ai.title")}</Text>
            <Text style={styles.subtitle}>{t("ai.subtitle")}</Text>
          </View>
          <Ionicons name="analytics-outline" size={22} color="#222" />
        </View>

        <LinearGradient
          colors={["#7c3aed", "#9333ea"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.brainWrapper}>
            <Ionicons name="sparkles-outline" size={36} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>{t("ai.heroTitle")}</Text>
          <Text style={styles.heroText}>{t("ai.heroTextLocal")}</Text>
        </LinearGradient>

        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={runAnalysis}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="sparkles-outline" size={20} color="#fff" />
              <Text style={styles.analyzeButtonText}>{t("ai.refreshAnalysis")}</Text>
            </>
          )}
        </TouchableOpacity>

        {loading && (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <Text style={{ color: "#6b7280" }}>{t("ai.analyzing")}</Text>
          </View>
        )}

        {!loading && !hasData && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
            <Text style={{ color: "#6b7280", fontSize: 16, textAlign: "center" }}>
              {t("ai.noDataYet")}
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 14, marginTop: 4, textAlign: "center" }}>
              {t("ai.addExpensesFirst")}
            </Text>
          </View>
        )}

        {!loading && hasData && insights.length > 0 && (
          <View style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
              {t("ai.insightsCount", { count: insights.length })}
            </Text>
            {insights.map(renderInsight)}
          </View>
        )}

        {!loading && hasData && insights.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <Text style={{ color: "#6b7280" }}>{t("ai.noInsights")}</Text>
          </View>
        )}

        <View style={styles.adArea}>
          <Text style={styles.adTitle}>{t("common.adArea")}</Text>
          <Text style={styles.adSubtitle}>{t("common.adBanner")}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
