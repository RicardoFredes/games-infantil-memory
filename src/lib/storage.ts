const STORAGE_PREFIX = 'memory-game-';

export function saveProgress(key: string, data: unknown): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable
  }
}

export function loadProgress<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function clearProgress(key?: string): void {
  try {
    if (key) {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } else {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
      keys.forEach(k => localStorage.removeItem(k));
    }
  } catch {
    // localStorage may be unavailable
  }
}
