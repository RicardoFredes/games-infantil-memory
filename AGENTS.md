# AGENTS.md

## Git
- Commits: `type: short message` (conventional commits, no co-authors)
- Small, focused commits — one logical change per commit
- Never commit `node_modules/`, `dist/`, `.astro/`

## Commands
```bash
npm run dev      # dev server at http://localhost:4321
npm run build    # static build to dist/
npm run preview  # preview build
```

## Architecture
- Astro v5 SSG + Alpine.js v3 + Tailwind v4 + daisyUI v5 + Tone.js
- Cada jogo vive em `src/games/<id>/` — `meta`, `config.json`, `engine`, `types`, `presentation`, `index` (export `register()`)
- Audio: `src/lib/audio.ts` (Tone.js Synth + Player), note map: `src/lib/notes.ts`
- Notes use names like "C5", "D5" (not raw Hz) via `noteToFreq()`
- Alpine components: `x-data` registered via `Alpine.data()` before `Alpine.start()`
- Every SFX call creates a fresh synth instance (no caching — avoids Tone.js timing errors)

## Estrutura padrão de um jogo

```
src/games/<id>/
├── index.ts          # export { register, meta, Engine }
├── meta.ts           # GameMeta (title, subtitle, category, image, ...)
├── config.json       # parâmetros do jogo
├── types.ts          # tipos do config + estado
├── engine.ts         # implementa GameEngine
├── presentation.ts   # factory Alpine x-data
└── (components/)     # componentes Astro exclusivos do jogo
```

## Adicionar um novo jogo

```bash
cp -r templates/new-game src/games/<id>
grep -rl '__GAME_ID__' src/games/<id> | xargs sed -i '' 's/__GAME_ID__/<id>/g'
# preencher meta.ts e config.json
# colocar imagem em public/games/<id>/cover.webp
# implementar engine.ts
# registrar em src/games/registry.ts (1 linha)
# criar rota em src/pages/games/<route>.astro
```

A home (`src/pages/index.astro`) lê automaticamente do `src/games/registry.ts` — basta o `register()` retornar `meta` com `title`, `subtitle`, `category` e `image`.

## Key files
| File | Purpose |
|------|---------|
| `src/lib/game-engine.ts` | `GameEngine`, `GameMeta`, `GameRegistration` (contratos) |
| `src/lib/scoring.ts` | Pontuação/estrelas + tipos `ScoringConfig`/`StarLevel`/`ScoreState` |
| `src/lib/storage.ts` | `loadGameState`/`saveGameState`/`clearGameState` |
| `src/lib/audio.ts` | Tone.js wrappers + tipo `NoteStep` |
| `src/lib/events.ts` | Bus de eventos tipado (`game:*`) |
| `src/lib/confetti.ts` | Canvas particle system |
| `src/games/registry.ts` | Lista os jogos (chama `register()` de cada) |
| `src/games/<id>/engine.ts` | State machine do jogo |
| `src/games/<id>/presentation.ts` | Alpine x-data factory |
| `src/pages/games/*.astro` | Páginas das rotas |

## Events (engine → Alpine)
- `memory-lights` usa prefixo `ml:*` (legado) — `ml:state-change`, `ml:correct`, `ml:wrong`, `ml:countdown`, `ml:timer-*`, `ml:all-lights-flash`, `ml:light-on/off/tap`, `ml:btn-color`, `ml:score-animate`, `ml:pause-toggle`, `ml:paused/resumed`.
- `memory-cards` usa prefixo `mc:*` (legado) — `mc:state-change`, `mc:round-start`, `mc:card-open/close/match/mismatch`, `mc:win`, `mc:paused/resumed`.
- Novos jogos devem usar `<gameId>:*` (template já segue isso) ou `game:*` tipado via `@/lib/events`.
