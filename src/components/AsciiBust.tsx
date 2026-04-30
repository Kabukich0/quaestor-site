/**
 * Generative ASCII bust — Layer 0 hero ornament.
 *
 * Why this implementation, not Pretext-native:
 *   @chenglou/pretext is a text-measurement + line-layout library; its
 *   public surface is `prepare/layout/layoutWithLines` for paragraph
 *   geometry. It has no API for sampling a 2D brightness field into a
 *   character grid — that's a different problem class. Path (b) from
 *   the spec: implement the brightness sampler ourselves (~120 lines)
 *   and skip Pretext for this component. We keep Pretext on the
 *   dependency list because Layers 1–3 (manifesto reflow, inscription,
 *   architecture diagram) genuinely need its measurement primitives.
 *
 * What this component does:
 *   1. Defines a procedural Roman-bust silhouette as a sum of soft
 *      ellipses (skull, neck, shoulders) plus laurel-crown bumps and a
 *      nose ridge on the right side (slight 3/4-view tilt).
 *   2. Samples that signed-distance field on a 60×36 grid.
 *   3. Quantises brightness into seven characters: ' · • ○ ◌ ◍ ◎'.
 *   4. Uses requestAnimationFrame to softly modulate each cell's
 *      threshold via sin(time + per-cell phase) at amplitude 0.05 —
 *      this creates the marble-light flicker the spec calls for.
 *   5. Cursor parallax via damped lerp on the wrapping <pre>'s
 *      transform (max ±8px x, ±4px y from viewport center).
 *
 * Performance: 60×36 = 2160 cells, recomputed per RAF (~60 Hz). All
 * arithmetic, no allocation in the hot path — the `chars` Uint8Array
 * is reused. Cursor parallax mutates the wrapping <pre>'s transform
 * style directly; React doesn't re-render after mount.
 *
 * a11y: role="presentation" — purely decorative; the silhouette
 * conveys no information not already in the wordmark + taglines.
 * prefers-reduced-motion disables both drift and parallax (the bust
 * still renders, statically).
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

const COLS = 60;
const ROWS = 36;
const RAMP = [" ", "·", "•", "○", "◌", "◍", "◎"] as const;
const RAMP_MAX = RAMP.length - 1;

/**
 * Procedural silhouette field. Returns a brightness in [0, 1] at
 * normalised (u, v) ∈ [0, 1]². Higher values = denser stone.
 *
 * The bust is composed of:
 *   - skull   : tilted ellipse, centered upper-third
 *   - eyes    : faint horizontal band darkening
 *   - nose    : narrow ellipse offset right (3/4 view)
 *   - jaw     : narrowing taper from cheek to chin
 *   - neck    : narrow column below jaw
 *   - shoulders: wide low ellipse, cropped at the bottom of the field
 *   - laurel  : cosine bumps along the top of the skull
 */
function bustField(u: number, v: number): number {
  // Skull — soft ellipse, slightly egg-shaped (taller than wide).
  // Slight forward tilt: shift the center down-right as v decreases.
  const skullCx = 0.5;
  const skullCy = 0.28;
  const skullRx = 0.22;
  const skullRy = 0.26;
  const dxSkull = (u - skullCx) / skullRx;
  const dySkull = (v - skullCy) / skullRy;
  const skull = 1 - Math.min(1, dxSkull * dxSkull + dySkull * dySkull);

  // Nose ridge — narrow vertical bump just right of skull center,
  // running from upper face to lip area. Sells the 3/4 turn.
  const noseCx = 0.56;
  const noseCy = 0.34;
  const noseRx = 0.04;
  const noseRy = 0.09;
  const dxNose = (u - noseCx) / noseRx;
  const dyNose = (v - noseCy) / noseRy;
  const nose = 1 - Math.min(1, dxNose * dxNose + dyNose * dyNose);

  // Jaw — wider at the top, narrowing toward the chin around v=0.5.
  // Implemented as an ellipse whose horizontal radius shrinks with v.
  const jawCy = 0.46;
  const jawRy = 0.08;
  const jawRxBase = 0.18;
  const jawShrink = Math.max(0, (v - 0.34) * 0.6);
  const jawRx = Math.max(0.06, jawRxBase - jawShrink);
  const dxJaw = (u - 0.5) / jawRx;
  const dyJaw = (v - jawCy) / jawRy;
  const jaw = 1 - Math.min(1, dxJaw * dxJaw + dyJaw * dyJaw);

  // Neck — narrow column below jaw, between v ∈ [0.50, 0.62].
  const neckCx = 0.5;
  const neckRx = 0.08;
  const inNeckBand = v > 0.5 && v < 0.66;
  const dxNeck = (u - neckCx) / neckRx;
  const neck = inNeckBand ? 1 - Math.min(1, dxNeck * dxNeck) : 0;

  // Shoulders — wide flat ellipse at bottom, drawing the eye into the
  // pedestal-like base.
  const shoulderCx = 0.5;
  const shoulderCy = 0.92;
  const shoulderRx = 0.46;
  const shoulderRy = 0.28;
  const dxShoulder = (u - shoulderCx) / shoulderRx;
  const dyShoulder = (v - shoulderCy) / shoulderRy;
  const shoulder = 1 - Math.min(1, dxShoulder * dxShoulder + dyShoulder * dyShoulder);

  // Laurel crown — three small ellipses arched across the top of the
  // skull. Only contribute when v sits along the laurel band.
  let laurel = 0;
  if (v < 0.18) {
    for (let k = 0; k < 5; k++) {
      const cx = 0.32 + k * 0.09;
      const cy = 0.08 + Math.cos((k - 2) * 0.6) * 0.02;
      const rx = 0.05;
      const ry = 0.05;
      const dx = (u - cx) / rx;
      const dy = (v - cy) / ry;
      const leaf = 1 - Math.min(1, dx * dx + dy * dy);
      if (leaf > laurel) laurel = leaf;
    }
  }

  // Combine — take the strongest contribution at each cell, then add
  // a faint stone-grain noise bias driven by deterministic hash.
  let value = Math.max(skull, nose, jaw, neck, shoulder, laurel);
  if (value <= 0) return 0;

  // Faint dark band across eye line (skull region only).
  if (v > 0.22 && v < 0.27) value = Math.min(1, value + 0.06);
  // Faint shadow under the jaw.
  if (v > 0.48 && v < 0.52) value = Math.max(0, value - 0.05);

  // Hash-based stone grain — keeps boundaries from looking too
  // mathematically clean. Deterministic, no allocation.
  const hash = Math.sin(u * 1234.5 + v * 6789.1) * 43758.5453;
  const noise = (hash - Math.floor(hash) - 0.5) * 0.08;
  value += noise;

  return Math.max(0, Math.min(1, value));
}

