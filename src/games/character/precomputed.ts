// Paths SVG pré-computados (chamados em build-time pelo .astro).
// Permite renderizar todas as poses como camadas estáticas com opacidade
// dinâmica, evitando troca abrupta de `d` em runtime.

import { resolveMouth } from './parts/mouth'
import {
  mouthParametricPresets,
  mouthLiteralPresets,
} from '@/config/character/poses'

const MOUTH_NAMES = [
  ...Object.keys(mouthParametricPresets),
  ...Object.keys(mouthLiteralPresets),
] as const

export const mouthPosesRendered = MOUTH_NAMES.map((name) => ({
  name,
  pathD: resolveMouth({ pose: name, anim: null }).pathD,
}))
