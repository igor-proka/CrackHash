import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        port: 80,
        strictPort: true,
        proxy: {
            '/api/hash': {
                target: 'http://localhost:8082',
                changeOrigin: true,
            },
            '/api/monitoring': {
                target: 'http://localhost:8083',
                changeOrigin: true,
            },
        },
    },
});
