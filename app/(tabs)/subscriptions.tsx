import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
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
  SubscriptionItem,
  updateSubscription,
} from "../../database/db";
import { styles } from "../../styles/subscriptions";

const OTHER_KEY = "__other__";

export default function SubscriptionsScreen() {
  const { t } = useTranslation();

  const presetSubscriptions = [
    "Netflix",
    "Spotify",
    "YouTube Premium",
    "Amazon Prime",
    "Apple Music",
    "Disney+",
    "BluTV",
    "Exxen",
    OTHER_KEY,
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

  /* ---------------- LOAD ---------------- */
  const loadSubscriptions = async () => {
    const data = await getSubscriptions();
    setSubscriptions(data);

    const currency = await getSetting("currency");
    setCurrSymbol(getCurrencySymbol(currency ?? "TRY"));

    let monthly = 0;
    let yearly = 0;

    data.forEach((sub) => {
      if (sub.interval === "monthly") {
        monthly += sub.amount;
        yearly += sub.amount * 12;
      } else {
        yearly += sub.amount;
        monthly += sub.amount / 12;
      }
    });

    setMonthlyTotal(monthly);
    setYearlyTotal(yearly);
  };

  useFocusEffect(
    useCallback(() => {
      loadSubscriptions();
    }, [])
  );

  /* ---------------- SAVE ---------------- */
  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setAmount("");
    setInterval("monthly");
    setSelectedPreset("Netflix");
    setTitle("Netflix");
  };

  const openEditModal = (sub: SubscriptionItem) => {
    setEditingId(sub.id);
    setTitle(sub.title);
    setAmount(sub.amount.toString());
    setInterval(sub.interval as "monthly" | "yearly");
    const isPreset = presetSubscriptions.includes(sub.title);
    setSelectedPreset(isPreset ? sub.title : OTHER_KEY);
    setShowModal(true);
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

    if (editingId) {
      await updateSubscription({
        id: editingId,
        title: title.trim(),
        amount: parsedAmount,
        interval,
      });
    } else {
      await addSubscription({
        id: Date.now().toString(),
        title: title.trim(),
        amount: parsedAmount,
        interval,
      });
    }

    resetForm();
    loadSubscriptions();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('subscriptions.title')}</Text>
            <Text style={styles.subtitle}>
              {t('subscriptions.activeCount', { count: subscriptions.length })}
            </Text>
          </View>
          <Ionicons name="notifications-outline" size={22} color="#222" />
        </View>

        {/* Summary */}
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

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => { resetForm(); setShowModal(true); }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>{t('subscriptions.addNew')}</Text>
        </TouchableOpacity>

        {subscriptions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="card-outline" size={40} color="#aaa" />
            <Text style={styles.emptyTitle}>{t('subscriptions.noSubscriptions')}</Text>
            <Text style={styles.emptyText}>
              {t('subscriptions.trackTip')}
            </Text>
          </View>
        ) : (
          subscriptions.map((sub) => (
            <View key={sub.id} style={styles.subCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subCardTitle}>{sub.title}</Text>
                <Text style={styles.subCardInterval}>
                  {sub.interval === "monthly" ? t('common.monthly') : t('common.yearly')}
                </Text>
              </View>
              <Text style={styles.subCardAmount}>
                {currSymbol}{sub.amount.toFixed(2)}
              </Text>
              <TouchableOpacity
                onPress={() => openEditModal(sub)}
                style={{ marginRight: 10 }}
              >
                <Ionicons name="pencil-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    t('subscriptions.deleteSubscription'),
                    t('common.deleteConfirm', { name: sub.title }),
                    [
                      { text: t('common.cancel'), style: "cancel" },
                      {
                        text: t('common.delete'),
                        style: "destructive",
                        onPress: async () => {
                          await deleteSubscription(sub.id);
                          loadSubscriptions();
                        },
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? t('subscriptions.editSubscription') : t('subscriptions.newSubscription')}
            </Text>

            {/* Picker */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedPreset}
                onValueChange={(value) => {
                  setSelectedPreset(value);
                  if (value === OTHER_KEY) { setTitle(""); } else { setTitle(value); }
                }}
              >
                {presetSubscriptions.map((item) => (
                  <Picker.Item
                    key={item}
                    label={item === OTHER_KEY ? t('categories.other') : item}
                    value={item}
                  />
                ))}
              </Picker>
            </View>

            <TextInput
              placeholder={t('subscriptions.namePlaceholder')}
              value={title}
              editable={selectedPreset === OTHER_KEY}
              onChangeText={setTitle}
              style={styles.input}
            />

            <TextInput
              placeholder={t('subscriptions.amountPlaceholder', { symbol: currSymbol })}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
            />

            {/* Interval */}
            <View style={styles.intervalRow}>
              {["monthly", "yearly"].map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setInterval(i as "monthly" | "yearly")}
                  style={[
                    styles.intervalButton,
                    { backgroundColor: interval === i ? "#22c55e" : "#e5e7eb" },
                  ]}
                >
                  <Text
                    style={[
                      styles.intervalButtonText,
                      { color: interval === i ? "#fff" : "#111" },
                    ]}
                  >
                    {i === "monthly" ? t('common.monthly') : t('common.yearly')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={resetForm} style={styles.modalActionButton}>
                <Text style={{ textAlign: "center", color: "#6b7280" }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSave} style={styles.modalActionButton}>
                <Text style={{ textAlign: "center", color: "#22c55e", fontWeight: "700" }}>
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
