import { defineManifest } from '@crxjs/vite-plugin'

import pkg from './package.json' with { type: 'json' }

const icons = {
    '16': 'icon-16.png',
    '32': 'icon-32.png',
    '48': 'icon-48.png',
    '128': 'icon-128.png',
}

const EXTENSION_PAGES_CSP =
    "script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"

export default defineManifest(({ mode }) => ({
    description:
        'Export your X (Twitter) DMs, including encrypted chats, to HTML, JSON and text. Everything stays on your device.',
    manifest_version: 3,
    minimum_chrome_version: '116',
    name: 'DM Export for X – Save Your Chats',
    version: pkg.version,
    ...(mode === 'production' && {
        content_security_policy: { extension_pages: EXTENSION_PAGES_CSP },
    }),
    action: {
        default_icon: icons,
        default_popup: 'index.html',
        default_title: 'DM Export for X',
    },
    content_scripts: [
        {
            js: ['src/content/content.tsx'],
            matches: ['https://x.com/*'],
            run_at: 'document_idle',
        },
    ],
    host_permissions: ['https://x.com/*'],
    icons,
    permissions: ['activeTab'],
}))
