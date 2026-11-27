import Color from 'colorjs.io'
import { readFileSync } from 'node:fs'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const readCss = (path: string) =>
    readFileSync(new URL(path, import.meta.url), 'utf8')
const THEME_CSS = readCss('./theme.css')
const CHAT_HTML_CSS = readCss('./chat-export/chat-html.css')

const X_BLUE = '#1d9bf0'

const TEXT = 4.5
const LARGE_TEXT = 3
const NON_TEXT = 3

type Tokens = Record<string, string>

function contrast(foreground: string, background: string): number {
    return new Color(background).contrastWCAG21(new Color(foreground))
}

function scope(css: string, selector: string): Tokens {
    const tokens = tokensBySelector(css).get(selector)
    if (!tokens) throw new Error(`No ${selector} rule`)
    return tokens
}

function tint(color: string, background: string, amount: number): string {
    return new Color(background)
        .mix(new Color(color), amount, { space: 'oklab' })
        .to('srgb')
        .toString({ format: 'hex' })
}

function token(tokens: Tokens, name: string): string {
    const value = tokens[name]
    if (value === undefined) throw new Error(`No --${name} token`)
    return value
}

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
        ['body text', token(t, 'foreground'), token(t, 'background'), TEXT],
        [
            'secondary text',
            token(t, 'muted-foreground'),
            token(t, 'background'),
            TEXT,
        ],
        [
            'secondary text on a selected row',
            token(t, 'muted-foreground'),
            tint(token(t, 'primary'), token(t, 'background'), 0.1),
            TEXT,
        ],
        [
            'search placeholder',
            token(t, 'muted-foreground'),
            token(t, 'secondary'),
            TEXT,
        ],
        [
            'secondary button text',
            token(t, 'secondary-foreground'),
            token(t, 'secondary'),
            TEXT,
        ],

        [
            'primary pill label',
            token(t, 'primary-foreground'),
            token(t, 'primary'),
            LARGE_TEXT,
        ],
        [
            'primary fill against the page',
            token(t, 'primary'),
            token(t, 'background'),
            NON_TEXT,
        ],
        [
            'checkbox and switch outline',
            token(t, 'input'),
            token(t, 'background'),
            NON_TEXT,
        ],
        ['focus ring', token(t, 'ring'), token(t, 'background'), NON_TEXT],
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
        ['body text', token(t, 'fg'), token(t, 'bg')],
        ['dates and timestamps', token(t, 'muted'), token(t, 'bg')],
        ['received bubble text', token(t, 'fg'), token(t, 'other')],
        ['sent bubble text', token(t, 'own-fg'), token(t, 'own')],
    ]

    it.each(pairs)('%s passes AA', (_, fg, bg) => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(TEXT)
    })
})
