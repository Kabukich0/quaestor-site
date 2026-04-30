/**
 * Layer 0 / Lobby — composes Wordmark, Taglines, TypographicField,
 * NavLinks into the locked two-column layout. Above-the-fold only;
 * no scroll behaviour, no other interaction surface.
 *
 * Layout:
 *   - 100vh full viewport
 *   - flex two-column at >=768px: 40% wordmark stack | 60% typo field
 *   - phone collapse below 600px: no bust, centered wordmark stack
 *
 * Padding follows the spec's clamp(48px, 6vw, 96px).
 */
import { NavLinks } from "./NavLinks";
import OctavianBust from "./OctavianBust";
import { Taglines } from "./Taglines";
import { Wordmark } from "./Wordmark";

export function Lobby() {
  return (
    <main className="lobby-shell">
      <NavLinks />

      <div className="lobby-grid">
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
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: calc(100vh - clamp(96px, 12vw, 192px));
          gap: clamp(32px, 4vw, 64px);
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
