import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return 'system';
    
    // Check localStorage first, then default to system
    const savedTheme = localStorage.getItem('hirewise-theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
      return savedTheme;
    }
    
    return 'system';
  });

  // Get the actual applied theme (light or dark)
  const getAppliedTheme = () => {
    if (theme === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const [appliedTheme, setAppliedTheme] = useState(getAppliedTheme);

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('hirewise-theme', theme);
    
    // Apply theme to document root
    const root = document.documentElement;
    
    // Calculate the actual theme to apply
    const newAppliedTheme = getAppliedTheme();
    setAppliedTheme(newAppliedTheme);
    
    // For Tailwind CSS, we only need to manage the 'dark' class
    if (newAppliedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Listen for system theme changes if using system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        const newAppliedTheme = getAppliedTheme();
        setAppliedTheme(newAppliedTheme);
        if (newAppliedTheme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    if (theme === 'system') {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      // Cycle through: light → dark → system → light
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'system';
      return 'light';
    });
  };

  const setThemeDirectly = (newTheme) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const value = {
    theme,
    appliedTheme,
    toggleTheme,
    setTheme: setThemeDirectly,
    isDark: appliedTheme === 'dark',
    isLight: appliedTheme === 'light',
    isSystem: theme === 'system'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};