# Plano de Arquitetura — Jogo de Memória (Infantil 2-7 anos)

## Stack Tecnológica

| Camada       | Tecnologia                        | Motivo                                     |
| ------------ | --------------------------------- | ------------------------------------------ |
| Framework    | Astro v5 (SSG)                    | Zero JS por padrão, islands interativas    |
| Estilo       | Tailwind CSS v4 + daisyUI v5      | Produtividade, temas, mobile-first         |
| Reatividade  | Alpine.js                         | Leve, declarativo, sem build step extra    |
| Jogo (Canvas)| Canvas API                        | Confetes, partículas                       |
| Áudio        | Tone.js (MIT) + ZzFX (MIT)        | Timbre infantil real (xilofone, sino) + efeitos cartoon |
| Ícones       | Emoji nativo + Lordicon (free tier, requer atribuição) + @iconify/Twemoji | Ícones animados festivos, emojis consistentes, zero custo |
| Linguagem    | TypeScript (strict)               | Tipagem em toda a lógica de jogo           |
| PWA          | vite-plugin-pwa                   | Service worker, manifesto, instalável      |
| Configuração | JSON estático em `src/config/`    | Tuning sem tocar código                    |

## Estrutura de Diretórios

```
/
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest        # gerado pelo vite-plugin-pwa
│   └── fonts/                      # fontes locais (se houver)
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Confetti.astro      # wrapper do canvas de confetes
│   │   │   ├── Countdown.astro     # contagem regressiva entre rodadas
│   │   │   ├── ScoreBoard.astro    # placar e estrelas
│   │   │   ├── CelebrationOverlay.astro  # overlay de comemoração
│   │   │   └── BaseHead.astro      # meta tags, PWA, SEO
│   │   └── games/
│   │       ├── MemoryLights.astro  # página do jogo das luzes
│   │       ├── LightButton.astro   # botão individual de luz/som
│   │       └── GameWrapper.astro   # layout comum a todos os minijogos
│   ├── layouts/
│   │   └── BaseLayout.astro        # shell principal (header, nav, etc.)
│   ├── lib/
│   │   ├── audio.ts                # wrapper Tone.js (sons musicais)
│   │   ├── sfx.ts                  # wrapper ZzFX (efeitos: pop, erro, confete)
│   │   ├── confetti.ts             # motor de partículas (canvas)
│   │   ├── storage.ts              # localStorage wrapper (progresso)
│   │   └── scoring.ts              # lógica de pontuação unificada
│   ├── games/
│   │   └── memory-lights/
│   │       ├── engine.ts           # máquina de estados do jogo
│   │       ├── sequencer.ts        # gerador de sequências aleatórias
│   │       └── types.ts            # tipos específicos do jogo
│   ├── config/
│   │   ├── app.json                # config global (cores, fontes, etc.)
│   │   ├── games.json              # registro de minijogos disponíveis
│   │   └── memory-lights.json      # parâmetros do jogo de luzes
│   ├── types/
│   │   └── index.ts                # tipos compartilhados
│   └── pages/
│       ├── index.astro             # home — seleção de jogos
│       └── jogos/
│           └── luzes.astro         # rota do jogo de memória de luzes
├── astro.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── plans/                          # documentos de planejamento
```

## Princípios de Design

1. **Toda lógica de jogo é TypeScript puro** — Astro só monta o DOM inicial. Alpine.js gerencia estado de UI. Canvas renderiza partículas.
2. **Configuração 100% em JSON** — sequência, cores, tempos, sons, pontuação, dificuldade: tudo parametrizado.
3. **Mobile-first** — layout pensado para touch, viewport de celular, sem scroll indesejado.
4. **Celebração constante** — cada acerto tem confetes, som festivo, animação de estrelas. Mesmo erros são tratados com gentileza (sem "game over" agressivo).
5. **Modular por jogo** — cada minijogo vive em `src/games/<nome>/` com seu próprio engine, types, e config JSON.

## Arquitetura de um Minijogo (ex: Memory Lights)

```
┌────────────────────────────────────────────┐
│ Astro Page (jogos/luzes.astro)             │
│  └─ GameWrapper.astro                      │
│      ├─ ScoreBoard.astro                   │
│      ├─ LightButton × 4 (DOM + Alpine)     │
│      ├─ Countdown.astro (Alpine)           │
│      ├─ Confetti.astro (Canvas)            │
│      └─ CelebrationOverlay.astro           │
│                                             │
│  Script (client:load):                      │
│    import { MemoryLightsGame } from '../..' │
│    import config from '../../config/...'    │
│    new MemoryLightsGame(config, canvas)     │
└────────────────────────────────────────────┘
```

O fluxo:
1. Astro renderiza HTML estático com estrutura base
2. Script Alpine.js inicializa reatividade (botões, score, timer)
3. Script do jogo (TypeScript) inicializa o engine no `client:load`
4. Engine controla o loop: mostra sequência → espera input → verifica → comemora/reinicia
5. Canvas de confetes é ativado nos momentos de celebração

## PWA

- `vite-plugin-pwa` gera service worker e manifest automaticamente
- Estratégia: cache-first para assets, network-first para (futuros) rankings online
- Instalável na homescreen do celular
- Funciona offline (tudo é estático)

## Licenças e Atribuições

- **Tone.js** — MIT, sem restrições
- **ZzFX** — MIT, sem restrições
- **Lordicon** — free tier, requer atribuição no footer: "Animated icons by Lordicon.com"
- **@iconify** — Apache 2.0, atribuição recomendada nos créditos
