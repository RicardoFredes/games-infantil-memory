import { MyFriendEngine } from './engine';
import config from './config.json';
import type { MyFriendConfig } from './types';
import type { CharacterPaletteName } from '@/lib/character-palettes';
import { applyPalette } from '@/lib/character-palette-swap';
import { attachRecognizer, type RecognizerHandle } from './gestures/recognizer';

const gameConfig = config as MyFriendConfig;
const STAGE_SELECTOR = '#my-friend-stage';

export function createPresentation() {
  return {
    engine: null as MyFriendEngine | null,
    recognizer: null as RecognizerHandle | null,
    current: gameConfig.defaultPalette as CharacterPaletteName,
    isPaused: false,

    init() {
      this.engine = new MyFriendEngine(gameConfig);

      window.addEventListener('my-friend:palette-change', ((e: CustomEvent) => {
        const next = e.detail.palette as CharacterPaletteName;
        const prev = (e.detail.previous as CharacterPaletteName) ?? this.current;
        applyPalette(STAGE_SELECTOR, prev, next);
        this.current = next;
      }) as EventListener);

      // attach recognizer to the hit-zones overlay svg
      const stage = document.querySelector(STAGE_SELECTOR);
      const hitSvg = stage?.querySelector<SVGElement>('svg.hit-zones');
      if (hitSvg && this.engine) {
        this.recognizer = attachRecognizer(hitSvg, gameConfig, (evt) => {
          this.engine?.handleGesture(evt);
        });
      }

      this.engine.start();
    },

    pickPalette(name: CharacterPaletteName) {
      this.engine?.setPalette(name);
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
      this.recognizer?.destroy();
      this.engine?.destroy();
    },
  };
}
