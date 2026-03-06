import React from "react";
import { View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

type Props = {
  data: { day: string; total: number; label: string }[];
  currencySymbol: string;
};

export default function WeeklyBarChart({ data, currencySymbol }: Props) {
  if (data.length === 0) return null;

  const today = new Date().getDay().toString();

  const barData = data.map((item) => ({
    value: item.total,
    label: item.label,
    frontColor: item.day === today ? "#16a34a" : "#22c55e",
    topLabelComponent: () => null,
  }));

  return (
    <View style={{ marginVertical: 8 }}>
      <BarChart
        data={barData}
        barWidth={28}
        spacing={12}
        noOfSections={4}
        barBorderRadius={6}
        yAxisThickness={0}
        xAxisThickness={1}
        xAxisColor="#e5e7eb"
        yAxisTextStyle={{ fontSize: 11, color: "#9ca3af" }}
        xAxisLabelTextStyle={{ fontSize: 11, color: "#6b7280" }}
        formatYLabel={(val: string) => `${currencySymbol}${val}`}
        isAnimated
        animationDuration={500}
      />
    </View>
  );
}
