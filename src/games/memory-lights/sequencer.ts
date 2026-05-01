import type { LightConfig } from './types';

export function generateSequence(length: number, lightCount: number): number[] {
  const sequence: number[] = [];
  let lastIndex = -1;

  for (let i = 0; i < length; i++) {
    let nextIndex: number;
    do {
      nextIndex = Math.floor(Math.random() * lightCount);
    } while (nextIndex === lastIndex && length > lightCount);

    sequence.push(nextIndex);
    lastIndex = nextIndex;
  }

  return sequence;
}

export function getDifficultySteps(
  round: number,
  difficulty: { rounds: [number, number]; steps: number }[],
): number {
  for (const level of difficulty) {
    if (round >= level.rounds[0] && round <= level.rounds[1]) {
      return level.steps;
    }
  }
  const last = difficulty[difficulty.length - 1];
  return last ? Math.min(last.steps, 10) : 4;
}

export function getDifficultyTiming(
  round: number,
  difficulty: { rounds: [number, number]; lightDuration: number; gapDuration: number }[],
): { lightDuration: number; gapDuration: number } {
  for (const level of difficulty) {
    if (round >= level.rounds[0] && round <= level.rounds[1]) {
      return { lightDuration: level.lightDuration, gapDuration: level.gapDuration };
    }
  }
  return { lightDuration: 400, gapDuration: 200 };
}
