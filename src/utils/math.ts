export interface Point {
  x: number;
  y: number;
}

export interface LUTEntry {
  u: number;      // Global curve parameter [0, numSegments]
  s: number;      // Cumulative arc length from start (in pixels/units)
  x: number;      // X coordinate
  y: number;      // Y coordinate
}

/**
 * Calculates Euclidean distance between two points.
 */
export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

/**
 * Evaluates a single Centripetal Catmull-Rom spline segment.
 * alpha = 0.5 (centripetal) is ideal to avoid cusps and self-intersections.
 */
function evaluateCatmullRomSegment(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  tLocal: number, // [0, 1]
  alpha: number = 0.5
): Point {
  // Check if points are identical to avoid division by zero
  const dt01 = Math.max(0.0001, Math.pow(getDistance(p0, p1), alpha));
  const dt12 = Math.max(0.0001, Math.pow(getDistance(p1, p2), alpha));
  const dt23 = Math.max(0.0001, Math.pow(getDistance(p2, p3), alpha));

  const t0 = 0;
  const t1 = t0 + dt01;
  const t2 = t1 + dt12;
  const t3 = t2 + dt23;

  // Map local [0, 1] to [t1, t2] range
  const t = t1 + tLocal * (t2 - t1);

  // Barry and Goldman's pyramid algorithm
  const a1x = ((t1 - t) / (t1 - t0)) * p0.x + ((t - t0) / (t1 - t0)) * p1.x;
  const a1y = ((t1 - t) / (t1 - t0)) * p0.y + ((t - t0) / (t1 - t0)) * p1.y;

  const a2x = ((t2 - t) / (t2 - t1)) * p1.x + ((t - t1) / (t2 - t1)) * p2.x;
  const a2y = ((t2 - t) / (t2 - t1)) * p1.y + ((t - t1) / (t2 - t1)) * p2.y;

  const a3x = ((t3 - t) / (t3 - t2)) * p2.x + ((t - t2) / (t3 - t2)) * p3.x;
  const a3y = ((t3 - t) / (t3 - t2)) * p2.y + ((t - t2) / (t3 - t2)) * p3.y;

  const b1x = ((t2 - t) / (t2 - t0)) * a1x + ((t - t0) / (t2 - t0)) * a2x;
  const b1y = ((t2 - t) / (t2 - t0)) * a1y + ((t - t0) / (t2 - t0)) * a2y;

  const b2x = ((t3 - t) / (t3 - t1)) * a2x + ((t - t1) / (t3 - t1)) * a3x;
  const b2y = ((t3 - t) / (t3 - t1)) * a2y + ((t - t1) / (t3 - t1)) * a3y;

  const cx = ((t2 - t) / (t2 - t1)) * b1x + ((t - t1) / (t2 - t1)) * b2x;
  const cy = ((t2 - t) / (t2 - t1)) * b1y + ((t - t1) / (t2 - t1)) * b2y;

  return { x: cx, y: cy };
}

/**
 * Generates an Arc-Length Lookup Table for a given set of control points.
 * Ensures the curve is parameterized by constant velocity.
 */
