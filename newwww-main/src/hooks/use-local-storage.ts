"use client";

import { useState, useEffect } from "react";

function getValue<T>(key: string, initialValue: T | (() => T)) {
  if (typeof window === "undefined") {
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : (initialValue instanceof Function ? initialValue() : initialValue);
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const [storedValue, setStoredValue] = useState<T>(() => getValue(key, initialValue));

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== JSON.stringify(storedValue)) {
        setStoredValue(item ? JSON.parse(item) : (initialValue instanceof Function ? initialValue() : initialValue));
      }
    } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
