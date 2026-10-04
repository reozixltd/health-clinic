import { describe, expect, it } from 'vitest';
import { icons, type IconName } from '@/core/ui/icons';

/**
 * The names the Stitch compositions are drawn from.
 *
 * This is a forward-looking list, not a mirror of what templates render today. Tracking template
 * usage adds nothing: `Icon.astro` types `name` as `IconName`, which is `keyof typeof icons`, so
 * `npm run check` already fails the build on any unresolvable name before a test can notice. What
 * this list buys is the opposite direction — it fails when a composition's icon is missing from the
 * set, which the type system cannot catch.
 */
const stitchIcons = [
  'search',
  'chevron-right',
  'arrow-right',
  'badge-check',
  'filter',
  'flask',
  'pill',
  'scan-line',
  'smartphone',
  'mail',
  'lock',
  'globe',
  'award',
  'heart-pulse',
  'navigation',
  'video',
  'sliders',
  'sparkle',
] as const;

/** `stroke-width` on the wrapping svg, which every icon inherits and must not set itself. */
const STROKE = 1.75;

/**
 * The only attributes an icon may carry. Everything about how a stroke looks is set once on the
 * wrapping `<svg>` in Icon.astro, so an attribute here is a per-icon override of the shared
 * contract. Allowlisting the geometry attributes means a new override cannot slip past unnoticed:
 * `stroke-width="1"` would make one icon heavier than its neighbours, and `opacity="0"` or
 * `class="hidden"` would render an icon that occupies layout and reads to a screen reader but is
 * invisible. A deny-list cannot do this: it has to guess every spelling someone might reach for.
 */
const GEOMETRY_ATTRS = new Set(['cx', 'cy', 'd', 'height', 'r', 'rx', 'width', 'x', 'y']);

/**
 * Icons whose subpaths are meant to meet.
 *
 * Nine of the thirty-three, and that ratio is the finding: in a well-drawn glyph a stroke routinely
 * terminates on the shape it belongs to, and no geometric rule can tell that from a mistake. The
 * groups below are the reasons, so a name added later has to arrive with one too.
 *
 *   terminates on an enclosing shape — `calendar`'s header rule and rings reach the body's edge,
 *     `mail`'s flap reaches the envelope's sides, `lock`'s shackle sits on the body's top edge,
 *     `globe`'s equator and meridian span the full disc, `search`'s handle is rooted on the lens
 *   passes through another shape — `award`'s ribbon is behind the medal, `stethoscope`'s outgoing
 *     tube continues the U-bend it starts from
 *   a control sitting on its track — `sliders`' knobs, `video`'s lens against the body's edge
 *
 * The check below proves each one really does touch, so an entry cannot outlive its reason: redraw
 * `sliders` with a gap under the knob and this fails until the name is dropped.
 */
const SELF_TOUCHING: ReadonlySet<IconName> = new Set([
  'award',
  'calendar',
  'globe',
  'lock',
  'mail',
  'search',
  'sliders',
  'stethoscope',
  'video',
]);

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface Parsed {
  box: Box;
  /** Positions, as opposed to radii: what the drawing lands on. Checked against the viewBox. */
  coords: number[];
  /** One sampled polyline per subpath, for the collision check. */
  subpaths: Array<Array<[number, number]>>;
}

const START: Box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };

function grow(b: Box, x: number, y: number): void {
  if (x < b.x0) b.x0 = x;
  if (y < b.y0) b.y0 = y;
  if (x > b.x1) b.x1 = x;
  if (y > b.y1) b.y1 = y;
}

/** Roots of B'(t) = 0 in (0, 1), where the cubic's derivative changes sign. */
function cubicExtrema(p0: number, p1: number, p2: number, p3: number): number[] {
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = p1 - p0;
  const roots: number[] = [];
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) roots.push(-c / b);
  } else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const s = Math.sqrt(disc);
      roots.push((-b + s) / (2 * a), (-b - s) / (2 * a));
    }
  }
  return roots.filter((t) => t > 0 && t < 1);
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/** Signed angle from (ux, uy) to (vx, vy). */
function angle(ux: number, uy: number, vx: number, vy: number): number {
  const dot = ux * vx + uy * vy;
  const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  if (len === 0) return 0;
  const a = Math.acos(Math.min(1, Math.max(-1, dot / len)));
  return ux * vy - uy * vx < 0 ? -a : a;
}

