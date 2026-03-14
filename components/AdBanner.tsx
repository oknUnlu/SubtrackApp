import { useState, useEffect } from "react";
import { View, type ViewStyle } from "react-native";

/**
 * AdBanner — renders a Google AdMob banner ad.
 *
 * react-native-google-mobile-ads requires native modules and will NOT
 * work in Expo Go. We dynamically require the module so the app
 * gracefully falls back to an empty view when the native module is
 * unavailable (Expo Go or web).
 *
 * Developer devices are registered as test devices to avoid
 * AdMob invalid traffic violations.
 */

const AD_UNIT_ID = "ca-app-pub-3850996093825148/7549678024";

/**
 * Add your own device advertising IDs here to receive test ads
 * instead of real ads (prevents AdMob invalid traffic penalty).
 *
 * HOW TO FIND YOUR DEVICE ID:
 * 1. Run the production app on your device
 * 2. Check logcat (Android) for this message:
 *    "Use RequestConfiguration.Builder.setTestDeviceIds(Arrays.asList("XXXXXXXX"))"
 * 3. Copy that ID and paste it below
 */
const MY_TEST_DEVICE_IDS: string[] = [
  // "YOUR_DEVICE_ID_HERE",  // ← replace with your real device ID from logcat
];

let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
let mobileAds: any = null;

try {
  const mod = require("react-native-google-mobile-ads");
  BannerAd = mod.BannerAd;
  BannerAdSize = mod.BannerAdSize;
  TestIds = mod.TestIds;
  mobileAds = mod.default;
} catch {
  // Module not available (Expo Go / web)
}

/** Register test devices once at app start */
let _configured = false;
function configureTestDevices() {
  if (_configured || !mobileAds || MY_TEST_DEVICE_IDS.length === 0) return;
  try {
    mobileAds().setRequestConfiguration({
      testDeviceIdentifiers: MY_TEST_DEVICE_IDS,
    });
    _configured = true;
  } catch {
    // silently ignore
  }
}

type Props = {
  style?: ViewStyle;
};

export default function AdBanner({ style }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    configureTestDevices();
  }, []);

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
