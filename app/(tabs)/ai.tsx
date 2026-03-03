import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';

import { styles } from "../../styles/ai";

export default function AIAnalysisScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f7f9" }} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('ai.title')}</Text>
          <Text style={styles.subtitle}>{t('ai.subtitle')}</Text>
        </View>
        <Ionicons name="notifications-outline" size={22} color="#222" />
      </View>

      {/* Hero Card */}
      <LinearGradient
        colors={["#7c3aed", "#9333ea"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.brainWrapper}>
          <Ionicons name="sparkles-outline" size={36} color="#fff" />
        </View>

        <Text style={styles.heroTitle}>{t('ai.heroTitle')}</Text>
        <Text style={styles.heroText}>
          {t('ai.heroText')}
        </Text>
      </LinearGradient>

      {/* Action Cards */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: "#dcfce7" }]}>
            <Ionicons name="trending-down" size={22} color="#22c55e" />
          </View>
          <Text style={styles.actionText}>{t('ai.savingsOpportunities')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: "#ffedd5" }]}>
            <Ionicons name="bulb-outline" size={22} color="#f97316" />
          </View>
          <Text style={styles.actionText}>{t('ai.smartSuggestions')}</Text>
        </TouchableOpacity>
      </View>

      {/* Main CTA */}
      <TouchableOpacity style={styles.analyzeButton}>
        <Ionicons name="sparkles-outline" size={20} color="#fff" />
        <Text style={styles.analyzeButtonText}>{t('ai.analyzeExpenses')}</Text>
      </TouchableOpacity>

      {/* Placeholder */}
      <View style={styles.placeholder}>
        <Ionicons name="link-outline" size={18} color="#6b7280" />
        <Text style={styles.placeholderText}>
          {t('ai.apiPlaceholder')}
        </Text>
      </View>

      {/* Ad Area */}
      <View style={styles.adArea}>
        <Text style={styles.adTitle}>{t('common.adArea')}</Text>
        <Text style={styles.adSubtitle}>{t('common.adBanner')}</Text>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
