import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const proxyTarget = env.VITE_API_PROXY_TARGET ?? 'http://localhost:3001';

    return {
        plugins: [react(), tailwindcss()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            proxy: {
                '/api': {
                    target: proxyTarget,
                    changeOrigin: true,
                },
                '/docs': {
                    target: proxyTarget,
                    changeOrigin: true,
                },
                '/health': {
                    target: proxyTarget,
                    changeOrigin: true,
                },
                // Auth endpoints live under /auth on the backend. Proxy the specific
                // API paths but NOT /auth/callback, which is a client-side SPA route.
                '/auth/google': {
                    target: proxyTarget,
                    changeOrigin: true,
                },
                '/auth/github': {
                    target: proxyTarget,
                    changeOrigin: true,
                },
                '/auth/refresh': {
                    target: proxyTarget,
                    changeOrigin: true,
                },
                '/auth/logout': {
                    target: proxyTarget,
                    changeOrigin: true,
                },
                '/auth/dev-login': {
                    target: proxyTarget,
                    changeOrigin: true,
                },
            },
        },
    };
});
