export interface GameEventMap {
  'game:state-change':   { gameState: string; score: number; stars: number; round: number };
  'game:correct':        { earned: number; total: number; streak: number };
  'game:wrong':          { wrongCount?: number; maxAttempts?: number };
  'game:countdown':      { display: string };
  'game:score-animate':  { earned: number; total: number };
  'game:paused':         Record<string, never>;
  'game:resumed':        Record<string, never>;
  'game:timer-start':    { totalMs: number };
  'game:timer-tick':     { percent: number; remaining: number };
  'game:timer-stop':     Record<string, never>;
  'game:timer-expired':  Record<string, never>;
}

export function emit<K extends keyof GameEventMap>(name: K, detail: GameEventMap[K]): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on<K extends keyof GameEventMap>(
  name: K,
  handler: (detail: GameEventMap[K]) => void,
): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<GameEventMap[K]>).detail);
  window.addEventListener(name, listener as EventListener);
  return () => window.removeEventListener(name, listener as EventListener);
}

export function emitRaw(name: string, detail?: unknown): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
