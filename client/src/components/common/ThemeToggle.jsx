import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (selectedTheme) => {
    // Update the context to accept direct theme setting
    if (typeof setTheme === 'function') {
      setTheme(selectedTheme);
    }
  };

  const themes = [
    {
      id: 'light',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      label: 'Light'
    },
    {
      id: 'dark',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
      label: 'Dark'
    },
    {
      id: 'system',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: 'System'
    }
  ];

  return (
    <div className={`inline-flex bg-gray-200 dark:bg-gray-700 rounded-full p-1 transition-colors duration-300 ${className}`}>
      {themes.map((themeOption) => (
        <button
          key={themeOption.id}
          onClick={() => handleThemeChange(themeOption.id)}
          className={`
            relative inline-flex items-center justify-center w-8 h-8 rounded-full
            transition-all duration-300 ease-in-out
            ${theme === themeOption.id 
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }
          `}
          aria-label={`Switch to ${themeOption.label} mode`}
          title={`${themeOption.label} mode`}
        >
          {themeOption.icon}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;