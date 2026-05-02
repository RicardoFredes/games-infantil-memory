// Dormir (toggle): mood sleeping + cama + personagem em "vista de lado"
// (estático, esconde o personagem ao vivo) + Z's flutuantes + dim.
// Encerra ao tocar o botão de novo.

import { registerActivity } from './registry';
import { characterPalettes } from '@/lib/character-palettes';
import { getPalette } from '@/lib/character-preferences';

const Z_INTERVAL_MS = 900;

function buildSideCharacterSvg(): string {
  const palette = characterPalettes[getPalette()];
  const skinTop    = palette.skinTop;
  const skinBottom = palette.skinBottom;
  const limbs      = palette.limbs;
  const limbStroke = '#3F2208';

  return `
<svg viewBox="0 0 380 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="mfSideSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="${skinTop}"/>
      <stop offset="100%" stop-color="${skinBottom}"/>
    </linearGradient>
    <radialGradient id="mfSideBlush" cx="50%" cy="50%" r="50%">
      <stop offset="0%"  stop-color="#FF9999" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#FF6666" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- BRACO/PERNA TRASEIROS (parcialmente escondidos atrás do corpo) -->
  <ellipse cx="318" cy="170" rx="14" ry="10" fill="${limbs}" opacity="0.55"/>

  <!-- CORPO horizontal -->
  <ellipse cx="220" cy="148" rx="118" ry="40" fill="url(#mfSideSkin)"/>

  <!-- PERNA da frente, levemente dobrada -->
  <path d="M312 152 Q336 158 348 148" stroke="${limbs}" stroke-width="22" stroke-linecap="round" fill="none"/>
  <ellipse cx="354" cy="148" rx="14" ry="10" fill="${limbs}"/>

  <!-- BRACO da frente, descansando em cima do corpo -->
  <path d="M196 130 Q230 124 268 138" stroke="${limbs}" stroke-width="20" stroke-linecap="round" fill="none"/>
  <circle cx="272" cy="140" r="11" fill="${limbs}"/>

  <!-- CABECA -->
  <circle cx="98" cy="120" r="62" fill="url(#mfSideSkin)"/>

  <!-- Topete/mecha frontal -->
  <path d="M64 84 Q88 70 122 78 Q108 92 86 92 Q72 92 64 84Z" fill="${skinBottom}" opacity="0.55"/>

  <!-- Bochecha (blush) -->
  <ellipse cx="78" cy="138" rx="14" ry="8" fill="url(#mfSideBlush)"/>

  <!-- OLHO fechado (curva pra cima) -->
  <path d="M70 116 Q84 124 100 116" stroke="black" stroke-width="3.5" stroke-linecap="round" fill="none"/>

  <!-- BOCA pequena (relaxada, ligeiramente aberta) -->
  <path d="M64 144 Q72 150 80 144" stroke="black" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <ellipse cx="72" cy="148" rx="3.5" ry="2" fill="#5A2A2A" opacity="0.55"/>

  <!-- Sobrancelha relaxada -->
  <path d="M68 102 Q82 100 96 104" stroke="black" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.7"/>
</svg>
`.trim();
}

