import type { GameRegistration } from '@/lib/game-engine';
import type { __GAME_ID__Config } from './types';
import { meta } from './meta';
import { __GAME_ID__Engine } from './engine';
import { createPresentation } from './presentation';
import config from './config.json';

export { meta };
export { __GAME_ID__Engine };
export type { __GAME_ID__Config };

const typedConfig = config as __GAME_ID__Config;

export function register(): GameRegistration<__GAME_ID__Config> {
  return {
    meta,
    config: typedConfig,
    createEngine: (canvas) => new __GAME_ID__Engine(typedConfig, canvas),
    presentation: createPresentation,
  };
}
