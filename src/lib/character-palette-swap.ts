import { characterPalettes, type CharacterPaletteName } from '@/lib/character-palettes';

export function applyPalette(
  rootSelector: string,
  fromPalette: CharacterPaletteName,
  toPalette: CharacterPaletteName,
): void {
  const root = document.querySelector(rootSelector);
  if (!root) return;
  const svg = root.querySelector('svg');
  if (!svg) return;

  const from = characterPalettes[fromPalette];
  const to = characterPalettes[toPalette];

  const skinStops = svg.querySelectorAll<SVGStopElement>('[id^="skinGrad-"] stop');
  if (skinStops.length >= 2) {
    skinStops[0].setAttribute('stop-color', to.skinTop);
    skinStops[1].setAttribute('stop-color', to.skinBottom);
  }

  const eyeStops = svg.querySelectorAll<SVGStopElement>('[id^="eyeHighlight-"] stop');
  if (eyeStops.length >= 2) {
    eyeStops[0].setAttribute('stop-color', to.eyeHighlightTop);
    eyeStops[1].setAttribute('stop-color', to.eyeHighlightBottom);
  }

  if (from.limbs.toLowerCase() !== to.limbs.toLowerCase()) {
    svg.querySelectorAll<SVGElement>(`[fill="${from.limbs}"]`).forEach((el) => {
      el.setAttribute('fill', to.limbs);
    });
    svg.querySelectorAll<SVGElement>(`[stroke="${from.limbs}"]`).forEach((el) => {
      el.setAttribute('stroke', to.limbs);
    });
  }
}
