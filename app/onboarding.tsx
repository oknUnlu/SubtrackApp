import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  ViewToken,
} from "react-native";

import AppLogo from "@/components/AppLogo";
import { setSetting } from "@/database/db";
import { useAppTheme } from "@/hooks/use-app-theme";
import { createStyles } from "@/styles/onboarding";

const { width } = Dimensions.get("window");

type CurrencyOption = { code: string; symbol: string; labelKey: string };

const CURRENCIES: CurrencyOption[] = [
  { code: "TRY", symbol: "₺", labelKey: "settings.currencyTRY" },
  { code: "USD", symbol: "$", labelKey: "settings.currencyUSD" },
  { code: "EUR", symbol: "€", labelKey: "settings.currencyEUR" },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState("TRY");

  const slides = useMemo(
    () => [
      {
        key: "welcome",
        icon: "wallet-outline" as const,
        iconColor: colors.primary,
        iconBg: colors.primaryLight,
        title: t("onboarding.welcomeTitle"),
        subtitle: t("onboarding.welcomeSubtitle"),
      },
      {
        key: "features",
        icon: "sparkles-outline" as const,
        iconColor: colors.purple,
        iconBg: colors.purpleBg,
        title: t("onboarding.featuresTitle"),
        subtitle: t("onboarding.featuresSubtitle"),
      },
      {
        key: "currency",
        icon: "cash-outline" as const,
        iconColor: "#f59e0b",
        iconBg: "#fef3c7",
        title: t("onboarding.currencyTitle"),
        subtitle: t("onboarding.currencySubtitle"),
      },
    ],
    [t, colors]
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  async function handleNext() {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      await finishOnboarding();
    }
  }

  async function handleSkip() {
    await finishOnboarding();
  }

  async function finishOnboarding() {
    await setSetting("currency", selectedCurrency);
    await setSetting("onboardingComplete", "true");
    router.replace("/(tabs)");
  }

  function renderSlide({ item }: { item: (typeof slides)[number] }) {
    return (
      <View style={styles.slide}>
        {item.key === "welcome" ? (
          <View style={{ marginBottom: 32 }}>
            <AppLogo size={100} colors={colors} />
          </View>
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
            <Ionicons name={item.icon} size={52} color={item.iconColor} />
          </View>
        )}
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

        {item.key === "currency" && (
          <View style={styles.currencyList}>
            {CURRENCIES.map((cur) => (
              <Pressable
                key={cur.code}
                style={[
                  styles.currencyOption,
                  selectedCurrency === cur.code && styles.currencyOptionActive,
                ]}
                onPress={() => setSelectedCurrency(cur.code)}
              >
                <Text style={styles.currencySymbol}>{cur.symbol}</Text>
                <Text style={styles.currencyLabel}>{t(cur.labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {isLastSlide ? t("onboarding.getStarted") : t("onboarding.next")}
          </Text>
        </Pressable>

        {/* Skip button */}
        {!isLastSlide && (
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{t("onboarding.skip")}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