/**
 * Elliptical arc to centre parameterisation, per SVG 1.1 appendix F.6.5.
 *
 * F.6.6 also says what to do when the radii are too small to span the chord: scale them up. That
 * correction is why this exists rather than a literal sweep of the path data — an infeasible radius
 * is silently rewritten by every renderer, so the number in the source is not the number that draws.
 * `scaled` reports it when it happens.
 */
function arcToCentre(
  x1: number,
  y1: number,
  rx: number,
  ry: number,
  phiDeg: number,
  fA: number,
  fS: number,
  x2: number,
  y2: number,
): { cx: number; cy: number; rx: number; ry: number; phi: number; theta: number; dTheta: number; scaled: boolean } | null {
  const phi = (phiDeg * Math.PI) / 180;
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  if (rx === 0 || ry === 0) return null; // Degenerate: the spec says draw a straight line.
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosP * dx + sinP * dy;
  const y1p = -sinP * dx + cosP * dy;
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  let scaled = false;
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
    scaled = true;
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let co = Math.sqrt(Math.max(0, den === 0 ? 0 : num / den));
  if (fA === fS) co = -co;
  const cxp = (co * rx * y1p) / ry;
  const cyp = (-co * ry * x1p) / rx;
  const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
  const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;
  const ux = (x1p - cxp) / rx;
  const uy = (y1p - cyp) / ry;
  const vx = (-x1p - cxp) / rx;
  const vy = (-y1p - cyp) / ry;
  const theta = angle(1, 0, ux, uy);
  let dTheta = angle(ux, uy, vx, vy);
  if (!fS && dTheta > 0) dTheta -= 2 * Math.PI;
  if (fS && dTheta < 0) dTheta += 2 * Math.PI;
  return { cx, cy, rx, ry, phi, theta, dTheta, scaled };
}

/**
 * Exact bounding box of one path's `d`, in user units.
 *
 * Lines contribute their endpoints. Cubics contribute their endpoints plus the parameter values
 * where the derivative vanishes. Arcs are converted to centre parameterisation and then swept for
 * the four axis crossings. Taking a control point as if it were drawn would inflate every box on a
 * curve, which is exactly the error that let an icon sit in the top half of the viewBox pass.
 */
