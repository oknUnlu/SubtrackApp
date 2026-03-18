import { View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

type Props = {
  data: { day: string; total: number; label: string }[];
  currencySymbol: string;
  axisColor?: string;
  labelColor?: string;
  yLabelColor?: string;
  barColor?: string;
  barColorActive?: string;
};

export default function WeeklyBarChart({ data, currencySymbol, axisColor = "#e5e7eb", labelColor = "#6b7280", yLabelColor = "#9ca3af", barColor = "#22c55e", barColorActive = "#16a34a" }: Props) {
  if (data.length === 0) return null;

  const today = new Date().getDay().toString();

  const barData = data.map((item) => ({
    value: item.total,
    label: item.label,
    frontColor: item.day === today ? barColorActive : barColor,
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
        xAxisColor={axisColor}
        yAxisTextStyle={{ fontSize: 11, color: yLabelColor }}
        xAxisLabelTextStyle={{ fontSize: 11, color: labelColor }}
        formatYLabel={(val: string) => `${currencySymbol}${val}`}
        isAnimated
        animationDuration={500}
      />
    </View>
  );
}
