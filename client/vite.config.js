import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, '..', '');
  return {
    plugins: [react()],
    // Lets local development reuse the server's Google client ID without
    // duplicating it in a second tracked configuration file.
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(rootEnv.VITE_GOOGLE_CLIENT_ID || rootEnv.GOOGLE_CLIENT_ID || ''),
    },
  };
});
