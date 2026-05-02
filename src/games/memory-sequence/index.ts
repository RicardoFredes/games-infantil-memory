import type { GameRegistration } from '@/lib/game-engine';
import type { MemorySequenceConfig, AppState } from './types';
import { meta } from './meta';
import { MemorySequenceEngine } from './engine';
import { createPresentation } from './presentation';
import config from './config.json';

export { meta };
export { MemorySequenceEngine };
export type { MemorySequenceConfig };

const typedConfig = config as MemorySequenceConfig;

export function register(): GameRegistration<MemorySequenceConfig, AppState> {
  return {
    meta,
    config: typedConfig,
    createEngine: (canvas) => new MemorySequenceEngine(typedConfig, canvas),
    presentation: createPresentation,
  };
}
