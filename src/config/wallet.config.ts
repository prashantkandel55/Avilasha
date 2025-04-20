import { ThemeConfig } from '../types/global';

export const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export const WALLET_CONFIG = {
  supportedNetworks: [
    'ethereum',
    'binance-smart-chain',
    'polygon',
    'avalanche',
    'solana',
    'sui'
  ],
  refreshInterval: 30000, // 30 seconds
  priceUpdateInterval: 60000, // 1 minute
  maxWallets: 10,
  maxTokensPerPage: 50,
  defaultFiatCurrency: 'USD',
  supportedFiatCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CNY', 'INR'],
  defaultGasPrice: 'standard',
  gasPriceRefreshInterval: 15000, // 15 seconds
  chartTimeframes: ['24h', '7d', '30d', '90d', '1y', 'all'],
  defaultTimeframe: '7d'
};

export const CHART_CONFIG = {
  colors: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b'
  },
  gradients: {
    profit: ['rgba(37, 99, 235, 0.1)', 'rgba(37, 99, 235, 0)'],
    loss: ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0)']
  }
};

export const THEME_CONFIG: ThemeConfig = {
  dark: {
    background: '#0f172a',
    foreground: '#ffffff',
    card: '#1e293b',
    border: '#334155',
    muted: '#64748b',
    accent: '#2563eb'
  },
  light: {
    background: '#ffffff',
    foreground: '#0f172a',
    card: '#f8fafc',
    border: '#e2e8f0',
    muted: '#64748b',
    accent: '#2563eb'
  }
};