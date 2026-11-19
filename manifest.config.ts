import { defineManifest } from '@crxjs/vite-plugin'

import pkg from './package.json' with { type: 'json' }

const icons = {
    '16': 'icon-16.png',
    '32': 'icon-32.png',
    '48': 'icon-48.png',
    '128': 'icon-128.png',
}

// The MV3 default also allows http://localhost:* and 'wasm-unsafe-eval' on extension pages.
// The popup needs neither (sql.js runs in the content script), but Vite's dev server does.
const EXTENSION_PAGES_CSP =
    "script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"

export default defineManifest(({ mode }) => ({
    manifest_version: 3,
    name: 'DM Export for X – Save Your Chats',
    version: pkg.version,
    description:
        'Export your X (Twitter) DMs, including encrypted chats, to HTML, JSON and text. Everything stays on your device.',
    minimum_chrome_version: '116',
    ...(mode === 'production' && {
        content_security_policy: { extension_pages: EXTENSION_PAGES_CSP },
    }),
    permissions: ['activeTab'],
    host_permissions: ['https://x.com/*'],
    icons,
    action: {
        default_popup: 'index.html',
        default_title: 'DM Export for X',
        default_icon: icons,
    },
    content_scripts: [
        {
            matches: ['https://x.com/*'],
            js: ['src/content/content.tsx'],
            run_at: 'document_idle',
        },
    ],
}))