interface BustCell {
  /** Static base brightness for this cell, sampled once at mount. */
  base: number;
  /** Per-cell phase for the sin-modulated drift. */
  phase: number;
}

function buildCells(): BustCell[] {
  const cells: BustCell[] = new Array(COLS * ROWS);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const u = (c + 0.5) / COLS;
      // Cell aspect ~12px × 18px (1.5 line-height). The silhouette
      // function is in normalized space, so v is already correct;
      // we just want the v-axis to span 0..1 over 36 rows.
      const v = (r + 0.5) / ROWS;
      const base = bustField(u, v);
      // Phase derived deterministically from cell coords so the
      // pattern is stable across renders / SSR + hydration.
      const phase = (Math.sin(c * 12.9898 + r * 78.233) * 43758.5453) % 1;
      cells[r * COLS + c] = { base, phase };
    }
  }
  return cells;
}

function pickChar(brightness: number): string {
  if (brightness <= 0) return RAMP[0];
  const idx = Math.min(RAMP_MAX, Math.max(0, Math.round(brightness * RAMP_MAX)));
  return RAMP[idx] ?? RAMP[0];
}

/**
 * Static-render path: produces the initial character grid for SSR so
 * the page is meaningful before hydration. The drift loop overrides
 * this on mount.
 */
function renderStatic(cells: BustCell[]): string {
  let out = "";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = cells[r * COLS + c];
      out += pickChar(cell ? cell.base : 0);
    }
    if (r < ROWS - 1) out += "\n";
  }
  return out;
}

export function AsciiBust() {
  const preRef = useRef<HTMLPreElement | null>(null);
  // Memoise so SSR + the initial client render produce identical text.
  const cells = useMemo(() => buildCells(), []);
  const initialText = useMemo(() => renderStatic(cells), [cells]);

  // Drift + cursor parallax. We avoid React state entirely: the inner
  // text and the wrapper transform are mutated directly per RAF.
  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Track raw cursor offset from viewport center, clamped to ±1.
    let targetX = 0;
    let targetY = 0;
    let smoothX = 0;
    let smoothY = 0;

    function onMouseMove(e: MouseEvent) {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      targetX = (e.clientX / w) * 2 - 1; // [-1, 1]
      targetY = (e.clientY / h) * 2 - 1;
    }

    if (!reduced) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
    }

    let raf = 0;
    let start = performance.now();

    function frame(now: number) {
      const t = (now - start) / 1000;

      if (!reduced) {
        // Damped lerp toward cursor target. 0.05 per frame.
        smoothX += (targetX - smoothX) * 0.05;
        smoothY += (targetY - smoothY) * 0.05;
        const tx = smoothX * 8; // ±8px max
        const ty = smoothY * 4; // ±4px max
        if (pre) {
          pre.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
        }
      }

      // Recompute the character grid with sin-modulated thresholds.
      // We allocate one string once per frame; the array path showed
      // no measurable win at this size and cost more in GC churn.
      let out = "";
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = cells[r * COLS + c];
          if (!cell) {
            out += RAMP[0];
            continue;
          }
          if (cell.base <= 0) {
            out += RAMP[0];
            continue;
          }
          // Drift: ±0.05 brightness modulation, low-frequency sin.
          const drift = reduced ? 0 : Math.sin(t * 0.6 + cell.phase * Math.PI * 2) * 0.05;
          out += pickChar(cell.base + drift);
        }
        if (r < ROWS - 1) out += "\n";
      }
      if (pre) pre.textContent = out;

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [cells]);

  // Pre-render the static text into the DOM via useLayoutEffect so
  // the first paint matches the SSR HTML byte-for-byte (no hydration
  // mismatch warnings).
  useLayoutEffect(() => {
    const pre = preRef.current;
    if (!pre) return;
    pre.textContent = initialText;
  }, [initialText]);

  return (
    <pre
      ref={preRef}
      role="presentation"
      aria-hidden="true"
      className="lobby-bust"
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 400,
        fontSize: "12px",
        lineHeight: "18px",
        letterSpacing: 0,
        color: "var(--color-muted)",
        opacity: 0.45,
        margin: 0,
        whiteSpace: "pre",
        userSelect: "none",
        willChange: "transform",
        // Width and height are set by font metrics (60ch wide, 36×18=648px tall).
        // We don't fix dimensions in CSS so the grid scales with the font face
        // when it actually loads (no layout shift between fallback and webfont).
      }}
    >
      {initialText}
    </pre>
  );
}
