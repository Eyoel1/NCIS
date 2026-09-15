import React from 'react';
import { useTranslation, Language } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <div
      data-testid="language-toggle"
      className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-medium"
      role="group"
      aria-label="Language Selector"
    >
      <Globe className="h-3.5 w-3.5 text-slate-400 ml-1 shrink-0" aria-hidden="true" />
      <button
        type="button"
        data-testid="lang-en-btn"
        aria-pressed={language === 'en'}
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded transition-colors ${
          language === 'en'
            ? 'bg-sky-600 text-white font-bold shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        data-testid="lang-am-btn"
        aria-pressed={language === 'am'}
        onClick={() => setLanguage('am')}
        className={`px-2 py-1 rounded transition-colors ${
          language === 'am'
            ? 'bg-sky-600 text-white font-bold shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        አማ
      </button>
    </div>
  );
};
