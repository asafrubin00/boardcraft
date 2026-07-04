/**
 * Pure arc-length geometry for a rounded-rectangle ring path.
 * No DOM dependency (no SVGPathElement) so it can run in a node test environment.
 */

export interface Point {
  x: number;
  y: number;
}

interface LineSegment {
  type: 'line';
  length: number;
  start: Point;
  end: Point;
}

interface ArcSegment {
  type: 'arc';
  length: number;
  center: Point;
  radius: number;
  startAngle: number; // radians
  endAngle: number; // radians
}

type Segment = LineSegment | ArcSegment;

export interface RoundedRectPath {
  totalLength: number;
  /** Arc length from the path start (top-left of the top edge) to the top-centre point. */
  topCenterOffset: number;
  getPointAtLength: (s: number) => Point;
}

/**
 * Builds a clockwise perimeter path for a rounded rectangle centred at (cx, cy),
 * starting at the top-left corner of the top straight edge.
 */
export function roundedRectPath(cx: number, cy: number, w: number, h: number, r: number): RoundedRectPath {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;

  const HALF_PI = Math.PI / 2;

  const segments: Segment[] = [
    // top edge, left → right
    { type: 'line', length: w - 2 * r, start: { x: x0 + r, y: y0 }, end: { x: x1 - r, y: y0 } },
    // top-right arc
    { type: 'arc', length: HALF_PI * r, center: { x: x1 - r, y: y0 + r }, radius: r, startAngle: -HALF_PI, endAngle: 0 },
    // right edge, top → bottom
    { type: 'line', length: h - 2 * r, start: { x: x1, y: y0 + r }, end: { x: x1, y: y1 - r } },
    // bottom-right arc
    { type: 'arc', length: HALF_PI * r, center: { x: x1 - r, y: y1 - r }, radius: r, startAngle: 0, endAngle: HALF_PI },
    // bottom edge, right → left
    { type: 'line', length: w - 2 * r, start: { x: x1 - r, y: y1 }, end: { x: x0 + r, y: y1 } },
    // bottom-left arc
    { type: 'arc', length: HALF_PI * r, center: { x: x0 + r, y: y1 - r }, radius: r, startAngle: HALF_PI, endAngle: Math.PI },
    // left edge, bottom → top
    { type: 'line', length: h - 2 * r, start: { x: x0, y: y1 - r }, end: { x: x0, y: y0 + r } },
    // top-left arc
    { type: 'arc', length: HALF_PI * r, center: { x: x0 + r, y: y0 + r }, radius: r, startAngle: Math.PI, endAngle: Math.PI + HALF_PI },
  ];

  const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);
  // Top-centre point lies on the top edge (first segment), at distance (w/2 - r) from its start.
  const topCenterOffset = w / 2 - r;

  const getPointAtLength = (s: number): Point => {
    let t = s % totalLength;
    if (t < 0) t += totalLength;

    let acc = 0;
    for (const seg of segments) {
      if (t <= acc + seg.length || seg === segments[segments.length - 1]) {
        const u = t - acc;
        if (seg.type === 'line') {
          const ratio = seg.length === 0 ? 0 : u / seg.length;
          return {
            x: seg.start.x + (seg.end.x - seg.start.x) * ratio,
            y: seg.start.y + (seg.end.y - seg.start.y) * ratio,
          };
        }
        const ratio = seg.length === 0 ? 0 : u / seg.length;
        const theta = seg.startAngle + (seg.endAngle - seg.startAngle) * ratio;
        return {
          x: seg.center.x + seg.radius * Math.cos(theta),
          y: seg.center.y + seg.radius * Math.sin(theta),
        };
      }
      acc += seg.length;
    }
    // Unreachable, but keeps TS happy.
    return { x: cx, y: cy };
  };

  return { totalLength, topCenterOffset, getPointAtLength };
}
