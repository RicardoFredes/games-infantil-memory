import type { GameRegistration } from '@/lib/game-engine';
import type { MemoryCardsConfig } from './types';
import { meta } from './meta';
import { MemoryCardsEngine } from './engine';
import { createPresentation } from './presentation';
import config from './config.json';

export { meta };
export { MemoryCardsEngine };
export type { MemoryCardsConfig };

const typedConfig = config as MemoryCardsConfig;

export function register(): GameRegistration<MemoryCardsConfig> {
  return {
    meta,
    config: typedConfig,
    createEngine: (canvas) => new MemoryCardsEngine(typedConfig, canvas),
    presentation: createPresentation,
  };
}
