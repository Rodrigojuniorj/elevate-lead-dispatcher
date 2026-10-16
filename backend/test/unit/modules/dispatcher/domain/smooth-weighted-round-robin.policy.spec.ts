import { describe, expect, it } from 'vitest';
import {
  getDistributionRetryDelay,
  selectSmoothWeightedRoundRobin,
  type DispatchCandidate,
} from '../../../../../src/modules/dispatcher/domain/smooth-weighted-round-robin.policy.js';

describe('selectSmoothWeightedRoundRobin', () => {
  it('keeps the exact 50/30/20 proportion over ten assignments', () => {
    let candidates: DispatchCandidate[] = [
      { id: 'a', code: 'CALL-CENTER-A', weight: 50, currentWeight: 0 },
      { id: 'b', code: 'CALL-CENTER-B', weight: 30, currentWeight: 0 },
      { id: 'c', code: 'CALL-CENTER-C', weight: 20, currentWeight: 0 },
    ];
    const selections: string[] = [];

    for (let index = 0; index < 10; index += 1) {
      const selection = selectSmoothWeightedRoundRobin(candidates);
      selections.push(selection.selected.id);
      candidates = candidates.map((candidate) => ({
        ...candidate,
        currentWeight: selection.updatedCandidates.find((updated) => updated.id === candidate.id)!.currentWeight,
      }));
    }

    expect(selections.filter((id) => id === 'a')).toHaveLength(5);
    expect(selections.filter((id) => id === 'b')).toHaveLength(3);
    expect(selections.filter((id) => id === 'c')).toHaveLength(2);
  });

  it('uses only the eligible candidates provided by the caller', () => {
    const selection = selectSmoothWeightedRoundRobin([
      { id: 'a', code: 'CALL-CENTER-A', weight: 50, currentWeight: 0 },
      { id: 'c', code: 'CALL-CENTER-C', weight: 20, currentWeight: 0 },
    ]);

    expect(selection.selected.id).toBe('a');
    expect(selection.totalWeight).toBe(70);
  });

  it('uses the documented retry delays', () => {
    expect([1, 2, 3, 4, 10].map(getDistributionRetryDelay)).toEqual([
      60_000,
      5 * 60_000,
      15 * 60_000,
      60 * 60_000,
      60 * 60_000,
    ]);
  });
});
