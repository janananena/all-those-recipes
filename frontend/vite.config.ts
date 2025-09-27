import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
    const backendHost = process.env.HOSTNAME || "localhost";

    return {
        base: '/all-recipes/',
        plugins: [react()],
        server: {
            host: true,
            proxy: {
                '/api': {
                    target: `http://${backendHost}:3010`,
                    changeOrigin: true,
                    secure: false,
                },
                '/uploads': {
                    target: `http://${backendHost}:3010`,
                    changeOrigin: true,
                    secure: false,
                },
                '/shopping-lists': {
                    target: `http://${backendHost}:3010`,
                    changeOrigin: true,
                    secure: false,
                }
            }
        }
    }
})
