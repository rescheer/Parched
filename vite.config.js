import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // eslint-disable-next-line no-undef
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  base: '/Parched/',
});
