/**
 * Latin tagline + English tagline + the oxblood hairline divider.
 *
 * Animation timing (all client-side via anime.js, single intro timeline):
 *   350–900ms:  hairline draws from 0 → 32px width
 *   700–1140ms: Latin tagline word stagger fade-up (3 words, 80ms apart)
 *   1100–1900ms: English caption typewriter (per-char 18ms stagger)
 *
 * Reduced-motion: every element snaps to its final state on mount.
 */
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

const LATIN = "Qui custodiet ipsos custodes.";
const ENGLISH = "The audit office for the machine economy.";

export function Taglines() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const latinWords = root.querySelectorAll<HTMLElement>(".lobby-latin-word");
    const hairline = root.querySelector<HTMLElement>(".lobby-hairline");
    const englishChars = root.querySelectorAll<HTMLElement>(".lobby-english-char");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      latinWords.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      if (hairline) hairline.style.width = "32px";
      englishChars.forEach((el) => {
        el.style.opacity = "1";
      });
      return;
    }

    if (hairline) {
      animate(hairline, {
        width: [0, 32],
        delay: 350,
        duration: 550,
        ease: "outQuart",
      });
    }

    animate(latinWords, {
      opacity: [0, 1],
      translateY: [4, 0],
      delay: stagger(80, { start: 700 }),
      duration: 360,
      ease: "outQuart",
    });

    animate(englishChars, {
      opacity: [0, 1],
      delay: stagger(18, { start: 1100 }),
      duration: 220,
      ease: "outQuad",
    });
  }, []);

  const latinWords = LATIN.split(" ");
  const englishChars = Array.from(ENGLISH);

  return (
    <div ref={ref} className="lobby-taglines">
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
        {latinWords.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="lobby-latin-word"
            style={{
              display: "inline-block",
              opacity: 0,
              transform: "translateY(4px)",
              willChange: "transform, opacity",
              whiteSpace: "pre",
            }}
          >
            {word}
            {i < latinWords.length - 1 ? " " : ""}
          </span>
        ))}
      </p>

      <div
        className="lobby-tagline-english-wrap"
        style={{ marginTop: "32px", cursor: "text" }}
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
            cursor: "text",
          }}
        >
          {englishChars.map((ch, i) => (
            <span
              key={i}
              className="lobby-english-char"
              style={{
                display: "inline-block",
                opacity: 0,
                whiteSpace: "pre",
                willChange: "opacity",
              }}
            >
              {ch}
            </span>
          ))}
        </p>
      </div>

      <style>{`
        .lobby-hairline {
          display: block;
          width: 0px;
          height: 1px;
          background: var(--color-oxblood);
          will-change: width;
        }
      `}</style>
    </div>
  );
}
