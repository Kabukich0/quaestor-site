/**
 * Layer 0 / Lobby — composes Wordmark, Taglines, OctavianBust,
 * MossBackdrop, NavLinks, and ScrollCue into the locked two-column
 * layout. Holds the first 100vh; on scroll the grid lifts and dims
 * so Layer 1 (Thesis) takes over without a hard cut.
 *
 * Layout:
 *   - 100vh full viewport
 *   - flex two-column at >=768px: 40% wordmark stack | 60% bust
 *   - phone collapse below 600px: no bust, centered wordmark stack
 *
 * Padding follows the spec's clamp(48px, 6vw, 96px). Scroll handler
 * is rAF-throttled and short-circuits when prefers-reduced-motion.
 */
import { useEffect, useRef } from "react";
import MossBackdrop from "./MossBackdrop";
import { NavLinks } from "./NavLinks";
import OctavianBust from "./OctavianBust";
import ScrollCue from "./ScrollCue";
import { Taglines } from "./Taglines";
import { Wordmark } from "./Wordmark";

export function Lobby() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const sy = window.scrollY;
      const vh = window.innerHeight;
      const p = Math.min(sy / vh, 1);
      grid.style.opacity = String(1 - p * 0.85);
      grid.style.transform = `translateY(${-p * 32}px)`;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(apply);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <main className="lobby-shell">
      <MossBackdrop />
      <NavLinks />

      <div ref={gridRef} className="lobby-grid">
        <section className="lobby-text" aria-labelledby="lobby-wordmark-label">
          <span id="lobby-wordmark-label" className="sr-only">
            Quaestor — the audit office for the machine economy.
          </span>
          <Wordmark />
          <Taglines />
        </section>

        <aside className="lobby-art-cell" aria-hidden="true">
          <OctavianBust />
        </aside>
      </div>

      <ScrollCue />

      <style>{`
        .lobby-shell {
          position: relative;
          min-height: 100vh;
          background: var(--color-cream);
          padding-inline: clamp(32px, 6vw, 96px);
          padding-block: clamp(48px, 6vw, 96px);
          box-sizing: border-box;
          overflow: hidden;
        }
        .lobby-grid {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: calc(100vh - clamp(96px, 12vw, 192px));
          gap: clamp(32px, 4vw, 64px);
          will-change: opacity, transform;
        }
        .lobby-text {
          flex: 0 0 40%;
          max-width: 40%;
        }
        .lobby-art-cell {
          flex: 0 0 60%;
          max-width: min(60%, 720px);
          height: min(60vw, 720px);
          max-height: 720px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
        }

        /* Tablet: keep the bust, but let it breathe above the copy. */
        @media (max-width: 767px) {
          .lobby-grid {
            flex-direction: column-reverse;
            align-items: flex-start;
          }
          .lobby-text,
          .lobby-art-cell {
            flex: 0 0 auto;
            max-width: 100%;
            width: 100%;
          }
          .lobby-art-cell {
            height: min(70vw, 520px);
          }
        }

        /* Phone: the bust becomes noise below 600px. Ship the confident
           centered inscription instead of forcing 7px typography. */
        @media (max-width: 599px) {
          .lobby-shell {
            padding-inline: 32px;
            padding-block: 64px;
          }
          .lobby-grid {
            min-height: calc(100vh - 128px);
            align-items: center;
            justify-content: center;
          }
          .lobby-text {
            text-align: center;
          }
          .lobby-art-cell {
            display: none;
          }
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </main>
  );
}
