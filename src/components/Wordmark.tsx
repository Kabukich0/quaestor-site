/**
 * QUAESTOR wordmark — Cormorant Infant 400, per-character settle on
 * load. Pure CSS animation: each <span> carries an --i index custom
 * property; animation-delay = calc(var(--i) * 54ms). Uses a soft
 * quint-out curve: slower than a button press, firmer than page confetti.
 *
 * Why CSS over Framer Motion here: the wordmark animation runs once
 * on mount and never again. CSS keeps the bundle smaller and avoids
 * any client-island hydration cost on the most prominent element.
 */
const TEXT = "QUAESTOR";

export function Wordmark() {
  return (
    <h1
      className="lobby-wordmark"
      aria-label={TEXT}
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 400,
        fontSize: "clamp(64px, 7.2vw, 116px)",
        letterSpacing: "0.035em",
        color: "var(--color-ink)",
        lineHeight: 1,
        margin: 0,
        whiteSpace: "nowrap",
      }}
    >
      {Array.from(TEXT).map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          aria-hidden="true"
          className="lobby-wordmark-letter"
          style={{
            // CSS custom property drives the per-letter stagger
            // through the `calc()` in the keyframe rule below.
            ["--i" as string]: i,
            display: "inline-block",
            willChange: "transform, opacity",
          }}
        >
          {ch}
        </span>
      ))}
      <style>{`
        .lobby-wordmark-letter {
          opacity: 0;
          transform: translateY(14px);
          animation: lobby-letter-settle 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: calc(var(--i, 0) * 54ms);
        }
        @keyframes lobby-letter-settle {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 599px) {
          .lobby-wordmark {
            font-size: clamp(46px, 15vw, 72px) !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .lobby-wordmark-letter {
            animation: lobby-letter-fade 400ms ease-out both;
            animation-delay: 0ms;
          }
          @keyframes lobby-letter-fade {
            to { opacity: 1; transform: none; }
          }
        }
      `}</style>
    </h1>
  );
}
