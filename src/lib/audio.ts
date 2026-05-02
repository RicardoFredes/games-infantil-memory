import * as Tone from 'tone';
import { noteToFreq } from '@/lib/notes';

export interface NoteStep {
  note: string;
  duration: string;
}

let initialized = false;

export async function initAudio(): Promise<void> {
  if (initialized) return;

  const audioSession = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
  if (audioSession) {
    try { audioSession.type = 'playback'; } catch {}
  }

  await Tone.start();

  const ctx = Tone.getContext().rawContext as AudioContext;
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch {}
  }

  timeoutPlayer = new Tone.Player({
    url: '/audio/dragon-studio-cuckoo-clock-359874.mp3',
    volume: -8,
  }).toDestination();
  await Tone.loaded();
  initialized = true;
}

function createBell(): Tone.Synth {
  return new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.5 },
  }).toDestination();
}

export function playNote(note: string, duration = '8n', volume = -12): void {
  if (!initialized) return;
  const synth = createBell();
  synth.volume.value = volume;
  synth.triggerAttackRelease(noteToFreq(note), duration);
}

export function playSequence(steps: NoteStep[], gapMs: number, volume: number): void {
  if (!initialized) return;
  const synth = createBell();
  synth.volume.value = volume;

  const now = Tone.now();
  steps.forEach((step, i) => {
    const time = now + (i * gapMs) / 1000;
    synth.triggerAttackRelease(noteToFreq(step.note), step.duration, time);
  });
}

export function playTap(): void {
  if (!initialized) return;
  const synth = createBell();
  synth.volume.value = -20;
  synth.triggerAttackRelease(noteToFreq('G5'), '128n');
}

export function playPop(): void {
  if (!initialized) return;
  const synth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.06, sustain: 0 },
  }).toDestination();
  synth.volume.value = -22;
  synth.triggerAttackRelease('64n');
}

export function playConfettiSfx(): void {
  if (!initialized) return;
  const synth = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
  }).toDestination();
  synth.volume.value = -18;
  synth.triggerAttackRelease('16n');
}

export function playScoreTick(): void {
  if (!initialized) return;
  const synth = createBell();
  synth.volume.value = -22;
  synth.triggerAttackRelease(noteToFreq('C6'), '128n');
}

let bgPlayer: Tone.Player | null = null;
let bgPlayerUrl: string | null = null;

export async function startBackgroundMusic(
  url = '/audio/leberch-suspense-511168.mp3',
  volume = -16,
): Promise<void> {
  if (!initialized) return;
  if (bgPlayer && bgPlayerUrl === url) {
    bgPlayer.volume.value = volume;
    return;
  }
  stopBackgroundMusic();

  bgPlayer = new Tone.Player({
    url,
    loop: true,
    volume,
  }).toDestination();
  bgPlayerUrl = url;

  await Tone.loaded();
  bgPlayer.start();
}

export function stopBackgroundMusic(): void {
  if (bgPlayer) {
    bgPlayer.stop();
    bgPlayer.dispose();
    bgPlayer = null;
    bgPlayerUrl = null;
  }
}

export function stopAllAudio(): void {
  stopBackgroundMusic();
  if (timeoutPlayer) {
    try { timeoutPlayer.stop(); } catch {}
    try { timeoutPlayer.dispose(); } catch {}
    timeoutPlayer = null;
  }
  try {
    Tone.getTransport().stop();
    Tone.getTransport().cancel(0);
  } catch {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', stopAllAudio);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) stopAllAudio();
  });
}

let timeoutPlayer: Tone.Player | null = null;

const cardMatchArpeggio: NoteStep[] = [
  { note: 'C5', duration: '16n' },
  { note: 'E5', duration: '16n' },
  { note: 'G5', duration: '8n' },
];

const cardWinArpeggio: NoteStep[] = [
  { note: 'C5', duration: '8n' },
  { note: 'E5', duration: '8n' },
  { note: 'G5', duration: '8n' },
  { note: 'C6', duration: '4n' },
  { note: 'E6', duration: '4n' },
];

export function playCardMatch(volume = -10): void {
  if (!initialized) return;
  playSequence(cardMatchArpeggio, 90, volume);
}

export function playCardWin(volume = -8): void {
  if (!initialized) return;
  playSequence(cardWinArpeggio, 130, volume);
  const noise = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.005, decay: 0.4, sustain: 0 },
  }).toDestination();
  noise.volume.value = volume - 6;
  noise.triggerAttackRelease('8n', Tone.now() + 0.02);
}

