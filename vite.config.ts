import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const devPort = Number(env.VITE_DEV_PORT || 5173);
  const devHost = env.VITE_DEV_HOST || '127.0.0.1';

  const hmrProtocol = env.VITE_HMR_PROTOCOL || 'ws';
  const hmrHost = env.VITE_HMR_HOST || '127.0.0.1';
  const hmrClientPort = Number(env.VITE_HMR_CLIENT_PORT || devPort);
  return {
    server: {
      port: devPort,
      host: devHost,
      strictPort: true,
      hmr: {
        protocol: hmrProtocol,
        host: hmrHost,
        clientPort: hmrClientPort,
      },
    },
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      sourcemap: false
    }
  };
});
