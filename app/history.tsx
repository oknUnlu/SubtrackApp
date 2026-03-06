import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  deleteTransaction,
  getCurrencySymbol,
  getSetting,
  searchTransactions,
  TransactionItem,
} from "../database/db";
import { styles } from "../styles/history";

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍔", transport: "🚗", fun: "🎮", shopping: "🛍️",
  bills: "📄", health: "💊", education: "📚", tech: "💻", other: "📌",
};

type DateFilter = "week" | "month" | "year" | "all";

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [currSymbol, setCurrSymbol] = useState("₺");

  const getDateRange = (filter: DateFilter): { from?: string; to?: string } => {
    const now = new Date();
    if (filter === "week") {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { from: from.toISOString() };
    }
    if (filter === "month") {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: from.toISOString() };
    }
    if (filter === "year") {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from: from.toISOString() };
    }
    return {};
  };

  const loadData = async () => {
    const currency = await getSetting("currency");
    setCurrSymbol(getCurrencySymbol(currency ?? "TRY"));

    const range = getDateRange(dateFilter);
    const results = await searchTransactions({
      search: search || undefined,
      category: categoryFilter || undefined,
      dateFrom: range.from,
      dateTo: range.to,
    });
    setTransactions(results);
  };

  useEffect(() => {
    loadData();
  }, [search, dateFilter, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = (tx: TransactionItem) => {
    Alert.alert(
      t("history.deleteTransaction"),
      t("common.deleteConfirm", { name: tx.title }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            await deleteTransaction(tx.id);
            loadData();
          },
        },
      ]
    );
  };

  const dateFilters: { key: DateFilter; label: string }[] = [
    { key: "week", label: t("history.thisWeek") },
    { key: "month", label: t("history.thisMonth") },
    { key: "year", label: t("history.thisYear") },
    { key: "all", label: t("history.allTime") },
  ];

  const categories = ["food", "transport", "fun", "shopping", "bills", "health", "education", "tech", "other"];

  const renderItem = ({ item: tx }: { item: TransactionItem }) => {
    const cat = {
      icon: CATEGORY_ICONS[tx.category ?? "other"] || "📌",
      label: t(`categories.${tx.category ?? "other"}`, { defaultValue: tx.category ?? "other" }),
    };
    const txDate = new Date(tx.date);
    const dateStr = new Intl.DateTimeFormat(i18n.language, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(txDate);

    return (
      <View style={styles.transactionCard}>
        <Text style={styles.txIcon}>{cat.icon}</Text>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>{tx.title}</Text>
          <Text style={styles.txSubtitle}>{dateStr} - {cat.label}</Text>
          {tx.notes ? (
            <Text style={styles.txNotes} numberOfLines={1}>{tx.notes}</Text>
          ) : null}
        </View>
        <Text style={styles.txAmount}>
          {currSymbol}{tx.amount.toFixed(2)}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(tx)}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 16, paddingTop: 16 }]}>
        <View>
          <Text style={styles.title}>{t("history.title")}</Text>
          <Text style={styles.subtitle}>
            {t("history.totalResults", { count: transactions.length })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#222" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ position: "relative" }}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#9ca3af"
            style={{ position: "absolute", left: 12, top: 14, zIndex: 1 }}
          />
          <TextInput
            style={styles.searchBar}
            placeholder={t("history.searchPlaceholder")}
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Date Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {dateFilters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, dateFilter === f.key && styles.filterChipActive]}
              onPress={() => setDateFilter(f.key)}
            >
              <Text style={[styles.filterChipText, dateFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilterRow}>
          <TouchableOpacity
            style={[styles.filterChip, !categoryFilter && styles.filterChipActive]}
            onPress={() => setCategoryFilter(null)}
          >
            <Text style={[styles.filterChipText, !categoryFilter && styles.filterChipTextActive]}>
              {t("history.allCategories")}
            </Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.filterChip, categoryFilter === c && styles.filterChipActive]}
              onPress={() => setCategoryFilter(categoryFilter === c ? null : c)}
            >
              <Text style={[styles.filterChipText, categoryFilter === c && styles.filterChipTextActive]}>
                {CATEGORY_ICONS[c]} {t(`categories.${c}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>{t("history.noResults")}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
