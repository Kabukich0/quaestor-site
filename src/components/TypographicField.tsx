/**
 * Variable Typographic ASCII — Layer 0's right-column ornament.
 *
 * Direct port of @chenglou/pretext's `variable-typographic-ascii` demo
 * (pages/demos/variable-typographic-ascii.ts, by @somnai_dreams),
 * adapted to Quaestor's cream/ink palette.
 *
 * Algorithm:
 *   1. Build a palette of (char, weight, style, font, width, brightness)
 *      tuples for proportional Georgia at 3 weights × normal/italic.
 *      Width is measured via @chenglou/pretext's prepareWithSegments —
 *      that's the load-bearing reason the package is on the dependency
 *      list. Brightness is sampled by rasterising each glyph onto an
 *      offscreen canvas and averaging alpha.
 *   2. Particles orbit around two moving attractors. Each particle
 *      stamps a soft radial sprite into a shared brightness Float32
 *      field on every frame. The field decays exponentially.
 *   3. For each row of the COLS×ROWS grid we look up the per-cell
 *      brightness, pick the palette entry that best matches BOTH the
 *      target brightness and the target cell width, and emit a span
 *      with weight + style + opacity classes.
 *
 * Quaestor adaptations vs. the original demo:
 *   - Cream background (not the demo's near-black gradient).
 *   - Ink-coloured glyphs at 10 opacity steps (not the demo's gold).
 *   - Dropped the "Source Field" canvas panel (black-on-black canvas
 *     fights the lobby's cream surface). Dropped the monospace panel
 *     too — the wordmark stack on the left already carries the
 *     monospace English tagline. The proportional Georgia panel IS
 *     the showpiece here.
 *   - prefers-reduced-motion freezes the field at frame 0 (still
 *     reads as typographic art; just no kinetic component).
 *
 * The component is purely decorative — role="presentation" — and the
 * wordmark + taglines on the left carry the actual semantic content.
 */
import { prepareWithSegments } from "@chenglou/pretext";
import { useEffect, useMemo, useRef } from "react";

// ── Locked grid + simulation parameters (from the demo) ───────────────
const COLS = 50;
const ROWS = 28;
const FONT_SIZE = 16;
const LINE_HEIGHT = 18;
const TARGET_ROW_W = 480;

const PROP_FAMILY = 'Georgia, Palatino, "Times New Roman", serif';

const FIELD_OVERSAMPLE = 2;
const FIELD_COLS = COLS * FIELD_OVERSAMPLE;
const FIELD_ROWS = ROWS * FIELD_OVERSAMPLE;
const CANVAS_W = 220;
const CANVAS_H = Math.round(CANVAS_W * ((ROWS * LINE_HEIGHT) / TARGET_ROW_W));
const FIELD_SCALE_X = FIELD_COLS / CANVAS_W;
const FIELD_SCALE_Y = FIELD_ROWS / CANVAS_H;

const PARTICLE_N = 120;
const SPRITE_R = 14;
const ATTRACTOR_R = 12;
const LARGE_ATTRACTOR_R = 30;
const ATTRACTOR_FORCE_1 = 0.22;
const ATTRACTOR_FORCE_2 = 0.05;
const FIELD_DECAY = 0.82;

const CHARSET =
  ' .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const WEIGHTS = [300, 500, 800] as const;
const STYLES = ["normal", "italic"] as const;

type FontStyleVariant = (typeof STYLES)[number];

interface PaletteEntry {
  char: string;
  weight: number;
  style: FontStyleVariant;
  width: number;
  brightness: number;
}

interface BrightnessEntry {
  propHtml: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface FieldStamp {
  radiusX: number;
  radiusY: number;
  sizeX: number;
  sizeY: number;
  values: Float32Array;
}

// ── HTML helpers ─────────────────────────────────────────────────────
function escHtml(ch: string): string {
  if (ch === "<") return "&lt;";
  if (ch === ">") return "&gt;";
  if (ch === "&") return "&amp;";
  if (ch === '"') return "&quot;";
  return ch;
}

function weightClass(weight: number, style: FontStyleVariant): string {
  const w = weight === 300 ? "w3" : weight === 500 ? "w5" : "w8";
  return style === "italic" ? `${w} it` : w;
}

// ── Build palette + brightness lookup once at module load ────────────
//
// This work is browser-only (canvas + DOM measurement). To keep SSR
// happy we lazy-build inside a hook that gates on `typeof window`.

function buildPalette(): PaletteEntry[] {
  const offscreen = document.createElement("canvas");
  offscreen.width = 28;
  offscreen.height = 28;
  const maybeCtx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!maybeCtx) throw new Error("brightness context unavailable");
  // Bind to a const so the closure inside estimateBrightness doesn't lose
  // the non-null narrowing across the function boundary.
  const ctx: CanvasRenderingContext2D = maybeCtx;

