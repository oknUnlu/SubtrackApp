import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addSubscription,
  getSubscriptions,
  SubscriptionItem,
} from "../../database/db";
import { styles } from "../../styles/subscriptions";

const PRESET_SUBSCRIPTIONS = [
  "Netflix",
  "Spotify",
  "YouTube Premium",
  "Amazon Prime",
  "Apple Music",
  "Disney+",
  "BluTV",
  "Exxen",
  "Diğer",
];

export default function SubscriptionsScreen() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(0);

  const [showModal, setShowModal] = useState(false);

  const [selectedPreset, setSelectedPreset] = useState("Netflix");
  const [title, setTitle] = useState("Netflix");
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  /* ---------------- LOAD ---------------- */
  const loadSubscriptions = async () => {
    const data = await getSubscriptions();
    setSubscriptions(data);

    let monthly = 0;
    let yearly = 0;

    data.forEach((sub) => {
      if (sub.interval === "monthly") {
        monthly += sub.amount;
        yearly += sub.amount * 12;
      } else {
        yearly += sub.amount;
        monthly += sub.amount / 12;
      }
    });

    setMonthlyTotal(monthly);
    setYearlyTotal(yearly);
  };

  useFocusEffect(
    useCallback(() => {
      loadSubscriptions();
    }, [])
  );

  /* ---------------- SAVE ---------------- */
  const handleAdd = async () => {
    if (!title.trim() || !amount) {
      Alert.alert("Hata", "Lütfen tüm alanları doldur");
      return;
    }

    const parsedAmount = Number(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Hata", "Geçerli bir tutar gir");
      return;
    }

    await addSubscription({
      id: Date.now().toString(), // ✅ Expo safe
      title: title.trim(),
      amount: parsedAmount,
      interval,
    });

    setShowModal(false);
    setAmount("");
    setInterval("monthly");
    setSelectedPreset("Netflix");
    setTitle("Netflix");

    loadSubscriptions();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Abonelikler</Text>
            <Text style={styles.subtitle}>
              {subscriptions.length} aktif abonelik
            </Text>
          </View>
          <Ionicons name="notifications-outline" size={22} color="#222" />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.label}>Aylık Toplam</Text>
            <Text style={styles.amount}>₺{monthlyTotal.toFixed(2)}</Text>
          </View>
          <View>
            <Text style={styles.label}>Yıllık</Text>
            <Text style={styles.amount}>₺{yearlyTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Yeni Abonelik Ekle</Text>
        </TouchableOpacity>

        {subscriptions.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="card-outline" size={40} color="#aaa" />
            <Text style={styles.emptyTitle}>Henüz abonelik yok</Text>
            <Text style={styles.emptyText}>
              Aboneliklerini ekleyerek harcamalarını takip et
            </Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal visible={showModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
              Yeni Abonelik
            </Text>

            {/* Picker */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedPreset}
                onValueChange={(value) => {
                  setSelectedPreset(value);
                  value === "Diğer" ? setTitle("") : setTitle(value);
                }}
              >
                {PRESET_SUBSCRIPTIONS.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>

            <TextInput
              placeholder="Abonelik adı"
              value={title}
              editable={selectedPreset === "Diğer"}
              onChangeText={setTitle}
              style={styles.input}
            />

            <TextInput
              placeholder="Tutar (₺)"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
            />

            {/* Interval */}
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              {["monthly", "yearly"].map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setInterval(i as any)}
                  style={{
                    flex: 1,
                    padding: 10,
                    marginRight: 6,
                    borderRadius: 10,
                    backgroundColor:
                      interval === i ? "#22c55e" : "#e5e7eb",
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: interval === i ? "#fff" : "#111",
                      fontWeight: "600",
                    }}
                  >
                    {i === "monthly" ? "Aylık" : "Yıllık"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={{ flex: 1, padding: 12 }}
              >
                <Text style={{ textAlign: "center", color: "#6b7280" }}>
                  İptal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAdd}
                style={{ flex: 1, padding: 12 }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    color: "#22c55e",
                    fontWeight: "700",
                  }}
                >
                  Kaydet
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
