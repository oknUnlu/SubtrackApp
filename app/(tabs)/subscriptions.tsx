import { Ionicons } from "@expo/vector-icons";
import React from "react";

import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { styles } from "../../styles/subscriptions";

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
