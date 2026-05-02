// Dormir (toggle): mood sleeping + Z's flutuantes saindo da cabeça +
// vinheta dim sobre o palco. Encerra ao tocar o botão de novo.

import { registerActivity } from './registry';

const Z_INTERVAL_MS = 900;

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

    const { x, y } = findHeadCenter(stage);
    spawnZ(layer, x, y);
    const zTimer = window.setInterval(() => spawnZ(layer, x, y), Z_INTERVAL_MS);

    return () => {
      window.clearInterval(zTimer);
      layer.remove();
    };
  },
});
