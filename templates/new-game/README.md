# Template — Novo Jogo

## Como usar

```bash
# 1. Copie a pasta com o id do novo jogo
cp -r templates/new-game src/games/<game-id>

# 2. Substitua os placeholders __GAME_ID__ pelo id real
#    (em todos os arquivos da pasta)
grep -rl '__GAME_ID__' src/games/<game-id> | xargs sed -i '' 's/__GAME_ID__/<game-id>/g'

# 3. Preencha meta.ts (title, subtitle, category, image, color, route)

# 4. Adicione a imagem cover em public/games/<game-id>/cover.webp
mkdir -p public/games/<game-id>

# 5. Implemente a engine.ts (state machine real do jogo)

# 6. Registre no src/games/registry.ts:
#    import * as <gameId> from './<game-id>';
#    registrations.push(<gameId>.register() as GameRegistration);

# 7. Crie o arquivo de rota:
mv src/games/<game-id>/page.astro src/pages/games/<route>.astro
# ou mantenha em src/games/<game-id>/page.astro e crie um wrapper de 1 linha em src/pages/games/
```

## Arquivos do template

| Arquivo | Função |
|---------|--------|
| `meta.ts` | `GameMeta` exibido no card da home (title, subtitle, image, ...) |
| `config.json` | Parâmetros do jogo (scoring, stars, dificuldade) |
| `types.ts` | Tipos do config + estado interno |
| `engine.ts` | Implementa `GameEngine` (state machine, lógica de negócio) |
| `presentation.ts` | Factory do `Alpine.data()` que faz a ponte engine ↔ DOM |
| `index.ts` | Exporta `register()` para o registry |
| `page.astro` | Markup da página do jogo |

## Convenções

- Eventos do jogo usam prefixo `<gameId>:*` (ex: `memory-sequence:state-change`).
- localStorage é gerenciado por `loadGameState`/`saveGameState`/`clearGameState` do `@/lib/storage`.
- Pontuação e estrelas vêm de `@/lib/scoring`.
- Imagens em `public/games/<id>/`. Se faltar, a home cai no `meta.icon`.
