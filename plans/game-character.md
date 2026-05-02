# Plano: Personagem Reativo (SVG + Alpine.js)

## 1. Visão Geral

Adicionar um personagem/mascote feito com formas SVG simples que reage visualmente ao que acontece no jogo. O personagem aparece na tela do Memory Lights e muda de expressão conforme eventos do jogo (acertos, erros, contagem, vitória).

**Stack:** SVG inline + Alpine.js (já no projeto) + CSS transitions/keyframes.  
**Sem dependências novas** — o projeto já tem tudo necessário.

---

## 2. Estrutura do SVG (Formas Simples)

```
Cabeça:   <circle>      — fundo do rosto, cor de pele definida por corHex
Olhos:    <circle> ×2   — pupilas, escala controla "aberto/fechado"
Nariz:    <polygon>     — triângulo central
Sobrancelhas: <rect> ×2 — rotação e posição Y controlam expressão
Boca:     <path>        — bezier curves, o atributo `d` define o formato
```

**Todas as cores são aplicadas via atributos `fill`**, permitindo customização por tema (ex: tom de pele, cor dos olhos).

---

## 3. Estados de Expressão (Moods)

| Mood    | Olhos | Sobrancelhas | Boca | Gatilho |
|---------|-------|-------------|------|---------|
| **idle** | Círculos normais, leve blink intermitente | Retas horizontais | Linha reta ou leve sorriso | Estado inicial, pausa |
| **happy** | Levemente fechados (scaleY 0.3) + brilho | Levantadas (translateY -4) | Arco para cima (smile) | `ml:correct` |
| **sad** | Pupilas menores, "lágrima" opcional | Inclinadas para dentro (rotate -15°/+15°) | Arco para baixo (frown) | `ml:wrong` |
| **tired** | Semicerrados (rect cobrindo metade superior) | Caídas (rotate leve para baixo) | Pequeno oval aberto | Timer expirando, muitas rodadas |
| **excited** | Bem abertos (scale 1.2) + estrelas nos olhos | Levantadas ao máximo | Grande sorriso aberto | Vitória, celebração |
| **thinking** | Um olho maior que o outro, olhando para cima | Uma levantada, uma normal | Boca torta (linha diagonal) | Durante SHOWING_SEQUENCE |
| **surprised** | Bem abertos (scale 1.3) | Levantadas | Boca oval grande (O) | `ml:all-lights-flash` |

Cada estado é definido como um objeto com propriedades SVG a serem aplicadas:

```ts
type Mood = 'idle' | 'happy' | 'sad' | 'tired' | 'excited' | 'thinking' | 'surprised'

interface ExpressionConfig {
  eyes: { scaleX: number; scaleY: number; pupilSize: number }
  eyebrows: { leftAngle: number; rightAngle: number; translateY: number }
  mouth: string  // SVG path d attribute
  cheeks?: { opacity: number }  // blush circles (happy/excited)
  tears?: { opacity: number }   // tear drops (sad)
}
```

---

## 4. Componente: `src/components/games/GameCharacter.astro`

Arquivo Astro que renderiza o SVG inline com bindings Alpine:

```astro
<div
  x-data="gameCharacter"
  x-init="init()"
  class="game-character-container"
>
  <svg viewBox="0 0 200 200" class="character-svg">
    <!-- Cabeça -->
    <circle cx="100" cy="100" r="80" :fill="skinColor" />

    <!-- Sobrancelhas -->
    <rect x="55" y="58" width="30" height="6" rx="3"
      :transform="eyebrowLeftTransform" fill="#333" />
    <rect x="115" y="58" width="30" height="6" rx="3"
      :transform="eyebrowRightTransform" fill="#333" />

    <!-- Olhos -->
    <circle cx="70" cy="85" r="12" fill="white" />
    <circle cx="70" cy="85" :r="pupilSize" fill="#333"
      :transform="eyeLeftTransform" />
    <circle cx="130" cy="85" r="12" fill="white" />
    <circle cx="130" cy="85" :r="pupilSize" fill="#333"
      :transform="eyeRightTransform" />

    <!-- Nariz -->
    <polygon points="100,95 110,110 90,110" :fill="noseColor" />

    <!-- Boca -->
    <path :d="mouthPath" fill="none" stroke="#333" stroke-width="3"
      stroke-linecap="round" />

    <!-- Bochechas (blush) -->
    <circle cx="45" cy="110" r="12" fill="#FF9999"
      :opacity="blushOpacity" />
    <circle cx="155" cy="110" r="12" fill="#FF9999"
      :opacity="blushOpacity" />

    <!-- Lágrimas -->
    <path d="M55,98 Q58,108 55,115 Q52,108 55,98Z" fill="#66CCFF"
      :opacity="tearOpacity" />
  </svg>
</div>
```

