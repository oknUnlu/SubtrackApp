import React from "react";
import { Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

type Item = {
  category: string;
  total: number;
  color: string;
};

type Props = {
  data: Item[];
  total: number;
  currencySymbol: string;
  totalLabel: string;
};

export default function ExpenseDonutChart({ data, total, currencySymbol, totalLabel }: Props) {
  const pieData = data.map((item) => ({
    value: item.total,
    color: item.color,
    text: item.category,
  }));

  if (pieData.length === 0) return null;

  return (
    <View style={{ alignItems: "center", marginVertical: 12 }}>
      <PieChart
        data={pieData}
        donut
        radius={100}
        innerRadius={65}
        innerCircleColor="#fff"
        centerLabelComponent={() => (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>{totalLabel}</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
              {currencySymbol}{total.toFixed(0)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
