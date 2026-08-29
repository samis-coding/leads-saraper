import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from 'tailwindcss';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [crx({ manifest })],
  css: { postcss: { plugins: [tailwindcss()] } },
  build: { target: 'esnext', minify: 'esbuild', sourcemap: true }
});
