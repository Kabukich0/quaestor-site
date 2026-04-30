import { useMemo } from "react";

export type DeeoArtifactSlug =
  | "glyph-hover"
  | "typographic-waves"
  | "3d-type-sphere"
  | "type-grid-pulse"
  | "liquid-text-trail"
  | "attracting-letters";

interface DeeoArtifactProps {
  slug: DeeoArtifactSlug;
  width?: string;
  height?: string;
  hideControls?: boolean;
}

function buildFrameSrcDoc(slug: DeeoArtifactSlug, hideControls: boolean) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent;color:#1a1817;font-family:Georgia,serif;}
  canvas{display:block;background:transparent!important;}
  input,button,select,label,.dg,.lil-gui,[data-dialkit-root]{display:${hideControls ? "none" : ""}!important;}
  #fallback{position:absolute;inset:0;display:grid;place-items:center;color:#7d2a1f;font:400 12px/1.4 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;opacity:.7;}
</style>
</head>
<body>
<div id="fallback">Loading ${slug}</div>
<script type="module">
const fallback = document.getElementById('fallback');
const cleanup = new AbortController();
window.addEventListener('pagehide', () => cleanup.abort());

function patchBodySize() {
  Object.assign(document.documentElement.style,{width:'100%',height:'100%',background:'transparent'});
  Object.assign(document.body.style,{width:'100%',height:'100%',background:'transparent',overflow:'hidden'});
}

function patchThreeCode(code) {
  return code
    .replaceAll('window.innerWidth', 'document.body.clientWidth || innerWidth')
    .replaceAll('window.innerHeight', 'document.body.clientHeight || innerHeight')
    .replace('scene.background = new THREE.Color(0x000000);', 'scene.background = null;')
    .replace('const renderer = new THREE.WebGLRenderer({ antialias: true });', 'const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });')
    .replace('renderer.setSize(window.innerWidth, window.innerHeight);', 'renderer.setSize(document.body.clientWidth || innerWidth, document.body.clientHeight || innerHeight);')
    .replace('document.body.appendChild(renderer.domElement);', "document.body.appendChild(renderer.domElement); renderer.setClearColor(0x000000, 0);");
}

async function run() {
  patchBodySize();
  const res = await fetch('/artifacts/json/${slug}.json', { cache: 'no-store' });
  const config = await res.json();
  const experiment = config.experiment || config;
  const controls = { ...(experiment.controlValues || {}) };
  const code = experiment.code || '';
  if (!code) {
    fallback.textContent = '${slug}: no executable code in config';
    return;
  }

  if (experiment.renderer === 'three' || code.includes('THREE.')) {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
    window.THREE = THREE;
    fallback.remove();
    const fn = new Function('controls', '_cleanup', 'THREE', patchThreeCode(code));
    fn(controls, cleanup, THREE);
    return;
  }

  if (experiment.renderer === 'p5' || code.includes('new p5') || code.includes('p5.')) {
    await import('https://cdn.jsdelivr.net/npm/p5@1.7.0/lib/p5.min.js');
    fallback.remove();
    const fn = new Function('controls', '_cleanup', 'p5', code);
    fn(controls, cleanup, window.p5);
    return;
  }

  fallback.textContent = '${slug}: renderer isolated for v1; swap to 3d-type-sphere/type-grid-pulse for production';
}

run().catch((error) => {
  console.error('[DeeoArtifact:${slug}]', error);
  if (fallback) fallback.textContent = '${slug}: failed to load';
});
</script>
</body>
</html>`;
}

export function DeeoArtifact({
  slug,
  width = "100%",
  height = "100%",
  hideControls = true,
}: DeeoArtifactProps) {
  // DEEO's published renderer bundle is an Astro island shim that re-exports
  // hashed chunks not included in the two public URLs. For quaestor-site v1 we
  // use an isolated iframe runner instead: it executes the downloaded JSON's
  // artifact code with the expected globals (THREE/p5) and keeps third-party
  // canvases, listeners, and runtime cleanup outside the page's React tree.
  const srcDoc = useMemo(() => buildFrameSrcDoc(slug, hideControls), [slug, hideControls]);
  const sphereWords = [
    "AUDITUS",
    "CUSTODIA",
    "MANDATUM",
    "LEDGER",
    "PROBATIO",
    "SIGILLUM",
    "QUAESTOR",
    "IMPERIUM",
    "SCRIPTUM",
    "VERITAS",
    "CATENA",
    "OBSERVO",
  ];

  return (
    <div className="deeo-artifact" style={{ width, height }}>
      <iframe
        title={`DEEO artifact: ${slug}`}
        className="deeo-artifact-frame"
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-same-origin"
      />
      {slug === "3d-type-sphere" ? (
        <div className="deeo-sphere-fallback" aria-hidden="true">
          {sphereWords.map((word, index) => (
            <span
              key={word}
              style={{
                ["--i" as string]: index,
                ["--z" as string]: index % 3 === 0 ? 82 : index % 3 === 1 ? -50 : 24,
              }}
            >
              {word}
            </span>
          ))}
        </div>
      ) : null}
      <style>{`
        .deeo-artifact {
          position: relative;
          overflow: hidden;
          background: transparent;
        }
        .deeo-artifact-frame {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          background: transparent;
        }
        .deeo-sphere-fallback {
          position: absolute;
          inset: 12%;
          display: block;
          transform-style: preserve-3d;
          perspective: 900px;
          animation: deeo-quaestor-orbit 42s linear infinite;
          pointer-events: none;
          mix-blend-mode: multiply;
        }
        .deeo-sphere-fallback span {
          position: absolute;
          left: 50%;
          top: 50%;
          font-family: var(--font-mono);
          font-size: clamp(10px, 1vw, 15px);
          letter-spacing: 0.16em;
          color: var(--color-oxblood);
          opacity: 0.74;
          white-space: nowrap;
          transform:
            rotateY(calc(var(--i) * 31deg))
            rotateX(calc(var(--i) * 17deg))
            translateZ(calc(var(--z) * 1px))
            translate(-50%, -50%);
        }
        @keyframes deeo-quaestor-orbit {
          from { transform: rotateX(-10deg) rotateY(0deg); }
          to { transform: rotateX(-10deg) rotateY(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .deeo-sphere-fallback { animation: none; }
        }
      `}</style>
    </div>
  );
}
