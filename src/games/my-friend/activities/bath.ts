// Banho (toggle): banheira sobe + prateleira de itens no rodapé.
// 🧼 sabonete  → corpo / banheira → mais espuma + bolhinhas
// 🧴 shampoo   → cabeça             → espuma na cabeça + bolhas
// 🚿 chuveiro  → personagem         → gotinhas (enxágua: tira espuma)
// 🦆 patinho   → banheira           → reposiciona patinho + splash
//
// foamLevel acumulativo (0..MAX_FOAM) controla 5 blobs de espuma sobre a
// banheira (opacity por nível). bolhas ambient sobem mais rápido com
// foam alta. Mood happy persistente (toggle).

import { registerActivity } from './registry';
import { playGestureSfx, playMoodMotif } from '@/lib/audio';
import { attachDrag, createDragLock } from './_drag';

const HITZONE_RELOCK_MS = 2000;
const MAX_FOAM = 5;

interface BathItem {
  id: 'soap' | 'shampoo' | 'shower' | 'duck';
  emoji: string;
  label: string;
}

const ITEMS: BathItem[] = [
  { id: 'soap',    emoji: '🧼', label: 'Sabonete' },
  { id: 'shampoo', emoji: '🧴', label: 'Shampoo' },
  { id: 'shower',  emoji: '🚿', label: 'Chuveiro' },
  { id: 'duck',    emoji: '🦆', label: 'Patinho' },
];

const BATHTUB_SVG = `
<svg viewBox="0 0 320 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="mfBathInner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#A8E1F0"/>
      <stop offset="100%" stop-color="#5EB7D0"/>
    </linearGradient>
    <linearGradient id="mfBathOuter" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#D7DCE5"/>
    </linearGradient>
  </defs>
  <ellipse cx="160" cy="100" rx="160" ry="20" fill="rgba(0,0,0,0.18)"/>
  <path d="M10 30 Q10 100 60 110 H260 Q310 100 310 30 Z" fill="url(#mfBathOuter)" stroke="#9AA1AF" stroke-width="3"/>
  <path d="M28 38 Q28 95 70 102 H250 Q292 95 292 38 Z" fill="url(#mfBathInner)"/>
  <ellipse cx="160" cy="38" rx="132" ry="8" fill="#FFFFFF" opacity="0.55"/>
  <circle cx="60"  cy="48" r="6" fill="#FFFFFF" opacity="0.85"/>
  <circle cx="260" cy="48" r="6" fill="#FFFFFF" opacity="0.85"/>
</svg>
`.trim();

const DUCK_SVG = `
<svg viewBox="0 0 56 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="28" cy="42" rx="22" ry="4" fill="rgba(0,0,0,0.18)"/>
  <path d="M6 30 Q6 18 22 18 Q22 8 34 8 Q44 8 44 18 Q56 22 50 32 Q42 38 28 38 Q12 38 6 30Z" fill="#FFD86B"/>
  <circle cx="36" cy="16" r="2.2" fill="#222"/>
  <path d="M44 18 L52 16 L48 22 Z" fill="#F0921F"/>
</svg>
`.trim();

function findZoneRect(stage: HTMLElement, zone: string): DOMRect | null {
  const el = stage.querySelector(`[data-zone="${zone}"]`);
  return el ? (el as Element).getBoundingClientRect() : null;
}

