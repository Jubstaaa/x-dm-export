import { createRequire } from 'node:module'
import { vi } from 'vitest'

process.env.TZ = 'UTC'

const require = createRequire(import.meta.url)
const sqlWasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')

vi.stubGlobal('chrome', { runtime: { getURL: () => sqlWasmPath } })
