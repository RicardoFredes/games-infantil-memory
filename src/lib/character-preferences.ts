// Preferências globais do personagem (compartilhadas entre todos os jogos).
// Hoje só guarda a paleta; pode crescer com nome, acessórios, etc.

import {
  characterPalettes,
  defaultPalette,
  type CharacterPaletteName,
} from './character-palettes'

const STORAGE_KEY = 'memory-game-character-prefs'

interface CharacterPrefs {
  palette: CharacterPaletteName
}

const isValidPalette = (v: unknown): v is CharacterPaletteName =>
  typeof v === 'string' && v in characterPalettes

function read(): CharacterPrefs {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return { palette: defaultPalette }
    const parsed = JSON.parse(raw)
    return {
      palette: isValidPalette(parsed?.palette) ? parsed.palette : defaultPalette,
    }
  } catch {
    return { palette: defaultPalette }
  }
}

function write(prefs: CharacterPrefs) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    }
  } catch {
    /* no-op */
  }
}

export function getPalette(): CharacterPaletteName {
  return read().palette
}

export function setPalette(palette: CharacterPaletteName): void {
  if (!isValidPalette(palette)) return
  const next: CharacterPrefs = { ...read(), palette }
  write(next)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('character:palette-change', {
      detail: { palette },
    }))
  }
}
