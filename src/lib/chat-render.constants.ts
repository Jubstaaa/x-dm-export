export const CHAT_HTML_STYLE = `
:root{--bg:#fff;--fg:#0f1419;--own:#1d9bf0;--other:#eff3f4;--muted:#536471;--line:#eff3f4}
@media(prefers-color-scheme:dark){:root{--bg:#000;--fg:#e7e9ea;--other:#2f3336;--muted:#71767b;--line:#2f3336}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
header{position:sticky;top:0;z-index:1;display:flex;gap:12px;align-items:center;padding:12px 16px;background:color-mix(in srgb,var(--bg) 85%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
header img{width:40px;height:40px;border-radius:50%}
header h1{margin:0;font-size:17px}
header p{margin:0;color:var(--muted);font-size:13px}
main{max-width:720px;margin:0 auto;padding:16px}
.day,.info{text-align:center;color:var(--muted);font-size:13px;margin:20px 0 8px}
.msg{display:flex;flex-direction:column;margin:4px 0}
.own{align-items:flex-end}.other{align-items:flex-start}
.bubble{max-width:75%;padding:10px 14px;border-radius:22px;background:var(--other);white-space:pre-wrap;overflow-wrap:anywhere}
.own .bubble{background:var(--own);color:#fff;border-bottom-right-radius:6px}
.other .bubble{border-bottom-left-radius:6px}
.bubble img,.bubble video{display:block;max-width:100%;border-radius:14px;margin:-4px -8px 6px}
.reactions{font-size:13px;margin-top:4px}
.meta{color:var(--muted);font-size:12px;margin:3px 8px}
.missing{font-style:italic;opacity:.75}
footer{text-align:center;color:var(--muted);font-size:12px;padding:24px}
`

export const MISSING_MEDIA_LABEL = 'Media not available on this device'

export const MEDIA_OMITTED_LABEL = '<Media omitted>'
