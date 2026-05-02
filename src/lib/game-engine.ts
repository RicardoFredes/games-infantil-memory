export interface GameEngine<TConfig = unknown, TState = unknown> {
  readonly id: string;
  start(): Promise<void> | void;
  pause(): void;
  resume(): void;
  resetHistory(): void;
  destroy(): void;
  getState?(): Readonly<TState>;
  getConfig?(): Readonly<TConfig>;
}

export type GameDifficulty = 'progressivo' | 'fácil' | 'médio' | 'difícil';

export interface GameMeta {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  image?: string;
  icon: string;
  route: string;
  ageRange: [number, number];
  difficulty: GameDifficulty;
  color: string;
  enabled: boolean;
  backgroundMusic?: string;
  backgroundVolume?: number;
}

export type AlpineDataFactory = () => Record<string, unknown>;

export interface GameRegistration<TConfig = unknown, TState = unknown> {
  meta: GameMeta;
  config: TConfig;
  createEngine: (canvas?: HTMLCanvasElement) => GameEngine<TConfig, TState>;
  presentation: AlpineDataFactory;
}
