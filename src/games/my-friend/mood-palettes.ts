import type { CharacterPalette } from '@/lib/character-palettes';

export const moodPalettes: Record<string, CharacterPalette> = {
  sad: {
    skinTop: '#A8B8C8',
    skinBottom: '#5A6B80',
    eyeHighlightTop: '#A8B8C8',
    eyeHighlightBottom: '#7A8A9A',
    limbs: '#8090A0',
  },
  tired: {
    skinTop: '#B8C8D8',
    skinBottom: '#708090',
    eyeHighlightTop: '#B8C8D8',
    eyeHighlightBottom: '#8898A8',
    limbs: '#9AAAB8',
  },
  sleeping: {
    skinTop: '#C0B0D8',
    skinBottom: '#6A5290',
    eyeHighlightTop: '#C0B0D8',
    eyeHighlightBottom: '#8A78AA',
    limbs: '#A898C8',
  },
  angry: {
    skinTop: '#FF8080',
    skinBottom: '#A82020',
    eyeHighlightTop: '#FF8080',
    eyeHighlightBottom: '#C84040',
    limbs: '#E04040',
  },
};

export function getMoodPalette(mood: string): CharacterPalette | null {
  return moodPalettes[mood] ?? null;
}
