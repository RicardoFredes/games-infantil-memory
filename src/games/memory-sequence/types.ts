import type { NoteStep } from '@/lib/audio';
import type { ScoringConfig, StarLevel } from '@/lib/scoring';

export type { NoteStep };
export type { ScoringConfig, StarLevel };

export interface LightConfig {
  id: string;
  color: string;
  glow: string;
  note: string;
  emoji: string;
  label: string;
}

export interface AudioConfig {
  instrument: string;
  volume: number;
  victoryArpeggio: NoteStep[];
  countdownPattern: NoteStep[];
  errorPattern: NoteStep[];
}

export interface DifficultyLevel {
  rounds: [number, number];
  steps: number;
  lightDuration: number;
  gapDuration: number;
}

export interface TimingConfig {
  countdownDuration: number;
  celebrationDuration: number;
  wrongFlashDuration: number;
  wrongFlashCount: number;
  timerStepBaseMs: number;
  timerStepMinMs: number;
}

export interface BehaviorConfig {
  maxWrongAttempts: number;
  reduceStepsOnFail: boolean;
  vibrateOnTouch: boolean;
  instantFail: boolean;
  enableTimer: boolean;
}

export interface ThemeConfig {
  backgroundGradient: string;
  fontFamily: string;
}

export interface GameConfigMeta {
  id: string;
  name: string;
  description: string;
  version: string;
  ageRange: [number, number];
}

export interface MemoryLightsConfig {
  meta: GameConfigMeta;
  lights: LightConfig[];
  audio: AudioConfig;
  difficulty: DifficultyLevel[];
  scoring: ScoringConfig;
  stars: StarLevel[];
  timing: TimingConfig;
  behavior: BehaviorConfig;
  theme: ThemeConfig;
}

export type GameState =
  | 'IDLE'
  | 'SHOWING_SEQUENCE'
  | 'WAITING_INPUT'
  | 'CHECKING'
  | 'CORRECT'
  | 'WRONG'
  | 'CELEBRATING'
  | 'COUNTDOWN';

export interface AppState {
  score: number;
  stars: number;
  round: number;
  gameState: GameState;
  activeLight: number | null;
  message: string;
  showCountdown: boolean;
  showCelebration: boolean;
  sequenceDisplay: number[];
  earnedPoints: number;
}
