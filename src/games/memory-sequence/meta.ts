import type { GameMeta } from '@/lib/game-engine';

export const meta: GameMeta = {
  id: 'memory-lights',
  title: 'Imite a sequência',
  subtitle: 'Memorize as luzes coloridas e repita',
  description: 'Memorize a sequência de luzes coloridas e repita!',
  category: 'Memória',
  image: '/games/memory-lights/cover.webp',
  icon: '💡',
  route: '/games/sequence',
  ageRange: [2, 7],
  difficulty: 'progressivo',
  color: '#7C3AED',
  enabled: true,
  backgroundMusic: '/audio/leberch-suspense-511168.mp3',
  backgroundVolume: -16,
};