function pathBounds(d: string, box: Box, coords: number[], poly: Array<[number, number]>, scaledOut: string[]): void {
  let i = 0;
  const s = d;
  const skip = (): void => {
    while (i < s.length && (s[i] === ',' || /\s/.test(s[i]!))) i++;
  };
  const cmd = (): string => {
    skip();
    const c = s[i];
    if (c === undefined || !/[a-zA-Z]/.test(c)) throw new Error(`path data ends mid-command: ${d}`);
    i++;
    return c;
  };
  const num = (): number => {
    skip();
    const m = /^[-+]?(\d*\.\d+|\d+\.?)([eE][-+]?\d+)?/.exec(s.slice(i));
    if (!m) throw new Error(`path data has an unreadable number at ${i} in: ${d}`);
    i += m[0].length;
    return Number(m[0]);
  };
  /** An arc flag is a single `0` or `1` and may butt straight up against the next number. */
  const flag = (): number => {
    skip();
    const c = s[i];
    if (c !== '0' && c !== '1') throw new Error(`arc flag is not 0 or 1 at ${i} in: ${d}`);
    i++;
    return c === '1' ? 1 : 0;
  };
  const put = (x: number, y: number): void => {
    grow(box, x, y);
    coords.push(x, y);
    poly.push([x, y]);
  };
  const cur: [number, number] = [0, 0];
  const start: [number, number] = [0, 0];

  let c = cmd();
  for (;;) {
    const lower = c.toLowerCase();
    const rel = c !== c.toUpperCase();
    switch (lower) {
      case 'm': {
        const x = num() + (rel ? cur[0] : 0);
        const y = num() + (rel ? cur[1] : 0);
        cur[0] = x;
        cur[1] = y;
        start[0] = x;
        start[1] = y;
        put(x, y);
        c = rel ? 'l' : 'L';
        break;
      }
      case 'l': {
        const x = num() + (rel ? cur[0] : 0);
        const y = num() + (rel ? cur[1] : 0);
        put(x, y);
        cur[0] = x;
        cur[1] = y;
        break;
      }
      case 'h': {
        const x = num() + (rel ? cur[0] : 0);
        put(x, cur[1]);
        cur[0] = x;
        break;
      }
      case 'v': {
        const y = num() + (rel ? cur[1] : 0);
        put(cur[0], y);
        cur[1] = y;
        break;
      }
      case 'c': {
        const bx = cur[0];
        const by = cur[1];
        const x1 = num() + (rel ? bx : 0);
        const y1 = num() + (rel ? by : 0);
        const x2 = num() + (rel ? bx : 0);
        const y2 = num() + (rel ? by : 0);
        const x = num() + (rel ? bx : 0);
        const y = num() + (rel ? by : 0);
        coords.push(x1, y1, x2, y2, x, y);
        // Each axis has its own roots. Reusing x's parameter values for y finds nothing whenever x
        // happens to be monotonic, which is exactly when the curve bends furthest in y.
        for (const t of cubicExtrema(bx, x1, x2, x)) {
          const px = cubicAt(bx, x1, x2, x, t);
          grow(box, px, cubicAt(by, y1, y2, y, t));
          poly.push([px, cubicAt(by, y1, y2, y, t)]);
        }
        for (const t of cubicExtrema(by, y1, y2, y)) {
          const py = cubicAt(by, y1, y2, y, t);
          grow(box, cubicAt(bx, x1, x2, x, t), py);
          poly.push([cubicAt(bx, x1, x2, x, t), py]);
        }
        put(x, y);
        cur[0] = x;
        cur[1] = y;
        break;
      }
      case 'a': {
        const bx = cur[0];
        const by = cur[1];
        const rx = num();
        const ry = num();
        const phi = num();
        const fA = flag();
        const fS = flag();
        const x = num() + (rel ? bx : 0);
        const y = num() + (rel ? by : 0);
        coords.push(x, y);
        const arc = arcToCentre(bx, by, rx, ry, phi, fA, fS, x, y);
        if (!arc) {
          put(x, y);
        } else {
          if (arc.scaled) scaledOut.push(`r=${rx},${ry} scaled up for chord ${Math.hypot(x - bx, y - by).toFixed(2)}`);
          const at = (th: number): [number, number] => [
            arc.cx + arc.rx * Math.cos(arc.phi) * Math.cos(th) - arc.ry * Math.sin(arc.phi) * Math.sin(th),
            arc.cy + arc.rx * Math.sin(arc.phi) * Math.cos(th) + arc.ry * Math.cos(arc.phi) * Math.sin(th),
          ];
          const inSweep = (th: number): boolean => {
            const d2 = th - arc.theta;
            const norm = (v: number): number => {
              let x2 = v % (2 * Math.PI);
              if (x2 > Math.PI) x2 -= 2 * Math.PI;
              if (x2 < -Math.PI) x2 += 2 * Math.PI;
              return x2;
            };
            const dd = norm(d2);
            return arc.dTheta >= 0 ? dd >= -1e-9 && dd <= arc.dTheta + 1e-9 : dd <= 1e-9 && dd >= arc.dTheta - 1e-9;
          };
          const cand = [arc.theta, arc.theta + arc.dTheta];
          for (const base of [
            Math.atan2(-arc.ry * Math.sin(arc.phi), arc.rx * Math.cos(arc.phi)),
            Math.atan2(arc.ry * Math.cos(arc.phi), arc.rx * Math.sin(arc.phi)),
          ]) {
            for (const th of [base, base + Math.PI]) if (inSweep(th)) cand.push(th);
          }
          for (const th of cand) {
            const p = at(th);
            grow(box, p[0], p[1]);
            poly.push(p);
          }
          // Sample the arc too, so the collision check sees its curve rather than four points.
          for (let k = 1; k < 24; k++) poly.push(at(arc.theta + (arc.dTheta * k) / 24));
          put(x, y);
        }
        cur[0] = x;
        cur[1] = y;
        break;
      }
      case 'z': {
        put(start[0], start[1]);
        cur[0] = start[0];
        cur[1] = start[1];
        break;
      }
      default:
        throw new Error(`path data uses an unsupported command "${c}" in: ${d}`);
    }
    skip();
    if (i >= s.length) break;
    if (/[a-zA-Z]/.test(s[i]!)) {
      c = cmd();
    } else if (!'lhvca'.includes(c.toLowerCase())) {
      // A bare coordinate with no command to repeat: the data is malformed, not an implicit repeat.
      // Read `c`, not `lower`: an implicit `m` has already become `l` by this point.
      throw new Error(`path data has trailing coordinates after "${c}" in: ${d}`);
    }
  }
}

