/**
 * Thin React wrapper around @chenglou/pretext for inline use. Lazy-imports
 * Pretext so SSR doesn't try to evaluate any DOM-touching internals at
 * build time. The actual layered landing page in pages/index.astro will
 * decide which children to feed in.
 *
 * Implementation deferred to the Layer 0 prompt — this stub keeps the
 * import surface stable so other components can reference it now.
 */
import type { ReactNode } from "react";

export interface PretextProps {
  children: ReactNode;
  /** Forwarded to the wrapping <div> */
  className?: string;
}

export function Pretext({ children, className }: PretextProps) {
  return <div className={className}>{children}</div>;
}
