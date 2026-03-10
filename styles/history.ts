import { StyleSheet } from "react-native";
import { AppColors } from "@/constants/theme";

export const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchBar: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    paddingLeft: 40,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    color: colors.text,
  },
  searchIcon: {
    position: "absolute",
    left: 28,
    top: 85,
    zIndex: 1,
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.chipBg,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.chipText,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  categoryFilterRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  txIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontWeight: "600",
    fontSize: 15,
    color: colors.text,
  },
  txSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txNotes: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontWeight: "700",
    fontSize: 15,
    marginRight: 10,
    color: colors.text,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  resultCount: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 10,
    textAlign: "center",
  },
});
