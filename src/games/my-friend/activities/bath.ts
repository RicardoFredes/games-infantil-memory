// Banho: banheira sobe pelo chão envolvendo o personagem, bolhas
// flutuantes em loop, patinho de borracha aparece. Mood happy.

import { registerActivity } from './registry';

const BATHTUB_SVG = `
<svg viewBox="0 0 320 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="mfBathInner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#A8E1F0"/>
      <stop offset="100%" stop-color="#5EB7D0"/>
    </linearGradient>
    <linearGradient id="mfBathOuter" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#D7DCE5"/>
    </linearGradient>
  </defs>
  <ellipse cx="160" cy="100" rx="160" ry="20" fill="rgba(0,0,0,0.18)"/>
  <path d="M10 30 Q10 100 60 110 H260 Q310 100 310 30 Z" fill="url(#mfBathOuter)" stroke="#9AA1AF" stroke-width="3"/>
  <path d="M28 38 Q28 95 70 102 H250 Q292 95 292 38 Z" fill="url(#mfBathInner)"/>
  <ellipse cx="160" cy="38" rx="132" ry="8" fill="#FFFFFF" opacity="0.55"/>
  <circle cx="60"  cy="48" r="6" fill="#FFFFFF" opacity="0.85"/>
  <circle cx="260" cy="48" r="6" fill="#FFFFFF" opacity="0.85"/>
</svg>
`.trim();

const DUCK_SVG = `
<svg viewBox="0 0 56 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="28" cy="42" rx="22" ry="4" fill="rgba(0,0,0,0.18)"/>
  <path d="M6 30 Q6 18 22 18 Q22 8 34 8 Q44 8 44 18 Q56 22 50 32 Q42 38 28 38 Q12 38 6 30Z" fill="#FFD86B"/>
  <circle cx="36" cy="16" r="2.2" fill="#222"/>
  <path d="M44 18 L52 16 L48 22 Z" fill="#F0921F"/>
</svg>
`.trim();

function spawnBubble(layer: HTMLElement, originX: number, originY: number) {
  const el = document.createElement('span');
  el.className = 'mf-bubble';
  const dx = (Math.random() - 0.5) * 200;
  const size = 10 + Math.random() * 18;
  el.style.left = `${originX}px`;
  el.style.top = `${originY}px`;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.setProperty('--dx', `${dx}px`);
  el.style.setProperty('--dur', `${1400 + Math.random() * 800}ms`);
  layer.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

registerActivity({
  name: 'bath',
  kind: 'oneshot',
  durationMs: 4200,
  mood: 'happy',
  start: (stage) => {
    const layer = document.createElement('div');
    layer.className = 'mf-activity-layer mf-bath-layer';
    stage.appendChild(layer);

    const tub = document.createElement('div');
    tub.className = 'mf-bathtub';
    tub.innerHTML = BATHTUB_SVG;
    layer.appendChild(tub);

    const duck = document.createElement('div');
    duck.className = 'mf-duck';
    duck.innerHTML = DUCK_SVG;
    layer.appendChild(duck);

    const stageRect = stage.getBoundingClientRect();
    const originX = stageRect.width / 2;
    const originY = stageRect.height * 0.65; // linha d'água

    const bubbleTimer = window.setInterval(() => {
      spawnBubble(layer, originX, originY);
    }, 220);

    return () => {
      window.clearInterval(bubbleTimer);
      layer.remove();
    };
  },
});
