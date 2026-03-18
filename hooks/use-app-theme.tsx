import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { AppColors, lightAppColors, darkAppColors, colorThemes, applyColorTheme } from '@/constants/theme';
import { getSetting } from '@/database/db';

type ThemeContextType = {
  colors: AppColors;
  isDark: boolean;
  setDarkMode: (mode: string) => void;
  colorThemeId: string;
  setColorTheme: (id: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: lightAppColors,
  isDark: false,
  setDarkMode: () => {},
  colorThemeId: 'default',
  setColorTheme: () => {},
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<string>('system');
  const [colorThemeId, setColorThemeId] = useState<string>('default');

  useEffect(() => {
    getSetting('darkMode').then(v => {
      if (v) setMode(v);
    });
    getSetting('colorTheme').then(v => {
      if (v) setColorThemeId(v);
    });
  }, []);

  const isDark = useMemo(() => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return systemScheme === 'dark';
  }, [mode, systemScheme]);

  const colors = useMemo(() => {
    const base = isDark ? darkAppColors : lightAppColors;
    const theme = colorThemes.find(t => t.id === colorThemeId);
    if (!theme || theme.id === 'default') return base;
    return applyColorTheme(base, theme, isDark);
  }, [isDark, colorThemeId]);

  const value = useMemo(() => ({
    colors,
    isDark,
    setDarkMode: setMode,
    colorThemeId,
    setColorTheme: setColorThemeId,
  }), [colors, isDark, colorThemeId]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
