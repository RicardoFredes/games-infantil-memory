# Plano — Padronização da Estrutura de Jogos

## Objetivo
Tornar a adição de um novo minijogo um trabalho mecânico (clonar template → preencher config → implementar engine), eliminando duplicação de UI/scaffolding entre páginas e estabelecendo contratos claros entre **config**, **engine**, **presentation** e **componentes visuais**.

## Diagnóstico do estado atual

Pontos fortes que vamos preservar:
- Lógica de jogo já é TypeScript puro em `src/games/<nome>/engine.ts`.
- Configuração 100% em JSON.
- Comunicação engine ↔ UI via `CustomEvent` no `window`.

Problemas que estão dificultando escalar:

1. **Páginas inchadas e duplicadas** (`luzes.astro` 477 linhas, `memoria.astro` 423 linhas). Ambas reimplementam: top bar, bottom stars bar, character stage, pause menu, win/timeout overlays, message banner, init de música de fundo, integração de mood do personagem, animações flying-points.
2. **Sem contrato de engine.** `MemoryLightsEngine.start()` é `async`, `MemoryCardsEngine.start()` é `void`. Métodos comuns (`pause`, `resume`, `destroy`, `resetHistory`) existem nos dois mas não há `interface GameEngine`.
3. **Eventos com prefixos inconsistentes** (`ml:*`, `mc:*`, `character:*`) sem registro central nem tipagem dos payloads.
4. **`src/lib/scoring.ts` importa de `@/games/memory-lights/types`** — vazamento de dependência (lib genérica importa de jogo específico).
5. **Persistência duplicada.** Cada engine tem suas próprias `loadPersistedState` / `savePersistedState`, ignorando `src/lib/storage.ts`.
6. **Configs em `src/config/`** ficam longe da engine que as consome — quando se adiciona um jogo é fácil esquecer de registrar em `games.json`.
7. **Sem camada de "presentation"** — código Alpine vive solto dentro de `<script>` da página, misturado com markup.
8. **Sem template/scaffolding** para novo jogo.
9. **`AppState`/`GameState` em `src/types/index.ts`** são modelados para Memory Lights (`activeLight`, `sequenceDisplay`) e não servem para outros jogos.

## Estrutura padronizada por jogo

```
src/games/<game-id>/
├── index.ts              # Re-exports públicos: { Engine, meta, configSchema }
├── meta.ts               # { id, name, description, icon, route, ageRange, ... }
├── config.ts             # Tipos do config + (opcional) validação leve
├── config.json           # Parâmetros do jogo (movido de src/config/)
├── engine.ts             # Implementa GameEngine<TConfig, TState>
├── state.ts              # Tipos do estado interno do jogo
├── events.ts             # Nome dos eventos + tipos dos payloads
├── presentation.ts       # Factory Alpine x-data específico do jogo
├── components/           # Componentes visuais EXCLUSIVOS deste jogo
│   └── *.astro
├── page.astro            # Página da rota — fina, usa GameShell + slots
└── README.md             # Notas curtas: o que é, como roda, decisões
```

**Por que co-localizar tudo:** quando se adiciona/modifica um jogo, todo o relevante está em uma pasta. `src/config/` deixa de ser um local órfão; passa a hospedar apenas config global (`app.json`, `games.json`).

**Componentes visuais genéricos** (Confetti, Countdown, GameCharacter, TimerBar, ScoreBadge, StarsBar, PauseMenu, MessageBanner) ficam em `src/components/ui/` e podem ser usados por qualquer jogo via slots no `GameShell`.

## Contratos (interfaces canônicas)

### `GameEngine<TConfig, TState>` em `src/lib/game-engine.ts`

```ts
export interface GameEngine<TConfig = unknown, TState = unknown> {
  readonly id: string;
  readonly config: Readonly<TConfig>;
  start(): Promise<void>;        // sempre async — caller faz `await`
  pause(): void;
  resume(): void;
  resetHistory(): void;
  destroy(): void;
  getState(): Readonly<TState>;
}
```

Toda engine implementa esta interface. `start()` async resolve a divergência atual (Memory Cards passa a `await initAudio()` antes de iniciar).

