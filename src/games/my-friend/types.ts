import type { CharacterPaletteName } from '@/lib/character-palettes';
import type { ActivityName } from './activities/types';

export interface GameConfigMeta {
  id: string;
  name: string;
  description: string;
  version: string;
  ageRange: [number, number];
}

export type Zone =
  | 'head'
  | 'eye-l' | 'eye-r'
  | 'mouth'
  | 'body'
  | 'arm-l' | 'arm-r'
  | 'leg-l' | 'leg-r'
  | 'foot-l' | 'foot-r';

export interface ZoneConfig {
  cooldownMs: number;
}

export interface FeatureFlags {
  /** Aplica tint de cor temporário no personagem conforme o mood ativo. */
  moodPaletteTint: boolean;
}

export interface Reaction {
  mood?: string;
  moodDuration?: number;
  action?: 'jump' | 'shake' | 'bounce' | 'wave';
}

export interface MyFriendConfig {
  meta: GameConfigMeta;
  palettes: CharacterPaletteName[];
  defaultPalette: CharacterPaletteName;
  features?: Partial<FeatureFlags>;
  zones: ZoneConfig;
  reactions: Record<string, Reaction>;
}

export interface MyFriendState {
  palette: CharacterPaletteName;
  currentActivity?: ActivityName | null;
}

export interface ZoneTapEvent {
  zone: Zone | null;
}
