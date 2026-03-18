import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  deleteBudget,
  getBudgetVsActual,
  getCurrencySymbol,
  getSetting,
  setBudget,
} from "../database/db";
import { createStyles } from "../styles/budget";
import { useAppTheme } from '@/hooks/use-app-theme';

const CATEGORIES = [
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

export default function BudgetScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [currSymbol, setCurrSymbol] = useState("₺");
  const [overallAmount, setOverallAmount] = useState("");
  const [categoryAmounts, setCategoryAmounts] = useState<Record<string, string>>({});
  const [budgetData, setBudgetData] = useState<{
    overall: { budget: number; actual: number } | null;
    categories: { category: string; budget: number; actual: number }[];
  }>({ overall: null, categories: [] });

  const currentMonth = new Date().toISOString().slice(0, 7);

  const loadData = async () => {
    const currency = await getSetting("currency");
    setCurrSymbol(getCurrencySymbol(currency ?? "TRY"));
    const data = await getBudgetVsActual(currentMonth);
    setBudgetData(data);
    if (data.overall) { setOverallAmount(data.overall.budget.toString()); }
    const catMap: Record<string, string> = {};
    for (const cat of data.categories) { catMap[cat.category] = cat.budget.toString(); }
    setCategoryAmounts(catMap);
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveOverallBudget = async () => {
    const parsed = parseFloat(overallAmount.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert(t("common.error"), t("budget.validAmount"));
      return;
    }
    await setBudget({ id: `overall_${currentMonth}`, type: "overall", category: null, amount: parsed, month: currentMonth });
    Alert.alert(t("common.success"), t("budget.saved"));
    loadData();
  };

  const saveCategoryBudget = async (categoryKey: string) => {
    const val = categoryAmounts[categoryKey];
    if (!val || val.trim() === "") {
      await deleteBudget(`cat_${categoryKey}_${currentMonth}`);
      loadData();
      return;
    }
    const parsed = parseFloat(val.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert(t("common.error"), t("budget.validAmount"));
      return;
    }
    await setBudget({ id: `cat_${categoryKey}_${currentMonth}`, type: "category", category: categoryKey, amount: parsed, month: currentMonth });
    loadData();
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 0.9) return colors.danger;
    if (percent >= 0.7) return colors.warning;
    return colors.primary;
  };

  const getCategoryActual = (key: string): number => budgetData.categories.find((c) => c.category === key)?.actual ?? 0;
  const getCategoryBudget = (key: string): number => budgetData.categories.find((c) => c.category === key)?.budget ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t("budget.title")}</Text>
            <Text style={styles.subtitle}>{t("budget.subtitle")}</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.overallCard}>
          <Text style={styles.overallLabel}>{t("budget.monthlyBudget")}</Text>
          <View style={styles.overallInputRow}>
            <Text style={styles.overallCurrency}>{currSymbol}</Text>
            <TextInput style={styles.overallInput} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="rgba(255,255,255,0.5)" value={overallAmount} onChangeText={setOverallAmount} />
            <TouchableOpacity style={styles.overallSave} onPress={saveOverallBudget}>
              <Ionicons name="checkmark" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          {budgetData.overall && (
            <View style={{ marginTop: 14 }}>
              <View style={[styles.progressBar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <View style={[styles.progressFill, {
                  width: `${budgetData.overall.budget > 0 ? Math.min((budgetData.overall.actual / budgetData.overall.budget) * 100, 100) : 0}%`,
                  backgroundColor: budgetData.overall.actual > budgetData.overall.budget ? "#fca5a5" : "rgba(255,255,255,0.8)",
                }]} />
              </View>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 6 }}>
                {t("budget.spent")} {currSymbol}{budgetData.overall.actual.toFixed(0)} / {currSymbol}{budgetData.overall.budget.toFixed(0)}
                {budgetData.overall.actual > budgetData.overall.budget
                  ? ` - ${t("budget.exceeded")}` : ` - ${t("budget.remaining")} ${currSymbol}${(budgetData.overall.budget - budgetData.overall.actual).toFixed(0)}`}
              </Text>
            </View>
          )}
        </LinearGradient>

        <Text style={styles.sectionTitle}>{t("budget.categoryLimits")}</Text>
        {CATEGORIES.map((cat) => {
          const actual = getCategoryActual(cat.key);
          const budget = getCategoryBudget(cat.key);
          const percent = budget > 0 ? actual / budget : 0;

          return (
            <View key={cat.key} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryName}>{t(`categories.${cat.key}`)}</Text>
                <TextInput
                  style={styles.categoryInput}
                  keyboardType="decimal-pad"
                  placeholder={t("budget.noLimit")}
                  placeholderTextColor={colors.placeholder}
                  value={categoryAmounts[cat.key] ?? ""}
                  onChangeText={(v) => setCategoryAmounts((prev) => ({ ...prev, [cat.key]: v }))}
                  onBlur={() => saveCategoryBudget(cat.key)}
                />
                <TouchableOpacity style={styles.saveCategoryButton} onPress={() => saveCategoryBudget(cat.key)}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {budget > 0 && (
                <>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(percent * 100, 100)}%`, backgroundColor: getProgressColor(percent) }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {currSymbol}{actual.toFixed(0)} / {currSymbol}{budget.toFixed(0)} ({Math.round(percent * 100)}%)
                  </Text>
                </>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
