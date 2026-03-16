import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { randomUUID } from "expo-crypto";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { addInstallment, deleteInstallment, formatNumber, getAllInstallments, getCurrencySymbol, getSetting, InstallmentItem, updateInstallmentPaid } from "../database/db";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function InstallmentsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [installments, setInstallments] = useState<InstallmentItem[]>([]);
  const [currSymbol, setCurrSymbol] = useState("₺");
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentCount, setInstallmentCount] = useState("");
  const [bankName, setBankName] = useState("");

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

  const handleAmountChange = useCallback((text: string) => {
    if (text === "") { setTotalAmount(""); return; }
    setTotalAmount(formatAmountDisplay(text));
  }, [formatAmountDisplay]);

  const parseAmount = useCallback((formatted: string): number => {
    return parseFloat(formatted.replace(/\./g, "").replace(",", "."));
  }, []);

  const load = async () => {
    const data = await getAllInstallments();
    setInstallments(data);
    const currency = await getSetting("currency");
    setCurrSymbol(getCurrencySymbol(currency ?? "TRY"));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!title.trim() || !totalAmount || !installmentCount) {
      Alert.alert(t("common.error"), t("installments.fillAllFields"));
      return;
    }
    const total = parseAmount(totalAmount);
    const count = parseInt(installmentCount, 10);
    if (isNaN(total) || isNaN(count) || count <= 0) return;

    await addInstallment({
      id: randomUUID(),
      title: title.trim(),
      totalAmount: total,
      installmentCount: count,
      paidCount: 0,
      monthlyAmount: total / count,
      startDate: new Date().toISOString(),
      bankName: bankName.trim() || undefined,
    });

    setTitle(""); setTotalAmount(""); setInstallmentCount(""); setBankName("");
    setShowModal(false);
    load();
  };

  const handleMarkPaid = async (item: InstallmentItem) => {
    if (item.paidCount >= item.installmentCount) return;
    await updateInstallmentPaid(item.id);
    load();
  };

  const handleDelete = (item: InstallmentItem) => {
    Alert.alert(t("common.delete"), t("common.deleteConfirm", { name: item.title }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: async () => { await deleteInstallment(item.id); load(); } },
    ]);
  };

  const active = installments.filter(i => i.paidCount < i.installmentCount);
  const completed = installments.filter(i => i.paidCount >= i.installmentCount);
  const totalRemaining = active.reduce((s, i) => s + (i.totalAmount - (i.monthlyAmount * i.paidCount)), 0);
  const monthlyTotal = active.reduce((s, i) => s + i.monthlyAmount, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="close" size={24} color={colors.icon} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>{t("installments.title")}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{t("installments.subtitle")}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t("installments.totalDebt")}</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.danger, marginTop: 4 }}>{currSymbol}{formatNumber(totalRemaining)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t("installments.monthlyPayment")}</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 4 }}>{currSymbol}{formatNumber(monthlyTotal)}</Text>
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 20 }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>{t("installments.addNew")}</Text>
        </TouchableOpacity>

        {/* Active */}
        {active.map(item => {
          const progress = item.installmentCount > 0 ? (item.paidCount / item.installmentCount) * 100 : 0;
          return (
            <View key={item.id} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Ionicons name="card-outline" size={20} color={colors.purple} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", fontSize: 15, color: colors.text }}>{item.title}</Text>
                  {item.bankName ? <Text style={{ fontSize: 11, color: colors.purple }}>{item.bankName}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t("installments.remaining", { paid: item.paidCount, total: item.installmentCount })}</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{currSymbol}{formatNumber(item.monthlyAmount)}/{t("common.monthly").toLowerCase()}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
                <View style={{ width: `${progress}%`, height: "100%", backgroundColor: colors.primary, borderRadius: 8 }} />
              </View>
              <TouchableOpacity
                onPress={() => handleMarkPaid(item)}
                style={{ backgroundColor: colors.primaryLight, borderRadius: 10, paddingVertical: 8, alignItems: "center" }}
              >
                <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>{t("installments.markPaid")}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textSecondary, marginTop: 16, marginBottom: 10 }}>{t("installments.completed")}</Text>
            {completed.map(item => (
              <View key={item.id} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 8, opacity: 0.6, flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: colors.text }}>{item.title}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>{currSymbol}{formatNumber(item.totalAmount)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {installments.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 40 }}>💳</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>{t("installments.noInstallments")}</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 16 }}>{t("installments.addNew")}</Text>
            <TextInput
              placeholder={t("installments.productName")}
              placeholderTextColor={colors.placeholder}
              value={title} onChangeText={setTitle}
              style={{ backgroundColor: colors.inputBg, borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: colors.border, color: colors.text, marginBottom: 10 }}
            />
            <TextInput
              placeholder={t("installments.totalAmount")}
              placeholderTextColor={colors.placeholder}
              value={totalAmount} onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              style={{ backgroundColor: colors.inputBg, borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: colors.border, color: colors.text, marginBottom: 10 }}
            />
            <TextInput
              placeholder={t("installments.numberOfInstallments")}
              placeholderTextColor={colors.placeholder}
              value={installmentCount} onChangeText={setInstallmentCount}
              keyboardType="number-pad"
              style={{ backgroundColor: colors.inputBg, borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: colors.border, color: colors.text, marginBottom: 10 }}
            />
            <TextInput
              placeholder={t("installments.bankNamePlaceholder")}
              placeholderTextColor={colors.placeholder}
              value={bankName} onChangeText={setBankName}
              style={{ backgroundColor: colors.inputBg, borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: colors.border, color: colors.text, marginBottom: 16 }}
            />
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
