import React from "react";
import { View } from "react-native";
import { Circle, G, Text as SvgText } from "react-native-svg";
import { PieChart } from "react-native-svg-charts";

type Item = {
  category: string;
  total: number;
  color: string;
};

type Props = {
  data: Item[];
  total: number;
};

export default function ExpenseDonutChart({ data, total }: Props) {
  const pieData = data.map((item) => ({
    value: item.total,
    svg: { fill: item.color },
    key: item.category,
  }));

  return (
    <View style={{ alignItems: "center", marginVertical: 12 }}>
      <PieChart
        style={{ height: 220, width: 220 }}
        data={pieData}
        innerRadius={70}
        outerRadius={100}
        padAngle={0.02}
        sort={() => null}
      >
        <G>
          <Circle cx="50%" cy="50%" r="70" fill="#fff" />

          <SvgText
            x="50%"
            y="47%"
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={13}
            fill="#6b7280"
          >
            Toplam
          </SvgText>

          <SvgText
            x="50%"
            y="57%"
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={18}
            fontWeight="bold"
            fill="#111827"
          >
            ₺{total.toFixed(0)}
          </SvgText>
        </G>
      </PieChart>
    </View>
  );
}
