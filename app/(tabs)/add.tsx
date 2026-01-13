import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { styles } from "../../styles/add";

const categories = [
  { key: "food", label: "Yemek", icon: "🍔" },
  { key: "transport", label: "Ulaşım", icon: "🚗" },
  { key: "fun", label: "Eğlence", icon: "🎮" },
  { key: "shopping", label: "Alışveriş", icon: "🛍️" },
  { key: "bills", label: "Faturalar", icon: "📄" },
  { key: "health", label: "Sağlık", icon: "💊" },
  { key: "education", label: "Eğitim", icon: "📚" },
  { key: "tech", label: "Teknoloji", icon: "💻" },
  { key: "other", label: "Diğer", icon: "📌" },
];

export default function AddExpenseScreen() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Harcama Ekle</Text>
          <Text style={styles.subtitle}>Günlük harcamanızı kaydedin</Text>
        </View>
        <Ionicons name="notifications-outline" size={22} color="#222" />
      </View>

      {/* Title Input */}
      <Text style={styles.label}>Harcama Başlığı</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn: Kahve, Market alışverişi..."
        placeholderTextColor="#9ca3af"
        value={title}
        onChangeText={setTitle}
      />

      {/* Amount Input */}
      <Text style={styles.label}>Tutar (₺)</Text>
      <TextInput
        style={styles.amountInput}
        keyboardType="numeric"
        placeholder="0.00"
        placeholderTextColor="#9ca3af"
        value={amount}
        onChangeText={setAmount}
      />

      {/* Categories */}
      <Text style={styles.label}>Kategori</Text>
      <View style={styles.categoryGrid}>
        {categories.map((item) => {
          const selected = item.key === category;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.categoryCard,
                selected && styles.categorySelected,
              ]}
              onPress={() => setCategory(item.key)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selected && styles.categoryLabelSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton}>
        <Ionicons name="checkmark" size={20} color="#fff" />
        <Text style={styles.saveButtonText}>Harcama Kaydet</Text>
      </TouchableOpacity>

      {/* Ad Area */}
      <View style={styles.adArea}>
        <Text style={styles.adText}>REKLAM ALANI</Text>
      </View>
    </ScrollView>
  );
}