export function generateCurveLUT(points: Point[], samplesPerSegment: number = 100): LUTEntry[] {
  if (points.length === 0) return [];
  if (points.length === 1) {
    return [{ u: 0, s: 0, x: points[0].x, y: points[0].y }];
  }

  // Handle straight line case if we only have 2 points
  if (points.length === 2) {
    const p0 = points[0];
    const p1 = points[1];
    const totalDist = getDistance(p0, p1);
    const lut: LUTEntry[] = [];
    for (let i = 0; i <= samplesPerSegment; i++) {
      const t = i / samplesPerSegment;
      lut.push({
        u: t,
        s: t * totalDist,
        x: p0.x + t * (p1.x - p0.x),
        y: p0.y + t * (p1.y - p0.y),
      });
    }
    return lut;
  }

  // Create virtual control points for Catmull-Rom endpoints
  // P_{-1} = P_0 + (P_0 - P_1)
  const pStartVirtual: Point = {
    x: points[0].x + (points[0].x - points[1].x),
    y: points[0].y + (points[0].y - points[1].y),
  };
  // P_{n+1} = P_n + (P_n - P_{n-1})
  const n = points.length - 1;
  const pEndVirtual: Point = {
    x: points[n].x + (points[n].x - points[n - 1].x),
    y: points[n].y + (points[n].y - points[n - 1].y),
  };

  const extendedPoints = [pStartVirtual, ...points, pEndVirtual];
  const numSegments = points.length - 1;
  const lut: LUTEntry[] = [];

  let cumulativeLength = 0;
  let prevPoint: Point = points[0];

  // Add initial entry
  lut.push({ u: 0, s: 0, x: points[0].x, y: points[0].y });

  for (let i = 0; i < numSegments; i++) {
    const p0 = extendedPoints[i];
    const p1 = extendedPoints[i + 1];
    const p2 = extendedPoints[i + 2];
    const p3 = extendedPoints[i + 3];

    for (let j = 1; j <= samplesPerSegment; j++) {
      const tLocal = j / samplesPerSegment;
      const u = i + tLocal;
      const pt = evaluateCatmullRomSegment(p0, p1, p2, p3, tLocal);
      const segmentDist = getDistance(prevPoint, pt);
      
      cumulativeLength += segmentDist;
      lut.push({
        u,
        s: cumulativeLength,
        x: pt.x,
        y: pt.y,
      });

      prevPoint = pt;
    }
  }

  return lut;
}

/**
 * Returns the interpolated (x, y) position along the curve at a target distance.
 * Implements binary search over the LUT for constant speed.
 */
export function getPositionAtArcLength(lut: LUTEntry[], sTarget: number): Point {
  if (lut.length === 0) return { x: 0, y: 0 };
  if (lut.length === 1) return { x: lut[0].x, y: lut[0].y };

  const totalLength = lut[lut.length - 1].s;

  // Clamp target length to [0, totalLength]
  const clampedS = Math.max(0, Math.min(sTarget, totalLength));

  // Binary search to find surrounding entries
  let low = 0;
  let high = lut.length - 1;

  while (low < high - 1) {
    const mid = Math.floor((low + high) / 2);
    if (lut[mid].s <= clampedS) {
      low = mid;
    } else {
      high = mid;
    }
  }

  // Linear interpolation between lut[low] and lut[high]
  const entryA = lut[low];
  const entryB = lut[high];

  const sDiff = entryB.s - entryA.s;
  if (sDiff === 0) return { x: entryA.x, y: entryA.y };

  const ratio = (clampedS - entryA.s) / sDiff;
  return {
    x: entryA.x + ratio * (entryB.x - entryA.x),
    y: entryA.y + ratio * (entryB.y - entryA.y),
  };
}

/**
 * Filters and smooths a list of points (e.g. drawn by mouse)
 * to reduce jitter before creating the spline.
 */
export function smoothPoints(points: Point[], tolerance: number = 2): Point[] {
  if (points.length <= 2) return points;

  // Simple moving average smoothing
  const smoothed: Point[] = [];
  smoothed.push(points[0]);

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    // Average coordinate
    smoothed.push({
      x: (prev.x + curr.x + next.x) / 3,
      y: (prev.y + curr.y + next.y) / 3
    });
  }

  smoothed.push(points[points.length - 1]);

  // Remove points that are too close to each other to prevent duplicate vertices
  const filtered: Point[] = [smoothed[0]];
  for (let i = 1; i < smoothed.length; i++) {
    const d = getDistance(filtered[filtered.length - 1], smoothed[i]);
    if (d > tolerance || i === smoothed.length - 1) {
      filtered.push(smoothed[i]);
    }
  }

  return filtered;
}

export interface MiniArtist {
  initialPosition: Point;
  movements: {
    startTime: number;
    endTime: number;
    points: Point[];
    lut: LUTEntry[];
    totalLength: number;
  }[];
}

