/**
 * Width-aware typographic bust for Layer 0.
 *
 * Ported from somnai-demos/variable-typographic-ascii: the character palette
 * is selected by BOTH glyph darkness and measured glyph width. Pretext's
 * prepareWithSegments is the width primitive; canvas alpha is the darkness
 * primitive. Unlike the animated demo, Quaestor's bust is intentionally stable:
 * the watermark should read like an archival impression, not a particle toy.
 */
import { prepareWithSegments } from "@chenglou/pretext";
import { useEffect, useMemo, useRef } from "react";

const COLS = 52;
const ROWS = 34;
const FONT_SIZE = 15;
const LINE_HEIGHT = 17;
const TARGET_ROW_W = 520;
const PROP_FAMILY = 'Georgia, Palatino, "Times New Roman", serif';
const CHARSET = ' .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const WEIGHTS = [300, 500, 800] as const;
const STYLES = ["normal", "italic"] as const;

type Style = (typeof STYLES)[number];

type PaletteEntry = {
  char: string;
  weight: number;
  style: Style;
  width: number;
  brightness: number;
};

function escHtml(ch: string) {
  if (ch === "<") return "&lt;";
  if (ch === ">") return "&gt;";
  if (ch === "&") return "&amp;";
  if (ch === '"') return "&quot;";
  return ch;
}

function weightClass(weight: number, style: Style) {
  const base = weight === 300 ? "w3" : weight === 500 ? "w5" : "w8";
  return style === "italic" ? `${base} it` : base;
}

function buildPalette(): PaletteEntry[] {
  const canvas = document.createElement("canvas");
  canvas.width = 28;
  canvas.height = 28;
  const maybeCtx = canvas.getContext("2d", { willReadFrequently: true });
  if (!maybeCtx) throw new Error("Typographic bust canvas unavailable");
  const ctx = maybeCtx;

  function estimateBrightness(ch: string, font: string) {
    ctx.clearRect(0, 0, 28, 28);
    ctx.font = font;
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, 1, 14);
    const data = ctx.getImageData(0, 0, 28, 28).data;
    let sum = 0;
    for (let i = 3; i < data.length; i += 4) sum += data[i]!;
    return sum / (255 * 28 * 28);
  }

  function measureWidth(ch: string, font: string) {
    const prepared = prepareWithSegments(ch, font);
    return prepared.widths.length ? prepared.widths[0]! : 0;
  }

  const palette: PaletteEntry[] = [];
  for (const style of STYLES) {
    for (const weight of WEIGHTS) {
      const font = `${style === "italic" ? "italic " : ""}${weight} ${FONT_SIZE}px ${PROP_FAMILY}`;
      for (const char of CHARSET) {
        if (char === " ") continue;
        const width = measureWidth(char, font);
        if (width <= 0) continue;
        palette.push({ char, weight, style, width, brightness: estimateBrightness(char, font) });
      }
    }
  }

  const maxBrightness = Math.max(...palette.map((p) => p.brightness));
  if (maxBrightness > 0) {
    for (const p of palette) p.brightness /= maxBrightness;
  }
  palette.sort((a, b) => a.brightness - b.brightness);
  return palette;
}

function buildLookup(palette: PaletteEntry[]) {
  const targetCellW = TARGET_ROW_W / COLS;
  return Array.from({ length: 256 }, (_, byte) => {
    const targetBrightness = byte / 255;
    if (targetBrightness < 0.035) return " ";
    let lo = 0;
    let hi = palette.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (palette[mid]!.brightness < targetBrightness) lo = mid + 1;
      else hi = mid;
    }
    let best = palette[lo]!;
    let bestScore = Infinity;
    for (let i = Math.max(0, lo - 18); i < Math.min(palette.length, lo + 18); i++) {
      const p = palette[i]!;
      const bErr = Math.abs(p.brightness - targetBrightness) * 2.8;
      const wErr = Math.abs(p.width - targetCellW) / targetCellW;
      const score = bErr + wErr;
      if (score < bestScore) {
        bestScore = score;
        best = p;
      }
    }
    const alpha = Math.max(1, Math.min(10, Math.round(targetBrightness * 10)));
    return `<span class="${weightClass(best.weight, best.style)} a${alpha}">${escHtml(best.char)}</span>`;
  });
}

function softStep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function ellipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  const d = Math.sqrt(dx * dx + dy * dy);
  return 1 - softStep(0.82, 1.02, d);
}

function bustBrightness(col: number, row: number) {
  const x = (col + 0.5) / COLS;
  const y = (row + 0.5) / ROWS;

  // Roman profile facing left, built from overlapping soft primitives.
  const skull = ellipse(x, y, 0.51, 0.33, 0.18, 0.21);
  const cranium = ellipse(x, y, 0.58, 0.29, 0.13, 0.15) * 0.82;
  const nose = ellipse(x, y, 0.35, 0.34, 0.055, 0.075) * 0.9;
  const brow = ellipse(x, y, 0.405, 0.285, 0.09, 0.035) * 0.75;
  const chin = ellipse(x, y, 0.415, 0.485, 0.09, 0.065) * 0.65;
  const neck = ellipse(x, y, 0.6, 0.58, 0.11, 0.2) * 0.7;
  const shoulder = ellipse(x, y, 0.62, 0.78, 0.32, 0.16) * 0.62;
  const hair = ellipse(x, y, 0.61, 0.18, 0.2, 0.08) * 0.35;

  let v = Math.max(skull, cranium, nose, brow, chin, neck, shoulder, hair);

  // Carve negative space for the face plane and under-neck so it reads as a bust.
  const faceCut = ellipse(x, y, 0.29, 0.42, 0.08, 0.19) * 0.55;
  const backCut = ellipse(x, y, 0.79, 0.52, 0.12, 0.34) * 0.45;
  v = Math.max(0, v - faceCut - backCut);

  // Incised planes, not decorative noise: eye, mouth, collar break.
  const eye = ellipse(x, y, 0.405, 0.335, 0.018, 0.01) * 0.45;
  const mouth = ellipse(x, y, 0.375, 0.45, 0.038, 0.012) * 0.35;
  const collar = ellipse(x, y, 0.52, 0.72, 0.22, 0.035) * 0.3;
  v = Math.max(0, v - eye - mouth - collar);

  // Subtle top-left light falloff gives the watermark dimensionality without gradients.
  const light = 0.72 + (1 - x) * 0.16 + (1 - y) * 0.08;
  return Math.max(0, Math.min(1, v * light));
}

export function TypographicField() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialRows = useMemo(() => Array.from({ length: ROWS }, () => ""), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const palette = buildPalette();
    const lookup = buildLookup(palette);

    container.innerHTML = "";
    for (let row = 0; row < ROWS; row++) {
      const div = document.createElement("div");
      div.className = "lobby-tf-row";
      div.style.height = `${LINE_HEIGHT}px`;
      div.style.lineHeight = `${LINE_HEIGHT}px`;
      let html = "";
      for (let col = 0; col < COLS; col++) {
        const b = bustBrightness(col, row);
        html += lookup[Math.min(255, Math.round(b * 255))]!;
      }
      div.innerHTML = html;
      container.appendChild(div);
    }
  }, []);

  return (
    <div ref={containerRef} role="presentation" aria-hidden="true" className="lobby-tf">
      {initialRows.map((_, i) => (
        <div key={i} className="lobby-tf-row" style={{ height: `${LINE_HEIGHT}px`, lineHeight: `${LINE_HEIGHT}px` }} />
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
          cursor: none;
          opacity: 0.62; /* tested against 0.55/0.60/0.65: 0.62 reads as a clear watermark without fighting the wordmark. */
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
