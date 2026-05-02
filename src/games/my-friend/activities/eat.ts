// Comer: maçã sobe de baixo do palco até a boca, "some" mordida,
// migalhas caem brevemente. Mood happy é tratado pelo engine.

import { registerActivity } from './registry';

const APPLE_SVG = `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M32 18c-6 0-9-3-9-3s2-7 9-7 9 7 9 7-3 3-9 3z" fill="#3F8C3A"/>
  <ellipse cx="32" cy="40" rx="22" ry="22" fill="#E64545"/>
  <ellipse cx="22" cy="32" rx="6" ry="9" fill="#FF8888" opacity="0.55"/>
  <path d="M30 18c2-4 6-4 8-2-4 0-7 2-8 5z" fill="#7A4318"/>
</svg>
`.trim();

function findMouthCenter(stage: HTMLElement): { x: number; y: number } {
  const stageRect = stage.getBoundingClientRect();
  const mouth = stage.querySelector('[data-zone="mouth"]');
  if (mouth) {
    const r = (mouth as Element).getBoundingClientRect();
    return {
      x: r.left - stageRect.left + r.width / 2,
      y: r.top - stageRect.top + r.height / 2,
    };
  }
  return { x: stageRect.width / 2, y: stageRect.height * 0.5 };
}

function spawnCrumb(layer: HTMLElement, x: number, y: number, dx: number) {
  const el = document.createElement('span');
  el.className = 'mf-crumb';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty('--dx', `${dx}px`);
  layer.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

registerActivity({
  name: 'eat',
  kind: 'oneshot',
  durationMs: 2400,
  mood: 'happy',
  start: (stage) => {
    const { x, y } = findMouthCenter(stage);

    const layer = document.createElement('div');
    layer.className = 'mf-activity-layer';
    stage.appendChild(layer);

    const apple = document.createElement('div');
    apple.className = 'mf-apple';
    apple.innerHTML = APPLE_SVG;
    apple.style.left = `${x}px`;
    apple.style.top = `${y}px`;
    layer.appendChild(apple);

    // Animação flight + bite via Web Animations API
    const startY = stage.getBoundingClientRect().height + 80; // abaixo do palco
    const flight = apple.animate(
      [
        { transform: `translate(-50%, ${startY - y}px) scale(0.7) rotate(-15deg)`, opacity: 1 },
        { transform: `translate(-50%, ${(startY - y) * 0.5}px) scale(0.95) rotate(0deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(-50%, 0) scale(1) rotate(8deg)`, opacity: 1, offset: 0.78 },
        { transform: `translate(-50%, 0) scale(0.4) rotate(8deg)`, opacity: 0, offset: 1 },
      ],
      { duration: 2200, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'forwards' },
    );

    // crumbs ao "morder" (após 78% da animação)
    const crumbsTimer = window.setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        const dx = (i - 2) * 14 + (Math.random() - 0.5) * 8;
        spawnCrumb(layer, x, y, dx);
      }
    }, 1700);

    return () => {
      window.clearTimeout(crumbsTimer);
      try { flight.cancel(); } catch { /* no-op */ }
      layer.remove();
    };
  },
});
