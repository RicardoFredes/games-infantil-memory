# Plano — Jogo "Meu Amigo" (`my-friend`)

## Objetivo

Criar um novo jogo padronizado em `src/games/my-friend/` (segue o template existente) onde a criança:

1. **Troca a cor** do personagem (paletas pré-existentes em `@/lib/character-palettes`).
2. **Interage por gestos**: cada gesto produz uma reação emocional (mood + ação) no personagem.

Não há pontuação nem objetivo "de vencer" — é um modo livre / de afeto. O jogo ensina causa-e-efeito (toco aqui → ele reage assim) e reforça os moods já implementados.

## Conceito

- Tela única, fullscreen, personagem grande no centro.
- Barra/anel inferior com **swatches de cor** (uma bolinha por paleta).
- Personagem ocupa 60-70% da tela e é a única "hit area" interativa.
- Sem timer, sem rounds, sem "game over", sem pontuação — sai pelo botão de pause/sair.

## Mapeamento gesto → reação

Cada interação combina:
- Uma **zona de hit** no SVG (cabeça, barriga, braços, pernas)
- Um **tipo de gesto** (tap, swipe, hold, etc.)
- Uma **reação** (mood do personagem + opcionalmente ação como `jump`/`shake`/`giggle`)

### Vocabulário inicial (MVP)

| Zona | Gesto | Reação | Mood resultante |
|---|---|---|---|
| Cabeça | swipe lento (pan) | acariciar → "ronronar" | `happy` (1.5s) |
| Cabeça/corpo | tap forte (alta velocidade) | tomar tapa → encolher | `sad` (2s) + shake animation |
| Barriga | swipe rápido alternado (zigzag) | cócegas | `excited`/laughing (2s) + bounce |
| Olho | tap | piscar / desviar | `surprised` (1s) |
| Boca | tap | abrir boca | `idle` + mouth-open pose |
| Corpo | press longo (>800ms) | abraço → calmar | `calm`/`happy` (3s) |
| Pés | tap | cócega no pé → pulinho | `excited` + jump |
| Qualquer | duplo-tap rápido | cumprimento | acena com braço |

### Critérios para classificar gestos

- **Tap**: pointerdown→up < 200ms, deslocamento < 8px.
- **Tap forte ("slap")**: tap mas com velocidade pico de pointerdown > X (estimar via primeira amostra de pressure se disponível, OU velocidade do swipe imediatamente anterior >800px/s).
- **Pan/swipe lento ("acariciar")**: pointerdown sustentado, velocidade média 50-300px/s, distância > 30px.
- **Swipe rápido ("cócegas/tapa")**: velocidade média > 800px/s.
- **Zigzag (cócegas)**: 2+ inversões de direção em < 500ms dentro da mesma zona.
- **Press longo**: pointerdown sem release por > 800ms, deslocamento < 12px.
- **Duplo-tap**: dois taps em < 350ms, mesma zona.

### Hit-zones no SVG

O `<GameCharacter />` já tem grupos identificáveis. Adicionar `data-zone` em cada parte:

```
data-zone="head"     // o círculo da cabeça
data-zone="eye-l"    // olho esquerdo
data-zone="eye-r"    // olho direito
data-zone="mouth"    // path da boca
data-zone="body"     // barriga (área dentro do círculo abaixo do queixo)
data-zone="arm-l"    // braço esquerdo
data-zone="arm-r"    // braço direito
data-zone="leg-l"    // perna esquerda
data-zone="leg-r"    // perna direita
data-zone="foot-l"
data-zone="foot-r"
```

O detector de gestos faz `evt.target.closest('[data-zone]')` para resolver a zona. Para áreas overlapping (ex: braço sobre cabeça), z-order do SVG já decide.

## Stack de gestos

**Decidido: `@use-gesture/vanilla`** (~6kb gz, mantida pela Poimandres).

Por quê:
- API estável (`new Gesture(target, handlers, opts)`) com velocity/distance/direction prontos — não reinventa a roda.
- Suporte first-class a Pointer Events; multi-touch nativo (necessário pra cócegas com 2 dedos).
- Não acopla a framework — funciona em vanilla TS dentro de Astro/Alpine sem ginástica.

```bash
npm i @use-gesture/vanilla
```

Padrão de uso:

```ts
import { Gesture } from '@use-gesture/vanilla';

const target = document.querySelector('#character-svg')!;
new Gesture(target, {
  onDrag: ({ first, last, velocity, distance, xy, event }) => { /* stroke/slap/tickle */ },
  onPointerDown: (state) => { /* início → timestamp pra long-press */ },
  onPointerUp:   (state) => { /* tap, doubleTap, longPress final */ },
}, { drag: { filterTaps: true, threshold: 4 } });
```