export function playGestureSfx(kind: string): void {
  if (!initialized) return;
  switch (kind) {
    case 'tap': {
      const s = createBell();
      s.volume.value = -18;
      s.triggerAttackRelease(noteToFreq('G5'), '32n');
      break;
    }
    case 'doubleTap': {
      const now = Tone.now();
      const s = createBell();
      s.volume.value = -16;
      s.triggerAttackRelease(noteToFreq('A5'), '32n', now);
      s.triggerAttackRelease(noteToFreq('C6'), '32n', now + 0.09);
      break;
    }
    case 'slap': {
      const drum = new Tone.MembraneSynth({
        pitchDecay: 0.08,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.15 },
      }).toDestination();
      drum.volume.value = -10;
      drum.triggerAttackRelease('C2', '8n');
      break;
    }
    case 'stroke': {
      const noise = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.08, decay: 0.3, sustain: 0 },
      }).toDestination();
      noise.volume.value = -22;
      noise.triggerAttackRelease('8n');
      break;
    }
    case 'tickle': {
      const now = Tone.now();
      const s = createBell();
      s.volume.value = -18;
      ['E5', 'G5', 'B5', 'G5', 'E5'].forEach((n, i) => {
        s.triggerAttackRelease(noteToFreq(n), '32n', now + i * 0.06);
      });
      break;
    }
    case 'longPress': {
      const s = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.15, decay: 0.2, sustain: 0.6, release: 0.5 },
      }).toDestination();
      s.volume.value = -16;
      s.triggerAttackRelease(noteToFreq('C5'), '4n');
      break;
    }
    case 'inflate': {
      // "Balão enchendo": ruído rosa filtrado com cutoff subindo +
      // pitch glide pra cima de um oscilador triangle.
      const now = Tone.now();
      const dur = 0.55;
      const filter = new Tone.Filter({ type: 'lowpass', frequency: 400, Q: 1 }).toDestination();
      filter.frequency.cancelScheduledValues(now);
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + dur);
      const noise = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.05, decay: 0.5, sustain: 0.0, release: 0.05 },
      }).connect(filter);
      noise.volume.value = -18;
      noise.triggerAttackRelease(dur, now);

      const osc = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.04, decay: 0.5, sustain: 0.0, release: 0.05 },
      }).toDestination();
      osc.volume.value = -22;
      osc.frequency.setValueAtTime(noteToFreq('A3'), now);
      osc.frequency.exponentialRampToValueAtTime(noteToFreq('E5'), now + dur * 0.95);
      osc.triggerAttackRelease(noteToFreq('A3'), dur, now);
      break;
    }
  }
}

const moodMotifs: Record<string, NoteStep[]> = {
  happy: [
    { note: 'C5', duration: '8n' },
    { note: 'E5', duration: '8n' },
    { note: 'G5', duration: '4n' },
  ],
  excited: [
    { note: 'C5', duration: '16n' },
    { note: 'E5', duration: '16n' },
    { note: 'G5', duration: '16n' },
    { note: 'C6', duration: '8n' },
    { note: 'G5', duration: '16n' },
    { note: 'C6', duration: '4n' },
  ],
  sad: [
    { note: 'A4', duration: '4n' },
    { note: 'F4', duration: '4n' },
    { note: 'D4', duration: '2n' },
  ],
  angry: [
    { note: 'F#3', duration: '8n' },
    { note: 'F3', duration: '8n' },
    { note: 'E3', duration: '8n' },
    { note: 'F#3', duration: '4n' },
  ],
  surprised: [
    { note: 'C5', duration: '16n' },
    { note: 'C6', duration: '4n' },
  ],
  tired: [
    { note: 'G4', duration: '4n' },
    { note: 'F4', duration: '4n' },
    { note: 'E4', duration: '2n' },
  ],
  sleeping: [
    { note: 'D4', duration: '2n' },
    { note: 'D4', duration: '4n' },
  ],
  thinking: [
    { note: 'E5', duration: '8n' },
    { note: 'G5', duration: '8n' },
    { note: 'F5', duration: '4n' },
  ],
  calm: [
    { note: 'C5', duration: '4n' },
    { note: 'G4', duration: '2n' },
  ],
};

export function playMoodMotif(mood: string, volume = -10): void {
  if (!initialized) return;
  const motif = moodMotifs[mood];
  if (!motif) return;
  playSequence(motif, 130, volume);
}

export function playTimeoutSfx(): void {
  if (!initialized) return;
  try {
    if (!timeoutPlayer) {
      timeoutPlayer = new Tone.Player({
        url: '/audio/dragon-studio-cuckoo-clock-359874.mp3',
        volume: -8,
      }).toDestination();
    }
    timeoutPlayer.start(0, 0.55);
  } catch {
    // ignore audio errors
  }
}
