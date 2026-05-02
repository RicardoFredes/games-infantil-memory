import type { GameMeta } from '@/lib/game-engine';

export const meta: GameMeta = {
  id: '__GAME_ID__',
  title: '__TÍTULO__',
  subtitle: '__CHAMADA CURTA__',
  description: '__DESCRIÇÃO LONGA__',
  category: '__CATEGORIA__',
  image: '/games/__GAME_ID__/cover.webp',
  icon: '🎮',
  route: '/games/__ROUTE__',
  ageRange: [2, 7],
  difficulty: 'progressivo',
  color: '#7C3AED',
  enabled: true,
};
