import { StyleSheet } from "react-native";
import { AppColors } from "@/constants/theme";

export const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
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
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 6,
  },
  amount: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    color: colors.text,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  adArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  adTitle: {
    fontWeight: "600",
    color: colors.textMuted,
  },
  adSubtitle: {
    color: colors.textMuted,
    marginTop: 4,
  },
  bottomTab: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.tabBarBg,
  },
  tabItem: {
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    color: colors.text,
    backgroundColor: colors.inputBg,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden" as const,
    backgroundColor: colors.inputBg,
  },
  subCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  subCardTitle: {
    fontWeight: "600" as const,
    fontSize: 16,
    color: colors.text,
  },
  subCardInterval: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  subCardAmount: {
    fontWeight: "700" as const,
    fontSize: 16,
    marginRight: 12,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: "center" as const,
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 12,
    color: colors.text,
  },
  intervalRow: {
    flexDirection: "row" as const,
    marginBottom: 12,
  },
  intervalButton: {
    flex: 1,
    padding: 10,
    marginRight: 6,
    borderRadius: 10,
  },
  intervalButtonText: {
    textAlign: "center" as const,
    fontWeight: "600" as const,
  },
  modalActions: {
    flexDirection: "row" as const,
  },
  modalActionButton: {
    flex: 1,
    padding: 12,
  },
});
