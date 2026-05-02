import type { MouthBindings, MouthSpec } from '../types'
import {
  mouthParametricPresets,
  mouthLiteralPresets,
  type MouthParametric,
} from '@/config/character/poses'

const Lx = 101, Rx = 157, Cx = 130
const mir = (v: number) => 2 * Cx - v

function parametricToPath(m: MouthParametric): string {
  return `M${Lx},${m.Ty} C${Lx},${m.Ty} ${mir(m.c2x)},${m.c2y} ${Cx},${m.My} `
       + `C${m.c2x},${m.c2y} ${Rx},${m.Ty} ${Rx},${m.Ty} `
       + `V${m.Ty + m.gap} `
       + `C${Rx},${m.Ty + m.gap} ${m.c3x},${m.c3y} ${Cx},${m.By} `
       + `C${mir(m.c3x)},${m.c3y} ${Lx},${m.Ty + m.gap} ${Lx},${m.Ty + m.gap} `
       + `V${m.Ty} Z`
}

function ovalPath(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0 Z`
}

export function resolveMouth(spec: MouthSpec, grinScale: number): MouthBindings {
  const pose = spec.pose as keyof typeof mouthParametricPresets | keyof typeof mouthLiteralPresets

  let pathD: string
  if (pose in mouthLiteralPresets) {
    const lit = mouthLiteralPresets[pose as keyof typeof mouthLiteralPresets]
    pathD = lit.kind === 'oval' ? ovalPath(lit.cx, lit.cy, lit.rx, lit.ry) : lit.d
  } else {
    const preset = mouthParametricPresets[pose as keyof typeof mouthParametricPresets] ?? mouthParametricPresets.idle
    pathD = parametricToPath(preset)
  }

  // Grin scale aplicado via transform no path (origem no centro da boca).
  return {
    pathD,
    transformAttr: grinScale === 1 ? '' : `scale(${grinScale})`,
  }
}
