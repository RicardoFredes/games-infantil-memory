// Composer: monta o objeto Alpine para `gameCharacter`.
// Une mode atual + overlays one-shot e expõe getters de bindings prontos
// para serem usados em :class, :transform, :d, :opacity etc.

import type { ModeName, Side } from './types'
import { modes, defaultMode } from '@/config/character/modes'
import { actions } from '@/config/character/actions'
import {
  createOverlayState, vibrate,
  applyWink, releaseWink,
  applyEyesClosed, releaseEyesClosed,
  type OverlayState,
} from './actions'
import { resolveArmLeft, resolveArmRight } from './parts/arm'
import { resolveEye } from './parts/eye'
import { resolveEyebrowLeft, resolveEyebrowRight } from './parts/eyebrow'
import { resolveMouth } from './parts/mouth'
import { resolveBody } from './parts/body'
import { resolveLeg } from './parts/leg'
import { resolveNose } from './parts/nose'

type Timer = ReturnType<typeof setTimeout> | null

export interface CharacterStore {
  mode: ModeName
  overlay: OverlayState
  _moodTimer: Timer
  _jumpTimer: Timer
  _leftEyeTimer: Timer
  _rightEyeTimer: Timer

  init(): void
  setMood(m: ModeName, durationMs?: number): void
  jump(durationMs?: number): void
  wink(side?: Side, durationMs?: number): void
  closeEyes(durationMs?: number): void

  // bindings (getters)
  readonly armLeftBindings:    ReturnType<typeof resolveArmLeft>
  readonly armRightBindings:   ReturnType<typeof resolveArmRight>
  readonly eyeLeftBindings:    ReturnType<typeof resolveEye>
  readonly eyeRightBindings:   ReturnType<typeof resolveEye>
  readonly eyebrowLeftBindings:  ReturnType<typeof resolveEyebrowLeft>
  readonly eyebrowRightBindings: ReturnType<typeof resolveEyebrowRight>
  readonly mouthBindings:      ReturnType<typeof resolveMouth>
  readonly bodyBindings:       ReturnType<typeof resolveBody>
  readonly legLeftBindings:    ReturnType<typeof resolveLeg>
  readonly legRightBindings:   ReturnType<typeof resolveLeg>
  readonly footLeftBindings:   ReturnType<typeof resolveLeg>
  readonly footRightBindings:  ReturnType<typeof resolveLeg>
  readonly noseBindings:       ReturnType<typeof resolveNose>
  readonly blushOpacity: number
  readonly tearOpacity:  number
  readonly armsOverHead: boolean
}

export function createCharacterStore(): CharacterStore {
  return {
    mode: defaultMode,
    overlay: createOverlayState(),
    _moodTimer: null,
    _jumpTimer: null,
    _leftEyeTimer: null,
    _rightEyeTimer: null,

    init() {
      window.addEventListener('character:set-mood', ((e: CustomEvent) => {
        this.setMood(e.detail.mood, e.detail.duration)
      }) as EventListener)
      window.addEventListener('character:wink', ((e: CustomEvent) => {
        this.wink(e.detail?.side ?? 'right', e.detail?.duration)
      }) as EventListener)
      window.addEventListener('character:eyes-closed', ((e: CustomEvent) => {
        this.closeEyes(e.detail?.duration)
      }) as EventListener)
      window.addEventListener('character:jump', ((e: CustomEvent) => {
        this.jump(e.detail?.duration)
      }) as EventListener)
    },

    setMood(m, durationMs = 0) {
      this.mode = m
      if (this._moodTimer) clearTimeout(this._moodTimer)
      if (durationMs > 0) {
        this._moodTimer = setTimeout(() => { this.mode = defaultMode }, durationMs)
      }
    },

    jump(durationMs) {
      if (this.overlay.jumping) return
      const cfg = actions.jump
      const ms = durationMs ?? cfg.durationMs
      this.overlay.jumping = true
      vibrate(cfg.vibrateMs)
      if (this._jumpTimer) clearTimeout(this._jumpTimer)
      this._jumpTimer = setTimeout(() => { this.overlay.jumping = false }, ms)
    },

    wink(side = 'right', durationMs) {
      const ms = durationMs ?? actions.wink.durationMs
      applyWink(this.overlay, side)
      if (side === 'left') {
        if (this._leftEyeTimer) clearTimeout(this._leftEyeTimer)
        this._leftEyeTimer = setTimeout(() => releaseWink(this.overlay, 'left'), ms)
      } else {
        if (this._rightEyeTimer) clearTimeout(this._rightEyeTimer)
        this._rightEyeTimer = setTimeout(() => releaseWink(this.overlay, 'right'), ms)
      }
    },

    closeEyes(durationMs) {
      const ms = durationMs ?? actions.eyesClosed.durationMs
      applyEyesClosed(this.overlay)
      if (this._leftEyeTimer)  clearTimeout(this._leftEyeTimer)
      if (this._rightEyeTimer) clearTimeout(this._rightEyeTimer)
      if (ms > 0) {
        this._leftEyeTimer  = setTimeout(() => { this.overlay.leftEyeClosed = false  }, ms)
        this._rightEyeTimer = setTimeout(() => { this.overlay.rightEyeClosed = false }, ms)
      } else {
        // 0 = manter fechado indefinidamente
        releaseEyesClosed // no-op marker
      }
    },

    // ─── Bindings ─────────────────────────────────────────────

    get armLeftBindings() {
      const overlay = this.overlay.jumping
        ? { transform: actions.jump.armTransform.left }
        : undefined
      return resolveArmLeft(modes[this.mode].armLeft, overlay)
    },
    get armRightBindings() {
      const overlay = this.overlay.jumping
        ? { transform: actions.jump.armTransform.right }
        : undefined
      return resolveArmRight(modes[this.mode].armRight, overlay)
    },
    get eyeLeftBindings() {
      return resolveEye(modes[this.mode].eyeLeft, {
        forceClosed: this.overlay.leftEyeClosed || this.mode === 'sleeping',
      })
    },
    get eyeRightBindings() {
      return resolveEye(modes[this.mode].eyeRight, {
        forceClosed: this.overlay.rightEyeClosed || this.mode === 'sleeping',
      })
    },
    get eyebrowLeftBindings()  { return resolveEyebrowLeft(modes[this.mode].eyebrowLeft) },
    get eyebrowRightBindings() { return resolveEyebrowRight(modes[this.mode].eyebrowRight) },
    get mouthBindings()        { return resolveMouth(modes[this.mode].mouth) },
    get bodyBindings() {
      const overlayAnim = this.overlay.jumping ? actions.jump.bodyAnim : undefined
      return resolveBody(modes[this.mode].body, { anim: overlayAnim })
    },
    get legLeftBindings()   { return resolveLeg(modes[this.mode].legLeft) },
    get legRightBindings()  { return resolveLeg(modes[this.mode].legRight) },
    get footLeftBindings()  { return resolveLeg(modes[this.mode].legLeft) },
    get footRightBindings() { return resolveLeg(modes[this.mode].legRight) },
    get noseBindings()      { return resolveNose(modes[this.mode].nose) },
    get blushOpacity()      { return modes[this.mode].blush },
    get tearOpacity()       { return modes[this.mode].tears },
    get armsOverHead()      { return modes[this.mode].body.armsOverHead },
  }
}
