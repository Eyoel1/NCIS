import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { language } = useTranslation();

  const isLight = theme === 'light';
  const label = isLight
    ? (language === 'am' ? 'ጨለማ ገጽታ' : 'Switch to Dark Mode')
    : (language === 'am' ? 'ብርሃን ገጽታ' : 'Switch to Light Mode');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className="relative flex items-center justify-center p-2 rounded-xl border border-slate-700/60 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 group"
    >
      {isLight ? (
        <Moon className="w-4 h-4 text-slate-600 hover:text-slate-900 transition-transform duration-200 group-hover:-rotate-12" />
      ) : (
        <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-transform duration-200 group-hover:rotate-45" />
      )}
      <span className="sr-only">{label}</span>
    </button>
  );
};