/** Parse one icon's markup into its exact box, its positions, and one polyline per subpath. */
function exactBounds(markup: string): Parsed {
  const box: Box = { ...START };
  const coords: number[] = [];
  const subpaths: Array<Array<[number, number]>> = [];
  const scaledOut: string[] = [];

  for (const tag of markup.matchAll(/<(path|circle|rect|line|polyline|polygon)\b([^>]*)\/?>/g)) {
    const kind = tag[1]!;
    const raw: Record<string, string> = {};
    for (const m of tag[2]!.matchAll(/([a-zA-Z-]+)\s*=\s*"([^"]*)"/g)) {
      raw[m[1]!.toLowerCase()] = m[2]!;
    }
    const num = (k: string, fallback = 0): number => (raw[k] === undefined ? fallback : Number(raw[k]));
    if (kind === 'circle') {
      const cx = num('cx');
      const cy = num('cy');
      const r = num('r');
      coords.push(cx, cy);
      grow(box, cx - r, cy - r);
      grow(box, cx + r, cy + r);
      subpaths.push(circlePoly(cx, cy, r));
    } else if (kind === 'rect') {
      const x = num('x');
      const y = num('y');
      const width = num('width');
      const height = num('height');
      coords.push(x, y, x + width, y + height);
      grow(box, x, y);
      grow(box, x + width, y + height);
      subpaths.push(rectPoly(x, y, width, height));
    } else if (kind === 'path') {
      const poly: Array<[number, number]> = [];
      pathBounds(raw['d'] ?? '', box, coords, poly, scaledOut);
      subpaths.push(poly);
    } else {
      throw new Error(`${kind} is not supported by exactBounds; add it rather than skipping the check`);
    }
  }
  return { box, coords, subpaths };
}

function circlePoly(cx: number, cy: number, r: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let k = 0; k < 48; k++) {
    const t = (k / 48) * 2 * Math.PI;
    out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return out;
}

/**
 * A rect as a sampled outline. The corners alone are not enough: `video`'s triangle apex lands on
 * the middle of the body's right edge, which no corner is near, so an unsampled rect reports those
 * two parts as far apart when they actually meet.
 */
function rectPoly(x: number, y: number, w: number, h: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const corners: Array<[number, number]> = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = corners[i]!;
    const [bx, by] = corners[(i + 1) % 4]!;
    for (let k = 0; k < 16; k++) {
      const t = k / 16;
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
    }
  }
  return out;
}

/** Shortest distance between two sampled polylines. */
function polyDistance(a: Array<[number, number]>, b: Array<[number, number]>): number {
  let best = Infinity;
  for (const [x1, y1] of a) {
    for (const [x2, y2] of b) {
      const d = Math.hypot(x1 - x2, y1 - y2);
      if (d < best) best = d;
    }
  }
  return best;
}

/** Name and markup, with the name kept as `IconName` so it can index `icons` without a cast. */
const entries = Object.entries(icons) as Array<[IconName, string]>;

/** Inbox margin: half of `stroke-width` either side, so nothing is clipped by the viewBox edge. */
const MIN = STROKE / 2;
const MAX = 24 - MIN;

