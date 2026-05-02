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

  // Layout adaptado de public/person/person (7).svg — personagem deitado
  // com touca de dormir, braço dobrado em frente ao rosto e perna esticada.
  return `
<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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

  <!-- CABEÇA -->
  <circle cx="150" cy="143" r="100" fill="url(#mfSideSkin)"/>

  <!-- TOUCA DE DORMIR -->
  <line x1="168.955" y1="109.419" x2="181.955" y2="86.9019" stroke="black" stroke-width="2"/>
  <line x1="152.268" y1="96.3205" x2="162.268" y2="79"      stroke="black" stroke-width="4"/>
  <ellipse cx="207.999" cy="148" rx="21" ry="7" fill="${skinBottom}"/>
  <rect    x="196.999" y="116" width="14" height="28"      fill="${skinBottom}"/>
  <path d="M192.001 116.497C192.001 116.497 202.947 109.538 211.63 95.4987C220.313 81.4593 220.001 80 220.001 80C220.001 80 226.221 84.5738 228.893 88.5981C231.565 92.6223 233.75 96.2583 226.25 109.249C218.75 122.239 208.714 120.201 203.893 119.899C199.072 119.597 192.001 116.497 192.001 116.497Z" fill="black"/>

  <!-- ROSTO: olho fechado + boca relaxada + bochecha -->
  <ellipse cx="118" cy="170" rx="16" ry="9" fill="url(#mfSideBlush)"/>
  <path d="M96 152 Q118 162 140 152" stroke="black" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M104 184 Q116 192 128 184" stroke="black" stroke-width="3" stroke-linecap="round" fill="none"/>

  <!-- BRAÇO DA FRENTE (curva descendo até a mão) -->
  <path d="M107 148C110.344 157.242 122.382 176.736 143.783 180.769C165.184 184.802 180.845 177.968 186 174.047"
        stroke="${limbs}" stroke-width="21" fill="none" stroke-linecap="round"/>

  <!-- MÃO (polegar/dedinhos enrolados) -->
  <path d="M178.087 175.136C175.453 173.85 175.676 167.979 178.584 162.024C181.493 156.069 185.986 152.283 188.619 153.57C190.697 154.585 190.995 158.454 189.6 162.967C196.24 160.613 203.595 162.387 207.663 167.881C212.757 174.761 210.77 184.867 203.225 190.454C195.679 196.041 185.433 194.993 180.339 188.114C177.542 184.335 176.879 179.584 178.101 175.143C178.096 175.141 178.092 175.138 178.087 175.136Z"
        fill="${limbs}"/>

  <!-- PERNA DA FRENTE (esticada para a direita) -->
  <path d="M220 197C228.333 196 246.9 194.1 254.5 194.5C262.1 194.9 267.333 194.667 269 194.5"
        stroke="${limbs}" stroke-width="21" fill="none" stroke-linecap="round"/>

  <!-- PÉ -->
  <path d="M261.5 185C261.5 199.359 267.632 211 275.196 211C275.954 211 276.5 210.324 276.5 209.558L276.5 160.442C276.5 159.676 275.954 159 275.196 159C267.632 159 261.5 170.641 261.5 185Z"
        fill="${limbs}"/>
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
  // No SVG side (viewBox 300x300), a cabeça está em (150, 143) e a touca
  // sobe pra direita; emitimos os Z's a partir da ponta da touca.
  return {
    x: r.left - stageRect.left + r.width * 0.74,
    y: r.top  - stageRect.top  + r.height * 0.27,
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
