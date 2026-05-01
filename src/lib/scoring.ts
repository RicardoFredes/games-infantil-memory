import type { ScoringConfig, StarLevel } from '@/games/memory-lights/types';

export interface ScoreState {
  points: number;
  streak: number;
  round: number;
  totalCorrect: number;
}

export function calculateScore(
  state: ScoreState,
  steps: number,
  config: ScoringConfig,
): { points: number; state: ScoreState } {
  let earned = config.basePoints;
  if (steps > config.bonusAboveSteps) {
    earned += config.bonusAbovePoints;
  }

  const newStreak = state.streak + 1;
  if (newStreak >= config.streakThreshold) {
    earned += config.streakBonus;
  }

  const newPoints = Math.min(state.points + earned, config.maxScore);

  return {
    points: earned,
    state: {
      points: newPoints,
      streak: newStreak,
      round: state.round + 1,
      totalCorrect: state.totalCorrect + 1,
    },
  };
}

export function resetStreak(state: ScoreState): ScoreState {
  return { ...state, streak: 0 };
}

export function getStars(points: number, starsConfig: StarLevel[]): number {
  let starCount = 1;
  for (const level of starsConfig) {
    if (points >= level.threshold) {
      starCount = level.count;
    }
  }
  return starCount;
}

export function createInitialState(): ScoreState {
  return { points: 0, streak: 0, round: 0, totalCorrect: 0 };
}
