// Composer: monta o objeto Alpine para `gameCharacter`.
// Estrutura: `mode` é o destino lógico; `animState` guarda valores numéricos
// interpolados (alimentados por anime.js). Bindings usam animState pra
// transforms e leem o mode pra paths/classes (que são discretos).

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
import { createAnimState, targetFromMode, transitionTo, type AnimState } from './transition'

type Timer = ReturnType<typeof setTimeout> | null

export interface CharacterStore {
  mode: ModeName
  overlay: OverlayState
  animState: AnimState
  _moodTimer: Timer
  _jumpTimer: Timer
  _leftEyeTimer: Timer
  _rightEyeTimer: Timer

  init(): void
  setMood(m: ModeName, durationMs?: number): void
  jump(durationMs?: number): void
  wink(side?: Side, durationMs?: number): void
  closeEyes(durationMs?: number): void

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
  readonly armLeftPoseOpacities:  Record<string, number>
  readonly armRightPoseOpacities: Record<string, number>
  readonly mouthPoseOpacities:    Record<string, number>
}

const TRANSITION_MS = 400
const TRANSITION_EASE = 'outQuad'

export function createCharacterStore(): CharacterStore {
  return {
    mode: defaultMode,
    overlay: createOverlayState(),
    animState: createAnimState(modes[defaultMode]),
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
      transitionTo(this.animState, targetFromMode(modes[m]), {
        durationMs: TRANSITION_MS,
        ease: TRANSITION_EASE,
      })
      if (this._moodTimer) clearTimeout(this._moodTimer)
      if (durationMs > 0) {
        this._moodTimer = setTimeout(() => {
          this.mode = defaultMode
          transitionTo(this.animState, targetFromMode(modes[defaultMode]), {
            durationMs: TRANSITION_MS,
            ease: TRANSITION_EASE,
          })
        }, durationMs)
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
        releaseEyesClosed
      }
    },

    // ─── Bindings ─────────────────────────────────────────────

    get armLeftBindings() {
      const overlay = this.overlay.jumping
        ? { transform: actions.jump.armTransform.left }
        : undefined
      return resolveArmLeft(modes[this.mode].armLeft, this.animState.armLeft, overlay)
    },
    get armRightBindings() {
      const overlay = this.overlay.jumping
        ? { transform: actions.jump.armTransform.right }
        : undefined
      return resolveArmRight(modes[this.mode].armRight, this.animState.armRight, overlay)
    },
    get eyeLeftBindings() {
      return resolveEye(modes[this.mode].eyeLeft, this.animState.eyeLeft, {
        forceClosed: this.overlay.leftEyeClosed || this.mode === 'sleeping',
      })
    },
    get eyeRightBindings() {
      return resolveEye(modes[this.mode].eyeRight, this.animState.eyeRight, {
        forceClosed: this.overlay.rightEyeClosed || this.mode === 'sleeping',
      })
    },
    get eyebrowLeftBindings()  { return resolveEyebrowLeft(modes[this.mode].eyebrowLeft, this.animState.eyebrowLeft) },
    get eyebrowRightBindings() { return resolveEyebrowRight(modes[this.mode].eyebrowRight, this.animState.eyebrowRight) },
    get mouthBindings()        { return resolveMouth(modes[this.mode].mouth) },
    get bodyBindings() {
      const overlayAnim = this.overlay.jumping ? actions.jump.bodyAnim : undefined
      return resolveBody(modes[this.mode].body, { anim: overlayAnim })
    },
    get legLeftBindings()   { return resolveLeg(this.animState.legLeft) },
    get legRightBindings()  { return resolveLeg(this.animState.legRight) },
    get footLeftBindings()  { return resolveLeg(this.animState.legLeft) },
    get footRightBindings() { return resolveLeg(this.animState.legRight) },
    get noseBindings()      { return resolveNose(this.animState.nose) },
    get blushOpacity()      { return this.animState.blush },
    get tearOpacity()       { return this.animState.tears },
    get armsOverHead()      { return modes[this.mode].body.armsOverHead },
    get armLeftPoseOpacities()  { return this.animState.armLeftPoseOpacities },
    get armRightPoseOpacities() { return this.animState.armRightPoseOpacities },
    get mouthPoseOpacities()    { return this.animState.mouthPoseOpacities },
  }
}