O SVG usa bindings Alpine (`:fill`, `:transform`, `:d`, `:opacity`) para reatividade.  
CSS transitions no elemento SVG garantem animações suaves entre estados:

```css
.character-svg circle,
.character-svg rect,
.character-svg path,
.character-svg polygon {
  transition: all 0.3s ease;
}
```

---

## 5. Alpine Data: `gameCharacter`

Registrado no `<script>` da página `luzes.astro` (antes de `Alpine.start()`):

```js
document.addEventListener('alpine:init', () => {
  Alpine.data('gameCharacter', () => ({
    mood: 'idle',
    skinColor: '#FFD93D',
    noseColor: '#F4A460',

    // Estados computados reativos
    get pupilSize() { /* ... conforme mood */ },
    get mouthPath() { /* ... conforme mood */ },
    get eyeLeftTransform() { /* ... conforme mood */ },
    get eyeRightTransform() { /* ... conforme mood */ },
    get eyebrowLeftTransform() { /* ... conforme mood */ },
    get eyebrowRightTransform() { /* ... conforme mood */ },
    get blushOpacity() { return ['happy', 'excited'].includes(this.mood) ? 0.5 : 0 },
    get tearOpacity() { return this.mood === 'sad' ? 1 : 0 },

    setMood(newMood, duration = 3000) {
      this.mood = newMood
      if (duration > 0) {
        clearTimeout(this._moodTimer)
        this._moodTimer = setTimeout(() => { this.mood = 'idle' }, duration)
      }
    },

    // Idle animation loop (blink + subtle float)
    init() {
      this._blinkInterval = setInterval(() => {
        // Blink rápido (150ms)
        this.mood = 'blink'
        setTimeout(() => { if (this.mood === 'blink') this.mood = 'idle' }, 150)
      }, 3000 + Math.random() * 2000)

      // Listen to game events
      window.addEventListener('ml:correct', () => this.setMood('happy', 2000))
      window.addEventListener('ml:wrong', () => this.setMood('sad', 2500))
      window.addEventListener('ml:all-lights-flash', (e) => {
        this.setMood(e.detail.color === '#44FF44' ? 'excited' : 'surprised', 1500)
      })
      window.addEventListener('ml:light-on', () => {
        if (this.mood === 'idle') this.mood = 'thinking'
      })
      window.addEventListener('ml:light-off', () => {
        if (this.mood === 'thinking') this.mood = 'idle'
      })
      window.addEventListener('ml:timer-expired', () => this.setMood('tired', 3000))
      // ... etc
    }
  }))
})
```

---

## 6. Integração com Eventos do Jogo

Mapeamento completo eventos → expressão:

| Evento do Engine | Expressão | Duração | Comportamento Extra |
|---|---|---|---|
| `ml:correct` | `happy` | 2s | Bochechas visíveis, olhos brilham |
| `ml:wrong` | `sad` | 2.5s | Lágrimas visíveis |
| `ml:all-lights-flash` (green) | `excited` | 1.5s | Olhos com estrelas, pulo |
| `ml:all-lights-flash` (red) | `surprised` | 1.5s | Boca "O", sobrancelhas no topo |
| `ml:light-on` (sequência) | `thinking` | até `light-off` | Olho torto, segue a luz |
| `ml:light-off` | `idle` | — | Volta ao neutro |
| `ml:countdown` ("3") | `excited` | 800ms | Antecipação |
| `ml:countdown` ("2") | `thinking` | 800ms | Concentração |
| `ml:countdown` ("1") | `surprised` | 800ms | Preparação |
| `ml:countdown` ("Vai!") | `happy` | 1s | Animado! |
| `ml:timer-expired` | `tired` | 3s | Cansado, olhos caídos |
| `ml:paused` | `idle` (sleep?) | até resume | Opcional: zZz |
| `ml:resumed` | `happy` | 1s | Acordou! |
| `ml:state-change` (game over) | `sad` | até restart | Derrota final |

**Regra de prioridade:** Expressões com maior "intensidade emocional" não devem ser sobrescritas por eventos menores enquanto ativas. Implementado via fila ou lock:

```js
setMood(newMood, duration, priority = 0) {
  const now = Date.now()
  if (priority < this._currentPriority && now < this._lockUntil) return
  this._currentPriority = priority
  this._lockUntil = now + duration
  // ... apply mood
}
```

