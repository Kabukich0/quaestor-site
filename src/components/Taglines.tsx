/**
 * Latin tagline + English tagline + the oxblood hairline divider.
 * Both fade in on a delay; the hairline grows from 0px to 32px width.
 * All durations come from the spec and respect prefers-reduced-motion
 * via the global cascade in theme.css.
 */
export function Taglines() {
  return (
    <div className="lobby-taglines">
      <p
        className="lobby-tagline-latin"
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(20px, 1.8vw, 28px)",
          letterSpacing: "0.02em",
          color: "var(--color-muted)",
          marginTop: "16px",
          lineHeight: 1.3,
        }}
      >
        Qui custodiet ipsos custodes.
      </p>

      <div
        className="lobby-tagline-english-wrap"
        style={{ marginTop: "32px" }}
      >
        <span aria-hidden="true" className="lobby-hairline" />
        <p
          className="lobby-tagline-english"
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 400,
            fontSize: "clamp(13px, 0.9vw, 15px)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-muted)",
            marginTop: "16px",
            lineHeight: 1.5,
          }}
        >
          The audit office for the machine economy.
        </p>
      </div>

      <style>{`
        .lobby-tagline-latin {
          opacity: 0;
          animation: lobby-fade-in 600ms 400ms var(--ease-out-expo) both;
          will-change: opacity;
        }
        .lobby-hairline {
          display: block;
          width: 0px;
          height: 1px;
          background: var(--color-oxblood);
          animation: lobby-hairline-grow 800ms 1000ms var(--ease-out-expo) both;
          will-change: width;
        }
        .lobby-tagline-english {
          opacity: 0;
          animation: lobby-fade-in 600ms 1000ms var(--ease-out-expo) both;
          will-change: opacity;
        }
        @keyframes lobby-fade-in {
          to { opacity: 1; }
        }
        @keyframes lobby-hairline-grow {
          to { width: 32px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lobby-tagline-latin,
          .lobby-tagline-english {
            opacity: 1 !important;
            animation: none !important;
          }
          .lobby-hairline {
            width: 32px !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
