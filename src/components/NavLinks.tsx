/**
 * Top-right corner of Layer 0 — GitHub + Notify. JetBrains Mono 12px,
 * uppercase, wide-tracked. No box, no underline, no button.
 *
 * The middle dot separator is its own span (color: stone) so the link
 * targets stay tightly bracketed by the visual boundary; hover only
 * changes the link itself, not the divider.
 */
export function NavLinks() {
  return (
    <nav
      aria-label="Primary"
      className="absolute top-8 right-12 flex items-center gap-3 font-mono text-[12px] uppercase"
      style={{
        letterSpacing: "0.1em",
        color: "var(--color-muted)",
      }}
    >
      <a
        href="https://github.com/Kabukich0/quaestor-core"
        target="_blank"
        rel="noopener noreferrer"
        className="lobby-nav-link"
      >
        GitHub
      </a>
      <span aria-hidden="true" style={{ color: "var(--color-stone)" }}>
        ·
      </span>
      <a href="#" className="lobby-nav-link">
        Notify
      </a>
      <style>{`
        .lobby-nav-link {
          position: relative;
          cursor: pointer;
          text-decoration: none;
          transition: color 200ms var(--ease-out-quart);
        }
        .lobby-nav-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -6px;
          height: 1px;
          background: var(--color-oxblood);
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 200ms var(--ease-out-quart);
        }
        .lobby-nav-link:hover,
        .lobby-nav-link:focus-visible {
          color: var(--color-oxblood);
          outline: none;
        }
        .lobby-nav-link:hover::after,
        .lobby-nav-link:focus-visible::after {
          transform: scaleX(1);
        }
      `}</style>
    </nav>
  );
}
