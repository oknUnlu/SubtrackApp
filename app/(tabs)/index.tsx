import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, Text, View } from "react-native";

import { styles } from "../../styles";

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>Subtrack AI</Text>
          <Text style={styles.date}>13 Ocak Salı</Text>
        </View>
        <Ionicons name="notifications-outline" size={22} color="#374151" />
      </View>

      {/* Monthly Total Card */}
      <LinearGradient
        colors={["#22c55e", "#16a34a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.totalCard}
      >
        <View style={styles.totalHeader}>
          <Ionicons name="wallet-outline" size={18} color="#fff" />
          <Text style={styles.totalLabel}>Bu Ay Toplam Harcama</Text>
        </View>

        <Text style={styles.totalAmount}>₺0.00</Text>

        <View style={styles.totalFooter}>
          <Ionicons name="trending-up-outline" size={16} color="#dcfce7" />
          <Text style={styles.totalSubText}>Abonelikler dahil</Text>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Aktif Abonelik</Text>
            <Ionicons name="card-outline" size={18} color="#6b7280" />
          </View>
          <Text style={styles.statValue}>0</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Günlük Ortalama</Text>
            <Ionicons name="analytics-outline" size={18} color="#6b7280" />
          </View>
          <Text style={styles.statValue}>₺0</Text>
        </View>
      </View>

      {/* Expense Distribution */}
      <View style={styles.largeCard}>
        <Text style={styles.cardTitle}>Harcama Dağılımı</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Henüz harcama verisi yok</Text>
        </View>
      </View>

      {/* Weekly Trend */}
      <View style={styles.largeCard}>
        <Text style={styles.cardTitle}>Haftalık Trend</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyText}>Henüz trend verisi yok</Text>
        </View>
      </View>

      {/* Ad Area */}
      <View style={styles.adArea}>
        <Text style={styles.adTitle}>REKLAM ALANI</Text>
        <Text style={styles.adSubtitle}>AdMob Banner (320×50)</Text>
      </View>
    </ScrollView>
  );
}
