export interface NoteStep {
  note: string;
  duration: string;
}

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

export interface ScoringConfig {
  basePoints: number;
  bonusAboveSteps: number;
  bonusAbovePoints: number;
  streakThreshold: number;
  streakBonus: number;
  maxScore: number;
}

export interface StarLevel {
  threshold: number;
  count: number;
}

export interface TimingConfig {
  countdownDuration: number;
  celebrationDuration: number;
  wrongFlashDuration: number;
  wrongFlashCount: number;
}

export interface BehaviorConfig {
  maxWrongAttempts: number;
  reduceStepsOnFail: boolean;
  vibrateOnTouch: boolean;
}

export interface ThemeConfig {
  backgroundGradient: string;
  fontFamily: string;
}

export interface GameMeta {
  id: string;
  name: string;
  description: string;
  version: string;
  ageRange: [number, number];
}

export interface MemoryLightsConfig {
  meta: GameMeta;
  lights: LightConfig[];
  audio: AudioConfig;
  difficulty: DifficultyLevel[];
  scoring: ScoringConfig;
  stars: StarLevel[];
  timing: TimingConfig;
  behavior: BehaviorConfig;
  theme: ThemeConfig;
}