  function estimateBrightness(ch: string, font: string): number {
    const size = 28;
    ctx.clearRect(0, 0, size, size);
    ctx.font = font;
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, 1, size / 2);
    const data = ctx.getImageData(0, 0, size, size).data;
    let sum = 0;
    for (let i = 3; i < data.length; i += 4) sum += data[i]!;
    return sum / (255 * size * size);
  }

  function measureWidth(ch: string, font: string): number {
    const prepared = prepareWithSegments(ch, font);
    return prepared.widths.length > 0 ? prepared.widths[0]! : 0;
  }

  const palette: PaletteEntry[] = [];
  for (const style of STYLES) {
    for (const weight of WEIGHTS) {
      const font = `${style === "italic" ? "italic " : ""}${weight} ${FONT_SIZE}px ${PROP_FAMILY}`;
      for (const ch of CHARSET) {
        if (ch === " ") continue;
        const width = measureWidth(ch, font);
        if (width <= 0) continue;
        const brightness = estimateBrightness(ch, font);
        palette.push({ char: ch, weight, style, width, brightness });
      }
    }
  }
  // Normalise brightness so the brightest character maps to 1.0.
  let maxBrightness = 0;
  for (const entry of palette) {
    if (entry.brightness > maxBrightness) maxBrightness = entry.brightness;
  }
  if (maxBrightness > 0) {
    for (const entry of palette) entry.brightness /= maxBrightness;
  }
  palette.sort((a, b) => a.brightness - b.brightness);
  return palette;
}

function buildBrightnessLookup(palette: PaletteEntry[]): BrightnessEntry[] {
  const targetCellW = TARGET_ROW_W / COLS;
  function findBest(targetBrightness: number): PaletteEntry {
    // Binary-search for the lower-bound index then scan a window.
    let lo = 0;
    let hi = palette.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (palette[mid]!.brightness < targetBrightness) lo = mid + 1;
      else hi = mid;
    }
    let bestScore = Infinity;
    let best = palette[lo]!;
    const start = Math.max(0, lo - 15);
    const end = Math.min(palette.length, lo + 15);
    for (let i = start; i < end; i++) {
      const entry = palette[i]!;
      const brightnessError = Math.abs(entry.brightness - targetBrightness) * 2.5;
      const widthError = Math.abs(entry.width - targetCellW) / targetCellW;
      const score = brightnessError + widthError;
      if (score < bestScore) {
        bestScore = score;
        best = entry;
      }
    }
    return best;
  }
  const lookup: BrightnessEntry[] = [];
  for (let byte = 0; byte < 256; byte++) {
    const brightness = byte / 255;
    if (brightness < 0.03) {
      lookup.push({ propHtml: " " });
      continue;
    }
    const match = findBest(brightness);
    const alphaIndex = Math.max(1, Math.min(10, Math.round(brightness * 10)));
    lookup.push({
      propHtml: `<span class="${weightClass(match.weight, match.style)} a${alphaIndex}">${escHtml(match.char)}</span>`,
    });
  }
  return lookup;
}

// ── Sprite + field stamp helpers ─────────────────────────────────────
function spriteAlphaAt(d: number): number {
  if (d >= 1) return 0;
  if (d <= 0.35) return 0.45 + (0.15 - 0.45) * (d / 0.35);
  return 0.15 * (1 - (d - 0.35) / 0.65);
}

