// Comer (toggle): aparece uma mesa com vários pratos; a criança arrasta
// um item até a boca do personagem. Solta na boca → ele come (migalhas
// + mood eating/happy). Solta fora → o item volta pro prato.

import { registerActivity } from './registry';
import { playGestureSfx, playInflateSfx } from '@/lib/audio';
import { attachDrag, createDragLock } from './_drag';

interface Food {
  id: string;
  emoji: string;
}

const FOODS: Food[] = [
  { id: 'apple',       emoji: '🍎' },
  { id: 'banana',      emoji: '🍌' },
  { id: 'cookie',      emoji: '🍪' },
  { id: 'watermelon',  emoji: '🍉' },
  { id: 'carrot',      emoji: '🥕' },
  { id: 'donut',       emoji: '🍩' },
  { id: 'sandwich',    emoji: '🥪' },
  { id: 'broccoli',    emoji: '🥦' },
];

const HITZONE_RELOCK_MS = 2000;
const EAT_CHEW_MS = 1500;
const EAT_SAVOR_MS = 700;

function findMouthRect(stage: HTMLElement): DOMRect | null {
  const mouth = stage.querySelector('[data-zone="mouth"]');
  return mouth ? (mouth as Element).getBoundingClientRect() : null;
}

function findFeedRect(stage: HTMLElement): DOMRect | null {
  const rects = (['head', 'mouth', 'eye-l', 'eye-r'] as const)
    .map((z) => stage.querySelector(`[data-zone="${z}"]`)?.getBoundingClientRect())
    .filter((r): r is DOMRect => !!r);
  if (rects.length === 0) return null;
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}

const SPARK_GLYPHS = ['✨', '⭐', '💫', '🌟'];
function spawnGrowSparks(stage: HTMLElement, layer: HTMLElement) {
  const body = stage.querySelector('[data-zone="body"]');
  const layerRect = layer.getBoundingClientRect();
  let cx: number;
  let cy: number;
  if (body) {
    const r = (body as Element).getBoundingClientRect();
    cx = r.left - layerRect.left + r.width / 2;
    cy = r.top  - layerRect.top  + r.height / 2;
  } else {
    cx = layerRect.width / 2;
    cy = layerRect.height * 0.55;
  }
  const count = 10;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'mf-grow-spark';
    el.textContent = SPARK_GLYPHS[i % SPARK_GLYPHS.length];
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const dist = 60 + Math.random() * 50;
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;
    el.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    el.style.setProperty('--dy', `${Math.sin(angle) * dist - 20}px`);
    el.style.setProperty('--rot', `${(Math.random() - 0.5) * 180}deg`);
    el.style.setProperty('--delay', `${i * 22}ms`);
    layer.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }
}

function spawnCrumbs(layer: HTMLElement, x: number, y: number) {
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('span');
    el.className = 'mf-crumb';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty('--dx', `${(i - 2) * 14 + (Math.random() - 0.5) * 8}px`);
    layer.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }
}

