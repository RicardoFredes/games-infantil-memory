export interface AppConfig {
  app: {
    name: string;
    shortName: string;
    description: string;
    version: string;
    theme: string;
  };
  theme: {
    backgroundGradient: string;
    fontFamily: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  pwa: {
    backgroundColor: string;
    themeColor: string;
    display: string;
    orientation: string;
  };
}

export interface GameEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  ageRange: [number, number];
  category: string;
  difficulty: string;
  color: string;
  enabled: boolean;
}

export interface GamesConfig {
  games: GameEntry[];
}

export type GameState = 'IDLE' | 'SHOWING_SEQUENCE' | 'WAITING_INPUT' | 'CHECKING' | 'CORRECT' | 'WRONG' | 'CELEBRATING' | 'COUNTDOWN';

export interface AppState {
  score: number;
  stars: number;
  round: number;
  gameState: GameState;
  activeLight: number | null;
  message: string;
  showCountdown: boolean;
  showCelebration: boolean;
  sequenceDisplay: number[];
  earnedPoints: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  shape: 'rect' | 'circle';
  opacity: number;
  life: number;
  maxLife: number;
}
