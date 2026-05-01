# Roadmap de Implementação

## Fase 1 — Setup do Projeto
- [ ] `npm create astro@latest` com template vazio (TypeScript strict)
- [ ] Instalar Tailwind v4 + daisyUI v5
- [ ] Instalar Alpine.js
- [ ] Instalar `tone` (Tone.js)
- [ ] Instalar `zzfx` (ZzFX)
- [ ] Instalar `@iconify/tailwind4` + animações Lordicon
- [ ] Instalar `vite-plugin-pwa`
- [ ] Configurar `astro.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- [ ] Criar estrutura de diretórios (`src/components/`, `src/lib/`, `src/config/`, etc.)
- [ ] Criar `src/config/app.json` com cores, fonte, meta globais
- [ ] Criar `BaseLayout.astro` com meta tags PWA, viewport, fontes
- [ ] Criar `BaseHead.astro`

## Fase 2 — Componentes Compartilhados
- [ ] `Confetti.astro` + `src/lib/confetti.ts` (canvas particle system)
- [ ] `Countdown.astro` (3, 2, 1 com animação Alpine)
- [ ] `ScoreBoard.astro` (pontuação + estrelas com Alpine)
- [ ] `CelebrationOverlay.astro` (mensagem festiva com Alpine)
- [ ] `src/lib/audio.ts` (wrapper Tone.js: PluckSynth, arpejos)
- [ ] `src/lib/sfx.ts` (wrapper ZzFX: pop, erro, confete)
- [ ] `src/lib/scoring.ts` (lógica de pontuação unificada)
- [ ] `src/lib/storage.ts` (localStorage para persistir progresso)

## Fase 3 — Página Home
- [ ] `src/pages/index.astro` — grid de cards de minijogos
- [ ] `src/config/games.json` — registro de jogos disponíveis
- [ ] `GameCard.astro` — card com nome, ícone, idade, link
- [ ] Navegação para `/jogos/luzes`

## Fase 4 — Jogo das Luzes
- [ ] `src/config/memory-lights.json` — config completa do jogo
- [ ] `src/games/memory-lights/types.ts` — tipos do jogo
- [ ] `src/games/memory-lights/sequencer.ts` — geração de sequência
- [ ] `src/games/memory-lights/engine.ts` — máquina de estados
- [ ] `LightButton.astro` — botão com Alpine.js (cor, som, animação)
- [ ] `GameWrapper.astro` — layout comum de minijogo
- [ ] `src/pages/jogos/luzes.astro` — página do jogo

## Fase 5 — PWA & Polish
- [ ] Service worker (via vite-plugin-pwa)
- [ ] Manifest com ícones, nome, tema
- [ ] Testar instalação em dispositivo móvel
- [ ] Ajustes de performance (Lighthouse)
- [ ] Testar com `prefers-reduced-motion`
- [ ] Testar touch em dispositivos reais

## Fase 6 — Próximos Minijogos (fora do escopo inicial)
- Jogo de pares (cartas de memória)
- Jogo de sequência de cores
- Jogo de sons (memorizar sequência sonora)
