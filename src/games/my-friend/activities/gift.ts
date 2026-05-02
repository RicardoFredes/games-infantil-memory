// Presente: caixa cai → treme → tampa voa → confetti.
// Mood excited. Dispara confetti via @/lib/confetti.

import { registerActivity } from './registry';
import { ConfettiSystem } from '@/lib/confetti';

const GIFT_BODY_SVG = `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="mfGiftBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F18BAA"/>
      <stop offset="100%" stop-color="#D34F75"/>
    </linearGradient>
  </defs>
  <rect x="6" y="40" width="108" height="74" rx="6" fill="url(#mfGiftBody)" stroke="#A03A5C" stroke-width="3"/>
  <rect x="52" y="40" width="16" height="74" fill="#FFD86B" stroke="#A0791A" stroke-width="2"/>
</svg>
`.trim();

const GIFT_LID_SVG = `
<svg viewBox="0 0 130 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="2" y="14" width="126" height="32" rx="4" fill="#F18BAA" stroke="#A03A5C" stroke-width="3"/>
  <rect x="56" y="14" width="18" height="32" fill="#FFD86B" stroke="#A0791A" stroke-width="2"/>
  <path d="M65 14 C50 -2 38 0 42 14 Z" fill="#FFD86B" stroke="#A0791A" stroke-width="2"/>
  <path d="M65 14 C80 -2 92 0 88 14 Z" fill="#FFD86B" stroke="#A0791A" stroke-width="2"/>
  <circle cx="65" cy="14" r="6" fill="#FFD86B" stroke="#A0791A" stroke-width="2"/>
</svg>
`.trim();

registerActivity({
  name: 'gift',
  kind: 'oneshot',
  durationMs: 3200,
  mood: 'excited',
  start: (stage) => {
    const layer = document.createElement('div');
    layer.className = 'mf-activity-layer mf-gift-layer';
    stage.appendChild(layer);

    const box = document.createElement('div');
    box.className = 'mf-gift-box';
    box.innerHTML = GIFT_BODY_SVG;
    layer.appendChild(box);

    const lid = document.createElement('div');
    lid.className = 'mf-gift-lid';
    lid.innerHTML = GIFT_LID_SVG;
    layer.appendChild(lid);

    // Confetti canvas (canvas próprio para esta cena).
    const canvas = document.createElement('canvas');
    canvas.className = 'mf-gift-confetti';
    document.body.appendChild(canvas);
    let confetti: ConfettiSystem | null = null;
    try {
      confetti = new ConfettiSystem(canvas);
    } catch {
      // sem WebGL/2D — segue sem confetti
    }

    const burstTimer = window.setTimeout(() => {
      confetti?.burst({ particleCount: 90, duration: 1800 });
    }, 1700);

    const cleanupTimer = window.setTimeout(() => {
      confetti?.destroy();
      canvas.remove();
    }, 3200);

    return () => {
      window.clearTimeout(burstTimer);
      window.clearTimeout(cleanupTimer);
      confetti?.destroy();
      canvas.remove();
      layer.remove();
    };
  },
});
