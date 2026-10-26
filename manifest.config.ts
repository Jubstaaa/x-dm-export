import { defineManifest } from '@crxjs/vite-plugin'

import pkg from './package.json' with { type: 'json' }

const icons = {
    '16': 'icon-16.png',
    '32': 'icon-32.png',
    '48': 'icon-48.png',
    '128': 'icon-128.png',
}

export default defineManifest({
    manifest_version: 3,
    name: 'DM Export for X – Save Your Chats',
    version: pkg.version,
    description:
        'Export your X (Twitter) DMs, including encrypted chats, to HTML, JSON and text. Everything stays on your device.',
    minimum_chrome_version: '116',
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
})
