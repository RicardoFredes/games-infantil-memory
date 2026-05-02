import { characterPalettes, type CharacterPalette, type CharacterPaletteName } from '@/lib/character-palettes';

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const v = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h;
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]: RGB): string {
  const c = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

function lerpRgb(from: RGB, to: RGB, t: number): RGB {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ];
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

const activeAnimations = new WeakMap<Element, number>();

export function applyPaletteValues(
  rootSelector: string,
  from: CharacterPalette,
  to: CharacterPalette,
  durationMs = 400,
): void {
  const root = document.querySelector(rootSelector);
  if (!root) return;
  const svg = root.querySelector('svg');
  if (!svg) return;

  const skinStops = svg.querySelectorAll<SVGStopElement>('[id^="skinGrad-"] stop');
  const eyeStops = svg.querySelectorAll<SVGStopElement>('[id^="eyeHighlight-"] stop');
  const limbsElements = Array.from(svg.querySelectorAll<SVGElement>('[data-paint="limbs"]'));
  const limbsFills = limbsElements.filter((el) => el.hasAttribute('fill'));
  const limbsStrokes = limbsElements.filter((el) => el.hasAttribute('stroke'));

  const fromSkinTop = hexToRgb(from.skinTop);
  const fromSkinBottom = hexToRgb(from.skinBottom);
  const fromEyeTop = hexToRgb(from.eyeHighlightTop);
  const fromEyeBottom = hexToRgb(from.eyeHighlightBottom);
  const fromLimbs = hexToRgb(from.limbs);
  const toSkinTop = hexToRgb(to.skinTop);
  const toSkinBottom = hexToRgb(to.skinBottom);
  const toEyeTop = hexToRgb(to.eyeHighlightTop);
  const toEyeBottom = hexToRgb(to.eyeHighlightBottom);
  const toLimbs = hexToRgb(to.limbs);

  const prev = activeAnimations.get(svg);
  if (prev != null) cancelAnimationFrame(prev);

  if (durationMs <= 0) {
    paint(1);
    return;
  }

  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs);
    paint(easeInOut(t));
    if (t < 1) {
      activeAnimations.set(svg, requestAnimationFrame(step));
    } else {
      activeAnimations.delete(svg);
    }
  };
  activeAnimations.set(svg, requestAnimationFrame(step));

  function paint(t: number) {
    if (skinStops.length >= 2) {
      skinStops[0].setAttribute('stop-color', rgbToHex(lerpRgb(fromSkinTop, toSkinTop, t)));
      skinStops[1].setAttribute('stop-color', rgbToHex(lerpRgb(fromSkinBottom, toSkinBottom, t)));
    }
    if (eyeStops.length >= 2) {
      eyeStops[0].setAttribute('stop-color', rgbToHex(lerpRgb(fromEyeTop, toEyeTop, t)));
      eyeStops[1].setAttribute('stop-color', rgbToHex(lerpRgb(fromEyeBottom, toEyeBottom, t)));
    }
    const limbsHex = rgbToHex(lerpRgb(fromLimbs, toLimbs, t));
    limbsFills.forEach((el) => el.setAttribute('fill', limbsHex));
    limbsStrokes.forEach((el) => el.setAttribute('stroke', limbsHex));
  }
}

export function applyPalette(
  rootSelector: string,
  fromPalette: CharacterPaletteName,
  toPalette: CharacterPaletteName,
  durationMs?: number,
): void {
  applyPaletteValues(rootSelector, characterPalettes[fromPalette], characterPalettes[toPalette], durationMs);
}