registerActivity({
  name: 'eat',
  kind: 'toggle',
  durationMs: 60_000,
  mood: 'happy',
  start: (stage) => {
    const layer = document.createElement('div');
    layer.className = 'mf-activity-layer mf-eat-layer';
    stage.appendChild(layer);

    const table = document.createElement('div');
    table.className = 'mf-eat-table';
    layer.appendChild(table);

    const cleanups: Array<() => void> = [];
    const lock = createDragLock(stage, 'mf-eat-dragging', HITZONE_RELOCK_MS);
    let savorTimer: ReturnType<typeof setTimeout> | null = null;

    const BITE_LIMIT = 15;
    const SAD_THRESHOLD = 10;
    const BELLY_MAX = 1.5;
    const BELLY_GROWTH_PER_BITE = (BELLY_MAX - 1) / BITE_LIMIT;
    let bites = 0;

    function buildPlate(food: Food): HTMLElement {
      const plate = document.createElement('div');
      plate.className = 'mf-eat-plate';
      plate.dataset.foodId = food.id;

      const dish = document.createElement('span');
      dish.className = 'mf-eat-dish';
      dish.setAttribute('aria-hidden', 'true');
      plate.appendChild(dish);

      const food$ = document.createElement('span');
      food$.className = 'mf-eat-food';
      food$.textContent = food.emoji;
      food$.setAttribute('aria-label', food.id);
      plate.appendChild(food$);

      cleanups.push(attachDrag(plate, food$, {
        layer,
        cloneClass: 'mf-eat-food mf-eat-drag',
        lock,
        onDrop: ({ clientX, clientY, dragEl, original }) => {
          const feed = findFeedRect(stage);
          const overFeed =
            !!feed &&
            clientX >= feed.left && clientX <= feed.right &&
            clientY >= feed.top  && clientY <= feed.bottom;
          if (!overFeed) return false;
          if (bites >= BITE_LIMIT) {
            refuseFood();
            return false;
          }
          const mouth = findMouthRect(stage) ?? feed;
          eatFood(food, original, dragEl, mouth);
          return true;
        },
      }));
      return plate;
    }

    function refuseFood() {
      if (savorTimer) { clearTimeout(savorTimer); savorTimer = null; }
      playGestureSfx('refuse');
      window.dispatchEvent(new CustomEvent('character:set-mood', {
        detail: { mood: 'refuse', duration: 1500 },
      }));
      window.dispatchEvent(new CustomEvent('character:shake', {
        detail: { duration: 600 },
      }));
    }

    function eatFood(_food: Food, food$: HTMLElement, dragEl: HTMLElement, mouth: DOMRect) {
      const layerRect = layer.getBoundingClientRect();
      const tx = mouth.left - layerRect.left + mouth.width / 2;
      const ty = mouth.top  - layerRect.top  + mouth.height / 2;

      dragEl.style.transition = 'left 220ms ease-out, top 220ms ease-out, transform 220ms ease-out, opacity 220ms ease-in';
      dragEl.style.left = `${tx}px`;
      dragEl.style.top  = `${ty}px`;
      dragEl.style.transform = 'translate(-50%, -50%) scale(0.4)';
      dragEl.style.opacity = '0';
      window.setTimeout(() => dragEl.remove(), 260);

      playGestureSfx('tap');
      spawnCrumbs(layer, tx, ty);

      bites += 1;
      const prevBelly = Math.min(BELLY_MAX, 1 + (bites - 1) * BELLY_GROWTH_PER_BITE);
      const bellyScale = Math.min(BELLY_MAX, 1 + bites * BELLY_GROWTH_PER_BITE);
      window.dispatchEvent(new CustomEvent('character:belly-set', {
        detail: { scale: bellyScale, duration: 350 },
      }));
      if (bellyScale > prevBelly + 0.0001) {
        spawnGrowSparks(stage, layer);
        playInflateSfx(bites - 1);
      }

      const savorMood = bites >= SAD_THRESHOLD ? 'sad' : 'happy';
      if (savorTimer) clearTimeout(savorTimer);
      window.dispatchEvent(new CustomEvent('character:set-mood', {
        detail: { mood: 'eating', duration: 0 },
      }));
      savorTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('character:eyes-closed', {
          detail: { duration: 280 },
        }));
        window.dispatchEvent(new CustomEvent('character:set-mood', {
          detail: { mood: savorMood, duration: EAT_SAVOR_MS },
        }));
      }, EAT_CHEW_MS);

      // respawn no prato após pequena pausa
      window.setTimeout(() => {
        food$.style.transition = 'opacity 220ms ease-out, transform 220ms ease-out';
        food$.style.transform = 'scale(1)';
        food$.style.opacity = '1';
      }, 700);
    }

    FOODS.forEach((food) => table.appendChild(buildPlate(food)));

    return () => {
      cleanups.forEach((fn) => fn());
      lock.forceRelease();
      if (savorTimer) { clearTimeout(savorTimer); savorTimer = null; }
      bites = 0;
      window.dispatchEvent(new CustomEvent('character:belly-set', {
        detail: { scale: 1, duration: 600 },
      }));
      layer.remove();
    };
  },
});
