const STORAGE_PREFIX = 'memory-game-';

export function saveProgress(key: string, data: unknown): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
  } catch {
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
  }
}

const STATE_SUFFIX = '-state';

export function loadGameState<T>(gameId: string): T | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${gameId}${STATE_SUFFIX}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveGameState<T>(gameId: string, state: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${gameId}${STATE_SUFFIX}`, JSON.stringify(state));
  } catch {
  }
}

export function clearGameState(gameId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${gameId}${STATE_SUFFIX}`);
  } catch {
  }
}
