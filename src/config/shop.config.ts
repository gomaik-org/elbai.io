/**
 * Centralized Shop Configuration
 *
 * This configuration file unifies all branding, theme colors, contact details,
 * legal information, navigation menus, and feature toggles.
 * Designed to make the Astro + Cloudflare Pages e-commerce storefront fully
 * modular, easily customizable for any brand, and ready for open source reuse.
 */

export interface ShopTheme {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  accent: string;
  accentHover: string;
  accentLight: string;
  surface: string;
  border: string;
}

export interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface ShopConfig {
  brand: {
    name: string;
    companyName: string;
    tagline: string;
    description: string;
    logoUrl: string;
    logoWidth: number;
    logoHeight: number;
    faviconUrl: string;
  };
  contact: {
    email: string;
    phone: string;
    phoneDisplay: string;
    supportHours: string;
    address: {
      company: string;
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  legal: {
    vatId: string;
    registerCourt: string;
    registerNumber: string;
    managingDirectors: string[];
    responsibleForContent: string;
  };
  localization: {
    currencyCode: string;
    currencySymbol: string;
    locale: string;
    defaultVatRate: number;
    reducedVatRate: number;
  };
  shipping: {
    freeShippingThresholdCents: number;
    flatRateShippingCents: number;
    standardDeliveryDays: string;
    shippingProviderNote: string;
  };
  features: {
    enableCustomerAccounts: boolean;
    enableB2BInvoice: boolean;
    enableTurnstileProtection: boolean;
    bestsellerInitialCount: number;
    bestsellerBatchIncrement: number;
    minOrderValueCents: number;
  };
  navigation: {
    header: NavItem[];
    footerSortiment: NavItem[];
    footerService: NavItem[];
    footerLegal: NavItem[];
  };
  theme: ShopTheme;
}

export const shopConfig: ShopConfig = {
  brand: {
    name: 'ELBI Verlag',
    companyName: 'ELBI Verlag GmbH',
    tagline: 'Hersteller für Schulen',
    description: 'Hersteller für praxiserprobte Schreibhefte, Schreiblehrgänge und Lehrerstempel für Grundschulen und Förderschulen seit über 30 Jahren.',
    logoUrl: '/images/branding/elbiLogo.png',
    logoWidth: 150,
    logoHeight: 114,
    faviconUrl: '/favicon.svg',
  },
  contact: {
    email: 'bestellung@elbi.de',
    phone: '+49406560001',
    phoneDisplay: '+49 (0) 40 / 656 00 01',
    supportHours: 'Mo–Fr 08:00 – 16:00 Uhr',
    address: {
      company: 'ELBI Verlag GmbH',
      street: 'Eiffestraße 74',
      city: 'Hamburg',
      postalCode: '20537',
      country: 'Deutschland',
    },
  },
  legal: {
    vatId: 'DE 118 546 832',
    registerCourt: 'Amtsgericht Hamburg',
    registerNumber: 'HRB 48721',
    managingDirectors: ['Manfred Ellerbrock'],
    responsibleForContent: 'Manfred Ellerbrock, Eiffestraße 74, 20537 Hamburg',
  },
  localization: {
    currencyCode: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    defaultVatRate: 19.0,
    reducedVatRate: 7.0,
  },
  shipping: {
    freeShippingThresholdCents: 5000,
    flatRateShippingCents: 490,
    standardDeliveryDays: '1–3 Werktage',
    shippingProviderNote: 'Schneller Direktversand per Post und Paketdienst',
  },
  features: {
    enableCustomerAccounts: true,
    enableB2BInvoice: true,
    enableTurnstileProtection: true,
    bestsellerInitialCount: 12,
    bestsellerBatchIncrement: 12,
    minOrderValueCents: 1000,
  },
  navigation: {
    header: [
      { label: 'Startseite', href: '/' },
      { label: 'Elbi Schreibhefte', href: '/catalog/elbi-schreibhefte' },
      { label: 'Lehrerstempel', href: '/catalog/elbi-lehrerstempel' },
    ],
    footerSortiment: [
      { label: 'Home', href: '/' },
      { label: 'Elbi Schreibhefte', href: '/catalog/elbi-schreibhefte' },
      { label: 'Lehrerstempel', href: '/catalog/elbi-lehrerstempel' },
    ],
    footerService: [
      { label: 'Versandkosten & Lieferzeiten', href: '/versand' },
      { label: 'Widerrufsrecht & Musterformular', href: '/widerruf' },
      { label: 'Kundenservice & Kontakt', href: '/kontakt' },
    ],
    footerLegal: [
      { label: 'Impressum', href: '/impressum' },
      { label: 'Datenschutz', href: '/datenschutz' },
      { label: 'Widerrufsbelehrung', href: '/widerruf' },
    ],
  },
  theme: {
    primary: '#0b57d0',
    primaryHover: '#0842a0',
    primaryLight: '#e8f0fe',
    accent: '#ff9e00',
    accentHover: '#e08b00',
    accentLight: '#fff8eb',
    surface: '#f8fafc',
    border: '#e2e8f0',
  },
};
