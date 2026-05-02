import type { CharacterPaletteName } from '@/lib/character-palettes';

export interface GameConfigMeta {
  id: string;
  name: string;
  description: string;
  version: string;
  ageRange: [number, number];
}

export type GestureKind = 'tap' | 'slap' | 'stroke' | 'tickle' | 'longPress' | 'doubleTap';

export type Zone =
  | 'head'
  | 'eye-l' | 'eye-r'
  | 'mouth'
  | 'body'
  | 'arm-l' | 'arm-r'
  | 'leg-l' | 'leg-r'
  | 'foot-l' | 'foot-r';

export interface GestureConfig {
  maxDurationMs?: number;
  minDurationMs?: number;
  maxDistance?: number;
  minDistance?: number;
  minVelocity?: number;
  maxVelocity?: number;
  minDirChanges?: number;
  windowMs?: number;
  maxIntervalMs?: number;
  cooldownMs: number;
}

export interface Reaction {
  mood: string;
  moodDuration: number;
  action?: 'jump' | 'shake' | 'bounce' | 'wave';
}

export interface MyFriendConfig {
  meta: GameConfigMeta;
  palettes: CharacterPaletteName[];
  defaultPalette: CharacterPaletteName;
  gestures: Record<GestureKind, GestureConfig>;
  reactions: Record<string, Reaction>;
}

export interface MyFriendState {
  palette: CharacterPaletteName;
}

export interface GestureEvent {
  kind: GestureKind;
  zone: Zone | null;
  velocity?: number;
  distance?: number;
  durationMs?: number;
}
