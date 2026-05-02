// Dançar (toggle): mood excited (tem bodyJumpLoop) + notas musicais
// flutuantes em loop + motif tocando em loop até o stop.

import { registerActivity } from './registry';
import { playMoodMotif } from '@/lib/audio';

const NOTES = ['♪', '♫', '♬', '𝅘𝅥', '🎵'];
const SPAWN_INTERVAL_MS = 380;
const MOTIF_INTERVAL_MS = 1800;

function spawnNote(layer: HTMLElement, originX: number, originY: number) {
  const el = document.createElement('span');
  el.className = 'mf-music-note';
  el.textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
  const dx = (Math.random() - 0.5) * 80;
  const drift = (Math.random() - 0.5) * 40;
  const rot = (Math.random() - 0.5) * 60;
  el.style.left = `${originX + dx}px`;
  el.style.top = `${originY}px`;
  el.style.setProperty('--drift', `${drift}px`);
  el.style.setProperty('--rot', `${rot}deg`);
  el.style.color = `hsl(${Math.floor(Math.random() * 360)}, 75%, 60%)`;
  layer.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

registerActivity({
  name: 'dance',
  kind: 'toggle',
  durationMs: 6000, // não interrompe sozinho — toggle.
  mood: 'excited',
  start: (stage) => {
    const layer = document.createElement('div');
    layer.className = 'mf-activity-layer mf-dance-layer';
    stage.appendChild(layer);

    const stageRect = stage.getBoundingClientRect();
    const originX = stageRect.width / 2;
    const originY = stageRect.height * 0.55;

    const noteTimer = window.setInterval(() => {
      spawnNote(layer, originX, originY);
    }, SPAWN_INTERVAL_MS);

    // Toca motif imediatamente e em loop.
    playMoodMotif('excited', -8);
    const motifTimer = window.setInterval(() => {
      playMoodMotif('excited', -8);
    }, MOTIF_INTERVAL_MS);

    return () => {
      window.clearInterval(noteTimer);
      window.clearInterval(motifTimer);
      layer.remove();
    };
  },
});
