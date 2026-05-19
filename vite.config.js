import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        // Optional: slightly increase the warning limit if needed
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        // Put React and Router in one chunk
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                            return 'react-vendor';
                        }
                        // Put heavy third-party libraries in their own chunks
                        if (id.includes('react-quill') || id.includes('quill')) {
                            return 'quill-vendor';
                        }
                        if (id.includes('lucide-react')) {
                            return 'lucide-vendor';
                        }
                        // Catch-all for other dependencies
                        return 'vendor';
                    }
                }
            }
        }
    }
})