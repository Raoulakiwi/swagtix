import { useState, useEffect } from 'react';
import { message } from '@/background/webapi';
import { createPersistStore } from '@/background/utils';

// SwagTix Brand Colors
export const SWAGTIX_COLORS = {
  BLUE: '#00A3FF',
  PURPLE: '#7B5BFF',
  PINK: '#FF3D8A',
  DARK: '#192945',
  LIGHT: '#F5F6FA',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
};

// CSS Variables mapping
export const CSS_VARIABLES = {
  // Primary colors
  '--r-blue-default': SWAGTIX_COLORS.PURPLE, // Use purple as primary
  '--r-blue-light': '#9B85FF',  // Lighter purple
  '--r-blue-dark': '#5A3BFF',   // Darker purple
  
  // Accent colors
  '--r-green-default': '#52c41a',
  '--r-green-light': '#73d13d',
  '--r-red-default': SWAGTIX_COLORS.PINK, // Use pink as error/alert color
  '--r-red-light': '#FF6BA9',
  
  // Neutral colors - Light theme
  '--r-neutral-title-1': SWAGTIX_COLORS.DARK,
  '--r-neutral-title-2': '#3E495E',
  '--r-neutral-title-3': '#5E6B81',
  '--r-neutral-body': '#5E6B81',
  '--r-neutral-foot': '#8E99AB',
  '--r-neutral-line': '#E5E9EF',
  '--r-neutral-bg-1': SWAGTIX_COLORS.LIGHT,
  '--r-neutral-bg-2': '#EFF3FF',
  '--r-neutral-bg-3': '#F7FAFF',
  '--r-neutral-card-1': SWAGTIX_COLORS.WHITE,
  '--r-neutral-card-2': '#F7FAFF',
  '--r-neutral-card-3': '#EFF3FF',
  
  // Gradients
  '--r-gradient-primary': `linear-gradient(to bottom, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK})`,
  '--r-gradient-button': `linear-gradient(to right, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK})`,
  '--r-gradient-header': `linear-gradient(to right, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE})`,
};

// Dark theme CSS variables
export const DARK_CSS_VARIABLES = {
  ...CSS_VARIABLES,
  '--r-neutral-title-1': '#FFFFFF',
  '--r-neutral-title-2': '#E5E9EF',
  '--r-neutral-title-3': '#C0C5CF',
  '--r-neutral-body': '#C0C5CF',
  '--r-neutral-foot': '#8E99AB',
  '--r-neutral-line': '#3E495E',
  '--r-neutral-bg-1': '#121212',
  '--r-neutral-bg-2': '#1F1F1F',
  '--r-neutral-bg-3': '#2A2A2A',
  '--r-neutral-card-1': '#1F1F1F',
  '--r-neutral-card-2': '#2A2A2A',
  '--r-neutral-card-3': '#333333',
};

// Theme store interface
interface ThemeStore {
  mode: 'light' | 'dark' | 'system';
  systemIsDark: boolean;
}

// Create persistent store for theme preferences
const themeStore = createPersistStore<ThemeStore>({
  name: 'theme',
  template: {
    mode: 'light',
    systemIsDark: false,
  },
});

// Apply CSS variables to document root
const applyTheme = (isDark: boolean) => {
  const variables = isDark ? DARK_CSS_VARIABLES : CSS_VARIABLES;
  Object.entries(variables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  
  // Add or remove dark-theme class from body
  if (isDark) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
};

// Hook for using theme in components
export const useTheme = () => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');
  const [isDark, setIsDark] = useState(false);

  // Initialize theme from store
  useEffect(() => {
    const initTheme = async () => {
      const { mode, systemIsDark } = await themeStore.get();
      setThemeMode(mode);
      
      // Determine if dark mode should be active
      let shouldBeDark = false;
      if (mode === 'dark') {
        shouldBeDark = true;
      } else if (mode === 'system') {
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      setIsDark(shouldBeDark);
      applyTheme(shouldBeDark);
    };
    
    initTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        const newIsDark = e.matches;
        setIsDark(newIsDark);
        applyTheme(newIsDark);
        themeStore.set({ systemIsDark: newIsDark });
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // Function to change theme
  const setTheme = async (mode: 'light' | 'dark' | 'system') => {
    let newIsDark = isDark;
    
    if (mode === 'light') {
      newIsDark = false;
    } else if (mode === 'dark') {
      newIsDark = true;
    } else if (mode === 'system') {
      newIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    setThemeMode(mode);
    setIsDark(newIsDark);
    applyTheme(newIsDark);
    
    await themeStore.set({
      mode,
      systemIsDark: newIsDark,
    });
    
    // Notify background about theme change
    message.send('theme_changed', { mode, isDark: newIsDark });
  };

  return {
    themeMode,
    isDark,
    setTheme,
    colors: SWAGTIX_COLORS,
  };
};

// Utility function to generate gradient text style
export const getGradientTextStyle = () => ({
  background: `linear-gradient(to right, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: 'transparent',
});

// Utility function to generate ticket style
export const getTicketStyle = (isDark: boolean) => ({
  position: 'relative' as const,
  background: isDark ? '#1F1F1F' : SWAGTIX_COLORS.WHITE,
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '16px',
  border: `1px solid ${isDark ? '#333' : '#E5E9EF'}`,
  '&::before, &::after': {
    content: '""',
    position: 'absolute' as const,
    width: '20px',
    height: '20px',
    background: isDark ? '#121212' : SWAGTIX_COLORS.LIGHT,
    borderRadius: '50%',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  '&::before': {
    left: '-10px',
    borderRight: `1px dashed ${isDark ? '#333' : '#E5E9EF'}`,
  },
  '&::after': {
    right: '-10px',
    borderLeft: `1px dashed ${isDark ? '#333' : '#E5E9EF'}`,
  },
});

// Initialize theme on app load
export const initTheme = async () => {
  const { mode, systemIsDark } = await themeStore.get();
  let isDark = false;
  
  if (mode === 'dark') {
    isDark = true;
  } else if (mode === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  applyTheme(isDark);
  return { mode, isDark };
};
