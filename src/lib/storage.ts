/**
 * Thin, type-safe wrapper around localStorage.
 * All reads fail gracefully (return null) if storage is unavailable
 * or the stored value cannot be parsed.
 */

export function getItem<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded / storage disabled — ignore for this demo app.
  }
}

export function removeItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}
