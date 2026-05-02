// Composer: monta o objeto Alpine para `gameCharacter`.
// `mode` é o destino lógico; anime.js cuida de TUDO: transições de mood
// (base), loops cíclicos (cycles) e one-shots (jump).

import type { ModeName, Side, Transform2D } from './types'
import { modes, defaultMode } from '@/config/character/modes'
import { actions } from '@/config/character/actions'
import {
  createOverlayState, vibrate,
  applyWink, releaseWink,
  applyEyesClosed,
  type OverlayState,
} from './actions'
import { resolveArmLeft, resolveArmRight } from './parts/arm'
import { resolveEye } from './parts/eye'
import { resolveEyebrowLeft, resolveEyebrowRight } from './parts/eyebrow'
import { resolveMouth } from './parts/mouth'
import { resolveBody } from './parts/body'
import { resolveLeg } from './parts/leg'
import { resolveNose } from './parts/nose'
import { mergeTransform } from './parts/transform'
import {
  createAnimState, targetFromMode, transitionTo, createTransitionHandles,
  type AnimState, type TransitionHandles,
} from './transition'
import {
  startBreathing, startBlink, applyModeCycles, createCycleHandles,
  type CycleHandles,
} from './cycles'
import {
  playJump, startBodyJumpLoop, stopJump, createJumpHandles,
  type JumpHandles,
} from './jump'
import { playWave, stopWave, createWaveHandles, type WaveHandles } from './wave'
import { playShake, stopShake, createShakeHandles, type ShakeHandles } from './shake'
import { playBounce, stopBounce, createBounceHandles, type BounceHandles } from './bounce'
import { animate as animateAnime } from 'animejs'

let bellyHandle: ReturnType<typeof animateAnime> | null = null
function animateBelly(state: AnimState, to: number, duration: number) {
  if (bellyHandle) try { bellyHandle.cancel() } catch { /* já cancelada */ }
  bellyHandle = animateAnime(state, { bellyScale: to, duration, ease: 'outQuad' })
}

type Timer = ReturnType<typeof setTimeout> | null

export interface CharacterStore {
  mode: ModeName
  overlay: OverlayState
  animState: AnimState
  _transitionHandles: TransitionHandles
  _cycleHandles: CycleHandles
  _jumpHandles: JumpHandles
  _waveHandles: WaveHandles
  _shakeHandles: ShakeHandles
  _bounceHandles: BounceHandles
  _moodTimer: Timer
  _jumpTimer: Timer
  _waveTimer: Timer
  _shakeTimer: Timer
  _bounceTimer: Timer
  _leftEyeTimer: Timer
  _rightEyeTimer: Timer

  init(): void
  setMood(m: ModeName, durationMs?: number): void
  jump(durationMs?: number): void
  wave(durationMs?: number): void
  shake(durationMs?: number): void
  bounce(durationMs?: number): void
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
  readonly pupilOpacity: number
  readonly cheekPuffOpacity: number
  readonly armsOverHead: boolean
  readonly jumpWrapperTransform: string
}

const TRANSITION_MS = 400
const TRANSITION_EASE = 'outQuad'

function combineArmTransform(
  base: Required<Transform2D>,
  swayR: number,
  bobY: number,
  bobX: number,
  waveR = 0,
  waveY = 0,
): Transform2D {
  return mergeTransform(base, {
    rotate: swayR + waveR,
    translateX: bobX,
    translateY: bobY + waveY,
  })
}

function combineLegTransform(
  base: Required<Transform2D>,
  jumpR: number,
  jumpY: number,
): Transform2D {
  return mergeTransform(base, { rotate: jumpR, translateY: jumpY })
}

// Y do "chão" no viewBox (-90 -30 440 320) — pés estão por volta de y=260.
const GROUND_Y = 260

/** Transform attr do wrapper de jump: rotate (shake) + translate + scale ancorado no chão. */
function jumpWrapperAttr(jumpY: number, scaleY: number, shakeR: number, modeOffsetY: number): string {
  // Scale around (anyX, GROUND_Y): translate(0, GROUND_Y*(1-sy)) scale(1, sy)
  // Layered com jumpY: translate(0, GROUND_Y*(1-sy) + jumpY) scale(1, sy)
  // Shake roda em torno do quadril (~130, 200) sem afetar o pouso.
  const ty = GROUND_Y * (1 - scaleY) + jumpY + modeOffsetY
  const rotate = shakeR ? `rotate(${shakeR}, 130, 200) ` : ''
  return `${rotate}translate(0, ${ty}) scale(1, ${scaleY})`
}

