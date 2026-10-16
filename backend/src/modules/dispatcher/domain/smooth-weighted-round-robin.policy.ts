export type DispatchCandidate = {
  id: string;
  code: string;
  weight: number;
  currentWeight: number;
};

export type DispatchSelection = {
  selected: DispatchCandidate;
  totalWeight: number;
  updatedCandidates: Array<Pick<DispatchCandidate, 'id' | 'currentWeight'>>;
};

export function selectSmoothWeightedRoundRobin(candidates: DispatchCandidate[]): DispatchSelection {
  if (candidates.length === 0) throw new Error('At least one dispatch candidate is required.');
  if (candidates.some((candidate) => !Number.isInteger(candidate.weight) || candidate.weight <= 0)) {
    throw new Error('Dispatch weights must be positive integers.');
  }

  const totalWeight = candidates.reduce((total, candidate) => total + candidate.weight, 0);
  const candidatesWithUpdatedWeight = candidates.map((candidate) => ({
    ...candidate,
    currentWeight: candidate.currentWeight + candidate.weight,
  }));
  const selected = candidatesWithUpdatedWeight.reduce((best, candidate) =>
    candidate.currentWeight > best.currentWeight ? candidate : best,
  );

  selected.currentWeight -= totalWeight;

  return {
    selected,
    totalWeight,
    updatedCandidates: candidatesWithUpdatedWeight.map(({ id, currentWeight }) => ({ id, currentWeight })),
  };
}

export function getDistributionRetryDelay(attemptsMade: number): number {
  if (attemptsMade <= 1) return 60_000;
  if (attemptsMade === 2) return 5 * 60_000;
  if (attemptsMade === 3) return 15 * 60_000;
  return 60 * 60_000;
}
