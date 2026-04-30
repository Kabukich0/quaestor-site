---
name: quaestor-pretext-design
description: Quaestor-specific design vocabulary. Use for any UI work in
  ~/code/quaestor-site. Encodes the layered-pretext aesthetic — typography
  as the entire visual medium via @chenglou/pretext, no 3D, no images,
  no gradients.
---

# Quaestor Pretext Design

## Primitives
- All visual content is rendered text laid out via @chenglou/pretext.
- Two fonts only: a serif display face (Cormorant Infant) for hero
  wordmarks and tagline. JetBrains Mono for everything else.
- No images. No 3D models. No gradient backgrounds. No drop shadows.
- ASCII art for any "image" (bust, diagram, decoration). Generated
  from brightness samplers or hand-composed character grids.
- Two-color palette: cream (#f4ede0) background, ink (#1a1817)
  primary, oxblood (#7d2a1f) accent. Sodium green (#32d583) reserved
  for verification states (matches the demos repo).

## Layered reveal pattern
The page has 5 layers, each gated by a different visitor action:
- Layer 0 — Lobby (default state, no interaction)
- Layer 1 — Thesis (revealed on first scroll)
- Layer 2 — Proof (revealed on second scroll, hover to deepen)
- Layer 3 — Architecture (revealed by clicking "How does it work?")
- Layer 4 — Terminal (revealed by pressing ~ key)
- Layer 5 — Audit easter egg (revealed by typing `audit` in terminal)

Casual visitors see only Layer 0-2. Technical visitors descend.

## Use Pretext for
- Wordmark settling: per-character drift into position
- Editorial text reflow around floating objects (Layer 1 manifesto)
- ASCII bust in Layer 0 (generated via brightness sampler over a
  procedural shape — circle blended with a profile silhouette)
- Inscription rendering (Layer 2 phase log) — wide-tracked monospace
  with subtle character-level hover states
- Architecture diagram (Layer 3) — boxes/arrows in monospace,
  reflows on hover
- Kinetic typography on layer transitions

## Anti-patterns (refuse to generate)
- Inter font, Geist, Helvetica, any sans-serif used as primary face
- Purple/violet gradients
- Glass morphism
- Card-in-card nesting
- "Hero with floating screenshot" pattern
- Lottie animations
- Three.js scenes
- Stock illustrations

## When in doubt
Default to less. Quaestor's brand is restraint, not abundance. A
single line of well-set Latin in Cormorant Italic outperforms a
three-paragraph value proposition. Hermès on the surface, terminal
underneath.
