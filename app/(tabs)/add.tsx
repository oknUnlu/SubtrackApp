import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';

import AdBanner from '@/components/AdBanner';
import { randomUUID } from "expo-crypto";
import {
  addInstallment,
  addTagsToTransaction,
  addTemplate,
  addTransaction,
  createTag,
  deleteTag,
  deleteTemplate,
  formatNumber,
  getBudgetVsActual,
  getCurrencySymbol,
  getSetting,
  setSetting,
  getTags,
  predictCategory,
  getTemplates,
  incrementTemplateUseCount,
  TagItem,
  TemplateItem,
} from "../../database/db";
import { createStyles } from "../../styles/add";
import { useAppTheme } from '@/hooks/use-app-theme';

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
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [notes, setNotes] = useState("");
  const [currSymbol, setCurrSymbol] = useState("₺");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit_card">("cash");
  const [bankName, setBankName] = useState("");
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState("");
  const predictTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Toast notification state
  const [toastData, setToastData] = useState<{ message: string; warnings: string[] } | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, warnings: string[] = []) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToastData({ message, warnings });
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    const duration = warnings.length > 0 ? 4500 : 3000;
    toastTimeout.current = setTimeout(() => {
      setToastData(null);
    }, duration);
  }, []);

  const TAG_COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1"];

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      if (predictTimer.current) clearTimeout(predictTimer.current);
    };
  }, []);

  const loadTemplates = useCallback(async () => {
    const tpls = await getTemplates();
    setTemplates(tpls);
  }, []);

  const loadTags = useCallback(async () => {
    const tags = await getTags();
    setAllTags(tags);
  }, []);

  useFocusEffect(
    useCallback(() => {
      getSetting("currency").then((c) => {
        setCurrSymbol(getCurrencySymbol(c ?? "TRY"));
      });
      getSetting("lastBankName").then((b) => {
        if (b) setBankName(b);
      });
      getSetting("lastPaymentMethod").then((m) => {
        if (m === "cash" || m === "credit_card") setPaymentMethod(m);
      });
      loadTemplates();
      loadTags();
    }, [loadTemplates, loadTags])
  );

  const applyTemplate = async (tmpl: TemplateItem) => {
    setTitle(tmpl.title);
    setAmount(formatAmountDisplay(String(tmpl.amount)));
    setCategory(tmpl.category);
    setNotes(tmpl.notes ?? "");
    await incrementTemplateUseCount(tmpl.id);
  };

  const handleDeleteTemplate = (tmpl: TemplateItem) => {
    Alert.alert(
      t('common.delete'),
      t('common.deleteConfirm', { name: tmpl.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteTemplate(tmpl.id);
            loadTemplates();
          },
        },
      ]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const tag: TagItem = { id: randomUUID(), name: newTagName.trim(), color: newTagColor };
    await createTag(tag);
    setAllTags(prev => [...prev, tag]);
    setSelectedTagIds(prev => [...prev, tag.id]);
    setNewTagName("");
    setShowNewTag(false);
  };

  const handleDeleteTag = (tag: TagItem) => {
    Alert.alert(
      t('add.deleteTag'),
      t('add.deleteTagConfirm', { name: tag.name }),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: async () => {
            await deleteTag(tag.id);
            setAllTags(prev => prev.filter(t => t.id !== tag.id));
            setSelectedTagIds(prev => prev.filter(id => id !== tag.id));
          },
        },
      ]
    );
  };

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('common.error'), t('add.cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const handleTitleChange = useCallback((text: string) => {
    setTitle(text);
    if (categoryManuallySet) return;
    if (predictTimer.current) clearTimeout(predictTimer.current);
    predictTimer.current = setTimeout(async () => {
      if (text.trim().length >= 2) {
        const predicted = await predictCategory(text.trim());
        if (predicted && !categoryManuallySet) {
          setCategory(predicted);
        }
      }
    }, 400);
  }, [categoryManuallySet]);

  const handleCategorySelect = useCallback((key: string) => {
    setCategory(key);
    setCategoryManuallySet(true);
  }, []);

  const formatAmountDisplay = useCallback((raw: string): string => {
    // Remove all non-numeric chars except comma and dot
    let cleaned = raw.replace(/[^0-9.,]/g, "");
    // Replace comma with dot for decimal
    // Support both 10.000 (thousands) and 10,50 (decimal) patterns
    // Strategy: last comma or dot with ≤2 digits after it is the decimal separator
    const lastSep = Math.max(cleaned.lastIndexOf(","), cleaned.lastIndexOf("."));
    let intPart = cleaned;
    let decPart = "";
    if (lastSep >= 0) {
      const afterSep = cleaned.slice(lastSep + 1);
      if (afterSep.length <= 2) {
        // It's a decimal separator
        intPart = cleaned.slice(0, lastSep).replace(/[.,]/g, "");
        decPart = afterSep;
      } else {
        // It's a thousands separator, ignore it
        intPart = cleaned.replace(/[.,]/g, "");
      }
    }
    // Remove leading zeros
    intPart = intPart.replace(/^0+(?=\d)/, "");
    // Add thousands separators
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (lastSep >= 0 && cleaned.slice(lastSep + 1).length <= 2) {
      return formatted + "," + decPart;
    }
    return formatted;
  }, []);

  const handleAmountChange = useCallback((text: string) => {
    if (text === "") {
      setAmount("");
      return;
    }
    setAmount(formatAmountDisplay(text));
  }, [formatAmountDisplay]);

  const parseAmount = useCallback((formatted: string): number => {
    // Remove thousands separators (dots), replace decimal comma with dot
    const cleaned = formatted.replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned);
  }, []);

  const localizedCategories = CATEGORY_DATA.map(c => ({
    ...c,
    label: t(`categories.${c.key}`),
  }));

  const handleSave = async () => {
    if (!title.trim() || !amount) {
      Alert.alert(t('common.error'), t('add.fillAllFields'));
      return;
    }

    const parsedAmount = parseAmount(amount);

    if (isNaN(parsedAmount)) {
      Alert.alert(t('common.error'), t('add.validAmount'));
      return;
    }

    try {
      const txId = randomUUID();
      await addTransaction({
        id: txId,
        title: title.trim(),
        amount: parsedAmount,
        date: new Date().toISOString(),
        category,
        notes: notes.trim() || undefined,
        paymentMethod,
        bankName: paymentMethod === "credit_card" ? bankName.trim() || undefined : undefined,
        receiptUri: receiptUri ?? undefined,
      });

      // Remember payment method & bank for next entry
      await setSetting("lastPaymentMethod", paymentMethod);
      if (paymentMethod === "credit_card" && bankName.trim()) {
        await setSetting("lastBankName", bankName.trim());
      }

      if (selectedTagIds.length > 0) {
        await addTagsToTransaction(txId, selectedTagIds);
      }

      if (saveAsTemplate) {
        await addTemplate({
          id: randomUUID(),
          title: title.trim(),
          amount: parsedAmount,
          category,
          notes: notes.trim() || undefined,
          useCount: 0,
        });
        setSaveAsTemplate(false);
        loadTemplates();
      }

      // Auto-create installment if credit card + installment selected
      if (paymentMethod === "credit_card" && isInstallment && installmentCount) {
        const count = parseInt(installmentCount, 10);
        if (!isNaN(count) && count > 1) {
          await addInstallment({
            id: randomUUID(),
            title: title.trim(),
            totalAmount: parsedAmount,
            installmentCount: count,
            paidCount: 1, // First installment paid now
            monthlyAmount: parsedAmount / count,
            startDate: new Date().toISOString(),
            bankName: bankName.trim() || undefined,
          });
        }
      }

      // Check budget limits after saving
      const budgetData = await getBudgetVsActual();
      const warnings: string[] = [];
      if (budgetData.overall && budgetData.overall.budget > 0) {
        const pct = (budgetData.overall.actual / budgetData.overall.budget) * 100;
        if (pct >= 100) {
          warnings.push(t('add.budgetExceeded', { percent: Math.round(pct) }));
        } else if (pct >= 80) {
          warnings.push(t('add.budgetWarning', { percent: Math.round(pct) }));
        }
      }
      for (const cat of budgetData.categories) {
        if (cat.category === category && cat.budget > 0) {
          const catPct = (cat.actual / cat.budget) * 100;
          if (catPct >= 100) {
            warnings.push(t('add.categoryBudgetExceeded', {
              category: t(`categories.${category}`),
              percent: Math.round(catPct),
            }));
          } else if (catPct >= 80) {
            warnings.push(t('add.categoryBudgetWarning', {
              category: t(`categories.${category}`),
              percent: Math.round(catPct),
            }));
          }
        }
      }

      showToast(t('add.saved'), warnings);

      setTitle("");
      setAmount("");
      setCategory("other");
      setNotes("");
      setSelectedTagIds([]);
      setCategoryManuallySet(false);
      setReceiptUri(null);
      setIsInstallment(false);
      setInstallmentCount("");
    } catch (err) {
      console.error(err);
      Alert.alert(t('common.error'), t('add.saveFailed'));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
      {/* Success Toast */}
      {toastData && (
        <View
          style={{
            backgroundColor: toastData.warnings.length > 0 ? "#f59e0b" : "#22c55e",
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.25)",
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Ionicons
              name={toastData.warnings.length > 0 ? "warning" : "checkmark-circle"}
              size={22}
              color="#fff"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              {toastData.message}
            </Text>
            {toastData.warnings.map((w, i) => (
              <Text key={i} style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, marginTop: 3 }}>
                {w}
              </Text>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => {
              if (toastTimeout.current) clearTimeout(toastTimeout.current);
              setToastData(null);
            }}
          >
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('add.title')}</Text>
          <Text style={styles.subtitle}>{t('add.subtitle')}</Text>
        </View>
      </View>

      {/* Templates */}
      {templates.length > 0 && (
        <View style={styles.templateSection}>
          <Text style={styles.templateLabel}>{t('add.templates')}</Text>
          <FlatList
            data={templates}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.templateChip}
                onPress={() => applyTemplate(item)}
                onLongPress={() => handleDeleteTemplate(item)}
              >
                <Text style={styles.templateChipIcon}>
                  {CATEGORY_DATA.find(c => c.key === item.category)?.icon ?? "📌"}
                </Text>
                <View style={styles.templateChipText}>
                  <Text style={styles.templateChipTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.templateChipAmount}>{currSymbol}{item.amount}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Title Input */}
      <Text style={styles.label}>{t('add.expenseTitle')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('add.titlePlaceholder')}
        placeholderTextColor={colors.placeholder}
        value={title}
        onChangeText={handleTitleChange}
      />

      {/* Amount Input */}
      <Text style={styles.label}>{t('add.amount', { symbol: currSymbol })}</Text>
      <TextInput
        style={styles.amountInput}
        keyboardType="decimal-pad"
        placeholder="0,00"
        placeholderTextColor={colors.placeholder}
        value={amount}
        onChangeText={handleAmountChange}
      />

      {/* Categories */}
      <Text style={styles.label}>{t('add.category')}</Text>
      <View style={styles.categoryGrid}>
        {localizedCategories.map((item) => {
          const selected = item.key === category;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.categoryCard, selected && styles.categorySelected]}
              onPress={() => handleCategorySelect(item.key)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Payment Method */}
      <Text style={styles.label}>{t('add.paymentMethod')}</Text>
      <View style={styles.paymentMethodRow}>
        <TouchableOpacity
          style={[styles.paymentMethodButton, paymentMethod === "cash" && styles.paymentMethodSelected]}
          onPress={() => setPaymentMethod("cash")}
        >
          <Ionicons name="cash-outline" size={22} color={paymentMethod === "cash" ? "#fff" : colors.text} />
          <Text style={[styles.paymentMethodText, paymentMethod === "cash" && styles.paymentMethodTextSelected]}>
            {t('add.cash')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.paymentMethodButton, paymentMethod === "credit_card" && styles.paymentMethodSelected]}
          onPress={() => setPaymentMethod("credit_card")}
        >
          <Ionicons name="card-outline" size={22} color={paymentMethod === "credit_card" ? "#fff" : colors.text} />
          <Text style={[styles.paymentMethodText, paymentMethod === "credit_card" && styles.paymentMethodTextSelected]}>
            {t('add.creditCard')}
          </Text>
        </TouchableOpacity>
      </View>

      {paymentMethod === "credit_card" && (
        <>
          <Text style={styles.label}>{t('add.bankName')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('add.bankNamePlaceholder')}
            placeholderTextColor={colors.placeholder}
            value={bankName}
            onChangeText={setBankName}
          />

          {/* Installment Option */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginTop: 10, marginBottom: isInstallment ? 0 : 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="layers-outline" size={20} color={colors.purple} />
              <Text style={{ fontWeight: "600", color: colors.text, fontSize: 14 }}>{t('add.installmentPurchase')}</Text>
            </View>
            <Switch
              value={isInstallment}
              onValueChange={setIsInstallment}
              trackColor={{ false: colors.border, true: '#c4b5fd' }}
              thumbColor={isInstallment ? '#8b5cf6' : '#f4f3f4'}
            />
          </View>

          {isInstallment && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>{t('add.installmentCount')}</Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {[2, 3, 4, 6, 9, 12].map(n => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setInstallmentCount(String(n))}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: installmentCount === String(n) ? colors.purple : colors.surfaceSecondary,
                      borderWidth: 1,
                      borderColor: installmentCount === String(n) ? colors.purple : colors.border,
                    }}
                  >
                    <Text style={{
                      fontWeight: "600",
                      fontSize: 14,
                      color: installmentCount === String(n) ? "#fff" : colors.text,
                    }}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {installmentCount && amount ? (() => {
                const parsed = parseAmount(amount);
                const count = parseInt(installmentCount, 10);
                if (!isNaN(parsed) && !isNaN(count) && count > 0) {
                  const monthly = parsed / count;
                  return (
                    <View style={{ backgroundColor: colors.purple + "15", borderRadius: 12, padding: 12, marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Ionicons name="information-circle-outline" size={20} color={colors.purple} />
                      <Text style={{ color: colors.purple, fontSize: 13, fontWeight: "500", flex: 1 }}>
                        {t('add.installmentSummary', {
                          count,
                          monthly: `${currSymbol}${formatNumber(monthly, 2)}`,
                        })}
                      </Text>
                    </View>
                  );
                }
                return null;
              })() : null}
            </View>
          )}
        </>
      )}

      {/* Notes */}
      <Text style={styles.label}>{t('add.notes')}</Text>
      <TextInput
        style={styles.notesInput}
        placeholder={t('add.notesPlaceholder')}
        placeholderTextColor={colors.placeholder}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      {/* Tags */}
      <Text style={styles.label}>{t('add.tags')}</Text>
      <View style={styles.tagContainer}>
        {allTags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <TouchableOpacity
              key={tag.id}
              style={[styles.tagChip, { borderColor: tag.color, flexDirection: 'row', alignItems: 'center', gap: 4 }, isSelected && { backgroundColor: tag.color }]}
              onPress={() => toggleTag(tag.id)}
              onLongPress={() => handleDeleteTag(tag)}
            >
              <Text style={[styles.tagChipText, isSelected && { color: '#fff' }]}>{tag.name}</Text>
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation?.(); handleDeleteTag(tag); }}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                style={{ marginLeft: 2 }}
              >
                <Ionicons name="close-circle" size={14} color={isSelected ? "rgba(255,255,255,0.7)" : tag.color} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.tagAddButton} onPress={() => setShowNewTag(!showNewTag)}>
          <Ionicons name={showNewTag ? "close" : "add"} size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {showNewTag && (
        <View style={styles.newTagRow}>
          <TextInput
            style={styles.newTagInput}
            placeholder={t('add.tagName')}
            placeholderTextColor={colors.placeholder}
            value={newTagName}
            onChangeText={setNewTagName}
          />
          <View style={styles.tagColorRow}>
            {TAG_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.tagColorDot, { backgroundColor: c }, newTagColor === c && styles.tagColorDotSelected]}
                onPress={() => setNewTagColor(c)}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.tagCreateButton} onPress={handleCreateTag}>
            <Text style={styles.tagCreateText}>{t('add.createTag')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Receipt / Photo */}
      <Text style={styles.label}>{t('add.receipt')}</Text>
      {receiptUri ? (
        <View style={{ marginBottom: 12 }}>
          <Image source={{ uri: receiptUri }} style={{ width: "100%", height: 180, borderRadius: 14 }} resizeMode="cover" />
          <TouchableOpacity
            onPress={() => setReceiptUri(null)}
            style={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 14, padding: 4 }}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={pickReceipt}
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.surfaceSecondary, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" }}
          >
            <Ionicons name="image-outline" size={20} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>{t('add.pickPhoto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={takePhoto}
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.surfaceSecondary, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" }}
          >
            <Ionicons name="camera-outline" size={20} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>{t('add.takePhoto')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Save as Template */}
      <View style={styles.templateToggle}>
        <View style={styles.templateToggleLeft}>
          <Ionicons name="bookmark-outline" size={20} color={colors.iconSecondary} />
          <Text style={styles.templateToggleText}>{t('add.saveAsTemplate')}</Text>
        </View>
        <Switch
          value={saveAsTemplate}
          onValueChange={setSaveAsTemplate}
          trackColor={{ false: colors.border, true: '#86efac' }}
          thumbColor={saveAsTemplate ? '#22c55e' : '#f4f3f4'}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Ionicons name="checkmark" size={20} color="#fff" />
        <Text style={styles.saveButtonText}>{t('add.saveExpense')}</Text>
      </TouchableOpacity>

      {/* Ad */}
      <AdBanner />
    </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
