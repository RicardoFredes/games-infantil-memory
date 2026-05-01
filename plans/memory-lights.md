# Especificação — Jogo das Luzes (Simon Diz)

## Objetivo

A criança vê uma sequência de luzes coloridas acenderem (com som musical), e deve repeti-la tocando nos botões na mesma ordem. A dificuldade aumenta progressivamente.

## Estados do Jogo

```
IDLE → SHOWING_SEQUENCE → WAITING_INPUT → CHECKING →
  ├─ CORRECT → CELEBRATING → COUNTDOWN → SHOWING_SEQUENCE (próxima rodada)
  └─ WRONG → SHOWING_SEQUENCE (repete a mesma sequência, sem punição)
```

## Regras de Dificuldade Progressiva

| Rodada | Passos na sequência | Tempo por luz (ms) | Intervalo entre luzes (ms) |
| ------ | ------------------- | ------------------ | -------------------------- |
| 1-3    | 3                   | 800                | 400                        |
| 4-6    | 4                   | 700                | 350                        |
| 7-9    | 5                   | 600                | 300                        |
| 10-12  | 6                   | 500                | 250                        |
| 13-15  | 7                   | 450                | 220                        |
| 16+    | 8+ (cap at 10)      | 400                | 200                        |

Faixa etária 2-7 anos: a progressão é lenta e gentil. Nunca reduz o tempo abaixo de 200ms.

## Erros (compatível com 2-7 anos)

- Nunca mostra "game over" ou X vermelho
- Ao errar: botões piscam suavemente juntos (feedback visual gentil)
- A mesma sequência é repetida (a criança tem outra chance)
- Após 3 erros na mesma rodada: reduz 1 passo na sequência e continua
- NUNCA volta ao início ou zera progresso

## Sistema de Pontuação

- +10 pontos por acerto
- +5 bônus por acerto acima de 3 passos
- +15 bônus por streak (3+ acertos consecutivos)
- Máximo 999 pontos visíveis (evita overflow no layout)
- Estrelas visuais:
  - 1 estrela: 0-49 pts
  - 2 estrelas: 50-99 pts
  - 3 estrelas: 100-199 pts
  - 4 estrelas: 200-399 pts
  - 5 estrelas: 400+ pts

## As 4 Luzes

Cada luz é um botão circular grande (~80px diâmetro, mínimo 64px de touch target), disposto em grid 2x2 centralizado na tela.

| Posição  | Cor             | Nota Musical (freq) | Emoji decorativo |
| -------- | --------------- | ------------------- | ----------------- |
| Topo-Esq | 🔴 Vermelho     | C5 (523 Hz)         | ⭐                |
| Topo-Dir | 🔵 Azul         | E5 (659 Hz)         | 🌙                |
| Base-Esq | 🟡 Amarelo      | G5 (784 Hz)         | ☀️                |
| Base-Dir | 🟢 Verde        | C6 (1047 Hz)        | 🌈                |

Cores adaptadas para daltônicos: cada botão também tem um ícone/emoji visível e som distinto.

## Animações e Feedback

### Luz acendendo (durante SHOWING_SEQUENCE)
- Botão expande com `scale(1.2)` + glow colorido + timbre de xilofone (Tone.js PluckSynth)
- Duração configurável via `memory-lights.json`

### Toque do jogador (durante WAITING_INPUT)
- Botão pressiona com `scale(0.9)` + ripple effect
- Timbre da nota toca imediatamente (Tone.js)
- Feedback tátil se disponível (navigator.vibrate)

### Acerto (CHECKING → CORRECT)
- Todos os 4 botões acendem juntos por 300ms
- Confetes coloridos (canvas overlay) por 2 segundos
- Som festivo de vitória (Tone.js: arpejo ascendente C5→E5→G5→C6)
- Efeito de confete sonoro (ZzFX)
- ScoreBoard anima incremento + estrelas cintilam
- Texto "Muito bem! 🎉" aparece com animação de bounce

### Erro (CHECKING → WRONG)
- Botões piscam suavemente (50% opacidade, 2x)
- Som de erro suave (ZzFX: duas notas descendentes)
- Texto "Tente de novo! Você consegue! 💪"
- Sem confetes, sem punição visual

### Countdown (entre rodadas)
- Números 3, 2, 1 grandes no centro com animação Lordicon
- Cada número com animação de scale
- Som de "pop" em cada número (ZzFX)
- Duração total: 3 segundos

## Síntese de Áudio (Tone.js + ZzFX)

Nada de arquivos de áudio. Tudo sintetizado:

### Tone.js — Sons musicais (gratuito, MIT)

Cada luz usa um **MetalSynth** ou **PluckSynth** do Tone.js com timbre de xilofone/glockenspiel — muito mais infantil e agradável que senoidal puro:
- **PluckSynth** para o som principal das luzes (ataque percussivo tipo "pling" de celesta)
- Envelope rápido (attackNoise 2ms, dampening 4000, resonance 0.7)
- Volume configurável via JSON (default -12 dB, não assusta criança)

Som de vitória (arpejo ascendente):
- **Synth** polifônico do Tone.js
- Arpejo C5 → E5 → G5 → C6 com intervalo de 100ms entre notas
- Release longo (800ms) para soar como sininhos

### ZzFX — Efeitos sonoros (gratuito, MIT, ~1 KB)

- Som de **confete**: ruído estourado curto com frequência alta (som de "tadaa")
- Som de **contagem (3, 2, 1)**: "pop" suave a cada número
- Som de **erro**: duas notas descendentes suaves ("bloop-blop")
- Som de **toque em botão**: "click" cartoon curto

