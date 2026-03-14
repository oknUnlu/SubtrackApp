import { Platform, StyleSheet } from "react-native";
import { AppColors } from "@/constants/theme";

export const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: Platform.OS === 'android' ? 100 : 40 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 6,
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  rowValue: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 48,
  },

  dangerCard: {
    marginTop: 4,
    backgroundColor: colors.dangerBg,
    borderRadius: 16,
    padding: 14,
  },
  dangerTitle: {
    fontWeight: "700",
    color: colors.dangerText,
    marginBottom: 10,
  },
  dangerButton: {
    backgroundColor: colors.dangerButton,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dangerText: {
    color: "#fff",
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: colors.surface,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: colors.text,
  },
  option: {
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
  },
});
