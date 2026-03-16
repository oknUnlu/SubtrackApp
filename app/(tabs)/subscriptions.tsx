import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';

import {
  addSubscription,
  deleteSubscription,
  getCurrencySymbol,
  getSetting,
  getSubscriptions,
  getTransactions,
  SubscriptionItem,
  updateSubscription,
} from "../../database/db";
import { createStyles } from "../../styles/subscriptions";
import { detectRecurringExpenses, RecurringPattern } from "../../utils/recurringDetection";
import { scheduleSubscriptionReminder, cancelSubscriptionReminder } from "../../utils/notifications";
import { useAppTheme } from '@/hooks/use-app-theme';

const OTHER_KEY = "__other__";

export default function SubscriptionsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const presetSubscriptions = [
    "Netflix", "Spotify", "YouTube Premium", "Amazon Prime",
    "Apple Music", "Disney+", "BluTV", "Exxen", OTHER_KEY,
  ];

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [currSymbol, setCurrSymbol] = useState("₺");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("Netflix");
  const [title, setTitle] = useState("Netflix");
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [nextDate, setNextDate] = useState("");
  const [nextDateObj, setNextDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recurring, setRecurring] = useState<RecurringPattern[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const loadSubscriptions = async () => {
    const data = await getSubscriptions();
    setSubscriptions(data);
    const currency = await getSetting("currency");
    setCurrSymbol(getCurrencySymbol(currency ?? "TRY"));

    let monthly = 0;
    let yearly = 0;
    data.forEach((sub) => {
      if (sub.interval === "monthly") { monthly += sub.amount; yearly += sub.amount * 12; }
      else { yearly += sub.amount; monthly += sub.amount / 12; }
    });
    setMonthlyTotal(monthly);
    setYearlyTotal(yearly);

    const allTx = await getTransactions();
    const existingTitles = new Set(data.map(s => s.title.toLowerCase()));
    const detected = detectRecurringExpenses(allTx).filter(r => !existingTitles.has(r.title.toLowerCase()));
    setRecurring(detected);
  };

  useFocusEffect(useCallback(() => { loadSubscriptions(); }, []));

  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setAmount("");
    setInterval("monthly");
    setSelectedPreset("Netflix");
    setTitle("Netflix");
    setNextDate("");
    setNextDateObj(new Date());
    setShowDatePicker(false);
  };

  const openEditModal = (sub: SubscriptionItem) => {
    setEditingId(sub.id);
    setTitle(sub.title);
    setAmount(sub.amount.toString());
    setInterval(sub.interval as "monthly" | "yearly");
    setNextDate(sub.nextDate ?? "");
    if (sub.nextDate) {
      const parsed = new Date(sub.nextDate);
      if (!isNaN(parsed.getTime())) setNextDateObj(parsed);
    }
    const isPreset = presetSubscriptions.includes(sub.title);
    setSelectedPreset(isPreset ? sub.title : OTHER_KEY);
    setShowModal(true);
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      setNextDateObj(selectedDate);
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      setNextDate(`${y}-${m}-${d}`);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !amount) {
      Alert.alert(t('common.error'), t('subscriptions.fillAllFields'));
      return;
    }
    const parsedAmount = Number(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('subscriptions.validAmount'));
      return;
    }

    const subId = editingId || Date.now().toString();
    const subItem: SubscriptionItem = {
      id: subId, title: title.trim(), amount: parsedAmount, interval,
      nextDate: nextDate || undefined,
    };

    if (editingId) { await updateSubscription(subItem); }
    else { await addSubscription(subItem); }

    if (nextDate) {
      const daysSetting = await getSetting("reminderDaysBefore");
      const daysBefore = daysSetting ? parseInt(daysSetting, 10) : 1;
      await scheduleSubscriptionReminder(subId, title.trim(), parsedAmount, nextDate, daysBefore, currSymbol);
    } else {
      await cancelSubscriptionReminder(subId);
    }

    resetForm();
    loadSubscriptions();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('subscriptions.title')}</Text>
            <Text style={styles.subtitle}>{t('subscriptions.activeCount', { count: subscriptions.length })}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.label}>{t('subscriptions.monthlyTotal')}</Text>
            <Text style={styles.amount}>{currSymbol}{monthlyTotal.toFixed(2)}</Text>
          </View>
          <View>
            <Text style={styles.label}>{t('subscriptions.yearlyTotal')}</Text>
            <Text style={styles.amount}>{currSymbol}{yearlyTotal.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setShowModal(true); }}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>{t('subscriptions.addNew')}</Text>
        </TouchableOpacity>

        {subscriptions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="card-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{t('subscriptions.noSubscriptions')}</Text>
            <Text style={styles.emptyText}>{t('subscriptions.trackTip')}</Text>
          </View>
        ) : (
          subscriptions.map((sub) => (
            <View key={sub.id} style={styles.subCard}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.subCardTitle}>{sub.title}</Text>
                  {sub.nextDate ? <Ionicons name="notifications" size={14} color={colors.primary} style={{ marginLeft: 6 }} /> : null}
                </View>
                <Text style={styles.subCardInterval}>
                  {sub.interval === "monthly" ? t('common.monthly') : t('common.yearly')}
                  {sub.nextDate ? ` · ${t('subscriptions.renews')} ${sub.nextDate}` : ''}
                </Text>
              </View>
              <Text style={styles.subCardAmount}>{currSymbol}{sub.amount.toFixed(2)}</Text>
              <TouchableOpacity onPress={() => openEditModal(sub)} style={{ marginRight: 10 }}>
                <Ionicons name="pencil-outline" size={20} color={colors.iconSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(t('subscriptions.deleteSubscription'), t('common.deleteConfirm', { name: sub.title }), [
                    { text: t('common.cancel'), style: "cancel" },
                    { text: t('common.delete'), style: "destructive", onPress: async () => { await deleteSubscription(sub.id); loadSubscriptions(); } },
                  ]);
                }}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Detected Recurring */}
        {recurring.filter(r => !dismissed.has(r.title)).length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Ionicons name="repeat-outline" size={20} color={colors.purple} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginLeft: 8 }}>
                {t('subscriptions.detectedRecurring')}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
              {t('subscriptions.detectedRecurringDesc')}
            </Text>
            {recurring.filter(r => !dismissed.has(r.title)).map((r) => (
              <View key={r.title} style={{ backgroundColor: colors.purpleBg, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.purpleBorder }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", fontSize: 15, color: colors.text }}>{r.title}</Text>
                    <Text style={{ fontSize: 12, color: colors.purple, marginTop: 2 }}>
                      {t('subscriptions.occurredTimes', { count: r.occurrences })} · ~{r.avgIntervalDays} {t('subscriptions.daysInterval')}
                    </Text>
                  </View>
                  <Text style={{ fontWeight: "700", fontSize: 16, color: colors.purple }}>{currSymbol}{r.amount.toFixed(2)}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: colors.purple, borderRadius: 10, paddingVertical: 8, alignItems: "center" }}
                    onPress={async () => {
                      await addSubscription({ id: Date.now().toString(), title: r.title, amount: r.amount, interval: "monthly" });
                      loadSubscriptions();
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>{t('subscriptions.addAsSubscription')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.surfaceSecondary, borderRadius: 10, alignItems: "center" }}
                    onPress={() => setDismissed(prev => new Set(prev).add(r.title))}
                  >
                    <Text style={{ color: colors.textSecondary, fontWeight: "500", fontSize: 13 }}>{t('subscriptions.dismiss')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? t('subscriptions.editSubscription') : t('subscriptions.newSubscription')}
            </Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedPreset}
                onValueChange={(value) => {
                  setSelectedPreset(value);
                  if (value === OTHER_KEY) { setTitle(""); } else { setTitle(value); }
                }}
                style={{ color: colors.text }}
              >
                {presetSubscriptions.map((item) => (
                  <Picker.Item key={item} label={item === OTHER_KEY ? t('categories.other') : item} value={item} />
                ))}
              </Picker>
            </View>
            <TextInput placeholder={t('subscriptions.namePlaceholder')} value={title} editable={selectedPreset === OTHER_KEY} onChangeText={setTitle} style={styles.input} placeholderTextColor={colors.placeholder} />
            <TextInput placeholder={t('subscriptions.amountPlaceholder', { symbol: currSymbol })} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} style={styles.input} placeholderTextColor={colors.placeholder} />

            <View style={styles.intervalRow}>
              {["monthly", "yearly"].map((i) => (
                <TouchableOpacity key={i} onPress={() => setInterval(i as "monthly" | "yearly")}
                  style={[styles.intervalButton, { backgroundColor: interval === i ? colors.primary : colors.chipBg }]}
                >
                  <Text style={[styles.intervalButtonText, { color: interval === i ? "#fff" : colors.text }]}>
                    {i === "monthly" ? t('common.monthly') : t('common.yearly')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 12, marginBottom: 4 }}>
              {t('subscriptions.nextRenewal')}
            </Text>
            <TouchableOpacity
              style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: nextDate ? colors.text : colors.placeholder, fontSize: 14 }}>
                {nextDate || t('subscriptions.selectDate')}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.iconSecondary} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={nextDateObj}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                onChange={onDateChange}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={resetForm} style={styles.modalActionButton}>
                <Text style={{ textAlign: "center", color: colors.textSecondary }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.modalActionButton}>
                <Text style={{ textAlign: "center", color: colors.primary, fontWeight: "700" }}>
                  {editingId ? t('common.update') : t('common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
