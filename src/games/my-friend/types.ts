import type { CharacterPaletteName } from '@/lib/character-palettes';

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

export interface Reaction {
  mood: string;
  moodDuration: number;
  action?: 'jump' | 'shake' | 'bounce' | 'wave';
}

export interface MyFriendConfig {
  meta: GameConfigMeta;
  palettes: CharacterPaletteName[];
  defaultPalette: CharacterPaletteName;
  zones: ZoneConfig;
  reactions: Record<string, Reaction>;
}

export interface MyFriendState {
  palette: CharacterPaletteName;
}

export interface ZoneTapEvent {
  zone: Zone | null;
}
