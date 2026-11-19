/// <reference types="node" />
import { readFileSync } from 'node:fs'

import Color from 'colorjs.io'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

// Vitest stubs CSS imports (even ?raw) to empty strings, so read the sources.
const readCss = (path: string) =>
    readFileSync(new URL(path, import.meta.url), 'utf8')
const THEME_CSS = readCss('./theme.css')
const CHAT_HTML_CSS = readCss('./chat-export/chat-html.css')

const X_BLUE = '#1d9bf0'

// WCAG 2.2 AA: 1.4.3 (text) and 1.4.11 (non-text UI and focus indicators).
const TEXT = 4.5
const LARGE_TEXT = 3
const NON_TEXT = 3

type Tokens = Record<string, string>

function tokensBySelector(css: string): Map<string, Tokens> {
    const scopes = new Map<string, Tokens>()
    postcss.parse(css).walkRules(rule => {
        const key =
            rule.parent?.type === 'atrule'
                ? `@media ${(rule.parent as postcss.AtRule).params} ${rule.selectors.join(',')}`
                : rule.selectors.join(',')
        const tokens = scopes.get(key) ?? {}
        rule.walkDecls(/^--/, decl => {
            tokens[decl.prop.slice(2)] = decl.value
        })
        scopes.set(key, tokens)
    })
    return scopes
}

function scope(css: string, selector: string): Tokens {
    const tokens = tokensBySelector(css).get(selector)
    if (!tokens) throw new Error(`No ${selector} rule`)
    return tokens
}

function contrast(foreground: string, background: string): number {
    return new Color(background).contrastWCAG21(new Color(foreground))
}

// Tailwind's `bg-primary/5` mixes in oklab over the page background.
function tint(color: string, background: string, amount: number): string {
    return new Color(background)
        .mix(new Color(color), amount, { space: 'oklab' })
        .to('srgb')
        .toString({ format: 'hex' })
}

const lightTheme = scope(THEME_CSS, ':root,:host')
const darkTheme = { ...lightTheme, ...scope(THEME_CSS, '.dark') }
const lightChat = scope(CHAT_HTML_CSS, ':root')
const darkChat = {
    ...lightChat,
    ...scope(CHAT_HTML_CSS, '@media (prefers-color-scheme: dark) :root'),
}

describe('brand colour', () => {
    it('is X blue in the popup, focus rings and the exported chat', () => {
        expect(lightTheme.primary).toBe(X_BLUE)
        expect(darkTheme.primary).toBe(X_BLUE)
        expect(lightTheme.ring).toBe(X_BLUE)
        expect(lightChat.own).toBe(X_BLUE)
        expect(darkChat.own).toBe(X_BLUE)
    })
})

describe.each([
    ['light', lightTheme],
    ['dark', darkTheme],
])('popup %s theme contrast', (_, t) => {
    const pairs: [string, string, string, number][] = [
        ['body text', t.foreground!, t.background!, TEXT],
        ['secondary text', t['muted-foreground']!, t.background!, TEXT],
        [
            'secondary text on a selected row',
            t['muted-foreground']!,
            tint(t.primary!, t.background!, 0.1),
            TEXT,
        ],
        ['search placeholder', t['muted-foreground']!, t.secondary!, TEXT],
        [
            'secondary button text',
            t['secondary-foreground']!,
            t.secondary!,
            TEXT,
        ],
        // Primary pills use bold text of at least 18.66px (see button.tsx).
        [
            'primary pill label',
            t['primary-foreground']!,
            t.primary!,
            LARGE_TEXT,
        ],
        ['primary fill against the page', t.primary!, t.background!, NON_TEXT],
        ['checkbox and switch outline', t.input!, t.background!, NON_TEXT],
        ['focus ring', t.ring!, t.background!, NON_TEXT],
    ]

    it.each(pairs)('%s passes AA', (_, fg, bg, minimum) => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(minimum)
    })
})

describe.each([
    ['light', lightChat],
    ['dark', darkChat],
])('chat.html %s contrast', (_, t) => {
    const pairs: [string, string, string][] = [
        ['body text', t.fg!, t.bg!],
        ['dates and timestamps', t.muted!, t.bg!],
        ['received bubble text', t.fg!, t.other!],
        ['sent bubble text', t['own-fg']!, t.own!],
    ]

    it.each(pairs)('%s passes AA', (_, fg, bg) => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(TEXT)
    })
})
