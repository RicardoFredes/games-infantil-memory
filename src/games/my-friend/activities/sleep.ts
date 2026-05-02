// Dormir (toggle): mood sleeping + cama embaixo do personagem +
// Z's flutuantes saindo da cabeça + vinheta dim sobre o palco.
// Encerra ao tocar o botão de novo.

import { registerActivity } from './registry';

const Z_INTERVAL_MS = 900;

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

function findHeadCenter(stage: HTMLElement): { x: number; y: number } {
  const stageRect = stage.getBoundingClientRect();
  const head = stage.querySelector('[data-zone="head"]');
  if (head) {
    const r = (head as Element).getBoundingClientRect();
    return {
      x: r.left - stageRect.left + r.width / 2 + 30,
      y: r.top - stageRect.top + r.height * 0.35,
    };
  }
  return { x: stageRect.width / 2 + 60, y: stageRect.height * 0.35 };
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

    const { x, y } = findHeadCenter(stage);
    spawnZ(layer, x, y);
    const zTimer = window.setInterval(() => spawnZ(layer, x, y), Z_INTERVAL_MS);

    return () => {
      window.clearInterval(zTimer);
      layer.remove();
    };
  },
});
