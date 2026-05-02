// Registro central de classes CSS de animação.
// Os keyframes vivem em src/styles/character.css.

export const armLeftAnims = {
  idle:        'animate-arm-idle-left',
  happy:       'animate-arm-happy-left',
  surprise:    'animate-arm-surprise-left',
  'excited-bob':'animate-arm-excited-bob',
} as const

export const armRightAnims = {
  idle:        'animate-arm-idle-right',
  happy:       'animate-arm-happy-right',
  surprise:    'animate-arm-surprise-right',
  thinking:    'animate-arm-think-right',
  'excited-bob':'animate-arm-excited-bob',
} as const

export const eyeAnims = {
  blink:          'animate-blink',
  'pupil-sparkle':'animate-pupil-sparkle',
} as const

export const mouthAnims = {
  grin: 'animate-mouth-grin',
} as const

export const bodyAnims = {
  breathe:    'animate-breathe',
  'jump-loop':'animate-jump-loop',
  'jump-once':'is-jumping',
} as const

export type ArmLeftAnimName  = keyof typeof armLeftAnims
export type ArmRightAnimName = keyof typeof armRightAnims
export type EyeAnimName      = keyof typeof eyeAnims
export type MouthAnimName    = keyof typeof mouthAnims
export type BodyAnimName     = keyof typeof bodyAnims
