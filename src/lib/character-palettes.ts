export type CharacterPalette = {
  skinTop: string;
  skinBottom: string;
  eyeHighlightTop: string;
  eyeHighlightBottom: string;
  limbs: string;
};

export const characterPalettes = {
  purple: {
    skinTop: '#D4B8FF',
    skinBottom: '#9B6BDB',
    eyeHighlightTop: '#D4B8FF',
    eyeHighlightBottom: '#B088E0',
    limbs: '#C3A0FF',
  },
  pink: {
    skinTop: '#FFC3DC',
    skinBottom: '#DB6B95',
    eyeHighlightTop: '#FFC3DC',
    eyeHighlightBottom: '#E088B0',
    limbs: '#FFA8C9',
  },
  green: {
    skinTop: '#C3FFD4',
    skinBottom: '#5DC288',
    eyeHighlightTop: '#C3FFD4',
    eyeHighlightBottom: '#88D8A8',
    limbs: '#A8EDBE',
  },
  blue: {
    skinTop: '#B8D4FF',
    skinBottom: '#5C8FD8',
    eyeHighlightTop: '#B8D4FF',
    eyeHighlightBottom: '#88B0E0',
    limbs: '#A0C3FF',
  },
} as const satisfies Record<string, CharacterPalette>;

export type CharacterPaletteName = keyof typeof characterPalettes;

export const defaultPalette: CharacterPaletteName = 'purple';