Encapsulamos os callbacks da lib em `gestures/recognizer.ts`, que produz o nosso `GestureEvent` semântico (`{ kind: 'tap'|'slap'|'stroke'|'tickle'|'longPress'|'doubleTap', zone, velocity, ... }`). A engine **não importa @use-gesture diretamente** — fica desacoplada e trocável.

### Alternativas consideradas (descartadas)

| Lib | Motivo |
|---|---|
| Pointer Events puro | Funcionaria, mas obriga implementar velocity/multi-touch tracking à mão; @use-gesture entrega isso por ~6kb. |
| Hammer.js | Sem release desde 2017. |
| interact.js | ~30kb, foco drag/drop/resize, overkill. |
| ZingTouch | Estagnada, pouco adotada. |
| MediaPipe Hands / HandsFree.js | Exige câmera, péssimo pra crianças sem supervisão. |

## Estrutura do jogo (segue o template padrão)

```
src/games/my-friend/
├── index.ts              # register()
├── meta.ts               # GameMeta { id: 'my-friend', title: 'Meu Amigo', ... }
├── config.json           # paletas habilitadas, mapping gesto→mood, durações
├── config.ts             # tipos do config
├── engine.ts             # GameEngine — orquestra mood + paleta + cooldowns
├── presentation.ts       # Alpine x-data — listeners de gesto, swatches
├── gestures/
│   ├── recognizer.ts     # adapta callbacks do @use-gesture/vanilla → GestureEvent
│   ├── types.ts          # GestureKind, GestureEvent
│   └── thresholds.ts     # constantes derivadas do config (velocidade, distância)
└── components/
    ├── ColorPalette.astro    # swatches (uma bola por paleta)
    └── GestureHint.astro     # tooltip "Tente acariciar a cabeça!" (opcional)
```

E `src/pages/games/my-friend.astro` — página da rota `/games/my-friend`.

## Engine — fluxo

```
Pointer events → GestureRecognizer → GestureEvent { kind, zone, velocity, ... }
                                  ↓
                            CharacterPlayEngine.handleGesture()
                                  ↓
                          decide reação:
                            - emit('character:set-mood', { mood, duration })
                            - emit('character:action', { action: 'jump'|'shake'|'wave' })
                            - opcional: emit('my-friend:reaction', { kind, zone })
                                  ↓
                            cooldown anti-spam (ignora gestos do mesmo tipo
                            por N ms — evita criança ficar batendo sem parar)
```

A engine NÃO renderiza nada — usa o `<GameCharacter>` que já existe e dispara os eventos `character:*` que o composer/cycles consomem.

Mudança de cor: paleta vem como prop do `<GameCharacter palette={current} />` mas hoje é estática. Precisa ser **reativa** — passar a paleta via Alpine `:class` ou via custom event `character:set-palette` que o composer escuta e troca os gradients.

## Configuração (config.json)

```json
{
  "meta": { "id": "my-friend", "name": "Meu Amigo", "version": "1.0.0", "ageRange": [2, 7] },
  "palettes": ["purple", "pink", "green", "blue", "yellow", "orange"],
  "defaultPalette": "purple",
  "gestures": {
    "stroke":   { "minDistance": 30, "maxVelocity": 300, "cooldownMs": 600 },
    "slap":     { "minVelocity": 800, "maxDuration": 200, "cooldownMs": 1500 },
    "tickle":   { "minDirChanges": 2, "windowMs": 500, "cooldownMs": 800 },
    "longPress":{ "minDurationMs": 800, "maxDistance": 12, "cooldownMs": 1000 },
    "doubleTap":{ "maxIntervalMs": 350, "cooldownMs": 800 }
  },
  "reactions": {
    "head:stroke":     { "mood": "happy",     "moodDuration": 1500 },
    "head:slap":       { "mood": "sad",       "moodDuration": 2000, "action": "shake" },
    "body:tickle":     { "mood": "excited",   "moodDuration": 2000, "action": "bounce" },
    "body:longPress":  { "mood": "calm",      "moodDuration": 3000 },
    "eye-l:tap":       { "mood": "surprised", "moodDuration": 800 },
    "eye-r:tap":       { "mood": "surprised", "moodDuration": 800 },
    "foot-l:tap":      { "mood": "excited",   "moodDuration": 1000, "action": "jump" },
    "foot-r:tap":      { "mood": "excited",   "moodDuration": 1000, "action": "jump" },
    "*:doubleTap":     { "mood": "happy",     "moodDuration": 1500, "action": "wave" }
  }
}
```

Tudo em JSON: tunar comportamento sem mexer em código.

## Acessibilidade / safe defaults

