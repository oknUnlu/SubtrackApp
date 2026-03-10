import { useState } from "react";
import { View, type ViewStyle } from "react-native";

/**
 * AdBanner — renders a Google AdMob banner ad.
 *
 * react-native-google-mobile-ads requires native modules and will NOT
 * work in Expo Go. We dynamically require the module so the app
 * gracefully falls back to an empty view when the native module is
 * unavailable (Expo Go or web).
 */

const AD_UNIT_ID = "####################/##########"; 

let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

try {
  const mod = require("react-native-google-mobile-ads");
  BannerAd = mod.BannerAd;
  BannerAdSize = mod.BannerAdSize;
  TestIds = mod.TestIds;
} catch {
  // Module not available (Expo Go / web)
}

type Props = {
  style?: ViewStyle;
};

export default function AdBanner({ style }: Props) {
  const [failed, setFailed] = useState(false);

  if (!BannerAd || failed) {
    return <View style={style} />;
  }

  const unitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : AD_UNIT_ID;

  return (
    <View style={[{ alignItems: "center", marginTop: 16 }, style]}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
