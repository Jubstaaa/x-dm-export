import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    publicDir: path.resolve(import.meta.dirname, '../../public'),
    resolve: {
        alias: { '@': path.resolve(import.meta.dirname, '../../src') },
    },
    root: import.meta.dirname,
    server: { port: 5181, strictPort: true },
})