describe('the icon set', () => {
  it('has every icon the Stitch compositions need', () => {
    const missing = stitchIcons.filter((n) => !(n in icons));
    expect(missing, `missing icons: ${missing.join(', ')}`).toEqual([]);
  });

  it('draws with geometry attributes only, so the shared stroke contract holds', () => {
    for (const [name, markup] of entries) {
      expect(markup, `${name} must start with a shape, not a wrapper or text node`).toMatch(
        /^<(path|circle|rect|line|polyline|polygon)\b/,
      );
      for (const m of markup.matchAll(/([a-zA-Z-]+)\s*=/g)) {
        const attr = m[1]!.toLowerCase();
        expect(GEOMETRY_ATTRS.has(attr), `${name} sets ${attr}, which is not geometry and overrides the svg's stroke`).toBe(true);
      }
    }
  });

  /**
   * Positions, not radii.
   *
   * The old version swept every number in the markup and compared `Math.abs(value) <= 24`, which
   * cannot fail for a negative coordinate: `M-10 0` passes while drawing nothing at all. Radii are
   * excluded because "≤ 24" says nothing about where an arc lands — a radius of 20 centred at (2,2)
   * is mostly off-canvas and perfectly legal as a number.
   */
  it('puts every drawn position inside the 24x24 box with half a stroke to spare', () => {
    for (const [name, markup] of entries) {
      const { coords } = exactBounds(markup);
      for (const v of coords) {
        expect(v, `${name} draws at x/y ${v}, outside ${MIN}..${MAX}`).toBeGreaterThanOrEqual(MIN);
        expect(v, `${name} draws at x/y ${v}, outside ${MIN}..${MAX}`).toBeLessThanOrEqual(MAX);
      }
    }
  });

  /**
   * Optical centring.
   *
   * Every glyph has to sit in the middle of its 24x24 box or it drifts wherever it is placed — worst
   * of all next to text on one line, where a top-heavy icon reads as rising above the line. The
   * check is on the exact geometry box, not the authored numbers, so a path that fails to close or
   * an arc that the renderer rescales both show up here.
   */
  it('centres every icon in its box', () => {
    const off: string[] = [];
    for (const [name, markup] of entries) {
      const b = exactBounds(markup).box;
      const cx = (b.x0 + b.x1) / 2;
      const cy = (b.y0 + b.y1) / 2;
      const dx = cx - 12;
      const dy = cy - 12;
      if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
        off.push(`${name} centred (${cx.toFixed(2)}, ${cy.toFixed(2)}), box x ${b.x0.toFixed(2)}..${b.x1.toFixed(2)} y ${b.y0.toFixed(2)}..${b.y1.toFixed(2)}`);
      }
    }
    expect(off, `icons not centred within 1.5 of (12,12):\n${off.join('\n')}`).toEqual([]);
  });

  it('never lets one subpath run into another', () => {
    const offenders: string[] = [];
    for (const [name, markup] of entries) {
      if (SELF_TOUCHING.has(name)) continue;
      const { subpaths } = exactBounds(markup);
      for (let a = 0; a < subpaths.length; a++) {
        for (let b = a + 1; b < subpaths.length; b++) {
          const d = polyDistance(subpaths[a]!, subpaths[b]!);
          if (d < STROKE) offenders.push(`${name} parts ${a} and ${b} are ${d.toFixed(2)} apart, under the ${STROKE} stroke, so they merge`);
        }
      }
    }
    expect(offenders, `parts closer than one stroke width:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('justifies every self-touching exemption', () => {
    for (const name of SELF_TOUCHING) {
      const { subpaths } = exactBounds(icons[name]);
      let closest = Infinity;
      for (let a = 0; a < subpaths.length; a++) {
        for (let b = a + 1; b < subpaths.length; b++) closest = Math.min(closest, polyDistance(subpaths[a]!, subpaths[b]!));
      }
      expect(closest, `${name} is allowlisted as self-touching but its parts are ${closest.toFixed(2)} apart; drop it from SELF_TOUCHING`).toBeLessThan(STROKE);
    }
  });

  /**
   * A guard on the guard's own arithmetic. `exactBounds` under-reporting would make the three tests
   * above vacuous, so pin it against boxes worked out by hand.
   */
  it('agrees with hand-computed boxes', () => {
    const cases: Array<[string, number, number, number, number]> = [
      // A line to (10,20): the box is its endpoints, not the control points.
      ['<path d="M2 2L10 20"/>', 2, 2, 10, 20],
      // A cubic whose control points sit at y=2 but which only reaches y=4.5 at t=0.5. Bounding a
      // curve by its control points would report y0=2 here, which is the whole reason this exists.
      ['<path d="M2 12C2 2 20 2 20 12"/>', 2, 4.5, 20, 12],
      // A circle, inclusive of r.
      ['<circle cx="12" cy="12" r="8"/>', 4, 4, 20, 20],
      // A rect, inclusive of width and height.
      ['<rect x="3" y="5" width="14" height="6"/>', 3, 5, 17, 11],
    ];
    for (const [markup, x0, y0, x1, y1] of cases) {
      const b = exactBounds(markup).box;
      expect([b.x0, b.y0, b.x1, b.y1], markup).toEqual([x0, y0, x1, y1]);
    }
  });
});
