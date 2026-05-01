/**
 * Layer 0 / background — dimmed moss bust as full-bleed backdrop.
 *
 * Sits behind the wordmark, taglines, and the foreground OctavianBust.
 * Pure decoration, aria-hidden, pointer-events disabled so it never
 * interferes with the foreground bust's auto-rotate or any future
 * interaction. Low opacity so the cream background still dominates.
 *
 * Mouse parallax: we leave model-viewer's auto-rotate intact and
 * additionally translate the wrapper ±10px on the X axis based on
 * cursor position. Two motion sources don't fight because the camera
 * orbit and the CSS transform compose. anime.js drives a smooth
 * spring-ish ease into each new target rather than jittering on every
 * pointer event.
 */
import { useEffect, useRef } from "react";
import { animate } from "animejs";

export default function MossBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  useEffect(() => {
    const wrapper = ref.current;
    if (!wrapper) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    let pending: { x: number; y: number } | null = null;

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pending = { x: nx, y: ny };
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!pending) return;
        const { x, y } = pending;
        pending = null;
        animate(wrapper, {
          translateX: x * 14,
          translateY: y * 8,
          duration: 800,
          ease: "outQuart",
        });
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="moss-backdrop" aria-hidden="true">
      {/* @ts-ignore — model-viewer is a custom element, typed via shim */}
      <model-viewer
        src="/bust/octavian-moss.glb"
        alt=""
        auto-rotate
        auto-rotate-delay="0"
        rotation-per-second="1deg"
        interaction-prompt="none"
        disable-zoom
        disable-pan
        disable-tap
        shadow-intensity="0"
        environment-image="neutral"
        exposure="1.0"
        camera-orbit="0deg 80deg 1.8m"
        camera-target="0m 0.45m 0m"
        field-of-view="38deg"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
          ["--poster-color" as string]: "transparent",
        }}
      />

      <style>{`
        .moss-backdrop {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0.09;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: saturate(0.85);
          will-change: transform;
        }
        @media (max-width: 599px) {
          .moss-backdrop { display: none; }
        }
      `}</style>
    </div>
  );
}
