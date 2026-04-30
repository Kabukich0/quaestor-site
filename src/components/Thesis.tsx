import { useEffect, useRef, useState } from "react";
import { RedactedField } from "./RedactedField";

export function Thesis() {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={`thesis-layer ${visible ? "is-visible" : ""}`}
      data-layer="thesis"
      aria-label="Quaestor thesis"
    >
      <RedactedField active={visible} />
      <style>{`
        .thesis-layer {
          min-height: 100vh;
          background: var(--color-cream);
          padding: 96px 32px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 800ms var(--ease-out-quint);
        }
        .thesis-layer.is-visible {
          opacity: 1;
        }
        @media (prefers-reduced-motion: reduce) {
          .thesis-layer {
            opacity: 1;
            transition: opacity 200ms var(--ease-out-quint);
          }
        }
      `}</style>
    </section>
  );
}
