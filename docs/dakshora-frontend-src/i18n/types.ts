export type Language = 'en' | 'hi' | 'hi-en';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
  description: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'hi-en',
    label: 'हिंदी + English',
    nativeLabel: 'Bilingual (अनुशंसित / Recommended)',
    flag: '🇮🇳',
    description: 'Bilingual labels understandable to everyone (Default)'
  },
  {
    code: 'hi',
    label: 'हिंदी',
    nativeLabel: 'सरल हिंदी (Hindi Medium)',
    flag: '🇮🇳',
    description: 'Everyday common Hindi used in Indian schools'
  },
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English (English Medium)',
    flag: '🇬🇧',
    description: 'Standard English interface'
  }
];
