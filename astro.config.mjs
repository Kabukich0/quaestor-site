import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Astro 5 + React 19 + Tailwind v4 (CSS-first via @tailwindcss/vite).
// No SSR adapter — static output is right for a landing page.
export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 4321,
    host: '127.0.0.1',
  },
});
