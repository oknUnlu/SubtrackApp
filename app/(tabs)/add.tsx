import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';

import { randomUUID } from "expo-crypto";
import { addTransaction, getCurrencySymbol, getSetting } from "../../database/db";
import { styles } from "../../styles/add";

const CATEGORY_DATA = [
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

export default function AddExpenseScreen() {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [notes, setNotes] = useState("");
  const [currSymbol, setCurrSymbol] = useState("₺");

  useFocusEffect(
    useCallback(() => {
      getSetting("currency").then((c) => {
        setCurrSymbol(getCurrencySymbol(c ?? "TRY"));
      });
    }, [])
  );

  const localizedCategories = CATEGORY_DATA.map(c => ({
    ...c,
    label: t(`categories.${c.key}`),
  }));

  const handleSave = async () => {
    if (!title.trim() || !amount) {
      Alert.alert(t('common.error'), t('add.fillAllFields'));
      return;
    }

    const parsedAmount = parseFloat(amount.replace(",", "."));

    if (isNaN(parsedAmount)) {
      Alert.alert(t('common.error'), t('add.validAmount'));
      return;
    }

    try {
      await addTransaction({
        id: randomUUID(),
        title: title.trim(),
        amount: parsedAmount,
        date: new Date().toISOString(),
        category,
        notes: notes.trim() || undefined,
      });

      Alert.alert(t('common.success'), t('add.saved'));

      // Formu sıfırla
      setTitle("");
      setAmount("");
      setCategory("other");
      setNotes("");
    } catch (err) {
      console.error(err);
      Alert.alert(t('common.error'), t('add.saveFailed'));
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f7f9" }} edges={["top"]}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('add.title')}</Text>
          <Text style={styles.subtitle}>{t('add.subtitle')}</Text>
        </View>
        <Ionicons name="notifications-outline" size={22} color="#222" />
      </View>

      {/* Title Input */}
      <Text style={styles.label}>{t('add.expenseTitle')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('add.titlePlaceholder')}
        placeholderTextColor="#9ca3af"
        value={title}
        onChangeText={setTitle}
      />

      {/* Amount Input */}
      <Text style={styles.label}>{t('add.amount', { symbol: currSymbol })}</Text>
      <TextInput
        style={styles.amountInput}
        keyboardType="numeric"
        placeholder="0.00"
        placeholderTextColor="#9ca3af"
        value={amount}
        onChangeText={setAmount}
      />

      {/* Categories */}
      <Text style={styles.label}>{t('add.category')}</Text>
      <View style={styles.categoryGrid}>
        {localizedCategories.map((item) => {
          const selected = item.key === category;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.categoryCard,
                selected && styles.categorySelected,
              ]}
              onPress={() => setCategory(item.key)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selected && styles.categoryLabelSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Notes */}
      <Text style={styles.label}>{t('add.notes')}</Text>
      <TextInput
        style={styles.notesInput}
        placeholder={t('add.notesPlaceholder')}
        placeholderTextColor="#9ca3af"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Ionicons name="checkmark" size={20} color="#fff" />
        <Text style={styles.saveButtonText}>{t('add.saveExpense')}</Text>
      </TouchableOpacity>


      {/* Ad Area */}
      <View style={styles.adArea}>
        <Text style={styles.adText}>{t('common.adArea')}</Text>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
