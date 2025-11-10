/**
 * Currency utility functions for consistent formatting across the app
 * Currently only supports AED (UAE Dirham)
 */

export const SUPPORTED_CURRENCIES = ['AED'] as const
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number]

export const BASE_CURRENCY = 'AED' as const

/**
 * Currency symbols mapping
 */
export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  AED: 'د.إ',
}

/**
 * Currency names
 */
export const CURRENCY_NAMES: Record<SupportedCurrency, string> = {
  AED: 'UAE Dirham',
}

/**
 * Format amount as currency with proper symbol and formatting
 *
 * @param amount - The amount to format
 * @param currency - Currency code (AED or USD)
 * @param locale - Locale for number formatting (default: en-AE)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56, 'AED') // "AED 1,234.56"
 * formatCurrency(1234.56, 'USD') // "$1,234.56"
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = 'AED',
  locale: string = 'en-AE'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format amount with currency symbol only (no full currency name)
 *
 * @param amount - The amount to format
 * @param currency - Currency code (AED)
 * @returns Formatted string with symbol
 *
 * @example
 * formatCurrencyCompact(1234.56, 'AED') // "د.إ 1,234.56"
 */
export function formatCurrencyCompact(
  amount: number,
  currency: SupportedCurrency = 'AED'
): string {
  const symbol = CURRENCY_SYMBOLS[currency]
  const formatted = new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${symbol} ${formatted}`
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
  return CURRENCY_SYMBOLS[currency] || currency
}

/**
 * Get currency name for a currency code
 */
export function getCurrencyName(currency: SupportedCurrency): string {
  return CURRENCY_NAMES[currency] || currency
}

/**
 * Check if a currency is supported
 */
export function isSupportedCurrency(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency)
}

/**
 * Format a currency value (all amounts are in AED)
 *
 * @param amount - The amount in AED
 * @returns Formatted string
 *
 * @example
 * formatConvertedCurrency(367.25) // "AED 367.25"
 */
export function formatConvertedCurrency(amount: number): string {
  return formatCurrency(amount, BASE_CURRENCY)
}

/**
 * Currency options for dropdowns/selects
 */
export const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES.map((code) => ({
  value: code,
  label: `${code} - ${CURRENCY_NAMES[code]}`,
  symbol: CURRENCY_SYMBOLS[code],
}))
