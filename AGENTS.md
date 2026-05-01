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
- All game logic in `src/games/<name>/` — engine, sequencer, types
- All config is JSON in `src/config/` — never hardcode game params
- Audio: `src/lib/audio.ts` (Tone.js Synth + Player), note map: `src/lib/notes.ts`
- Notes use names like "C5", "D5" (not raw Hz) via `noteToFreq()`
- Alpine components: `x-data` registered via `Alpine.data()` before `Alpine.start()`
- Every SFX call creates a fresh synth instance (no caching — avoids Tone.js timing errors)

## Key files
| File | Purpose |
|------|---------|
| `src/config/memory-lights.json` | All game parameters (lights, notes, scoring, difficulty) |
| `src/games/memory-lights/engine.ts` | Game state machine |
| `src/games/memory-lights/sequencer.ts` | Sequence generation + difficulty |
| `src/lib/audio.ts` | Tone.js wrappers (playNote, playSequence, bg music) |
| `src/lib/confetti.ts` | Canvas particle system |
| `src/pages/jogos/luzes.astro` | Game page (Alpine + engine bridge) |
| `src/components/games/LightButton.astro` | Light button component |

## Events (engine → Alpine)
Events dispatched via `window.dispatchEvent(new CustomEvent('ml:<name>', ...))`:
- `ml:state-change` — game state, score, stars, round
- `ml:light-on` / `ml:light-off` — sequence display
- `ml:correct` / `ml:wrong` — answer result
- `ml:countdown` — countdown tick (display: "3"/"2"/"1"/"Vai!")
- `ml:all-lights-flash` — error/success visual feedback
- `ml:score-animate` — trigger score counter animation
