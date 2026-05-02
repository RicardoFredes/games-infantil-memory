import { MyFriendEngine } from './engine';
import config from './config.json';
import type { MyFriendConfig, Zone } from './types';
import type { CharacterPaletteName } from '@/lib/character-palettes';
import { applyPalette } from '@/lib/character-palette-swap';
import { initAudio, playMoodMotif } from '@/lib/audio';

const gameConfig = config as MyFriendConfig;
const STAGE_SELECTOR = '#my-friend-stage';
const FX_SELECTOR = '.touch-fx';
const MOOD_BUTTON_DURATION_MS = 4000;

function spawnRipple(layer: HTMLElement, x: number, y: number) {
  const el = document.createElement('span');
  el.className = 'touch-ripple';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  layer.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

function resolveZone(target: EventTarget | null): Zone | null {
  const el = target as Element | null;
  const z = el?.closest('[data-zone]') as HTMLElement | SVGElement | null;
  return (z?.dataset.zone as Zone | undefined) ?? null;
}

export function createPresentation() {
  return {
    engine: null as MyFriendEngine | null,
    current: gameConfig.defaultPalette as CharacterPaletteName,
    isPaused: false,
    activeMood: null as string | null,
    _moodResetTimer: null as ReturnType<typeof setTimeout> | null,
    _pointerHandler: null as ((e: PointerEvent) => void) | null,
    _hitSvg: null as SVGElement | null,

    init() {
      this.engine = new MyFriendEngine(gameConfig);

      window.addEventListener('my-friend:palette-change', ((e: CustomEvent) => {
        const next = e.detail.palette as CharacterPaletteName;
        const prev = (e.detail.previous as CharacterPaletteName) ?? this.current;
        applyPalette(STAGE_SELECTOR, prev, next);
        this.current = next;
      }) as EventListener);

      const stage = document.querySelector(STAGE_SELECTOR) as HTMLElement | null;
      const hitSvg = stage?.querySelector<SVGElement>('svg.hit-zones') ?? null;
      const fxLayer = stage?.querySelector<HTMLElement>(FX_SELECTOR) ?? null;
      this._hitSvg = hitSvg;

      if (hitSvg && this.engine) {
        this._pointerHandler = (e: PointerEvent) => {
          // first touch primes Tone.js (browsers require user gesture)
          initAudio().catch(() => {});

          if (stage && fxLayer) {
            const r = stage.getBoundingClientRect();
            spawnRipple(fxLayer, e.clientX - r.left, e.clientY - r.top);
          }

          const zone = resolveZone(e.target);
          this.engine?.handleZoneTap({ zone });
        };
        hitSvg.addEventListener('pointerdown', this._pointerHandler);
      }

      this.engine.start();
    },

    pickPalette(name: CharacterPaletteName) {
      this.engine?.setPalette(name);
    },

    pickMood(mood: string) {
      initAudio().catch(() => {});
      this.activeMood = mood;
      window.dispatchEvent(
        new CustomEvent('character:set-mood', {
          detail: { mood, duration: MOOD_BUTTON_DURATION_MS },
        }),
      );
      playMoodMotif(mood);
      if (this._moodResetTimer) clearTimeout(this._moodResetTimer);
      this._moodResetTimer = setTimeout(() => {
        this.activeMood = null;
      }, MOOD_BUTTON_DURATION_MS);
    },

    togglePause() {
      if (!this.engine) return;
      if (this.isPaused) { this.isPaused = false; this.engine.resume(); }
      else { this.isPaused = true; this.engine.pause(); }
    },

    resumeGame() {
      this.isPaused = false;
      this.engine?.resume();
    },

    destroy() {
      if (this._pointerHandler && this._hitSvg) {
        this._hitSvg.removeEventListener('pointerdown', this._pointerHandler);
      }
      if (this._moodResetTimer) clearTimeout(this._moodResetTimer);
      this.engine?.destroy();
    },
  };
}
