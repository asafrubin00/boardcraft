import { describe, it, expect } from 'vitest';
import { computeSeatLayout, computeSeatRadius } from './useSeatLayout';
import { roundedRectPath } from './seatGeometry';

describe('roundedRectPath', () => {
  it('reports the correct total perimeter length', () => {
    const path = roundedRectPath(500, 500, 700, 700, 98);
    const straight = 4 * (700 - 2 * 98);
    const arcs = 2 * Math.PI * 98;
    expect(path.totalLength).toBeCloseTo(straight + arcs, 5);
  });

  it('places the top-centre offset exactly at (cx, cy - h/2)', () => {
    const path = roundedRectPath(500, 500, 700, 700, 98);
    const p = path.getPointAtLength(path.topCenterOffset);
    expect(p.x).toBeCloseTo(500, 5);
    expect(p.y).toBeCloseTo(500 - 350, 5);
  });

  it('wraps arc length modulo the total perimeter', () => {
    const path = roundedRectPath(500, 500, 700, 700, 98);
    const a = path.getPointAtLength(10);
    const b = path.getPointAtLength(10 + path.totalLength);
    const c = path.getPointAtLength(10 - path.totalLength);
    expect(b.x).toBeCloseTo(a.x, 5);
    expect(b.y).toBeCloseTo(a.y, 5);
    expect(c.x).toBeCloseTo(a.x, 5);
    expect(c.y).toBeCloseTo(a.y, 5);
  });
});

describe('computeSeatRadius', () => {
  it('clamps to [34, 52]', () => {
    expect(computeSeatRadius(3)).toBeLessThanOrEqual(52);
    expect(computeSeatRadius(200)).toBeGreaterThanOrEqual(34);
  });
});

describe('computeSeatLayout', () => {
  const NS = [3, 5, 8, 10, 14];

  it.each(NS)('anchors seat index 0 at top-centre for N=%i', (n) => {
    const { seats } = computeSeatLayout(n);
    expect(seats[0].x).toBeCloseTo(500, 4);
    expect(seats[0].y).toBeCloseTo(150, 4); // cy(500) - ringSize/2(350)
  });

  it.each(NS)('returns exactly N seats for N=%i', (n) => {
    const { seats } = computeSeatLayout(n);
    expect(seats).toHaveLength(n);
  });

  it.each(NS)('spaces seats with no overlap for N=%i', (n) => {
    const { seats, radius } = computeSeatLayout(n);
    for (let i = 0; i < n; i++) {
      const a = seats[i];
      const b = seats[(i + 1) % n];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      expect(dist).toBeGreaterThanOrEqual(2 * radius);
    }
  });

  it('distributes seats clockwise at equal arc length', () => {
    const { seats, totalLength } = computeSeatLayout(8);
    // Reconstruct arc-length position of each seat via the same path and confirm
    // consecutive seats are evenly spaced (within floating point tolerance).
    const path = roundedRectPath(500, 500, 700, 700, 98);
    const step = totalLength / 8;
    for (let i = 0; i < 8; i++) {
      const expected = path.getPointAtLength(path.topCenterOffset + i * step);
      expect(seats[i].x).toBeCloseTo(expected.x, 5);
      expect(seats[i].y).toBeCloseTo(expected.y, 5);
    }
  });

  it('re-spaces all seats evenly when N changes (e.g. committee added mid-game)', () => {
    const before = computeSeatLayout(9);
    const after = computeSeatLayout(10);
    expect(before.seats).toHaveLength(9);
    expect(after.seats).toHaveLength(10);
    // Seat 0 stays anchored at top-centre regardless of N.
    expect(before.seats[0]).toMatchObject({ x: after.seats[0].x, y: after.seats[0].y });
  });

  it('handles N=0 without throwing', () => {
    expect(() => computeSeatLayout(0)).not.toThrow();
    expect(computeSeatLayout(0).seats).toHaveLength(0);
  });
});
