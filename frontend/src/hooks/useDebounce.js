import { useState, useEffect } from 'react';

/**
 * Debounces a value — only updates after `delay` ms of inactivity.
 * Used by ManualEntryForm to avoid firing a search API on every keystroke.
 *
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 350ms)
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