function createFieldStamp(radiusPx: number): FieldStamp {
  const fieldRadiusX = radiusPx * FIELD_SCALE_X;
  const fieldRadiusY = radiusPx * FIELD_SCALE_Y;
  const radiusX = Math.ceil(fieldRadiusX);
  const radiusY = Math.ceil(fieldRadiusY);
  const sizeX = radiusX * 2 + 1;
  const sizeY = radiusY * 2 + 1;
  const values = new Float32Array(sizeX * sizeY);
  for (let y = -radiusY; y <= radiusY; y++) {
    for (let x = -radiusX; x <= radiusX; x++) {
      const d = Math.sqrt((x / fieldRadiusX) ** 2 + (y / fieldRadiusY) ** 2);
      values[(y + radiusY) * sizeX + x + radiusX] = spriteAlphaAt(d);
    }
  }
  return { radiusX, radiusY, sizeX, sizeY, values };
}

export function TypographicField() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Stable initial empty rows so the SSR HTML matches first paint and
  // there's no hydration mismatch.
  const initialRows = useMemo(() => Array.from({ length: ROWS }, () => ""), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Build palette + brightness lookup on the client only.
    const palette = buildPalette();
    const lookup = buildBrightnessLookup(palette);

    // Allocate the brightness field + stamps + particles.
    const brightnessField = new Float32Array(FIELD_COLS * FIELD_ROWS);
    const particleStamp = createFieldStamp(SPRITE_R);
    const largeStamp = createFieldStamp(LARGE_ATTRACTOR_R);
    const smallStamp = createFieldStamp(ATTRACTOR_R);

    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_N; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 40 + 20;
      particles.push({
        x: CANVAS_W / 2 + Math.cos(angle) * radius,
        y: CANVAS_H / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
      });
    }

    function splat(centerX: number, centerY: number, stamp: FieldStamp) {
      const gridCenterX = Math.round(centerX * FIELD_SCALE_X);
      const gridCenterY = Math.round(centerY * FIELD_SCALE_Y);
      for (let y = -stamp.radiusY; y <= stamp.radiusY; y++) {
        const gy = gridCenterY + y;
        if (gy < 0 || gy >= FIELD_ROWS) continue;
        const fieldRowOffset = gy * FIELD_COLS;
        const stampRowOffset = (y + stamp.radiusY) * stamp.sizeX;
        for (let x = -stamp.radiusX; x <= stamp.radiusX; x++) {
          const gx = gridCenterX + x;
          if (gx < 0 || gx >= FIELD_COLS) continue;
          const v = stamp.values[stampRowOffset + x + stamp.radiusX]!;
          if (v === 0) continue;
          const idx = fieldRowOffset + gx;
          brightnessField[idx] = Math.min(1, brightnessField[idx]! + v);
        }
      }
    }

    // Build per-row container DOM upfront, then mutate innerHTML each frame.
    container.innerHTML = "";
    const rowNodes: HTMLDivElement[] = [];
    for (let row = 0; row < ROWS; row++) {
      const div = document.createElement("div");
      div.className = "lobby-tf-row";
      div.style.height = `${LINE_HEIGHT}px`;
      div.style.lineHeight = `${LINE_HEIGHT}px`;
      container.appendChild(div);
      rowNodes.push(div);
    }

    let raf = 0;

    function step(now: number) {
      const a1x = Math.cos(now * 0.0007) * CANVAS_W * 0.25 + CANVAS_W / 2;
      const a1y = Math.sin(now * 0.0011) * CANVAS_H * 0.3 + CANVAS_H / 2;
      const a2x = Math.cos(now * 0.0013 + Math.PI) * CANVAS_W * 0.2 + CANVAS_W / 2;
      const a2y = Math.sin(now * 0.0009 + Math.PI) * CANVAS_H * 0.25 + CANVAS_H / 2;

      // Move particles toward the nearest attractor.
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;
        const d1x = a1x - p.x;
        const d1y = a1y - p.y;
        const d2x = a2x - p.x;
        const d2y = a2y - p.y;
        const dist1 = d1x * d1x + d1y * d1y;
        const dist2 = d2x * d2x + d2y * d2y;
        const ax = dist1 < dist2 ? d1x : d2x;
        const ay = dist1 < dist2 ? d1y : d2y;
        const dist = Math.sqrt(Math.min(dist1, dist2)) + 1;
        const force = dist1 < dist2 ? ATTRACTOR_FORCE_1 : ATTRACTOR_FORCE_2;
        p.vx += (ax / dist) * force;
        p.vy += (ay / dist) * force;
        p.vx += (Math.random() - 0.5) * 0.25;
        p.vy += (Math.random() - 0.5) * 0.25;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -SPRITE_R) p.x += CANVAS_W + SPRITE_R * 2;
        if (p.x > CANVAS_W + SPRITE_R) p.x -= CANVAS_W + SPRITE_R * 2;
        if (p.y < -SPRITE_R) p.y += CANVAS_H + SPRITE_R * 2;
        if (p.y > CANVAS_H + SPRITE_R) p.y -= CANVAS_H + SPRITE_R * 2;
      }

      // Decay then re-stamp the brightness field.
      for (let i = 0; i < brightnessField.length; i++) {
        brightnessField[i] = brightnessField[i]! * FIELD_DECAY;
      }
      for (let i = 0; i < particles.length; i++) {
        splat(particles[i]!.x, particles[i]!.y, particleStamp);
      }
      splat(a1x, a1y, largeStamp);
      splat(a2x, a2y, smallStamp);

      // Resolve to characters per row, with FIELD_OVERSAMPLE pooling.
      for (let row = 0; row < ROWS; row++) {
        let html = "";
        const fieldRowStart = row * FIELD_OVERSAMPLE * FIELD_COLS;
        for (let col = 0; col < COLS; col++) {
          const fieldColStart = col * FIELD_OVERSAMPLE;
          let brightness = 0;
          for (let sy = 0; sy < FIELD_OVERSAMPLE; sy++) {
            const sampleRowOffset = fieldRowStart + sy * FIELD_COLS + fieldColStart;
            for (let sx = 0; sx < FIELD_OVERSAMPLE; sx++) {
              brightness += brightnessField[sampleRowOffset + sx]!;
            }
          }
          const byte = Math.min(
            255,
            ((brightness / (FIELD_OVERSAMPLE * FIELD_OVERSAMPLE)) * 255) | 0,
          );
          html += lookup[byte]!.propHtml;
        }
        rowNodes[row]!.innerHTML = html;
      }

      if (!reduced) raf = requestAnimationFrame(step);
    }

    // Reduced-motion: render exactly one frame at t=0 and stop the loop.
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="presentation"
      aria-hidden="true"
      className="lobby-tf"
    >
      {/* Initial render is empty rows; useEffect mutates them on mount.
          We don't render any character HTML at SSR — would be useless
          without the brightness field, and would just inflate the byte
          count. The container reserves layout space via line-height. */}
      {initialRows.map((_, i) => (
        <div
          key={i}
          className="lobby-tf-row"
          style={{ height: `${LINE_HEIGHT}px`, lineHeight: `${LINE_HEIGHT}px` }}
        />
      ))}
      <style>{`
        .lobby-tf {
          font-family: ${PROP_FAMILY};
          font-size: ${FONT_SIZE}px;
          line-height: ${LINE_HEIGHT}px;
          width: ${TARGET_ROW_W}px;
          max-width: 100%;
          color: var(--color-ink);
          user-select: none;
          /* Sub-pixel antialiasing helps the lighter weights read
             without smearing the cream backdrop. */
          -webkit-font-smoothing: antialiased;
        }
        .lobby-tf-row {
          display: block;
          width: 100%;
          white-space: pre;
          font-family: inherit;
          font-size: inherit;
        }
        .lobby-tf .w3 { font-weight: 300; }
        .lobby-tf .w5 { font-weight: 500; }
        .lobby-tf .w8 { font-weight: 800; }
        .lobby-tf .it { font-style: italic; }
        /* Ten opacity steps. Solid ink, alpha varied. */
        .lobby-tf .a1  { color: rgba(26,24,23,0.10); }
        .lobby-tf .a2  { color: rgba(26,24,23,0.20); }
        .lobby-tf .a3  { color: rgba(26,24,23,0.30); }
        .lobby-tf .a4  { color: rgba(26,24,23,0.40); }
        .lobby-tf .a5  { color: rgba(26,24,23,0.50); }
        .lobby-tf .a6  { color: rgba(26,24,23,0.60); }
        .lobby-tf .a7  { color: rgba(26,24,23,0.70); }
        .lobby-tf .a8  { color: rgba(26,24,23,0.80); }
        .lobby-tf .a9  { color: rgba(26,24,23,0.90); }
        .lobby-tf .a10 { color: rgba(26,24,23,1.00); }
      `}</style>
    </div>
  );
}
