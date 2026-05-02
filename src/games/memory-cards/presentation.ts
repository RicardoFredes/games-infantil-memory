import { MemoryCardsEngine } from './engine';
import config from './config.json';
import type { MemoryCardsConfig, CardData } from './types';

const gameConfig = config as MemoryCardsConfig;

export function createPresentation() {
  return {
    engine: null as MemoryCardsEngine | null,
    cards: [] as CardData[],
    columns: 3,
    score: 0,
    stars: 1,
    round: 1,
    streak: 0,
    gameState: 'IDLE' as string,
    message: '',
    messageType: '',
    bgFlash: '',
    showWin: false,
    isPaused: false,
    dealing: false,
    collecting: false,
    cardBack: gameConfig.theme.cardBack,

    init() {
      const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
      this.engine = new MemoryCardsEngine(gameConfig, canvas);

      window.addEventListener('mc:round-start', ((e: CustomEvent) => {
        this.columns = e.detail.columns;
        this.collecting = false;
        this.dealing = true;
        this.cards = (e.detail.cards as CardData[]).map((c) => ({ ...c }));
        this.message = '';
        const settle = 700 + e.detail.cards.length * 35;
        setTimeout(() => { this.dealing = false; }, settle);
      }) as EventListener);

      window.addEventListener('mc:card-open', ((e: CustomEvent) => {
        const card = this.cards.find((c) => c.uid === e.detail.uid);
        if (card) card.open = true;
      }) as EventListener);

      window.addEventListener('mc:card-close', ((e: CustomEvent) => {
        const uids = e.detail.uids as string[];
        uids.forEach((uid) => {
          const card = this.cards.find((c) => c.uid === uid);
          if (card) card.open = false;
        });
      }) as EventListener);

      window.addEventListener('mc:card-match', ((e: CustomEvent) => {
        [e.detail.uidA, e.detail.uidB].forEach((uid: string) => {
          const card = this.cards.find((c) => c.uid === uid);
          if (card) { card.open = true; card.matched = true; }
        });
        this.message = 'Par! 🎉';
        this.messageType = 'ok';
        this.bgFlash = 'bg-green-400/20';
        setTimeout(() => { this.bgFlash = ''; }, 500);
        setTimeout(() => { this.message = ''; }, 1200);
      }) as EventListener);

      window.addEventListener('mc:card-mismatch', () => {
        this.message = 'Tente outra vez!';
        this.messageType = 'err';
        this.bgFlash = 'bg-red-400/15';
        setTimeout(() => { this.bgFlash = ''; this.message = ''; }, 1100);
      });

      window.addEventListener('mc:win', () => {
        this.showWin = true;
        setTimeout(() => { this.collecting = true; }, 2800);
        setTimeout(() => { this.showWin = false; }, 4200);
      });

      const setMood = (mood: string, duration = 0) => {
        window.dispatchEvent(new CustomEvent('character:set-mood', { detail: { mood, duration } }));
      };
      window.addEventListener('mc:card-match', () => setMood('happy', 1500));
      window.addEventListener('mc:card-mismatch', () => setMood('sad', 1200));
      window.addEventListener('mc:win', () => setMood('excited', 3500));
      window.addEventListener('mc:round-start', () => setMood('excited', 1200));

      window.addEventListener('mc:state-change', ((e: CustomEvent) => {
        this.score = e.detail.score;
        this.stars = e.detail.stars;
        this.round = e.detail.round;
        this.streak = e.detail.streak;
        this.gameState = e.detail.gameState;
      }) as EventListener);

      this.engine.start();
    },

    onCardTap(card: CardData) {
      if (card.matched || card.open) return;
      this.engine?.handleTap(card.uid);
    },

    togglePause() {
      if (!this.engine) return;
      if (this.isPaused) this.resumeGame();
      else { this.isPaused = true; this.engine.pause(); }
    },

    resumeGame() {
      this.isPaused = false;
      this.engine?.resume();
    },

    resetHistory() {
      if (!confirm('Tem certeza que quer apagar a pontuação e começar do zero?')) return;
      this.engine?.resetHistory();
      this.isPaused = false;
      this.showWin = false;
      this.message = '';
    },
  };
}
