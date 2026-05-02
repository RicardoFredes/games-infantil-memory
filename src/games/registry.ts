import type { GameMeta, GameRegistration } from '@/lib/game-engine';
import * as memorySequence from './memory-sequence';
import * as memoryCards from './memory-cards';

export const registrations: GameRegistration[] = [
  memorySequence.register() as GameRegistration,
  memoryCards.register() as GameRegistration,
];

export const games: GameMeta[] = registrations.map((r) => r.meta);

export function findRegistration(id: string): GameRegistration | undefined {
  return registrations.find((r) => r.meta.id === id);
}
