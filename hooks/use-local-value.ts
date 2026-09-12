"use client";
import { useSyncExternalStore } from "react";
const event = "samauto-storage";
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(event, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(event, cb);
  };
}
export function useLocalValue(key: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
  function set(value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
      window.dispatchEvent(new Event(event));
    } catch {
      /* Browser storage may be disabled. */
    }
  }
  return [value, set] as const;
}
