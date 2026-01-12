import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f6f7f9",
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6b7280",
    marginTop: 4,
  },

  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  brainWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  heroText: {
    color: "#ede9fe",
    textAlign: "center",
    lineHeight: 20,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
  },

  analyzeButton: {
    backgroundColor: "#9333ea",
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  analyzeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  placeholder: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  placeholderText: {
    marginLeft: 8,
    color: "#6b7280",
    flex: 1,
  },

  adArea: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    alignItems: "center",
  },
  adTitle: {
    fontWeight: "600",
    color: "#9ca3af",
  },
  adSubtitle: {
    color: "#cbd5f5",
    marginTop: 4,
  },
});


export default function AIAnalysisScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AI Analiz</Text>
          <Text style={styles.subtitle}>Akıllı harcama önerileri</Text>
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

        <Text style={styles.heroTitle}>Yapay Zeka Destekli Analiz</Text>
        <Text style={styles.heroText}>
          Gemini AI ile harcama alışkanlıklarınızı analiz edin ve
          kişiselleştirilmiş öneriler alın.
        </Text>
      </LinearGradient>

      {/* Action Cards */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: "#dcfce7" }]}>
            <Ionicons name="trending-down" size={22} color="#22c55e" />
          </View>
          <Text style={styles.actionText}>Tasarruf Fırsatları</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: "#ffedd5" }]}>
            <Ionicons name="bulb-outline" size={22} color="#f97316" />
          </View>
          <Text style={styles.actionText}>Akıllı Öneriler</Text>
        </TouchableOpacity>
      </View>

      {/* Main CTA */}
      <TouchableOpacity style={styles.analyzeButton}>
        <Ionicons name="sparkles-outline" size={20} color="#fff" />
        <Text style={styles.analyzeButtonText}>Harcamalarımı Yorumla</Text>
      </TouchableOpacity>

      {/* Placeholder */}
      <View style={styles.placeholder}>
        <Ionicons name="link-outline" size={18} color="#6b7280" />
        <Text style={styles.placeholderText}>
          Gemini API entegrasyonu için placeholder. Gerçek API anahtarı
          eklendiğinde aktif olacak.
        </Text>
      </View>

      {/* Ad Area */}
      <View style={styles.adArea}>
        <Text style={styles.adTitle}>REKLAM ALANI</Text>
        <Text style={styles.adSubtitle}>AdMob Banner (320×50)</Text>
      </View>
    </ScrollView>
  );
}
