import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import {
  getCategoryDistribution,
  getMonthlyTotal,
  getSubscriptionCount,
  getWeeklyTrend,
} from "../../database/db";

import { styles } from "../../styles";

export default function HomeScreen() {
  /* -------------------- */
  /* STATE                */
  /* -------------------- */
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);

  const [categories, setCategories] = useState<
    Array<{ category: string; total: number }>
  >([]);

  const [weeklyTrend, setWeeklyTrend] = useState<
    Array<{ day: string; total: number }>
  >([]);

  /* -------------------- */
  /* DATA LOAD            */
  /* -------------------- */
  const loadDashboard = async () => {
    try {
      const total = await getMonthlyTotal();
      const subs = await getSubscriptionCount();
      const cats = await getCategoryDistribution();
      const weekly = await getWeeklyTrend();

      const today = new Date().getDate();
      const avg = today > 0 ? total / today : 0;

      setMonthlyTotal(total);
      setSubscriptionCount(subs);
      setDailyAverage(avg);
      setCategories(cats);
      setWeeklyTrend(weekly);

      console.log("Weekly Trend:", weekly);
    } catch (error) {
      console.error("Dashboard load error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  /* -------------------- */
  /* UI                  */
  /* -------------------- */
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

      {/* Monthly Total */}
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

        <Text style={styles.totalAmount}>₺{monthlyTotal.toFixed(2)}</Text>

        <View style={styles.totalFooter}>
          <Ionicons name="trending-up-outline" size={16} color="#dcfce7" />
          <Text style={styles.totalSubText}>Abonelikler dahil</Text>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Aktif Abonelik</Text>
            <Ionicons name="card-outline" size={18} color="#6b7280" />
          </View>
          <Text style={styles.statValue}>{subscriptionCount}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Günlük Ortalama</Text>
            <Ionicons name="analytics-outline" size={18} color="#6b7280" />
          </View>
          <Text style={styles.statValue}>₺{dailyAverage.toFixed(0)}</Text>
        </View>
      </View>

      {/* Category Distribution */}
      <View style={styles.largeCard}>
        <Text style={styles.cardTitle}>Harcama Dağılımı</Text>

        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>Henüz harcama verisi yok</Text>
          </View>
        ) : (
          (() => {
            const total = categories.reduce((s, c) => s + c.total, 0);

            const iconMap: Record<string, string> = {
              food: "🍔",
              transport: "🚗",
              fun: "🎮",
              shopping: "🛍️",
              bills: "📄",
              health: "💊",
              education: "📚",
              tech: "💻",
            };

            return categories.map((item) => {
              const percent = total > 0 ? item.total / total : 0;

              return (
                <View
                  key={item.category}
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", marginBottom: 8 }}>
                    <Text style={{ fontSize: 20, marginRight: 10 }}>
                      {iconMap[item.category] || "📌"}
                    </Text>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600" }}>
                        {item.category}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#6b7280" }}>
                        %{Math.round(percent * 100)} bu ay
                      </Text>
                    </View>

                    <Text style={{ fontWeight: "700" }}>
                      ₺{item.total.toFixed(0)}
                    </Text>
                  </View>

                  <View
                    style={{
                      height: 6,
                      backgroundColor: "#e5e7eb",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${percent * 100}%`,
                        height: "100%",
                        backgroundColor: "#22c55e",
                      }}
                    />
                  </View>
                </View>
              );
            });
          })()
        )}
      </View>

      {/* Weekly Trend */}
      <View style={styles.largeCard}>
        <Text style={styles.cardTitle}>Haftalık Trend</Text>

        {weeklyTrend.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📈</Text>
            <Text style={styles.emptyText}>Henüz trend verisi yok</Text>
          </View>
        ) : (
          (() => {
            const max = Math.max(...weeklyTrend.map((d) => d.total), 1);
            const days = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];
            const todayIndex = new Date().getDay();

            return (
              <View style={{ marginTop: 16 }}>
                {weeklyTrend.map((item, index) => {
                  const percent = item.total / max;
                  const isToday = Number(item.day) === todayIndex;

                  return (
                    <View
                      key={index}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 10,
                        opacity: item.total === 0 ? 0.4 : 1,
                      }}
                    >
                      <Text style={{ width: 36, fontSize: 12 }}>
                        {days[Number(item.day)]}
                      </Text>

                      <View
                        style={{
                          flex: 1,
                          height: 8,
                          backgroundColor: "#e5e7eb",
                          borderRadius: 6,
                          marginHorizontal: 8,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: `${percent * 100}%`,
                            height: "100%",
                            backgroundColor: isToday
                              ? "#16a34a"
                              : "#22c55e",
                          }}
                        />
                      </View>

                      <Text
                        style={{
                          width: 60,
                          textAlign: "right",
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        ₺{item.total.toFixed(0)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })()
        )}
      </View>

      {/* Ad */}
      <View style={styles.adArea}>
        <Text style={styles.adTitle}>REKLAM ALANI</Text>
        <Text style={styles.adSubtitle}>AdMob Banner (320×50)</Text>
      </View>
    </ScrollView>
  );
}
