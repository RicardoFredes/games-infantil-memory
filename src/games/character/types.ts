// Tipos centrais do sistema de personagem.
// Cada parte do corpo é resolvida a partir de um conjunto de "movimentos"
// (pose, transform, anim, opacidade) declarados em modos (composições).

export type Side = 'left' | 'right'

export interface Transform2D {
  rotate?: number
  translateX?: number
  translateY?: number
  scaleX?: number
  scaleY?: number
}

// ─── Specs por parte ──────────────────────────────────────────

export interface ArmSpec {
  pose: string
  transform: Transform2D
  anim: string | null
}

export interface EyeSpec {
  shape: { x: number; y: number }
  blinkAnim: boolean
  pupilAnim: string | null
}

export interface EyebrowSpec {
  pose: string
  transform: Transform2D
}

export interface MouthSpec {
  pose: string
  anim: string | null
}

export interface BodySpec {
  breathe: boolean
  anim: string | null
  armsOverHead: boolean
}

export interface LegSpec {
  transform: Transform2D
}

export interface NoseSpec {
  transform: Transform2D
}

// ─── Modo (composição) ────────────────────────────────────────

export interface ModeConfig {
  armLeft: ArmSpec
  armRight: ArmSpec
  eyeLeft: EyeSpec
  eyeRight: EyeSpec
  eyebrowLeft: EyebrowSpec
  eyebrowRight: EyebrowSpec
  mouth: MouthSpec
  body: BodySpec
  legLeft: LegSpec
  legRight: LegSpec
  nose: NoseSpec
  blush: number
  tears: number
}

export type ModeName =
  | 'idle' | 'happy' | 'excited' | 'sad'
  | 'surprised' | 'tired' | 'thinking' | 'sleeping'

// ─── One-shot actions ─────────────────────────────────────────

export interface JumpAction {
  durationMs: number
  vibrateMs: number
  armTransform: { left: Transform2D; right: Transform2D }
  bodyAnim: string
}

export interface WinkAction { durationMs: number }
export interface EyesClosedAction { durationMs: number }

export interface SpinAction {
  durationMs: number
  vibrateMs: number
  moodOverride: ModeName
  moodDurationMs: number
  bodyAnim: string
}

export interface ActionsConfig {
  jump: JumpAction
  wink: WinkAction
  eyesClosed: EyesClosedAction
  spin: SpinAction
}

// ─── Bindings (saída dos resolvers) ───────────────────────────

export interface ArmBindings {
  strokePath: string
  handPath: string
  transformAttr: string
  animClass: string
}

export interface EyeBindings {
  closedOpacity: number
  openOpacity: number
  shapeTransform: string
  blinkClass: string
  pupilClass: string
}

export interface EyebrowBindings {
  pathD: string
  transformAttr: string
}

export interface MouthBindings {
  pathD: string
  animClass: string
}

export interface BodyBindings {
  breathClass: string
  bodyAnimClass: string
}

export interface LegBindings {
  transformAttr: string
}

export interface NoseBindings {
  transformAttr: string
}
