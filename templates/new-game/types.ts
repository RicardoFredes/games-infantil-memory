import type { ScoringConfig, StarLevel } from '@/lib/scoring';

export type { ScoringConfig, StarLevel };

export interface GameConfigMeta {
  id: string;
  name: string;
  description: string;
  version: string;
  ageRange: [number, number];
}

export interface __GAME_ID__Config {
  meta: GameConfigMeta;
  scoring: ScoringConfig;
  stars: StarLevel[];
}

export type __GAME_ID__GameState = 'IDLE' | 'PLAYING' | 'WIN';