- **Cooldown** em todos os gestos pra evitar epilepsia visual / criança espancando o personagem.
- "Slap" de propósito não tem reação muito negativa — personagem fica triste por 2s e volta. Sem efeito sonoro de soco. (A mensagem implícita é "isso machuca o amigo" sem ser chocante.)
- Considerar um **modo gentil** opcional no config (`behavior.disableSlap: true`) que reinterpreta tap forte como "susto" leve em vez de "tapa" — pra crianças mais sensíveis ou se pais preferirem.

## UI da paleta

- 6-8 swatches em um anel/linha na parte inferior (acima da safe-area).
- Cada swatch é um círculo com `background: linear-gradient(skinTop, skinBottom)` — preview real da pele.
- Selecionar dispara `character:set-palette` + persiste em localStorage (`memory-game-my-friend-state` → `{ palette: 'pink' }`).
- Animação: swatch ativo cresce (`scale-110`) + um anel ao redor.

## Persistência

- Apenas a última paleta escolhida (`memory-game-my-friend-state` → `{ palette: 'pink' }`).
- Sem contadores, sem progresso, sem missões.

## Fases de implementação

### Fase 0 — Pré-trabalho
- `npm i @use-gesture/vanilla`.
- Adicionar paletas `yellow`, `orange`, `red` em `src/lib/character-palettes.ts` (faltam hoje; jogo precisa de 6-8).
- Confirmar que `<GameCharacter>` aceita props para suportar tamanho grande (60-70% da tela).

### Fase 1 — Skeleton
- Copiar `templates/new-game/` para `src/games/my-friend/`.
- Adicionar imagem cover em `public/games/my-friend/cover.webp`.
- Registrar no `src/games/registry.ts`.
- Engine vazia com mood fixo, página renderiza personagem grande no centro + paleta.

### Fase 2 — Troca de cor
- Componente `ColorPalette.astro` (swatches).
- Adicionar suporte a paleta reativa no `<GameCharacter>`:
  - Hoje paleta vem via prop SSR. Mudar para também escutar `character:set-palette` em runtime e atualizar os `fill` dos gradients (provavelmente via Alpine state ou `setAttribute`).
- Persistir paleta selecionada.

### Fase 3 — Hit-zones
- Adicionar `data-zone="..."` em cada `<g>`/`<circle>`/`<path>` relevante do SVG no `GameCharacter.astro`.
- Verificar pointer-events: as partes precisam ter `pointer-events: auto` (algumas talvez estejam `none` hoje).

### Fase 4 — Reconhecedor de gestos (MVP completo)
- `gestures/recognizer.ts` envolvendo `new Gesture(svgEl, ...)` do @use-gesture/vanilla.
- Reconhece **tap, slap, stroke, longPress, doubleTap, tickle (zigzag)** — tudo no MVP.
- `tickle`: contar inversões de direção dentro da janela `windowMs` no callback `onDrag`.
- Emite `GestureEvent` para a engine.
- Validar manualmente em mobile real.

### Fase 5 — Reações
- Engine consome `GestureEvent`, mapeia via `config.reactions[zone+kind]` → mood/action.
- Cooldown por tipo.
- Smoke test de cada combinação.

### Fase 6 — Polimento
- Som por reação (giggle, "ai!", suspiro feliz).
- Pequena animação de "coração" subindo da cabeça quando acariciado.
- Hint inicial ("Tente acariciar a cabeça!") que some após primeira interação descoberta.

## Riscos

- **Hit-test impreciso em SVGs com bordas complexas** → começar com bounding boxes amplos por zona; refinar só se necessário.
- **Cores não recarregando em runtime** → o `<GameCharacter>` usa `url(#skinGrad-${palette})` em IDs únicos por paleta; trocar paleta exige re-render dos `<defs>` correspondentes ou reescrever os IDs. Avaliar custo.
- **Falsos positivos de "slap"** quando criança só toca rápido → ajustar thresholds em testes reais; oferecer modo gentil.
- **Paletas adicionais** — hoje há 4 (purple, pink, green, blue). Adicionar yellow/orange/red em `character-palettes.ts` na Fase 0.

## Fora de escopo

- Gestos com câmera / hand tracking.
- Multi-character.
- Vestir/acessórios (chapéu, óculos, etc.) — pode ser jogo separado depois.
- Multiplayer / compartilhar personagem.
- Editor de paleta livre (color picker) — limita-se a presets.

## Decisões consolidadas

- **Nome do jogo:** `my-friend` (id, pasta, rota `/games/my-friend`).
- **Paletas:** 7 — purple, pink, green, blue + **yellow, orange, red** (adicionar em Fase 0).
- **Vocabulário no MVP:** tap, slap, stroke, longPress, doubleTap, **tickle** (todos).
- **Lib de gestos:** `@use-gesture/vanilla` (~6kb).
- **Sem persistência além da paleta.**
