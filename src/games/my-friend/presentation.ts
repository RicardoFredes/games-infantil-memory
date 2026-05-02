import { MyFriendEngine } from './engine';
import config from './config.json';
import type { MyFriendConfig, Zone } from './types';
import type { CharacterPaletteName } from '@/lib/character-palettes';
import { applyPalette } from '@/lib/character-palette-swap';
import { initAudio, playMoodMotif } from '@/lib/audio';
import type { ActivityName } from './activities';
import './activities/all';

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
    activeActivity: null as ActivityName | null,
    activeTab: 'activities' as 'activities' | 'colors' | 'reactions',
    _moodResetTimer: null as ReturnType<typeof setTimeout> | null,
    _pointerHandler: null as ((e: PointerEvent) => void) | null,
    _hitSvg: null as SVGElement | null,
    _activityStartHandler: null as ((e: Event) => void) | null,
    _activityEndHandler: null as ((e: Event) => void) | null,

    init() {
      this.engine = new MyFriendEngine(gameConfig);

      window.addEventListener('my-friend:palette-change', ((e: CustomEvent) => {
        const next = e.detail.palette as CharacterPaletteName;
        const prev = (e.detail.previous as CharacterPaletteName) ?? this.current;
        applyPalette(STAGE_SELECTOR, prev, next);
        this.current = next;
      }) as EventListener);

      this._activityStartHandler = ((e: Event) => {
        const detail = (e as CustomEvent).detail;
        this.activeActivity = detail?.name ?? null;
      }) as EventListener;
      this._activityEndHandler = (() => {
        this.activeActivity = null;
      }) as EventListener;
      window.addEventListener('my-friend:activity-start', this._activityStartHandler);
      window.addEventListener('my-friend:activity-end', this._activityEndHandler);

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

    pickActivity(name: ActivityName) {
      initAudio().catch(() => {});
      const stage = document.querySelector(STAGE_SELECTOR) as HTMLElement | null;
      if (!stage || !this.engine) return;
      this.engine.startActivity(name, stage);
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
      if (this._activityStartHandler) {
        window.removeEventListener('my-friend:activity-start', this._activityStartHandler);
      }
      if (this._activityEndHandler) {
        window.removeEventListener('my-friend:activity-end', this._activityEndHandler);
      }
      if (this._moodResetTimer) clearTimeout(this._moodResetTimer);
      this.engine?.destroy();
    },
  };
}