/**
 * Projects a point to the closest physical stage boundary in pixels.
 */
export function getClosestEdgePoint(point: Point, stageWidth: number, stageHeight: number): Point {
  const w = stageWidth * 100;
  const h = stageHeight * 100;
  const x = Math.max(0, Math.min(point.x, w));
  const y = Math.max(0, Math.min(point.y, h));
  
  const dLeft = x;
  const dRight = w - x;
  const dTop = y;
  const dBottom = h - y;
  
  const minDist = Math.min(dLeft, dRight, dTop, dBottom);
  
  if (minDist === dLeft) {
    return { x: 0, y };
  } else if (minDist === dRight) {
    return { x: w, y };
  } else if (minDist === dTop) {
    return { x, y: 0 };
  } else {
    return { x, y: h };
  }
}

export function getArtistPositionAtTime(
  artist: MiniArtist,
  time: number,
  _stageWidth: number = 16,
  _stageHeight: number = 10
): Point {
  if (artist.movements.length === 0) {
    return artist.initialPosition;
  }

  // Sort movements by startTime
  const sortedMovements = [...artist.movements].sort((a, b) => a.startTime - b.startTime);

  // 1. Check if we're inside an active movement segment
  const activeMovement = sortedMovements.find(
    mov => time >= mov.startTime && time <= mov.endTime
  );

  if (activeMovement) {
    if (activeMovement.lut.length === 0) {
      return activeMovement.points[0] || artist.initialPosition;
    }
    const duration = activeMovement.endTime - activeMovement.startTime;
    const progress = duration > 0 ? (time - activeMovement.startTime) / duration : 0;
    const targetDist = progress * activeMovement.totalLength;
    return getPositionAtArcLength(activeMovement.lut, targetDist);
  }

  // 2. Before the first movement → stay at initialPosition
  if (time < sortedMovements[0].startTime) {
    return artist.initialPosition;
  }

  // 3. After the last movement → stay at the endpoint of the last movement
  const lastMov = sortedMovements[sortedMovements.length - 1];
  if (time > lastMov.endTime) {
    return lastMov.points[lastMov.points.length - 1] || artist.initialPosition;
  }

  // 4. In a gap between two movements → stay at the endpoint of the last completed movement
  const completedMovements = sortedMovements.filter(mov => time > mov.endTime);
  if (completedMovements.length > 0) {
    const lastCompleted = completedMovements[completedMovements.length - 1];
    return lastCompleted.points[lastCompleted.points.length - 1] || artist.initialPosition;
  }

  return artist.initialPosition;
}

/**
 * Generates initial 3-point list for curved transitions.
 * Places a midpoint skewed perpendicularly to form a visible bend.
 */
export function generateDefaultCurvedPoints(start: Point, end: Point): Point[] {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  // Calculate perpendicular vector
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  let px = 0;
  let py = -50; // Default vertical offset if points are identical
  
  if (len > 0.1) {
    // Perpendicular unit vector (-dy, dx) scaled by 50px
    px = -(dy / len) * 50;
    py = (dx / len) * 50;
  }
  
  return [
    start,
    { x: Math.round(midX + px), y: Math.round(midY + py) },
    end
  ];
}

function perpendicularDistance(p: Point, p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const num = Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x);
  const den = Math.sqrt(dx * dx + dy * dy);
  if (den === 0) {
    return Math.sqrt((p.x - p1.x) ** 2 + (p.y - p1.y) ** 2);
  }
  return num / den;
}

export function simplifyPathRDP(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDistance) {
      index = i;
      maxDistance = d;
    }
  }

  if (maxDistance > epsilon) {
    const results1 = simplifyPathRDP(points.slice(0, index + 1), epsilon);
    const results2 = simplifyPathRDP(points.slice(index), epsilon);
    return results1.slice(0, results1.length - 1).concat(results2);
  } else {
    return [points[0], points[end]];
  }
}



