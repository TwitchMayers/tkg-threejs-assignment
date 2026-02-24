import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const base = process.env.GITHUB_ACTIONS ? `/${repository}/` : '/';

export default defineConfig({
  base,
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        parts123: resolve(__dirname, 'parts-1-3.html'),
        part4: resolve(__dirname, 'part-4.html'),
      },
    },
  },
});
