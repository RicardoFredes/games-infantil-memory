// Comer (toggle): aparece uma mesa com vários pratos; a criança arrasta
// um item até a boca do personagem. Solta na boca → ele come (migalhas
// + bounce + mood happy). Solta fora → o item volta pro prato.

import { registerActivity } from './registry';
import { playGestureSfx } from '@/lib/audio';

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

function findMouthRect(stage: HTMLElement): DOMRect | null {
  const mouth = stage.querySelector('[data-zone="mouth"]');
  return mouth ? (mouth as Element).getBoundingClientRect() : null;
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

    // Tempo após soltar a comida em que as zonas do personagem ficam
    // desabilitadas, para evitar reações acidentais logo depois do drop.
    const HITZONE_RELOCK_MS = 2000;
    let hitzoneReleaseTimer: ReturnType<typeof setTimeout> | null = null;
    function lockHitzones() {
      if (hitzoneReleaseTimer) {
        clearTimeout(hitzoneReleaseTimer);
        hitzoneReleaseTimer = null;
      }
      stage.classList.add('mf-eat-dragging');
    }
    function scheduleHitzoneRelease() {
      if (hitzoneReleaseTimer) clearTimeout(hitzoneReleaseTimer);
      hitzoneReleaseTimer = setTimeout(() => {
        stage.classList.remove('mf-eat-dragging');
        hitzoneReleaseTimer = null;
      }, HITZONE_RELOCK_MS);
    }

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

      attachDrag(plate, food$, food);
      return plate;
    }

    function attachDrag(plate: HTMLElement, food$: HTMLElement, food: Food) {
      let dragging = false;
      let pointerId = -1;
      let dragEl: HTMLElement | null = null;
      let startX = 0;
      let startY = 0;
      let layerRect: DOMRect;

      const onDown = (e: PointerEvent) => {
        if (dragging) return;
        e.preventDefault();
        e.stopPropagation();
        dragging = true;
        pointerId = e.pointerId;
        layerRect = layer.getBoundingClientRect();
        lockHitzones();

        // clona o emoji para arrastar; o original some até resetar.
        dragEl = document.createElement('span');
        dragEl.className = 'mf-eat-food mf-eat-drag';
        dragEl.textContent = food.emoji;
        dragEl.style.left = `${e.clientX - layerRect.left}px`;
        dragEl.style.top  = `${e.clientY - layerRect.top}px`;
        layer.appendChild(dragEl);
        food$.style.opacity = '0';
        startX = e.clientX;
        startY = e.clientY;

        try { (e.target as Element).setPointerCapture(pointerId); } catch { /* no-op */ }
        plate.addEventListener('pointermove', onMove);
        plate.addEventListener('pointerup', onUp);
        plate.addEventListener('pointercancel', onUp);
      };

      const onMove = (e: PointerEvent) => {
        if (!dragging || e.pointerId !== pointerId || !dragEl) return;
        dragEl.style.left = `${e.clientX - layerRect.left}px`;
        dragEl.style.top  = `${e.clientY - layerRect.top}px`;
      };

      const onUp = (e: PointerEvent) => {
        if (!dragging || e.pointerId !== pointerId) return;
        dragging = false;
        scheduleHitzoneRelease();
        plate.removeEventListener('pointermove', onMove);
        plate.removeEventListener('pointerup', onUp);
        plate.removeEventListener('pointercancel', onUp);

        const mouth = findMouthRect(stage);
        const overMouth =
          !!mouth &&
          e.clientX >= mouth.left && e.clientX <= mouth.right &&
          e.clientY >= mouth.top  && e.clientY <= mouth.bottom;

        const moved = Math.hypot(e.clientX - startX, e.clientY - startY);
        // Se nem moveu (tap) e a comida é pequena: aceita um "tap" também
        // tratando como "alimentar" se a boca está visível e o tap foi nela.
        if (overMouth) {
          eatFood(food, food$, dragEl!, mouth!);
        } else {
          returnFood(food$, dragEl!, plate, moved < 4);
        }
        dragEl = null;
      };

      plate.addEventListener('pointerdown', onDown);
      cleanups.push(() => {
        plate.removeEventListener('pointerdown', onDown);
        plate.removeEventListener('pointermove', onMove);
        plate.removeEventListener('pointerup', onUp);
        plate.removeEventListener('pointercancel', onUp);
      });
    }

    function eatFood(food: Food, food$: HTMLElement, dragEl: HTMLElement, mouth: DOMRect) {
      const layerRect = layer.getBoundingClientRect();
      const tx = mouth.left - layerRect.left + mouth.width / 2;
      const ty = mouth.top  - layerRect.top  + mouth.height / 2;

      // anima o emoji até a boca e some.
      dragEl.style.transition = 'left 220ms ease-out, top 220ms ease-out, transform 220ms ease-out, opacity 220ms ease-in';
      dragEl.style.left = `${tx}px`;
      dragEl.style.top  = `${ty}px`;
      dragEl.style.transform = 'translate(-50%, -50%) scale(0.4)';
      dragEl.style.opacity = '0';
      window.setTimeout(() => dragEl.remove(), 260);

      playGestureSfx('tap');
      spawnCrumbs(layer, tx, ty);
      window.dispatchEvent(new CustomEvent('character:bounce'));
      window.dispatchEvent(new CustomEvent('character:set-mood', {
        detail: { mood: 'happy', duration: 0 },
      }));

      // respawn no prato após pequena pausa.
      window.setTimeout(() => {
        food$.style.transition = 'opacity 220ms ease-out, transform 220ms ease-out';
        food$.style.transform = 'scale(1)';
        food$.style.opacity = '1';
      }, 700);
    }

    function returnFood(food$: HTMLElement, dragEl: HTMLElement, plate: HTMLElement, isTap: boolean) {
      const plateRect = plate.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      const tx = plateRect.left - layerRect.left + plateRect.width / 2;
      const ty = plateRect.top  - layerRect.top  + plateRect.height / 2;
      dragEl.style.transition = 'left 280ms ease-out, top 280ms ease-out, transform 280ms ease-out, opacity 200ms ease-out';
      dragEl.style.left = `${tx}px`;
      dragEl.style.top  = `${ty}px`;
      dragEl.style.transform = 'translate(-50%, -50%) scale(0.4)';
      dragEl.style.opacity = '0';
      window.setTimeout(() => {
        dragEl.remove();
        food$.style.transition = '';
        food$.style.opacity = '1';
      }, isTap ? 80 : 300);
    }

    FOODS.forEach((food) => table.appendChild(buildPlate(food)));

    return () => {
      cleanups.forEach((fn) => fn());
      if (hitzoneReleaseTimer) {
        clearTimeout(hitzoneReleaseTimer);
        hitzoneReleaseTimer = null;
      }
      stage.classList.remove('mf-eat-dragging');
      layer.remove();
    };
  },
});
