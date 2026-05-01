/**
 * Layer 0 / right column — Octavian bust, slowly rotating (0.5°/s,
 * one revolution every twelve minutes — ambient, not animated).
 *
 * Wraps Google's <model-viewer> custom element. The component dynamically
 * imports the module on the client so it never runs during SSR (the
 * underlying library expects a real `window`). The GLB lives at
 * /bust/octavian.glb and is the Hunyuan-generated marble portrait.
 *
 * Reduced-motion: a second effect strips the auto-rotate attribute on
 * mount so the bust sits still for users who request reduced motion.
 */
import { useEffect, useRef } from "react";

export default function OctavianBust() {
  const viewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced && viewerRef.current) {
      viewerRef.current.removeAttribute("auto-rotate");
    }
  }, []);

  return (
    <div className="octavian-bust">
      {/* @ts-ignore — model-viewer is a custom element, typed via shim */}
      <model-viewer
        ref={viewerRef}
        src="/bust/octavian.glb"
        alt="Octavian, magistrate of Quaestor"
        auto-rotate
        auto-rotate-delay="0"
        rotation-per-second="0.5deg"
        interaction-prompt="none"
        disable-zoom
        disable-pan
        disable-tap
        shadow-intensity="0.5"
        shadow-softness="0.85"
        environment-image="neutral"
        exposure="1.2"
        min-camera-orbit="auto auto 0.1m"
        max-camera-orbit="auto auto 3m"
        camera-orbit="0deg 78deg 2.7m"
        camera-target="0m 0.55m 0m"
        field-of-view="26deg"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
          ["--poster-color" as string]: "transparent",
        }}
      />

      <style>{`
        .octavian-bust {
          position: relative;
          width: 100%;
          height: 100%;
          max-width: 420px;
          max-height: 560px;
          aspect-ratio: 4 / 5;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 600px) {
          .octavian-bust { display: none; }
        }
      `}</style>
    </div>
  );
}
