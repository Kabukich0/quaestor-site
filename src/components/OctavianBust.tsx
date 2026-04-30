/**
 * Layer 0 / right column — static Octavian bust.
 *
 * Wraps Google's <model-viewer> custom element. The component dynamically
 * imports the module on the client so it never runs during SSR (the
 * underlying library expects a real `window`). The GLB lives at
 * /bust/octavian.glb and is the Hunyuan-generated marble portrait.
 *
 * Pure presentation — no interaction beyond the slow auto-rotate.
 */
import { useEffect } from "react";

export default function OctavianBust() {
  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  return (
    <div className="octavian-bust">
      {/* @ts-ignore — model-viewer is a custom element, typed via shim */}
      <model-viewer
        src="/bust/octavian.glb"
        alt="Octavian, magistrate of Quaestor"
        auto-rotate
        auto-rotate-delay="0"
        rotation-per-second="2deg"
        interaction-prompt="none"
        disable-zoom
        disable-pan
        disable-tap
        shadow-intensity="0"
        shadow-softness="0.85"
        environment-image="legacy"
        exposure="3.5"
        camera-orbit="0deg 88deg 420m"
        camera-target="0m 78m 0m"
        min-camera-orbit="auto auto 100m"
        max-camera-orbit="auto auto 600m"
        field-of-view="20deg"
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
          max-width: 520px;
          max-height: 680px;
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
