import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
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

import AdBanner from '@/components/AdBanner';
import { randomUUID } from "expo-crypto";
import {
  addTagsToTransaction,
  addTemplate,
  addTransaction,
  createTag,
  deleteTemplate,
  getCurrencySymbol,
  getSetting,
  getTags,
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

  const TAG_COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1"];

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
      loadTemplates();
      loadTags();
    }, [loadTemplates, loadTags])
  );

  const applyTemplate = async (tmpl: TemplateItem) => {
    setTitle(tmpl.title);
    setAmount(String(tmpl.amount));
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
      const txId = randomUUID();
      await addTransaction({
        id: txId,
        title: title.trim(),
        amount: parsedAmount,
        date: new Date().toISOString(),
        category,
        notes: notes.trim() || undefined,
      });

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

      Alert.alert(t('common.success'), t('add.saved'));

      setTitle("");
      setAmount("");
      setCategory("other");
      setNotes("");
      setSelectedTagIds([]);
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
    <ScrollView contentContainerStyle={styles.container}>
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
        onChangeText={setTitle}
      />

      {/* Amount Input */}
      <Text style={styles.label}>{t('add.amount', { symbol: currSymbol })}</Text>
      <TextInput
        style={styles.amountInput}
        keyboardType="numeric"
        placeholder="0.00"
        placeholderTextColor={colors.placeholder}
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
              style={[styles.categoryCard, selected && styles.categorySelected]}
              onPress={() => setCategory(item.key)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
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
              style={[styles.tagChip, { borderColor: tag.color }, isSelected && { backgroundColor: tag.color }]}
              onPress={() => toggleTag(tag.id)}
            >
              <Text style={[styles.tagChipText, isSelected && { color: '#fff' }]}>{tag.name}</Text>
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