function pointInRect(x: number, y: number, r: DOMRect | null): boolean {
  return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function pointInElement(x: number, y: number, el: HTMLElement | null): boolean {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

registerActivity({
  name: 'bath',
  kind: 'toggle',
  durationMs: 60_000,
  mood: 'happy',
  start: (stage) => {
    const layer = document.createElement('div');
    layer.className = 'mf-activity-layer mf-bath-layer';
    stage.appendChild(layer);

    // Banheira
    const tub = document.createElement('div');
    tub.className = 'mf-bathtub';
    tub.innerHTML = BATHTUB_SVG;
    layer.appendChild(tub);

    // Container de espuma sobre a banheira
    const foamWrap = document.createElement('div');
    foamWrap.className = 'mf-foam-wrap';
    for (let i = 0; i < MAX_FOAM; i++) {
      const blob = document.createElement('span');
      blob.className = 'mf-foam-blob';
      blob.style.setProperty('--n', String(i));
      foamWrap.appendChild(blob);
    }
    layer.appendChild(foamWrap);

    // Espuma na cabeça (overlay solto)
    const foamHat = document.createElement('div');
    foamHat.className = 'mf-foam-hat';
    layer.appendChild(foamHat);

    // Patinho — invisível até o primeiro drop
    const duck = document.createElement('div');
    duck.className = 'mf-duck mf-duck-hidden';
    duck.innerHTML = DUCK_SVG;
    layer.appendChild(duck);

    // Estado
    let foamLevel = 0;
    let foamHatOn = false;

    function applyFoam() {
      foamWrap.style.setProperty('--lvl', String(foamLevel));
      // marcador no stage permite ajustar visual e cadência
      stage.dataset.foamLevel = String(foamLevel);
    }
    applyFoam();

    function setFoamHat(on: boolean) {
      foamHatOn = on;
      foamHat.classList.toggle('is-on', on);
    }

    function positionFoamHat() {
      const head = findZoneRect(stage, 'head');
      const layerRect = layer.getBoundingClientRect();
      if (!head) return;
      foamHat.style.left = `${head.left - layerRect.left + head.width / 2}px`;
      foamHat.style.top  = `${head.top  - layerRect.top  + head.height * 0.18}px`;
      foamHat.style.width = `${head.width * 0.82}px`;
    }
    positionFoamHat();

    function spawnSoapBubbles(x: number, y: number, count = 6) {
      for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'mf-bubble mf-bubble-soap';
        el.style.left = `${x + (Math.random() - 0.5) * 30}px`;
        el.style.top  = `${y + (Math.random() - 0.5) * 12}px`;
        const size = 12 + Math.random() * 16;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.setProperty('--dx', `${(Math.random() - 0.5) * 80}px`);
        el.style.setProperty('--dur', `${1100 + Math.random() * 600}ms`);
        layer.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
      }
    }

    function spawnRain(x: number, y: number) {
      for (let i = 0; i < 7; i++) {
        const el = document.createElement('span');
        el.className = 'mf-rain-drop';
        el.style.left = `${x + (Math.random() - 0.5) * 60}px`;
        el.style.top  = `${y - 80}px`;
        el.style.setProperty('--dy', `${100 + Math.random() * 60}px`);
        el.style.setProperty('--delay', `${i * 35}ms`);
        layer.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
      }
    }

    function spawnSplash(x: number, y: number) {
      for (let i = 0; i < 8; i++) {
        const el = document.createElement('span');
        el.className = 'mf-splash-drop';
        el.style.left = `${x}px`;
        el.style.top  = `${y}px`;
        const angle = (Math.PI * 2 * i) / 8;
        el.style.setProperty('--dx', `${Math.cos(angle) * 60}px`);
        el.style.setProperty('--dy', `${Math.sin(angle) * 40 - 20}px`);
        layer.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
      }
    }

    // Bolhas ambient (sobem da banheira)
    const stageRect = stage.getBoundingClientRect();
    const ambientOriginX = stageRect.width / 2;
    const ambientOriginY = stageRect.height * 0.65;
    function spawnAmbient() {
      const el = document.createElement('span');
      el.className = 'mf-bubble';
      const size = 10 + Math.random() * 18;
      el.style.left = `${ambientOriginX + (Math.random() - 0.5) * 220}px`;
      el.style.top = `${ambientOriginY}px`;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.setProperty('--dx', `${(Math.random() - 0.5) * 200}px`);
      el.style.setProperty('--dur', `${1400 + Math.random() * 800}ms`);
      layer.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }
    let ambientTimer: ReturnType<typeof setInterval> = setInterval(spawnAmbient, 260);

    // Prateleira de itens
    const shelf = document.createElement('div');
    shelf.className = 'mf-bath-shelf';
    layer.appendChild(shelf);

    const cleanups: Array<() => void> = [];
    const lock = createDragLock(stage, 'mf-bath-dragging', HITZONE_RELOCK_MS);

    function buildItem(item: BathItem): HTMLElement {
      const stand = document.createElement('div');
      stand.className = 'mf-bath-item';
      stand.dataset.itemId = item.id;

      const disc = document.createElement('span');
      disc.className = 'mf-bath-stand';
      disc.setAttribute('aria-hidden', 'true');
      stand.appendChild(disc);

      const tool = document.createElement('span');
      tool.className = 'mf-bath-tool';
      tool.textContent = item.emoji;
      tool.setAttribute('aria-label', item.label);
      stand.appendChild(tool);

      cleanups.push(attachDrag(stand, tool, {
        layer,
        cloneClass: 'mf-bath-tool mf-bath-drag',
        lock,
        onDrop: ({ clientX, clientY, dragEl }) => handleDrop(item, clientX, clientY, dragEl),
      }));
      return stand;
    }

    function handleDrop(item: BathItem, x: number, y: number, dragEl: HTMLElement): boolean {
      const layerRect = layer.getBoundingClientRect();
      const lx = x - layerRect.left;
      const ly = y - layerRect.top;
      const head = findZoneRect(stage, 'head');
      const body = findZoneRect(stage, 'body');
      const armL = findZoneRect(stage, 'arm-l');
      const armR = findZoneRect(stage, 'arm-r');
      const legL = findZoneRect(stage, 'leg-l');
      const legR = findZoneRect(stage, 'leg-r');
      const overChar =
        pointInRect(x, y, head) || pointInRect(x, y, body) ||
        pointInRect(x, y, armL) || pointInRect(x, y, armR) ||
        pointInRect(x, y, legL) || pointInRect(x, y, legR);
      const overTub = pointInElement(x, y, tub);
      const overHead = pointInRect(x, y, head);
      const overBody = pointInRect(x, y, body);

      switch (item.id) {
        case 'soap': {
          if (!overChar && !overTub) return false;
          foamLevel = Math.min(MAX_FOAM, foamLevel + 1);
          applyFoam();
          spawnSoapBubbles(lx, ly, 7);
          playGestureSfx('stroke');
          break;
        }
        case 'shampoo': {
          if (!overHead && !overBody) return false;
          foamLevel = Math.min(MAX_FOAM, foamLevel + 1);
          applyFoam();
          if (!foamHatOn) setFoamHat(true);
          positionFoamHat();
          spawnSoapBubbles(lx, ly, 9);
          playGestureSfx('stroke');
          break;
        }
        case 'shower': {
          if (!overChar && !overTub) return false;
          foamLevel = Math.max(0, foamLevel - 1);
          applyFoam();
          if (foamLevel === 0) setFoamHat(false);
          spawnRain(lx, ly);
          playGestureSfx('tap');
          break;
        }
        case 'duck': {
          if (!overTub) return false;
          duck.classList.remove('mf-duck-hidden');
          duck.style.left = `${lx}px`;
          duck.style.top  = `${ly}px`;
          spawnSplash(lx, ly);
          playMoodMotif('happy', -14);
          break;
        }
      }

      // some o clone após pequeno feedback no ponto do drop.
      dragEl.style.transition = 'transform 220ms ease-out, opacity 220ms ease-in';
      dragEl.style.transform = 'translate(-50%, -50%) scale(0.5) rotate(-8deg)';
      dragEl.style.opacity = '0';
      window.setTimeout(() => dragEl.remove(), 240);

      // respawn no suporte
      window.setTimeout(() => {
        const tool = shelf.querySelector(`[data-item-id="${item.id}"] .mf-bath-tool`) as HTMLElement | null;
        if (tool) {
          tool.style.transition = 'opacity 220ms ease-out';
          tool.style.opacity = '1';
        }
      }, 350);

      return true;
    }

    ITEMS.forEach((it) => shelf.appendChild(buildItem(it)));

    return () => {
      cleanups.forEach((fn) => fn());
      lock.forceRelease();
      clearInterval(ambientTimer);
      delete stage.dataset.foamLevel;
      layer.remove();
    };
  },
});
