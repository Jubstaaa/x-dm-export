import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

import manifest from './manifest.config.ts'

export default defineConfig({
    plugins: [react(), tailwindcss(), crx({ manifest })],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
    server: {
        port: 5174,
        strictPort: true,
        ws: { port: 5174 },
    },
    test: {
        include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
        setupFiles: ['./vitest.setup.ts'],
    },
})
