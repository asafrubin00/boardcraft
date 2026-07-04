import { roundedRectPath, type Point } from './seatGeometry';

export interface SeatLayoutConfig {
  /** Table/ring centre. */
  cx?: number;
  cy?: number;
  /** Width/height of the seat ring (a rounded rect concentric with the table). */
  ringSize?: number;
  /** Corner radius of the seat ring. */
  ringRadius?: number;
  /** Minimum gap (viewBox units) required between adjacent seat circle edges. */
  minGap?: number;
}

export interface SeatLayoutPoint extends Point {
  index: number;
}

export interface SeatLayout {
  seats: SeatLayoutPoint[];
  /** Seat circle radius, shared by every seat (shrunk if needed so N seats don't overlap). */
  radius: number;
  totalLength: number;
}

const DEFAULT_CONFIG: Required<SeatLayoutConfig> = {
  cx: 500,
  cy: 500,
  ringSize: 700,
  ringRadius: 98,
  minGap: 8,
};

/** r = clamp(34, 300/sqrt(N), 52) — seats shrink gracefully as boards grow. */
export function computeSeatRadius(n: number): number {
  const raw = 300 / Math.sqrt(Math.max(n, 1));
  return Math.min(52, Math.max(34, raw));
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Pure function: given a seat count N, returns the on-ring position of every seat.
 * Seat index 0 is anchored at top-centre (12 o'clock); remaining seats distribute
 * clockwise at equal arc-length spacing along a rounded-rect ring. No DOM, no React —
 * safe to unit test directly.
 */
export function computeSeatLayout(n: number, config: SeatLayoutConfig = {}): SeatLayout {
  const { cx, cy, ringSize, ringRadius, minGap } = { ...DEFAULT_CONFIG, ...config };

  if (n <= 0) {
    return { seats: [], radius: computeSeatRadius(1), totalLength: 0 };
  }

  const ring = roundedRectPath(cx, cy, ringSize, ringSize, ringRadius);
  const { totalLength, topCenterOffset, getPointAtLength } = ring;

  const rawPoints: Point[] = Array.from({ length: n }, (_, i) => {
    const s = topCenterOffset + (i / n) * totalLength;
    return getPointAtLength(s);
  });

  let radius = computeSeatRadius(n);

  // Safety net: if N is large enough that the fixed radius formula would make
  // adjacent seats overlap, shrink radius until they clear minGap.
  if (n > 1) {
    let minAdjacentDist = Infinity;
    for (let i = 0; i < n; i++) {
      const next = rawPoints[(i + 1) % n];
      const d = distance(rawPoints[i], next);
      if (d < minAdjacentDist) minAdjacentDist = d;
    }
    const maxRadiusForSpacing = (minAdjacentDist - minGap) / 2;
    if (maxRadiusForSpacing < radius) {
      radius = Math.max(16, maxRadiusForSpacing);
    }
  }

  const seats: SeatLayoutPoint[] = rawPoints.map((p, index) => ({ index, x: p.x, y: p.y }));

  return { seats, radius, totalLength };
}
