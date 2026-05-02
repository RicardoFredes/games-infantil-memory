import type { GameMeta } from '@/lib/game-engine';

export const meta: GameMeta = {
  id: 'my-friend',
  title: 'Meu Amigo',
  subtitle: 'Brinque com seu amigo',
  description: 'Troque a cor e interaja com seu amigo!',
  category: 'Personagem',
  image: '/games/my-friend/cover.webp',
  icon: '🤗',
  route: '/games/my-friend',
  ageRange: [2, 7],
  difficulty: 'fácil',
  color: '#F59E0B',
  enabled: true,
};
