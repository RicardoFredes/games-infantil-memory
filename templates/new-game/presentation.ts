import { __GAME_ID__Engine } from './engine';
import config from './config.json';
import type { __GAME_ID__Config } from './types';

const gameConfig = config as __GAME_ID__Config;

export function createPresentation() {
  return {
    engine: null as __GAME_ID__Engine | null,
    score: 0,
    stars: 1,
    round: 0,
    gameState: 'IDLE' as string,
    isPaused: false,

    init() {
      const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
      this.engine = new __GAME_ID__Engine(gameConfig, canvas);

      window.addEventListener('__GAME_ID__:state-change', ((e: CustomEvent) => {
        this.score = e.detail.score;
        this.stars = e.detail.stars;
        this.round = e.detail.round;
        this.gameState = e.detail.gameState;
      }) as EventListener);

      this.engine.start();
    },

    togglePause() {
      if (!this.engine) return;
      if (this.isPaused) { this.isPaused = false; this.engine.resume(); }
      else { this.isPaused = true; this.engine.pause(); }
    },

    resetHistory() {
      if (!confirm('Tem certeza que quer apagar a pontuação e começar do zero?')) return;
      this.engine?.resetHistory();
      this.isPaused = false;
    },
  };
}
