import { View, type ViewStyle } from "react-native";

type Props = {
  style?: ViewStyle;
};

/** AdBanner stub for web — native ads are not supported on web. */
export default function AdBanner({ style }: Props) {
  return <View style={style} />;
}
