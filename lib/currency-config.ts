/**
 * Currency Configuration Utility
 * Centralized currency management for the Instreamly platform
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  exchangeRate?: number; // relative to USD
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    locale: 'en-IN',
    exchangeRate: 83.0, // 1 USD = 83 INR (approximate)
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    exchangeRate: 1.0, // Base currency
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'en-EU',
    exchangeRate: 0.92, // 1 USD = 0.92 EUR (approximate)
  },
};

// Platform configuration - can be changed via environment variable
export const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_PLATFORM_CURRENCY || 'INR';

/**
 * Get current platform currency configuration
 */
export function getPlatformCurrency(): CurrencyConfig {
  return SUPPORTED_CURRENCIES[DEFAULT_CURRENCY] || SUPPORTED_CURRENCIES.INR;
}

/**
 * Format amount with platform currency
 */
export function formatPlatformCurrency(amount: number): string {
  const currency = getPlatformCurrency();
  
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback formatting
    return `${currency.symbol}${amount.toLocaleString(currency.locale)}`;
  }
}

/**
 * Format amount with specific currency
 */
export function formatCurrencyWithCode(amount: number, currencyCode?: string): string {
  const currency = currencyCode 
    ? SUPPORTED_CURRENCIES[currencyCode] || getPlatformCurrency()
    : getPlatformCurrency();
    
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback formatting
    return `${currency.symbol}${amount.toLocaleString(currency.locale)}`;
  }
}

/**
 * Get currency symbol for platform currency
 */
export function getCurrencySymbol(): string {
  return getPlatformCurrency().symbol;
}

/**
 * Get currency code for platform currency
 */
export function getCurrencyCode(): string {
  return getPlatformCurrency().code;
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string
): number {
  const from = SUPPORTED_CURRENCIES[fromCurrency];
  const to = SUPPORTED_CURRENCIES[toCurrency];
  
  if (!from || !to) {
    throw new Error(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`);
  }
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / (from.exchangeRate || 1);
  const convertedAmount = usdAmount * (to.exchangeRate || 1);
  
  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert amount to platform currency from USD
 */
export function convertFromUSD(usdAmount: number): number {
  return convertCurrency(usdAmount, 'USD', getCurrencyCode());
}

/**
 * Convert amount from platform currency to USD
 */
export function convertToUSD(platformAmount: number): number {
  return convertCurrency(platformAmount, getCurrencyCode(), 'USD');
}

/**
 * Get localized currency input placeholder
 */
export function getCurrencyInputPlaceholder(): string {
  const currency = getPlatformCurrency();
  return `Enter amount in ${currency.code}`;
}

/**
 * Validate currency amount
 */
export function validateCurrencyAmount(amount: number): boolean {
  return typeof amount === 'number' && amount >= 0 && isFinite(amount);
}

/**
 * Parse currency string to number (removes symbols and formatting)
 */
export function parseCurrencyString(currencyString: string): number {
  // Remove currency symbols and parse
  const cleaned = currencyString.replace(/[₹$€,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Get minimum amount for different operations (in platform currency)
 */
export function getMinimumAmounts() {
  const currencyCode = getCurrencyCode();
  return {
    wallet_topup: currencyCode === 'INR' ? 100 : 1,      // ₹100 or $1
    withdrawal: currencyCode === 'INR' ? 500 : 5,        // ₹500 or $5
    campaign_budget: currencyCode === 'INR' ? 1000 : 10, // ₹1000 or $10
    payment_processing: currencyCode === 'INR' ? 50 : 1,  // ₹50 or $1
  };
}

// Legacy export for backward compatibility
export const MINIMUM_AMOUNTS = {
  get wallet_topup() { return getMinimumAmounts().wallet_topup; },
  get withdrawal() { return getMinimumAmounts().withdrawal; },
  get campaign_budget() { return getMinimumAmounts().campaign_budget; },
  get payment_processing() { return getMinimumAmounts().payment_processing; },
};

/**
 * Get current currency configuration for forms and validation
 */
export function getCurrencyConfig() {
  return {
    code: getCurrencyCode(),
    symbol: getCurrencySymbol(),
    locale: getPlatformCurrency().locale,
    minimums: getMinimumAmounts(),
    formatter: formatPlatformCurrency,
  };
}

// Legacy export for backward compatibility
export const CURRENCY_CONFIG = {
  get code() { return getCurrencyCode(); },
  get symbol() { return getCurrencySymbol(); },
  get locale() { return getPlatformCurrency().locale; },
  get minimums() { return getMinimumAmounts(); },
  formatter: formatPlatformCurrency,
};

// Export for backward compatibility
export { formatPlatformCurrency as formatCurrency };

const CurrencyService = {
  getPlatformCurrency,
  formatPlatformCurrency,
  formatCurrencyWithCode,
  getCurrencySymbol,
  getCurrencyCode,
  convertCurrency,
  convertFromUSD,
  convertToUSD,
  validateCurrencyAmount,
  parseCurrencyString,
  getMinimumAmounts,
  getCurrencyConfig,
  MINIMUM_AMOUNTS,
  CURRENCY_CONFIG,
  SUPPORTED_CURRENCIES,
};

export default CurrencyService;
