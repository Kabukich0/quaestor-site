/**
 * QUAESTOR wordmark — Cormorant Infant 400, per-character settle on
 * load via anime.js. Each <span> animates from translateY(14px) +
 * opacity 0 with a 25ms stagger and 360ms ease-out-expo settle.
 *
 * The intro lives on a single client-side timeline shared by Wordmark,
 * Taglines, and the hairline. Wordmark holds the 0–250ms slot.
 */
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

const TEXT = "QUAESTOR";

export function Wordmark() {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const letters = root.querySelectorAll(".lobby-wordmark-letter");
    if (!letters.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      letters.forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
        (el as HTMLElement).style.transform = "none";
      });
      return;
    }

    animate(letters, {
      opacity: [0, 1],
      translateY: [14, 0],
      delay: stagger(25),
      duration: 360,
      ease: "outExpo",
    });
  }, []);

  return (
    <h1
      ref={ref}
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
            display: "inline-block",
            opacity: 0,
            transform: "translateY(14px)",
            willChange: "transform, opacity",
          }}
        >
          {ch}
        </span>
      ))}
      <style>{`
        @media (max-width: 599px) {
          .lobby-wordmark {
            font-size: clamp(46px, 15vw, 72px) !important;
          }
        }
      `}</style>
    </h1>
  );
}
