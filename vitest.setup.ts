import { createRequire } from 'node:module'

import { vi } from 'vitest'

// Renderers format local dates; pin the zone so expectations are stable on any machine.
process.env.TZ = 'UTC'

const require = createRequire(import.meta.url)
const sqlWasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')

// sql.js locates its wasm through chrome.runtime.getURL in the extension.
vi.stubGlobal('chrome', { runtime: { getURL: () => sqlWasmPath } })
