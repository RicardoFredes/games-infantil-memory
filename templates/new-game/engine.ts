import type { GameEngine } from '@/lib/game-engine';
import type { __GAME_ID__Config, __GAME_ID__GameState } from './types';
import { ConfettiSystem } from '@/lib/confetti';
import { createInitialState, getStars, type ScoreState } from '@/lib/scoring';
import { loadGameState, saveGameState, clearGameState } from '@/lib/storage';
import { initAudio, startBackgroundMusic, stopBackgroundMusic } from '@/lib/audio';

function emit(name: string, detail?: unknown) {
  const kebab = name.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  window.dispatchEvent(new CustomEvent(`__GAME_ID__:${kebab}`, { detail }));
}

export class __GAME_ID__Engine implements GameEngine<__GAME_ID__Config> {
  readonly id: string;
  private config: __GAME_ID__Config;
  private confetti: ConfettiSystem | null = null;
  private scoreState: ScoreState;
  private gameState: __GAME_ID__GameState = 'IDLE';
  paused = false;

  constructor(config: __GAME_ID__Config, confettiCanvas?: HTMLCanvasElement) {
    this.config = config;
    this.id = config.meta.id;
    this.scoreState = loadGameState<ScoreState>(config.meta.id) ?? createInitialState();
    if (confettiCanvas) this.confetti = new ConfettiSystem(confettiCanvas);
  }

  async start(): Promise<void> {
    await initAudio();
    startBackgroundMusic();
    this.gameState = 'PLAYING';
    this.emitState();
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    emit('paused', {});
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    emit('resumed', {});
  }

  resetHistory(): void {
    clearGameState(this.config.meta.id);
    this.scoreState = createInitialState();
    this.emitState();
  }

  destroy(): void {
    stopBackgroundMusic();
    if (this.confetti) this.confetti.destroy();
  }

  private emitState(): void {
    emit('stateChange', {
      gameState: this.gameState,
      score: this.scoreState.points,
      stars: getStars(this.scoreState.points, this.config.stars),
      round: this.scoreState.round,
    });
  }
}
