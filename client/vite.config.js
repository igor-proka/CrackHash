import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite слушает 80 порт внутри контейнера, чтобы compose мог открыть клиент на http://localhost.
export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // Слушаем все интерфейсы внутри контейнера.
        port: 80,
        strictPort: true,
    }
})
