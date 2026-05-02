import type { GameRegistration } from '@/lib/game-engine';
import type { MemoryLightsConfig, AppState } from './types';
import { meta } from './meta';
import { MemoryLightsEngine } from './engine';
import { createPresentation } from './presentation';
import config from './config.json';

export { meta };
export { MemoryLightsEngine };
export type { MemoryLightsConfig };

const typedConfig = config as MemoryLightsConfig;

export function register(): GameRegistration<MemoryLightsConfig, AppState> {
  return {
    meta,
    config: typedConfig,
    createEngine: (canvas) => new MemoryLightsEngine(typedConfig, canvas),
    presentation: createPresentation,
  };
}
