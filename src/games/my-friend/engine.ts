import type { GameEngine } from '@/lib/game-engine';
import type { MyFriendConfig, MyFriendState, ZoneTapEvent, Reaction } from './types';
import type { CharacterPaletteName } from '@/lib/character-palettes';
import { loadGameState, saveGameState, clearGameState } from '@/lib/storage';
import { getPalette as getGlobalPalette, setPalette as setGlobalPalette } from '@/lib/character-preferences';
import { playGestureSfx } from '@/lib/audio';
import { getActivity, type ActivityName } from './activities';

function emit(name: string, detail?: unknown) {
  const kebab = name.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  window.dispatchEvent(new CustomEvent(`my-friend:${kebab}`, { detail }));
}

function setMood(mood: string, duration = 0) {
  window.dispatchEvent(new CustomEvent('character:set-mood', { detail: { mood, duration } }));
}

function fireAction(action: NonNullable<Reaction['action']>) {
  window.dispatchEvent(new CustomEvent(`character:${action}`));
}

export class MyFriendEngine implements GameEngine<MyFriendConfig, MyFriendState> {
  readonly id: string;
  private config: MyFriendConfig;
  private state: MyFriendState;
  private cooldowns = new Map<string, number>();
  private activityCleanup: (() => void) | null = null;
  private activityTimer: ReturnType<typeof setTimeout> | null = null;
  paused = false;

  constructor(config: MyFriendConfig) {
    this.config = config;
    this.id = config.meta.id;
    const persisted = loadGameState<MyFriendState>(config.meta.id);
    this.state = persisted
      ? { ...persisted, palette: getGlobalPalette(), currentActivity: null }
      : { palette: getGlobalPalette(), currentActivity: null };
  }

  start(): void {
    emit('paletteChange', { palette: this.state.palette });
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.endActivity();
    emit('paused', {});
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    emit('resumed', {});
  }

  resetHistory(): void {
    clearGameState(this.config.meta.id);
    this.state = { palette: getGlobalPalette() };
    emit('paletteChange', { palette: this.state.palette });
  }

  destroy(): void {
    this.endActivity();
  }

  startActivity(name: ActivityName, stage: HTMLElement): void {
    if (this.paused) return;
    const spec = getActivity(name);
    if (!spec) return;
    // Toggle: se já está rodando essa atividade, encerra.
    if (this.state.currentActivity === name && spec.kind === 'toggle') {
      this.endActivity();
      return;
    }
    if (this.state.currentActivity) this.endActivity();

    this.state = { ...this.state, currentActivity: name };
    this.activityCleanup = spec.start(stage);
    if (spec.mood) setMood(spec.mood, spec.durationMs);
    emit('activityStart', { name });

    if (spec.kind === 'oneshot') {
      this.activityTimer = setTimeout(() => this.endActivity(), spec.durationMs);
    }
  }

  endActivity(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    if (this.activityCleanup) {
      try { this.activityCleanup(); } catch { /* no-op */ }
      this.activityCleanup = null;
    }
    if (this.state.currentActivity) {
      const name = this.state.currentActivity;
      this.state = { ...this.state, currentActivity: null };
      emit('activityEnd', { name });
    }
  }

  setPalette(palette: CharacterPaletteName): void {
    if (this.state.palette === palette) return;
    const previous = this.state.palette;
    this.state = { ...this.state, palette };
    saveGameState(this.config.meta.id, this.state);
    setGlobalPalette(palette);
    emit('paletteChange', { palette, previous });
  }

  handleZoneTap(evt: ZoneTapEvent): void {
    if (this.paused) return;
    const zone = evt.zone;
    if (!zone) return;
    const reaction = this.config.reactions[zone];
    if (!reaction) return;

    const cdMs = this.config.zones?.cooldownMs ?? 350;
    const last = this.cooldowns.get(zone) ?? 0;
    const now = performance.now();
    if (now - last < cdMs) return;
    this.cooldowns.set(zone, now);

    playGestureSfx('tap');
    setMood(reaction.mood, reaction.moodDuration);
    if (reaction.action) fireAction(reaction.action);
    emit('reaction', { zone, reaction });
  }

  getState(): Readonly<MyFriendState> {
    return this.state;
  }
}
