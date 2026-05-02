import type { GameEngine } from '@/lib/game-engine';
import type { MyFriendConfig, MyFriendState, ZoneTapEvent, Reaction } from './types';
import type { CharacterPaletteName } from '@/lib/character-palettes';
import { loadGameState, saveGameState, clearGameState } from '@/lib/storage';
import { getPalette as getGlobalPalette, setPalette as setGlobalPalette } from '@/lib/character-preferences';
import { playGestureSfx } from '@/lib/audio';

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
  paused = false;

  constructor(config: MyFriendConfig) {
    this.config = config;
    this.id = config.meta.id;
    const persisted = loadGameState<MyFriendState>(config.meta.id);
    this.state = persisted
      ? { ...persisted, palette: getGlobalPalette() }
      : { palette: getGlobalPalette() };
  }

  start(): void {
    emit('paletteChange', { palette: this.state.palette });
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
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
    // no resources held
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
