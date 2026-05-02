import type { GameMeta } from '@/lib/game-engine';

export const meta: GameMeta = {
  id: 'memory-cards',
  title: 'Jogo da Memória',
  subtitle: 'Encontre os pares de cartas iguais',
  description: 'Encontre os pares de cartas iguais!',
  category: 'Memória',
  image: '/games/memory-cards/cover.webp',
  icon: '🃏',
  route: '/games/memory-cards',
  ageRange: [2, 7],
  difficulty: 'progressivo',
  color: '#EC4899',
  enabled: true,
  backgroundMusic: '/audio/Coloured_Candles.mp3',
  backgroundVolume: -18,
};