### `GameMeta` em `src/lib/game-engine.ts`

```ts
export interface GameMeta {
  id: string;
  title: string;            // exibido como nome principal do card na home
  subtitle: string;         // chamada curta abaixo do título
  description: string;      // texto longo (tooltip / detalhes)
  category: string;         // agrupamento na home (ex: "Memória", "Lógica")
  image: string;            // path para imagem/cover do jogo (ex: /games/memory-lights/cover.webp)
  icon?: string;            // emoji opcional, fallback quando image não carrega
  route: string;
  ageRange: [number, number];
  difficulty: 'progressivo' | 'fácil' | 'médio' | 'difícil';
  color: string;            // cor de destaque (gradients, badges)
  enabled: boolean;
  backgroundMusic?: string;
  backgroundVolume?: number;
}
```

`src/config/games.json` deixa de ser fonte primária. Vira um arquivo gerado (ou substituído por `src/games/registry.ts`) que importa o `meta` de cada `src/games/<id>/meta.ts` e exporta a lista. Dessa forma é impossível adicionar um jogo e esquecer de registrá-lo.

### Modo `register` — auto-publicar na home

Cada jogo expõe uma função `register()` em `src/games/<id>/index.ts`:

```ts
// src/games/memory-lights/index.ts
import type { GameRegistration } from '@/lib/game-engine';
import { meta } from './meta';
import { MemoryLightsEngine } from './engine';
import { presentation } from './presentation';
import config from './config.json';

export function register(): GameRegistration {
  return {
    meta,                       // título, subtítulo, categoria, imagem
    config,                     // JSON tipado
    createEngine: (canvas) => new MemoryLightsEngine(config, canvas),
    presentation,               // factory Alpine x-data
  };
}
```

Tipo correspondente:

```ts
export interface GameRegistration<TConfig = unknown, TState = unknown> {
  meta: GameMeta;
  config: TConfig;
  createEngine: (canvas?: HTMLCanvasElement) => GameEngine<TConfig, TState>;
  presentation: () => Record<string, unknown>;
}
```

`src/games/registry.ts` apenas chama `register()` de cada jogo:

```ts
import * as memoryLights from './memory-lights';
import * as memoryCards  from './memory-cards';

export const registry = [memoryLights.register(), memoryCards.register()];
export const games = registry.map(r => r.meta);
```

`src/pages/index.astro` consome `games` para montar a home agrupada por `category`, exibindo:
- `meta.image` como hero do card (com fallback para `meta.icon`)
- `meta.title` em destaque
- `meta.subtitle` como linha secundária
- `meta.category` como header da seção
- `meta.ageRange` e `meta.difficulty` como badges
- `meta.color` para tonalizar o gradient do card

Convenção de assets: `public/games/<id>/cover.webp` (referenciado em `meta.image`). Adicionar imagem é parte do checklist de novo jogo.

### Bus de eventos tipado em `src/lib/events.ts`

```ts
export interface GameEventMap {
  'game:state-change': { gameState: string; score: number; stars: number; round: number };
  'game:correct':      { earned: number; total: number; streak: number };
  'game:wrong':        { reason?: string };
  'game:countdown':    { display: string };
  'game:score-animate':{ earned: number; total: number };
  'game:paused':       Record<string, never>;
  'game:resumed':      Record<string, never>;
  'game:timer-start':  { totalMs: number };
  'game:timer-tick':   { percent: number; remaining: number };
  'game:timer-stop':   Record<string, never>;
  'game:timer-expired':Record<string, never>;
  // eventos custom de jogo entram via module augmentation
}

export function emit<K extends keyof GameEventMap>(name: K, detail: GameEventMap[K]): void;
export function on<K extends keyof GameEventMap>(name: K, h: (d: GameEventMap[K]) => void): () => void;
```

Prefixo único `game:*` para o que é comum aos jogos. Eventos exclusivos de um jogo (ex: `lights:light-on`, `cards:card-flip`) ficam declarados no `events.ts` do próprio jogo via `declare module '@/lib/events' { interface GameEventMap { ... } }` — ganhamos tipagem sem central que precisa conhecer cada jogo.

