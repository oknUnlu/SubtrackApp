import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { AppColors, lightAppColors, darkAppColors } from '@/constants/theme';
import { getSetting } from '@/database/db';

type ThemeContextType = {
  colors: AppColors;
  isDark: boolean;
  setDarkMode: (mode: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: lightAppColors,
  isDark: false,
  setDarkMode: () => {},
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<string>('system');

  useEffect(() => {
    getSetting('darkMode').then(v => {
      if (v) setMode(v);
    });
  }, []);

  const isDark = useMemo(() => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return systemScheme === 'dark';
  }, [mode, systemScheme]);

  const colors = isDark ? darkAppColors : lightAppColors;

  const value = useMemo(() => ({
    colors,
    isDark,
    setDarkMode: setMode,
  }), [colors, isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
