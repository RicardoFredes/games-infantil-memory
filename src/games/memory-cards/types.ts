export interface CardImage {
  src: string;
  label: string;
}

export interface DifficultyLevel {
  rounds: [number, number];
  pairs: number;
  columns: number;
}

export interface ScoringConfig {
  matchPoints: number;
  streakThreshold: number;
  streakBonus: number;
  maxScore: number;
}

export interface StarLevel {
  threshold: number;
  count: number;
}

export interface AudioConfig {
  volume: number;
  backgroundMusic?: string;
  backgroundVolume?: number;
}

export interface BehaviorConfig {
  flipBackDelay: number;
  vibrateOnTouch: boolean;
  showLabels: boolean;
}

export interface ThemeConfig {
  backgroundGradient: string;
  cardBack: string;
}

export interface GameMeta {
  id: string;
  name: string;
  description: string;
  version: string;
  ageRange: [number, number];
}

export interface MemoryCardsConfig {
  meta: GameMeta;
  decks: Record<string, CardImage[]>;
  defaultDeck: string;
  difficulty: DifficultyLevel[];
  scoring: ScoringConfig;
  stars: StarLevel[];
  audio: AudioConfig;
  behavior: BehaviorConfig;
  theme: ThemeConfig;
}

export interface CardData {
  id: number;
  uid: string;
  image: CardImage;
  matched: boolean;
  open: boolean;
}

export type CardsGameState = 'IDLE' | 'PLAYING' | 'COMPARING' | 'WIN';
