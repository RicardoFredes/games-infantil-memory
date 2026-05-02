// Tipos centrais do sistema de personagem.
// Cada parte é descrita por uma pose (path SVG) + transform (números).
// Animações cíclicas e one-shots são todas tocadas via anime.js,
// escrevendo em offsets dedicados do AnimState.

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
}

export interface EyeSpec {
  shape: { x: number; y: number }
}

export interface EyebrowSpec {
  pose: string
  transform: Transform2D
}

export interface MouthSpec {
  pose: string
}

export interface BodySpec {
  armsOverHead: boolean
}

export interface LegSpec {
  transform: Transform2D
}

export interface NoseSpec {
  transform: Transform2D
}

// ─── Cycle: define como anime.js anima offsets de uma parte ──

export interface CycleConfig {
  /** Idle sway: rotação cíclica dos braços (mood-dependent). */
  armSway?:    { amplitude: number; durationMs: number }
  /** Bob vertical (excited / hands-on-head). */
  armBob?:     { amplitude: number; durationMs: number }
  /** Pupila piscando/brilhando (excited). */
  pupilSparkle?: { durationMs: number }
  /** Mouth grin pulsante (happy / excited). */
  mouthGrin?:  { durationMs: number }
  /** Body jump em loop (excited). */
  bodyJumpLoop?: boolean
  /** Sobrancelha pensando — escala leve. */
  thinking?:   { durationMs: number }
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
  cycles: CycleConfig
}

export type ModeName =
  | 'idle' | 'happy' | 'excited' | 'sad'
  | 'surprised' | 'tired' | 'thinking' | 'sleeping'

// ─── One-shot actions ─────────────────────────────────────────

export interface JumpAction {
  durationMs: number
  vibrateMs: number
  /** Pico vertical do salto (negativo = sobe). */
  peakY: number
  /** Compressão (squat) na descolagem e pouso. */
  squatY: number
}

export interface WinkAction { durationMs: number }
export interface EyesClosedAction { durationMs: number }

export interface ActionsConfig {
  jump: JumpAction
  wink: WinkAction
  eyesClosed: EyesClosedAction
}

// ─── Bindings (saída dos resolvers) ───────────────────────────

export interface ArmBindings {
  strokePath: string
  handPath: string
  transformAttr: string
}

export interface EyeBindings {
  closedOpacity: number
  openOpacity: number
  shapeTransform: string
}

export interface EyebrowBindings {
  pathD: string
  transformAttr: string
}

export interface MouthBindings {
  pathD: string
  transformAttr: string
}

export interface BodyBindings {
  transformAttr: string
}

export interface LegBindings {
  transformAttr: string
}

export interface NoseBindings {
  transformAttr: string
}
