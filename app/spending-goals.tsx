import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { randomUUID } from "expo-crypto";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { addSpendingGoal, deleteSpendingGoal, formatNumber, getCurrencySymbol, getSetting, getSpendingGoals, SpendingGoalItem, updateSpendingGoalAmount } from "../database/db";
import { useAppTheme } from "@/hooks/use-app-theme";

const GOAL_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function SpendingGoalsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [goals, setGoals] = useState<SpendingGoalItem[]>([]);
  const [currSymbol, setCurrSymbol] = useState("₺");
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0]);
  const [editingGoal, setEditingGoal] = useState<SpendingGoalItem | null>(null);
  const [addAmount, setAddAmount] = useState("");

  const load = async () => {
    const data = await getSpendingGoals();
    setGoals(data);
    const currency = await getSetting("currency");
    setCurrSymbol(getCurrencySymbol(currency ?? "TRY"));
  };

  const formatAmountDisplay = useCallback((raw: string): string => {
    let cleaned = raw.replace(/[^0-9.,]/g, "");
    const lastSep = Math.max(cleaned.lastIndexOf(","), cleaned.lastIndexOf("."));
    let intPart = cleaned;
    let decPart = "";
    if (lastSep >= 0) {
      const afterSep = cleaned.slice(lastSep + 1);
      if (afterSep.length <= 2) {
        intPart = cleaned.slice(0, lastSep).replace(/[.,]/g, "");
        decPart = afterSep;
      } else {
        intPart = cleaned.replace(/[.,]/g, "");
      }
    }
    intPart = intPart.replace(/^0+(?=\d)/, "");
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (lastSep >= 0 && cleaned.slice(lastSep + 1).length <= 2) {
      return formatted + "," + decPart;
    }
    return formatted;
  }, []);

  const handleTargetAmountChange = useCallback((text: string) => {
    if (text === "") { setTargetAmount(""); return; }
    setTargetAmount(formatAmountDisplay(text));
  }, [formatAmountDisplay]);

  const parseAmount = useCallback((formatted: string): number => {
    return parseFloat(formatted.replace(/\./g, "").replace(",", "."));
  }, []);

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!title.trim() || !targetAmount) {
      Alert.alert(t("common.error"), t("spendingGoals.fillAllFields"));
      return;
    }
    const target = parseAmount(targetAmount);
    if (isNaN(target) || target <= 0) return;

    await addSpendingGoal({
      id: randomUUID(),
      title: title.trim(),
      targetAmount: target,
      currentAmount: 0,
      deadline: deadline || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      color: selectedColor,
    });

    setTitle(""); setTargetAmount(""); setDeadline(""); setSelectedColor(GOAL_COLORS[0]);
    setShowModal(false);
    load();
  };

  const handleAddProgress = async (goal: SpendingGoalItem) => {
    const amt = parseAmount(addAmount);
    if (isNaN(amt) || amt <= 0) return;
    const newAmount = Math.min(goal.currentAmount + amt, goal.targetAmount);
    await updateSpendingGoalAmount(goal.id, newAmount);
    setEditingGoal(null);
    setAddAmount("");
    load();
  };

  const handleDelete = (goal: SpendingGoalItem) => {
    Alert.alert(t("common.delete"), t("common.deleteConfirm", { name: goal.title }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: async () => { await deleteSpendingGoal(goal.id); load(); } },
    ]);
  };

  const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="close" size={24} color={colors.icon} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>{t("spendingGoals.title")}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{t("spendingGoals.subtitle")}</Text>
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 20 }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>{t("spendingGoals.addNew")}</Text>
        </TouchableOpacity>

        {/* Active Goals */}
        {activeGoals.map(goal => {
          const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          const remaining = goal.targetAmount - goal.currentAmount;
          const deadlineDate = new Date(goal.deadline);
          const daysLeft = Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 3600 * 24)));

          return (
            <View key={goal.id} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: goal.color + "20", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                  <Ionicons name="flag" size={18} color={goal.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", fontSize: 16, color: colors.text }}>{goal.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{daysLeft} {t("spendingGoals.daysLeft")}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(goal)}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  {currSymbol}{formatNumber(goal.currentAmount)} / {currSymbol}{formatNumber(goal.targetAmount)}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: goal.color }}>{Math.round(progress)}%</Text>
              </View>

              <View style={{ height: 10, backgroundColor: colors.border, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
                <View style={{ width: `${Math.min(progress, 100)}%`, height: "100%", backgroundColor: goal.color, borderRadius: 8 }} />
              </View>

              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>
                {t("spendingGoals.remaining")}: {currSymbol}{formatNumber(remaining)}
              </Text>

              {editingGoal?.id === goal.id ? (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    placeholder={t("spendingGoals.amount")}
                    placeholderTextColor={colors.placeholder}
                    value={addAmount}
                    onChangeText={setAddAmount}
                    keyboardType="decimal-pad"
                    style={{ flex: 1, backgroundColor: colors.inputBg, borderRadius: 10, padding: 10, fontSize: 14, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                  />
                  <TouchableOpacity
                    onPress={() => handleAddProgress(goal)}
                    style={{ backgroundColor: goal.color, borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setEditingGoal(null); setAddAmount(""); }}
                    style={{ justifyContent: "center", paddingHorizontal: 8 }}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setEditingGoal(goal)}
                  style={{ backgroundColor: goal.color + "15", borderRadius: 10, paddingVertical: 8, alignItems: "center" }}
                >
                  <Text style={{ color: goal.color, fontWeight: "600", fontSize: 13 }}>{t("spendingGoals.addProgress")}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textSecondary, marginTop: 16, marginBottom: 10 }}>{t("spendingGoals.completed")}</Text>
            {completedGoals.map(goal => (
              <View key={goal.id} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 8, opacity: 0.7, flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary + "20", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: colors.text }}>{goal.title}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>{currSymbol}{formatNumber(goal.targetAmount)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(goal)}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {goals.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 40 }}>🎯</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>{t("spendingGoals.noGoals")}</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 16 }}>{t("spendingGoals.addNew")}</Text>
            <TextInput
              placeholder={t("spendingGoals.goalName")}
              placeholderTextColor={colors.placeholder}
              value={title} onChangeText={setTitle}
              style={{ backgroundColor: colors.inputBg, borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: colors.border, color: colors.text, marginBottom: 10 }}
            />
            <TextInput
              placeholder={t("spendingGoals.targetAmountPlaceholder")}
              placeholderTextColor={colors.placeholder}
              value={targetAmount} onChangeText={handleTargetAmountChange}
              keyboardType="decimal-pad"
              style={{ backgroundColor: colors.inputBg, borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: colors.border, color: colors.text, marginBottom: 10 }}
            />
            <TextInput
              placeholder={t("spendingGoals.deadlinePlaceholder")}
              placeholderTextColor={colors.placeholder}
              value={deadline} onChangeText={setDeadline}
              style={{ backgroundColor: colors.inputBg, borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: colors.border, color: colors.text, marginBottom: 12 }}
            />
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>{t("spendingGoals.color")}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              {GOAL_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={{
                    width: 32, height: 32, borderRadius: 16, backgroundColor: c,
                    borderWidth: selectedColor === c ? 3 : 0,
                    borderColor: "#fff",
                  }}
                />
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={{ flex: 1, paddingVertical: 14, alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 14 }}>
                <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={{ flex: 1, paddingVertical: 14, alignItems: "center", backgroundColor: colors.primary, borderRadius: 14 }}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
