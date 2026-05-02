// Tipos do sistema de Activities — cenas com prop visual + animação +
// duração. Diferentes de "reactions" (mood + ação one-shot por toque).

export type ActivityName = 'eat' | 'dance' | 'bath' | 'sleep' | 'gift';

export type ActivityKind = 'oneshot' | 'toggle';

export interface ActivitySpec {
  name: ActivityName;
  kind: ActivityKind;
  /** Duração da cena (ms). Em toggle, usado como mínimo antes de aceitar stop. */
  durationMs: number;
  /** Mood disparado durante/ao final. */
  mood?: string;
  /** Implementação visual: monta DOM, anima, retorna fn de cleanup. */
  start: (stage: HTMLElement) => () => void;
}
