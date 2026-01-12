import { Ionicons } from "@expo/vector-icons";
import React from "react";

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7f9",
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#777",
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  label: {
    color: "#777",
    marginBottom: 6,
  },
  amount: {
    fontSize: 20,
    fontWeight: "700",
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#22c55e",
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 8,
  },
  adArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  adTitle: {
    fontWeight: "600",
    color: "#999",
  },
  adSubtitle: {
    color: "#bbb",
    marginTop: 4,
  },
  bottomTab: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  tabItem: {
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});

export default function SubscriptionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Abonelikler</Text>
            <Text style={styles.subtitle}>0 aktif abonelik</Text>
          </View>
          <Ionicons name="notifications-outline" size={22} color="#222" />
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.label}>Aylık Toplam</Text>
            <Text style={styles.amount}>₺0.00</Text>
          </View>
          <View>
            <Text style={styles.label}>Yıllık</Text>
            <Text style={styles.amount}>₺0.00</Text>
          </View>
        </View>

        {/* Add Subscription Button */}
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Yeni Abonelik Ekle</Text>
        </TouchableOpacity>

        {/* Empty State */}
        <View style={styles.emptyCard}>
          <Ionicons name="card-outline" size={40} color="#aaa" />
          <Text style={styles.emptyTitle}>Henüz abonelik yok</Text>
          <Text style={styles.emptyText}>
            Netflix, Spotify gibi aboneliklerinizi ekleyerek aylık
            harcamalarınızı takip edin.
          </Text>
        </View>

        {/* Ad Area */}
        <View style={styles.adArea}>
          <Text style={styles.adTitle}>REKLAM ALANI</Text>
          <Text style={styles.adSubtitle}>AdMob Banner (320×50)</Text>
        </View>
      </ScrollView>
 
    </SafeAreaView>
  );
}

function TabItem({ icon, label, active = false }: any) {
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={icon}
        size={22}
        color={active ? "#22c55e" : "#999"}
      />
      <Text style={[styles.tabLabel, active && { color: "#22c55e" }]}>
        {label}
      </Text>
    </View>
  );
}
