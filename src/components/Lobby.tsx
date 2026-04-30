/**
 * Layer 0 / Lobby — composes Wordmark, Taglines, TypographicField,
 * NavLinks into the locked two-column layout. Above-the-fold only;
 * no scroll behaviour, no other interaction surface.
 *
 * Layout:
 *   - 100vh full viewport
 *   - flex two-column at >=768px: 40% wordmark stack | 60% typo field
 *   - single-column collapse at <768px: field above, smaller scale
 *
 * Padding follows the spec's clamp(48px, 6vw, 96px).
 */
import { NavLinks } from "./NavLinks";
import { Taglines } from "./Taglines";
import { TypographicField } from "./TypographicField";
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
          <TypographicField />
        </aside>
      </div>

      <style>{`
        .lobby-shell {
          position: relative;
          min-height: 100vh;
          background: var(--color-cream);
          padding-inline: clamp(48px, 6vw, 96px);
          padding-block: clamp(48px, 6vw, 96px);
          box-sizing: border-box;
          overflow: hidden;
        }
        .lobby-grid {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: calc(100vh - clamp(96px, 12vw, 192px));
          gap: clamp(24px, 4vw, 64px);
        }
        .lobby-text {
          flex: 0 0 40%;
          max-width: 40%;
        }
        .lobby-art-cell {
          flex: 0 0 60%;
          max-width: 60%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Single-column collapse below 768px — typographic field above
           the wordmark stack, smaller scale to keep it from dominating. */
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
          .lobby-art-cell .lobby-tf {
            font-size: 11px !important;
            line-height: 13px !important;
            transform: scale(0.85);
            transform-origin: top left;
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