### `createGamePresentation` em `src/lib/presentation.ts`

Factory que devolve um `x-data` Alpine base com tudo que TODO jogo precisa (score, stars, round, pause, message banner, character mood, timeout, fly-points). Cada jogo estende com seu estado próprio.

```ts
export function createGamePresentation<TEngine extends GameEngine>(opts: {
  buildEngine: (canvas: HTMLCanvasElement) => TEngine;
}) {
  return () => ({
    engine: null as TEngine | null,
    score: 0, stars: 1, round: 0,
    isPaused: false, showStartButton: true, showTimeout: false,
    message: '', messageType: '', bgFlash: '',
    init() { /* listeners base + new engine */ },
    startGame()  { /* ... */ },
    togglePause(){ /* ... */ },
    resumeGame() { /* ... */ },
    resetHistory(){ /* confirm + engine.resetHistory */ },
    destroy()    { /* ... */ },
  });
}
```

## Camada compartilhada — `GameShell.astro`

Componente que absorve toda a UI duplicada hoje entre `luzes.astro` e `memoria.astro`:

```astro
<GameShell gameId="memory-lights">
  <Fragment slot="topbar-extra">…</Fragment>
  <!-- conteúdo do jogo (botões/cartas) entra no slot default -->
  <div class="grid …">…</div>
  <Fragment slot="overlays">…</Fragment>  <!-- overlays opcionais -->
</GameShell>
```

`GameShell` cuida de: `<Confetti />`, top bar com pause + score, bottom stars bar, character stage, pause menu (Continuar / Resetar histórico / Sair), timeout overlay, start button, ambient/flash background, fly-points animation, listener de `pendingBgMusic`. Reduz cada `page.astro` a ~50 linhas.

## Persistência centralizada

Remover as funções `loadPersistedState`/`savePersistedState` duplicadas das duas engines. Estender `src/lib/storage.ts`:

```ts
export function loadGameState<T>(gameId: string, fallback: T): T;
export function saveGameState<T>(gameId: string, state: T): void;
export function clearGameState(gameId: string): void;
```

Mantém o prefixo atual `memory-game-<id>-state` para não invalidar progresso já salvo dos usuários.

## Decoupling de `src/lib/scoring.ts`

Hoje `scoring.ts` importa `ScoringConfig`/`StarLevel` de `@/games/memory-lights/types`. Inverter:
- `ScoringConfig` e `StarLevel` passam a viver em `src/lib/scoring.ts` (ou `src/types/scoring.ts`).
- Cada `src/games/<id>/config.ts` re-exporta esses tipos no shape do seu config.

## Registro automático de jogos

Já detalhado na seção "Modo `register`" acima. Resumo: cada jogo exporta `register()` retornando `{ meta, config, createEngine, presentation }`; `src/games/registry.ts` agrega as chamadas; `src/pages/index.astro` lê os `meta.*` (title, subtitle, category, image) para montar a home. TypeScript falha o build se um jogo esquecer de exportar `register` ou de prover qualquer campo de `GameMeta`.

## Template para novo jogo

Criar `templates/new-game/` espelhando a estrutura padronizada com placeholders `__GAME_ID__`. Documentar em `AGENTS.md` o fluxo:

```
1. cp -r templates/new-game src/games/<id>
2. Renomear arquivos e procurar __GAME_ID__
3. Preencher meta.ts (title, subtitle, category, image, ...) e config.json
4. Adicionar imagem em public/games/<id>/cover.webp
5. Implementar engine.ts (state machine)
6. Garantir que index.ts exporta register()
7. Adicionar a linha no src/games/registry.ts
8. Criar src/pages/jogos/<rota>.astro re-exportando o page.astro do jogo
```

Opcional fase futura: script `scripts/new-game.ts` que faz steps 1-2 + 5 automaticamente recebendo o id como argumento.

## Migração — fases