const BED_SVG = `
<svg viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="mfBedFrame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#9F6230"/>
      <stop offset="100%" stop-color="#6E3F18"/>
    </linearGradient>
    <linearGradient id="mfBedSheet" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#E0E6EE"/>
    </linearGradient>
    <linearGradient id="mfBedBlanket" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#7B5DC9"/>
      <stop offset="100%" stop-color="#4A2E96"/>
    </linearGradient>
    <linearGradient id="mfBedPillow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#FFF6FB"/>
      <stop offset="100%" stop-color="#E9DCEC"/>
    </linearGradient>
  </defs>

  <!-- sombra -->
  <ellipse cx="180" cy="148" rx="170" ry="10" fill="rgba(0,0,0,0.22)"/>

  <!-- cabeceira -->
  <rect x="6"  y="8"  width="22" height="120" rx="6" fill="url(#mfBedFrame)" stroke="#3F2208" stroke-width="3"/>
  <rect x="332" y="40" width="22" height="88"  rx="6" fill="url(#mfBedFrame)" stroke="#3F2208" stroke-width="3"/>

  <!-- colchão -->
  <rect x="22" y="56" width="316" height="58" rx="14" fill="url(#mfBedSheet)" stroke="#9AA1AF" stroke-width="3"/>
  <!-- detalhe lateral do colchão -->
  <path d="M22 80 Q180 88 338 80" stroke="#C0C8D2" stroke-width="2" fill="none"/>

  <!-- travesseiro -->
  <rect x="42" y="40" width="120" height="36" rx="14" fill="url(#mfBedPillow)" stroke="#C5B1CB" stroke-width="2.5"/>

  <!-- coberta -->
  <path d="M170 60 Q175 56 184 56 H326 Q336 56 336 70 V112 Q336 118 326 118 H184 Q170 118 170 100 Z"
        fill="url(#mfBedBlanket)" stroke="#2E1A6B" stroke-width="3"/>
  <path d="M170 70 Q260 76 336 70" stroke="#A696DD" stroke-width="2" fill="none" opacity="0.55"/>

  <!-- pés da cama -->
  <rect x="28"  y="120" width="14" height="22" rx="3" fill="url(#mfBedFrame)" stroke="#3F2208" stroke-width="2.5"/>
  <rect x="318" y="120" width="14" height="22" rx="3" fill="url(#mfBedFrame)" stroke="#3F2208" stroke-width="2.5"/>
</svg>
`.trim();

function spawnZ(layer: HTMLElement, originX: number, originY: number) {
  const el = document.createElement('span');
  el.className = 'mf-zzz';
  el.textContent = 'Z';
  const drift = (Math.random() - 0.5) * 30;
  const dur = 2400 + Math.random() * 800;
  el.style.left = `${originX}px`;
  el.style.top = `${originY}px`;
  el.style.setProperty('--drift', `${drift}px`);
  el.style.setProperty('--dur', `${dur}ms`);
  layer.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

function findSideHeadCenter(stage: HTMLElement, sideEl: HTMLElement): { x: number; y: number } {
  const stageRect = stage.getBoundingClientRect();
  const r = sideEl.getBoundingClientRect();
  // No SVG side, a cabeça fica em ~25% da largura, ~55% da altura.
  return {
    x: r.left - stageRect.left + r.width * 0.27,
    y: r.top  - stageRect.top  + r.height * 0.40,
  };
}

registerActivity({
  name: 'sleep',
  kind: 'toggle',
  durationMs: 8000,
  mood: 'sleeping',
  start: (stage) => {
    const layer = document.createElement('div');
    layer.className = 'mf-activity-layer mf-sleep-layer';
    stage.appendChild(layer);

    const dim = document.createElement('div');
    dim.className = 'mf-sleep-dim';
    layer.appendChild(dim);

    const bed = document.createElement('div');
    bed.className = 'mf-bed';
    bed.innerHTML = BED_SVG;
    layer.appendChild(bed);

    const sideChar = document.createElement('div');
    sideChar.className = 'mf-side-char';
    sideChar.innerHTML = buildSideCharacterSvg();
    layer.appendChild(sideChar);

    // Esconde o personagem ao vivo enquanto a cena de dormir está montada.
    stage.classList.add('mf-sleep-active');

    const { x, y } = findSideHeadCenter(stage, sideChar);
    spawnZ(layer, x, y);
    const zTimer = window.setInterval(() => spawnZ(layer, x, y), Z_INTERVAL_MS);

    return () => {
      window.clearInterval(zTimer);
      stage.classList.remove('mf-sleep-active');
      layer.remove();
    };
  },
});
