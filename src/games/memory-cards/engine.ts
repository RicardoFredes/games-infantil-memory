import type { MemoryCardsConfig, CardData, CardsGameState } from './types';
import type { GameEngine } from '@/lib/game-engine';
import {
  initAudio,
  playCardMatch,
  playCardWin,
  playPop,
  playConfettiSfx,
  startBackgroundMusic,
  stopBackgroundMusic,
} from '@/lib/audio';
import { ConfettiSystem } from '@/lib/confetti';
import { createInitialState, getStars, type ScoreState } from '@/lib/scoring';
import { loadGameState, saveGameState, clearGameState } from '@/lib/storage';

function emit(name: string, detail?: unknown) {
  const kebab = name.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  window.dispatchEvent(new CustomEvent(`memory-cards:${kebab}`, { detail }));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class MemoryCardsEngine implements GameEngine<MemoryCardsConfig, { cards: CardData[]; gameState: CardsGameState }> {
  readonly id: string;
  private config: MemoryCardsConfig;
  private confetti: ConfettiSystem | null = null;
  private scoreState: ScoreState;
  private gameState: CardsGameState = 'IDLE';
  private cards: CardData[] = [];
  private firstCard: CardData | null = null;
  private freeze = false;
  private round = 1;
  private matchedThisRound = 0;
  private winTimer: ReturnType<typeof setTimeout> | null = null;
  private audioReady = false;
  private audioInitPromise: Promise<void> | null = null;
  paused = false;

  constructor(config: MemoryCardsConfig, confettiCanvas?: HTMLCanvasElement) {
    this.config = config;
    this.id = config.meta.id;
    this.scoreState = loadGameState<ScoreState>(config.meta.id) ?? createInitialState();
    this.round = this.scoreState.round || 1;
    if (confettiCanvas) {
      this.confetti = new ConfettiSystem(confettiCanvas);
    }
  }

  start(): void {
    this.newRound();
  }

  private ensureAudio(): Promise<void> {
    if (this.audioReady) return Promise.resolve();
    if (!this.audioInitPromise) {
      this.audioInitPromise = (async () => {
        await initAudio();
        if (this.config.audio.backgroundMusic) {
          startBackgroundMusic(
            this.config.audio.backgroundMusic,
            this.config.audio.backgroundVolume ?? -18,
          );
        }
        this.audioReady = true;
      })();
    }
    return this.audioInitPromise;
  }

  private newRound(): void {
    this.firstCard = null;
    this.freeze = false;
    this.matchedThisRound = 0;
    this.gameState = 'PLAYING';

    const pairs = this.getPairsForRound();
    const columns = this.getColumnsForRound();
    const deck = this.config.decks[this.config.defaultDeck] ?? [];
    const selected = shuffle(deck).slice(0, pairs);

    const doubled: CardData[] = [];
    selected.forEach((image, id) => {
      doubled.push({ id, uid: `${id}-a`, image, matched: false, open: false });
      doubled.push({ id, uid: `${id}-b`, image, matched: false, open: false });
    });
    this.cards = shuffle(doubled);

    emit('roundStart', { round: this.round, pairs, columns, cards: this.cards });
    this.emitState();
  }

  private getPairsForRound(): number {
    for (const level of this.config.difficulty) {
      if (this.round >= level.rounds[0] && this.round <= level.rounds[1]) return level.pairs;
    }
    return this.config.difficulty[this.config.difficulty.length - 1]?.pairs ?? 6;
  }

  private getColumnsForRound(): number {
    for (const level of this.config.difficulty) {
      if (this.round >= level.rounds[0] && this.round <= level.rounds[1]) return level.columns;
    }
    return this.config.difficulty[this.config.difficulty.length - 1]?.columns ?? 3;
  }

  handleTap(uid: string): void {
    if (this.paused || this.freeze) return;
    if (this.gameState !== 'PLAYING' && this.gameState !== 'COMPARING') return;

    const card = this.cards.find((c) => c.uid === uid);
    if (!card || card.matched || card.open) return;

    void this.ensureAudio();

    card.open = true;
    playPop();
    if (this.config.behavior.vibrateOnTouch && navigator.vibrate) {
      navigator.vibrate(15);
    }
    emit('cardOpen', { uid: card.uid, id: card.id });

    if (!this.firstCard) {
      this.firstCard = card;
      return;
    }

    this.gameState = 'COMPARING';
    const a = this.firstCard;
    this.firstCard = null;

    if (a.id === card.id) {
      this.handleMatch(a, card);
    } else {
      this.handleMismatch(a, card);
    }
  }

  private handleMatch(a: CardData, b: CardData): void {
    a.matched = true;
    b.matched = true;
    this.matchedThisRound++;

    this.scoreState.streak++;
    let earned = this.config.scoring.matchPoints;
    if (this.scoreState.streak >= this.config.scoring.streakThreshold) {
      earned += this.config.scoring.streakBonus;
    }
    this.scoreState.points = Math.min(
      this.scoreState.points + earned,
      this.config.scoring.maxScore,
    );
    this.scoreState.totalCorrect++;
    saveGameState(this.config.meta.id, this.scoreState);

    playCardMatch(this.config.audio.volume);

    emit('cardMatch', { uidA: a.uid, uidB: b.uid, earned });
    emit('scoreAnimate', { earned, total: this.scoreState.points });
    this.emitState();

    const totalPairs = this.getPairsForRound();
    if (this.matchedThisRound >= totalPairs) {
      this.handleWin();
    } else {
      this.gameState = 'PLAYING';
    }
  }

  private handleMismatch(a: CardData, b: CardData): void {
    this.freeze = true;
    this.scoreState.streak = 0;
    emit('cardMismatch', { uidA: a.uid, uidB: b.uid });
    this.emitState();

    setTimeout(() => {
      a.open = false;
      b.open = false;
      emit('cardClose', { uids: [a.uid, b.uid] });
      this.freeze = false;
      this.gameState = 'PLAYING';
    }, this.config.behavior.flipBackDelay);
  }

  private handleWin(): void {
    this.gameState = 'WIN';
    this.round++;
    this.scoreState.round = this.round;
    saveGameState(this.config.meta.id, this.scoreState);

    playCardWin(this.config.audio.volume);
    playConfettiSfx();
    if (this.confetti) this.confetti.burst();

    emit('win', { round: this.round - 1, score: this.scoreState.points });
    this.emitState();

    this.winTimer = setTimeout(() => {
      this.newRound();
    }, 4500);
  }

  resetHistory(): void {
    if (this.winTimer) clearTimeout(this.winTimer);
    clearGameState(this.config.meta.id);
    this.scoreState = createInitialState();
    this.round = 1;
    this.firstCard = null;
    this.freeze = false;
    this.paused = false;
    this.newRound();
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

  destroy(): void {
    if (this.winTimer) clearTimeout(this.winTimer);
    stopBackgroundMusic();
    if (this.confetti) this.confetti.destroy();
  }

  private emitState(): void {
    emit('stateChange', {
      gameState: this.gameState,
      score: this.scoreState.points,
      stars: getStars(this.scoreState.points, this.config.stars),
      round: this.round,
      streak: this.scoreState.streak,
    });
  }

  getCards(): readonly CardData[] {
    return this.cards;
  }

  getColumns(): number {
    return this.getColumnsForRound();
  }
}

