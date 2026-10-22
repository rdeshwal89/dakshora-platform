import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, SUPPORTED_LANGUAGES } from './types';
import { en } from './translations/en';
import { hi } from './translations/hi';
import { hiEn } from './translations/hiEn';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  isBilingual: boolean;
  isHindi: boolean;
  isEnglish: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'dakshora_user_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved && ['en', 'hi', 'hi-en'].includes(saved)) {
        return saved;
      }
      return 'hi-en'; // Default recommended bilingual option for Indian schools
    } catch {
      return 'hi-en';
    }
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
    } catch {
      // storage quota or private browsing fallback
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
  }, [language]);

  const activeDictionary = useMemo(() => {
    switch (language) {
      case 'hi':
        return hi;
      case 'en':
        return en;
      case 'hi-en':
      default:
        return hiEn;
    }
  }, [language]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const val = (activeDictionary as Record<string, string>)[key];
      if (val !== undefined) return val;
      // Fallback to bilingual or english or the fallback argument
      const fallbackVal = (hiEn as Record<string, string>)[key] || (en as Record<string, string>)[key] || fallback || key;
      return fallbackVal;
    },
    [activeDictionary]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isBilingual: language === 'hi-en',
      isHindi: language === 'hi',
      isEnglish: language === 'en'
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      language: 'hi-en',
      setLanguage: () => {},
      t: (key: string, fallback?: string) => (hiEn as Record<string, string>)[key] || fallback || key,
      isBilingual: true,
      isHindi: false,
      isEnglish: false
    };
  }
  return context;
};

/**
 * Reusable Language Selector Dropdown Component
 * Compact, accessible, beautiful matching the school ERP styling.
 */
export const LanguageSelector: React.FC<{
  variant?: 'header' | 'modal' | 'pill' | 'compact';
  className?: string;
}> = ({ variant = 'header', className = '' }) => {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const activeOption = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-lang-selector]')) {
        setIsOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 ${className}`}>
        {SUPPORTED_LANGUAGES.map((opt) => (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLanguage(opt.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              language === opt.code
                ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200/80 scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>{opt.flag}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} data-lang-selector>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 border cursor-pointer ${
          variant === 'header'
            ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs'
            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs'
        }`}
        title="Select School Portal Language / भाषा चुनें"
      >
        <Globe className={`w-3.5 h-3.5 ${variant === 'header' ? 'text-cyan-400' : 'text-indigo-600'}`} />
        <span>{activeOption.flag}</span>
        <span className="hidden sm:inline">{activeOption.label}</span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-mono text-slate-600 uppercase font-bold flex items-center justify-between">
            <span>🌐 भाषा / Language</span>
            <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">Indian Schools</span>
          </div>

          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((opt) => {
              const isSelected = language === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => {
                    setLanguage(opt.code);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-indigo-50/80 transition-colors cursor-pointer ${
                    isSelected ? 'bg-indigo-50/80 font-bold text-indigo-900' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{opt.flag}</span>
                    <div>
                      <div className="font-semibold text-slate-900">{opt.label}</div>
                      <div className="text-[10px] text-slate-600 font-sans">{opt.nativeLabel}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="px-3 pt-2 pb-1 border-t border-slate-100 text-[10px] text-slate-600 font-sans leading-tight">
            💡 <strong>Bilingual (हिंदी + English)</strong> is recommended for Indian schools so teachers and parents can comfortably read both languages.
          </div>
        </div>
      )}
    </div>
  );
};
