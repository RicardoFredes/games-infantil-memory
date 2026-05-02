import { Gesture } from '@use-gesture/vanilla';
import type { GestureKind, GestureEvent, Zone, MyFriendConfig } from '../types';

type Listener = (evt: GestureEvent) => void;

interface DragState {
  first: boolean;
  last: boolean;
  movement: [number, number];
  velocity: [number, number];
  distance: [number, number];
  xy: [number, number];
  elapsedTime: number;
  event: PointerEvent;
  direction: [number, number];
  initial: [number, number];
}

export interface RecognizerHandle {
  destroy(): void;
}

export function attachRecognizer(
  target: HTMLElement | SVGElement,
  config: MyFriendConfig,
  onGesture: Listener,
): RecognizerHandle {
  const cfg = config.gestures;

  let pressTimer: number | null = null;
  let pressFiredAt = 0;
  let lastTapAt = 0;
  let lastTapZone: Zone | null = null;
  let dirChanges = 0;
  let lastDirSign = 0;
  let firstDirChangeAt = 0;
  let downAt = 0;

  const resolveZone = (event: Event): Zone | null => {
    const el = event.target as Element | null;
    const z = el?.closest('[data-zone]') as HTMLElement | SVGElement | null;
    return (z?.dataset.zone as Zone | undefined) ?? null;
  };

  const fire = (kind: GestureKind, zone: Zone | null, extra?: Partial<GestureEvent>) => {
    onGesture({ kind, zone, ...extra });
  };

  const cancelPress = () => {
    if (pressTimer !== null) {
      window.clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  const gesture = new Gesture(
    target,
    {
      onPointerDown: (e) => {
        downAt = performance.now();
        pressFiredAt = 0;
        dirChanges = 0;
        lastDirSign = 0;
        firstDirChangeAt = 0;

        const zone = resolveZone(e);
        const longCfg = cfg.longPress;
        cancelPress();
        pressTimer = window.setTimeout(() => {
          pressFiredAt = performance.now();
          fire('longPress', zone, { durationMs: longCfg.minDurationMs });
        }, longCfg.minDurationMs ?? 800);
      },
      onPointerUp: (e) => {
        cancelPress();
        const now = performance.now();
        const duration = now - downAt;

        // long press already fired — skip tap classification
        if (pressFiredAt > 0) return;

        const zone = resolveZone(e);
        const tapMaxDur = cfg.tap.maxDurationMs ?? 200;
        if (duration > tapMaxDur) return;

        // tap or doubleTap
        const dblWindow = cfg.doubleTap.maxIntervalMs ?? 350;
        if (
          lastTapAt > 0 &&
          now - lastTapAt < dblWindow &&
          (lastTapZone === zone || zone === null || lastTapZone === null)
        ) {
          fire('doubleTap', zone);
          lastTapAt = 0;
          lastTapZone = null;
        } else {
          fire('tap', zone);
          lastTapAt = now;
          lastTapZone = zone;
        }
      },
      onPointerCancel: () => cancelPress(),
      onDrag: (state) => {
        const s = state as unknown as DragState;
        const speed = Math.hypot(s.velocity[0], s.velocity[1]);
        const dist = Math.hypot(s.distance[0], s.distance[1]);

        // any drag invalidates long-press / tap
        if (dist > 6) {
          cancelPress();
        }

        // tickle: count direction inversions on the X axis within window
        if (!s.first && !s.last) {
          const dx = s.direction[0];
          const sign = dx > 0.1 ? 1 : dx < -0.1 ? -1 : 0;
          if (sign !== 0 && lastDirSign !== 0 && sign !== lastDirSign) {
            const now = performance.now();
            if (firstDirChangeAt === 0 || now - firstDirChangeAt > (cfg.tickle.windowMs ?? 500)) {
              firstDirChangeAt = now;
              dirChanges = 1;
            } else {
              dirChanges++;
            }
            if (dirChanges >= (cfg.tickle.minDirChanges ?? 2)) {
              const zone = resolveZone(s.event);
              fire('tickle', zone, { distance: dist });
              dirChanges = 0;
              firstDirChangeAt = 0;
            }
          }
          if (sign !== 0) lastDirSign = sign;
        }

        if (s.last) {
          // classify on release
          const zone = resolveZone(s.event);
          const minSlapVel = cfg.slap.minVelocity ?? 1.2;
          const maxSlapDur = cfg.slap.maxDurationMs ?? 250;
          const minStrokeDist = cfg.stroke.minDistance ?? 30;
          const maxStrokeVel = cfg.stroke.maxVelocity ?? 0.6;

          if (speed >= minSlapVel && s.elapsedTime <= maxSlapDur) {
            fire('slap', zone, { velocity: speed, distance: dist, durationMs: s.elapsedTime });
            return;
          }
          if (dist >= minStrokeDist && speed <= maxStrokeVel) {
            fire('stroke', zone, { velocity: speed, distance: dist, durationMs: s.elapsedTime });
            return;
          }
        }
      },
    },
    {
      drag: { filterTaps: false, threshold: 0 },
    },
  );

  return {
    destroy() {
      cancelPress();
      gesture.destroy();
    },
  };
}
