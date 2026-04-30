import { prepareWithSegments } from "@chenglou/pretext";
import { useEffect, useRef, useState } from "react";
import {
  createInitialBlocks,
  stepBlocks,
  type RedactedBlockState,
} from "../lib/redacted-physics";
import { layoutSegmentedParagraphs, type SegmentLine } from "../lib/pretext-segment-layout";

const MANIFESTO_PARAGRAPHS = [
  "Every AI agent that handles money will eventually be wrong about something. The question is not whether to trust the agent, but who controls the proof when it errs.",
  "Quaestor is the local-first mandate engine and audit ledger. Mandates are signed authorizations, scoped and time-bound. The audit ledger is cryptographically chained on the user's own machine. No third party holds the keys. No third party holds the proof.",
];

const COLUMN_WIDTH = 880;
const LINE_HEIGHT = 58.9;
const PARAGRAPH_GAP = LINE_HEIGHT * 1.5;
const BODY_FONT = '400 38px "Cormorant Infant", Georgia, serif';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function RedactedField({ active }: { active: boolean }) {
  const reducedMotion = useReducedMotion();
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const [blocks, setBlocks] = useState<RedactedBlockState[]>(() =>
    createInitialBlocks(COLUMN_WIDTH, 520),
  );
  const [lines, setLines] = useState<SegmentLine[]>([]);
  const [prepared, setPrepared] = useState<
    { prepared: ReturnType<typeof prepareWithSegments>; paragraphIndex: number }[]
  >([]);
  const frameTimesRef = useRef<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function prepareText() {
      await document.fonts.ready;
      if (cancelled) return;
      setPrepared(
        MANIFESTO_PARAGRAPHS.map((text, paragraphIndex) => ({
          prepared: prepareWithSegments(text, BODY_FONT, { letterSpacing: 0.38 }),
          paragraphIndex,
        })),
      );
    }
    void prepareText();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const node = fieldRef.current;
    if (!node) return;

    const field = node;
    function updatePointer(event: PointerEvent) {
      const rect = field.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: event.pointerType !== "touch",
      };
    }
    function clearPointer() {
      pointerRef.current.active = false;
    }

    node.addEventListener("pointermove", updatePointer);
    node.addEventListener("pointerleave", clearPointer);
    return () => {
      node.removeEventListener("pointermove", updatePointer);
      node.removeEventListener("pointerleave", clearPointer);
    };
  }, []);

  useEffect(() => {
    if (!active || prepared.length === 0) return;
    let raf = 0;
    let currentBlocks = blocks;

    function render(now: number) {
      const t0 = performance.now();
      currentBlocks = stepBlocks(
        currentBlocks,
        { width: COLUMN_WIDTH, height: 520 },
        pointerRef.current,
        now,
        reducedMotion,
      );
      const nextLines = layoutSegmentedParagraphs({
        paragraphs: prepared,
        columnWidth: COLUMN_WIDTH,
        lineHeight: LINE_HEIGHT,
        paragraphGap: PARAGRAPH_GAP,
        obstacles: currentBlocks.map(({ x, y, w, h }) => ({ x, y, w, h })),
        maxHeight: 520,
      });
      const elapsed = performance.now() - t0;
      frameTimesRef.current.push(elapsed);
      if (frameTimesRef.current.length > 240) frameTimesRef.current.shift();
      (window as unknown as { __quaestorFrameTimes?: number[] }).__quaestorFrameTimes = [
        ...frameTimesRef.current,
      ];
      setBlocks(currentBlocks);
      setLines(nextLines);
      if (!reducedMotion) raf = requestAnimationFrame(render);
    }

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [active, prepared, reducedMotion]);

  return (
    <div ref={fieldRef} className="redacted-field" aria-hidden="false">
      <div className="sr-only" aria-live="off">
        {MANIFESTO_PARAGRAPHS.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <div className="redacted-lines" aria-hidden="true">
        {lines.map((line, index) => (
          <span
            key={`${line.paragraphIndex}-${index}-${line.x}-${line.y}`}
            className="redacted-line"
            style={{
              left: `${line.x}px`,
              top: `${line.y}px`,
              width: `${line.width}px`,
              textAlign:
                line.lastInParagraph || line.text.length < 18 ? "left" : "justify",
            }}
          >
            {line.text}
          </span>
        ))}
      </div>
      {blocks.map((block) => (
        <span
          key={block.id}
          role="presentation"
          aria-hidden="true"
          className="redacted-block"
          style={{
            width: `${block.w}px`,
            height: `${block.h}px`,
            transform: `translate3d(${block.x}px, ${block.y}px, 0)`,
            transitionDelay: `${200 + block.id * 80}ms`,
          }}
        />
      ))}
      <style>{`
        .redacted-field {
          position: relative;
          width: min(880px, calc(100vw - 64px));
          height: min(520px, calc(100vh - 192px));
          margin: 0 auto;
          cursor: default;
          contain: layout paint style;
        }
        .redacted-lines {
          position: absolute;
          inset: 0;
        }
        .redacted-line {
          position: absolute;
          display: block;
          white-space: nowrap;
          font-family: var(--font-display);
          font-size: clamp(28px, 2.4vw, 38px);
          font-weight: 400;
          line-height: 1.55;
          letter-spacing: 0.01em;
          color: var(--color-ink);
          text-align-last: left;
          user-select: text;
        }
        .redacted-line::after {
          content: "";
          display: inline-block;
          width: 100%;
        }
        .redacted-block {
          position: absolute;
          left: 0;
          top: 0;
          display: block;
          background: var(--color-oxblood);
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-stone) 60%, transparent);
          opacity: 0;
          animation: redacted-block-in 520ms var(--ease-out-quint) forwards;
          will-change: transform;
          z-index: 2;
        }
        @keyframes redacted-block-in {
          to { opacity: 1; }
        }
        @media (max-width: 700px) {
          .redacted-field {
            width: min(100%, calc(100vw - 48px));
            height: min(620px, calc(100vh - 128px));
          }
        }
      `}</style>
    </div>
  );
}

export { MANIFESTO_PARAGRAPHS };
