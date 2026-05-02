import { MemoryLightsEngine } from './engine';
import config from './config.json';
import type { MemoryLightsConfig } from './types';
import { playScoreTick } from '@/lib/audio';

const gameConfig = config as MemoryLightsConfig;

export function createScoreBoardData() {
  return {
    localScore: 0,
    localStars: 1,
    displayScore: 0,
    earnedText: 0,
    showFlyBadge: false,
    scorePulse: false,

    init() {
      window.addEventListener('ml:score-animate', ((e: CustomEvent) => {
        setTimeout(() => {
          this.animateScore(this.localScore, e.detail.total, e.detail.earned);
        }, 800);
      }) as EventListener);

      window.addEventListener('ml:state-change', ((e: CustomEvent) => {
        this.localStars = e.detail.stars;
        if (this.displayScore === 0 && e.detail.score > 0) {
          this.displayScore = e.detail.score;
          this.localScore = e.detail.score;
        }
      }) as EventListener);
    },

    animateScore(from: number, to: number, earned: number) {
      this.scorePulse = true;
      setTimeout(() => { this.scorePulse = false; }, 800);
      this.earnedText = earned;
      this.showFlyBadge = true;
      setTimeout(() => { this.showFlyBadge = false; }, 800);

      const steps = 15;
      const increment = (to - from) / steps;
      let current = from;
      let step = 0;

      const tick = () => {
        step++;
        current += increment;
        if (step >= steps) {
          this.displayScore = to;
          this.localScore = to;
          return;
        }
        this.displayScore = Math.round(current);
        requestAnimationFrame(tick);
      };

      const soundTicks = Math.min(Math.ceil(earned / 5), 8);
      for (let i = 0; i < soundTicks; i++) {
        setTimeout(() => {
          playScoreTick();
        }, i * 50 + 800);
      }

      requestAnimationFrame(tick);
    },
  };
}

export function createTimerBarData() {
  return {
    enabled: true,
    show: false,
    percent: 100,
    barColor: '#22c55e',

    init() {
      window.addEventListener('ml:timer-start', (() => {
        this.show = true;
        this.percent = 100;
        this.barColor = '#22c55e';
      }) as EventListener);

      window.addEventListener('ml:timer-stop', (() => {
        this.show = false;
      }) as EventListener);

      window.addEventListener('ml:timer-tick', ((e: CustomEvent) => {
        this.percent = e.detail.percent;
        const p = e.detail.percent;
        if (p > 60) this.barColor = '#22c55e';
        else if (p > 30) this.barColor = '#eab308';
        else this.barColor = '#ef4444';
      }) as EventListener);
    },
  };
}

export function createPresentation() {
  return {
    engine: null as MemoryLightsEngine | null,
    score: 0,
    stars: 1,
    round: 1,
    message: '',
    messageType: '',
    bgFlash: '',
    bgAmbient: '',
    showFlyPoints: false,
    centerPoints: 0,
    flyStyle: '',
    gameState: 'IDLE' as string,
    activeLightIndex: null as number | null,
    showCountdown: false,
    showStartButton: true,
    showTimeout: false,
    isPaused: false,

    init() {
      const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
      this.engine = new MemoryLightsEngine(gameConfig, canvas);

      window.addEventListener('ml:play-score-tick', () => {
        playScoreTick();
      });

      window.addEventListener('ml:timer-expired', () => {
        this.showTimeout = true;
      });

      const setMood = (mood: string, duration = 0) => {
        window.dispatchEvent(new CustomEvent('character:set-mood', { detail: { mood, duration } }));
      };

      window.addEventListener('ml:correct', () => setMood('happy', 1800));
      window.addEventListener('ml:wrong', () => setMood('sad', 1800));
      window.addEventListener('ml:timer-expired', () => setMood('tired', 2500));
      window.addEventListener('ml:state-change', ((e: CustomEvent) => {
        const gs = e.detail?.gameState;
        if (gs === 'SHOWING_SEQUENCE') setMood('thinking');
        else if (gs === 'WAITING_INPUT') setMood('idle');
        else if (gs === 'CELEBRATING') setMood('excited', 1500);
      }) as EventListener);
    },

    startGame() {
      this.showStartButton = false;
      this.showTimeout = false;
      this.isPaused = false;
      if (this.engine) {
        this.engine.start();
      }
    },

    togglePause() {
      if (!this.engine || this.showStartButton) return;
      if (this.isPaused) {
        this.resumeGame();
      } else {
        this.isPaused = true;
        this.engine.pause();
      }
    },

    resumeGame() {
      this.isPaused = false;
      this.engine?.resume();
    },

    resetHistory() {
      if (!confirm('Tem certeza que quer apagar a pontuação e começar do zero?')) return;
      this.engine?.resetHistory();
      this.isPaused = false;
      this.showTimeout = false;
    },

    restartGame() {
      this.showTimeout = false;
      this.isPaused = false;
      this.engine?.destroy();
      const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
      this.engine = new MemoryLightsEngine(gameConfig, canvas);
      this.engine.start();
    },

    startFlyAnimation() {
      const scoreBox = document.getElementById('score-box');
      if (!scoreBox) return;
      const target = scoreBox.getBoundingClientRect();
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.35;
      const endX = target.left + target.width / 2 - 25;
      const endY = target.top + target.height / 2 - 18;

      this.flyStyle = `left: ${cx - 30}px; top: ${cy}px; transform: scale(2); transition: none;`;
      this.showFlyPoints = true;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.flyStyle = `left: ${endX}px; top: ${endY}px; transform: scale(0.6); transition: left 0.8s cubic-bezier(0.25, 0.1, 0.15, 1), top 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.8s ease-out;`;
        });
      });

      setTimeout(() => {
        this.showFlyPoints = false;
      }, 900);
    },

    destroy() {
      if (this.engine) {
        this.engine.destroy();
      }
    },
  };
}
