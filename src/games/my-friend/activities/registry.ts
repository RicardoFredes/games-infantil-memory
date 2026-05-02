import type { ActivityName, ActivitySpec } from './types';

// Registry preenchido pelas implementações em ./eat, ./dance, ...
// Mantemos lazy via getter pra não acoplar ordem de import.

const map = new Map<ActivityName, ActivitySpec>();

export function registerActivity(spec: ActivitySpec) {
  map.set(spec.name, spec);
}

export function getActivity(name: ActivityName): ActivitySpec | undefined {
  return map.get(name);
}

export function listActivities(): ActivitySpec[] {
  return Array.from(map.values());
}
