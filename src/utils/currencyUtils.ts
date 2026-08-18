export type CurrencyCode = 'VND' | 'GBP' | 'EUR' | 'USD' | 'BRL' | 'RUB' | 'SAR';

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  nativeName: string;
  symbol: string;
  countryCode: string;
  locale: string;
  symbolPosition: 'prefix' | 'suffix';
  decimals: number;
  defaultPitchDay: number;
  defaultPitchNight: number;
  defaultExtra: number;
  roundingModes: {
    low: number;
    high: number;
    lowLabel: string;
    highLabel: string;
  };
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  VND: {
    code: 'VND',
    name: 'Đồng Việt Nam',
    nativeName: 'Việt Nam (VND)',
    symbol: '₫',
    countryCode: 'VN',
    locale: 'vi-VN',
    symbolPosition: 'suffix',
    decimals: 0,
    defaultPitchDay: 350000,
    defaultPitchNight: 500000,
    defaultExtra: 100000,
    roundingModes: {
      low: 5000,
      high: 10000,
      lowLabel: '5k',
      highLabel: '10k'
    }
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    nativeName: 'United Kingdom (GBP)',
    symbol: '£',
    countryCode: 'GB',
    locale: 'en-GB',
    symbolPosition: 'prefix',
    decimals: 0,
    defaultPitchDay: 40,
    defaultPitchNight: 60,
    defaultExtra: 10,
    roundingModes: {
      low: 1,
      high: 5,
      lowLabel: '1£',
      highLabel: '5£'
    }
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    nativeName: 'Eurozone (EUR)',
    symbol: '€',
    countryCode: 'EU',
    locale: 'de-DE',
    symbolPosition: 'suffix',
    decimals: 0,
    defaultPitchDay: 40,
    defaultPitchNight: 60,
    defaultExtra: 10,
    roundingModes: {
      low: 1,
      high: 5,
      lowLabel: '1€',
      highLabel: '5€'
    }
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    nativeName: 'United States (USD)',
    symbol: '$',
    countryCode: 'US',
    locale: 'en-US',
    symbolPosition: 'prefix',
    decimals: 0,
    defaultPitchDay: 50,
    defaultPitchNight: 75,
    defaultExtra: 15,
    roundingModes: {
      low: 1,
      high: 5,
      lowLabel: '1$',
      highLabel: '5$'
    }
  },
  BRL: {
    code: 'BRL',
    name: 'Real Brasileiro',
    nativeName: 'Brasil (BRL)',
    symbol: 'R$',
    countryCode: 'BR',
    locale: 'pt-BR',
    symbolPosition: 'prefix',
    decimals: 0,
    defaultPitchDay: 120,
    defaultPitchNight: 180,
    defaultExtra: 30,
    roundingModes: {
      low: 5,
      high: 10,
      lowLabel: 'R$5',
      highLabel: 'R$10'
    }
  },
  RUB: {
    code: 'RUB',
    name: 'Российский рубль',
    nativeName: 'Россия (RUB)',
    symbol: '₽',
    countryCode: 'RU',
    locale: 'ru-RU',
    symbolPosition: 'suffix',
    decimals: 0,
    defaultPitchDay: 2500,
    defaultPitchNight: 3500,
    defaultExtra: 500,
    roundingModes: {
      low: 50,
      high: 100,
      lowLabel: '50₽',
      highLabel: '100₽'
    }
  },
  SAR: {
    code: 'SAR',
    name: 'ريال سعودي',
    nativeName: 'المملكة العربية السعودية (SAR)',
    symbol: 'ر.س',
    countryCode: 'SA',
    locale: 'ar-SA',
    symbolPosition: 'suffix',
    decimals: 0,
    defaultPitchDay: 150,
    defaultPitchNight: 200,
    defaultExtra: 30,
    roundingModes: {
      low: 5,
      high: 10,
      lowLabel: '5 ر.س',
      highLabel: '10 ر.س'
    }
  }
};

export const LANGUAGE_DEFAULT_CURRENCY: Record<string, CurrencyCode> = {
  vi: 'VND',
  en: 'GBP',
  es: 'EUR',
  pt: 'EUR',
  ru: 'RUB',
  ar: 'SAR'
};

export function getCurrencyConfig(code?: string): CurrencyConfig {
  if (code && code in CURRENCIES) {
    return CURRENCIES[code as CurrencyCode];
  }
  return CURRENCIES.VND;
}

export function formatCurrencyAmount(amount: number, currencyCode: string = 'VND'): string {
  const config = getCurrencyConfig(currencyCode);
  const rounded = Math.round(amount);
  
  let formattedNumber = '';
  try {
    formattedNumber = new Intl.NumberFormat(config.locale, {
      maximumFractionDigits: config.decimals,
      minimumFractionDigits: config.decimals
    }).format(rounded);
  } catch {
    formattedNumber = rounded.toLocaleString();
  }

  if (config.symbolPosition === 'prefix') {
    return `${config.symbol}${formattedNumber}`;
  }
  return `${formattedNumber} ${config.symbol}`;
}
