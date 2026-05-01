import type { MemoryLightsConfig } from './types';
import type { GameState, AppState } from '@/types';
import { generateSequence, getDifficultySteps, getDifficultyTiming } from './sequencer';
import { calculateScore, resetStreak, getStars, createInitialState, type ScoreState } from '@/lib/scoring';
import { initAudio, playNote, playSequence, playTap, playPop, playConfettiSfx, startBackgroundMusic, stopBackgroundMusic } from '@/lib/audio';
import { ConfettiSystem } from '@/lib/confetti';

function emit(name: string, detail?: unknown) {
  const kebab = name.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  window.dispatchEvent(new CustomEvent(`ml:${kebab}`, { detail }));
}

export class MemoryLightsEngine {
  private config: MemoryLightsConfig;
  private confetti: ConfettiSystem | null = null;
  private scoreState: ScoreState;
  private gameState: GameState = 'IDLE';
  private sequence: number[] = [];
  private playerInput: number[] = [];
  private currentStep = 0;
  private round = 1;
  private wrongCount = 0;
  private activeLight: number | null = null;

  readonly appState: AppState;

  constructor(config: MemoryLightsConfig, confettiCanvas?: HTMLCanvasElement) {
    this.config = config;
    this.scoreState = loadPersistedState(config.meta.id) ?? createInitialState();
    this.round = this.scoreState.round || 1;

    if (confettiCanvas) {
      this.confetti = new ConfettiSystem(confettiCanvas);
    }

    this.appState = {
      score: this.scoreState.points,
      stars: getStars(this.scoreState.points, config.stars),
      round: this.round,
      gameState: this.gameState,
      activeLight: null,
      message: '',
      showCountdown: false,
      showCelebration: false,
      sequenceDisplay: [],
      earnedPoints: 0,
    };
  }

  async start(): Promise<void> {
    await initAudio();
    startBackgroundMusic();
    this.startCountdown(false);
  }

  private newRound(): void {
    const steps = getDifficultySteps(this.round, this.config.difficulty);
    this.sequence = generateSequence(steps, this.config.lights.length);
    this.playerInput = [];
    this.currentStep = 0;
    this.wrongCount = 0;
    this.gameState = 'IDLE';

    this.updateAppState();
    this.emitState();

    setTimeout(() => this.showSequence(), 500);
  }

  private async showSequence(): Promise<void> {
    this.gameState = 'SHOWING_SEQUENCE';
    this.updateAppState();
    this.emitState();

    const { lightDuration, gapDuration } = getDifficultyTiming(this.round, this.config.difficulty);

    for (let i = 0; i < this.sequence.length; i++) {
      await this.delay(gapDuration);
      const lightIndex = this.sequence[i];
      const light = this.config.lights[lightIndex];
      this.activeLight = lightIndex;
      this.updateAppState();
      emit('lightOn', { index: lightIndex, step: i + 1, total: this.sequence.length });

      playNote(light.note, `${lightDuration / 1000}n`, this.config.audio.volume);
      await this.delay(lightDuration);

      this.activeLight = null;
      this.updateAppState();
      emit('lightOff', { index: lightIndex });
    }

    await this.delay(gapDuration);
    this.gameState = 'WAITING_INPUT';
    this.updateAppState();
    this.emitState();
  }

  handleTap(lightIndex: number): void {
    if (this.gameState !== 'WAITING_INPUT') return;

    this.activeLight = lightIndex;
    const light = this.config.lights[lightIndex];
    playNote(light.note, '8n', this.config.audio.volume);
    playTap();
    if (this.config.behavior.vibrateOnTouch && navigator.vibrate) {
      navigator.vibrate(20);
    }

    this.playerInput.push(lightIndex);
    this.currentStep++;

    emit('playerTap', { index: lightIndex, step: this.currentStep });

    setTimeout(() => {
      this.activeLight = null;
      this.updateAppState();
    }, 150);

    if (this.currentStep >= this.sequence.length) {
      this.checkResult();
    }
  }

  private checkResult(): void {
    this.gameState = 'CHECKING';
    const isCorrect = this.sequence.every((v, i) => v === this.playerInput[i]);

    setTimeout(() => {
      if (isCorrect) {
        this.handleCorrect();
      } else {
        this.handleWrong();
      }
    }, 300);
  }

