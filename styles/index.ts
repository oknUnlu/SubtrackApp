import { Platform, StyleSheet } from "react-native";
import { AppColors } from "@/constants/theme";

export const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.background,
    paddingBottom: Platform.OS === 'android' ? 100 : 40,
  },
  statHint: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  date: {
    color: colors.textSecondary,
    marginTop: 2,
  },

  totalCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  totalHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalLabel: {
    color: "rgba(255,255,255,0.85)",
    marginLeft: 8,
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    marginVertical: 8,
  },
  totalFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalSubText: {
    color: "rgba(255,255,255,0.75)",
    marginLeft: 6,
  },

  largeCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: colors.text,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textSecondary,
  },

});
