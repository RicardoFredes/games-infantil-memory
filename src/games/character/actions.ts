// One-shot actions: estados transientes que sobrescrevem partes do mode atual.
// Cada action é independente e pode rodar concorrentemente com outras
// (ex.: wink durante jump). O composer combina as overlays no momento de
// resolver os bindings.

import type { Side } from './types'

export interface OverlayState {
  jumping: boolean
  waving: boolean
  shaking: boolean
  bouncing: boolean
  leftEyeClosed: boolean
  rightEyeClosed: boolean
}

export function createOverlayState(): OverlayState {
  return {
    jumping: false,
    waving: false,
    shaking: false,
    bouncing: false,
    leftEyeClosed: false,
    rightEyeClosed: false,
  }
}

export function vibrate(ms: number) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms)
  } catch {
    /* no-op */
  }
}

/** Lado oposto ao do wink (ex.: 'left' fecha apenas o olho esquerdo). */
export function applyWink(state: OverlayState, side: Side) {
  if (side === 'left') state.leftEyeClosed = true
  else state.rightEyeClosed = true
}

export function releaseWink(state: OverlayState, side: Side) {
  if (side === 'left') state.leftEyeClosed = false
  else state.rightEyeClosed = false
}

export function applyEyesClosed(state: OverlayState) {
  state.leftEyeClosed = true
  state.rightEyeClosed = true
}

export function releaseEyesClosed(state: OverlayState) {
  state.leftEyeClosed = false
  state.rightEyeClosed = false
}