  private handleCorrect(): void {
    const steps = this.sequence.length;
    const result = calculateScore(this.scoreState, steps, this.config.scoring);
    this.scoreState = result.state;

    this.gameState = 'CORRECT';
    this.appState.earnedPoints = result.points;
    emit('allLightsFlash', { color: '#44FF44', duration: 300 });
    playSequence(this.config.audio.victoryArpeggio, 120, this.config.audio.volume);
    playConfettiSfx();

    if (this.confetti) {
      this.confetti.burst();
    }

    savePersistedState(this.config.meta.id, this.scoreState);

    emit('correct', {
      points: this.scoreState.points,
      earned: result.points,
      streak: this.scoreState.streak,
      round: this.round,
    });

    emit('scoreAnimate', {
      earned: result.points,
      total: this.scoreState.points,
    });

    this.updateAppState();
    this.emitState();

    setTimeout(() => {
      this.gameState = 'CELEBRATING';
      this.appState.showCelebration = true;
      this.updateAppState();
      this.emitState();

      setTimeout(() => {
        this.appState.showCelebration = false;
        this.startCountdown();
      }, this.config.timing.celebrationDuration);
    }, 300);
  }

  private handleWrong(): void {
    this.wrongCount++;
    this.scoreState = resetStreak(this.scoreState);

    this.gameState = 'WRONG';
    playSequence(this.config.audio.errorPattern, 150, this.config.audio.volume);
    emit('allLightsFlash', { color: '#FF4444', duration: 300 });

    emit('wrong', {
      wrongCount: this.wrongCount,
      maxAttempts: this.config.behavior.maxWrongAttempts,
    });

    if (
      this.wrongCount >= this.config.behavior.maxWrongAttempts &&
      this.config.behavior.reduceStepsOnFail
    ) {
      const currentSteps = this.sequence.length;
      if (currentSteps > 3) {
        this.sequence = generateSequence(currentSteps - 1, this.config.lights.length);
      }
      this.wrongCount = 0;
    }

    this.playerInput = [];
    this.currentStep = 0;
    this.updateAppState();
    this.emitState();

    setTimeout(() => {
      this.showSequence();
    }, 1200);
  }

  private startCountdown(incrementRound = true): void {
    this.gameState = 'COUNTDOWN';
    const steps = ['3', '2', '1', 'Vai!'];
    const notes = this.config.audio.countdownPattern;
    let stepIndex = 0;
    this.appState.showCountdown = true;
    this.emitState();

    const tick = () => {
      if (stepIndex >= steps.length) {
        this.appState.showCountdown = false;
        if (incrementRound) this.round++;
        this.updateAppState();
        this.emitState();
        this.newRound();
        return;
      }

      const display = steps[stepIndex];
      if (stepIndex < notes.length) {
        playNote(notes[stepIndex].note, notes[stepIndex].duration, this.config.audio.volume + 4);
      }
      playPop();

      emit('countdown', { display });
      stepIndex++;
      setTimeout(tick, display === 'Vai!' ? 600 : 900);
    };

    tick();
  }

  private updateAppState(): void {
    this.appState.score = this.scoreState.points;
    this.appState.stars = getStars(this.scoreState.points, this.config.stars);
    this.appState.round = this.round;
    this.appState.gameState = this.gameState;
    this.appState.activeLight = this.activeLight;
    this.appState.sequenceDisplay = this.gameState === 'SHOWING_SEQUENCE'
      ? this.sequence.slice(0, this.currentStep + 1)
      : [];
  }

  private emitState(): void {
    emit('stateChange', {
      gameState: this.gameState,
      score: this.scoreState.points,
      stars: getStars(this.scoreState.points, this.config.stars),
      round: this.round,
      sequenceLength: this.sequence.length,
      playerInputLength: this.playerInput.length,
    });
  }

  getState(): Readonly<AppState> {
    return this.appState;
  }

  getConfig(): Readonly<MemoryLightsConfig> {
    return this.config;
  }

  destroy(): void {
    stopBackgroundMusic();
    if (this.confetti) {
      this.confetti.destroy();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

function loadPersistedState(gameId: string): ScoreState | null {
  try {
    const raw = localStorage.getItem(`memory-game-${gameId}-state`);
    if (!raw) return null;
    return JSON.parse(raw) as ScoreState;
  } catch {
    return null;
  }
}

function savePersistedState(gameId: string, state: ScoreState): void {
  try {
    localStorage.setItem(`memory-game-${gameId}-state`, JSON.stringify(state));
  } catch {
  }
}
