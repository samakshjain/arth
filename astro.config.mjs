import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  build: {
    format: 'directory',
  },
  vite: {
    resolve: {
      alias: {
        '@': '/src',
      },
    },

    plugins: [tailwindcss()],
  },
  server: {
    allowedHosts: ['example.com'],
  },
});