export function createCharacterStore(): CharacterStore {
  return {
    mode: defaultMode,
    overlay: createOverlayState(),
    animState: createAnimState(modes[defaultMode]),
    _transitionHandles: createTransitionHandles(),
    _cycleHandles: createCycleHandles(),
    _jumpHandles: createJumpHandles(),
    _waveHandles: createWaveHandles(),
    _shakeHandles: createShakeHandles(),
    _bounceHandles: createBounceHandles(),
    _moodTimer: null,
    _jumpTimer: null,
    _waveTimer: null,
    _shakeTimer: null,
    _bounceTimer: null,
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
      window.addEventListener('character:wave', ((e: CustomEvent) => {
        this.wave(e.detail?.duration)
      }) as EventListener)
      window.addEventListener('character:shake', ((e: CustomEvent) => {
        this.shake(e.detail?.duration)
      }) as EventListener)
      window.addEventListener('character:bounce', ((e: CustomEvent) => {
        this.bounce(e.detail?.duration)
      }) as EventListener)
      window.addEventListener('character:belly-set', ((e: CustomEvent) => {
        const target = Number(e.detail?.scale ?? 1)
        const ms = Number(e.detail?.duration ?? 350)
        animateBelly(this.animState, target, ms)
      }) as EventListener)

      startBreathing(this.animState, this._cycleHandles)
      startBlink(this.animState, this._cycleHandles)
      applyModeCycles(this.animState, this._cycleHandles, modes[this.mode].cycles)
    },

    setMood(m, durationMs = 0) {
      this.mode = m
      transitionTo(this.animState, this._transitionHandles, targetFromMode(modes[m]), {
        durationMs: TRANSITION_MS,
        ease: TRANSITION_EASE,
      })
      applyModeCycles(this.animState, this._cycleHandles, modes[m].cycles)

      if (modes[m].cycles.bodyJumpLoop) {
        startBodyJumpLoop(this.animState, this._jumpHandles, actions.jump.peakY, actions.jump.squatY)
      } else if (!this.overlay.jumping) {
        stopJump(this.animState, this._jumpHandles)
      }

      if (this._moodTimer) clearTimeout(this._moodTimer)
      if (durationMs > 0) {
        this._moodTimer = setTimeout(() => {
          this.mode = defaultMode
          transitionTo(this.animState, this._transitionHandles, targetFromMode(modes[defaultMode]), {
            durationMs: TRANSITION_MS,
            ease: TRANSITION_EASE,
          })
          applyModeCycles(this.animState, this._cycleHandles, modes[defaultMode].cycles)
          if (!this.overlay.jumping) stopJump(this.animState, this._jumpHandles)
        }, durationMs)
      }
    },

    jump(durationMs) {
      if (this.overlay.jumping) return
      const cfg = { ...actions.jump, durationMs: durationMs ?? actions.jump.durationMs }
      this.overlay.jumping = true
      vibrate(cfg.vibrateMs)
      playJump(this.animState, this._jumpHandles, cfg)
      if (this._jumpTimer) clearTimeout(this._jumpTimer)
      this._jumpTimer = setTimeout(() => {
        this.overlay.jumping = false
        if (modes[this.mode].cycles.bodyJumpLoop) {
          startBodyJumpLoop(this.animState, this._jumpHandles, actions.jump.peakY, actions.jump.squatY)
        } else {
          stopJump(this.animState, this._jumpHandles)
        }
      }, cfg.durationMs)
    },

    wave(durationMs) {
      if (this.overlay.waving) return
      const ms = durationMs ?? actions.wave.durationMs
      this.overlay.waving = true
      playWave(this.animState, this._waveHandles, { durationMs: ms })
      if (this._waveTimer) clearTimeout(this._waveTimer)
      this._waveTimer = setTimeout(() => {
        this.overlay.waving = false
        stopWave(this.animState, this._waveHandles)
      }, ms)
    },

    shake(durationMs) {
      if (this.overlay.shaking) return
      const ms = durationMs ?? actions.shake.durationMs
      this.overlay.shaking = true
      playShake(this.animState, this._shakeHandles, {
        durationMs: ms,
        amplitude: actions.shake.amplitude,
      })
      if (this._shakeTimer) clearTimeout(this._shakeTimer)
      this._shakeTimer = setTimeout(() => {
        this.overlay.shaking = false
        stopShake(this.animState, this._shakeHandles)
      }, ms)
    },

    bounce(durationMs) {
      if (this.overlay.bouncing || this.overlay.jumping) return
      const ms = durationMs ?? actions.bounce.durationMs
      this.overlay.bouncing = true
      playBounce(this.animState, this._bounceHandles, {
        durationMs: ms,
        peakY: actions.bounce.peakY,
      })
      if (this._bounceTimer) clearTimeout(this._bounceTimer)
      this._bounceTimer = setTimeout(() => {
        this.overlay.bouncing = false
        if (modes[this.mode].cycles.bodyJumpLoop) {
          startBodyJumpLoop(this.animState, this._jumpHandles, actions.jump.peakY, actions.jump.squatY)
        } else {
          stopBounce(this.animState, this._bounceHandles)
        }
      }, ms)
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
      }
    },

    // ─── Bindings ─────────────────────────────────────────────

    get armLeftBindings() {
      return resolveArmLeft(
        modes[this.mode].armLeft,
        combineArmTransform(
          this.animState.armLeft,
          this.animState.armLeftSwayR,
          this.animState.armLeftBobY,
          this.animState.armLeftBobX,
          this.animState.armLeftWaveR,
          this.animState.armLeftWaveY,
        ),
      )
    },
    get armRightBindings() {
      return resolveArmRight(
        modes[this.mode].armRight,
        combineArmTransform(
          this.animState.armRight,
          this.animState.armRightSwayR,
          this.animState.armRightBobY,
          this.animState.armRightBobX,
          this.animState.armRightWaveR,
          this.animState.armRightWaveY,
        ),
      )
    },
    get eyeLeftBindings() {
      return resolveEye(modes[this.mode].eyeLeft, this.animState.eyeLeft, this.animState.eyeLeftBlinkY, {
        forceClosed: this.overlay.leftEyeClosed || this.mode === 'sleeping',
      })
    },
    get eyeRightBindings() {
      return resolveEye(modes[this.mode].eyeRight, this.animState.eyeRight, this.animState.eyeRightBlinkY, {
        forceClosed: this.overlay.rightEyeClosed || this.mode === 'sleeping',
      })
    },
    get eyebrowLeftBindings()  { return resolveEyebrowLeft(modes[this.mode].eyebrowLeft, this.animState.eyebrowLeft) },
    get eyebrowRightBindings() { return resolveEyebrowRight(modes[this.mode].eyebrowRight, this.animState.eyebrowRight) },
    get mouthBindings()        { return resolveMouth(modes[this.mode].mouth, this.animState.mouthGrinScale) },
    get jumpWrapperTransform() {
      return jumpWrapperAttr(this.animState.bodyJumpY, this.animState.bodyScaleY, this.animState.bodyShakeR, this.animState.modeOffsetY)
    },
    get bodyBindings() {
      return resolveBody(this.animState.bodyBreatheY, this.animState.bellyScale)
    },
    get legLeftBindings() {
      return resolveLeg(combineLegTransform(this.animState.legLeft, this.animState.legLeftJumpR, this.animState.legLeftJumpY))
    },
    get legRightBindings() {
      return resolveLeg(combineLegTransform(this.animState.legRight, this.animState.legRightJumpR, this.animState.legRightJumpY))
    },
    get footLeftBindings() {
      return resolveLeg(combineLegTransform(this.animState.legLeft, this.animState.footLeftJumpR, this.animState.footLeftJumpY))
    },
    get footRightBindings() {
      return resolveLeg(combineLegTransform(this.animState.legRight, this.animState.footRightJumpR, this.animState.footRightJumpY))
    },
    get noseBindings()      { return resolveNose(this.animState.nose) },
    get blushOpacity()      { return this.animState.blush },
    get tearOpacity()       { return this.animState.tears },
    get pupilOpacity()      { return this.animState.pupilSparkle },
    get cheekPuffOpacity()  { return Math.max(0, Math.min(1, this.animState.cheekPuff)) },
    get armsOverHead()      { return modes[this.mode].body.armsOverHead },
  }
}
