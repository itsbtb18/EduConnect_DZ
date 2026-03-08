/**
 * Tests for the extractData utility from useApi.ts
 *
 * extractData normalises API responses into { results, count } shape.
 * It is NOT exported directly, so we replicate the logic here to test the algorithm.
 * If the function becomes exported, switch to importing it directly.
 */
import { describe, it, expect } from 'vitest';

// Mirror of the extractData helper in useApi.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractData(res: { data: any }): { results: Record<string, any>[]; count: number } {
  const d = res.data;
  if (Array.isArray(d)) return { results: d, count: d.length };
  if (d && typeof d === 'object' && 'results' in d) return { results: d.results, count: d.count };
  return { results: [], count: 0 };
}

describe('extractData', () => {
  it('normalises array response', () => {
    const res = { data: [{ id: 1 }, { id: 2 }] };
    const result = extractData(res);
    expect(result.results).toHaveLength(2);
    expect(result.count).toBe(2);
  });

  it('normalises paginated response', () => {
    const res = { data: { results: [{ id: 1 }], count: 42, next: null, previous: null } };
    const result = extractData(res);
    expect(result.results).toHaveLength(1);
    expect(result.count).toBe(42);
  });

  it('returns empty for null data', () => {
    const res = { data: null };
    const result = extractData(res);
    expect(result.results).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('returns empty for string data', () => {
    const res = { data: 'not an object' };
    const result = extractData(res);
    expect(result.results).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('returns empty for number data', () => {
    const res = { data: 123 };
    const result = extractData(res);
    expect(result.results).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('handles empty array', () => {
    const res = { data: [] };
    const result = extractData(res);
    expect(result.results).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('handles paginated response with empty results', () => {
    const res = { data: { results: [], count: 0, next: null, previous: null } };
    const result = extractData(res);
    expect(result.results).toEqual([]);
    expect(result.count).toBe(0);
  });
});