### Integração

```typescript
// src/lib/audio.ts — wrapper Tone.js
import * as Tone from 'tone';

export function createXylophone(frequency: number) {
  const synth = new Tone.PluckSynth().toDestination();
  synth.triggerAttackRelease(frequency, '8n');
}

// src/lib/sfx.ts — wrapper ZzFX
import { zzfx } from 'zzfx';

export function playPop() {
  zzfx(/* parâmetros de sintetização */);
}
```

## Interface (Layout Mobile)

```
┌──────────────────────────────┐
│  ⭐ 2    │  Pontos: 130 🔥   │  ← ScoreBoard (fixo no topo)
├──────────────────────────────┤
│                              │
│    ┌─────────┐ ┌─────────┐   │
│    │   🔴    │ │   🔵    │   │  ← Grid 2x2 de luzes
│    │   ⭐    │ │   🌙    │   │     (centralizado vertical)
│    └─────────┘ └─────────┘   │
│    ┌─────────┐ ┌─────────┐   │
│    │   🟡    │ │   🟢    │   │
│    │   ☀️    │ │   🌈    │   │
│    └─────────┘ └─────────┘   │
│                              │
│        [CONTAGEM: 3]         │  ← Countdown (sobreposto)
│                              │
│     🎉 Muito bem! 🎉         │  ← Mensagem de feedback
│                              │
└──────────────────────────────┘
```

- Fundo: gradiente suave (definido via config)
- Sem scroll — viewport fixa em 100dvh
- Botão "Voltar" sutil no canto superior esquerdo

## Config JSON (`memory-lights.json`)

```json
{
  "meta": {
    "id": "memory-lights",
    "name": "Jogo das Luzes",
    "description": "Memorize a sequência de luzes",
    "version": "1.0.0",
    "ageRange": [2, 7]
  },
  "lights": [
    { "id": "red",   "color": "#FF4444", "glow": "#FF8888", "note": 523,  "emoji": "⭐", "label": "Vermelho" },
    { "id": "blue",  "color": "#4488FF", "glow": "#88BBFF", "note": 659,  "emoji": "🌙", "label": "Azul" },
    { "id": "yellow","color": "#FFCC00", "glow": "#FFEE88", "note": 784,  "emoji": "☀️", "label": "Amarelo" },
    { "id": "green", "color": "#44CC44", "glow": "#88EE88", "note": 1047, "emoji": "🌈", "label": "Verde" }
  ],
  "audio": {
    "instrument": "pluckSynth",
    "volume": -12,
    "victoryArpeggio": [523, 659, 784, 1047],
    "victoryArpeggioGap": 100,
    "sfx": {
      "pop": { "frequency": 800, "length": 0.08 },
      "error": { "frequency": 300, "length": 0.2 },
      "confetti": { "frequency": 1200, "length": 0.15 }
    }
  },
  "difficulty": [
    { "rounds": [1, 3],   "steps": 3,  "lightDuration": 800,  "gapDuration": 400 },
    { "rounds": [4, 6],   "steps": 4,  "lightDuration": 700,  "gapDuration": 350 },
    { "rounds": [7, 9],   "steps": 5,  "lightDuration": 600,  "gapDuration": 300 },
    { "rounds": [10, 12], "steps": 6,  "lightDuration": 500,  "gapDuration": 250 },
    { "rounds": [13, 15], "steps": 7,  "lightDuration": 450,  "gapDuration": 220 },
    { "rounds": [16, 99], "steps": 8,  "lightDuration": 400,  "gapDuration": 200 }
  ],
  "scoring": {
    "basePoints": 10,
    "bonusAboveSteps": 3,
    "bonusAbovePoints": 5,
    "streakThreshold": 3,
    "streakBonus": 15,
    "maxScore": 999
  },
  "stars": [
    { "threshold": 0,   "count": 1 },
    { "threshold": 50,  "count": 2 },
    { "threshold": 100, "count": 3 },
    { "threshold": 200, "count": 4 },
    { "threshold": 400, "count": 5 }
  ],
  "timing": {
    "countdownDuration": 3000,
    "celebrationDuration": 2000,
    "wrongFlashDuration": 400,
    "wrongFlashCount": 2
  },
  "behavior": {
    "maxWrongAttempts": 3,
    "reduceStepsOnFail": true,
    "vibrateOnTouch": true
  },
  "theme": {
    "backgroundGradient": "from-purple-400 via-pink-300 to-yellow-200",
    "fontFamily": "Nunito, sans-serif"
  }
}
```

## Canvas de Confetes

O componente `Confetti.astro` renderiza um `<canvas>` absoluto sobre toda a tela com `pointer-events: none`. Quando ativado:

- Dispara 80-150 partículas de cores sortidas
- Cada partícula: posição, velocidade, rotação, cor, formato (retângulo/círculo/estrela)
- Gravidade suave, leve resistência do ar
- Duração: 2 segundos (fade out no último segundo)
- Ativado via evento customizado: `window.dispatchEvent(new CustomEvent('confetti'))`

## Acessibilidade

- Touch targets ≥ 64px (WCAG 2.5.5)
- Alto contraste entre botões e fundo
- Ícones/emojis + cor + som = 3 canais sensoriais redundantes
- Sem animações rápidas excessivas (respeita `prefers-reduced-motion`)
- Meta viewport correta, sem zoom indesejado
