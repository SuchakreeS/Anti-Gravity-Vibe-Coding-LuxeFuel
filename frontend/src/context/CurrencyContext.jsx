import React, { createContext, useState, useEffect, useCallback } from 'react';

export const CurrencyContext = createContext();

// Fallback rates (relative to THB) in case the API is unavailable
const FALLBACK_RATES = {
  THB: 1,
  USD: 0.029,
  EUR: 0.026,
  GBP: 0.023,
  JPY: 4.28,
  CNY: 0.21,
  KRW: 39.5,
};

const CURRENCY_SYMBOLS = {
  THB: '฿',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
};

const CURRENCY_NAMES = {
  THB: 'Thai Baht',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan',
  KRW: 'Korean Won',
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('selectedCurrency') || 'THB';
  });
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [loading, setLoading] = useState(true);

  // Fetch live exchange rates from a free API (base: THB)
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/THB');
        const data = await res.json();
        if (data.result === 'success') {
          // Only keep the currencies we support
          const filtered = {};
          Object.keys(FALLBACK_RATES).forEach(code => {
            filtered[code] = data.rates[code] || FALLBACK_RATES[code];
          });
          setRates(filtered);
        }
      } catch (err) {
        console.warn('Failed to fetch live exchange rates, using fallback.', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  // Persist selection
  useEffect(() => {
    localStorage.setItem('selectedCurrency', currency);
  }, [currency]);

  // Convert a THB amount to the selected currency
  const convert = useCallback((amountInTHB) => {
    if (amountInTHB === null || amountInTHB === undefined) return null;
    const rate = rates[currency] || 1;
    return amountInTHB * rate;
  }, [currency, rates]);

  // Format a converted value with symbol
  const formatPrice = useCallback((amountInTHB, decimals = 2) => {
    const converted = convert(amountInTHB);
    if (converted === null) return '—';
    const symbol = CURRENCY_SYMBOLS[currency] || '';
    return `${symbol}${converted.toFixed(decimals)}`;
  }, [convert, currency]);

  const symbol = CURRENCY_SYMBOLS[currency] || '';

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      convert,
      formatPrice,
      symbol,
      rates,
      loading,
      availableCurrencies: Object.keys(CURRENCY_SYMBOLS),
      currencyNames: CURRENCY_NAMES,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};
