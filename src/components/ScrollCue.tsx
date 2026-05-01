/**
 * Scroll cue at the foot of Layer 0.
 *
 * Anatomy: a 1px oxblood vertical rule (28px tall) with a slow scaleY
 * "breathing" pulse, plus a small mono ↓ glyph below it. Editorial,
 * not SaaS.
 *
 * Lifecycle:
 *   - Hidden until 2200ms (after the wordmark / hairline / Latin /
 *     English intro chain settles), then fades in to opacity 0.55.
 *   - As the user scrolls into Layer 1 (0 → ~60% of viewport height),
 *     opacity ramps to 0 so the cue doesn't fight the Thesis reveal.
 *   - Hidden entirely on phone — the layout already collapses.
 */
import { useEffect, useRef } from "react";
import { animate } from "animejs";

export default function ScrollCue() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      el.style.opacity = "0.55";
    } else {
      animate(el, {
        opacity: [0, 0.55],
        translateY: [4, 0],
        delay: 2200,
        duration: 700,
        ease: "outQuart",
      });
    }

    const baseOpacity = 0.55;
    const onScroll = () => {
      const sy = window.scrollY;
      const vh = window.innerHeight;
      const t = Math.min(sy / (vh * 0.6), 1);
      el.style.opacity = String(baseOpacity * (1 - t));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={ref} className="lobby-scroll-cue" aria-hidden="true">
      <span className="lobby-scroll-cue-rule" />
      <span className="lobby-scroll-cue-glyph">↓</span>

      <style>{`
        .lobby-scroll-cue {
          position: absolute;
          bottom: clamp(20px, 3vh, 36px);
          left: 50%;
          transform: translate(-50%, 4px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          opacity: 0;
          pointer-events: none;
          z-index: 2;
          will-change: opacity, transform;
        }
        .lobby-scroll-cue-rule {
          display: block;
          width: 1px;
          height: 28px;
          background: var(--color-oxblood);
          transform-origin: top;
          animation: lobby-scroll-cue-breathe 2400ms cubic-bezier(0.4, 0, 0.4, 1) infinite;
        }
        .lobby-scroll-cue-glyph {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          line-height: 1;
          letter-spacing: 0;
        }
        @keyframes lobby-scroll-cue-breathe {
          0%, 100% { transform: scaleY(1); opacity: 1; }
          50% { transform: scaleY(0.55); opacity: 0.45; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lobby-scroll-cue-rule { animation: none; }
        }
        @media (max-width: 599px) {
          .lobby-scroll-cue { display: none; }
        }
      `}</style>
    </div>
  );
}
