import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { enTranslations } from '../locales/en';
import { amTranslations } from '../locales/am';

export type Language = 'en' | 'am';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, defaultValue?: string) => string;
  isAmharic: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('ncis_lang');
      if (saved === 'am' || saved === 'en') return saved;
    } catch {
      // Local storage not available
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('ncis_lang', lang);
    } catch {
      // Ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (path: string, defaultValue?: string): string => {
    const dict = language === 'am' ? amTranslations : enTranslations;
    const fallbackDict = enTranslations;
    const keys = path.split('.');

    let current: any = dict;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English dictionary
        let fallbackVal: any = fallbackDict;
        for (const fbKey of keys) {
          if (fallbackVal && typeof fallbackVal === 'object' && fbKey in fallbackVal) {
            fallbackVal = fallbackVal[fbKey];
          } else {
            return defaultValue || path;
          }
        }
        return typeof fallbackVal === 'string' ? fallbackVal : defaultValue || path;
      }
    }

    return typeof current === 'string' ? current : defaultValue || path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isAmharic: language === 'am' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
