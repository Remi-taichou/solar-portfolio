import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vercel serves the site from the root of its address, so `base` is '/'.
// BASE_PATH can override it, for example to build a copy that lives in a subfolder.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
});
