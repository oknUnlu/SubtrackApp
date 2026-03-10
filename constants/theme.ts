import { Platform } from 'react-native';

/* ---- App Color Palette ---- */
export type AppColors = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  inputBg: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryLightText: string;
  danger: string;
  dangerBg: string;
  dangerText: string;
  dangerButton: string;
  modalOverlay: string;
  icon: string;
  iconSecondary: string;
  tabBarBg: string;
  tabBarBorder: string;
  chipBg: string;
  chipText: string;
  placeholder: string;
  purple: string;
  purpleDark: string;
  purpleBg: string;
  purpleBorder: string;
  purpleText: string;
  warning: string;
  safeAreaBg: string;
};

export const lightAppColors: AppColors = {
  background: "#f6f7f9",
  surface: "#fff",
  surfaceSecondary: "#f3f4f6",
  surfaceTertiary: "#f9fafb",
  text: "#222",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  inputBg: "#fff",
  primary: "#22c55e",
  primaryDark: "#16a34a",
  primaryLight: "#dcfce7",
  primaryLightText: "#16a34a",
  danger: "#ef4444",
  dangerBg: "#fee2e2",
  dangerText: "#991b1b",
  dangerButton: "#dc2626",
  modalOverlay: "rgba(0,0,0,0.35)",
  icon: "#374151",
  iconSecondary: "#6b7280",
  tabBarBg: "#fff",
  tabBarBorder: "#E5E7EB",
  chipBg: "#e5e7eb",
  chipText: "#374151",
  placeholder: "#9ca3af",
  purple: "#7c3aed",
  purpleDark: "#9333ea",
  purpleBg: "#faf5ff",
  purpleBorder: "#e9d5ff",
  purpleText: "#ede9fe",
  warning: "#f59e0b",
  safeAreaBg: "#fff",
};

export const darkAppColors: AppColors = {
  background: "#111827",
  surface: "#1f2937",
  surfaceSecondary: "#374151",
  surfaceTertiary: "#1f2937",
  text: "#f9fafb",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
  border: "#374151",
  inputBg: "#1f2937",
  primary: "#22c55e",
  primaryDark: "#16a34a",
  primaryLight: "#064e3b",
  primaryLightText: "#86efac",
  danger: "#f87171",
  dangerBg: "#450a0a",
  dangerText: "#fca5a5",
  dangerButton: "#dc2626",
  modalOverlay: "rgba(0,0,0,0.6)",
  icon: "#d1d5db",
  iconSecondary: "#9ca3af",
  tabBarBg: "#1f2937",
  tabBarBorder: "#374151",
  chipBg: "#374151",
  chipText: "#d1d5db",
  placeholder: "#6b7280",
  purple: "#a78bfa",
  purpleDark: "#7c3aed",
  purpleBg: "#1e1b3a",
  purpleBorder: "#4c1d95",
  purpleText: "#c4b5fd",
  warning: "#fbbf24",
  safeAreaBg: "#111827",
};

/* ---- Legacy Colors (used by themed components) ---- */
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#E6EEF2',
    placeholder: '#9BA1A6',
    danger: '#D14343',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#303234',
    placeholder: '#6F7678',
    danger: '#FF6B6B',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
