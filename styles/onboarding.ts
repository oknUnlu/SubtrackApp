import { Dimensions, StyleSheet } from "react-native";
import { AppColors } from "@/constants/theme";

const { width } = Dimensions.get("window");

export const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    slide: {
      width,
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 32,
    },
    slideTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
      marginBottom: 12,
    },
    slideSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 8,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 48,
    },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },
    dotActive: {
      width: 24,
      backgroundColor: colors.primary,
    },
    nextButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
    },
    nextButtonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700",
    },
    skipButton: {
      alignItems: "center",
      paddingVertical: 12,
      marginTop: 8,
    },
    skipText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: "500",
    },
    /* Currency selection */
    currencyList: {
      marginTop: 24,
      width: "100%",
    },
    currencyOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
      backgroundColor: colors.surface,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: "transparent",
    },
    currencyOptionActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    currencyLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 12,
    },
    currencySymbol: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.primary,
      width: 32,
      textAlign: "center",
    },
  });
