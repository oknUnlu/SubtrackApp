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

/* ---- Color Theme Accents ---- */
export type ColorTheme = {
  id: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;       // light mode bg tint
  primaryLightText: string;   // light mode text on light bg
  primaryLightDark: string;   // dark mode bg tint
  primaryLightTextDark: string; // dark mode text on dark bg
  trackColor: string;
  icon: string;
};

export const colorThemes: ColorTheme[] = [
  {
    id: "default",
    primary: "#22c55e", primaryDark: "#16a34a",
    primaryLight: "#dcfce7", primaryLightText: "#16a34a",
    primaryLightDark: "#064e3b", primaryLightTextDark: "#86efac",
    trackColor: "#bbf7d0", icon: "leaf-outline",
  },
  {
    id: "ocean",
    primary: "#3b82f6", primaryDark: "#2563eb",
    primaryLight: "#dbeafe", primaryLightText: "#2563eb",
    primaryLightDark: "#1e3a5f", primaryLightTextDark: "#93c5fd",
    trackColor: "#bfdbfe", icon: "water-outline",
  },
  {
    id: "sunset",
    primary: "#f97316", primaryDark: "#ea580c",
    primaryLight: "#ffedd5", primaryLightText: "#ea580c",
    primaryLightDark: "#5c2d0e", primaryLightTextDark: "#fdba74",
    trackColor: "#fed7aa", icon: "sunny-outline",
  },
  {
    id: "rose",
    primary: "#f43f5e", primaryDark: "#e11d48",
    primaryLight: "#ffe4e6", primaryLightText: "#e11d48",
    primaryLightDark: "#4c0519", primaryLightTextDark: "#fda4af",
    trackColor: "#fecdd3", icon: "heart-outline",
  },
  {
    id: "lavender",
    primary: "#8b5cf6", primaryDark: "#7c3aed",
    primaryLight: "#ede9fe", primaryLightText: "#7c3aed",
    primaryLightDark: "#2e1065", primaryLightTextDark: "#c4b5fd",
    trackColor: "#ddd6fe", icon: "flower-outline",
  },
  {
    id: "teal",
    primary: "#14b8a6", primaryDark: "#0d9488",
    primaryLight: "#ccfbf1", primaryLightText: "#0d9488",
    primaryLightDark: "#134e4a", primaryLightTextDark: "#5eead4",
    trackColor: "#99f6e4", icon: "diamond-outline",
  },
];

export function applyColorTheme(base: AppColors, theme: ColorTheme, isDark: boolean): AppColors {
  return {
    ...base,
    primary: theme.primary,
    primaryDark: theme.primaryDark,
    primaryLight: isDark ? theme.primaryLightDark : theme.primaryLight,
    primaryLightText: isDark ? theme.primaryLightTextDark : theme.primaryLightText,
  };
}

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
