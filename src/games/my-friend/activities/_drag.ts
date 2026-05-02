// Drag helper compartilhado por activities (eat, bath, ...).
// — Cria um elemento clone que segue o ponteiro;
// — bloqueia as hit-zones do personagem durante o drag (com release atrasado
//   após o pointerup, pra evitar reações acidentais);
// — delega ao caller decidir se o drop foi "consumido" (caller assume controle
//   do clone) ou se o item deve voltar pro suporte (helper anima de volta).

export interface DragLock {
  lock(): void;
  scheduleRelease(): void;
  forceRelease(): void;
}

export function createDragLock(stage: HTMLElement, className: string, relockMs: number): DragLock {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    lock() {
      if (timer) { clearTimeout(timer); timer = null; }
      stage.classList.add(className);
    },
    scheduleRelease() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        stage.classList.remove(className);
        timer = null;
      }, relockMs);
    },
    forceRelease() {
      if (timer) { clearTimeout(timer); timer = null; }
      stage.classList.remove(className);
    },
  };
}

export interface DragSession {
  /** Posição do ponteiro no instante do drop. */
  clientX: number;
  clientY: number;
  /** Distância desde o pointerdown (px) — útil pra distinguir tap. */
  movedPx: number;
  /** Clone que estava sendo arrastado. */
  dragEl: HTMLElement;
  /** Elemento original (escondido durante o drag). */
  original: HTMLElement;
  /** Suporte/porta-objetos do item (placa, prateleira). */
  origin: HTMLElement;
}

export interface DragOptions {
  /** Layer onde o clone é inserido; coords são relativas a este. */
  layer: HTMLElement;
  /** className do clone (estilo de "arrastando"). */
  cloneClass: string;
  /** Lock compartilhado de hit-zones. */
  lock: DragLock;
  /** Decide se o drop foi consumido. true → caller assume o clone (anima/remove).
   *  false → helper devolve o item ao suporte. */
  onDrop(session: DragSession): boolean;
  /** Duração da animação de retorno em ms. */
  returnDurationMs?: number;
}

export function attachDrag(
  origin: HTMLElement,
  original: HTMLElement,
  opts: DragOptions,
): () => void {
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
    layerRect = opts.layer.getBoundingClientRect();
    opts.lock.lock();

    dragEl = document.createElement('span');
    dragEl.className = opts.cloneClass;
    dragEl.textContent = original.textContent;
    dragEl.style.left = `${e.clientX - layerRect.left}px`;
    dragEl.style.top  = `${e.clientY - layerRect.top}px`;
    opts.layer.appendChild(dragEl);
    original.style.opacity = '0';
    startX = e.clientX;
    startY = e.clientY;

    try { (e.target as Element).setPointerCapture(pointerId); } catch { /* no-op */ }
    origin.addEventListener('pointermove', onMove);
    origin.addEventListener('pointerup', onUp);
    origin.addEventListener('pointercancel', onUp);
  };

  const onMove = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== pointerId || !dragEl) return;
    dragEl.style.left = `${e.clientX - layerRect.left}px`;
    dragEl.style.top  = `${e.clientY - layerRect.top}px`;
  };

  const onUp = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    opts.lock.scheduleRelease();
    origin.removeEventListener('pointermove', onMove);
    origin.removeEventListener('pointerup', onUp);
    origin.removeEventListener('pointercancel', onUp);

    const movedPx = Math.hypot(e.clientX - startX, e.clientY - startY);
    const session: DragSession = {
      clientX: e.clientX,
      clientY: e.clientY,
      movedPx,
      dragEl: dragEl!,
      original,
      origin,
    };
    const consumed = opts.onDrop(session);
    if (!consumed) {
      animateReturn(dragEl!, origin, opts.layer, original, opts.returnDurationMs ?? 280, movedPx < 4);
    }
    dragEl = null;
  };

  origin.addEventListener('pointerdown', onDown);

  return () => {
    origin.removeEventListener('pointerdown', onDown);
    origin.removeEventListener('pointermove', onMove);
    origin.removeEventListener('pointerup', onUp);
    origin.removeEventListener('pointercancel', onUp);
  };
}

function animateReturn(
  dragEl: HTMLElement,
  origin: HTMLElement,
  layer: HTMLElement,
  original: HTMLElement,
  durMs: number,
  isTap: boolean,
) {
  const originRect = origin.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();
  const tx = originRect.left - layerRect.left + originRect.width / 2;
  const ty = originRect.top  - layerRect.top  + originRect.height / 2;
  dragEl.style.transition = `left ${durMs}ms ease-out, top ${durMs}ms ease-out, transform ${durMs}ms ease-out, opacity 200ms ease-out`;
  dragEl.style.left = `${tx}px`;
  dragEl.style.top  = `${ty}px`;
  dragEl.style.transform = 'translate(-50%, -50%) scale(0.4)';
  dragEl.style.opacity = '0';
  window.setTimeout(() => {
    dragEl.remove();
    original.style.transition = '';
    original.style.opacity = '1';
  }, isTap ? 80 : durMs + 20);
}
