/**
 * QUAESTOR wordmark — Cormorant Infant 400, per-character settle on
 * load. Pure CSS animation: each <span> carries an --i index custom
 * property; animation-delay = calc(var(--i) * 80ms). Uses out-expo
 * easing per the motion-design reference.
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
        fontSize: "clamp(72px, 8vw, 128px)",
        letterSpacing: "0.04em",
        color: "var(--color-ink)",
        lineHeight: 1,
        margin: 0,
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
          transform: translateY(20px);
          animation: lobby-letter-settle 400ms var(--ease-out-expo) both;
          animation-delay: calc(var(--i, 0) * 80ms);
        }
        @keyframes lobby-letter-settle {
          to {
            opacity: 1;
            transform: translateY(0);
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