### Fase 0 — Pré-trabalho (sem mudança de comportamento)
- Mover `ScoringConfig`/`StarLevel` para `src/lib/scoring.ts` e ajustar imports.
- Adicionar `loadGameState`/`saveGameState` em `src/lib/storage.ts` e usar nas duas engines (remover duplicação local).
- Criar `src/lib/game-engine.ts` com a `interface GameEngine` + `GameMeta`.
- Criar `src/lib/events.ts` com helpers tipados (mas ainda não migrar prefixos — coexistem).

### Fase 1 — `GameShell.astro`
- Extrair scaffolding compartilhado das duas páginas para `src/components/ui/GameShell.astro`.
- Migrar `luzes.astro` para usar `GameShell` (mantendo `ml:*` events por enquanto).
- Migrar `memoria.astro` idem.
- Resultado esperado: cada página perde ~250 linhas de markup duplicado.

### Fase 2 — Co-localização e padronização do Memory Lights
- Mover `src/config/memory-lights.json` → `src/games/memory-lights/config.json`.
- Quebrar `engine.ts` em `engine.ts` + `state.ts` (tipos de estado interno) + `events.ts` (typed events do jogo).
- Criar `src/games/memory-lights/presentation.ts` com a `Alpine.data('memoryLights', …)` que hoje vive na página.
- Criar `src/games/memory-lights/index.ts` exportando `{ meta, Engine, presentation }`.
- Criar `src/games/memory-lights/page.astro`; `src/pages/jogos/luzes.astro` vira um wrapper de 3 linhas.
- Aplicar `interface GameEngine` na `MemoryLightsEngine`.

### Fase 3 — Mesma migração para Memory Cards
- Espelhar tudo para `memory-cards`. Aproveitar para mover componentes da carta (markup hoje inline na page) para `src/games/memory-cards/components/MemoryCard.astro`.

### Fase 4 — Registry + remoção de `games.json`
- Criar `src/games/registry.ts` consumindo `meta` de cada jogo.
- `src/pages/index.astro` passa a importar de `registry.ts`.
- Deletar `src/config/games.json`.

### Fase 5 — Normalização de eventos (opcional, pode ficar para depois)
- Renomear `ml:*` / `mc:*` → `game:*` para os eventos comuns.
- Eventos exclusivos viram `lights:*` / `cards:*` declarados via module augmentation.
- Atualizar `GameShell` para escutar `game:*`.

### Fase 6 — Template + documentação
- Criar `templates/new-game/` com a estrutura padrão.
- Atualizar `AGENTS.md` com o fluxo "como adicionar um jogo".
- Atualizar `plans/architecture.md` para refletir nova organização.

## Critérios de pronto

Ao final da fase 4, devem ser verdade:
- [ ] Cada jogo vive 100% em `src/games/<id>/` (config, código, página, componentes).
- [ ] Adicionar um novo jogo NÃO exige editar `src/components/ui/` nem `src/pages/jogos/` (além do wrapper de 3 linhas).
- [ ] `src/pages/jogos/luzes.astro` e `memoria.astro` têm < 20 linhas cada.
- [ ] Toda engine implementa `GameEngine`.
- [ ] Sem código de UI ou persistência duplicado entre as duas engines.
- [ ] `src/config/` contém apenas `app.json` (config global do app).
- [ ] `src/lib/scoring.ts` não importa de `src/games/`.

## Riscos e mitigações

- **Quebrar progresso salvo dos usuários** → manter exatamente o mesmo prefixo de chave do localStorage (`memory-game-<id>-state`).
- **Regressão visual** → migrar um jogo de cada vez; smoke test manual após cada fase (countdown, sequência, acerto, erro, timeout, pause, reset).
- **GameShell virar uma "god component"** → restringir slots a `default` + `topbar-extra` + `overlays`; se um jogo precisa de algo radicalmente diferente, ele NÃO usa o shell — não forçar.
- **Acoplamento via events globais piorar com mais jogos** → o tipo `GameEventMap` com module augmentation por jogo evita colisões e dá autocomplete; revisar se aparecem >50 eventos.

## Fora de escopo

- Reescrever Tone.js / áudio.
- Mudar stack (Astro/Alpine continuam).
- Editor visual de configs.
- Sistema de plugins/jogos externos.
