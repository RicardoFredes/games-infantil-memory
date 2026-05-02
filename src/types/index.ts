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
