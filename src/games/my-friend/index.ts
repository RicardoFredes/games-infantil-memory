import type { GameRegistration } from '@/lib/game-engine';
import type { MyFriendConfig } from './types';
import { meta } from './meta';
import { MyFriendEngine } from './engine';
import { createPresentation } from './presentation';
import config from './config.json';

export { meta };
export { MyFriendEngine };
export type { MyFriendConfig };

const typedConfig = config as MyFriendConfig;

export function register(): GameRegistration<MyFriendConfig> {
  return {
    meta,
    config: typedConfig,
    createEngine: () => new MyFriendEngine(typedConfig),
    presentation: createPresentation,
  };
}
