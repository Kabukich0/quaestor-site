# quaestor-site

The audit office for the machine economy. Landing for [Quaestor](https://github.com/Kabukich0/quaestor-core).

[![CI](https://github.com/Kabukich0/quaestor-site/actions/workflows/ci.yml/badge.svg)](https://github.com/Kabukich0/quaestor-site/actions/workflows/ci.yml)

## Stack

- Astro 5 + React 19 (static output)
- Tailwind v4 (CSS-first via `@tailwindcss/vite`)
- [`@chenglou/pretext`](https://www.npmjs.com/package/@chenglou/pretext) for layout
- Self-hosted Cormorant Infant + JetBrains Mono. No CDN font requests at runtime.

## Design language

The visual medium is text. No images, no 3D, no gradients, no drop shadows.
Two fonts (Cormorant Infant for display, JetBrains Mono for everything else).
Two-color palette (cream `#f4ede0` background, ink `#1a1817` foreground) plus
oxblood `#7d2a1f` accent and sodium `#32d583` reserved for verification states.

See [`.claude/skills/quaestor-pretext-design/SKILL.md`](.claude/skills/quaestor-pretext-design/SKILL.md)
for the full vocabulary, layered-reveal pattern, and anti-pattern list. Used
in tandem with [Impeccable](https://github.com/pbakaus/impeccable) installed
under `.claude/skills/impeccable/`.

## Develop

```bash
pnpm install
pnpm dev      # http://127.0.0.1:4321
pnpm check    # astro check
pnpm typecheck
```

## License

MIT.
