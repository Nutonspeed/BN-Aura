'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeConfig, defaultTheme, applyTheme } from './themeConfig';

interface ThemeContextType {
  theme: ThemeConfig;
  mode: 'light' | 'dark';
  setTheme: (theme: ThemeConfig) => void;
  setMode: (mode: 'light' | 'dark') => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(defaultTheme);
  const [mode, setModeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as 'light' | 'dark' | null;
    const savedTheme = localStorage.getItem('theme-config');
    
    if (savedMode) setModeState(savedMode);
    if (savedTheme) {
      try {
        setThemeState(JSON.parse(savedTheme));
      } catch {}
    }
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!savedMode && prefersDark) setModeState('dark');
  }, []);

  useEffect(() => {
    applyTheme(theme, mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [theme, mode]);

  const setTheme = (newTheme: ThemeConfig) => {
    setThemeState(newTheme);
    localStorage.setItem('theme-config', JSON.stringify(newTheme));
  };

  const setMode = (newMode: 'light' | 'dark') => {
    setModeState(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  const toggleMode = () => setMode(mode === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
