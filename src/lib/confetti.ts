import type { Particle } from '@/types';

interface ConfettiOptions {
  particleCount?: number;
  duration?: number;
  colors?: string[];
}

const defaultColors = [
  '#FF4444', '#FFCC00', '#44CC44', '#4488FF',
  '#FF44FF', '#44FFFF', '#FF8800', '#8844FF',
];

export class ConfettiSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animFrame: number = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(options: ConfettiOptions = {}): void {
    const {
      particleCount = 120,
      duration = 2000,
      colors = defaultColors,
    } = options;

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 1.5;
      const speed = 4 + Math.random() * 8;
      this.particles.push({
        x: cx,
        y: cy - 50 + Math.random() * 100,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 10,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        opacity: 1,
        life: 0,
        maxLife: duration * (0.6 + Math.random() * 0.4),
      });
    }

    if (!this.running) {
      this.running = true;
      this.loop();
    }
  }

  private loop(): void {
    this.animFrame = requestAnimationFrame(() => this.loop());
    this.update();
    this.draw();
  }

  private update(): void {
    const now = performance.now();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += 16.67;
      p.vy += 0.12;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.vx *= 0.995;

      const progress = p.life / p.maxLife;
      if (progress > 0.7) {
        p.opacity = 1 - (progress - 0.7) / 0.3;
      }

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length === 0) {
      this.running = false;
      cancelAnimationFrame(this.animFrame);
      this.clear();
    }
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.opacity;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  destroy(): void {
    window.removeEventListener('resize', this.resize);
    cancelAnimationFrame(this.animFrame);
    this.particles = [];
    this.running = false;
  }
}
