import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
  getTagsForTransactions,
  getTags,
  searchTransactions,
  TagItem,
  TransactionItem,
} from "../database/db";
import { createStyles } from "../styles/history";
import { useAppTheme } from '@/hooks/use-app-theme';

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍔", transport: "🚗", fun: "🎮", shopping: "🛍️",
  bills: "📄", health: "💊", education: "📚", tech: "💻", other: "📌",
};

type DateFilter = "week" | "month" | "year" | "all";

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [currSymbol, setCurrSymbol] = useState("₺");
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [txTags, setTxTags] = useState<Map<string, TagItem[]>>(new Map());

  const getDateRange = (filter: DateFilter): { from?: string; to?: string } => {
    const now = new Date();
    if (filter === "week") { const from = new Date(now); from.setDate(from.getDate() - 7); return { from: from.toISOString() }; }
    if (filter === "month") { const from = new Date(now.getFullYear(), now.getMonth(), 1); return { from: from.toISOString() }; }
    if (filter === "year") { const from = new Date(now.getFullYear(), 0, 1); return { from: from.toISOString() }; }
    return {};
  };

  const loadData = async () => {
    const currency = await getSetting("currency");
    setCurrSymbol(getCurrencySymbol(currency ?? "TRY"));
    const tags = await getTags();
    setAllTags(tags);
    const range = getDateRange(dateFilter);
    let results = await searchTransactions({ search: search || undefined, category: categoryFilter || undefined, dateFrom: range.from, dateTo: range.to });

    if (results.length > 0) {
      const tagMap = await getTagsForTransactions(results.map(r => r.id));
      setTxTags(tagMap);
      if (tagFilter) {
        results = results.filter(r => {
          const t = tagMap.get(r.id) ?? [];
          return t.some(tag => tag.id === tagFilter);
        });
      }
    }
    setTransactions(results);
  };

  useEffect(() => { loadData(); }, [search, dateFilter, categoryFilter, tagFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = (tx: TransactionItem) => {
    Alert.alert(t("history.deleteTransaction"), t("common.deleteConfirm", { name: tx.title }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: async () => { await deleteTransaction(tx.id); loadData(); } },
    ]);
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
    const dateStr = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short", year: "numeric" }).format(txDate);

    return (
      <View style={styles.transactionCard}>
        <Text style={styles.txIcon}>{cat.icon}</Text>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>{tx.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={styles.txSubtitle}>{dateStr} - {cat.label}</Text>
            <Ionicons
              name={tx.paymentMethod === "credit_card" ? "card" : "cash-outline"}
              size={12}
              color={tx.paymentMethod === "credit_card" ? colors.purple : colors.primary}
            />
            {tx.paymentMethod === "credit_card" && tx.bankName ? (
              <Text style={{ fontSize: 10, color: colors.purple, fontWeight: "500" }}>{tx.bankName}</Text>
            ) : null}
          </View>
          {tx.notes ? <Text style={styles.txNotes} numberOfLines={1}>{tx.notes}</Text> : null}
          {(txTags.get(tx.id) ?? []).length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 3 }}>
              {(txTags.get(tx.id) ?? []).map(tag => (
                <View key={tag.id} style={{ backgroundColor: tag.color + "20", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                  <Text style={{ fontSize: 10, color: tag.color, fontWeight: "600" }}>{tag.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Text style={styles.txAmount}>{currSymbol}{tx.amount.toFixed(2)}</Text>
        <TouchableOpacity onPress={() => handleDelete(tx)}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.header, { paddingHorizontal: 16, paddingTop: 16 }]}>
        <View>
          <Text style={styles.title}>{t("history.title")}</Text>
          <Text style={styles.subtitle}>{t("history.totalResults", { count: transactions.length })}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ position: "relative" }}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ position: "absolute", left: 12, top: 14, zIndex: 1 }} />
          <TextInput style={styles.searchBar} placeholder={t("history.searchPlaceholder")} placeholderTextColor={colors.placeholder} value={search} onChangeText={setSearch} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {dateFilters.map((f) => (
            <TouchableOpacity key={f.key} style={[styles.filterChip, dateFilter === f.key && styles.filterChipActive]} onPress={() => setDateFilter(f.key)}>
              <Text style={[styles.filterChipText, dateFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilterRow}>
          <TouchableOpacity style={[styles.filterChip, !categoryFilter && styles.filterChipActive]} onPress={() => setCategoryFilter(null)}>
            <Text style={[styles.filterChipText, !categoryFilter && styles.filterChipTextActive]}>{t("history.allCategories")}</Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity key={c} style={[styles.filterChip, categoryFilter === c && styles.filterChipActive]} onPress={() => setCategoryFilter(categoryFilter === c ? null : c)}>
              <Text style={[styles.filterChipText, categoryFilter === c && styles.filterChipTextActive]}>{CATEGORY_ICONS[c]} {t(`categories.${c}`)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {allTags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilterRow}>
            <TouchableOpacity style={[styles.filterChip, !tagFilter && styles.filterChipActive]} onPress={() => setTagFilter(null)}>
              <Text style={[styles.filterChipText, !tagFilter && styles.filterChipTextActive]}>{t("add.tags")}</Text>
            </TouchableOpacity>
            {allTags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[styles.filterChip, tagFilter === tag.id && { backgroundColor: tag.color, borderColor: tag.color }]}
                onPress={() => setTagFilter(tagFilter === tag.id ? null : tag.id)}
              >
                <Text style={[styles.filterChipText, tagFilter === tag.id && { color: "#fff" }]}>{tag.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

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