---

## 7. Animações CSS

### Transições entre expressões
```css
.character-svg * {
  transition: transform 0.3s ease, opacity 0.3s ease, d 0.3s ease;
}
```

Nota: `d` attribute transitions não têm bom suporte cross-browser. Alternativa: ter múltiplos `<path>` de boca com `opacity` togglada, ou usar `<path>` com stroke-dasharray para animar.

### Animação de corpo inteiro (idle float)
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.game-character-container {
  animation: float 3s ease-in-out infinite;
}
```

### Pulo (happy/excited)
```css
@keyframes bounce {
  0%, 100% { transform: scale(1) translateY(0); }
  30% { transform: scale(1.1) translateY(-10px); }
  50% { transform: scale(0.95) translateY(0); }
  70% { transform: scale(1.05) translateY(-5px); }
}
```

### Tremor (sad)
```css
@keyframes tremble {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
```

---

## 8. Alternativa com Biblioteca: anime.js

Caso as transições CSS não sejam suficientes (ex: morphing de boca entre formas complexas), recomendo **anime.js** (~14KB gzipped):

```bash
npm install animejs
```

**Vantagens do anime.js:**
- Anima atributos SVG nativamente (incluindo `d` para morphing de path)
- Timeline para sequenciar animações (ex: olhos → sobrancelhas → boca em cascata)
- Easing functions ricas (elastic, bounce, etc.)
- Stagger para animar partes do rosto com delay

**Desvantagens:**
- +14KB no bundle
- Mais uma dependência para manter
- Overkill para transições simples de expressão

**Recomendação:** Começar sem lib (CSS + Alpine), adicionar anime.js apenas se necessário.

---

## 9. Plano de Implementação (Passos)

### Passo 1: Criar o componente base
- [ ] `src/components/games/GameCharacter.astro` — SVG inline com bindings Alpine
- [ ] CSS para o personagem (tamanho, posicionamento, float animation)

### Passo 2: Criar o Alpine data store
- [ ] Registrar `Alpine.data('gameCharacter', ...)` no script da página
- [ ] Implementar getters reativos para cada parte do rosto
- [ ] Implementar `setMood()` com sistema de prioridade/duração
- [ ] Implementar blink loop no `init()`

### Passo 3: Definir as expressões
- [ ] Criar arquivo `src/config/character-expressions.ts` com os parâmetros de cada mood
- [ ] Testar cada expressão isoladamente

### Passo 4: Integrar eventos
- [ ] Adicionar listeners no `init()` para todos os eventos do engine
- [ ] Mapear cada evento ao mood correto com duração e prioridade
- [ ] Testar o fluxo completo do jogo

### Passo 5: Posicionar na página
- [ ] Adicionar `<GameCharacter />` no template de `luzes.astro`
- [ ] Escolher posição (canto superior direito, ao lado dos botões, ou overlay inferior)
- [ ] Ajustar responsividade

### Passo 6: (Opcional) anime.js
- [ ] Se necessário, instalar anime.js
- [ ] Refatorar transições de expressão para usar anime.js timelines
- [ ] Adicionar morphing de boca com `d` attribute animation

### Passo 7: Polimento
- [ ] Ajustar timings das animações
- [ ] Adicionar partículas/efeitos ao redor do personagem (corações, estrelas)
- [ ] Testar em mobile (touch, performance)
- [ ] Suporte a temas (cores customizáveis via config)

---

## 10. Posicionamento Sugerido na Tela

```
┌──────────────────────────────────┐
│  ★ ScoreBoard (hamburger)    🙂 │  ← Personagem no canto superior direito
│                                  │
│         ┌─────┐ ┌─────┐        │
│         │ 🔴  │ │ 🔵  │        │
│         └─────┘ └─────┘        │
│         ┌─────┐ ┌─────┐        │
│         │ 🟡  │ │ 🟢  │        │
│         └─────┘ └─────┘        │
│                                  │
│  ⏱ TimerBar                     │
└──────────────────────────────────┘
```

Em mobile, o personagem pode ficar centralizado acima dos botões (ocupando menos espaço vertical).

---

## 11. Resumo de Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/components/games/GameCharacter.astro` | **Criar** — componente do personagem |
| `src/config/character-expressions.ts` | **Criar** — configuração de expressões |
| `src/pages/jogos/luzes.astro` | **Modificar** — adicionar `<GameCharacter />` + Alpine.data |
| `package.json` | **Possível modificar** — se usar anime.js |
